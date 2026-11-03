import { describe, expect, it } from "vitest";

import { env } from "@/shared/config/env";
import { cn } from "@/shared/lib/cn";
import { ApiError } from "@/shared/api/errors";
import { makeQueryClient, retryQuery } from "@/shared/query/query-client";

describe("env", () => {
  it("reads the public build values", () => {
    expect(env.apiBaseUrl).toBe("http://localhost:8000");
    expect(env.uploadMaxBytes).toBe(104857600);
    expect(env.appEnv).toBe("local");
  });
});

describe("cn", () => {
  it("joins class names", () => {
    expect(cn("px-2", "px-4")).toBe("px-4");
  });
});

describe("retryQuery", () => {
  it("retries network and 5xx failures twice", () => {
    expect(retryQuery(0, new ApiError(0, "down", {}, ""))).toBe(true);
    expect(retryQuery(1, new ApiError(503, "down", {}, ""))).toBe(true);
    expect(retryQuery(2, new ApiError(503, "down", {}, ""))).toBe(false);
    expect(retryQuery(0, new ApiError(409, "taken", {}, ""))).toBe(false);
    expect(retryQuery(0, new Error("boom"))).toBe(true);
  });

  it("is the query client default", () => {
    const retry = makeQueryClient().getDefaultOptions().queries?.retry;
    expect(retry).toBe(retryQuery);
  });
});
