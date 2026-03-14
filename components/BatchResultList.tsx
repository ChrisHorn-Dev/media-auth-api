"use client";

export interface BatchResultItem {
  filename: string;
  prediction?: string;
  confidence?: number;
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

export function BatchResultList({ results }: BatchResultListProps) {
  return (
    <div
      className="w-full max-w-lg space-y-3"
      role="region"
      aria-label="Batch analysis results"
    >
      <h3 className="text-sm font-medium uppercase tracking-wide text-zinc-500">
        Results
      </h3>
      <ul className="space-y-2">
        {results.map((item, i) => (
          <li
            key={`${item.filename}-${i}`}
            className="rounded-lg border border-zinc-200 bg-white px-4 py-3 text-sm"
          >
            <p className="font-medium text-zinc-900">{item.filename}</p>
            {"error" in item && item.error ? (
              <p className="mt-1 text-red-600">{item.error}</p>
            ) : (
              <p className="mt-1 text-zinc-600">
                {item.prediction && formatPrediction(item.prediction)}
                {item.confidence != null && ` · ${item.confidence}`}
                {item.cached && (
                  <span className="ml-2 text-zinc-400">(cached)</span>
                )}
              </p>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
