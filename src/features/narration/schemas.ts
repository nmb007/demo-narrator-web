import { z } from "zod";

import {
  DEFAULT_MAX_ATEMPO,
  DEFAULT_VOICE,
  isAllowedVideoExtension,
  MAX_MAX_ATEMPO,
  MIN_MAX_ATEMPO,
} from "@/features/narration/domain";
import { env } from "@/shared/config/env";
import { formatBytes } from "@/shared/lib/format";

function firstFile(value: unknown): File | undefined {
  if (typeof File !== "undefined" && value instanceof File) {
    return value;
  }
  if (typeof FileList !== "undefined" && value instanceof FileList) {
    return value.item(0) ?? undefined;
  }
  return undefined;
}

export const UploadSchema = z.object({
  video: z
    .custom<FileList | File>((value) => firstFile(value) !== undefined, {
      message: "Choose a video file.",
    })
    .transform((value) => firstFile(value) as File)
    .superRefine((file, ctx) => {
      if (!isAllowedVideoExtension(file.name)) {
        ctx.addIssue({
          code: "custom",
          message: "Use a .mov or .mp4 file.",
        });
        return;
      }
      if (file.size > env.uploadMaxBytes) {
        ctx.addIssue({
          code: "custom",
          message: `Choose a file under ${formatBytes(env.uploadMaxBytes)}.`,
        });
      }
    }),
  voice: z.string().min(1, "Choose a voice."),
  max_atempo: z.coerce
    .number({ error: "Enter a number." })
    .min(MIN_MAX_ATEMPO, `Use at least ${MIN_MAX_ATEMPO}.`)
    .max(MAX_MAX_ATEMPO, `Use at most ${MAX_MAX_ATEMPO}.`),
});

export type Upload = z.infer<typeof UploadSchema>;
export type UploadInput = z.input<typeof UploadSchema>;

export const UPLOAD_DEFAULTS = {
  voice: DEFAULT_VOICE,
  max_atempo: DEFAULT_MAX_ATEMPO,
} satisfies Omit<UploadInput, "video">;
