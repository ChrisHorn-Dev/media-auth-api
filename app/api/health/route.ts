import { NextResponse } from "next/server";

export async function GET() {
  const hasSigningSecret = !!process.env.SIGNING_SECRET && process.env.SIGNING_SECRET.length > 0;
  const hasHuggingFaceKey = !!process.env.HUGGINGFACE_API_KEY && process.env.HUGGINGFACE_API_KEY.length > 0;

  const ok = hasSigningSecret && hasHuggingFaceKey;

  const body = {
    ok,
    checks: {
      signingSecret: hasSigningSecret,
      huggingFaceApiKey: hasHuggingFaceKey,
    },
  };

  if (!ok) {
    return NextResponse.json(body, { status: 500 });
  }
  return NextResponse.json(body, { status: 200 });
}

