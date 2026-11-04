"use client";

import { useQueryClient } from "@tanstack/react-query";
import { LogOutIcon } from "lucide-react";
import { useRouter } from "next/navigation";

import { clearSession } from "@/shared/session/session-store";
import { useSession } from "@/shared/session/use-session";
import { Button } from "@/shared/ui/button";
import { Separator } from "@/shared/ui/separator";

function emailInitial(email: string | undefined): string {
  if (!email) {
    return "?";
  }
  const local = email.split("@")[0] ?? email;
  return local.charAt(0).toUpperCase() || "?";
}

export function UserMenu() {
  const session = useSession();
  const queryClient = useQueryClient();
  const router = useRouter();
  const email = session?.email;

  function logout() {
    clearSession("logout");
    queryClient.clear();
    router.replace("/login");
  }

  return (
    <div className="flex flex-col gap-3 px-2 pb-2">
      <Separator className="bg-sidebar-border" />
      <div className="flex items-center gap-3 px-1">
        <span
          className="bg-bay text-sand flex size-9 shrink-0 items-center justify-center rounded-full text-sm font-semibold"
          aria-hidden
        >
          {emailInitial(email)}
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-muted-foreground text-xs tracking-wide uppercase">
            Signed in
          </p>
          <p className="text-sidebar-foreground truncate text-sm font-medium">
            {email}
          </p>
        </div>
      </div>
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="border-sidebar-foreground/25 bg-background text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground w-full justify-start gap-2 shadow-sm"
        onClick={logout}
      >
        <LogOutIcon />
        Log out
      </Button>
    </div>
  );
}
