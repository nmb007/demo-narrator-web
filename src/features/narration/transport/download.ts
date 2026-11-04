import { ApiError, normalizeFastApiError } from "@/shared/api/errors";
import { env } from "@/shared/config/env";
import { clearSession, getToken } from "@/shared/session/session-store";

export type DownloadedVideo = {
  blob: Blob;
  filename: string;
};

type DownloadVideoOptions = {
  fetchImpl?: typeof fetch;
  signal?: AbortSignal;
};

const FALLBACK_FILENAME = "narrated.mp4";
const DOWNLOAD_REVOKE_DELAY_MS = 1000;

export function parseContentDispositionFilename(
  header: string | null,
): string | null {
  if (!header) {
    return null;
  }

  const utf8Match = /filename\*\s*=\s*UTF-8''([^;]+)/i.exec(header);
  if (utf8Match?.[1]) {
    try {
      return decodeURIComponent(utf8Match[1].trim().replace(/^"|"$/g, ""));
    } catch {
      return utf8Match[1].trim().replace(/^"|"$/g, "");
    }
  }

  const quotedMatch = /filename\s*=\s*"((?:\\.|[^"\\])*)"/i.exec(header);
  if (quotedMatch?.[1]) {
    return quotedMatch[1].replace(/\\"/g, '"');
  }

  const bareMatch = /filename\s*=\s*([^;]+)/i.exec(header);
  if (bareMatch?.[1]) {
    return bareMatch[1].trim().replace(/^"|"$/g, "");
  }

  return null;
}

export async function downloadVideo(
  videoId: string,
  options: DownloadVideoOptions = {},
): Promise<DownloadedVideo> {
  const requestId = crypto.randomUUID();
  const headers = new Headers();
  const token = getToken();
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }
  headers.set("X-Request-ID", requestId);

  const fetchImpl = options.fetchImpl ?? fetch;
  const init: RequestInit = {
    method: "GET",
    headers,
  };
  if (options.signal) {
    init.signal = options.signal;
  }

  let response: Response;
  try {
    response = await fetchImpl(
      `${env.apiBaseUrl}/v1/videos/${videoId}/download`,
      init,
    );
  } catch (error) {
    if (isAbortError(error)) {
      throw error;
    }
    throw normalizeFastApiError(0, null, requestId);
  }

  if (response.status === 401) {
    clearSession();
  }

  if (!response.ok) {
    const body: unknown = await response.json().catch(() => null);
    throw normalizeFastApiError(response.status, body, requestId);
  }

  const blob = await response.blob();
  const filename =
    parseContentDispositionFilename(
      response.headers.get("Content-Disposition"),
    ) ?? FALLBACK_FILENAME;

  return { blob, filename };
}

export function saveBlobDownload(
  blob: Blob,
  filename: string,
  options: {
    createObjectURL?: typeof URL.createObjectURL;
    revokeObjectURL?: typeof URL.revokeObjectURL;
    documentRef?: Document;
    revokeDelayMs?: number;
  } = {},
): void {
  const createObjectURL = options.createObjectURL ?? URL.createObjectURL;
  const revokeObjectURL = options.revokeObjectURL ?? URL.revokeObjectURL;
  const documentRef = options.documentRef ?? document;
  const revokeDelayMs = options.revokeDelayMs ?? DOWNLOAD_REVOKE_DELAY_MS;

  const objectUrl = createObjectURL(blob);
  const anchor = documentRef.createElement("a");
  anchor.href = objectUrl;
  anchor.download = filename;
  anchor.rel = "noopener";
  documentRef.body.appendChild(anchor);
  anchor.click();
  anchor.remove();

  window.setTimeout(() => {
    revokeObjectURL(objectUrl);
  }, revokeDelayMs);
}

export function isDownloadNotReady(error: unknown): error is ApiError {
  return error instanceof ApiError && error.status === 404;
}

function isAbortError(error: unknown): boolean {
  return (
    (error instanceof DOMException && error.name === "AbortError") ||
    (error instanceof Error && error.name === "AbortError")
  );
}
