import createClient, { type Middleware } from "openapi-fetch";

import type { paths } from "@/shared/api/generated/schema";
import { ApiError, normalizeFastApiError } from "@/shared/api/errors";
import { env } from "@/shared/config/env";
import { clearSession, getToken } from "@/shared/session/session-store";

const JSON_TIMEOUT_MS = 15_000;

const requestMiddleware: Middleware = {
  async onRequest({ request }) {
    const headers = new Headers(request.headers);
    const token = getToken();
    if (token) {
      headers.set("Authorization", `Bearer ${token}`);
    }
    if (!headers.has("X-Request-ID")) {
      headers.set("X-Request-ID", crypto.randomUUID());
    }
    const signals = [AbortSignal.timeout(JSON_TIMEOUT_MS)];
    if (request.signal) {
      signals.push(request.signal);
    }
    return new Request(request, {
      headers,
      signal: AbortSignal.any(signals),
    });
  },
};

const errorMiddleware: Middleware = {
  async onResponse({ request, response }) {
    if (response.ok) {
      return undefined;
    }
    const requestId = request.headers.get("X-Request-ID") ?? "";
    const body: unknown = await response.json().catch(() => null);
    if (response.status === 401) {
      clearSession();
    }
    throw normalizeFastApiError(response.status, body, requestId);
  },
  onError({ error }) {
    if (error instanceof ApiError) {
      return error;
    }
    return normalizeFastApiError(0, null, "");
  },
};

export function createApiClient(
  fetchImpl?: (input: Request) => Promise<Response>,
) {
  const client = createClient<paths>({
    baseUrl: env.apiBaseUrl,
    ...(fetchImpl ? { fetch: fetchImpl } : {}),
  });
  client.use(requestMiddleware);
  client.use(errorMiddleware);
  return client;
}

export const apiClient = createApiClient();
