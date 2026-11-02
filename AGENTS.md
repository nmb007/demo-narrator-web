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

Run these on the host with pnpm, from this directory, in this order. Node must be `>=24.22.0 <25`. After `corepack enable`, `pnpm` is the version in `packageManager`.

| Command | What it does | When to run it |
|---|---|---|
| `pnpm format` | Prettier, including Tailwind class sorting. Writes the formatting fixes. | First, after a code change. |
| `pnpm lint --fix` | ESLint. Writes the safe fixes. Remaining findings are fixed by hand. | After `pnpm format`. It does not replace format. |
| `pnpm typecheck` | Generates Next.js route types, then runs `tsc --noEmit`. | After lint, on any code change. |
| `pnpm test` | Vitest. Covers frontend-only logic such as schemas, error mapping, session, and transports. | After typecheck, on any code change. |
| `pnpm build` | `next build` with the static export. Catches features the export does not support. | Last, before a change is treated as done. |

Details, including CI, coverage, and end-to-end checks, stay in `docs/06-quality-checks.md`.
