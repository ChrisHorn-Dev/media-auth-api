# Media Authenticity API

API that analyzes uploaded images for authenticity (likely synthetic vs likely authentic), signs results with HMAC-SHA256, and exposes a verification endpoint so clients can confirm a result came from this service and was not tampered with.

The project started as a single-image analysis API with file-hash caching; it added batch uploads, then signed responses (analysis_id, timestamp, signature) and `POST /api/verify`. The codebase was refactored into a detector-based, media-aware layout: routes delegate to an orchestrator and a detector registry, and responses use a structured record (verdict, detectors, media) instead of a flat payload. Only image analysis is implemented; two Hugging Face–based detectors are registered. Audio and video exist in types and validation layout but have no detectors.

Single and batch image analysis (JPEG, PNG, WebP, GIF, max 10 MB), file-hash caching (in-memory or optional file-backed, TTL 5 min), signed responses, `POST /api/verify`, and a minimal test UI.

**Flow:** Validate file → hash → cache or run detector → build record → sign canonical payload (`analysis_id`, `timestamp`, `prediction`, `confidence`, `model`) → return. Verify recomputes HMAC and uses constant-time compare.

**Architecture:** Routes call `lib/analysis/runAnalysis` (input build, orchestrator, sign). Orchestrator uses `lib/cache/resultCache`, `lib/detectors/registry`, and the selected detector; `lib/security/signature` for sign/verify; `lib/media` for types and validation. `lib/detectors/audio` and `lib/detectors/video` are stubs (no detectors).

## API

**Single:** `POST /api/analyze` — `multipart/form-data`, field `file`. Optional `mode`: `single` (one detector) or `ensemble` (run all compatible image detectors and aggregate verdict). Optional `detector_id`: `huggingface-image-v1` or `huggingface-image-v2` (for single mode). Invalid `detector_id` returns 400 with a clear message. Returns a signed analysis record: `analysis_id`, `timestamp`, `media`, `request` (includes `mode`), `verdict`, `detectors`, `cached`, `signature`.

**Batch:** `POST /api/analyze/batch` — field `files[]`, max 5. Same optional `mode` and `detector_id`. Returns `{ results: [ { filename, record } | { filename, error } ] }`.

**Image validation:** Max 10 MB; dimensions between 32 and 4096 px per side. Unsupported format or dimensions return 400 with a clear message.

**Verify:** `POST /api/verify` — JSON body: `analysis_id`, `timestamp`, `prediction`, `confidence`, `model`, `signature`. Response: `{ valid: true }` or `{ valid: false, reason }`. Build the payload from the analysis response as in the example below.

**Optional API key:** Set `REQUIRE_API_KEY=true` and `API_KEYS=<key1>,<key2>`. Then all `/api/*` routes require `Authorization: Bearer <key>` or `?api_key=<key>`. Missing or invalid key returns `401` with `{ error: "..." }`.

**Rate limiting:** In-memory per IP (or per API key when provided). Default 60 requests per minute. Over limit returns `429` with `Retry-After` and `{ error: "Too many requests", details: "..." }`. Configure with `RATE_LIMIT_REQUESTS_PER_MINUTE`.

**Errors:** All error responses use `{ error: string }` and may include `details: string`. Success responses use the shapes above.

### Verification example

After calling `POST /api/analyze`, build the verify request from the returned record. The signed payload uses `analysis_id`, `timestamp`, `prediction`, `confidence`, `model`, and `signature`:

```bash
# 1. Analyze an image (response is the signed record)
ANALYSIS=$(curl -s -X POST http://localhost:3000/api/analyze -F "file=@image.jpg")

# 2. Extract fields and call verify (e.g. with jq)
curl -s -X POST http://localhost:3000/api/verify \
  -H "Content-Type: application/json" \
  -d "$(echo "$ANALYSIS" | jq '{ analysis_id, timestamp, prediction: .verdict.prediction, confidence: .verdict.confidence, model: (.detectors[0].model // .verdict.detectorId), signature }')"
```

Example verify request body. The `model` value comes from the analysis response (`verdict.detectorId` or `detectors[0].model`). For ensemble results, `model` is `"ensemble"`.

```json
{
  "analysis_id": "abc-123",
  "timestamp": "2025-03-14T12:00:00.000Z",
  "prediction": "likely_authentic",
  "confidence": 0.92,
  "model": "ai-media-detector-v1",
  "signature": "a1b2c3..."
}
```

Response: `{ "valid": true }` or `{ "valid": false, "reason": "Signature mismatch" }`.

## Run locally

```bash
npm install
npm run dev
```

Open http://localhost:3000.

### Environment variables

| Variable | Required | Description |
|----------|----------|-------------|
| `HUGGINGFACE_API_KEY` | Yes | Inference API token. [Create one](https://huggingface.co/settings/tokens). |
| `SIGNING_SECRET` | Yes | Long random string (e.g. 32+ chars) for signing and verifying results. |
| `REQUIRE_API_KEY` | No | Set to `true` to require an API key on all `/api/*` routes. |
| `API_KEYS` | When key required | Comma-separated list of valid keys. Clients send `Authorization: Bearer <key>` or `?api_key=<key>`. |
| `RATE_LIMIT_REQUESTS_PER_MINUTE` | No | Max requests per minute per IP (or per key). Default 60. |
| `CACHE_DIR` or `CACHE_PERSISTENCE_PATH` | No | If set, cache is stored on disk under this path (TTL 5 min). Restarts reuse the cache. Default when unset: in-memory only. |

Put these in `.env.local`. Missing required values return 500 with a clear message.

### Detectors

| ID | Name | Model |
|----|------|-------|
| `huggingface-image-v1` | Hugging Face image authenticity | `dima806/ai_vs_real_image_detection` |
| `huggingface-image-v2` | Hugging Face image (alternate) | `capcheck/ai-image-detection` |

**Mode:** `single` (default) runs one detector (chosen by `detector_id` or first compatible). `ensemble` runs all compatible image detectors and aggregates: same prediction → average confidence; differing predictions → conservative verdict (prefer `likely_ai_generated`). Response `verdict.strategy` is `"single"` or `"ensemble"`; `detectors` array holds per-detector results. If `detector_id` is omitted in single mode, the first compatible detector is used. Invalid `detector_id` returns 400. Both models are trained for Real vs Fake/AI-generated classification; performance on very new generators may vary.

### Logging

Each successful analysis logs one JSON line (no PII) to stdout: `event`, `analysis_id`, `mediaType`, `cacheHit`, `detectorId`, `latencyMs`. Use for debugging and tuning cache/TTL.

## Stack

Next.js (App Router), React, TypeScript, Tailwind. `@huggingface/inference` for the image detector. Cache is in-memory by default; optional file-based persistence via `CACHE_DIR`. No Redis or database.

## Limitations

Image only. Optional API key and in-memory rate limiting; no full auth system. Detectors are trained on older data; consider re-evaluating or swapping models for newer AI generators. Cache is process-local and TTL-based (optional file persistence when `CACHE_DIR` is set). Signing is HMAC with a shared secret, not PKI. Audio and video have no detectors; only type and validation structure exist for them.

## License

MIT
