import type { Route } from "next";

import { safeRedirect } from "@/shared/lib/safe-redirect";

export const SIGNED_IN_PATH = "/home" as const;

const AUTH_PAGES = new Set(["/login", "/signup"]);

export function loginPath(
  returnTo: string,
  reason?: "expired",
): `/login?${string}` {
  const next = safeRedirect(returnTo, SIGNED_IN_PATH);
  const params = new URLSearchParams({ next });
  if (reason === "expired") {
    params.set("reason", "expired");
  }
  return `/login?${params.toString()}`;
}

export function safeAppRoute(
  candidate: string | null | undefined,
  fallback: Route = SIGNED_IN_PATH,
): Route {
  return safeRedirect(candidate, fallback) as Route;
}

export function loginRedirect(
  pathname: string,
  search: string,
  hash: string,
  sessionEnd: "expired" | null,
): `/login?${string}` | null {
  const expired = sessionEnd === "expired";
  const onAuthPage = AUTH_PAGES.has(pathname);
  if (onAuthPage && !expired) {
    return null;
  }
  if (
    onAuthPage &&
    expired &&
    new URLSearchParams(search).get("reason") === "expired"
  ) {
    return null;
  }
  const returnTo = `${pathname}${search}${hash}`;
  return expired ? loginPath(returnTo, "expired") : loginPath(returnTo);
}
