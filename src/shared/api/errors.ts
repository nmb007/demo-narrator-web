const GENERIC_MESSAGE = "Something went wrong. Try again.";
const NETWORK_MESSAGE =
  "We couldn't reach the server. Check your connection and try again.";

export class ApiError extends Error {
  readonly status: number;
  readonly fieldErrors: Readonly<Record<string, string>>;
  readonly requestId: string;

  constructor(
    status: number,
    message: string,
    fieldErrors: Record<string, string>,
    requestId: string,
  ) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.fieldErrors = fieldErrors;
    this.requestId = requestId;
  }
}

export function normalizeFastApiError(
  status: number,
  body: unknown,
  requestId: string,
): ApiError {
  if (status === 0) {
    return new ApiError(0, NETWORK_MESSAGE, {}, requestId);
  }

  const detail = readDetail(body);
  if (status === 422 && Array.isArray(detail)) {
    return new ApiError(
      422,
      "Check the highlighted fields.",
      fieldErrorsFromDetail(detail),
      requestId,
    );
  }

  if (status >= 500) {
    return new ApiError(status, GENERIC_MESSAGE, {}, requestId);
  }

  const message =
    typeof detail === "string" && detail.length > 0 ? detail : GENERIC_MESSAGE;
  return new ApiError(status, message, {}, requestId);
}

function readDetail(body: unknown): unknown {
  if (!isRecord(body) || !("detail" in body)) {
    return undefined;
  }
  return body.detail;
}

function fieldErrorsFromDetail(detail: unknown[]): Record<string, string> {
  const fieldErrors: Record<string, string> = {};
  for (const item of detail) {
    if (!isRecord(item)) {
      continue;
    }
    const message =
      typeof item.msg === "string" ? item.msg : "Check this field.";
    const field = fieldName(item.loc);
    if (!field) {
      continue;
    }
    const existing = fieldErrors[field];
    fieldErrors[field] = existing ? `${existing} ${message}` : message;
  }
  return fieldErrors;
}

function fieldName(loc: unknown): string | null {
  if (!Array.isArray(loc)) {
    return null;
  }
  for (let index = loc.length - 1; index >= 0; index -= 1) {
    const part = loc[index];
    if (typeof part === "string" && part !== "body") {
      return part;
    }
  }
  return null;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}
