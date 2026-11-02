# 4. Directory Structure

The tree below is the layout planned for the end of Phase 3. Items marked `(P4)` arrive in Phase 4. File names are examples; the role of each folder is the binding part. Phase 1 adds only signup, the session, and the signed-in placeholder.

```
demo-narrator-frontend/
├── docs/                                # These documents (+ docs/adr/ for later decisions)
├── openapi/
│   └── openapi.json                     # Committed snapshot of FastAPI /openapi.json (type source of truth)
├── public/
│   └── _headers                         # CDN response headers: CSP, security headers, cache rules
├── e2e/                                 # Playwright (user journeys against built out/ + real API)
│   ├── fixtures/                        # 3 s sample .mp4, invalid .txt
│   ├── support/                         # Page objects, API-seeded user helper
│   ├── auth.spec.ts
│   ├── narrate.spec.ts
│   └── narrate.full-pipeline.spec.ts    # @slow
├── scripts/
│   └── export-openapi.mjs               # Fetch openapi.json from the local backend
├── src/
│   ├── app/                             # ROUTING + COMPOSITION ONLY (thin files)
│   │   ├── layout.tsx                   # <html>, next/font, <Providers>, metadata
│   │   ├── providers.tsx                # 'use client': QueryClientProvider, Toaster, session→redirect listener
│   │   ├── globals.css                  # Tailwind v4 + @theme tokens
│   │   ├── not-found.tsx                # → out/404.html
│   │   ├── global-error.tsx
│   │   ├── (public)/
│   │   │   ├── layout.tsx               # Centered card; <RedirectIfSignedIn>
│   │   │   ├── page.tsx                 # "/" → client redirect by session
│   │   │   ├── login/page.tsx
│   │   │   └── signup/page.tsx
│   │   └── (app)/
│   │       ├── layout.tsx               # <RequireSession> + AppShell (header, user menu)
│   │       ├── error.tsx                # Segment error boundary
│   │       ├── videos/
│   │       │   ├── new/page.tsx         # Upload
│   │       │   └── page.tsx             # (P4) Library
│   │       ├── video/page.tsx           # (P4) ?id= video detail
│   │       └── run/page.tsx             # ?id= run status (Suspense around useSearchParams)
│   │
│   ├── features/                        # BUSINESS CAPABILITIES (no cross-feature imports)
│   │   ├── auth/
│   │   │   ├── api.ts                   # useLogin(), useSignup() mutations
│   │   │   ├── schemas.ts               # LoginSchema, SignupSchema
│   │   │   ├── errors.ts                # 401/409/422 → messages
│   │   │   └── components/
│   │   │       ├── login-form.tsx
│   │   │       ├── signup-form.tsx
│   │   │       ├── require-session.tsx  # Guard used by (app)/layout
│   │   │       ├── redirect-if-signed-in.tsx
│   │   │       └── user-menu.tsx        # Email from claims + logout
│   │   └── narration/
│   │       ├── api.ts                   # runQuery(id), useUploadVideo(), useRetryRun(), useDownload()
│   │       ├── transport/
│   │       │   ├── upload.ts            # XHR with progress/abort → typed RunResponse | ApiError
│   │       │   └── download.ts          # fetch → Blob + filename
│   │       ├── schemas.ts               # UploadSchema, RetrySchema, RunIdParam
│   │       ├── domain.ts                # STEP_ORDER, isTerminal, labels, VOICES, MODELS, poll interval
│   │       ├── errors.ts                # 409/413/415/422/404 → messages
│   │       ├── hooks/
│   │       │   └── use-object-url.ts    # Blob URL lifecycle (revoke on unmount)
│   │       └── components/
│   │           ├── upload-form.tsx
│   │           ├── narration-options-fields.tsx   # voice/model/max_atempo (upload + retry)
│   │           ├── run-view.tsx                   # Reads ?id, owns query + states
│   │           ├── run-status-card.tsx
│   │           ├── step-timeline.tsx
│   │           ├── download-button.tsx
│   │           ├── video-preview.tsx              # (P2)
│   │           ├── retry-form.tsx                 # (P2)
│   │           └── video-list.tsx                 # (P4)
│   │
│   └── shared/                          # INFRASTRUCTURE (imports nothing from app/ or features/)
│       ├── api/
│       │   ├── generated/schema.d.ts    # openapi-typescript output (DO NOT EDIT)
│       │   ├── client.ts                # openapi-fetch client + auth/request-id/error middleware
│       │   ├── errors.ts                # ApiError, normalizeFastApiError()
│       │   └── types.ts                 # Run, RunStatus, NarrationStep aliases
│       ├── query/
│       │   └── query-client.ts          # makeQueryClient(): retry policy, defaults
│       ├── session/
│       │   ├── session-store.ts         # get/set/clear/subscribe over localStorage; storage-event sync; expiry timer
│       │   ├── use-session.ts           # useSyncExternalStore binding (server snapshot = null)
│       │   └── claims.ts                # decodeJwt + Zod {sub,email,exp}
│       ├── config/
│       │   └── env.ts                   # Zod-validated NEXT_PUBLIC_* (literal access)
│       ├── ui/                          # shadcn/ui primitives (button, field, input, alert, progress, …)
│       └── lib/
│           ├── cn.ts
│           ├── safe-redirect.ts
│           └── format.ts                # bytes, durations, relative times
│
├── tests/
│   └── setup.ts                         # jest-dom matchers, cleanup. No network mock server.
├── .env.example
├── .node-version                      # exact Node for fnm, asdf, mise, CI: 24.22.0
├── .nvmrc                             # same text, for nvm
├── .npmrc                             # engine-strict=true
├── components.json                    # shadcn aliases → src/shared/ui
├── eslint.config.mjs
├── next.config.ts                       # output:'export', reactCompiler, typedRoutes, images.unoptimized
├── playwright.config.ts                 # webServer: serve out/ on :3000
├── prettier.config.mjs
├── tsconfig.json                        # strict; "@/*" → "src/*"
├── vitest.config.mts
├── package.json / pnpm-lock.yaml
└── AGENTS.md                            # Entry point. Points at the docs. Does not copy them.
```

## Reasons for the main choices

| Choice | Reason | Trade-off |
|---|---|---|
| `app/` holds routing only | Next.js gives special meaning to files under `app/`. Keeping feature logic elsewhere means a URL change never moves logic. | Page files are only a few lines of composition, which is intended. |
| Each feature has its own `features/<capability>` folder | Matches the backend's `auth` and `narration` domains. A backend change maps to one frontend folder. | Code that looks shareable is promoted to `shared/` on its second real use, not its first. |
| Each feature has one `api.ts` | Every query key, query function, and mutation for a feature sits in one file. This makes cache invalidation easy to reason about. | The file grows with the feature. Split it by resource (`api/runs.ts`) when it passes about 200 lines. |
| A separate `transport/` folder | XHR and Blob handling differ from typed JSON calls. Isolating them keeps `api.ts` declarative. | One more folder. |
| Run ID in a query param (`run/page.tsx` with `?id=`) | A static export cannot prerender unknown IDs. | URLs are less pretty. |
| Tests next to the source file, except `e2e/` | Unit tests move and are deleted with their code. Playwright tests target the built app and the real API. | Two test locations. |
| Committed `openapi/openapi.json` | Production hides its OpenAPI document. The snapshot makes builds reproducible and lets API changes be reviewed in pull requests. | It has to be refreshed by hand. CI catches drift. |
| UI primitives in `shared/ui`, not shadcn's default `components/ui` | Puts primitives under the shared-layer boundary rules. | Paths differ from shadcn tutorials. |
| No `services/`, `utils/`, or `types/` at the root | Folders organized by file type turn into dumping grounds. | — |
