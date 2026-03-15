import imageSize from "image-size";
import type { MediaType } from "./types";
import { MEDIA_TYPE_IMAGE } from "./types";

const MAX_IMAGE_SIZE_BYTES = 10 * 1024 * 1024;
const MIN_IMAGE_DIMENSION = 32;
const MAX_IMAGE_DIMENSION = 4096;
const ALLOWED_IMAGE_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
];

const CONFIG: Record<MediaType, { allowedMimeTypes: string[]; maxSizeBytes: number }> = {
  image: {
    allowedMimeTypes: ALLOWED_IMAGE_MIME_TYPES,
    maxSizeBytes: MAX_IMAGE_SIZE_BYTES,
  },
  audio: {
    allowedMimeTypes: [],
    maxSizeBytes: 0,
  },
  video: {
    allowedMimeTypes: [],
    maxSizeBytes: 0,
  },
};

export function validateMediaFile(
  file: File,
  mediaType: MediaType = MEDIA_TYPE_IMAGE
): string | null {
  const { allowedMimeTypes, maxSizeBytes } = CONFIG[mediaType];
  if (allowedMimeTypes.length === 0) {
    return `Media type "${mediaType}" is not yet supported.`;
  }
  if (file.size > maxSizeBytes) {
    return `File too large. Maximum size is ${maxSizeBytes / 1024 / 1024} MB.`;
  }
  const mime = (file.type ?? "").toLowerCase();
  if (!mime || !allowedMimeTypes.includes(mime)) {
    return `Unsupported file type: ${mime || "unknown"}. Allowed: ${allowedMimeTypes.join(", ")}.`;
  }
  return null;
}

export function validateImageFile(file: File): string | null {
  return validateMediaFile(file, MEDIA_TYPE_IMAGE);
}

/** Validates image dimensions (min/max px). Returns error message or null. */
export function validateImageDimensions(buffer: Buffer): string | null {
  try {
    const result = imageSize(new Uint8Array(buffer));
    const width = result.width ?? result.images?.[0]?.width;
    const height = result.height ?? result.images?.[0]?.height;
    if (width == null || height == null) {
      return "Could not read image dimensions. The file may be corrupted or in an unsupported format.";
    }
    if (width < MIN_IMAGE_DIMENSION || height < MIN_IMAGE_DIMENSION) {
      return `Image is too small. Minimum dimension is ${MIN_IMAGE_DIMENSION} px (got ${width}×${height}).`;
    }
    if (width > MAX_IMAGE_DIMENSION || height > MAX_IMAGE_DIMENSION) {
      return `Image is too large. Maximum dimension is ${MAX_IMAGE_DIMENSION} px (got ${width}×${height}).`;
    }
    return null;
  } catch {
    return "Could not read image dimensions. The file may be corrupted or in an unsupported format.";
  }
}

export const MAX_FILE_SIZE_BYTES = MAX_IMAGE_SIZE_BYTES;
export const ALLOWED_IMAGE_TYPES = [...ALLOWED_IMAGE_MIME_TYPES];
export const MIN_IMAGE_DIMENSION_PX = MIN_IMAGE_DIMENSION;
export const MAX_IMAGE_DIMENSION_PX = MAX_IMAGE_DIMENSION;
