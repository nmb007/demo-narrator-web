# 5. Coding and Architectural Conventions

These rules become binding once they are approved. At scaffold time, `AGENTS.md` points here and at `docs/06-quality-checks.md`. It lists the commands. It does not copy these documents.

## 5.1 Architecture

1. Imports only point downward: `app` → `features` → `shared` → `shared/api/generated`. A feature never imports another feature. This is enforced by `import/no-restricted-paths`.
2. Prefer what Next.js and React already provide. Each new runtime dependency needs a one-paragraph ADR in `docs/adr/` that covers the problem, the built-in option that was rejected, and why.
3. There is no global client store without an ADR. Server data lives only in the TanStack Query cache.
4. Generated code is read-only. To change it: change the backend, run `pnpm api:export`, then run `pnpm api:generate`.
5. Every feature must keep working under `output: 'export'`. Do not use Server Actions, Route Handlers, `cookies()`/`headers()`, `proxy.ts`, `next.config` redirects/rewrites/headers, dynamic segments without static params, or the `next/image` optimizer. `next build` fails on most of these, so run it before opening a PR.

## 5.2 Rendering and the browser boundary

1. Page files stay thin. They render the static structure plus feature client components. Data, session, and browser APIs live in client components and hooks.
2. Never touch `window`, `document`, `sessionStorage`, `localStorage`, or `navigator` at module scope or during render. Use effects, event handlers, or `useSyncExternalStore` with a server snapshot. The build prerenders in Node, so breaking this rule causes a crash or a hydration mismatch.
3. Put `'use client'` at the highest component that needs it inside a feature, not on pages or layouts. The exceptions are `providers.tsx` and the guard components.
4. Every component that calls `useSearchParams()` is rendered inside `<Suspense>` with a skeleton fallback.
5. Do not create barrel `index.ts` files. Import concrete files.

## 5.3 Data access (TanStack Query)

1. Only `features/*/api.ts` and `features/*/transport/*` call the API. Components use the hooks and `queryOptions` from `api.ts`.
2. Query keys come from factories in `api.ts`, in the form `['narration', 'run', runId]`. Never write ad-hoc string keys in components.
3. Prefer `queryOptions()` factories, so the same definition serves `useQuery`, `prefetchQuery`, and `setQueryData` without retyping.
4. Write each OpenAPI path once, inside its factory in `api.ts`. This applies to every endpoint, not only reads. `openapi-fetch` types a call only when the path is a string literal, so that literal stays in the factory. Screens and other features call the factory. For example, `client.GET("/v1/runs/{run_id}", …)` is written inside `runQuery(id)`, and screens call `useQuery(runQuery(id))`.
5. Polling uses `refetchInterval` as a function that returns `false` at a terminal status. Do not write `setInterval` by hand.
6. After a mutation, update the cache explicitly with `setQueryData` or `invalidateQueries`, then navigate.
7. 401 is handled globally. Features never handle it.
8. Validate the URL param (`?id=`) as a UUID with Zod before running the query. If it is invalid, render the not-found state.
9. Never put a TanStack `data` object into `useState`.

## 5.4 Forms and validation

1. Every form uses React Hook Form with `zodResolver(<Schema>)`. Schemas live in the feature's `schemas.ts`.
2. Form field names match the API field names (`max_atempo`), so FastAPI 422 `loc` values map to fields directly.
3. Submitting calls `mutation.mutate()`. React Hook Form never calls `fetch`, and mutations never hold field state.
4. Server errors are mapped in `onError`:
   - `ApiError.fieldErrors` goes to `setError(field)`.
   - Anything else goes to a form-level message from the feature's `errors.ts`.
5. Schemas and HTML attributes mirror the limits the browser can enforce: password 8–128, allowed extensions, `max_atempo > 0`, and upload size from `env`. Duration is not a frontend rule. A 422 from FastAPI is shown on the form. The backend still has the final say.
6. Submit buttons are disabled while `isPending`. Focus moves to the first invalid field after a failed submit, which is React Hook Form's default `shouldFocusError`.

## 5.5 Errors and loading

1. Every query view renders four states explicitly: pending (skeleton), error (message with "Try again" and the request ID), empty or not found, and data. Background refetches never replace data with a spinner.
2. User-facing messages say what happened and what the user can do next. Do not use HTTP jargon. For 5xx errors, never show raw backend text.
3. A pipeline failure (`status: failed`) is data, not an exception. It has its own UI.
4. `error.tsx` boundaries catch render bugs and are not used for API errors.

## 5.6 Session and security

1. Only `shared/session` reads or writes the token. Nothing else touches web storage for auth.
2. The token is never logged, put in a URL, or passed to third-party code.
3. Every redirect target taken from `?next=` goes through `safeRedirect()`.
4. Do not use `dangerouslySetInnerHTML`. Do not add third-party scripts, CDNs, or analytics without updating the CSP and writing an ADR.
5. Every `NEXT_PUBLIC_*` value is public. No secrets go into frontend config.
6. Blob URLs are revoked when they are no longer needed (`use-object-url`).

## 5.7 TypeScript

1. Use `strict`, `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`, and `verbatimModuleSyntax`. Do not use `any`; take values in as `unknown` and narrow them.
2. API types come from `shared/api/types.ts`, which aliases the generated schema. Never redeclare backend types by hand.
3. Use the generated string unions for `RunStatus` and `NarrationStep`, with `as const` arrays for their order. Do not use TypeScript `enum`. A `switch` over a status must be exhaustive, which lint enforces.
4. Use named exports everywhere, except the files where Next.js requires a default export (`page`, `layout`, `error`, `not-found`, `global-error`).

## 5.8 Naming

| Item | Convention | Example |
|---|---|---|
| Files and folders | `kebab-case` | `run-status-card.tsx` |
| Components | `PascalCase` named export | `RunStatusCard` |
| Hooks | `useCamelCase` | `useUploadVideo` |
| Query option factories | noun + `Query` | `runQuery(id)` |
| Mutations | `use` + verb + noun | `useRetryRun` |
| Zod schemas | `PascalCase` + `Schema`; the inferred type drops the suffix | `RetrySchema`, `type Retry` |
| Unit tests | `*.test.ts(x)`, next to the source file | `errors.test.ts` |
| E2E tests | `*.spec.ts` in `e2e/` | `narrate.spec.ts` |
| Imports | `@/` → `src/`; relative paths only inside the same feature | `@/shared/api/client` |

## 5.9 Styling and accessibility

1. Use Tailwind utilities. Design tokens are defined only in `@theme`, so components contain no hex values.
2. Compose classes with `cn()` and define variants with `cva`.
3. Features compose primitives from `shared/ui` and never fork them.
4. Accessibility checklist:
   - every input has a label
   - errors are linked with `aria-describedby`
   - progress uses a real progress element with a value
   - run status changes are announced with `aria-live="polite"`
   - every action works from the keyboard
   - visible focus rings
5. Use `next/font` for fonts. Images use plain `<img>` only through a shared component, because the image optimizer is unavailable in a static export. Turn off `@next/next/no-img-element` only in that component.

## 5.10 Testing

1. Unit-test pure logic (`domain`, `errors`, schemas, `safe-redirect`, `claims`), the session store, and the transports (XHR progress and abort, Blob filename parsing). Presentational components get a test only when they have real branching. Pass data in as props.
2. Do not stand up a mock API. The FastAPI suite owns response status and body. A unit test that must avoid the network passes a stub `fetch` into `openapi-fetch`, or stubs `XMLHttpRequest` inside that one test.
3. Use fake timers for the session expiry timer. Never use real `sleep`. Polling behavior is covered by Playwright against a real run, not by a fake interval in jsdom.
4. Playwright covers every user journey on the **built** `out/` (not `next dev`) against the real API. Seed users through the API, except in the signup test. Use web-first assertions and never `waitForTimeout`. Use `page.route` only for a UI state that is costly to produce (oversized upload, dropped connection).
5. Every bug fix comes with a test that fails without the fix. An API-contract bug is fixed with a FastAPI test. A UI bug is fixed with a Vitest or Playwright test.

## 5.11 Node and pnpm

1. Do not commit a change that requires a different Node major. `pnpm install` must succeed on `>=24.22.0 <25`.
2. When raising the Node floor, change `.node-version`, `.nvmrc`, and `engines.node` in the same commit. The two version files always contain the same exact patch.
3. Install with pnpm only. `packageManager` is what Corepack enforces when someone runs `pnpm`. npm and Yarn ignore that field, so they are kept out by the README and by CI, which installs from `pnpm-lock.yaml` with `--frozen-lockfile`.
4. A new machine follows the README: a Node 24 at or above the version file, then `corepack enable`, then `pnpm install`.

## 5.12 Git and review

1. Use Conventional Commits.
2. A PR that changes `openapi/openapi.json` includes the regenerated types and links the backend change.
3. A PR that adds a dependency includes its ADR. A PR that changes the CSP explains why.
