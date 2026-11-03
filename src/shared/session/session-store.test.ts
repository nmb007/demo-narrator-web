import { afterEach, describe, expect, it, vi } from "vitest";

import {
  clearSession,
  getSnapshot,
  setSession,
  subscribe,
} from "@/shared/session/session-store";
import { testToken } from "../../../tests/token";

describe("session store", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("stores a token and reads the email", () => {
    setSession(testToken({ email: "ada@example.com" }));
    expect(getSnapshot()?.email).toBe("ada@example.com");
    const stored = localStorage.getItem("dn.session");
    expect(stored).toBeTruthy();
    expect(JSON.parse(stored ?? "{}")).toHaveProperty("token");
  });

  it("clears the token", () => {
    setSession(testToken());
    clearSession();
    expect(getSnapshot()).toBeNull();
    expect(localStorage.getItem("dn.session")).toBeNull();
  });

  it("drops a malformed stored value", () => {
    getSnapshot();
    localStorage.setItem("dn.session", "{");
    window.dispatchEvent(new StorageEvent("storage", { key: "dn.session" }));
    expect(getSnapshot()).toBeNull();
    expect(localStorage.getItem("dn.session")).toBeNull();
  });

  it("drops an expired token", () => {
    getSnapshot();
    localStorage.setItem(
      "dn.session",
      JSON.stringify({ token: testToken({}, -10) }),
    );
    window.dispatchEvent(new StorageEvent("storage", { key: "dn.session" }));
    expect(getSnapshot()).toBeNull();
  });

  it("refuses to store an expired token", () => {
    expect(() => setSession(testToken({}, -10))).toThrow(/expiry/);
  });

  it("clears the session when the token expires", () => {
    vi.useFakeTimers();
    setSession(testToken({}, 2));
    expect(getSnapshot()?.email).toBe("you@example.com");
    vi.advanceTimersByTime(2_000);
    expect(getSnapshot()).toBeNull();
  });

  it("updates subscribers when another tab changes the token", () => {
    getSnapshot();
    const emails: Array<string | null> = [];
    const stop = subscribe(() => {
      emails.push(getSnapshot()?.email ?? null);
    });
    localStorage.setItem(
      "dn.session",
      JSON.stringify({ token: testToken({ email: "tab@example.com" }) }),
    );
    window.dispatchEvent(new StorageEvent("storage", { key: "dn.session" }));
    expect(emails).toEqual(["tab@example.com"]);
    stop();
  });
});
