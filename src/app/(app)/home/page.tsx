import { SignedInHome } from "@/features/auth/components/signed-in-home";

export default function HomePage() {
  return (
    <main className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold tracking-tight">
        You&apos;re signed in
      </h1>
      <SignedInHome />
    </main>
  );
}
