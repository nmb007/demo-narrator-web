"use client";

import { useRouter } from "next/navigation";
import { useEffect, type ReactNode } from "react";

import { useHydrated, useSession } from "@/shared/session/use-session";

export function RequireSession({ children }: { children: ReactNode }) {
  const router = useRouter();
  const hydrated = useHydrated();
  const session = useSession();

  useEffect(() => {
    if (hydrated && !session) {
      router.replace("/signup");
    }
  }, [hydrated, router, session]);

  if (!hydrated || !session) {
    return (
      <p className="text-muted-foreground" aria-busy="true">
        Loading your account…
      </p>
    );
  }

  return children;
}
