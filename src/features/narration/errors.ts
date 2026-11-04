import type { ApiError } from "@/shared/api/errors";

export const NETWORK_MESSAGE =
  "We couldn't reach the server. Check your connection and try again.";
export const LIST_FAILED_MESSAGE = "We couldn't load your videos. Try again.";
export const UPLOAD_FAILED_MESSAGE =
  "We couldn't upload your video. Try again.";
export const UPLOAD_INTERRUPTED_MESSAGE =
  "Upload interrupted. Check your connection and try again.";
export const UPLOAD_CANCELLED_MESSAGE = "Upload cancelled.";
export const UPLOAD_TOO_LARGE_MESSAGE =
  "That file is too large. Choose one under 100 MB.";
export const UPLOAD_UNSUPPORTED_TYPE_MESSAGE =
  "Only .mov and .mp4 files are supported.";
export const UPLOAD_SUCCESS_MESSAGE =
  "Upload complete. We're preparing the narration now.";

export type UploadField = "video" | "voice" | "max_atempo";

export function videosListMessage(error: ApiError): string {
  if (error.status === 0) {
    return NETWORK_MESSAGE;
  }
  if (error.status >= 500) {
    return LIST_FAILED_MESSAGE;
  }
  return error.message || LIST_FAILED_MESSAGE;
}

export function uploadFieldErrors(
  error: ApiError,
): Partial<Record<UploadField, string>> {
  if (error.status !== 422) {
    return {};
  }
  const fields: Partial<Record<UploadField, string>> = {};
  for (const field of ["video", "voice", "max_atempo"] as const) {
    const message = error.fieldErrors[field];
    if (message) {
      fields[field] = message;
    }
  }
  return fields;
}

export function uploadFormMessage(error: ApiError): string | null {
  if (error.status === 413) {
    return UPLOAD_TOO_LARGE_MESSAGE;
  }
  if (error.status === 415) {
    return UPLOAD_UNSUPPORTED_TYPE_MESSAGE;
  }
  if (error.status === 422) {
    const fields = uploadFieldErrors(error);
    if (fields.video || fields.voice || fields.max_atempo) {
      return null;
    }
    return error.message || UPLOAD_FAILED_MESSAGE;
  }
  if (error.status === 0) {
    return UPLOAD_INTERRUPTED_MESSAGE;
  }
  if (error.status >= 500) {
    return UPLOAD_FAILED_MESSAGE;
  }
  return error.message || UPLOAD_FAILED_MESSAGE;
}
