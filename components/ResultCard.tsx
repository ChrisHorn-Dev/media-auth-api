"use client";

import { useState } from "react";
import type { SignedAnalysisRecord } from "@/lib/analysis/types";
import { buildVerifyPayload } from "@/lib/verify/buildVerifyPayload";

export type AnalysisResult = SignedAnalysisRecord | LegacyResult;
interface LegacyResult {
  analysis_id: string;
  timestamp: string;
  prediction: string;
  confidence: number;
  model: string;
  signature: string;
  cached: boolean;
}

type VerifyState = "idle" | "verifying" | "valid" | "invalid";

interface ResultCardProps {
  result: AnalysisResult;
}

function getPrediction(result: AnalysisResult): string {
  if ("verdict" in result) return result.verdict.prediction;
  return result.prediction;
}
function getConfidence(result: AnalysisResult): number {
  if ("verdict" in result) return result.verdict.confidence;
  return result.confidence;
}
function getModel(result: AnalysisResult): string {
  if ("detectors" in result && result.detectors?.[0]?.model)
    return result.detectors[0].model;
  if ("verdict" in result) return result.verdict.detectorId;
  return (result as LegacyResult).model;
}

function getStrategy(result: AnalysisResult): "single" | "ensemble" | undefined {
  if ("verdict" in result && "strategy" in result.verdict)
    return result.verdict.strategy;
  return undefined;
}

function getDetectorIds(result: AnalysisResult): string[] {
  if ("detectors" in result && Array.isArray(result.detectors))
    return result.detectors.map((d) => d.detectorId).filter(Boolean);
  return [];
}

function formatPrediction(prediction: string): string {
  if (prediction === "likely_ai_generated") return "Likely AI Generated";
  if (prediction === "likely_authentic") return "Likely Authentic";
  return prediction;
}

function authenticityScore(prediction: string, confidence: number): number {
  if (prediction === "likely_authentic") return Math.round(confidence * 100);
  return Math.round((1 - confidence) * 100);
}

export function ResultCard({ result }: ResultCardProps) {
  const [verifyState, setVerifyState] = useState<VerifyState>("idle");
  const [verifyReason, setVerifyReason] = useState<string | null>(null);

  const prediction = getPrediction(result);
  const confidence = getConfidence(result);
  const score = authenticityScore(prediction, confidence);
  const predictionLabel = formatPrediction(prediction);
  const model = getModel(result);
  const strategy = getStrategy(result);
  const detectorIds = getDetectorIds(result);
  const canVerify = buildVerifyPayload(result) != null;

  const handleVerify = async () => {
    const body = buildVerifyPayload(result);
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
    <div
      className="w-full max-w-md rounded-xl border border-zinc-200 bg-white p-6 shadow-sm"
      role="region"
      aria-label="Analysis result"
    >
      <h3 className="mb-4 text-sm font-medium uppercase tracking-wide text-zinc-500">
        Result
      </h3>
      <div className="space-y-4">
        <div>
          <p className="text-xs font-medium text-zinc-500">Authenticity Score</p>
          <p className="text-2xl font-semibold text-zinc-900">{score}%</p>
        </div>
        <div>
          <p className="text-xs font-medium text-zinc-500">Prediction</p>
          <p className="text-lg font-medium text-zinc-900">{predictionLabel}</p>
        </div>
        <div>
          <p className="text-xs font-medium text-zinc-500">Confidence</p>
          <p className="text-lg font-mono text-zinc-900">
            {confidence.toFixed(2)}
          </p>
        </div>
      </div>
      <div className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-zinc-400">
        {strategy && (
          <span>
            {strategy === "ensemble" ? "Ensemble" : "Single detector"}
            {strategy === "ensemble" && detectorIds.length > 0 && ` (${detectorIds.join(", ")})`}
          </span>
        )}
        {strategy === "single" && <span>Detector: {model}</span>}
      </div>
      {result.cached && (
        <p className="mt-2 text-xs text-zinc-400">Served from cache</p>
      )}

      {canVerify && (
        <div className="mt-5 border-t border-zinc-200 pt-4">
          <button
            type="button"
            onClick={handleVerify}
            disabled={verifyState === "verifying"}
            className="rounded-lg border border-zinc-300 bg-zinc-50 px-3 py-1.5 text-sm font-medium text-zinc-700 hover:bg-zinc-100 disabled:opacity-60"
            aria-live="polite"
          >
            {verifyState === "verifying" ? "Verifying…" : "Verify this result"}
          </button>
          {verifyState === "valid" && (
            <p className="mt-2 text-sm font-medium text-green-700" role="status">
              Signature valid
            </p>
          )}
          {verifyState === "invalid" && (
            <p className="mt-2 text-sm text-amber-700" role="status">
              {verifyReason ?? "Signature invalid"}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
