"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";

import { Button } from "@/shared/ui/button";
import { clearSession } from "@/shared/session/session-store";
import { useSession } from "@/shared/session/use-session";

export function SignedInHome() {
  const session = useSession();
  const queryClient = useQueryClient();
  const router = useRouter();

  function logout() {
    clearSession("logout");
    queryClient.clear();
    router.replace("/login");
  }

  return (
    <div className="flex flex-col gap-4">
      <p>
        Signed in as <span className="font-medium">{session?.email}</span>
      </p>
      <Button type="button" variant="outline" onClick={logout}>
        Log out
      </Button>
    </div>
  );
}
