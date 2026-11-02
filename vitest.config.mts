import path from "node:path";
import { fileURLToPath } from "node:url";

import { defineConfig } from "vitest/config";

const root = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  resolve: {
    alias: {
      "@": path.join(root, "src"),
    },
  },
  test: {
    environment: "jsdom",
    setupFiles: ["./tests/setup.ts"],
    exclude: ["e2e/**", "node_modules/**"],
    env: {
      NEXT_PUBLIC_API_BASE_URL: "http://localhost:8000",
      NEXT_PUBLIC_UPLOAD_MAX_BYTES: "104857600",
      NEXT_PUBLIC_APP_ENV: "local",
    },
    coverage: {
      provider: "v8",
      include: [
        "src/shared/**/*.{ts,tsx}",
        "src/features/**/{domain,schemas,errors}.ts",
        "src/features/**/transport/**/*.ts",
      ],
      exclude: ["src/shared/ui/**", "src/shared/api/generated/**"],
      thresholds: {
        lines: 90,
        branches: 85,
      },
    },
  },
});
