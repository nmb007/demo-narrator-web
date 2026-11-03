import { describe, expect, it } from "vitest";

import {
  EMAIL_TAKEN_MESSAGE,
  INVALID_LOGIN_MESSAGE,
  LOGIN_FAILED_MESSAGE,
  NETWORK_MESSAGE,
  SIGNUP_FAILED_MESSAGE,
  loginFieldErrors,
  loginFormMessage,
  signupFieldErrors,
  signupFormMessage,
} from "@/features/auth/errors";
import { ApiError } from "@/shared/api/errors";

describe("signup errors", () => {
  it("puts a taken email on the email field", () => {
    const error = new ApiError(409, "Email already registered", {}, "req-1");
    expect(signupFieldErrors(error)).toEqual({ email: EMAIL_TAKEN_MESSAGE });
    expect(signupFormMessage(error)).toBeNull();
  });

  it("maps a 422 onto the matching fields", () => {
    const error = new ApiError(
      422,
      "Check the highlighted fields.",
      { password: "Use at least 8 characters." },
      "req-2",
    );
    expect(signupFieldErrors(error)).toEqual({
      password: "Use at least 8 characters.",
    });
    expect(signupFormMessage(error)).toBeNull();
  });

  it("uses a form message when a 422 has no known field", () => {
    const error = new ApiError(
      422,
      "Check the highlighted fields.",
      {},
      "req-3",
    );
    expect(signupFieldErrors(error)).toEqual({});
    expect(signupFormMessage(error)).toBe(SIGNUP_FAILED_MESSAGE);
  });

  it("hides server text for a 5xx response", () => {
    const error = new ApiError(
      500,
      "Something went wrong. Try again.",
      {},
      "req-4",
    );
    expect(signupFormMessage(error)).toBe(SIGNUP_FAILED_MESSAGE);
    expect(signupFieldErrors(error)).toEqual({});
  });

  it("explains a network failure", () => {
    const error = new ApiError(0, NETWORK_MESSAGE, {}, "");
    expect(signupFormMessage(error)).toBe(NETWORK_MESSAGE);
  });
});

describe("login errors", () => {
  it("shows a form message for a wrong password", () => {
    const error = new ApiError(401, "Invalid credentials", {}, "req-5");
    expect(loginFieldErrors(error)).toEqual({});
    expect(loginFormMessage(error)).toBe(INVALID_LOGIN_MESSAGE);
  });

  it("maps a 422 onto the matching fields", () => {
    const error = new ApiError(
      422,
      "Check the highlighted fields.",
      { username: "Enter a valid email address." },
      "req-6",
    );
    expect(loginFieldErrors(error)).toEqual({
      username: "Enter a valid email address.",
    });
    expect(loginFormMessage(error)).toBeNull();
  });

  it("uses a form message when a 422 has no known field", () => {
    const error = new ApiError(
      422,
      "Check the highlighted fields.",
      {},
      "req-7",
    );
    expect(loginFieldErrors(error)).toEqual({});
    expect(loginFormMessage(error)).toBe(LOGIN_FAILED_MESSAGE);
  });

  it("hides server text for a 5xx response", () => {
    const error = new ApiError(
      500,
      "Something went wrong. Try again.",
      {},
      "req-8",
    );
    expect(loginFormMessage(error)).toBe(LOGIN_FAILED_MESSAGE);
  });

  it("explains a network failure", () => {
    const error = new ApiError(0, NETWORK_MESSAGE, {}, "");
    expect(loginFormMessage(error)).toBe(NETWORK_MESSAGE);
  });
});
