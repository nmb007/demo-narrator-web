import { afterEach, describe, expect, it, vi } from "vitest";

import {
  downloadVideo,
  parseContentDispositionFilename,
  saveBlobDownload,
} from "@/features/narration/transport/download";
import { ApiError } from "@/shared/api/errors";
import {
  clearSession,
  getToken,
  setSession,
} from "@/shared/session/session-store";
import { testToken } from "../../../../tests/token";

afterEach(() => {
  clearSession("logout");
  vi.unstubAllGlobals();
  vi.useRealTimers();
});

describe("parseContentDispositionFilename", () => {
  it("reads a quoted filename", () => {
    expect(
      parseContentDispositionFilename(
        'attachment; filename="demo-narrated.mp4"',
      ),
    ).toBe("demo-narrated.mp4");
  });

  it("prefers an RFC 5987 filename*", () => {
    expect(
      parseContentDispositionFilename(
        "attachment; filename=\"fallback.mp4\"; filename*=UTF-8''demo%20clip-narrated.mp4",
      ),
    ).toBe("demo clip-narrated.mp4");
  });

  it("returns null when the header is missing", () => {
    expect(parseContentDispositionFilename(null)).toBeNull();
  });
});

describe("downloadVideo", () => {
  it("returns the blob and filename from Content-Disposition", async () => {
    setSession(testToken({ email: "dl@example.com" }));
    let requestedUrl = "";
    let requestedInit: RequestInit | undefined;
    const fetchImpl: typeof fetch = async (input, init) => {
      requestedUrl = String(input);
      requestedInit = init;
      return new Response("fake-mp4", {
        status: 200,
        headers: {
          "Content-Type": "video/mp4",
          "Content-Disposition": 'attachment; filename="clip-narrated.mp4"',
        },
      });
    };

    const result = await downloadVideo("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb", {
      fetchImpl,
    });

    expect(result.filename).toBe("clip-narrated.mp4");
    expect(await result.blob.text()).toBe("fake-mp4");
    expect(requestedUrl).toContain(
      "/v1/videos/bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb/download",
    );
    expect(requestedInit?.method).toBe("GET");
    const headers = new Headers(requestedInit?.headers);
    expect(headers.get("Authorization")).toMatch(/^Bearer /);
    expect(headers.get("X-Request-ID")).toBeTruthy();
  });

  it("falls back to narrated.mp4 when Content-Disposition is absent", async () => {
    setSession(testToken({ email: "dl-fallback@example.com" }));
    const fetchImpl = vi.fn(async () => {
      return new Response(new Blob(["x"], { type: "video/mp4" }), {
        status: 200,
        headers: { "Content-Type": "video/mp4" },
      });
    });

    const result = await downloadVideo("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa", {
      fetchImpl,
    });
    expect(result.filename).toBe("narrated.mp4");
  });

  it("turns a 404 into an ApiError", async () => {
    setSession(testToken({ email: "dl-404@example.com" }));
    const fetchImpl = vi.fn(async () => {
      return new Response(
        JSON.stringify({ detail: "No narrated output is ready yet" }),
        {
          status: 404,
          headers: { "Content-Type": "application/json" },
        },
      );
    });

    await expect(
      downloadVideo("cccccccc-cccc-cccc-cccc-cccccccccccc", { fetchImpl }),
    ).rejects.toMatchObject({
      status: 404,
      message: "No narrated output is ready yet",
    });
  });

  it("clears the session on 401", async () => {
    setSession(testToken({ email: "dl-401@example.com" }));
    expect(getToken()).toBeTruthy();
    const fetchImpl = vi.fn(async () => {
      return new Response(JSON.stringify({ detail: "Not authenticated" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    });

    const error = await downloadVideo("dddddddd-dddd-dddd-dddd-dddddddddddd", {
      fetchImpl,
    }).catch((value: unknown) => value);

    expect(error).toBeInstanceOf(ApiError);
    expect(error).toMatchObject({ status: 401 });
    expect(getToken()).toBeNull();
  });

  it("turns a network failure into status 0", async () => {
    setSession(testToken({ email: "dl-net@example.com" }));
    const fetchImpl = vi.fn(async () => {
      throw new TypeError("Failed to fetch");
    });

    await expect(
      downloadVideo("eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee", { fetchImpl }),
    ).rejects.toMatchObject({ status: 0 });
  });

  it("rethrows AbortError without clearing the session", async () => {
    setSession(testToken({ email: "dl-abort@example.com" }));
    const fetchImpl = vi.fn(async () => {
      throw new DOMException("Aborted", "AbortError");
    });

    await expect(
      downloadVideo("ffffffff-ffff-ffff-ffff-ffffffffffff", { fetchImpl }),
    ).rejects.toMatchObject({ name: "AbortError" });
    expect(getToken()).toBeTruthy();
  });
});

describe("saveBlobDownload", () => {
  it("clicks a temporary download link and revokes after a delay", () => {
    vi.useFakeTimers();
    const createObjectURL = vi.fn(() => "blob:http://localhost/fake");
    const revokeObjectURL = vi.fn();
    const click = vi.fn();
    const remove = vi.fn();
    const appendChild = vi.fn();
    const createElement = vi.fn(() => {
      return {
        href: "",
        download: "",
        rel: "",
        click,
        remove,
      };
    });
    const documentRef = {
      createElement,
      body: { appendChild },
    } as unknown as Document;

    saveBlobDownload(new Blob(["bytes"]), "out.mp4", {
      createObjectURL,
      revokeObjectURL,
      documentRef,
      revokeDelayMs: 1000,
    });

    expect(createObjectURL).toHaveBeenCalledOnce();
    expect(createElement).toHaveBeenCalledWith("a");
    expect(appendChild).toHaveBeenCalledOnce();
    expect(click).toHaveBeenCalledOnce();
    expect(remove).toHaveBeenCalledOnce();
    expect(revokeObjectURL).not.toHaveBeenCalled();

    vi.advanceTimersByTime(1000);
    expect(revokeObjectURL).toHaveBeenCalledWith("blob:http://localhost/fake");
  });
});
