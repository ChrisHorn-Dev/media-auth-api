import { NextRequest, NextResponse } from "next/server";
import { runBatchAnalysis } from "@/lib/analysis/runAnalysis";

const MAX_BATCH_FILES = 5;

export async function POST(request: NextRequest) {
  try {
    if (!process.env.HUGGINGFACE_API_KEY?.length) {
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
        { error: `Too many files. Maximum is ${MAX_BATCH_FILES} per request.` },
        { status: 400 }
      );
    }

    const { results } = await runBatchAnalysis(validFiles);
    return NextResponse.json({ results });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Batch request failed";
    return NextResponse.json(
      { error: "Batch request failed", details: message },
      { status: 502 }
    );
  }
}
