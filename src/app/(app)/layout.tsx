import type { ReactNode } from "react";

import { RequireSession } from "@/features/auth/components/require-session";

export default function AppLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex flex-1 items-center justify-center p-6">
      <div className="w-full max-w-md">
        <RequireSession>{children}</RequireSession>
      </div>
    </div>
  );
}
