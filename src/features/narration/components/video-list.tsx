"use client";

import { useQuery } from "@tanstack/react-query";
import { ClapperboardIcon, PlayIcon, UploadIcon } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";

import { videosQuery } from "@/features/narration/api";
import { DownloadButton } from "@/features/narration/components/download-button";
import { VideoPreview } from "@/features/narration/components/video-preview";
import { latestRunLabel } from "@/features/narration/domain";
import { videosListMessage } from "@/features/narration/errors";
import { ApiError } from "@/shared/api/errors";
import type { VideoListItem } from "@/shared/api/types";
import { cn } from "@/shared/lib/cn";
import { formatRelativeTime } from "@/shared/lib/format";
import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";
import { Skeleton } from "@/shared/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/shared/ui/table";

function parsePage(raw: string | null): number {
  if (raw == null || raw === "") {
    return 1;
  }
  const value = Number.parseInt(raw, 10);
  if (!Number.isFinite(value) || value < 1) {
    return 1;
  }
  return value;
}

export function VideoList() {
  return (
    <Suspense fallback={<VideoListSkeleton />}>
      <VideoListInner />
    </Suspense>
  );
}

type PreviewTarget = {
  videoId: string;
  title: string;
};

function VideoListInner() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const page = parsePage(searchParams.get("page"));
  const query = useQuery(videosQuery(page));
  const [preview, setPreview] = useState<PreviewTarget | null>(null);

  function goToPage(nextPage: number) {
    const params = new URLSearchParams(searchParams.toString());
    if (nextPage <= 1) {
      params.delete("page");
    } else {
      params.set("page", String(nextPage));
    }
    const queryString = params.toString();
    router.replace(queryString ? `/videos?${queryString}` : "/videos");
  }

  if (query.isPending) {
    return <VideoListSkeleton />;
  }

  if (query.isError) {
    const apiError =
      query.error instanceof ApiError
        ? query.error
        : new ApiError(0, "We couldn't load your videos. Try again.", {}, "");
    return (
      <div className="flex flex-col gap-3" role="alert">
        <p className="text-foreground text-sm">{videosListMessage(apiError)}</p>
        {apiError.requestId ? (
          <p className="text-muted-foreground text-xs">
            Request ID: {apiError.requestId}
          </p>
        ) : null}
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="w-fit"
          onClick={() => {
            void query.refetch();
          }}
        >
          Try again
        </Button>
      </div>
    );
  }

  const data = query.data;
  if (data.items.length === 0) {
    return <VideoListEmpty />;
  }

  const fetching = query.isFetching;

  return (
    <div className="flex flex-col gap-4">
      <div
        className={cn(
          "transition-opacity",
          fetching ? "pointer-events-none opacity-50" : "opacity-100",
        )}
        aria-busy={fetching ? true : undefined}
      >
        <Table className="table-fixed">
          <TableHeader>
            <TableRow>
              <TableHead>Upload</TableHead>
              <TableHead className="w-40">Created</TableHead>
              <TableHead className="w-36">Narration</TableHead>
              <TableHead className="w-56">Narrated video</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.items.map((video) => (
              <VideoListRow
                key={video.id}
                video={video}
                onPlay={() => {
                  setPreview({
                    videoId: video.id,
                    title: `Narrated · ${video.original_filename}`,
                  });
                }}
              />
            ))}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-between gap-3">
        <p className="text-muted-foreground text-sm">
          Page {data.page} of {Math.max(data.pages, 1)} · {data.total}{" "}
          {data.total === 1 ? "video" : "videos"}
        </p>
        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={fetching || data.page <= 1}
            onClick={() => {
              goToPage(data.page - 1);
            }}
          >
            Previous
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={fetching || data.page >= data.pages}
            onClick={() => {
              goToPage(data.page + 1);
            }}
          >
            Next
          </Button>
        </div>
      </div>

      {preview ? (
        <VideoPreview
          videoId={preview.videoId}
          title={preview.title}
          open
          onOpenChange={(open) => {
            if (!open) {
              setPreview(null);
            }
          }}
        />
      ) : null}
    </div>
  );
}

function VideoListRow({
  video,
  onPlay,
}: {
  video: VideoListItem;
  onPlay: () => void;
}) {
  const status = video.latest_run?.status;
  const canUseOutput = status === "succeeded";

  return (
    <TableRow>
      <TableCell className="max-w-0 truncate font-medium">
        {video.original_filename}
      </TableCell>
      <TableCell className="text-muted-foreground">
        {formatRelativeTime(video.created_at)}
      </TableCell>
      <TableCell>
        <Badge
          variant={canUseOutput ? "default" : "secondary"}
          className={
            canUseOutput
              ? "bg-copper/15 text-copper-deep border-transparent"
              : undefined
          }
        >
          {latestRunLabel(status)}
        </Badge>
      </TableCell>
      <TableCell>
        {canUseOutput ? (
          <div className="flex gap-2">
            <Button type="button" variant="outline" size="sm" onClick={onPlay}>
              <PlayIcon aria-hidden />
              Play
            </Button>
            <DownloadButton videoId={video.id} />
          </div>
        ) : null}
      </TableCell>
    </TableRow>
  );
}

function VideoListEmpty() {
  return (
    <div className="border-border/80 bg-muted/40 flex flex-col items-center gap-5 rounded-xl border border-dashed px-6 py-16 text-center">
      <span className="bg-bay text-sand flex size-14 items-center justify-center rounded-xl shadow-sm">
        <ClapperboardIcon className="size-7" aria-hidden />
      </span>
      <div className="flex max-w-sm flex-col gap-2">
        <h2 className="font-heading text-foreground text-2xl font-semibold tracking-tight">
          No videos yet
        </h2>
        <p className="text-muted-foreground text-sm leading-relaxed">
          Drop in a screen recording and we&apos;ll give it a clear voice. Your
          next polished demo starts here.
        </p>
      </div>
      <Button asChild className="gap-2">
        <Link href="/videos/upload">
          <UploadIcon />
          Upload video
        </Link>
      </Button>
    </div>
  );
}

function VideoListSkeleton() {
  return (
    <div className="flex flex-col gap-3" aria-busy="true">
      <Skeleton className="h-8 w-full" />
      <Skeleton className="h-10 w-full" />
      <Skeleton className="h-10 w-full" />
      <Skeleton className="h-10 w-full" />
    </div>
  );
}
