"use client";

import type { SignedAnalysisRecord } from "@/lib/analysis/types";

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
  const prediction = getPrediction(result);
  const confidence = getConfidence(result);
  const score = authenticityScore(prediction, confidence);
  const predictionLabel = formatPrediction(prediction);
  const model = getModel(result);

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
      <p className="mt-4 text-xs text-zinc-400">Detector: {model}</p>
      {result.cached && (
        <p className="mt-2 text-xs text-zinc-400">Served from cache</p>
      )}
    </div>
  );
}
