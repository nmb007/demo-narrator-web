import { queryOptions } from "@tanstack/react-query";

import { apiClient } from "@/shared/api/client";
import { ApiError } from "@/shared/api/errors";
import type { VideoPage } from "@/shared/api/types";

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
