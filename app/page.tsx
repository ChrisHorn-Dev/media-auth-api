"use client";

import { useState } from "react";
import { UploadCard } from "@/components/UploadCard";
import { ResultCard, type AnalysisResult } from "@/components/ResultCard";
import {
  BatchResultList,
  type BatchResultItem,
} from "@/components/BatchResultList";

type Status = "idle" | "uploading" | "done" | "error";

export default function Home() {
  const [status, setStatus] = useState<Status>("idle");
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [batchResults, setBatchResults] = useState<BatchResultItem[] | null>(
    null
  );
  const [error, setError] = useState<string | null>(null);

  const handleUpload = async (files: File[]) => {
    setError(null);
    setResult(null);
    setBatchResults(null);
    setStatus("uploading");

    if (files.length === 1) {
      const formData = new FormData();
      formData.set("file", files[0]);
      try {
        const res = await fetch("/api/analyze", {
          method: "POST",
          body: formData,
        });
        const data = (await res.json()) as
          | { error?: string; details?: string }
          | (AnalysisResult & { cached: boolean });

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
    try {
      const res = await fetch("/api/analyze/batch", {
        method: "POST",
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
        <header className="mb-10 text-center">
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
            Media Authenticity API <span className="text-zinc-500">(Experimental)</span>
          </h1>
          <p className="mt-3 text-zinc-600">
            Upload one or more images to see whether the model classifies them as
            likely AI-generated or authentic.
          </p>
        </header>

        <section className="flex flex-col items-center gap-8">
          <UploadCard onUpload={handleUpload} disabled={isUploading} />

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

          {status === "error" && error && (
            <div
              className="w-full max-w-lg rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800"
              role="alert"
            >
              {error}
            </div>
          )}

          {status === "done" && result && (
            <ResultCard result={result} />
          )}

          {status === "done" && batchResults && batchResults.length > 0 && (
            <BatchResultList results={batchResults} />
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
      </main>
    </div>
  );
}
