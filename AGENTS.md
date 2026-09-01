# AGENTS.md

URL shortener repo. Only the backend exists (React frontend is planned, not present). Git root and repo root are the same directory; all commands run from `backend/`.

## Stack

- Express 5 + TypeScript, ESM (`"type": "module"`). Dev runs with `tsx` — no build step; `dist/` output is never used at runtime.
- Prisma 7 with PostgreSQL driver adapter (`@prisma/adapter-pg`). Schema: `prisma/schema.prisma`, config: `prisma.config.ts`. One tracked migration: `prisma/migrations/20260731072937_init`.

## Commands

```powershell
docker compose up -d      # start local Postgres 17 (compose.yaml, reads POSTGRES_* from .env)
npm run dev               # dev server (tsx watch src/server.ts)
npm start                 # run once
npm run db:seed           # idempotent plan seeding (FREE/PRO)
npm test                  # vitest run (needs Docker up; uses .env.test + url_shortener_test DB)
npm run test:watch        # vitest watch
npm run typecheck:test    # tsc --noEmit -p tsconfig.test.json (typechecks src + tests)
npx tsc --noEmit          # typecheck src only (tsconfig.json)
npx prisma migrate dev    # create + apply new migration
npx prisma migrate deploy # apply tracked migrations (fresh clone / fresh DB)
npx prisma generate       # regenerate client after schema change
npx prisma migrate status
```

## Fresh clone setup (order matters)

```powershell
npm install
npx prisma generate       # REQUIRED — generated client is gitignored
docker compose up -d
npx prisma migrate deploy
npm run db:seed
# create .env.test (gitignored) before tests: DATABASE_URL pointing at url_shortener_test + relaxed RATE_LIMIT_*
npm run dev
```

## Critical gotchas

- **Generated Prisma client is gitignored** (`src/generated/prisma/`). Import it as `../generated/prisma/client.js`, never from `@prisma/client`.
- Prisma client uses the **`prisma-client` generator** (v7 style), not `prisma-client-js`. `@prisma/adapter-pg` is required; instantiate `PrismaClient({ adapter })` (see `src/database/prisma.ts`). Same pattern in `prisma/seed.ts`.
- `backend/generated/prisma/` (repo root of backend) is a stale, untracked duplicate output — ignore it; the schema outputs to `src/generated/prisma`.
- `.env` is required for every command (dev, seed, prisma, docker compose). **There is no committed `.env.example`.** Required keys: `PORT`, `DATABASE_URL`, plus `POSTGRES_DB`, `POSTGRES_USER`, `POSTGRES_PASSWORD` (used only by compose.yaml). `src/config/env.ts` throws eagerly if `PORT`/`DATABASE_URL` are missing/invalid.
- ESM + `nodenext`: relative imports must use `.js` extensions (e.g. `./app.js`). `verbatimModuleSyntax` is on — use `import type` for type-only imports.
- tsconfig is strict with `exactOptionalPropertyTypes` and `noUncheckedIndexedAccess`; both are enforced.

## Architecture & conventions

- Layered flow: Route → Middleware → Controller → Service → Repository → Prisma. Feature modules (`auth`, `links`, `subscriptions`, etc.) are planned under `src/modules/` but **do not exist yet** — only `common/`, `config/`, `database/`, `middleware/`, and a health route are present.
- Errors: throw `ApiError(statusCode, code, message)`; central handler in `src/middleware/error-handler.ts` always returns `{ error: { code, message } }`. Expected errors must be `ApiError`, never raw Error.
- DB columns are snake_case via `@map`; Prisma fields are camelCase.
- Plans (limits/features) are source of truth in `prisma/seed.ts` — re-running `db:seed` syncs plan rows idempotently via `upsert`.

## Docs

`docs/progress.md` tracks completed phases and next steps (next: Phase 6 auth); `docs/architecture.md` and `docs/requirements.md` describe planned design; `docs/roadmap.md` defines phase-by-phase completion criteria.
