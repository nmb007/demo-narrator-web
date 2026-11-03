"use client";

import { useRouter } from "next/navigation";
import { useEffect, type ReactNode } from "react";

import { useHydrated, useSession } from "@/shared/session/use-session";

export function RedirectIfSignedIn({ children }: { children: ReactNode }) {
  const router = useRouter();
  const hydrated = useHydrated();
  const session = useSession();

  useEffect(() => {
    if (hydrated && session) {
      router.replace("/home");
    }
  }, [hydrated, router, session]);

  if (hydrated && session) {
    return <p aria-busy="true">Opening your account…</p>;
  }

  return children;
}
