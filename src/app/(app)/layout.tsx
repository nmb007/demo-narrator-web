import type { ReactNode } from "react";

import { AppShell } from "@/features/auth/components/app-shell";
import { RequireSession } from "@/features/auth/components/require-session";

export default function AppLayout({ children }: { children: ReactNode }) {
  return (
    <RequireSession>
      <AppShell>{children}</AppShell>
    </RequireSession>
  );
}
