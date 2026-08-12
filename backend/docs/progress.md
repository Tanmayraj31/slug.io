# URL Shortener Progress

## Completed

### Phase 0: Repository Setup

- Initialized the Git repository.
- Added a `.gitignore` for dependencies, build output, environment files, logs, and generated Prisma code.

### Phase 1: Express Foundation

- Created the TypeScript and Express backend structure.
- Added `src/app.ts` and `src/server.ts`.
- Added `GET /health/live`.
- Added validated environment configuration for `PORT` and `DATABASE_URL`.
- Added an `ApiError` class and centralized error middleware.
- Added consistent API error responses for expected and unexpected failures.

### Phase 2: Local PostgreSQL With Docker

- Created `compose.yaml` with a PostgreSQL 17 container.
- Configured the local database as `url_shortener`.
- Configured the local database user as `url_app`.
- Added a named Docker volume so local database data persists between container recreations.
- Verified the running database with `psql` inside the container.

### Phase 3: Prisma Database Schema

- Installed Prisma, the PostgreSQL driver, and the Prisma PostgreSQL adapter.
- Initialized `prisma/schema.prisma` and `prisma.config.ts`.
- Modelled the initial database schema:
  - `User`
  - `Plan`
  - `Subscription`
  - `Link`
  - `ClickEvent`
  - `UsageCounter`
  - `RefreshToken`
- Added the `LinkStatus`, `PlanType`, and `SubscriptionStatus` enums.
- Added foreign keys, unique constraints, and indexes.
- Created and applied the initial Prisma migration.
- Generated the type-safe Prisma Client under `src/generated/prisma`.

### Phase 4: Database Client

- Created `src/database/prisma.ts`.
- Configured one reusable Prisma Client using the PostgreSQL driver adapter.

### Phase 5: Plan Seeding

- Added an idempotent seed script for the `FREE` and `PRO` plans.
- Defined the documented plan limits and feature flags in one place.
- Added `npm run db:seed`, which may be rerun safely to synchronize plan values.

## Completed

### Phase 6: Authentication

All waves 6.1-6.6 are implemented, verified, and committed.

- Installed `bcryptjs`, `jsonwebtoken`, `zod`, and `cookie-parser`.
- Added validated JWT/cookie environment config (`src/config/env.ts`, `src/config/auth.ts`).
- Added the layered `src/modules/auth/` module (validation, repository, service, token service, middleware, controller, routes).
- `POST /api/v1/auth/register` — hashes the password (bcrypt cost 12) and creates the user plus a `FREE`/`ACTIVE` subscription in one transaction; `409 EMAIL_TAKEN` on duplicate email; `400 VALIDATION_ERROR` on invalid input.
- `POST /api/v1/auth/login` — verifies credentials, issues a 15-minute HS256 JWT access token (payload `{ sub: userId }`), and sets an HttpOnly `refreshToken` cookie (30-day max age, `SameSite=Lax`); `401 INVALID_CREDENTIALS` for unknown email or wrong password. Login timing is equalized: unknown emails still run a bcrypt compare against a dummy hash so response time does not reveal whether an account exists.
- `POST /api/v1/auth/refresh` — reads the `refreshToken` cookie, revokes the old row and inserts a new hashed row in one transaction (rotation), then returns a fresh access token; `401 INVALID_REFRESH_TOKEN` when missing, expired, or revoked. Replaying a revoked token triggers reuse detection: all of that user's refresh tokens are revoked.
- `POST /api/v1/auth/logout` — revokes the presented refresh token and clears the cookie (`204`); `401` when missing/invalid.
- Refresh tokens are opaque 48-byte `base64url` values (`generateRefreshToken`); the DB stores only their SHA-256 hash in `refresh_tokens.token_hash`.
- `GET /api/v1/auth/me` — protected by the `requireAuth` middleware (`src/modules/auth/auth.middleware.ts`). The middleware parses the `Authorization: Bearer` header, verifies the JWT (`verifyAccessToken` in `token.service.ts`, HS256 only), loads the user, and attaches an `AuthUserDto` to `AuthenticatedRequest`; future modules import `requireAuth` for protected routes. `401 UNAUTHORIZED` for missing/malformed header, invalid/expired token, or a deleted user.
- Hardened the central error handler (`src/middleware/error-handler.ts`): malformed JSON → `400 INVALID_JSON`, oversized body → `413 PAYLOAD_TOO_LARGE`, other exposed body-parser errors → their `status` with a stable `BAD_REQUEST` body, and the generic 500 message typo fixed.
- Verified end to end: full session flow (login → refresh → reuse-replay → logout), all `/me` auth-failure modes, malformed/oversized bodies, and login timing equality; `npx tsc --noEmit` and redocly lint (0 errors) pass.

### Phase 7 (in progress): Link Creation — Wave 7.1

Wave 7.1 (module foundation, URL validation, short-code generation, basic create) is implemented and verified end to end.

- Added the layered `src/modules/links/` module (validation, short-code generator, URL validator, repository, service, types, controller, routes).
- `src/modules/links/url-validation.ts` — pure `validateAndNormalizeUrl`: only `http`/`https`; rejects malformed URLs, `localhost` and `*.localhost`, metadata hostnames (`metadata`, `metadata.google.internal`), private IPv4 ranges (0/8, 10/8, 127/8, 172.16/12, 169.254/16, 192.168/16), and IPv6 loopback/ULA/link-local (`::`, `::1`, `fc00::/7`, `fe80::/10`). Normalizes to a canonical form (lowercase host, drops default ports and hash fragment) for later duplicate detection.
- `src/modules/links/short-code.ts` — Base62 short codes (length 7) from `crypto.randomBytes` with rejection sampling to avoid modulo bias.
- `src/modules/links/links.repository.ts` — `createLinkWithRetry` creates the link and retries with a fresh code only on a `short_code` unique violation (`P2002`), bounded by `MAX_CODE_ATTEMPTS = 5`.
- `src/modules/links/links.service.ts` — `createLink` maps an invalid URL to `400 INVALID_URL`, stores the normalized URL, and returns a `LinkResponseDto` via `toLinkDto` (which computes `shortUrl` from `PUBLIC_BASE_URL`).
- `POST /api/v1/links` mounted at `/api/v1/links` behind `requireAuth`; returns `201 { link }`.
- Added optional `PUBLIC_BASE_URL` to env config (falls back to `http://localhost:PORT`).
- Updated `openapi.yaml`: `POST /api/v1/links` is now implemented (GET/list routes remain planned for Phase 8).
- Verified: `npx tsc --noEmit` green; live E2E — valid URL creates a link (fragment stripped, 7-char Base62 code), and `javascript:`, `localhost`, `169.254.169.254`, `192.168.1.5`, `10.0.0.1`, and `ftp:` all return `400 INVALID_URL`. Missing/bad tokens return `401 UNAUTHORIZED`; missing `originalUrl` returns `400 VALIDATION_ERROR`.

## Next Phase

Wave 7.2: plan-aware rules — create `src/modules/subscriptions/` (resolve active plan with FREE fallback), compute expiry (Free auto +7d; Pro user-selected within plan max, defaulting to plan max), gate and validate Pro custom aliases (format, reserved words), and reuse existing ACTIVE/non-expired links for duplicate destinations.

## Local Commands

```powershell
npm run dev
docker compose up -d
docker compose down
npx prisma migrate status
npx prisma generate
npx tsc --noEmit
npm run db:seed
```
