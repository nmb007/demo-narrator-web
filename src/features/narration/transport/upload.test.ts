import { afterEach, describe, expect, it, vi } from "vitest";

import { UPLOAD_CANCELLED_MESSAGE } from "@/features/narration/errors";
import { uploadNarration } from "@/features/narration/transport/upload";
import { ApiError } from "@/shared/api/errors";
import { clearSession, setSession } from "@/shared/session/session-store";
import { testToken } from "../../../../tests/token";

class FakeXhr {
  static instances: FakeXhr[] = [];

  upload = {
    addEventListener: (
      type: string,
      listener: (event: ProgressEvent<EventTarget>) => void,
    ) => {
      this.uploadListeners[type] = listener;
    },
  };

  status = 0;
  responseText = "";
  private uploadListeners: Record<
    string,
    (event: ProgressEvent<EventTarget>) => void
  > = {};
  private listeners: Record<string, () => void> = {};
  private headers: Record<string, string> = {};
  openMethod = "";
  openUrl = "";
  sent: FormData | null = null;

  constructor() {
    FakeXhr.instances.push(this);
  }

  addEventListener(type: string, listener: () => void) {
    this.listeners[type] = listener;
  }

  open(method: string, url: string) {
    this.openMethod = method;
    this.openUrl = url;
  }

  setRequestHeader(name: string, value: string) {
    this.headers[name] = value;
  }

  send(body: FormData) {
    this.sent = body;
  }

  abort() {
    this.listeners.abort?.();
  }

  emitUploadProgress(loaded: number, total: number) {
    this.uploadListeners.progress?.({
      lengthComputable: true,
      loaded,
      total,
    } as ProgressEvent<EventTarget>);
  }

  emitUploadLoad() {
    this.uploadListeners.load?.({
      lengthComputable: true,
      loaded: 1,
      total: 1,
    } as ProgressEvent<EventTarget>);
  }

  emitLoad(status: number, body: unknown) {
    this.status = status;
    this.responseText = JSON.stringify(body);
    this.listeners.load?.();
  }

  emitError() {
    this.listeners.error?.();
  }

  header(name: string): string | undefined {
    return this.headers[name];
  }
}

afterEach(() => {
  FakeXhr.instances = [];
  clearSession("logout");
  vi.unstubAllGlobals();
});

describe("uploadNarration", () => {
  it("reports progress, then validates, then resolves a 202 body", async () => {
    setSession(testToken({ email: "upload@example.com" }));
    const progress: Array<{ phase: string; loaded: number; total: number }> =
      [];
    const handle = uploadNarration(
      {
        video: new File(["abc"], "demo.mp4", { type: "video/mp4" }),
        voice: "en-US-AndrewNeural",
        max_atempo: 1.2,
      },
      {
        onProgress: (event) => {
          progress.push(event);
        },
        createXhr: () => new FakeXhr() as unknown as XMLHttpRequest,
      },
    );

    const xhr = FakeXhr.instances[0];
    expect(xhr).toBeDefined();
    expect(xhr?.openMethod).toBe("POST");
    expect(xhr?.openUrl).toContain("/v1/narrate");
    expect(xhr?.header("Authorization")).toMatch(/^Bearer /);
    expect(xhr?.header("X-Request-ID")).toBeTruthy();

    xhr?.emitUploadProgress(50, 100);
    xhr?.emitUploadProgress(100, 100);
    xhr?.emitUploadLoad();
    xhr?.emitLoad(202, {
      run_id: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
      video_id: "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb",
      status: "queued",
      steps: ["transcribe", "rewrite", "voice", "mux"],
    });

    await expect(handle.promise).resolves.toMatchObject({
      status: "queued",
      run_id: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
    });
    expect(progress[0]).toEqual({
      phase: "uploading",
      loaded: 50,
      total: 100,
    });
    expect(progress.some((item) => item.phase === "validating")).toBe(true);
  });

  it("turns a 415 into an ApiError", async () => {
    const handle = uploadNarration(
      {
        video: new File(["abc"], "demo.mp4", { type: "video/mp4" }),
        voice: "en-US-AndrewNeural",
        max_atempo: 1.2,
      },
      {
        createXhr: () => new FakeXhr() as unknown as XMLHttpRequest,
      },
    );
    FakeXhr.instances[0]?.emitLoad(415, {
      detail: "Only .mov and .mp4 uploads are supported",
    });
    const error = await handle.promise.catch((value: unknown) => value);
    expect(error).toBeInstanceOf(ApiError);
    expect(error).toMatchObject({ status: 415 });
  });

  it("turns a network error into status 0", async () => {
    const handle = uploadNarration(
      {
        video: new File(["abc"], "demo.mp4", { type: "video/mp4" }),
        voice: "en-US-AndrewNeural",
        max_atempo: 1.2,
      },
      {
        createXhr: () => new FakeXhr() as unknown as XMLHttpRequest,
      },
    );
    FakeXhr.instances[0]?.emitError();
    await expect(handle.promise).rejects.toMatchObject({ status: 0 });
  });

  it("aborts with the cancelled message", async () => {
    const handle = uploadNarration(
      {
        video: new File(["abc"], "demo.mp4", { type: "video/mp4" }),
        voice: "en-US-AndrewNeural",
        max_atempo: 1.2,
      },
      {
        createXhr: () => new FakeXhr() as unknown as XMLHttpRequest,
      },
    );
    handle.abort();
    await expect(handle.promise).rejects.toMatchObject({
      message: UPLOAD_CANCELLED_MESSAGE,
      status: 0,
    });
  });
});
