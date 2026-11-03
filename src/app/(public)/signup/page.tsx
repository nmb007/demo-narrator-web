import Link from "next/link";

import { SignupForm } from "@/features/auth/components/signup-form";
import { SignupPitch } from "@/features/auth/components/signup-pitch";

export default function SignupPage() {
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
              Create an account to narrate your first demo.
            </p>
          </div>
          <SignupForm />
          <p className="text-muted-foreground text-sm">
            Already have an account?{" "}
            <Link
              href="/login"
              className="text-foreground focus-visible:ring-ring rounded-sm font-medium underline-offset-4 hover:underline focus-visible:ring-2 focus-visible:outline-none"
            >
              Log in
            </Link>
          </p>
        </div>
      </section>
    </main>
  );
}
