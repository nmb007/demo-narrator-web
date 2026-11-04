import { describe, expect, it } from "vitest";

import { UploadSchema } from "@/features/narration/schemas";
import { env } from "@/shared/config/env";

function fileOf(name: string, size: number): File {
  const file = new File(["x"], name, { type: "video/mp4" });
  Object.defineProperty(file, "size", { value: size });
  return file;
}

describe("UploadSchema", () => {
  it("accepts a .mp4 under the size limit", () => {
    const parsed = UploadSchema.safeParse({
      video: fileOf("demo.mp4", 1024),
      voice: "en-US-AndrewNeural",
      max_atempo: 1.2,
    });
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.video.name).toBe("demo.mp4");
    }
  });

  it("rejects a .txt file", () => {
    const parsed = UploadSchema.safeParse({
      video: fileOf("notes.txt", 1024),
      voice: "en-US-AndrewNeural",
      max_atempo: 1.2,
    });
    expect(parsed.success).toBe(false);
    if (!parsed.success) {
      expect(parsed.error.issues[0]?.message).toBe("Use a .mov or .mp4 file.");
    }
  });

  it("rejects a file over the size limit", () => {
    const parsed = UploadSchema.safeParse({
      video: fileOf("huge.mp4", env.uploadMaxBytes + 1),
      voice: "en-US-AndrewNeural",
      max_atempo: 1.2,
    });
    expect(parsed.success).toBe(false);
    if (!parsed.success) {
      expect(parsed.error.issues[0]?.message).toMatch(/under/i);
    }
  });

  it("rejects max_atempo outside 1.0–2.0", () => {
    const low = UploadSchema.safeParse({
      video: fileOf("demo.mp4", 1024),
      voice: "en-US-AndrewNeural",
      max_atempo: 0.5,
    });
    const high = UploadSchema.safeParse({
      video: fileOf("demo.mp4", 1024),
      voice: "en-US-AndrewNeural",
      max_atempo: 2.5,
    });
    expect(low.success).toBe(false);
    expect(high.success).toBe(false);
  });
});
