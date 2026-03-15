import { NextRequest, NextResponse } from "next/server";
import {
  verifyPayload,
  type SignedPayload,
} from "@/lib/security/signature";

export async function POST(request: NextRequest) {
  try {
    if (!process.env.SIGNING_SECRET?.length) {
      return NextResponse.json(
        { error: "SIGNING_SECRET is not set or empty" },
        { status: 500 }
      );
    }

    const body = await request.json();
    const {
      analysis_id,
      prediction,
      confidence,
      model,
      timestamp,
      signature,
    } = body;

    if (
      typeof analysis_id !== "string" ||
      typeof prediction !== "string" ||
      typeof model !== "string" ||
      typeof timestamp !== "string" ||
      typeof signature !== "string" ||
      typeof confidence !== "number" ||
      !Number.isFinite(confidence)
    ) {
      return NextResponse.json({
        valid: false,
        reason: "Missing or invalid fields: analysis_id, prediction, confidence, model, timestamp, signature",
      });
    }

    const payload: SignedPayload = {
      analysis_id,
      prediction,
      confidence,
      model,
      timestamp,
    };

    const valid = verifyPayload(payload, signature);
    if (valid) {
      return NextResponse.json({ valid: true });
    }
    return NextResponse.json({
      valid: false,
      reason: "Signature mismatch",
    });
  } catch {
    return NextResponse.json(
      { error: "Invalid request body" },
      { status: 400 }
    );
  }
}
