"use client";

import { QueryClientProvider } from "@tanstack/react-query";
import { MotionConfig } from "motion/react";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { Toaster } from "sonner";

import { loginRedirect } from "@/features/auth/login-path";
import { makeQueryClient } from "@/shared/query/query-client";
import {
  getSnapshot,
  peekSessionEnd,
  subscribe,
} from "@/shared/session/session-store";

export function Providers({ children }: { children: ReactNode }) {
  const [queryClient] = useState(makeQueryClient);

  return (
    <QueryClientProvider client={queryClient}>
      <MotionConfig reducedMotion="user">
        {children}
        <SessionRedirect />
        <Toaster />
      </MotionConfig>
    </QueryClientProvider>
  );
}

function SessionRedirect() {
  const router = useRouter();
  const redirected = useRef(false);

  useEffect(() => {
    function sendToLogin(reason: "expired" | null) {
      const href = loginRedirect(
        window.location.pathname,
        window.location.search,
        window.location.hash,
        reason,
      );
      if (href) {
        router.replace(href);
      }
    }

    const sessionNow = getSnapshot();
    const pathname = window.location.pathname;
    if (
      !redirected.current &&
      !sessionNow &&
      (pathname === "/" || pathname === "/login" || pathname === "/signup")
    ) {
      redirected.current = true;
      sendToLogin(peekSessionEnd() === "expired" ? "expired" : null);
    }

    let previous = sessionNow;
    return subscribe(() => {
      const next = getSnapshot();
      if (previous && !next) {
        const reason = peekSessionEnd();
        if (reason !== "logout") {
          sendToLogin(reason === "expired" ? "expired" : null);
        }
      }
      previous = next;
    });
  }, [router]);

  return null;
}
