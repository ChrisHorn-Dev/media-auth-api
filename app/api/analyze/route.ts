import { NextRequest, NextResponse } from "next/server";
import { analyzeImage } from "@/lib/aiDetector";

const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB
const ALLOWED_IMAGE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
];

export async function POST(request: NextRequest) {
  try {
    const apiKey = process.env.HUGGINGFACE_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "Server configuration error: HUGGINGFACE_API_KEY not set" },
        { status: 500 }
      );
    }

    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json(
        { error: "No file provided. Use multipart form field 'file'." },
        { status: 400 }
      );
    }

    if (file.size > MAX_FILE_SIZE_BYTES) {
      return NextResponse.json(
        {
          error: `File too large. Maximum size is ${MAX_FILE_SIZE_BYTES / 1024 / 1024} MB.`,
        },
        { status: 400 }
      );
    }

    const type = file.type?.toLowerCase() ?? "";
    if (!ALLOWED_IMAGE_TYPES.includes(type)) {
      return NextResponse.json(
        {
          error: `Unsupported file type: ${type || "unknown"}. Allowed: ${ALLOWED_IMAGE_TYPES.join(", ")}.`,
        },
        { status: 400 }
      );
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const result = await analyzeImage(buffer, apiKey);
    return NextResponse.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Analysis failed";
    return NextResponse.json(
      { error: "Model failure", details: message },
      { status: 502 }
    );
  }
}
