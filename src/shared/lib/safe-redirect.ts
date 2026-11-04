const APP_ORIGIN = "http://local.test";

const BLOCKED_PATHS = new Set(["/", "/login", "/signup"]);

export function safeRedirect(
  candidate: string | null | undefined,
  fallback = "/videos",
): string {
  if (candidate == null) {
    return fallback;
  }
  const trimmed = candidate.trim();
  if (
    !trimmed.startsWith("/") ||
    trimmed.startsWith("//") ||
    trimmed.includes("\\")
  ) {
    return fallback;
  }
  const url = new URL(trimmed, APP_ORIGIN);
  if (url.origin !== APP_ORIGIN || BLOCKED_PATHS.has(url.pathname)) {
    return fallback;
  }
  return `${url.pathname}${url.search}${url.hash}`;
}
