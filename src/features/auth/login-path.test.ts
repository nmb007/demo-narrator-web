import { describe, expect, it } from "vitest";

import { loginPath, loginRedirect } from "@/features/auth/login-path";

describe("loginPath", () => {
  it("keeps a safe return path", () => {
    expect(loginPath("/videos")).toBe("/login?next=%2Fvideos");
    expect(loginPath("/run?id=abc", "expired")).toBe(
      "/login?next=%2Frun%3Fid%3Dabc&reason=expired",
    );
  });

  it("drops an external return path", () => {
    expect(loginPath("https://evil.example")).toBe("/login?next=%2Fvideos");
  });
});

describe("loginRedirect", () => {
  it("sends a signed-out app page to login", () => {
    expect(loginRedirect("/videos", "", "", null)).toBe(
      "/login?next=%2Fvideos",
    );
  });

  it("adds the expired notice and the return path", () => {
    expect(loginRedirect("/videos", "", "", "expired")).toBe(
      "/login?next=%2Fvideos&reason=expired",
    );
  });

  it("leaves the login and signup pages alone", () => {
    expect(loginRedirect("/login", "", "", null)).toBeNull();
    expect(loginRedirect("/signup", "?from=videos", "", null)).toBeNull();
  });

  it("does not replace a login page that already shows the notice", () => {
    expect(
      loginRedirect("/login", "?reason=expired&next=%2Fvideos", "", "expired"),
    ).toBeNull();
  });

  it("adds the notice when an auth page still has an expired session", () => {
    expect(loginRedirect("/login", "", "", "expired")).toBe(
      "/login?next=%2Fvideos&reason=expired",
    );
  });
});
