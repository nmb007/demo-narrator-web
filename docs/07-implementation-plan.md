# 7. Phased Implementation Plan

Each phase ends at a review point. The next phase starts only after the exit criteria are met and you have approved them.

## Phase 1: Signup page

**Why this slice.** It is the first review of the plan in code. Signup uses the pieces every later form will copy, and it does not need upload, polling, or download.

- static export and the prerendered shell
- React Hook Form, Zod, and one TanStack mutation
- the OpenAPI path written once in `features/auth/api.ts`
- the error normalizer (409 on email, 422 field errors)
- the session store, because a successful signup logs in with the same credentials
- Vitest for the schema and the error map
- one Playwright test against the built `out/` and the real API

### 1.0 Backend prerequisite (small PR in `demo-narrator`)

- `CORSMiddleware`, driven by a `CORS_ALLOW_ORIGINS` setting, configured as in section 1.6.
- Add `http://localhost:3000` to the local `.env.example`.

A public HTTPS API is not required for this phase. Local FastAPI is enough.

### 1.1 Minimal foundation (only what signup needs)

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
   - a CI workflow running the stages in 6.2, with `@fast` limited to the signup journeys
4. Add `scripts/export-openapi.mjs`, commit `openapi/openapi.json`, and add `pnpm api:generate`.
5. Shared layer, limited to what signup uses:
   - `shared/config/env.ts`
   - `shared/api` (client, errors, types)
   - `shared/query/query-client.ts`
   - `shared/session`
   - `shared/ui`: button, field, input, label, alert
6. `AGENTS.md` already exists. Keep it a pointer to the docs. Do not paste the conventions into it.

### 1.2 Signup

- `/signup` with email and password. The schema matches the API: email, password 8–128.
- Submit calls `useSignup()` in `features/auth/api.ts`. That function writes `POST /v1/auth/signup` once. On `201` it logs in with the same credentials and stores the token.
- A `409` sets a field error on email. A `422` sets field errors from `ApiError.fieldErrors`.
- Success redirects to a signed-in placeholder. The placeholder shows the email from the token and a logout control that clears the session. It is not the upload page.
- `/` sends a signed-out visitor to `/signup` and a signed-in visitor to the placeholder.
- There is no `/login` page in this phase.

### Exit criteria

- [ ] Format, lint, types, unit tests, `next build`, and the signup Playwright test pass.
- [ ] A manual walkthrough of the built `out/` against the local API creates an account, shows the placeholder, and logs out.
- [ ] You have reviewed the code shape (boundaries, the single path literal, the form, the session) before any other page is added.

## Phase 2: Log in, upload, watch, download

This is the rest of the first end-to-end path. It starts only after the Phase 1 review.

- **Login and logout.** `/login` with the `?reason=expired` and `?next=` round trip, the `(app)` guard, the user menu, the expiry timer, and the global 401 handling.
- **Upload.** `/videos/new` with client checks for extension and size, the advanced options, progress, cancel, and inline 413/415/422 errors. Success seeds the new run into the cache and opens `/run?id=…`.
- **Run status.** The step timeline, polling, the failure message, `loading` and not-found states.
- **Download.** A Blob download, enabled only when the run succeeded and included `mux`.
- **Spikes,** each recorded as an ADR: a 100 MB cross-origin upload, a Blob download in Chrome, Firefox, and Safari, and the session guard on a built `out/` with no hydration warning.

Exit: a manual walkthrough goes from login through a real upload to a downloaded MP4, and the `@fast` journeys for this phase are green.

## Phase 3: Retry, preview, and first deploy

- **Retry (R6)** on the run page:
  - step checkboxes in pipeline order (default: all)
  - the shared options fields
  - a message when a run is already in progress (409)
  - navigation to the new run when it starts
- **Preview (R8):** `<video>` playing from the Blob URL.
- **First deployment:** a Cloudflare Pages project with preview and production environments, plus production CORS origins on the API.
- **Polish:** empty states, toasts, focus management, responsive layout.
- **Testing:** the `@slow` E2E suite runs nightly.

Exit: R2–R6 and R8 work end to end on a deployed preview against a deployed API.

## Phase 4: Library and history (after the backend adds list endpoints)

Prerequisite: backend PRs for `GET /v1/auth/me`, `GET /v1/videos` (paginated), and `GET /v1/videos/{video_id}` with its runs.

- Refresh the OpenAPI snapshot and regenerate the types.
- `/videos`: a paginated list showing each video's latest run status. Page and filter are kept in the URL search params.
- `/video?id=…`: run history, the latest output, and retry.
- Get the user menu data from `/me` instead of the token claims.
- **Decision point:** evaluate `openapi-react-query` and `nuqs` now that there are more endpoints and URL state. Record an ADR either way.

Exit: R7 is delivered.

## Phase 5: Hardening

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
