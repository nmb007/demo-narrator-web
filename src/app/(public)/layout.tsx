import type { ReactNode } from "react";

import { RedirectIfSignedIn } from "@/features/auth/components/redirect-if-signed-in";

export default function PublicLayout({ children }: { children: ReactNode }) {
  return <RedirectIfSignedIn>{children}</RedirectIfSignedIn>;
}
