# 2. Technology Stack

Versions were checked on the npm registry on 2026-10-30. Behavior was checked against the official docs through Context7: Next.js v16.2.9 (the latest indexed version on the 16.x line), openapi-typescript and openapi-fetch, and Hey API.

## 2.1 Guiding rules

1. **Use what Next.js gives first.** Even in a static export, Next.js still covers routing, layouts, error and not-found boundaries, fonts, CSS, bundling, typed routes, and the React Compiler.
2. **One tool per job.** For example: TanStack Query and not SWR as well, `openapi-fetch` and not Axios as well, Vitest and not Jest as well.
3. **Add a dependency only when it removes real code or real risk**, and record why it was added.
4. **Generate what the backend already defines.** Types, enums, and paths come from the OpenAPI document.

## 2.2 Summary

| Concern | Choice | Version | Provided by Next.js? |
|---|---|---|---|
| Framework and routing | Next.js App Router, `output: 'export'` | `16.4.3` | yes |
| UI runtime | React / React DOM | `19.3.x` | peer dependency |
| Language | TypeScript, pinned (see 2.3.2) | `~6.0.3` | — |
| Build tooling | Turbopack (default) + React Compiler + `typedRoutes` | built in | yes |
| Server/API state and caching | TanStack Query | `5.105.x` | no |
| Client-side state | React state, `useSyncExternalStore` for the session, URL search params | built in | yes (React) |
| Forms | React Hook Form + `@hookform/resolvers` | `7.91.x` / `6.0.x` | no |
| Runtime validation | Zod | `4.6.x` | no |
| API contract types | `openapi-typescript` (dev) | `7.13.x` | no |
| API client | `openapi-fetch` | `0.17.x` | no |
| JWT claim decoding | `jose` (`decodeJwt` only) | `6.2.x` | no |
| Styling | Tailwind CSS | `4.3.x` | `create-next-app` default |
| Components | shadcn/ui (CLI `4.23`, copied into the repo) on `radix-ui`, `lucide-react`, `sonner` | — | no |
| Unit tests | Vitest + React Testing Library + user-event + jsdom | `5.0.x` / `16.3.x` | Next.js has a Vitest guide |
| End-to-end tests | Playwright, with `serve` for the built `out/` folder | `1.64.x` / `14.2.x` | Next.js has a Playwright guide |
| Linting | ESLint flat config + `eslint-config-next` + `@tanstack/eslint-plugin-query` | `10.x` / `16.4.3` / `5.105.x` | Next.js ships the config |
| Formatting | Prettier + `prettier-plugin-tailwindcss` | `3.9.x` | no |
| Static checks | `next typegen && tsc --noEmit` | built in | yes |
| Hosting | Static `out/` on Cloudflare Pages | — | — |

**Not chosen:** Redux, Zustand, Jotai, SWR, Axios, Formik, TanStack Form, Hey API, Orval, NextAuth/Auth.js, `@t3-oss/env-nextjs`, `nuqs`, React Router, TanStack Router, MSW, Jest, Cypress, Storybook, Biome. Each one is discussed in 2.3.

## 2.3 Decisions in detail

### 2.3.1 Build tooling: Turbopack, React Compiler, typed routes, static export

- **Choice.**
  - `next build` with `output: 'export'` writes plain HTML, CSS, and JavaScript to `out/`.
  - `reactCompiler: true` (stable in Next.js 16; needs `babel-plugin-react-compiler`).
  - `typedRoutes: true`.
  - `images.unoptimized: true`, because the default image optimizer needs a server.
  - `trailingSlash: false`, so the output is `login.html` (Cloudflare Pages serves it at `/login`).
- **Why.** The framework owns bundling, code splitting per route, and font self-hosting. The React Compiler removes most hand-written memoization, which matters more now that every component renders in the browser. With typed routes, a broken `<Link href>` is a type error.
- **Trade-offs.**
  - `next dev` runs a dev server, so it allows some things the export forbids. **`next build` is the real compatibility check** and must run in CI.
  - The React Compiler runs through Babel, which makes builds a little slower.
- **Alternatives.**
  - Vite + React Router would make a smaller, simpler SPA, but it means leaving Next.js and its conventions. You chose Next.js for those conventions.
  - Webpack (`--webpack`) is not needed.

### 2.3.2 Language: TypeScript, pinned to 6.0.x

- **Choice.** `~6.0.3` with `strict`, `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`, and `verbatimModuleSyntax`.
- **Why pinned.** npm's `latest` is 7.0.2, the native compiler. But `typescript-eslint@8.72.1`, which `eslint-config-next@16.4.3` depends on, only supports TypeScript `>=4.8.4 <6.1.0`.
- **Trade-off.** We give up TypeScript 7's speed for now. Revisit at each Next.js minor release.

### 2.3.3 Routing: the Next.js App Router, and nothing else

- **Choice.** The App Router that ships with Next.js. No second routing library.
  - A file under `src/app/` is a route: `(public)/login/page.tsx` is `/login`, `(app)/videos/new/page.tsx` is `/videos/new`.
  - Route groups `(public)` and `(app)` share layouts without adding a URL segment.
  - `layout`, `page`, `error`, `not-found`, and `global-error` are the Next.js file conventions.
  - `<Link>` and `useRouter()` from `next/navigation` do the client-side navigation. `typedRoutes: true` makes a bad `href` a type error.
  - Entity IDs stay in the query string (`/run?id=…`), not in a dynamic segment.
- **Why.** This is the convention Next.js already enforces. Client transitions, prefetch, layouts, and error boundaries come with the framework. A static export writes one HTML file per route, so deep links and reloads work on Cloudflare Pages with no rewrite rules. `error.tsx` still works, because those boundaries run in the browser.
- **Trade-offs.**
  - `/run?id=…` is less tidy than `/runs/abc`. A dynamic segment such as `/runs/[runId]` only works in a static export for ids known at build time, and run ids are created later.
  - Every component that calls `useSearchParams` must sit inside `<Suspense>`, or the build fails.
- **Rejected alternatives.**
  - React Router and TanStack Router. They duplicate the App Router.
  - A catch-all route plus a host rewrite of `/runs/*` to one HTML file. It depends on the host, and the Next.js router can mismatch on hydration.

### 2.3.4 Server/API state and caching: TanStack Query v5

- **Choice.** One `QueryClient` with these defaults:
  - `retry`: only for network errors and 5xx responses, up to 2 times.
  - `staleTime`: 0 for runs.
  - `refetchOnWindowFocus`: `true`.

  Each feature exposes `queryOptions` factories and mutation hooks (for example `runQuery(id)` and `useRetryRun()`). Polling uses `refetchInterval: (q) => isTerminal(q.state.data?.status) ? false : ms`.
- **Why.** All API data is now fetched in the browser. TanStack Query provides deduplication, caching, retries with backoff, polling that pauses when the tab is hidden, mutation state, and cache invalidation. These are exactly the parts we would otherwise write and get wrong. The Next.js SPA guide recommends a client data library for this case.
- **Trade-offs.**
  - About 13 kB gzipped.
  - There are cache concepts to learn: query keys, stale time, invalidation.
  - Devtools are optional and only for development.
- **Alternatives.**
  - **SWR**, which the Next.js docs use in their examples, is smaller, with simpler mutations and polling. It has weaker mutation and invalidation tools and no first-class `queryOptions` factories. A fair choice, but TanStack Query fits the polling and mutation-heavy flows better.
  - **`openapi-react-query` 0.5** gives typed TanStack hooks generated from the OpenAPI document. It is convenient, but it is pre-1.0, its query keys are less readable, and it saves little at 6 endpoints. Reconsider it in Phase 4.

### 2.3.5 Client-side state: no global store

- **Choice.**
  - **Session.** The token and its decoded claims live in a small module store, read through React's `useSyncExternalStore` and backed by `localStorage`. Its server snapshot is `null`, so prerendering and hydration agree. It listens to the `storage` event, so a login or logout in one tab reaches every other open tab.
  - **Server data.** Only in the TanStack Query cache, never copied into component state.
  - **UI state.** `useState` and `useReducer` in the component that owns it.
  - **Shareable view state.** URL search params (the run ID now, library filters later).
- **Why.** The session is the only state shared across the app, and the React built-in covers it in about 40 lines with no library.
- **When to add a store.** When unrelated parts of the UI share mutable client state that does not belong in the URL or the query cache. Then use Zustand and write an ADR.

### 2.3.6 Forms and runtime validation: React Hook Form + Zod

- **Choice.**
  - One Zod schema per form, in the feature's `schemas.ts`, connected with `zodResolver`.
  - Submitting calls a TanStack `useMutation`.
  - Server errors such as 409 and 422 are written back with `setError`. FastAPI's 422 `loc` maps to field names because the form fields use the API names (`max_atempo`).
  - shadcn's `Field` components render labels, descriptions, and errors with the correct ARIA wiring.
  - Zod also validates the build-time config and the `?id=` URL param.
- **Why.** Server Actions are not available in a static export. React Hook Form owns field state (touched, dirty, errors, focus on the first error). TanStack Query owns the request (pending, error, retry, cache updates). Their responsibilities do not overlap. React Hook Form is the form library that shadcn/ui documents first.
- **Trade-offs.**
  - Two libraries take part in each form. The rule is strict: React Hook Form never fetches, and mutations never hold field state.
  - Zod adds about 15 kB gzipped. Switch to `zod/mini` if the bundle budget is tight.
- **Alternatives.**
  - **React 19 form actions + `useActionState` with client functions.** No extra library, but validation display and focus management have to be written by hand, and the action's pending state overlaps with mutation state.
  - **TanStack Form.** Pairs well with Query, but it has a smaller ecosystem and less shadcn integration.
  - **Valibot.** Smaller than Zod, but less familiar.

### 2.3.7 API client and contract types: `openapi-typescript` + `openapi-fetch`

- **Choice.**
  - Commit a snapshot at `openapi/openapi.json`, exported from a local backend (finding F5).
  - Generate `src/shared/api/generated/schema.d.ts` from it. The output is types only.
  - Create one browser `openapi-fetch` client with `baseUrl = NEXT_PUBLIC_API_BASE_URL` and two middlewares:
    - **auth** adds the Bearer token from the session store.
    - **response** turns any non-2xx response into an `ApiError` and clears the session on 401.
  - Upload (XHR) and download (Blob) bypass the client, but use the generated types for their paths and responses.
- **Why.** Generated code adds nothing to the runtime bundle. Paths, parameters, bodies, responses, and enums are all checked against the contract. The client is a thin, tree-shakable layer over `fetch`.
- **Trade-offs.**
  - Responses are trusted at runtime, not validated. That is acceptable because the contract snapshot is checked for drift in CI.
  - JWT claims are parsed with Zod because they are untyped.
- **Alternatives.**
  - **Hey API 0.99.** Generates an SDK, Zod schemas, and TanStack plugins. Powerful, but pre-1.0 with frequent breaking changes, and it generates a lot of code.
  - **Orval.** Similar trade-offs to Hey API.
  - **Handwritten types.** They drift silently.

### 2.3.8 Authentication: no auth framework

- **Choice.**
  - Login posts form-urlencoded data to `/v1/auth/login` and stores `access_token` in the session store.
  - `jose.decodeJwt` reads `exp`, `email`, and `sub` for display and for scheduling the expiry. It does **not** verify the signature, which only FastAPI can do.
  - A timer logs the user out at `exp`.
  - Any 401 clears the session and redirects to `/login?reason=expired&next=…`.
- **Why.** FastAPI owns identity. Auth frameworks such as Auth.js need a server. Clerk and similar services would replace the backend's identity.
- **Trade-off.** We maintain about 80 lines of session code. The token sits in `localStorage`, where JavaScript can read it, and we accept that XSS risk (see 01 §1.5).

### 2.3.9 Styling and reusable UI: Tailwind CSS v4 + shadcn/ui

- **Choice.**
  - Tailwind 4.3 with design tokens defined via `@theme` in `globals.css`.
  - shadcn/ui components copied into `src/shared/ui`, built on Radix (`radix-ui`).
  - `lucide-react` icons, `sonner` toasts, and `next/font`, which works in a static export.
- **Why.** Tailwind generates its CSS at build time, so there is no styling runtime. shadcn/ui gives accessible primitives (dialog, field, progress, alert, toast) as source code we own.
- **Trade-offs.**
  - Long class strings. Prettier sorts them.
  - Copied components do not receive upstream fixes automatically.
- **Alternatives.**
  - CSS Modules: built in, but every accessible primitive would have to be written by hand.
  - Mantine or MUI: complete kits, but a large runtime and their own theming system.

### 2.3.10 Testing: Vitest for frontend logic, Playwright against the real API

- **Choice.**
  - **Vitest 5** with React Testing Library, user-event, and jsdom, for code that does not need the API:
    - pure logic: error normalizer, status helpers, schemas, safe redirect
    - the session store and the expiry timer, with fake timers
    - upload and download helpers (progress, abort, filename parsing) with a stub `XMLHttpRequest` or `fetch` passed in
    - presentational components that receive data as props
  - **Playwright 1.64** for user journeys. It serves the built `out/` with `serve`, against the real FastAPI stack running in Docker with CORS for `http://localhost:3000`.
  - The FastAPI suite (`tests/test_auth.py`, `test_narrate.py`, `test_runs.py`, `test_retry.py`, `test_download.py`, and the rest) remains the check that responses have the right status and body.
- **Why.** The backend tests already prove the contract. A browser mock of those same responses would duplicate them and drift. Playwright is where the UI and the API meet. Vitest stays fast because it never starts Docker.
- **Trade-offs.**
  - A frontend unit test cannot show "this page renders a 409 from the API" without either hitting the real API or faking the network. Those cases live in Playwright. `page.route` is allowed only for a UI state that is costly to produce for real, such as a 100 MB rejection or a dropped connection. It is not a second contract test.
  - Real-backend E2E is slower and needs the backend running in Docker.
- **Not chosen.**
  - **MSW.** It would replay API responses the FastAPI tests already assert. `openapi-fetch` accepts a custom `fetch` if one unit test needs a stub. That does not justify a library.
  - **Jest:** slower, and weaker native ESM support.
  - **Cypress:** overlaps with Playwright.
  - **Storybook:** not worth it until there is a design system.

### 2.3.11 Linting, formatting, static checks

- **Choice.**
  - ESLint 10 flat config: `eslint-config-next` (core-web-vitals and typescript rules, including `react-hooks` v7 compiler rules, `jsx-a11y`, `import`, and `typescript-eslint`), plus `@tanstack/eslint-plugin-query`, plus project boundary rules (`import/no-restricted-paths`).
  - Prettier for formatting.
  - `next typegen && tsc --noEmit` for types.
- **Why.** Next.js 16 removed `next lint`, and the official configuration is based on ESLint. Biome does not have Next.js- or compiler-specific rules.
- **Trade-off.** Two tools instead of one.
- **Alternative.** Biome 2.6: faster, a single tool, but its rules lack parity with these.

### 2.3.12 Configuration: build-time `NEXT_PUBLIC_*`, validated with Zod

- **Choice.**
  - `src/shared/config/env.ts` reads each `process.env.NEXT_PUBLIC_*` value **by its literal name**. Next.js only inlines a value when the name is written out in full.
  - It parses the values with Zod and exports a frozen, typed object.
  - `next.config.ts` imports the same module, so a missing or invalid value fails `next build`.
- **Why.** A static export has no runtime environment. Values are inlined at build time, which is the Next.js convention.
- **Trade-off.** One build per environment (preview, staging, production). Free CDNs build per branch anyway, so this is acceptable.
- **Alternative.** A runtime `/config.json` fetched before the app starts would allow one build for all environments, but it adds a startup request and a loading state. Revisit if promoting one build across environments becomes a requirement.
- **Rule.** Every value in the bundle is public. No secrets in frontend configuration, ever.

### 2.3.13 Same Node and pnpm on every machine

A version file by itself does not force anyone onto that version. nvm, fnm, and asdf only switch if that person installed the tool and turned on its directory hook. The enforcement that works for every developer is `pnpm install` exiting with an error.

Four committed settings do three different jobs. All of them stay.

| File | Job | Contents |
|---|---|---|
| `.node-version` and `.nvmrc` | Tell version managers and CI the **exact** patch to install. Both files hold the same text, `24.22.0`. fnm, asdf, mise, and nodenv read `.node-version`. nvm reads `.nvmrc`. GitHub Actions `actions/setup-node` reads either via `node-version-file`. | `24.22.0` |
| `package.json` `engines` | The range `pnpm install` checks. `node` is `>=24.22.0 <25`: Node 24 at or above the patch we develop on, and not Node 25 or 26. `pnpm` matches the major pinned in `packageManager`. | range, not a single patch |
| `package.json` `packageManager` | The exact pnpm. Corepack and `pnpm/action-setup` read it. Record the version at scaffold time, with the integrity hash Corepack prints (`pnpm@x.y.z+sha512.…`). npm `latest` on 2026-10-30 was `12.16.1`; use that unless scaffold shows a reason to stay on 10. | exact version + hash |
| `.npmrc` `engine-strict=true` | Makes a wrong Node fail the install. pnpm already errors when `engines.pnpm` does not match. For Node, a mismatch is only a warning unless this flag is on. With it on, `pnpm install` also refuses dependencies that declare an incompatible `engines.node`. | one line |

Why the version file is an exact patch and `engines.node` is a range: CI and version managers should all download one build, so two machines do not differ by a Node patch. A developer who already has a newer Node 24 security patch can still install. When we raise the floor, we change `.node-version`, `.nvmrc`, and the `>=` bound together.

What we do not do:

- **`.nvmrc` alone.** Anyone not using nvm, or using nvm without the shell hook, never sees it. `pnpm install` still succeeds on Node 22.
- **`engines` without `engine-strict`.** pnpm prints a warning and continues. Warnings get ignored.
- **One mandated version manager (Volta, fnm, or nvm).** Volta can switch from a `volta` key in `package.json`, but only after every developer installs Volta. The files above work with whichever manager someone already has, and `engine-strict` covers people who have none.
- **pnpm downloading Node for us** (`devEngines.runtime` with `onFail: "download"`). Scripts would use the pinned Node even when the shell `node` is something else. That split causes "it works in `pnpm dev` and fails when I type `node`". A failed install with a clear "Node >=24.22.0 <25 required" message is easier to act on.

Developer setup, written in the repo README at scaffold time: install any Node 24.22.0 or newer in the 24 line (fnm, nvm, asdf, or the nodejs.org installer), run `corepack enable`, then `pnpm install`. Corepack reads `packageManager` and fetches that pnpm. CI does the same with `node-version-file: '.node-version'` and `pnpm/action-setup` with no version argument. Cloudflare Pages builds must use the same Node 24 line; set that in the project, because the CDN does not read `.nvmrc` by itself.
