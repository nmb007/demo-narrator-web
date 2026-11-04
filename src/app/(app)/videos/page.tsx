import Link from "next/link";
import { UploadIcon } from "lucide-react";

import { VideoList } from "@/features/narration/components/video-list";
import { Button } from "@/shared/ui/button";

export default function VideosPage() {
  return (
    <main className="flex flex-col gap-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="font-heading text-3xl font-semibold tracking-tight">
            Your videos
          </h1>
          <p className="text-muted-foreground text-sm">
            Find all your uploaded videos here.
          </p>
        </div>
        <Button asChild className="gap-2">
          <Link href="/videos/upload">
            <UploadIcon />
            Upload video
          </Link>
        </Button>
      </div>
      <VideoList />
    </main>
  );
}
