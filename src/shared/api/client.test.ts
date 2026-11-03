import { describe, expect, it, vi } from "vitest";

import { createApiClient } from "@/shared/api/client";
import { ApiError } from "@/shared/api/errors";
import {
  clearSession,
  getToken,
  setSession,
} from "@/shared/session/session-store";
import { testToken } from "../../../tests/token";

function jsonResponse(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}

describe("api client", () => {
  it("sends a request id and the bearer token", async () => {
    setSession(testToken());
    const fetchImpl = vi.fn(async (request: Request) => {
      expect(request.headers.get("Authorization")).toBe(`Bearer ${getToken()}`);
      expect(request.headers.get("X-Request-ID")).toBeTruthy();
      return jsonResponse(201, {
        id: "11111111-1111-1111-1111-111111111111",
        email: "you@example.com",
        created_at: "2026-01-15T12:00:00Z",
      });
    });
    const client = createApiClient(fetchImpl);
    const result = await client.POST("/v1/auth/signup", {
      body: { email: "you@example.com", password: "password123" },
    });
    expect(result.data?.email).toBe("you@example.com");
  });

  it("clears the session on a 401", async () => {
    setSession(testToken());
    const client = createApiClient(async () =>
      jsonResponse(401, { detail: "Invalid credentials" }),
    );
    await expect(
      client.POST("/v1/auth/signup", {
        body: { email: "you@example.com", password: "password123" },
      }),
    ).rejects.toMatchObject({ status: 401 });
    expect(getToken()).toBeNull();
  });

  it("maps a 422 body onto field errors", async () => {
    const client = createApiClient(async () =>
      jsonResponse(422, {
        detail: [
          { loc: ["body", "password"], msg: "Too short", type: "value_error" },
        ],
      }),
    );
    await expect(
      client.POST("/v1/auth/signup", {
        body: { email: "you@example.com", password: "password123" },
      }),
    ).rejects.toMatchObject({
      status: 422,
      fieldErrors: { password: "Too short" },
    });
  });

  it("hides a 500 response body", async () => {
    const client = createApiClient(async () =>
      jsonResponse(500, { detail: "traceback" }),
    );
    const error = await client
      .POST("/v1/auth/signup", {
        body: { email: "you@example.com", password: "password123" },
      })
      .catch((caught: unknown) => caught);
    expect(error).toBeInstanceOf(ApiError);
    if (error instanceof ApiError) {
      expect(error.message).not.toContain("traceback");
      expect(error.status).toBe(500);
    }
  });

  it("turns a network failure into status 0", async () => {
    const client = createApiClient(async () => {
      throw new TypeError("Failed to fetch");
    });
    await expect(
      client.POST("/v1/auth/signup", {
        body: { email: "you@example.com", password: "password123" },
      }),
    ).rejects.toMatchObject({ status: 0 });
  });
});

describe("session cleanup between client tests", () => {
  it("starts signed out", () => {
    clearSession();
    expect(getToken()).toBeNull();
  });
});
