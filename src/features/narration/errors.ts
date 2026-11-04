import type { ApiError } from "@/shared/api/errors";

export const NETWORK_MESSAGE =
  "We couldn't reach the server. Check your connection and try again.";
export const LIST_FAILED_MESSAGE = "We couldn't load your videos. Try again.";

export function videosListMessage(error: ApiError): string {
  if (error.status === 0) {
    return NETWORK_MESSAGE;
  }
  if (error.status >= 500) {
    return LIST_FAILED_MESSAGE;
  }
  return error.message || LIST_FAILED_MESSAGE;
}
