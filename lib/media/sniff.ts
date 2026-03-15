import type { MediaType } from "./types";
import { MEDIA_TYPE_IMAGE, MEDIA_TYPE_AUDIO, MEDIA_TYPE_VIDEO } from "./types";

const IMAGE_MIMES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
]);
const AUDIO_MIMES = new Set<string>([
  "audio/mpeg",
  "audio/wav",
  "audio/ogg",
  "audio/webm",
]);
const VIDEO_MIMES = new Set<string>([
  "video/mp4",
  "video/webm",
  "video/ogg",
]);

export function mediaTypeFromMime(mimeType: string): MediaType | null {
  const mime = mimeType.toLowerCase().trim();
  if (IMAGE_MIMES.has(mime)) return MEDIA_TYPE_IMAGE;
  if (AUDIO_MIMES.has(mime)) return MEDIA_TYPE_AUDIO;
  if (VIDEO_MIMES.has(mime)) return MEDIA_TYPE_VIDEO;
  return null;
}

export function mediaTypeFromMimeOrImage(mimeType: string): MediaType {
  return mediaTypeFromMime(mimeType) ?? MEDIA_TYPE_IMAGE;
}
