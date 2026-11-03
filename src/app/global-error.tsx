"use client";

export default function GlobalError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body className="flex min-h-full flex-col items-center justify-center gap-4 p-6">
        <h1 className="text-2xl font-semibold">Something went wrong</h1>
        <button
          className="rounded-lg border px-3 py-2 text-sm"
          type="button"
          onClick={() => reset()}
        >
          Reload
        </button>
      </body>
    </html>
  );
}
