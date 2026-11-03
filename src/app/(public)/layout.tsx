import type { ReactNode } from "react";

import { RedirectIfSignedIn } from "@/features/auth/components/redirect-if-signed-in";

export default function PublicLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex flex-1 items-center justify-center p-6">
      <div className="w-full max-w-md">
        <RedirectIfSignedIn>{children}</RedirectIfSignedIn>
      </div>
    </div>
  );
}
