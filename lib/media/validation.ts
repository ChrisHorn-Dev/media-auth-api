import type { MediaType } from "./types";
import { MEDIA_TYPE_IMAGE } from "./types";

const MAX_IMAGE_SIZE_BYTES = 10 * 1024 * 1024;
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

export const MAX_FILE_SIZE_BYTES = MAX_IMAGE_SIZE_BYTES;
export const ALLOWED_IMAGE_TYPES = [...ALLOWED_IMAGE_MIME_TYPES];
