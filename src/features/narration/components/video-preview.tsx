"use client";

import { useEffect, useState } from "react";

import { DownloadButton } from "@/features/narration/components/download-button";
import { playMessage } from "@/features/narration/errors";
import { useObjectUrl } from "@/features/narration/hooks/use-object-url";
import { downloadVideo } from "@/features/narration/transport/download";
import { ApiError } from "@/shared/api/errors";
import { Button } from "@/shared/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/shared/ui/dialog";
import { Skeleton } from "@/shared/ui/skeleton";

type VideoPreviewProps = {
  videoId: string;
  title: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

type PreviewState =
  | { status: "loading" }
  | { status: "ready"; blob: Blob; filename: string }
  | { status: "error"; error: ApiError };

const PLAY_FAILED_FALLBACK =
  "We couldn't load that video for playback. Try again.";

export function VideoPreview({
  videoId,
  title,
  open,
  onOpenChange,
}: VideoPreviewProps) {
  const [state, setState] = useState<PreviewState>({ status: "loading" });
  const blob = state.status === "ready" ? state.blob : null;
  const objectUrl = useObjectUrl(blob);

  useEffect(() => {
    if (!open) {
      return;
    }

    let cancelled = false;
    const controller = new AbortController();

    void downloadVideo(videoId, { signal: controller.signal })
      .then((result) => {
        if (cancelled) {
          return;
        }
        setState({
          status: "ready",
          blob: result.blob,
          filename: result.filename,
        });
      })
      .catch((error: unknown) => {
        if (
          cancelled ||
          controller.signal.aborted ||
          (error instanceof Error && error.name === "AbortError")
        ) {
          return;
        }
        const apiError =
          error instanceof ApiError
            ? error
            : new ApiError(0, PLAY_FAILED_FALLBACK, {}, "");
        setState({ status: "error", error: apiError });
      });

    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [open, videoId]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription className="sr-only">
            Preview the narrated video in your browser.
          </DialogDescription>
        </DialogHeader>

        {state.status === "loading" ? (
          <div className="flex flex-col gap-3" aria-busy="true">
            <Skeleton className="aspect-video w-full rounded-lg" />
            <p className="text-muted-foreground text-sm">Loading video…</p>
          </div>
        ) : null}

        {state.status === "error" ? (
          <div className="flex flex-col gap-3" role="alert">
            <p className="text-foreground text-sm">
              {playMessage(state.error)}
            </p>
            {state.error.requestId ? (
              <p className="text-muted-foreground text-xs">
                Request ID: {state.error.requestId}
              </p>
            ) : null}
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="w-fit"
              onClick={() => {
                onOpenChange(false);
              }}
            >
              Close
            </Button>
          </div>
        ) : null}

        {state.status === "ready" && objectUrl ? (
          <>
            <video
              key={objectUrl}
              className="bg-muted aspect-video w-full rounded-lg"
              controls
              playsInline
              preload="metadata"
              src={objectUrl}
            >
              Your browser does not support video playback.
            </video>
            <DialogFooter>
              <DownloadButton
                videoId={videoId}
                blob={state.blob}
                filename={state.filename}
              />
            </DialogFooter>
          </>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
