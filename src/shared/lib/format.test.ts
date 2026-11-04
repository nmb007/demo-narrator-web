import { describe, expect, it } from "vitest";

import { formatBytes, formatRelativeTime } from "@/shared/lib/format";

describe("formatRelativeTime", () => {
  it("formats a recent timestamp relative to now", () => {
    const now = new Date("2026-01-15T12:00:00.000Z");
    expect(formatRelativeTime("2026-01-15T11:00:00.000Z", now)).toBe(
      "1 hour ago",
    );
  });

  it("returns the original string when the date is invalid", () => {
    expect(formatRelativeTime("not-a-date")).toBe("not-a-date");
  });
});

describe("formatBytes", () => {
  it("formats bytes under one kibibyte", () => {
    expect(formatBytes(0)).toBe("0 B");
    expect(formatBytes(512)).toBe("512 B");
  });

  it("formats larger sizes compactly", () => {
    expect(formatBytes(1024)).toBe("1 KB");
    expect(formatBytes(104_857_600)).toBe("100 MB");
  });
});
