# 1. Findings, Requirements, Decisions, and Open Questions

## 1.1 What the backend provides today

Source: `../demo-narrator/src` at commit `5476b8a`. All routes are under `/v1` except `/health`.

| Method & path | Auth | Request | Success | Documented errors |
|---|---|---|---|---|
| `POST /v1/auth/signup` | none | JSON `{email, password}` (password 8–128) | `201 {id, email, created_at}` | `409` email taken, `422` |
| `POST /v1/auth/login` | none | **form-urlencoded** `username` (=email), `password` | `200 {access_token, token_type:"bearer"}` | `401` |
| `POST /v1/narrate` | Bearer | **multipart** `video` (.mov/.mp4) + optional `model`, `voice`, `max_atempo` | `202 {run_id, video_id, status, steps}` | `401`, `413` >100 MB, `415` type, `422` duration outside 2 s–10 min or unreadable |
| `POST /v1/videos/{video_id}/retry` | Bearer | JSON `{steps?, model?, voice?, max_atempo?}` | `202 {run_id, video_id, status, steps}` | `401`, `403`, `404`, `409` run active, `422` |
| `GET /v1/runs/{run_id}` | Bearer | — | `200 {run_id, video_id, status, steps, current_step, error, created_at, started_at, finished_at}` | `401`, `403`, `404` |
| `GET /v1/videos/{video_id}/download` | Bearer | — | `200` streamed `video/mp4`, `Content-Disposition: attachment` | `401`, `403`, `404` (no video, or no output yet) |
| `GET /health` | none | — | `200 {status:"ok"}` | — |

Domain vocabulary:

- `RunStatus` is one of `queued`, `running`, `succeeded`, `failed`. `succeeded` and `failed` are terminal.
- `NarrationStep`, in pipeline order: `transcribe`, `rewrite`, `voice`, `mux`.
- A video has many runs. At most one run per video is `queued` or `running` at any time.
- Download serves the newest succeeded run whose steps include `mux`.

## 1.2 Backend facts that shape the frontend

| # | Fact | Consequence for a static SPA |
|---|------|------------------------------|
| F1 | One HS256 access token, 60 min by default. No refresh token, logout endpoint, or `/me`. | The browser must store the token. The session ends at `exp` and the user logs in again. Logout only forgets the token locally. The user's email comes from the token's `email` claim. |
| F2 | Download needs an `Authorization: Bearer` header. | A plain `<a href>` or `<video src>` cannot send that header. The SPA must `fetch` the file with the header, turn it into a Blob, and hand the browser an object URL. |
| F3 | No CORS middleware is configured. | **Blocking.** Browser calls from the CDN origin fail until the backend allows them. |
| F4 | No list endpoints (my videos, runs of a video, video detail). | The library and history pages wait for backend work, which you confirmed will come later. |
| F5 | `/openapi.json` is turned off outside `local` and `staging`. | Generate types from a committed snapshot exported from a local backend. |
| F6 | Upload limits (100 MB, 2 s–10 min, `.mov`/`.mp4`) exist only in backend settings. | The frontend copies the size limit and the allowed extensions, so a bad file is rejected before the upload starts. Duration is not copied. The browser cannot read it for every `.mov`, and FastAPI already returns 422 after it probes the file. |
| F7 | `voice` and `model` are free strings that the backend does not validate. | The frontend owns a curated list of choices. |
| F8 | Two error shapes: `{"detail": "string"}` and `{"detail": [{loc, msg, type}]}` for 422. | One error normalizer must handle both. |
| F9 | Upload is synchronous: the backend stores the file and runs ffprobe before returning `202`. | The UI needs real upload progress, and every hop in front of FastAPI needs long timeouts and a body limit of at least 100 MB. |
| F10 | Download is streamed without HTTP Range support. | Playing directly from the API URL would seek poorly. A Blob URL fixes seeking, because the browser holds the whole file. |
| F11 | No push channel (no SSE or WebSocket). | The status page polls `GET /v1/runs/{run_id}`. |

## 1.3 What static export rules out

Source: the Next.js 16 static exports guide. These features need a server and fail with `output: 'export'`:

- Server Actions
- Route Handlers that read the `Request`
- Cookies
- `proxy.ts` (formerly middleware)
- `rewrites`, `redirects`, and `headers` in `next.config`
- ISR and draft mode
- Intercepting routes
- `next/image` with the default optimizing loader
- **Dynamic routes without `generateStaticParams`**

Consequences:

| Lost feature | Replacement |
|---|---|
| Server-side data loading (async Server Components per request) | Client-side fetching with TanStack Query. Pages and layouts stay Server Components so the build can emit the static HTML shell and `metadata`. They do not load user data. |
| Server Actions for forms | Client form handling (React Hook Form + Zod) that calls the API through TanStack Query mutations. |
| `httpOnly` cookie session and `proxy.ts` auth redirects | The token is stored in browser storage. Route guards are client-side. These guards are **only for UX**; FastAPI still enforces authorization on every call. |
| `/runs/[runId]` dynamic segment | **A query string: `/run?id=<uuid>`**. One HTML file serves every run, and deep links work on any static host. |
| Response headers from `next.config` (CSP and similar) | A host-specific `_headers` file in `public/` (supported by Cloudflare Pages and Netlify). |
| Runtime env vars | Build-time `NEXT_PUBLIC_*` variables. This means one build per environment. |

## 1.4 Frontend requirements

| ID | User capability | Backend support | Phase |
|----|-----------------|-----------------|-------|
| R1 | Sign up | Yes | 2 |
| R2 | Log in and log out; be sent to login on expiry | Yes, with the limits in F1 | 1 |
| R3 | Upload a video with optional voice, model, and tempo cap, and see progress | Yes, after CORS (F3) | 1 |
| R4 | Watch a run move through its four steps | Yes (polling) | 1 |
| R5 | Download the narrated MP4 | Yes (Blob download) | 1 |
| R6 | Retry selected steps with new options | Yes | 2 |
| R7 | See my videos and their run history | Later, after backend endpoints are added | 3 |
| R8 | Preview the result in the browser | Yes, through a Blob URL | 2 |

Non-functional requirements:

- **Security:** minimize what an XSS bug could reach (strict CSP, no third-party scripts, no raw HTML). Keep the token's lifetime short.
- **Accessibility:** WCAG 2.2 AA.
- **Cost:** hosting on a free tier.
- **Maintainability:** feature modules, boundaries enforced by lint rules, types generated from the API contract.

## 1.5 Decisions

### Decided in review

| Topic | Decision | Effect |
|---|---|---|
| What "SPA" means | **Static export** (`output: 'export'`) | All data access happens in the browser. See 1.3. |
| Deployment | **A free CDN, no server: Cloudflare Pages** | `_headers` carries the CSP and the security headers. Each branch gets a preview deploy. Check the current free-tier terms when you sign up. |
| Backend list endpoints | **Added later** | The library (R7) moves to Phase 3. Phases 1–2 do not need it. |
| Where checks run | **On the host with pnpm** | Node 24 and Playwright browsers are installed locally. The backend stack still runs in Docker for E2E tests. |
| Node and pnpm versions | **Exact Node in version files, range checked on install, exact pnpm via Corepack** | `.node-version` and `.nvmrc` both say `24.22.0`. `engines.node` is `>=24.22.0 <25` and `.npmrc` has `engine-strict=true`, so `pnpm install` fails on any other major. `packageManager` pins the exact pnpm. No required version manager. See [02 §2.3.13](02-technology-stack.md#2313-same-node-and-pnpm-on-every-machine). |
| Token storage | **`localStorage`** | The token is shared by all tabs and stays until `exp`, even across browser restarts. Login and logout reach every open tab through the `storage` event. Accepted risk: any XSS bug could read the token, and on a shared computer it stays on disk until it expires. Mitigations: a strict CSP, no third-party scripts, no raw HTML, and the 60-minute lifetime. |
| API hosting | **Not decided yet** | The design works with any HTTPS host. The CORS origins come from backend config. Moving the session into an `httpOnly` cookie set by FastAPI becomes possible later only if the API and the frontend share a registrable domain (for example `app.example.com` and `api.example.com`). The default `*.pages.dev` domain is a different site, so browsers would block that cookie as third-party. |
| Routing | **Next.js App Router only** | Files under `src/app/` are the routes. Next.js provides client navigation, layouts, error and not-found pages, and typed links. No React Router and no TanStack Router. Run and video ids stay in the query string (`/run?id=…`), because a static export cannot build a page per unknown id. |
| API response tests | **Stay in the FastAPI suite. No MSW.** | `tests/test_auth.py`, `test_narrate.py`, `test_runs.py`, `test_retry.py`, and `test_download.py` already assert status codes and bodies. The frontend does not replay those responses in a mock server. Vitest covers frontend-only logic. Playwright runs the UI against the real API. |

### Settled by the static-export choice

The previous revision asked two questions that depended on having a Next.js server. Without a server, both have a single sensible answer.

- **How the run page refreshes its status.** The run page has to keep asking the API "is it done yet?" every few seconds. With a server, Next.js could re-render the page on the server each time (`router.refresh()`). Without a server that does nothing useful, so the browser must poll the API itself. **TanStack Query** is the established library for this. It polls on an interval, pauses while the tab is hidden, stops when the run finishes, and caches the result. You get all of that by setting one option, `refetchInterval`.
- **Cache Components.** This is a Next.js 16 feature that decides which parts of a *server-rendered* page are cached and which are re-rendered per request. A static export renders everything once at build time and has no requests to the server afterwards, so the feature does not apply. **It is not used.**

### Remaining defaults (change any of them during review)

| Question | Proposed default |
|---|---|
| Voice choices | About 6 curated Edge TTS English voices. Default `en-US-AndrewNeural`. |
| Whisper model choices | Under "Advanced": `tiny`, `base`, `small` (default), `medium`, `large-v3` |
| `max_atempo` | Under "Advanced": 1.0–2.0, default 1.2 |
| Full-pipeline E2E | Run on demand or nightly, because it needs a Groq key and internet access. Pull-request E2E covers everything up to `running`. |
| Visual design | shadcn/ui defaults with a neutral palette. Dark mode follows the system setting. |

## 1.6 Backend changes

**Needed before Phase 1 (blocking):**

1. Add `CORSMiddleware`. Origins come from a setting, for example `CORS_ALLOW_ORIGINS=http://localhost:3000,https://<frontend-domain>`.
   - `allow_methods`: `GET`, `POST`
   - `allow_headers`: `Authorization`, `Content-Type`
   - `expose_headers`: `Content-Disposition`, so the SPA can read the download filename
   - `allow_credentials=False`, because no cookies are used
   - `max_age` around 600 s, to cache preflight responses
2. Deploy over public HTTPS. The reverse proxy must accept bodies of at least 105 MB and allow request timeouts of at least 120 s.

**Later, in order of value:**

3. `GET /v1/videos`, `GET /v1/videos/{video_id}` with runs, and `GET /v1/auth/me`. These enable R7.
4. Short-lived signed download URLs, such as `GET /v1/videos/{id}/download-url` returning a URL with a 5-minute expiry. With these, the browser can stream the file to disk instead of holding it in memory.
5. Refresh tokens. If the API and the frontend end up on the same registrable domain, an `httpOnly` cookie session set by FastAPI is also possible.
6. Optionally, `GET /v1/narration/options` for voices, models, and limits. This removes the duplication in F6 and F7.

## 1.7 Assumptions

1. **A1.** English only. Desktop first, responsive layout. Individual accounts with no roles.
2. **A2.** The frontend is a separate repository with its own CI.
3. **A3.** Node.js 24 LTS, floor `24.22.0`. Move to Node 26 once it reaches Active LTS, by updating the version files and `engines` together. pnpm is pinned exactly in `packageManager`.
4. **A4.** One build per environment, because API URL and limits are inlined at build time.
5. **A5.** No analytics or error-tracking SaaS for now. Adding any would change the CSP.
6. **A6.** Narrated outputs are small enough to hold in browser memory as a Blob. The input is capped at 100 MB and ≤ 10 min, and the output is similar in size. This holds until signed URLs arrive (backend item 4).

## 1.8 Risks and spikes (done at the start of Phase 1)

| Risk | Spike |
|---|---|
| 100 MB XHR upload across origins: CORS preflight, progress events, and long server processing after the bytes arrive | Upload 100 MB from `localhost:3000` to the local API with CORS turned on. Measure the progress events and check that timeouts hold. |
| Blob download of a large MP4: memory use, filename from `Content-Disposition`, Safari behavior | Download a large output in Chrome, Firefox, and Safari. Check the preview seeks correctly. |
| Prerender and hydration with a client session guard: no protected-content flash, no hydration mismatch | Build, serve `out/`, and load guarded routes signed in and signed out. |
| A strict CSP on a static export. Next.js emits inline bootstrap scripts, and without a server there is no per-request nonce. | Check whether a post-build step can hash the inline scripts into `_headers` (`script-src 'self' 'sha256-…'`). If not, accept `'unsafe-inline'` for scripts and record the risk. |
| TypeScript 7.0 is npm `latest`, but `typescript-eslint@8.72` only supports `<6.1.0` | Pin TypeScript `~6.0.3`. |
