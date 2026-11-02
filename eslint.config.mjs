import { defineConfig, globalIgnores } from "eslint/config";
import importPlugin from "eslint-plugin-import";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";
import pluginQuery from "@tanstack/eslint-plugin-query";

const serverOnlyImports = [
  {
    name: "next/headers",
    message: "A static export has no request headers.",
  },
  {
    name: "next/server",
    message: "A static export has no server runtime.",
  },
  {
    name: "server-only",
    message: "A static export has no server runtime.",
  },
];

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  ...pluginQuery.configs["flat/recommended"],
  {
    plugins: {
      import: importPlugin,
    },
    rules: {
      "@typescript-eslint/no-explicit-any": "error",
      "@typescript-eslint/consistent-type-imports": "error",
      "no-restricted-syntax": [
        "error",
        {
          selector: "JSXAttribute[name.name='dangerouslySetInnerHTML']",
          message: "Do not use dangerouslySetInnerHTML.",
        },
      ],
      "import/no-restricted-paths": [
        "error",
        {
          zones: [
            { target: "./src/shared", from: "./src/features" },
            { target: "./src/shared", from: "./src/app" },
            { target: "./src/features", from: "./src/app" },
            {
              target: "./src/features/auth",
              from: "./src/features",
              except: ["./auth"],
            },
            { target: "./src/app", from: "./src/shared/api/generated" },
            { target: "./src/features", from: "./src/shared/api/generated" },
            {
              target: "./src/shared/config",
              from: "./src/shared/api/generated",
            },
            {
              target: "./src/shared/query",
              from: "./src/shared/api/generated",
            },
            {
              target: "./src/shared/session",
              from: "./src/shared/api/generated",
            },
            { target: "./src/shared/ui", from: "./src/shared/api/generated" },
            { target: "./src/shared/lib", from: "./src/shared/api/generated" },
          ],
        },
      ],
    },
  },
  {
    files: ["src/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-imports": ["error", { paths: serverOnlyImports }],
    },
  },
  {
    files: ["src/**/*.{ts,tsx}"],
    ignores: [
      "src/features/*/api.ts",
      "src/features/*/transport/**",
      "src/**/*.test.ts",
      "src/**/*.test.tsx",
    ],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          paths: [
            ...serverOnlyImports,
            {
              name: "@/shared/api/client",
              message: "Call the API from the feature's api.ts.",
            },
          ],
        },
      ],
    },
  },
  {
    files: ["src/**/*.{ts,tsx}"],
    ignores: ["src/shared/session/**"],
    rules: {
      "no-restricted-globals": [
        "error",
        {
          name: "localStorage",
          message: "Only shared/session may read or write the token.",
        },
        {
          name: "sessionStorage",
          message: "Only shared/session may read or write the token.",
        },
      ],
      "no-restricted-properties": [
        "error",
        {
          object: "window",
          property: "localStorage",
          message: "Only shared/session may read or write the token.",
        },
        {
          object: "window",
          property: "sessionStorage",
          message: "Only shared/session may read or write the token.",
        },
      ],
    },
  },
  globalIgnores([
    ".next/**",
    "out/**",
    "build/**",
    "coverage/**",
    "next-env.d.ts",
    "src/shared/api/generated/**",
  ]),
]);

export default eslintConfig;
