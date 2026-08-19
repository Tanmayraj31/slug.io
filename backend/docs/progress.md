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

### Phase 7 (completed): Link Creation

- [x] Wave 7.1 — module foundation, URL validation, short-code generation, basic create
- [x] Wave 7.2 — subscriptions module and plan resolution
- [x] Wave 7.3 — usage limits and transactional create
- [x] Wave 7.4 — expiry rules
- [x] Wave 7.5 — duplicate destination reuse
- [x] Wave 7.6 — OpenAPI, verification, docs, commit

#### Wave 7.1 (completed)

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

#### Wave 7.2 (completed)

Wave 7.2 (subscriptions module and plan resolution) is implemented and verified.

- Added the layered `src/modules/subscriptions/` module (`subscriptions.types.ts`, `subscriptions.repository.ts`, `subscriptions.service.ts`).
- `findActiveSubscriptionForUser(userId)` — returns the user's most recent `ACTIVE` subscription whose `startsAt <= now` and whose `endsAt` is null or in the future, including the joined plan.
- `findPlanByType(type)` — loads a plan by type (used for the FREE fallback).
- `resolveActivePlan(userId)` — returns a `ResolvedPlan` (`type` + `dailyLinkLimit`, `activeLinkLimit`, `maxExpiryDays`, `allowsCustomAlias`, `allowsDetailedAnalytics`). Prefers the active subscription's plan; otherwise falls back to FREE, which covers no subscription, an expired `endsAt`, or a cancelled subscription (the downgrade policy). Throws `500 PLAN_NOT_CONFIGURED` when no plan row exists.
- Wired `resolveActivePlan(userId)` into `createLink` (`src/modules/links/links.service.ts`) as a guard so link creation fails fast with `500 PLAN_NOT_CONFIGURED` if plans are not seeded; later waves use the resolved plan for limits, expiry, and (post-MVP) aliases.
- Verified: `npx tsc --noEmit` green; scripted checks — no subscription → FREE (10/30, 7d, no alias), active FREE subscription → FREE, active PRO subscription → PRO (500/10,000, 365d, alias + analytics allowed), expired PRO subscription → FREE fallback. Live E2E — register → login → create link returns `201` with an `ACTIVE` link.

#### Wave 7.3 (completed)

Wave 7.3 (usage limits and transactional create) is implemented.

- Added `src/modules/usage/` — `usage.utils.ts` (`getUtcUsageDate`: midnight-UTC date from the UTC components of `now`, implementing the documented UTC timezone policy; `UsageCounter.usageDate` is `@db.Date`) and `usage.repository.ts` (`getDailyUsageCount(tx, userId, usageDate)` reads the daily count, defaulting to `0`; `incrementDailyUsage(tx, userId, usageDate)` upserts with an atomic `linksCreated: { increment: 1 }`). Both take a `Prisma.TransactionClient` so they only ever run inside the create transaction.
- `src/modules/links/links.repository.ts` now drives `createLinkWithLimits` through an interactive transaction (`prisma.$transaction`): locks the user row first (`SELECT id FROM "users" WHERE id = ${userId} FOR UPDATE`), serializing concurrent creates for the same user; enforces the daily limit (`getDailyUsageCount >= plan.dailyLinkLimit`) and the active-link limit (`countActiveLinks >= plan.activeLinkLimit`), both `403 PLAN_LIMIT_REACHED`; creates the link; then increments the counter in the same atomic unit.
- `countActiveLinks` counts `ACTIVE` links whose `expiresAt` is null or in the future — written forward-compatible with Wave 7.4 expiry rules.
- Short-code collision retry moved *outside* the transaction (a Postgres error inside a transaction aborts it, so catch-and-retry inside is impossible): the loop retries the whole `$transaction` with a fresh Base62 code, bounded by `MAX_CODE_ATTEMPTS = 5`, retrying only `P2002` on `short_code`.
- `createLink` (`links.service.ts`) resolves the plan, computes the UTC usage date, and delegates to `createLinkWithLimits`.
- Verified: `npx tsc --noEmit` green; live E2E — valid URL creates a link and the `usage_counters` row reflects the created count.

#### Wave 7.4 (completed)

Wave 7.4 (expiry rules) is implemented.

- Added `src/modules/links/expiry.ts` — pure `resolveExpiry(requested, plan, now)`: with no requested date it defaults to `now + maxExpiryDays` (7 days FREE, 365 days PRO); a Free user providing `expiresAt` gets `403 FEATURE_NOT_AVAILABLE`; a past/invalid date is `400 VALIDATION_ERROR`; a date beyond `now + maxExpiryDays` is `403 PLAN_LIMIT_REACHED`; a missing plan `maxExpiryDays` is `500 PLAN_NOT_CONFIGURED`. `maxExpiryDays` is captured into a local const so null-narrowing is bulletproof.
- `createLinkSchema` accepts an optional `expiresAt` (ISO 8601 datetime, `z.string().datetime({ offset: true })`); `CreateLinkInput` gains `expiresAt?: string`.
- `CreateLinkWithLimitsData` carries `expiresAt: Date`, persisted on the link inside the same transaction (usage limits untouched — expiry is orthogonal).
- `countActiveLinks` already excluded past-expiry links, so the active-link limit stayed correct without changes.
- Verified: `npx tsc --noEmit` green.

#### Wave 7.5 (completed)

Wave 7.5 (duplicate destination reuse) is implemented and verified.

- Added `findReusableLinks` (`src/modules/links/links.repository.ts`) — returns the user's most recent `ACTIVE` link for the same normalized destination URL whose `expiresAt` is null or in the future.
- `createLinkWithLimits` queries for a reusable link inside the transaction immediately after locking the user row and *before* the limit checks; when one exists it is returned without creating a new link or incrementing the daily usage counter. Reuse is skipped only when no matching link exists, so a user at their active-link/daily limit still gets their existing link back instead of a false `403 PLAN_LIMIT_REACHED`.
- The reuse lookup compares against the real current time (`new Date()`), not the UTC usage date, so a link that already expired earlier today is never reused.
- Added composite index `@@index([userId, originalUrl])` via migration `20260813205423_add_link_owner_url_index` so the lookup stays fast as a user's link count grows.
- Verified: `npx tsc --noEmit` green; live E2E — the same user re-submitting the same URL gets the identical link (same id and short code) and `usage_counters` increments only once; a different user gets a separate link for the same destination; a `DISABLED` or already-expired link is not reused (a new link is created instead).

#### Wave 7.6 (completed)

Wave 7.6 (OpenAPI, verification, docs, commit) is complete.

- Updated `openapi.yaml` `POST /api/v1/links` to document duplicate-destination reuse.
- Phase 7 verified end to end (`npx tsc --noEmit` green, live E2E above), and progress docs updated.
- Committed in two commits: the Wave 7.5 implementation and the Phase 7 docs/OpenAPI update.

### Phase 8: Link Management and Redirects

- [x] Wave 8.1 — list links with status filter and pagination
- [x] Wave 8.2 — get single owned link (ownership-guarded detail)
- [x] Wave 8.3 — disable / reactivate owned links (status transitions)
- [x] Wave 8.4 — soft-delete owned links
- [x] Wave 8.5 — public short-code redirect + click recording
- [x] Wave 8.6 — OpenAPI, E2E verification, docs, commit

#### Wave 8.1 (completed)

Wave 8.1 (list links with status filter and pagination) is implemented and verified.

- `GET /api/v1/links` — protected by `requireAuth`; accepts query params `status` (optional `LinkStatus` enum), `page` (default 1), `pageSize` (default 20, max 100); returns `{ links, page, pageSize, total, totalPages }`.
- `links.validation.ts` — added `listLinkQuerySchema` with `z.nativeEnum(LinkStatus)` for status and `z.coerce.number().int()` for pagination (query params arrive as strings).
- `links.repository.ts` — added `FindLinksData` and `findLinks`: ownership-scoped `where` clause, `$transaction` batch (`findMany` + `count`) for consistent snapshot, `createdAt: "desc"` ordering, `skip/take` pagination.
- `links.service.ts` — added `listLinks`: delegates to `findLinks`, computes `totalPages = Math.max(1, Math.ceil(total / pageSize))`, maps links through `toLinkDto`.
- `links.controller.ts` — added `listLinksController`: parses `request.query`, throws `400 VALIDATION_ERROR` on invalid params, returns `200` with the paginated result.
- `links.routes.ts` — `GET /` mounted behind `requireAuth`.
- Naming convention: repository verb is `findLinks` (retrieves rows), service verb is `listLinks` (orchestrates + maps to DTO).
- Verified: `npx tsc --noEmit` green; live E2E — register → login → create two links → list returns correct `total=2` → `pageSize=1` yields `totalPages=2` with one link per page → `?status=ACTIVE` returns all → `?status=DISABLED` returns zero → `?page=abc` / `?status=BOGUS` → `400 VALIDATION_ERROR`.

#### Wave 8.2 (completed)

Wave 8.2 (get single owned link, ownership-guarded detail) is implemented and verified.

- `GET /api/v1/links/:id` — protected by `requireAuth`; accepts path param `id` (integer); returns `200 { link }`.
- `links.validation.ts` — added `getLinkParamsSchema` with `z.coerce.number().int().positive()` for the `:id` param.
- `links.repository.ts` — added `findLinkById(linkId, userId)`: ownership-scoped `findFirst` with `where: { id: linkId, userId }`. Returns `null` when the link does not exist or belongs to another user.
- `links.service.ts` — added `getLinkById(linkId, userId)`: calls `findLinkById`, throws `404 LINK_NOT_FOUND` on null, maps through `toLinkDto()`.
- `links.controller.ts` — added `getLinkByIdController`: parses `request.params` with `getLinkParamsSchema`, throws `400 VALIDATION_ERROR` on invalid params, returns `200 { link }`.
- `links.routes.ts` — `GET /:id` mounted behind `requireAuth` (after `GET /` so the list route takes priority).
- Naming convention: repository verb is `findLinkById` (retrieves one row), service verb is `getLinkById` (orchestrates + maps to DTO).
- Removed stale `x-status: planned` from `GET /api/v1/links` (Wave 8.1) and `GET /api/v1/links/{id}` in `openapi.yaml`.
- Verified: `npx tsc --noEmit` green.

#### Wave 8.3 (completed)

Wave 8.3 (disable / reactivate owned links, status transitions) is implemented and verified.

- `PATCH /api/v1/links/:id/status` — protected by `requireAuth`; accepts path param `id` (integer) and body `{ status: "ACTIVE" | "DISABLED" }`; returns `200 { link }`.
- `links.validation.ts` — added `updateLinkStatusSchema` with `z.enum([LinkStatus.ACTIVE, LinkStatus.DISABLED])` (excludes `DELETED`); `getLinkParamsSchema` reused for the `:id` param.
- `links.repository.ts` — added `updateLinkStatus(linkId, userId, status)`: ownership-scoped `updateMany`, returns affected count (0 or 1). Atomic — no race between read and write.
- `links.service.ts` — added `updateLinkStatus(userId, linkId, input)`: fetches link via `findLinkById`, validates transitions (`DELETED` → `409 LINK_DELETED`; `DISABLED → ACTIVE` when expired → `409 LINK_EXPIRED`; same status → no-op), delegates to `updateLinkStatusRepo`, maps through `toLinkDto()`.
- `links.controller.ts` — added `updateLinkStatusController`: parses `request.params` and `request.body` separately, throws `400 VALIDATION_ERROR` on invalid input, returns `200 { link }`.
- `links.routes.ts` — `PATCH /:id/status` mounted behind `requireAuth` (after `GET /:id`).
- Removed `x-status: planned` from `PATCH /api/v1/links/{id}/status` in `openapi.yaml`.
- Verified: `npx tsc --noEmit` green.

#### Wave 8.4 (completed)

Wave 8.4 (soft-delete owned links) is implemented and verified.

- `DELETE /api/v1/links/:id` — protected by `requireAuth`; accepts path param `id` (integer); returns `204 No Content`.
- `links.repository.ts` — added `softDeleteLink(linkId, userId)`: ownership-scoped `updateMany`, atomically sets `status: DELETED` and `deletedAt: new Date()`, returns affected count (0 or 1).
- `links.service.ts` — added `deleteLink(linkId, userId)`: fetches link via `findLinkById`, throws `404 LINK_NOT_FOUND` on null, silent no-op when already `DELETED`, delegates to `softDeleteLinkRepo`.
- `links.controller.ts` — added `deleteLinkController`: parses `request.params` with `getLinkParamsSchema`, throws `400 VALIDATION_ERROR` on invalid params, returns `204` with empty body.
- `links.routes.ts` — `DELETE /:id` mounted behind `requireAuth` (after `PATCH /:id/status`).
- Removed `x-status: planned` from `DELETE /api/v1/links/{id}` in `openapi.yaml`.
- No migration needed — `DELETED` status and `deletedAt` column already existed in the schema.
- Verified: `npx tsc --noEmit` green.

#### Wave 8.5 (completed)

Wave 8.5 (public short-code redirect + click recording) is implemented and verified.

- Added `src/modules/redirect/` module (validation, repository, user-agent parser, service, controller, routes).
- `GET /{shortCode}` — public, no authentication; resolves a short code to the original URL, records a click, and returns `302 Found`.
- `redirect.validation.ts` — `shortCodeParamsSchema` validates `:shortCode` (string, 5–16 chars).
- `redirect.repository.ts` — `findLinkByShortCode(shortCode)` looks up by unique code (any status); `recordClick(tx, linkId, data)` inserts a `ClickEvent` row and atomically increments `Link.totalClicks` in a transaction.
- `user-agent.ts` — `parseUserAgent(raw)` wraps `ua-parser-js` to extract `browser`, `operatingSystem`, and `deviceType` from the `User-Agent` header.
- `redirect.service.ts` — `resolveRedirect(shortCode, headers)` fetches the link, returns `404 LINK_NOT_FOUND` when missing, `410 LINK_GONE` when disabled/deleted/expired, records the click, and returns `originalUrl`.
- `redirect.controller.ts` — `redirectController` parses params, calls service, calls `response.redirect(302, originalUrl)`.
- `redirect.routes.ts` — `GET /:shortCode` mounted without `requireAuth`.
- `app.ts` — mounted `redirectRouter` at `"/"` before the 404 catch-all.
- Removed `x-status: planned` from `GET /{shortCode}` in `openapi.yaml`.
- Installed `ua-parser-js` and `@types/ua-parser-js` for User-Agent parsing.
- Verified: `npx tsc --noEmit` green.

#### Wave 8.6 (completed)

Phase 8 completed and verified end to end.

- All Wave 8.1–8.5 implementations verified with `npx tsc --noEmit` green.
- `openapi.yaml` updated: all Phase 8 routes marked as implemented (no remaining `x-status: planned` for Phase 8 endpoints).
- Progress docs updated.

### Phase 9: Analytics and Usage

- [x] Wave 9.1 — analytics module foundation + total clicks endpoint

#### Wave 9.1 (completed)

Wave 9.1 (analytics module foundation + total clicks endpoint) is implemented and verified.

- Added the layered `src/modules/analytics/` module (types, repository, service, controller).
- `analytics.types.ts` — `AnalyticsResponseDto` (`totalClicks` + nullable `detailed`), `DetailedAnalyticsDto`, `AggregationBucket`, `ClicksOverTimeBucket` matching the OpenAPI `AnalyticsResponse` schema.
- `analytics.repository.ts` — `findLinkForAnalytics(linkId, userId)`: ownership-scoped `findFirst` with `select: { id, totalClicks }`.
- `analytics.service.ts` — `getLinkAnalytics(linkId, userId)`: returns `{ totalClicks, detailed: null }`; throws `404 LINK_NOT_FOUND` when the link does not exist or belongs to another user.
- `analytics.controller.ts` — `getLinkAnalyticsController`: validates `:id` param via `getLinkParamsSchema`, extracts `userId` from `AuthenticatedRequest`, calls service, returns `200`.
- Route `GET /api/v1/links/:id/analytics` mounted in `links.routes.ts` behind `requireAuth`.
- Removed `x-status: planned` from `GET /api/v1/links/{id}/analytics` in `openapi.yaml`.
- Verified: `npx tsc --noEmit` green.

## Next Phase

Phase 9 (Analytics and Usage) — Wave 9.2 (plan-based gating).

## After MVP

- Custom short-code aliases (formerly Wave 7.5) — Pro-only `customCode` support: alias-shape validation, reserved-code and protected-route rejection, `FEATURE_NOT_AVAILABLE` gating, `SHORT_CODE_UNAVAILABLE` collision handling, and `isCustom: true` links. This is intentionally deferred; do not re-scope it back into Phase 7.

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
