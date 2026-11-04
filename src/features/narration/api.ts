import {
  queryOptions,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import { useRef, useState } from "react";

import {
  uploadNarration,
  type UploadNarrationInput,
  type UploadProgress,
} from "@/features/narration/transport/upload";
import { apiClient } from "@/shared/api/client";
import { ApiError } from "@/shared/api/errors";
import type { Run, VideoPage } from "@/shared/api/types";

const NETWORK_MESSAGE =
  "We couldn't reach the server. Check your connection and try again.";

const PAGE_SIZE = 20;

export function videosQuery(page: number) {
  return queryOptions({
    queryKey: ["narration", "videos", page] as const,
    queryFn: () => fetchVideosPage(page),
  });
}

async function fetchVideosPage(page: number): Promise<VideoPage> {
  const result = await apiClient.GET("/v1/videos", {
    params: {
      query: {
        page,
        size: PAGE_SIZE,
      },
    },
  });
  if (!result.data) {
    throw new ApiError(0, NETWORK_MESSAGE, {}, "");
  }
  return result.data;
}

export function useUploadVideo() {
  const queryClient = useQueryClient();
  const abortRef = useRef<(() => void) | null>(null);
  const [progress, setProgress] = useState<UploadProgress | null>(null);

  const mutation = useMutation({
    mutationFn: (input: UploadNarrationInput): Promise<Run> => {
      setProgress({ phase: "uploading", loaded: 0, total: 0 });
      const handle = uploadNarration(input, {
        onProgress: setProgress,
      });
      abortRef.current = handle.abort;
      return handle.promise.finally(() => {
        abortRef.current = null;
      });
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ["narration", "videos"],
      });
    },
    onSettled: () => {
      setProgress(null);
    },
  });

  function cancel() {
    abortRef.current?.();
  }

  return {
    mutate: mutation.mutate,
    mutateAsync: mutation.mutateAsync,
    isPending: mutation.isPending,
    isError: mutation.isError,
    error: mutation.error,
    reset: mutation.reset,
    progress,
    cancel,
  };
}
