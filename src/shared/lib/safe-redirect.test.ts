import { describe, expect, it } from "vitest";

import { safeRedirect } from "@/shared/lib/safe-redirect";

describe("safeRedirect", () => {
  it("keeps a same-origin path, including its query and hash", () => {
    expect(safeRedirect("/videos")).toBe("/videos");
    expect(safeRedirect("/run?id=abc#done")).toBe("/run?id=abc#done");
    expect(safeRedirect("  /videos  ")).toBe("/videos");
  });

  it("uses the fallback for missing or external targets", () => {
    expect(safeRedirect(null)).toBe("/videos");
    expect(safeRedirect(undefined, "/videos/upload")).toBe("/videos/upload");
    expect(safeRedirect("")).toBe("/videos");
    expect(safeRedirect("https://evil.example/videos")).toBe("/videos");
    expect(safeRedirect("//evil.example")).toBe("/videos");
    expect(safeRedirect("/\\evil.example")).toBe("/videos");
    expect(safeRedirect("///evil.example")).toBe("/videos");
  });

  it("does not send someone back to a page that only redirects", () => {
    expect(safeRedirect("/")).toBe("/videos");
    expect(safeRedirect("/login")).toBe("/videos");
    expect(safeRedirect("/login?next=/videos")).toBe("/videos");
    expect(safeRedirect("/signup?x=1")).toBe("/videos");
  });
});
