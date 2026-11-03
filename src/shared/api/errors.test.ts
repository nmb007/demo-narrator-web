import { describe, expect, it } from "vitest";

import { ApiError, normalizeFastApiError } from "@/shared/api/errors";

describe("normalizeFastApiError", () => {
  it("describes a network failure", () => {
    const error = normalizeFastApiError(0, null, "");
    expect(error.status).toBe(0);
    expect(error.message).toMatch(/couldn't reach the server/i);
  });

  it("joins repeated messages for one field", () => {
    const error = normalizeFastApiError(
      422,
      {
        detail: [
          { loc: ["body", "password"], msg: "Too short", type: "value_error" },
          { loc: ["body", "password"], msg: "Too common", type: "value_error" },
          "skip",
          { loc: ["body"], msg: "no field", type: "value_error" },
          { msg: "missing loc" },
        ],
      },
      "req",
    );
    expect(error.fieldErrors.password).toBe("Too short Too common");
    expect(error.requestId).toBe("req");
  });

  it("uses a generic message for a 5xx body", () => {
    const error = normalizeFastApiError(503, { detail: "disk full" }, "req");
    expect(error.message).toBe("Something went wrong. Try again.");
  });

  it("keeps a 409 detail string", () => {
    const error = normalizeFastApiError(
      409,
      { detail: "Email already registered" },
      "req",
    );
    expect(error.message).toBe("Email already registered");
  });

  it("uses a generic message when the body has no detail", () => {
    const error = normalizeFastApiError(400, {}, "req");
    expect(error.message).toBe("Something went wrong. Try again.");
  });
});

describe("ApiError", () => {
  it("keeps its name", () => {
    expect(new ApiError(400, "no", {}, "id").name).toBe("ApiError");
  });
});
