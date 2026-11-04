import type { RunStatus } from "@/shared/api/types";

export const ALLOWED_VIDEO_EXTENSIONS = ["mov", "mp4"] as const;

export type NarrationVoice = {
  id: string;
  label: string;
};

export const NARRATION_VOICES = [
  { id: "en-US-AndrewNeural", label: "Andrew (US, Male)" },
  { id: "en-US-AvaNeural", label: "Ava (US, Female)" },
  { id: "en-US-BrianNeural", label: "Brian (US, Male)" },
  { id: "en-GB-SoniaNeural", label: "Sonia (UK, Female)" },
  { id: "en-GB-RyanNeural", label: "Ryan (UK, Male)" },
  { id: "en-AU-NatashaNeural", label: "Natasha (AU, Female)" },
] as const satisfies ReadonlyArray<NarrationVoice>;

export const DEFAULT_VOICE = NARRATION_VOICES[0].id;

export const DEFAULT_MAX_ATEMPO = 1.2;
export const MIN_MAX_ATEMPO = 1;
export const MAX_MAX_ATEMPO = 2;

export function videoExtension(filename: string): string | null {
  const dot = filename.lastIndexOf(".");
  if (dot < 0 || dot === filename.length - 1) {
    return null;
  }
  return filename.slice(dot + 1).toLowerCase();
}

export function isAllowedVideoExtension(filename: string): boolean {
  const ext = videoExtension(filename);
  return (
    ext !== null &&
    (ALLOWED_VIDEO_EXTENSIONS as ReadonlyArray<string>).includes(ext)
  );
}

export function latestRunLabel(status: RunStatus | null | undefined): string {
  if (!status) {
    return "No successful run";
  }
  switch (status) {
    case "succeeded":
      return "Succeeded";
    case "failed":
      return "Failed";
    case "queued":
      return "Queued";
    case "running":
      return "Running";
    default: {
      const _exhaustive: never = status;
      return _exhaustive;
    }
  }
}
