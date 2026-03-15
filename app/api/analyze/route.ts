import { NextRequest, NextResponse } from "next/server";
import { runSingleAnalysis } from "@/lib/analysis/runAnalysis";

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
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json(
        { error: "No file provided. Send a multipart form with field 'file'." },
        { status: 400 }
      );
    }

    const result = await runSingleAnalysis(file);

    if ("error" in result) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json(result.record);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Analysis failed";
    return NextResponse.json(
      { error: "Analysis failed", details: message },
      { status: 502 }
    );
  }
}
