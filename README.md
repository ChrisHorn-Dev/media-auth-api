# Media Authenticity API

Experimental API that classifies an uploaded image as likely AI-generated or likely authentic. I built it to try detection models behind a simple HTTP API and see how they hold up on real vs generated images.

The repo includes a **basic web interface** for testing the flow: upload an image, submit it to the API, and view the score and prediction. It’s a minimal working surface to verify upload → inference → result; there’s no polished product UI yet.

**What it does today:** Accept one image per request (JPEG, PNG, WebP, GIF, max 10 MB). The API hashes the body, checks an in-memory cache, and on cache miss runs the file through Hugging Face’s `dima806/ai_vs_real_image_detection` model. Response is `prediction` (`likely_ai_generated` | `likely_authentic`), `confidence` (0–1), and `model`. Same file bytes = cache hit, no second inference.

**How it works:** Client sends the file to `POST /api/analyze`. The Next.js route validates type and size, hashes the buffer (SHA256), and looks up the hash in a result cache. If found, it returns the cached result. If not, it calls the Hugging Face inference client with the image blob; the model returns REAL/FAKE scores, which we map to the response shape and cache by hash.

**Stack:** Next.js (App Router), React, TypeScript, Tailwind. One API route. `@huggingface/inference` for classification. In-memory cache (no Redis).

## API

```http
POST /api/analyze
Content-Type: multipart/form-data
file: <image binary>
```

**200** — example:

```json
{
  "prediction": "likely_ai_generated",
  "confidence": 0.87,
  "model": "ai-media-detector-v1",
  "cached": false
}
```

`cached` is `true` when the result was served from cache, `false` when inference was run.

**Errors:** `400` (no file, bad type, or >10 MB), `500` (missing `HUGGINGFACE_API_KEY`), `502` (inference failed; body has `error` and `details`).

## Run locally

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

Put `HUGGINGFACE_API_KEY=<token>` in `.env.local`. Token needs Inference access ([create one](https://huggingface.co/settings/tokens)).

## Current capabilities

- Single image upload and analysis via one API route.
- File hash caching: identical uploads return the cached result; responses include a `cached` boolean. Entries expire after a TTL (default 5 minutes). Cache is in-memory and resets on process restart.
- Basic test page: upload, submit, view result. When a result is served from cache, the UI shows a short “Served from cache” line.

## Limitations

Image only. One file per request. No batch, no rate limiting, no auth. Model is trained on older data. Cache is in-memory, TTL-based (default 5 min), and cleared on restart. UI is minimal—for testing the flow, not a finished product.

## Next steps

I’d like to add audio support when there’s a suitable model, a batch endpoint, optional API keys for rate limiting, and to re-check the detector against newer generators.

## License

MIT
