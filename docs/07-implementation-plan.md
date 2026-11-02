# 7. Phased Implementation Plan

Each phase ends at a review point. The next phase starts only after the exit criteria are met and you have approved them.

## Phase 1: Vertical slice — log in, upload, watch, download

**Why this slice.** It runs through every layer and every risky integration in one thin path:

- static export with prerendered shells
- client session store and route guard
- React Hook Form + Zod + TanStack mutation (login)
- cross-origin XHR upload with progress
- TanStack Query polling
- Blob download
- error normalizer and the global 401 path
- Vitest tests of the pure frontend logic
- Playwright tests against the built `out/` and the real API

If an assumption is wrong, it shows up here, before more features exist.

### 1.0 Backend prerequisite (small PR in `demo-narrator`)

- `CORSMiddleware`, driven by a `CORS_ALLOW_ORIGINS` setting, configured as in section 1.6.
- Add `http://localhost:3000` to the local `.env.example`.

### 1.1 Minimal foundation (only what the slice needs)

1. Scaffold with `create-next-app@16.4.3`:
   - TypeScript, App Router, `src/`, Tailwind, ESLint, Turbopack
   - pin TypeScript to `~6.0.3`
   - add `.node-version` and `.nvmrc`, both containing `24.22.0`
   - add `packageManager` with the exact pnpm version and its integrity hash
   - add `engines.node` (`>=24.22.0 <25`), `engines.pnpm` for that pnpm major, and `.npmrc` with `engine-strict=true`
2. `next.config.ts`: `output: 'export'`, `reactCompiler`, `typedRoutes`, `images.unoptimized`, and env validation.
3. Tooling:
   - Prettier
   - the ESLint project rules from 6.3
   - Vitest + React Testing Library (no MSW)
   - Playwright + `serve`
   - the scripts from 6.1
   - a CI workflow running the stages in 6.2
4. Add `scripts/export-openapi.mjs`, commit `openapi/openapi.json`, and add `pnpm api:generate`.
5. Shared layer:
   - `shared/config/env.ts`
   - `shared/api` (client, errors, types)
   - `shared/query/query-client.ts`
   - `shared/session`
   - `shared/ui` (button, field, input, label, alert, progress, card, skeleton, sonner)
   - `safeRedirect`
6. Add a baseline `public/_headers`, and add `AGENTS.md` containing sections 5 and 6.

### 1.2 Spikes (time-boxed; each result is recorded as an ADR)

- 100 MB cross-origin XHR upload: preflight, progress events, and long server-side processing.
- Blob download and preview on Chrome, Firefox, and Safari: memory use, filename, seeking.
- Hydrating the session guard: no flash of protected content, no hydration warnings on the built `out/`.
- Strict CSP with Next.js inline bootstrap scripts: can the hashes be generated after the build?

### 1.3 Features

- **Login and logout.** `/login` with the `?reason=expired` and `?next=` round trip, the `(app)` guard, the user menu, the expiry timer, and the global 401 handling.
- **Upload.** `/videos/new`:
  - file picker with client pre-checks
  - collapsed "Advanced" section for voice, model, and `max_atempo`
  - progress bar, then a "validating" state
  - cancel button
  - inline 413/415/422 errors
  - on success, the new run is seeded into the cache and the app navigates to `/run?id=…`
- **Run status.** `/run?id=…` with a step timeline, status badge, timestamps, the failure message, polling with an `aria-live` announcement, and not-found and error states.
- **Download.** A Blob download, enabled only when the run succeeded and included `mux`. A 404 response shows "not ready".

### Exit criteria

- [ ] All checks in 6.2 are green, including the `@fast` E2E tests for these journeys.
- [ ] Each spike has an ADR, and these documents are updated where a spike changed the plan.
- [ ] A manual walkthrough of the built `out/` against the local stack works from a real upload to a downloaded MP4.
- [ ] You have reviewed the code shape before more features are added.

## Phase 2: Remaining capabilities the backend already supports

- **Signup (R1):** log in automatically after signup. A 409 sets a field error on the email field.
- **Retry (R6)** on the run page:
  - step checkboxes in pipeline order (default: all)
  - the shared options fields
  - a message when a run is already in progress (409)
  - navigation to the new run when it starts
- **Preview (R8):** `<video>` playing from the Blob URL.
- **First deployment:** a Cloudflare Pages project with preview and production environments, plus production CORS origins on the API.
- **Polish:** empty states, toasts, focus management, responsive layout.
- **Testing:** the `@slow` E2E suite runs nightly.

Exit: R1–R6 and R8 work end to end on a deployed preview against a deployed API.

## Phase 3: Library and history (after the backend adds list endpoints)

Prerequisite: backend PRs for `GET /v1/auth/me`, `GET /v1/videos` (paginated), and `GET /v1/videos/{video_id}` with its runs.

- Refresh the OpenAPI snapshot and regenerate the types.
- `/videos`: a paginated list showing each video's latest run status. Page and filter are kept in the URL search params.
- `/video?id=…`: run history, the latest output, and retry.
- Get the user menu data from `/me` instead of the token claims.
- **Decision point:** evaluate `openapi-react-query` and `nuqs` now that there are more endpoints and URL state. Record an ADR either way.

Exit: R7 is delivered.

## Phase 4: Hardening

- Enforce the CSP, add the CSP regression check, and add `@axe-core/playwright` and the nightly `@cross-browser` run.
- Bundle review and Knip, and group Renovate updates.
- Backend upgrades, in order:
  1. signed download URLs, which remove the in-memory Blob limit
  2. refresh tokens, for longer sessions and real logout. If the API and the frontend end up on the same registrable domain, also consider moving the token into an `httpOnly` cookie set by FastAPI.
  3. `/narration/options`, which removes the duplicated constants
- Write a release runbook covering per-environment builds, rollback (redeploying a previous CDN deployment), and the API CORS checklist.

Exit: a production release has been rehearsed, with an enforced CSP and no serious or critical accessibility violations.

## Change control

A decision here may change because of a spike or a phase result. Every such change is recorded as an ADR in `docs/adr/`, and these documents are updated in the same PR.
