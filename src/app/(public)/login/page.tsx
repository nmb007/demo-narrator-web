import { Suspense } from "react";

import { LoginForm } from "@/features/auth/components/login-form";
import { SignupPitch } from "@/features/auth/components/signup-pitch";

export default function LoginPage() {
  return (
    <main className="flex min-h-dvh flex-1 flex-col lg:flex-row">
      <section className="flex flex-1 lg:max-w-[58%]">
        <SignupPitch />
      </section>
      <section className="bg-background flex flex-1 items-center justify-center p-8 lg:p-12">
        <div className="flex w-full max-w-md flex-col gap-8">
          <div className="flex flex-col gap-2">
            <p className="font-heading text-foreground text-3xl tracking-tight">
              Demo Narrator
            </p>
            <p className="text-muted-foreground text-sm">
              Log in to continue a narration.
            </p>
          </div>
          <Suspense
            fallback={
              <p className="text-muted-foreground" aria-busy="true">
                Loading…
              </p>
            }
          >
            <LoginForm />
          </Suspense>
        </div>
      </section>
    </main>
  );
}
