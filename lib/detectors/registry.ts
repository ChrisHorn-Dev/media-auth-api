import type { MediaType } from "@/lib/media/types";
import type { Detector, DetectorInput } from "@/lib/detectors/types";
import { huggingFaceImageDetector } from "@/lib/detectors/image/huggingFaceImageDetector";

const detectors: Detector[] = [huggingFaceImageDetector];

export function registerDetector(detector: Detector): void {
  if (!detectors.find((d) => d.metadata.id === detector.metadata.id)) {
    detectors.push(detector);
  }
}

export function getDetectorsForMediaType(mediaType: MediaType): Detector[] {
  return detectors.filter((d) => d.metadata.mediaType === mediaType);
}

export function getDetectorById(id: string): Detector | undefined {
  return detectors.find((d) => d.metadata.id === id);
}

export function getCompatibleDetectors(input: DetectorInput): Detector[] {
  return detectors.filter((d) => d.supports(input));
}
