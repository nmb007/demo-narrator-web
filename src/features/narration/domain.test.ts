import { describe, expect, it } from "vitest";

import {
  isAllowedVideoExtension,
  latestRunLabel,
} from "@/features/narration/domain";

describe("latestRunLabel", () => {
  it("labels a missing run", () => {
    expect(latestRunLabel(null)).toBe("Not ready");
    expect(latestRunLabel(undefined)).toBe("Not ready");
  });

  it("labels known statuses", () => {
    expect(latestRunLabel("succeeded")).toBe("Ready");
    expect(latestRunLabel("failed")).toBe("Failed");
    expect(latestRunLabel("queued")).toBe("In progress");
    expect(latestRunLabel("running")).toBe("In progress");
  });
});

describe("isAllowedVideoExtension", () => {
  it("accepts mov and mp4", () => {
    expect(isAllowedVideoExtension("demo.mp4")).toBe(true);
    expect(isAllowedVideoExtension("clip.MOV")).toBe(true);
  });

  it("rejects other extensions", () => {
    expect(isAllowedVideoExtension("notes.txt")).toBe(false);
    expect(isAllowedVideoExtension("noext")).toBe(false);
  });
});
