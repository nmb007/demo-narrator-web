import { describe, expect, it } from "vitest";

import {
  UPLOAD_INTERRUPTED_MESSAGE,
  UPLOAD_TOO_LARGE_MESSAGE,
  UPLOAD_UNSUPPORTED_TYPE_MESSAGE,
  uploadFieldErrors,
  uploadFormMessage,
} from "@/features/narration/errors";
import { ApiError } from "@/shared/api/errors";

describe("uploadFormMessage", () => {
  it("maps 413 and 415 to clear form messages", () => {
    expect(uploadFormMessage(new ApiError(413, "too large", {}, "req-1"))).toBe(
      UPLOAD_TOO_LARGE_MESSAGE,
    );
    expect(uploadFormMessage(new ApiError(415, "bad type", {}, "req-1"))).toBe(
      UPLOAD_UNSUPPORTED_TYPE_MESSAGE,
    );
  });

  it("returns the duration message for a string 422 detail", () => {
    expect(
      uploadFormMessage(
        new ApiError(
          422,
          "Video duration must be between 2 and 600 seconds",
          {},
          "req-1",
        ),
      ),
    ).toBe("Video duration must be between 2 and 600 seconds");
  });

  it("returns null when 422 has field errors", () => {
    expect(
      uploadFormMessage(
        new ApiError(
          422,
          "Check the highlighted fields.",
          {
            max_atempo: "too high",
          },
          "req-1",
        ),
      ),
    ).toBeNull();
  });

  it("maps a network failure to the interrupted message", () => {
    expect(uploadFormMessage(new ApiError(0, "network", {}, ""))).toBe(
      UPLOAD_INTERRUPTED_MESSAGE,
    );
  });
});

describe("uploadFieldErrors", () => {
  it("copies 422 field errors for upload fields", () => {
    expect(
      uploadFieldErrors(
        new ApiError(
          422,
          "Check the highlighted fields.",
          {
            voice: "unknown voice",
          },
          "req-1",
        ),
      ),
    ).toEqual({
      voice: "unknown voice",
    });
  });

  it("ignores non-422 statuses", () => {
    expect(
      uploadFieldErrors(
        new ApiError(415, "bad type", { video: "nope" }, "req-1"),
      ),
    ).toEqual({});
  });
});
