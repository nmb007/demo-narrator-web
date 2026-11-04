"use client";

import { DownloadIcon, LoaderCircleIcon } from "lucide-react";
import { useState } from "react";

import { downloadMessage } from "@/features/narration/errors";
import {
  downloadVideo,
  saveBlobDownload,
} from "@/features/narration/transport/download";
import { ApiError } from "@/shared/api/errors";
import { Button } from "@/shared/ui/button";
import { toast } from "@/shared/ui/sonner";

type DownloadButtonProps = {
  videoId: string;
  disabled?: boolean;
  blob?: Blob | null;
  filename?: string | null;
};

export function DownloadButton({
  videoId,
  disabled = false,
  blob = null,
  filename = null,
}: DownloadButtonProps) {
  const [pending, setPending] = useState(false);

  async function handleClick() {
    if (pending) {
      return;
    }
    setPending(true);
    try {
      if (blob && filename) {
        saveBlobDownload(blob, filename);
        return;
      }
      const result = await downloadVideo(videoId);
      saveBlobDownload(result.blob, result.filename);
    } catch (error) {
      const apiError =
        error instanceof ApiError
          ? error
          : new ApiError(
              0,
              "We couldn't download that video. Try again.",
              {},
              "",
            );
      toast.error(downloadMessage(apiError), {
        description: apiError.requestId
          ? `Request ID: ${apiError.requestId}`
          : undefined,
      });
    } finally {
      setPending(false);
    }
  }

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      disabled={disabled || pending}
      onClick={() => {
        void handleClick();
      }}
    >
      {pending ? (
        <LoaderCircleIcon className="animate-spin" aria-hidden />
      ) : (
        <DownloadIcon aria-hidden />
      )}
      {pending ? "Downloading…" : "Download"}
    </Button>
  );
}
