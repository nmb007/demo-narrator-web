import { existsSync } from "node:fs";
import { mkdir, writeFile } from "node:fs/promises";

if (existsSync(".env.local")) {
  process.loadEnvFile(".env.local");
}

const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
if (baseUrl === undefined || baseUrl === "") {
  throw new Error(
    "Set NEXT_PUBLIC_API_BASE_URL to the API origin, then run pnpm api:export.",
  );
}

let openApiUrl;
try {
  openApiUrl = new URL("/openapi.json", baseUrl);
} catch {
  throw new Error(`NEXT_PUBLIC_API_BASE_URL is not a valid URL: ${baseUrl}`);
}

const response = await fetch(openApiUrl);
if (!response.ok) {
  throw new Error(
    `Could not export OpenAPI from ${openApiUrl} (${response.status}). Is the API running?`,
  );
}
const document = await response.json();
await mkdir("openapi", { recursive: true });
await writeFile(
  "openapi/openapi.json",
  `${JSON.stringify(document, null, 2)}\n`,
);
console.log(`Wrote openapi/openapi.json from ${openApiUrl}`);
