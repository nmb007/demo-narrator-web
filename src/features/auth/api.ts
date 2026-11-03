import { useMutation, useQueryClient } from "@tanstack/react-query";

import type { Login, Signup } from "@/features/auth/schemas";
import { apiClient } from "@/shared/api/client";
import { ApiError } from "@/shared/api/errors";
import { setSession } from "@/shared/session/session-store";

const NETWORK_MESSAGE =
  "We couldn't reach the server. Check your connection and try again.";

export async function signupAndStoreSession(input: Signup): Promise<void> {
  await createAccount(input);
  const token = await loginWithPassword(input.email, input.password);
  setSession(token);
}

export function useSignup() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: signupAndStoreSession,
    onSuccess: () => {
      queryClient.clear();
    },
  });
}

export async function loginAndStoreSession(input: Login): Promise<void> {
  const token = await loginWithPassword(input.username, input.password);
  setSession(token);
}

export function useLogin() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: loginAndStoreSession,
    onSuccess: () => {
      queryClient.clear();
    },
  });
}

export async function createAccount(input: Signup): Promise<void> {
  const result = await apiClient.POST("/v1/auth/signup", {
    body: {
      email: input.email,
      password: input.password,
    },
  });
  if (!result.data) {
    throw new ApiError(0, NETWORK_MESSAGE, {}, "");
  }
}

async function loginWithPassword(
  email: string,
  password: string,
): Promise<string> {
  const result = await apiClient.POST("/v1/auth/login", {
    body: {
      username: email,
      password,
      scope: "",
    },
    bodySerializer(body) {
      return new URLSearchParams({
        username: body.username,
        password: body.password,
        scope: body.scope,
      }).toString();
    },
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
  });
  if (!result.data) {
    throw new ApiError(0, NETWORK_MESSAGE, {}, "");
  }
  return result.data.access_token;
}
