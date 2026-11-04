import type { RunStatus } from "@/shared/api/types";

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
