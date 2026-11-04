"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, type ReactNode } from "react";

import { AuthStatusScreen } from "@/features/auth/components/auth-status-screen";
import { loginRedirect } from "@/features/auth/login-path";
import { getSnapshot, peekSessionEnd } from "@/shared/session/session-store";
import { useHydrated, useSession } from "@/shared/session/use-session";

/** Temporary: keep the loading screen visible so the gate UI can be reviewed. */
const LOADING_TEST_DELAY_MS = 10_000;

export function RequireSession({ children }: { children: ReactNode }) {
  const router = useRouter();
  const hydrated = useHydrated();
  const session = useSession();
  const hadSession = useRef(false);
  const redirected = useRef(false);
  const [loadingHoldDone, setLoadingHoldDone] = useState(false);

  useEffect(() => {
    if (session) {
      hadSession.current = true;
    }
  }, [session]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setLoadingHoldDone(true);
    }, LOADING_TEST_DELAY_MS);
    return () => {
      window.clearTimeout(timer);
    };
  }, []);

  useEffect(() => {
    if (
      !loadingHoldDone ||
      !hydrated ||
      session ||
      hadSession.current ||
      redirected.current
    ) {
      return;
    }
    getSnapshot();
    const href = loginRedirect(
      window.location.pathname,
      window.location.search,
      window.location.hash,
      peekSessionEnd() === "expired" ? "expired" : null,
    );
    if (!href) {
      return;
    }
    redirected.current = true;
    router.replace(href);
  }, [hydrated, loadingHoldDone, router, session]);

  if (!loadingHoldDone || !hydrated || !session) {
    return <AuthStatusScreen message="Loading your account…" />;
  }

  return children;
}
