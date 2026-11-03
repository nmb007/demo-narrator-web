export function testToken(
  overrides: Record<string, unknown> = {},
  expOffsetSeconds = 3600,
): string {
  const header = Buffer.from(
    JSON.stringify({ alg: "none", typ: "JWT" }),
  ).toString("base64url");
  const body = Buffer.from(
    JSON.stringify({
      sub: "user-1",
      email: "you@example.com",
      exp: Math.floor(Date.now() / 1000) + expOffsetSeconds,
      ...overrides,
    }),
  ).toString("base64url");
  return `${header}.${body}.sig`;
}
