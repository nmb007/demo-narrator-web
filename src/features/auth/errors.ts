import type { ApiError } from "@/shared/api/errors";

export const EMAIL_TAKEN_MESSAGE = "An account with this email already exists.";
export const SIGNUP_FAILED_MESSAGE =
  "We couldn't create your account. Try again.";
export const NETWORK_MESSAGE =
  "We couldn't reach the server. Check your connection and try again.";

export const INVALID_LOGIN_MESSAGE = "The email or password is incorrect.";
export const LOGIN_FAILED_MESSAGE = "We couldn't sign you in. Try again.";

export type SignupField = "email" | "password";
export type LoginField = "username" | "password";

export function signupFieldErrors(
  error: ApiError,
): Partial<Record<SignupField, string>> {
  if (error.status === 409) {
    return { email: EMAIL_TAKEN_MESSAGE };
  }
  if (error.status !== 422) {
    return {};
  }
  const fields: Partial<Record<SignupField, string>> = {};
  for (const field of ["email", "password"] as const) {
    const message = error.fieldErrors[field];
    if (message) {
      fields[field] = message;
    }
  }
  return fields;
}

export function signupFormMessage(error: ApiError): string | null {
  if (error.status === 409) {
    return null;
  }
  if (
    error.status === 422 &&
    (error.fieldErrors.email || error.fieldErrors.password)
  ) {
    return null;
  }
  if (error.status === 0) {
    return NETWORK_MESSAGE;
  }
  return SIGNUP_FAILED_MESSAGE;
}

export function loginFieldErrors(
  error: ApiError,
): Partial<Record<LoginField, string>> {
  if (error.status !== 422) {
    return {};
  }
  const fields: Partial<Record<LoginField, string>> = {};
  for (const field of ["username", "password"] as const) {
    const message = error.fieldErrors[field];
    if (message) {
      fields[field] = message;
    }
  }
  return fields;
}

export function loginFormMessage(error: ApiError): string | null {
  if (error.status === 401) {
    return INVALID_LOGIN_MESSAGE;
  }
  if (
    error.status === 422 &&
    (error.fieldErrors.username || error.fieldErrors.password)
  ) {
    return null;
  }
  if (error.status === 0) {
    return NETWORK_MESSAGE;
  }
  return LOGIN_FAILED_MESSAGE;
}
