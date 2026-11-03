import { describe, expect, it } from "vitest";

import { safeRedirect } from "@/shared/lib/safe-redirect";

describe("safeRedirect", () => {
  it("keeps a same-origin path, including its query and hash", () => {
    expect(safeRedirect("/home")).toBe("/home");
    expect(safeRedirect("/run?id=abc#done")).toBe("/run?id=abc#done");
    expect(safeRedirect("  /home  ")).toBe("/home");
  });

  it("uses the fallback for missing or external targets", () => {
    expect(safeRedirect(null)).toBe("/home");
    expect(safeRedirect(undefined, "/videos/new")).toBe("/videos/new");
    expect(safeRedirect("")).toBe("/home");
    expect(safeRedirect("https://evil.example/home")).toBe("/home");
    expect(safeRedirect("//evil.example")).toBe("/home");
    expect(safeRedirect("/\\evil.example")).toBe("/home");
    expect(safeRedirect("///evil.example")).toBe("/home");
  });

  it("does not send someone back to a page that only redirects", () => {
    expect(safeRedirect("/")).toBe("/home");
    expect(safeRedirect("/login")).toBe("/home");
    expect(safeRedirect("/login?next=/home")).toBe("/home");
    expect(safeRedirect("/signup?x=1")).toBe("/home");
  });
});
