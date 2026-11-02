# Demo Narrator Frontend: Architecture Proposal

Status: **Proposed, revision 6, awaiting review.** Nothing in this folder is implemented. No dependencies are installed and no project configuration exists yet.

This folder is the pre-implementation design for a Next.js 16.4.3 frontend over the Demo Narrator FastAPI backend (`../demo-narrator`).

## Revision history

| Rev | Date | Change |
|-----|------|--------|
| 1 | 2026-10-30 | First proposal: App Router with a Node server acting as Backend-for-Frontend (BFF). |
| 2 | 2026-10-30 | Rewritten after review. The app is now a **static export SPA on Cloudflare Pages with no server**, with the token in **`localStorage`**, and checks run **on the host with pnpm**. Backend list endpoints come later, and API hosting is not decided yet. The static-export choice settles the polling and Cache Components questions (see [01 §1.5](01-findings-and-open-questions.md#15-decisions)). |
| 3 | 2026-10-30 | Routing stays the **Next.js App Router**, with no extra router. **MSW is dropped.** The FastAPI test suite owns the API contract. Frontend unit tests cover pure logic, and Playwright covers user journeys against the real API. |
| 4 | 2026-10-30 | Node is pinned as exact patch `24.22.0` in `.node-version` and `.nvmrc`, and as `>=24.22.0 <25` in `engines` with `engine-strict=true`. pnpm is pinned exactly via `packageManager`. No version manager is required. |
| 5 | 2026-11-02 | Pages and layouts stay Server Components for the static HTML shell only. They do not load user data. Duration limits are not copied into the frontend. The API's 422 is the duration check. |
| 6 | 2026-11-02 | Every OpenAPI path is written once, inside its feature `api.ts` factory. Screens call the factory. The run endpoint is the example, not a special case. |

## Reading order

| # | Document | What it answers |
|---|----------|-----------------|
| 1 | [Findings, decisions, open questions](01-findings-and-open-questions.md) | What the backend offers and lacks, what static export rules out, the decisions made so far, and what is still open |
| 2 | [Technology stack](02-technology-stack.md) | Each tool, why it was chosen, alternatives, trade-offs (versions checked on npm on 2026-10-30) |
| 3 | [Architecture](03-architecture.md) | Style, module boundaries, dependency direction, data flow, errors, loading, validation, auth, configuration, deployment |
| 4 | [Directory structure](04-directory-structure.md) | The proposed tree and what belongs in each folder |
| 5 | [Conventions](05-conventions.md) | Coding and architectural rules |
| 6 | [Quality checks](06-quality-checks.md) | Every automated check and where it runs |
| 7 | [Implementation plan](07-implementation-plan.md) | Phases, starting with a vertical slice |

## The proposal in one paragraph

Next.js 16 is used as a **static-export single-page application** (`output: 'export'`). `next build` produces plain HTML, CSS, and JavaScript in `out/`, and a free CDN serves those files. In the browser, the app calls FastAPI directly over CORS with the Bearer token. Code is a **feature-oriented modular monolith**: `app/` holds routing only, `features/` holds business capabilities, `shared/` holds infrastructure, and imports only point downward. Routing is the **Next.js App Router** and nothing else: file-based `page.tsx` and `layout.tsx`, client navigation, and typed links. TanStack Query manages server state and polling. React Hook Form and Zod handle forms and validation. `openapi-typescript` and `openapi-fetch` give a typed API client generated from the FastAPI contract. Tailwind CSS and shadcn/ui provide the UI. Vitest covers pure frontend logic. Playwright covers user journeys against the real API. The FastAPI suite already checks API responses, so there is no browser mock server. ESLint, Prettier, and `tsc` cover static checks. There is no global state manager.

## What this needs from the backend before Phase 1

1. **CORS** for the frontend origins. Without it the browser cannot call the API at all.
2. A **public HTTPS deployment** of FastAPI that accepts 100 MB uploads and has long request timeouts. The frontend needs no server, but the API still does.

Details and later backend items: [01 §1.6](01-findings-and-open-questions.md#16-backend-changes).
