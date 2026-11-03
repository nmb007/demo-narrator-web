"use client";

import { QueryClientProvider } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { Toaster } from "sonner";

import { makeQueryClient } from "@/shared/query/query-client";
import { getSnapshot, subscribe } from "@/shared/session/session-store";

export function Providers({ children }: { children: ReactNode }) {
  const [queryClient] = useState(makeQueryClient);

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      <SessionRedirect />
      <Toaster />
    </QueryClientProvider>
  );
}

function SessionRedirect() {
  const router = useRouter();

  useEffect(() => {
    let previous = getSnapshot();
    return subscribe(() => {
      const next = getSnapshot();
      if (previous && !next) {
        router.replace("/signup");
      }
      previous = next;
    });
  }, [router]);

  return null;
}
