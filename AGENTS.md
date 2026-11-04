# Agent rules

This file is the entry point. The rules live in `docs/`. Do not copy them here.

## Read before writing code

| When | Read |
|---|---|
| Any code change | `docs/05-conventions.md` |
| Where a file goes | `docs/04-directory-structure.md` |
| Auth, errors, data flow, or configuration | `docs/03-architecture.md` |
| What this phase includes | `docs/07-implementation-plan.md` |
| Before you treat a change as done | `docs/06-quality-checks.md` |

`docs/01-findings-and-open-questions.md` and `docs/02-technology-stack.md` record why the plan looks like this. Read them when a task seems to need a new library or a different architecture. Do not add a runtime dependency that those documents rejected.

## Commands

Run these on the host with pnpm, from this directory. Node must be `>=24.22.0 <25`. After `corepack enable`, `pnpm` is the version in `packageManager`. After a code change, run the first five in the order listed. The others run only when their own condition applies.

| Command | What it does | When to run it |
|---|---|---|
| `pnpm format` | Prettier, including Tailwind class sorting. Writes the formatting fixes. | First, after a code change. |
| `pnpm lint --fix` | ESLint. Writes the safe fixes. Remaining findings are fixed by hand. | After `pnpm format`. It does not replace format. |
| `pnpm typecheck` | Generates Next.js route types, then runs `tsc --noEmit`. | After lint, on any code change. |
| `pnpm test` | Vitest. Covers frontend-only logic such as schemas, error mapping, session, and transports. | After typecheck, on any code change. |
| `pnpm build` | `next build` with the static export. Catches features the export does not support. | Last, before a change is treated as done. |
| `pnpm dev` | Starts the Next.js dev server. | While developing locally. The API must be running, and `NEXT_PUBLIC_API_BASE_URL` must be its origin. |
| `pnpm api:export` | Fetches `/openapi.json` from the `NEXT_PUBLIC_API_BASE_URL` origin and writes `openapi/openapi.json`. | When the API contract changes, before `pnpm api:generate`. The API must be running. |
| `pnpm api:generate` | Regenerates `src/shared/api/generated` from the OpenAPI snapshot. | After `pnpm api:export`. Do not edit the generated file by hand. |
| `pnpm test:e2e` | Playwright. Serves the built `out/` and runs journeys against the real API. | After `pnpm build`, with the API running. |

Details, including CI, coverage, and end-to-end checks, stay in `docs/06-quality-checks.md`.

<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
