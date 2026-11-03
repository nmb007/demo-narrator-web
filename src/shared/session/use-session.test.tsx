import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { setSession } from "@/shared/session/session-store";
import { useHydrated, useSession } from "@/shared/session/use-session";
import { testToken } from "../../../tests/token";

function Probe() {
  const hydrated = useHydrated();
  const session = useSession();
  return <p>{hydrated ? (session?.email ?? "signed-out") : "loading"}</p>;
}

describe("useSession", () => {
  it("reads the stored session after hydration", () => {
    setSession(testToken({ email: "ada@example.com" }));
    render(<Probe />);
    expect(screen.getByText("ada@example.com")).toBeInTheDocument();
  });

  it("reports signed out when no token is stored", () => {
    render(<Probe />);
    expect(screen.getByText("signed-out")).toBeInTheDocument();
  });
});
