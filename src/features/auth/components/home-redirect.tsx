"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

import { useHydrated, useSession } from "@/shared/session/use-session";

export function HomeRedirect() {
  const router = useRouter();
  const hydrated = useHydrated();
  const session = useSession();

  useEffect(() => {
    if (!hydrated) {
      return;
    }
    router.replace(session ? "/home" : "/signup");
  }, [hydrated, router, session]);

  return <p aria-busy="true">Redirecting…</p>;
}
