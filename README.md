# Media Authenticity API

API that analyzes uploaded images for authenticity (likely synthetic vs likely authentic), signs results with HMAC-SHA256, and exposes a verification endpoint so clients can confirm a result came from this service and was not tampered with.

The project started as a single-image analysis API with file-hash caching; it added batch uploads, then signed responses (analysis_id, timestamp, signature) and `POST /api/verify`. The codebase was refactored into a detector-based, media-aware layout: routes delegate to an orchestrator and a detector registry, and responses use a structured record (verdict, detectors, media) instead of a flat payload. Only image analysis is implemented; one Hugging Face–based detector is registered. Audio and video exist in types and validation layout but have no detectors.

**Implemented today:** Single and batch image analysis (JPEG, PNG, WebP, GIF, max 10 MB), file-hash caching (in-memory, TTL 5 min), signed responses, and `POST /api/verify` for payload integrity. The UI is a minimal test page.

**Flow:** Validate file → hash → cache or run detector → build record → sign canonical payload (`analysis_id`, `timestamp`, `prediction`, `confidence`, `model`) → return. Verify recomputes HMAC and uses constant-time compare.

**Architecture:** Routes call `lib/analysis/runAnalysis` (input build, orchestrator, sign). Orchestrator uses `lib/cache/resultCache`, `lib/detectors/registry`, and the selected detector; `lib/security/signature` for sign/verify; `lib/media` for types and validation. `lib/detectors/audio` and `lib/detectors/video` are stubs (no detectors).

## API

**Single:** `POST /api/analyze` — `multipart/form-data`, field `file`. Returns a signed analysis record: `analysis_id`, `timestamp`, `media`, `request`, `verdict`, `detectors`, `cached`, `signature`.

**Batch:** `POST /api/analyze/batch` — field `files[]`, max 5. Returns `{ results: [ { filename, record } | { filename, error } ] }`.

**Verify:** `POST /api/verify` — JSON body: `analysis_id`, `timestamp`, `prediction`, `confidence`, `model`, `signature`. Response: `{ valid: true }` or `{ valid: false, reason }`. Build the payload from `verdict.prediction`, `verdict.confidence`, and `detectors[0].model` (or `verdict.detectorId`) on the analysis response.

## Run locally

```bash
npm install
npm run dev
```

Open http://localhost:3000.

**Env (`.env.local`):** `HUGGINGFACE_API_KEY` (Inference API token), `SIGNING_SECRET` (long random string). Both required; missing values return 500 with a clear message.

## Stack

Next.js (App Router), React, TypeScript, Tailwind. `@huggingface/inference` for the image detector. In-memory cache; no Redis or database.

## Limitations

Image only. No rate limiting or auth. Model is trained on older data. Cache is process-local and TTL-based. Signing is HMAC with a shared secret, not PKI. Audio and video have no detectors; only type and validation structure exist for them.

## License

MIT
