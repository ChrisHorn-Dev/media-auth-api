import { NextRequest, NextResponse } from "next/server";
import { analyzeImage } from "@/lib/aiDetector";
import { sha256Hex } from "@/lib/fileHash";
import * as resultCache from "@/lib/resultCache";
import { createSignedResult, type SignedAnalysisResponse } from "@/lib/signature";
import { validateImageFile } from "@/lib/validateImage";

const MAX_BATCH_FILES = 5;

type BatchResultItem =
  | ({ filename: string } & SignedAnalysisResponse)
  | { filename: string; error: string };

export async function POST(request: NextRequest) {
  try {
    const apiKey = process.env.HUGGINGFACE_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "HUGGINGFACE_API_KEY is not set" },
        { status: 500 }
      );
    }
    if (!process.env.SIGNING_SECRET?.length) {
      return NextResponse.json(
        { error: "SIGNING_SECRET is not set or empty" },
        { status: 500 }
      );
    }

    const formData = await request.formData();
    const files = formData.getAll("files[]") as File[];

    const validFiles = files.filter((f): f is File => f instanceof File);
    if (validFiles.length === 0) {
      return NextResponse.json(
        { error: "No files provided. Send a multipart form with field 'files[]'." },
        { status: 400 }
      );
    }
    if (validFiles.length > MAX_BATCH_FILES) {
      return NextResponse.json(
        {
          error: `Too many files. Maximum is ${MAX_BATCH_FILES} per request.`,
        },
        { status: 400 }
      );
    }

    const results: BatchResultItem[] = [];

    for (const file of validFiles) {
      const filename = file.name || "unknown";
      const validationError = validateImageFile(file);
      if (validationError) {
        results.push({ filename, error: validationError });
        continue;
      }

      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      const type = file.type?.toLowerCase() ?? "";
      const hash = sha256Hex(buffer);

      const cached = resultCache.get(hash);
      if (cached) {
        const signed = createSignedResult(cached, true);
        results.push({ filename, ...signed });
        continue;
      }

      try {
        const result = await analyzeImage(buffer, apiKey, type);
        resultCache.set(hash, result);
        const signed = createSignedResult(result, false);
        results.push({ filename, ...signed });
      } catch (err) {
        const message = err instanceof Error ? err.message : "Inference failed";
        results.push({ filename, error: message });
      }
    }

    return NextResponse.json({ results });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Batch request failed";
    return NextResponse.json(
      { error: "Batch request failed", details: message },
      { status: 502 }
    );
  }
}
