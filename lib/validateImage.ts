export const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024;
export const ALLOWED_IMAGE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
];

export function validateImageFile(file: File): string | null {
  if (file.size > MAX_FILE_SIZE_BYTES) {
    return `File too large. Maximum size is ${MAX_FILE_SIZE_BYTES / 1024 / 1024} MB.`;
  }
  const type = file.type?.toLowerCase() ?? "";
  if (!ALLOWED_IMAGE_TYPES.includes(type)) {
    return `Unsupported file type: ${type || "unknown"}. Allowed: ${ALLOWED_IMAGE_TYPES.join(", ")}.`;
  }
  return null;
}
