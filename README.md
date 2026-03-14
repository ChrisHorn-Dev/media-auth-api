# Media Authenticity API

Experimental API that classifies an uploaded image as likely AI-generated or likely authentic. Built to try detection models behind a simple HTTP API and see how they hold up on real vs generated images.

The repo includes a **lightweight web interface** for testing: upload one or more images, submit to the API, and view results. It’s a minimal testing surface for the upload → inference → result flow, not a product UI.

## What it does today

- **Single image:** `POST /api/analyze` with one file (JPEG, PNG, WebP, GIF, max 10 MB). Response includes prediction, confidence, model, plus `analysis_id`, `timestamp`, `signature`, and `cached`.
- **Batch:** `POST /api/analyze/batch` with up to 5 files. Same validation; each item in the response is either a full result (with `analysis_id`, `timestamp`, `signature`, `cached`) or an error entry for that file.
- **Caching:** Request body is hashed (SHA256). Same bytes = cache hit; response is identical except `cached: true` and a new `analysis_id`/`timestamp`/`signature` generated at response time. Cache is in-memory, TTL-based (default 5 minutes), cleared on restart.
- **Signing:** Every successful result is signed with HMAC-SHA256 using a server-side secret. The signed fields are `analysis_id`, `timestamp`, `prediction`, `confidence`, and `model`. Clients can send that payload plus `signature` to `POST /api/verify` to check that the result was issued by this service and not tampered with.
- **Verification:** `POST /api/verify` accepts a JSON body with the result fields and `signature`, recomputes the expected signature, and returns `{ "valid": true }` or `{ "valid": false, "reason": "…" }`. No database; this is payload-integrity verification only.

## How it works

1. **Analyze:** Client sends the file(s) to the analyze route. The route validates type and size, hashes the buffer, and checks the result cache. On miss, it runs the image through Hugging Face’s `dima806/ai_vs_real_image_detection` model and caches by hash. Before returning, the server adds `analysis_id` (UUID), `timestamp` (ISO 8601), and signs the payload with HMAC-SHA256; the signature is included in the response.
2. **Verify:** Client sends the result payload (including `signature`) to `POST /api/verify`. The server recomputes the HMAC over the same canonical string and compares. Same secret, same payload → `valid: true`; otherwise `valid: false`.

Signing uses a canonical string of the signed fields (order and format are fixed) so that verification is deterministic. This is an experimental integrity mechanism, not full PKI.

## API

### Single analysis

```http
POST /api/analyze
Content-Type: multipart/form-data
file: <image binary>
```

**200** — example:

```json
{
  "analysis_id": "550e8400-e29b-41d4-a716-446655440000",
  "timestamp": "2025-03-14T12:00:00.000Z",
  "prediction": "likely_ai_generated",
  "confidence": 0.87,
  "model": "ai-media-detector-v1",
  "signature": "a1b2c3…",
  "cached": false
}
```

`cached` is `true` when the result was served from cache, `false` when inference was run. `analysis_id`, `timestamp`, and `signature` are always present on success and are generated at response time (including for cache hits).

**Errors:** `400` (no file, bad type, or >10 MB), `500` (missing `HUGGINGFACE_API_KEY` or `SIGNING_SECRET`), `502` (inference failed; body has `error` and `details`).

### Batch analysis

```http
POST /api/analyze/batch
Content-Type: multipart/form-data
files[]: <image binary> (repeat for each file, max 5)
```

Same validation as single-image. Per-file errors are returned in the result entry; the request does not fail as a whole.

**200** — example:

```json
{
  "results": [
    {
      "filename": "example.png",
      "analysis_id": "550e8400-e29b-41d4-a716-446655440001",
      "timestamp": "2025-03-14T12:00:01.000Z",
      "prediction": "likely_ai_generated",
      "confidence": 0.91,
      "model": "ai-media-detector-v1",
      "signature": "d4e5f6…",
      "cached": false
    },
    {
      "filename": "bad.txt",
      "error": "Unsupported type: text/plain. Use JPEG, PNG, WebP, or GIF."
    }
  ]
}
```

Maximum 5 files per request.

### Verification

```http
POST /api/verify
Content-Type: application/json
```

**Body** — fields from an analysis result, including the signature:

```json
{
  "analysis_id": "550e8400-e29b-41d4-a716-446655440000",
  "prediction": "likely_ai_generated",
  "confidence": 0.87,
  "model": "ai-media-detector-v1",
  "timestamp": "2025-03-14T12:00:00.000Z",
  "signature": "a1b2c3…"
}
```

**200** — valid:

```json
{ "valid": true }
```

**200** — invalid (tampered or wrong signature):

```json
{ "valid": false, "reason": "Signature mismatch" }
```

**400** — malformed body or missing/invalid fields.

**500** — `SIGNING_SECRET` not set.

## Run locally

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Environment variables

Put these in `.env.local`:

| Variable | Required | Description |
|----------|----------|-------------|
| `HUGGINGFACE_API_KEY` | Yes | Token with Inference API access. [Create one](https://huggingface.co/settings/tokens). |
| `SIGNING_SECRET` | Yes | Secret used to sign and verify results. Use a long random string (e.g. 32+ characters). |

Copy `.env.example` and fill in both values. If either is missing or empty, the analyze and verify routes return 500 with a clear error.

## Stack

Next.js (App Router), React, TypeScript, Tailwind. API routes for single analysis, batch analysis, and verification. `@huggingface/inference` for classification. In-memory result cache; no Redis, no database.

## Limitations

Image only. Single request: one file; batch: up to 5 files. No rate limiting, no auth. Model is trained on older data. Cache is in-memory, TTL-based (default 5 min), and cleared on restart. Signing is HMAC with a shared secret—suitable for verifying that a result came from this service and wasn’t modified; not a replacement for public-key attestation. UI is minimal and intended for testing the flow only.

## Next steps

Possible directions: audio support when a suitable model exists, optional API keys for rate limiting, re-evaluating the detector against newer generators, and exploring stronger attestation if the use case demands it.

## License

MIT
