import { NextRequest, NextResponse } from "next/server";

function getRequiredKeys(): string[] {
  const raw = process.env.API_KEYS;
  if (!raw?.trim()) return [];
  return raw.split(",").map((k) => k.trim()).filter(Boolean);
}

function isRequireApiKeyEnabled(): boolean {
  const v = process.env.REQUIRE_API_KEY;
  return v === "true" || v === "1" || v === "yes";
}

export function getApiKeyFromRequest(request: NextRequest): string | null {
  const auth = request.headers.get("authorization");
  if (auth?.startsWith("Bearer ")) {
    return auth.slice(7).trim() || null;
  }
  const q = request.nextUrl.searchParams.get("api_key");
  if (q?.trim()) return q.trim();
  return null;
}

export function isApiKeyValid(key: string | null): boolean {
  if (!key) return false;
  const allowed = getRequiredKeys();
  if (allowed.length === 0) return false;
  return allowed.includes(key);
}

export function requireApiKey(request: NextRequest): NextResponse | null {
  if (!isRequireApiKeyEnabled()) return null;
  const keys = getRequiredKeys();
  if (keys.length === 0) return null;
  const key = getApiKeyFromRequest(request);
  if (isApiKeyValid(key)) return null;
  return NextResponse.json(
    { error: "Missing or invalid API key. Use Authorization: Bearer <key> or api_key query parameter." },
    { status: 401 }
  );
}
