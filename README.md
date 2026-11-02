# Demo Narrator

Static Next.js app for the Demo Narrator API. The plan lives in `docs/`. Agent instructions live in `AGENTS.md`.

## Setup

Install Node `24.22.0` or any later Node 24 below 25. Then:

```shell
corepack enable
pnpm install
cp .env.example .env.local
```

`corepack enable` makes `pnpm` the version in `packageManager`.

Run the API separately, with `http://localhost:3000` allowed by `CORS_ALLOW_ORIGINS`. The browser calls that API directly.

## Commands

```shell
pnpm dev
pnpm format
pnpm lint --fix
pnpm typecheck
pnpm test
pnpm build
pnpm test:e2e
```

`pnpm test:e2e` serves the built `out/` folder and signs up against the local API, so build first and have the API running. `pnpm build` is required before a change is done.
