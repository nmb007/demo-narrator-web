import { describe, expect, it } from "vitest";

import { latestRunLabel } from "@/features/narration/domain";

describe("latestRunLabel", () => {
  it("labels a missing run", () => {
    expect(latestRunLabel(null)).toBe("No successful run");
    expect(latestRunLabel(undefined)).toBe("No successful run");
  });

  it("labels known statuses", () => {
    expect(latestRunLabel("succeeded")).toBe("Succeeded");
    expect(latestRunLabel("failed")).toBe("Failed");
    expect(latestRunLabel("queued")).toBe("Queued");
    expect(latestRunLabel("running")).toBe("Running");
  });
});
