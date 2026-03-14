"use client";

import { useState } from "react";
import { UploadCard } from "@/components/UploadCard";
import { ResultCard } from "@/components/ResultCard";

interface AnalysisResult {
  prediction: string;
  confidence: number;
  model: string;
}

type Status = "idle" | "uploading" | "done" | "error";

export default function Home() {
  const [status, setStatus] = useState<Status>("idle");
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleUpload = async (file: File) => {
    setError(null);
    setResult(null);
    setStatus("uploading");

    const formData = new FormData();
    formData.set("file", file);

    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();

      if (!res.ok) {
        const detail = data.details ? ` — ${data.details}` : "";
        setError(`${data.error || `Request failed (${res.status})`}${detail}`);
        setStatus("error");
        return;
      }

      setResult(data);
      setStatus("done");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Network error");
      setStatus("error");
    }
  };

  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-900">
      <main className="mx-auto max-w-2xl px-4 py-12 sm:py-16">
        <header className="mb-10 text-center">
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
            Media Authenticity API <span className="text-zinc-500">(Experimental)</span>
          </h1>
          <p className="mt-3 text-zinc-600">
            Upload an image to see whether the model classifies it as likely AI-generated or authentic.
          </p>
        </header>

        <section className="flex flex-col items-center gap-8">
          <UploadCard onUpload={handleUpload} disabled={status === "uploading"} />

          {status === "uploading" && (
            <div className="flex items-center gap-2 text-zinc-600" role="status" aria-live="polite">
              <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-zinc-400 border-t-transparent" />
              <span>Processing…</span>
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
        </section>
      </main>
    </div>
  );
}
