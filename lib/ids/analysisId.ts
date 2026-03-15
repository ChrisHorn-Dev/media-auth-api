import { randomUUID } from "crypto";

export function createAnalysisId(): string {
  return randomUUID();
}
