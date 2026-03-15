"use client";

import { useState } from "react";
import { UploadCard } from "@/components/UploadCard";
import { ResultCard, type AnalysisResult } from "@/components/ResultCard";
import {
  BatchResultList,
  type BatchResultItem,
} from "@/components/BatchResultList";

type Status = "idle" | "uploading" | "done" | "error";

type ImageMode = "single" | "ensemble";
type DetectorChoice = "" | "huggingface-image-v1" | "huggingface-image-v2";

export default function Home() {
  const [status, setStatus] = useState<Status>("idle");
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [batchResults, setBatchResults] = useState<BatchResultItem[] | null>(
    null
  );
  const [error, setError] = useState<string | null>(null);
  const [imageMode, setImageMode] = useState<ImageMode>("single");
  const [detectorId, setDetectorId] = useState<DetectorChoice>("");
  const [apiKey, setApiKey] = useState("");

  const authHeaders = (): HeadersInit => {
    const key = apiKey.trim();
    return key ? { Authorization: `Bearer ${key}` } : {};
  };

  const handleUpload = async (files: File[]) => {
    setError(null);
    setResult(null);
    setBatchResults(null);
    setStatus("uploading");

    if (files.length === 1) {
      const formData = new FormData();
      formData.set("file", files[0]);
      formData.set("mode", imageMode);
      if (imageMode === "single" && detectorId) formData.set("detector_id", detectorId);
      try {
        const res = await fetch("/api/analyze", {
          method: "POST",
          headers: authHeaders(),
          body: formData,
        });
        const data = (await res.json()) as
          | { error?: string; details?: string }
          | AnalysisResult;

        if (!res.ok) {
          const err = data as { error?: string; details?: string };
          const detail = err.details ? ` — ${err.details}` : "";
          setError(`${err.error || `Request failed (${res.status})`}${detail}`);
          setStatus("error");
          return;
        }
        setResult(data as AnalysisResult);
        setStatus("done");
      } catch (e) {
        setError(e instanceof Error ? e.message : "Network error");
        setStatus("error");
      }
      return;
    }

    const formData = new FormData();
    for (const file of files) {
      formData.append("files[]", file);
    }
    formData.set("mode", imageMode);
    if (imageMode === "single" && detectorId) formData.set("detector_id", detectorId);
    try {
      const res = await fetch("/api/analyze/batch", {
        method: "POST",
        headers: authHeaders(),
        body: formData,
      });
      const data = (await res.json()) as
        | { error?: string; details?: string }
        | { results: BatchResultItem[] };

      if (!res.ok) {
        const err = data as { error?: string; details?: string };
        const detail = err.details ? ` — ${err.details}` : "";
        setError(`${err.error || `Request failed (${res.status})`}${detail}`);
        setStatus("error");
        return;
      }
      setBatchResults((data as { results: BatchResultItem[] }).results);
      setStatus("done");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Network error");
      setStatus("error");
    }
  };

  const isUploading = status === "uploading";
  const hasResults = (result != null) || (batchResults != null && batchResults.length > 0);
  const showEmptyState = !hasResults && !isUploading;

  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-900">
      <main className="mx-auto max-w-2xl px-4 py-12 sm:py-16">
        <header className="mb-8 text-center">
          <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 sm:text-3xl">
            Media Authenticity API
          </h1>
          <p className="mt-2 text-sm text-zinc-600">
            Test image analysis — upload images to classify as likely AI-generated or authentic.
          </p>
        </header>

        <div className="space-y-8">
          <section className="flex flex-col items-center" aria-labelledby="upload-heading">
            <h2 id="upload-heading" className="sr-only">
              Upload
            </h2>
            <div className="mb-4 flex w-full max-w-lg flex-wrap items-center gap-4 rounded-lg border border-zinc-200 bg-white px-4 py-3">
              <span className="text-xs font-medium text-zinc-500">Mode</span>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setImageMode("single")}
                  className={`rounded px-3 py-1.5 text-sm ${imageMode === "single" ? "bg-zinc-200 font-medium text-zinc-900" : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200"}`}
                >
                  Single
                </button>
                <button
                  type="button"
                  onClick={() => setImageMode("ensemble")}
                  className={`rounded px-3 py-1.5 text-sm ${imageMode === "ensemble" ? "bg-zinc-200 font-medium text-zinc-900" : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200"}`}
                >
                  Ensemble
                </button>
              </div>
              {imageMode === "single" && (
                <>
                  <span className="text-xs font-medium text-zinc-500">Detector</span>
                  <select
                    value={detectorId}
                    onChange={(e) => setDetectorId(e.target.value as DetectorChoice)}
                    className="rounded border border-zinc-300 bg-white px-3 py-1.5 text-sm text-zinc-700"
                    aria-label="Detector"
                  >
                    <option value="">Default</option>
                    <option value="huggingface-image-v1">v1</option>
                    <option value="huggingface-image-v2">v2</option>
                  </select>
                </>
              )}
              <span className="text-xs font-medium text-zinc-500">API key</span>
              <input
                type="password"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="Optional"
                className="min-w-0 max-w-[12rem] rounded border border-zinc-300 bg-white px-3 py-1.5 text-sm text-zinc-700 placeholder:text-zinc-400"
                aria-label="API key (optional)"
                autoComplete="off"
              />
            </div>
            <UploadCard onUpload={handleUpload} disabled={isUploading} />
          </section>

          <section
            className="flex flex-col items-center"
            aria-labelledby="results-heading"
            aria-busy={isUploading}
          >
            <h2 id="results-heading" className="sr-only">
              Results
            </h2>

            {isUploading && (
              <div
                className="flex w-full max-w-lg items-center justify-center gap-2 rounded-xl border border-zinc-200 bg-white py-10 text-zinc-600"
                role="status"
                aria-live="polite"
              >
                <span
                  className="h-5 w-5 flex-shrink-0 rounded-full border-2 border-zinc-400 border-t-transparent animate-spin"
                  aria-hidden
                />
                <span className="text-sm font-medium">Analyzing images…</span>
              </div>
            )}

            {!isUploading && status === "error" && error && (
              <div
                className="w-full max-w-lg rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800"
                role="alert"
              >
                {error}
              </div>
            )}

            {!isUploading && result != null && (
              <div className="w-full max-w-lg rounded-xl border border-zinc-200 bg-zinc-50/50 p-5">
                <h3 className="mb-4 text-xs font-semibold uppercase tracking-wider text-zinc-500">
                  Results
                </h3>
                <ResultCard result={result} apiKey={apiKey.trim() || undefined} />
              </div>
            )}

            {!isUploading && batchResults != null && batchResults.length > 0 && (
              <BatchResultList results={batchResults} apiKey={apiKey.trim() || undefined} />
            )}

            {showEmptyState && (
              <div
                className="w-full max-w-lg rounded-xl border border-zinc-200 bg-white py-10 text-center text-sm text-zinc-500"
                role="status"
              >
                No analyses yet. Upload images to test the API.
              </div>
            )}
          </section>
        </div>
      </main>
    </div>
  );
}
