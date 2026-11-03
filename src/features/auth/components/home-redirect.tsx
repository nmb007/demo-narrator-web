"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

import { SIGNED_IN_PATH } from "@/features/auth/login-path";
import { useHydrated, useSession } from "@/shared/session/use-session";

export function HomeRedirect() {
  const router = useRouter();
  const hydrated = useHydrated();
  const session = useSession();

  useEffect(() => {
    if (hydrated && session) {
      router.replace(SIGNED_IN_PATH);
    }
  }, [hydrated, router, session]);

  return <p aria-busy="true">Redirecting…</p>;
}
