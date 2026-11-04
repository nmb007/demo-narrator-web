"use client";

import { useRouter } from "next/navigation";
import { useEffect, type ReactNode } from "react";

import { AuthStatusScreen } from "@/features/auth/components/auth-status-screen";
import { SIGNED_IN_PATH, safeAppRoute } from "@/features/auth/login-path";
import { useHydrated, useSession } from "@/shared/session/use-session";

export function RedirectIfSignedIn({ children }: { children: ReactNode }) {
  const router = useRouter();
  const hydrated = useHydrated();
  const session = useSession();

  useEffect(() => {
    if (!hydrated || !session) {
      return;
    }
    const next = new URLSearchParams(window.location.search).get("next");
    router.replace(safeAppRoute(next, SIGNED_IN_PATH));
  }, [hydrated, router, session]);

  if (hydrated && session) {
    return <AuthStatusScreen message="Opening your account…" />;
  }

  return children;
}
