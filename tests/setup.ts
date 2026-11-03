import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterEach } from "vitest";

import { clearSession } from "@/shared/session/session-store";

afterEach(() => {
  cleanup();
  localStorage.clear();
  clearSession();
});
