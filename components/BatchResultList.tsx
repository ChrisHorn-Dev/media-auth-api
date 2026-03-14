"use client";

export interface BatchResultItem {
  filename: string;
  analysis_id?: string;
  timestamp?: string;
  prediction?: string;
  confidence?: number;
  model?: string;
  signature?: string;
  cached?: boolean;
  error?: string;
}

interface BatchResultListProps {
  results: BatchResultItem[];
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
          <li
            key={`${item.filename}-${i}`}
            className="rounded-lg border border-zinc-200 bg-white p-4 shadow-sm"
          >
            <p
              className="truncate text-sm font-semibold text-zinc-900"
              title={item.filename}
            >
              {truncateFilename(item.filename)}
            </p>
            {"error" in item && item.error ? (
              <p className="mt-2 text-sm text-red-600">{item.error}</p>
            ) : (
              <div className="mt-2 flex flex-wrap items-center gap-2">
                {item.prediction && (
                  <span className="inline-flex items-center rounded-md bg-zinc-100 px-2 py-0.5 text-xs font-medium text-zinc-700">
                    {formatPrediction(item.prediction)}
                  </span>
                )}
                {item.confidence != null && (
                  <span className="text-sm text-zinc-600">
                    {formatConfidence(item.confidence)}
                  </span>
                )}
                {item.cached && (
                  <span className="text-xs text-zinc-400">Served from cache</span>
                )}
              </div>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
