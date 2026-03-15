"use client";

import { useState } from "react";
import type { SignedAnalysisRecord } from "@/lib/analysis/types";
import { buildVerifyPayload } from "@/lib/verify/buildVerifyPayload";
import type { VerifiableRecord } from "@/lib/verify/buildVerifyPayload";

export interface BatchResultItem {
  filename: string;
  record?: SignedAnalysisRecord | LegacyBatchRecord;
  error?: string;
}
interface LegacyBatchRecord {
  analysis_id?: string;
  timestamp?: string;
  prediction?: string;
  confidence?: number;
  model?: string;
  signature?: string;
  cached?: boolean;
}

type VerifyState = "idle" | "verifying" | "valid" | "invalid";

interface BatchResultListProps {
  results: BatchResultItem[];
}

function getPrediction(item: BatchResultItem): string | undefined {
  const r = item.record;
  if (!r) return undefined;
  if (r && "verdict" in r) return r.verdict.prediction;
  return (r as LegacyBatchRecord).prediction;
}
function getConfidence(item: BatchResultItem): number | undefined {
  const r = item.record;
  if (!r) return undefined;
  if (r && "verdict" in r) return r.verdict.confidence;
  return (r as LegacyBatchRecord).confidence;
}
function getCached(item: BatchResultItem): boolean | undefined {
  const r = item.record;
  if (!r) return undefined;
  return "cached" in r ? r.cached : undefined;
}

function formatPrediction(p: string): string {
  if (p === "likely_ai_generated") return "Likely AI Generated";
  if (p === "likely_authentic") return "Likely Authentic";
  return p;
}

function formatConfidence(confidence: number): string {
  return `${Math.round(confidence * 100)}%`;
}

function truncateFilename(name: string, maxChars: number = 36): string {
  if (name.length <= maxChars) return name;
  const ext = name.includes(".") ? name.slice(name.lastIndexOf(".")) : "";
  const base = name.slice(0, name.length - ext.length);
  if (base.length <= 8) return name.slice(0, maxChars - 3) + "…" + ext;
  return base.slice(0, maxChars - ext.length - 4) + "…" + ext;
}

function hasSignature(r: BatchResultItem["record"]): r is VerifiableRecord {
  return r != null && "signature" in r && typeof (r as VerifiableRecord).signature === "string";
}

function BatchItemRow({ item, index }: { item: BatchResultItem; index: number }) {
  const [verifyState, setVerifyState] = useState<VerifyState>("idle");
  const [verifyReason, setVerifyReason] = useState<string | null>(null);
  const record = item.record;
  const canVerify = record != null && hasSignature(record) && buildVerifyPayload(record) != null;

  const handleVerify = async () => {
    const body = record ? buildVerifyPayload(record) : null;
    if (!body) return;
    setVerifyState("verifying");
    setVerifyReason(null);
    try {
      const res = await fetch("/api/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = (await res.json()) as
        | { valid: true }
        | { valid: false; reason?: string }
        | { error?: string; details?: string };
      if (res.ok && "valid" in data) {
        setVerifyState(data.valid ? "valid" : "invalid");
        setVerifyReason(!data.valid && data.reason ? data.reason : null);
      } else {
        const err = data as { error?: string; details?: string };
        setVerifyState("invalid");
        setVerifyReason(err.details ?? err.error ?? "Verification request failed");
      }
    } catch {
      setVerifyState("invalid");
      setVerifyReason("Network error");
    }
  };

  return (
    <li
      className="rounded-lg border border-zinc-200 bg-white p-4 shadow-sm"
      key={`${item.filename}-${index}`}
    >
      <p
        className="truncate text-sm font-semibold text-zinc-900"
        title={item.filename}
      >
        {truncateFilename(item.filename)}
      </p>
      {item.error ? (
        <p className="mt-2 text-sm text-red-600">{item.error}</p>
      ) : (
        <>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            {getPrediction(item) && (
              <span className="inline-flex items-center rounded-md bg-zinc-100 px-2 py-0.5 text-xs font-medium text-zinc-700">
                {formatPrediction(getPrediction(item)!)}
              </span>
            )}
            {getConfidence(item) != null && (
              <span className="text-sm text-zinc-600">
                {formatConfidence(getConfidence(item)!)}
              </span>
            )}
            {getCached(item) && (
              <span className="text-xs text-zinc-400">Served from cache</span>
            )}
          </div>
          {canVerify && (
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={handleVerify}
                disabled={verifyState === "verifying"}
                className="rounded border border-zinc-300 bg-zinc-50 px-2 py-1 text-xs font-medium text-zinc-700 hover:bg-zinc-100 disabled:opacity-60"
                aria-live="polite"
              >
                {verifyState === "verifying" ? "Verifying…" : "Verify"}
              </button>
              {verifyState === "valid" && (
                <span className="text-xs font-medium text-green-700">Signature valid</span>
              )}
              {verifyState === "invalid" && (
                <span className="text-xs text-amber-700">{verifyReason ?? "Invalid"}</span>
              )}
            </div>
          )}
        </>
      )}
    </li>
  );
}

export function BatchResultList({ results }: BatchResultListProps) {
  return (
    <div
      className="w-full max-w-lg rounded-xl border border-zinc-200 bg-zinc-50/50 p-5"
      role="region"
      aria-label="Batch analysis results"
    >
      <h3 className="mb-4 text-xs font-semibold uppercase tracking-wider text-zinc-500">
        Results
      </h3>
      <ul className="space-y-4">
        {results.map((item, i) => (
          <BatchItemRow key={`${item.filename}-${i}`} item={item} index={i} />
        ))}
      </ul>
    </div>
  );
}
