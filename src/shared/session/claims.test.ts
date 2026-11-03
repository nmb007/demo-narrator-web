import { describe, expect, it } from "vitest";

import { readClaims } from "@/shared/session/claims";
import { testToken } from "../../../tests/token";

describe("readClaims", () => {
  it("reads sub, email, and exp", () => {
    const claims = readClaims(testToken());
    expect(claims).toMatchObject({
      sub: "user-1",
      email: "you@example.com",
    });
    expect(claims?.exp).toEqual(expect.any(Number));
  });

  it("returns null for a malformed token", () => {
    expect(readClaims("not-a-token")).toBeNull();
  });

  it("returns null when email is missing", () => {
    expect(
      readClaims(testToken({ email: undefined, sub: "user-1" })),
    ).toBeNull();
  });
});
