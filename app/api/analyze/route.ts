import { NextRequest, NextResponse } from "next/server";
import { analyzeImage } from "@/lib/aiDetector";
import { sha256Hex } from "@/lib/fileHash";
import * as resultCache from "@/lib/resultCache";
import { createSignedResult } from "@/lib/signature";
import { validateImageFile } from "@/lib/validateImage";

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
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json(
        { error: "No file provided. Send a multipart form with field 'file'." },
        { status: 400 }
      );
    }

    const validationError = validateImageFile(file);
    if (validationError) {
      return NextResponse.json({ error: validationError }, { status: 400 });
    }

    const type = file.type?.toLowerCase() ?? "";

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const hash = sha256Hex(buffer);
    const cached = resultCache.get(hash);
    if (cached) {
      const signed = createSignedResult(cached, true);
      return NextResponse.json(signed);
    }

    const result = await analyzeImage(buffer, apiKey, type);
    resultCache.set(hash, result);
    const signed = createSignedResult(result, false);
    return NextResponse.json(signed);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Inference failed";
    return NextResponse.json(
      { error: "Inference failed", details: message },
      { status: 502 }
    );
  }
}
