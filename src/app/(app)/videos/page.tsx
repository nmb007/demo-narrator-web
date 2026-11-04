import { VideoList } from "@/features/narration/components/video-list";

export default function VideosPage() {
  return (
    <main className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="font-heading text-3xl font-semibold tracking-tight">
          Your videos
        </h1>
        <p className="text-muted-foreground text-sm">
          Find all your uploaded videos here.
        </p>
      </div>
      <VideoList />
    </main>
  );
}
