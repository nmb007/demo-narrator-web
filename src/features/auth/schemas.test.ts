import { describe, expect, it } from "vitest";

import { LoginSchema, SignupSchema } from "@/features/auth/schemas";

describe("SignupSchema", () => {
  it("accepts an email and a password in range", () => {
    const parsed = SignupSchema.safeParse({
      email: "you@example.com",
      password: "password123",
    });
    expect(parsed.success).toBe(true);
  });

  it("rejects an invalid email", () => {
    const parsed = SignupSchema.safeParse({
      email: "not-an-email",
      password: "password123",
    });
    expect(parsed.success).toBe(false);
    if (!parsed.success) {
      expect(parsed.error.issues[0]?.message).toBe(
        "Enter a valid email address.",
      );
    }
  });

  it("rejects a short password", () => {
    const parsed = SignupSchema.safeParse({
      email: "you@example.com",
      password: "short",
    });
    expect(parsed.success).toBe(false);
    if (!parsed.success) {
      expect(parsed.error.issues[0]?.message).toBe(
        "Use at least 8 characters.",
      );
    }
  });

  it("rejects a password longer than 128 characters", () => {
    const parsed = SignupSchema.safeParse({
      email: "you@example.com",
      password: "x".repeat(129),
    });
    expect(parsed.success).toBe(false);
    if (!parsed.success) {
      expect(parsed.error.issues[0]?.message).toBe(
        "Use at most 128 characters.",
      );
    }
  });
});

describe("LoginSchema", () => {
  it("accepts an email and a password", () => {
    const parsed = LoginSchema.safeParse({
      username: "you@example.com",
      password: "password123",
    });
    expect(parsed.success).toBe(true);
  });

  it("rejects an invalid email", () => {
    const parsed = LoginSchema.safeParse({
      username: "not-an-email",
      password: "password123",
    });
    expect(parsed.success).toBe(false);
    if (!parsed.success) {
      expect(parsed.error.issues[0]?.message).toBe(
        "Enter a valid email address.",
      );
    }
  });

  it("rejects an empty password", () => {
    const parsed = LoginSchema.safeParse({
      username: "you@example.com",
      password: "",
    });
    expect(parsed.success).toBe(false);
    if (!parsed.success) {
      expect(parsed.error.issues[0]?.message).toBe("Enter your password.");
    }
  });

  it("rejects a password longer than 128 characters", () => {
    const parsed = LoginSchema.safeParse({
      username: "you@example.com",
      password: "x".repeat(129),
    });
    expect(parsed.success).toBe(false);
    if (!parsed.success) {
      expect(parsed.error.issues[0]?.message).toBe(
        "Use at most 128 characters.",
      );
    }
  });
});
