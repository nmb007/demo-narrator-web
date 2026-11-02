import type { NextConfig } from "next";

import { env } from "./src/shared/config/env";

// Importing the env module fails the build when a public value is missing or invalid.
void env.apiBaseUrl;

const nextConfig: NextConfig = {
  output: "export",
  reactCompiler: true,
  typedRoutes: true,
  trailingSlash: false,
  images: {
    unoptimized: true,
  },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
