# 6. Automated Quality Checks

All checks run on the host with pnpm and Node 24. The backend runs in Docker only for E2E tests and for exporting the OpenAPI document. The commands below are planned `package.json` scripts.

## 6.1 After every change (local, in order)

| # | Command | Tool | Catches |
|---|---|---|---|
| 1 | `pnpm format` | Prettier, including Tailwind class sorting | Formatting problems. Writes the fixes. |
| 2 | `pnpm lint --fix` | ESLint (rules in 6.3) | Lint violations. Writes the safe fixes; the rest must be fixed by hand. |
| 3 | `pnpm typecheck` | `next typegen && tsc --noEmit` | Type errors, broken typed routes, misuse of the API contract |
| 4 | `pnpm test` | Vitest | Regressions in frontend-only logic (schemas, error mapping, session, transports) |
| 5 | `pnpm build` (before pushing) | `next build` with `output: 'export'` | Features that static export does not support, a missing `Suspense` around `useSearchParams`, prerender crashes from browser APIs used during render, invalid env values |

`format` and `lint` are separate jobs. Running one does not replace the other.

## 6.2 CI pipeline (every pull request)

| Stage | Check | Fails when |
|---|---|---|
| Setup | `actions/setup-node` with `node-version-file: '.node-version'`, then `pnpm/action-setup` with no version (it reads `packageManager`) | CI is not on Node `24.22.0`, or not on the pinned pnpm |
| Install | `pnpm install --frozen-lockfile` | The lockfile is out of sync, or Node is outside `>=24.22.0 <25` (`engine-strict`) |
| Format | `prettier --check .` | Any file is unformatted |
| Lint | `eslint . --max-warnings=0` | Any error or warning |
| Types | `next typegen && tsc --noEmit` | Any type error |
| Contract | `pnpm api:generate && git diff --exit-code src/shared/api/generated` | The generated types differ from the committed `openapi.json` |
| Unit | `vitest run --coverage` | A test fails, or coverage of the pure modules in 6.4 drops below the threshold |
| Build | `next build` (with CI env values) | Same as row 5 in 6.1 |
| Output check | A script asserts that `out/` contains `index.html`, `login.html`, `videos/upload.html`, `run.html`, `404.html`, and `_headers` | A route or the headers file is missing from the export |
| Bundle budget | A script sums the gzipped JS loaded on first visit to each route and compares it to the budget (for example 180 kB) | The budget is exceeded. This matters because everything renders on the client. |
| E2E (fast) | Playwright on Chromium. It serves `out/` on `:3000`, and the backend Compose stack (`db`, `redis`, `api`, `worker`) runs with CORS for `http://localhost:3000`. Journeys hit the real API. | Any journey fails. Traces and screenshots are uploaded. |
| Deploy preview | CDN preview build for the PR | The build or deploy fails |

## 6.3 Lint rules beyond `eslint-config-next`

| Rule | Purpose |
|---|---|
| `import/no-restricted-paths` zones: no imports between features; `shared/**` cannot import `features/**` or `app/**`; only `shared/api/*` may import `shared/api/generated` | Enforces the dependency direction (section 3.2) |
| `no-restricted-imports`: `@/shared/api/client` only from `features/*/api.ts` and `features/*/transport/*`; `next/headers`, `next/server`, and `server-only` banned everywhere | Keeps data access in one layer and blocks APIs that only work with a server |
| `no-restricted-globals` / `no-restricted-properties` for `sessionStorage` and `localStorage` outside `shared/session` | Token storage has a single owner |
| `@tanstack/eslint-plugin-query` (recommended preset) | Stable query keys, exhaustive dependencies in query functions, no rest-destructuring of query results |
| `@typescript-eslint/no-explicit-any`, `consistent-type-imports`, `no-floating-promises`, `switch-exhaustiveness-check` | Type safety and exhaustive handling of every status and step |
| `react-hooks/*` v7 (includes the React Compiler rules) | Hooks are used correctly and the code stays compatible with the compiler |
| `jsx-a11y/*` (strict) | Static accessibility errors |
| `@next/next/*` core-web-vitals | Next.js pitfalls (the `no-img-element` exception is described in 5.9) |
| `no-restricted-syntax` for `dangerouslySetInnerHTML` | Hardens against XSS |

## 6.4 Coverage thresholds (Vitest)

| Scope | Lines / branches |
|---|---|
| `src/shared/**` (except `ui/` and `api/generated/`), `features/**/{domain,schemas,errors}.ts`, `features/**/transport/*` | ≥ 90% / ≥ 85% |

There is no coverage gate on pages, query hooks, or feature components. Playwright covers those against the real API. The FastAPI suite covers response contracts.

## 6.5 End-to-end suite

| Tag | When it runs | Journeys |
|---|---|---|
| `@fast` | Every PR, on Chromium, against the real API. Phase 1 runs only the signup journeys (create an account, 409 on a taken email, 422 on a short password, logout). The other journeys arrive with the phase that builds them. | <ul><li>Signed-out visit to `/run?id=…` redirects to login, then back after login.</li><li>Wrong password shows an error.</li><li>Choosing a `.txt` file is blocked on the client.</li><li>Uploading a non-video file that passes the client check shows the API's 415 message. A file over the size limit is blocked on the client.</li><li>Uploading a 3-second `.mp4` shows progress, then the run page, with status `queued` or `running` and the timeline.</li><li>Download before the output is ready shows "not ready".</li><li>A tampered or expired token redirects to login with the expiry notice.</li><li>Logout clears the session.</li><li>An invalid `?id=` shows the not-found state.</li></ul> |
| `@slow` | Nightly or on demand. Needs `GROQ_API_KEY` and internet access. | <ul><li>Full pipeline reaches `succeeded`, the download is a non-empty file with an `.mp4` name, and the preview plays.</li><li>Retrying `[voice, mux]` with a different voice produces a new run that succeeds.</li><li>Retrying while a run is active shows the 409 message.</li></ul> |
| `@cross-browser` | Nightly | The `@fast` suite on Firefox and WebKit. Safari behavior for Blob downloads matters here. |
| `@a11y` (Phase 5) | Every PR | `@axe-core/playwright` scan of each page. Fails on serious or critical violations. |

## 6.6 Scheduled and cross-repository checks

| Check | When | Purpose |
|---|---|---|
| Spec drift: start the backend from `main`, fetch `/openapi.json`, and diff it against the snapshot | Nightly | Catch backend contract changes early |
| `pnpm audit --prod` or dependency review | Every PR and weekly | Known vulnerabilities |
| Renovate or Dependabot, grouped (Next/React, TanStack, test, lint) | Weekly | Keep dependencies current, and watch for `typescript-eslint` support of TypeScript 7 |
| CSP check: load each built page under the production `_headers` and fail on any CSP violation report | Every PR (Phase 5) | A change cannot silently break the CSP |
| Knip (optional, Phase 5) | Every PR | Unused files, exports, and dependencies |

## 6.7 Definition of done

- [ ] 6.1 steps 1–5 pass locally.
- [ ] New behavior has unit or E2E tests, following 5.10.
- [ ] The accessibility checklist in 5.9 is met.
- [ ] There is no new runtime dependency without an ADR, and no CSP change without an explanation.
- [ ] CI is green, including `next build`, the output check, the bundle budget, and `@fast` E2E.
