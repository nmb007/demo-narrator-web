import { UploadForm } from "@/features/narration/components/upload-form";

export default function UploadVideoPage() {
  return (
    <main className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="font-heading text-3xl font-semibold tracking-tight">
          Upload video
        </h1>
        <p className="text-muted-foreground text-sm">
          Upload a recording with audio and we&apos;ll give it clear English
          narration.
        </p>
      </div>
      <UploadForm />
    </main>
  );
}
