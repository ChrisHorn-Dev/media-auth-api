import { NextRequest, NextResponse } from "next/server";
import { runSingleAnalysis } from "@/lib/analysis/runAnalysis";
import { getApiKeyFromRequest, requireApiKey } from "@/lib/auth/apiKey";
import { getImageDetectorIds } from "@/lib/detectors/registry";
import { checkRateLimit, getRateLimitIdentifier } from "@/lib/rateLimit/rateLimit";

export async function POST(request: NextRequest) {
  const authError = requireApiKey(request);
  if (authError) return authError;

  const identifier = getRateLimitIdentifier(request, getApiKeyFromRequest(request));
  const rate = checkRateLimit(identifier);
  if (!rate.allowed) {
    const headers: HeadersInit = {};
    if (rate.retryAfterSeconds != null) headers["Retry-After"] = String(rate.retryAfterSeconds);
    return NextResponse.json(
      { error: "Too many requests", details: "Rate limit exceeded. Try again later." },
      { status: 429, headers }
    );
  }

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
    const clientDetectorId =
      (formData.get("detector_id") as string)?.trim() ||
      (request.nextUrl.searchParams.get("detector_id") as string)?.trim() ||
      undefined;
    const fromEnv = clientDetectorId === undefined || clientDetectorId === "";
    let detectorId = fromEnv
      ? process.env.DEFAULT_IMAGE_DETECTOR_ID?.trim() || undefined
      : clientDetectorId;

    const validIds = getImageDetectorIds();
    if (detectorId && !validIds.includes(detectorId)) {
      if (fromEnv) {
        return NextResponse.json(
          {
            error: "Server configuration error",
            details: "DEFAULT_IMAGE_DETECTOR_ID does not match any registered detector",
          },
          { status: 500 }
        );
      }
      return NextResponse.json(
        {
          error: "Invalid detector_id",
          details: `Supported detectors: ${validIds.join(", ")}`,
        },
        { status: 400 }
      );
    }

    const modeParam = (formData.get("mode") as string) || request.nextUrl.searchParams.get("mode") || "";
    const mode = modeParam === "ensemble" ? "ensemble" : "single";

    if (!file) {
      return NextResponse.json(
        { error: "No file provided. Send a multipart form with field 'file'." },
        { status: 400 }
      );
    }

    const result = await runSingleAnalysis(file, { detectorId, mode });

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
