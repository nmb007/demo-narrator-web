import { UPLOAD_CANCELLED_MESSAGE } from "@/features/narration/errors";
import { ApiError, normalizeFastApiError } from "@/shared/api/errors";
import type { Run } from "@/shared/api/types";
import { env } from "@/shared/config/env";
import { clearSession, getToken } from "@/shared/session/session-store";

export type UploadProgressPhase = "uploading" | "validating";

export type UploadProgress = {
  phase: UploadProgressPhase;
  loaded: number;
  total: number;
};

export type UploadNarrationInput = {
  video: File;
  voice: string;
  max_atempo: number;
};

export type UploadNarrationHandle = {
  promise: Promise<Run>;
  abort: () => void;
};

type UploadNarrationOptions = {
  onProgress?: (progress: UploadProgress) => void;
  createXhr?: () => XMLHttpRequest;
};

export function uploadNarration(
  input: UploadNarrationInput,
  options: UploadNarrationOptions = {},
): UploadNarrationHandle {
  const xhr = (options.createXhr ?? (() => new XMLHttpRequest()))();
  const requestId = crypto.randomUUID();
  const formData = new FormData();
  formData.append("video", input.video, input.video.name);
  formData.append("voice", input.voice);
  formData.append("max_atempo", String(input.max_atempo));

  const promise = new Promise<Run>((resolve, reject) => {
    let settled = false;

    function fail(error: ApiError) {
      if (settled) {
        return;
      }
      settled = true;
      reject(error);
    }

    function succeed(run: Run) {
      if (settled) {
        return;
      }
      settled = true;
      resolve(run);
    }

    xhr.upload.addEventListener("progress", (event) => {
      if (!event.lengthComputable) {
        return;
      }
      options.onProgress?.({
        phase: "uploading",
        loaded: event.loaded,
        total: event.total,
      });
      if (event.loaded >= event.total && event.total > 0) {
        options.onProgress?.({
          phase: "validating",
          loaded: event.total,
          total: event.total,
        });
      }
    });

    xhr.upload.addEventListener("load", () => {
      options.onProgress?.({
        phase: "validating",
        loaded: 1,
        total: 1,
      });
    });

    xhr.addEventListener("load", () => {
      const body = parseJsonBody(xhr.responseText);
      if (xhr.status === 401) {
        clearSession();
      }
      if (xhr.status >= 200 && xhr.status < 300) {
        if (!isRunResponse(body)) {
          fail(normalizeFastApiError(0, null, requestId));
          return;
        }
        succeed(body);
        return;
      }
      fail(normalizeFastApiError(xhr.status || 0, body, requestId));
    });

    xhr.addEventListener("error", () => {
      fail(normalizeFastApiError(0, null, requestId));
    });

    xhr.addEventListener("abort", () => {
      fail(new ApiError(0, UPLOAD_CANCELLED_MESSAGE, {}, requestId));
    });

    xhr.open("POST", `${env.apiBaseUrl}/v1/narrate`);
    const token = getToken();
    if (token) {
      xhr.setRequestHeader("Authorization", `Bearer ${token}`);
    }
    xhr.setRequestHeader("X-Request-ID", requestId);
    xhr.send(formData);
  });

  return {
    promise,
    abort: () => {
      xhr.abort();
    },
  };
}

function parseJsonBody(text: string): unknown {
  if (!text) {
    return null;
  }
  try {
    return JSON.parse(text) as unknown;
  } catch {
    return null;
  }
}

function isRunResponse(value: unknown): value is Run {
  if (typeof value !== "object" || value === null) {
    return false;
  }
  const record = value as Record<string, unknown>;
  return (
    typeof record.run_id === "string" &&
    typeof record.video_id === "string" &&
    typeof record.status === "string" &&
    Array.isArray(record.steps)
  );
}
