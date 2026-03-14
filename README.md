# Media Authenticity API

This project explores a lightweight API for detecting whether media may be AI-generated. As generative AI improves, distinguishing synthetic from authentic media becomes increasingly important for developers, platforms, and researchers.

## Overview

Media Authenticity API is an experimental service that accepts image (and optionally audio) uploads, runs them through a pretrained detection model via the HuggingFace Inference API, and returns an authenticity score and prediction. It is built as a small SaaS-style demo with a clean API and minimal web UI.

## Motivation

- **Trust and provenance**: Help applications and users gauge whether content is likely human-created or AI-generated.
- **API-first design**: A simple REST endpoint makes it easy to integrate detection into pipelines, moderation tools, or research workflows.
- **Experiment-friendly**: Straightforward stack (Next.js, TypeScript, HuggingFace) suitable for iteration and extension.

## Features

- **File upload**: Drag-and-drop or click to upload images (JPEG, PNG, WebP, GIF).
- **Analysis endpoint**: `POST /api/analyze` with multipart form data.
- **AI integration**: Uses a HuggingFace image-classification model (real vs AI-generated).
- **Result UI**: Displays authenticity score, prediction label, and confidence.
- **Error handling**: Clear responses for unsupported file types, file too large, and model failures.

## Tech Stack

| Layer        | Technology                |
| ------------ | ------------------------- |
| Frontend     | Next.js (App Router), TypeScript, TailwindCSS |
| Backend      | Next.js API routes        |
| AI           | HuggingFace Inference API (image detection model) |

## API Example

**Request**

```http
POST /api/analyze
Content-Type: multipart/form-data

file: <binary image>
```

**Success response (200)**

```json
{
  "prediction": "likely_ai_generated",
  "confidence": 0.87,
  "model": "ai-media-detector-v1"
}
```

**Error responses**

- `400` — No file, unsupported file type, or file too large (max 10 MB).
- `500` — Missing `HUGGINGFACE_API_KEY`.
- `502` — Model or inference failure.

## Setup

1. Clone the repo and install dependencies:

   ```bash
   npm install
   ```

2. Create a `.env.local` file and add your HuggingFace API token:

   ```
   HUGGINGFACE_API_KEY=your_token_here
   ```

   Create a token at [HuggingFace → Settings → Access Tokens](https://huggingface.co/settings/tokens).

3. Run the dev server:

   ```bash
   npm run dev
   ```

4. Open [http://localhost:3000](http://localhost:3000), upload an image, and view the result.

## Screenshot

<!-- Add a screenshot of the upload interface and result card here -->

*Screenshot placeholder: upload screen and result card.*

## Future Improvements

- Support for **audio** uploads and an audio-capable detection model.
- **Caching** of results by file hash to avoid repeated inference.
- **Rate limiting** and optional API keys for production use.
- **Batch endpoint** for analyzing multiple files in one request.
- **Webhooks or async jobs** for large or long-running analyses.
- Retraining or fine-tuning the detector on newer generative models (e.g. Flux, DALL·E 3, Stable Diffusion 3) to reduce concept drift.

## License

MIT.
