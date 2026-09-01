# URL Shortener Roadmap

This roadmap defines the implementation order and the condition for completing each phase.

## Version Control Checkpoint

After completing and verifying every phase, commit the relevant project files to Git before starting the next phase.

```powershell
git status
git add <relevant-files>
git diff --staged
git commit -m "<descriptive phase commit message>"
```

Never commit `.env`, `node_modules`, build output, or generated Prisma Client files.

## Phase 1: Backend Foundation

- Set up TypeScript and Express.
- Add environment validation.
- Add live health checks.
- Add centralized API error handling.

**Complete when:** the server starts, `GET /health/live` returns `200`, and unknown routes return a consistent `404` JSON error.

## Phase 2: Local Database Environment

- Run PostgreSQL locally with Docker Compose.
- Store local connection settings in `.env`.
- Verify the database with `psql`.

**Complete when:** the `url_shortener` database is available at `localhost:5432`.

## Phase 3: Prisma Schema and Migration

- Initialize Prisma.
- Model users, plans, subscriptions, links, click events, usage counters, and refresh tokens.
- Create enums, relations, constraints, and indexes.
- Create and apply the initial migration.

**Complete when:** Prisma validates the schema and migration status is up to date.

## Phase 4: Prisma Client

- Generate the Prisma Client.
- Configure the PostgreSQL driver adapter.
- Create one reusable `prisma` client in `src/database/prisma.ts`.

**Complete when:** application code can import the typed Prisma Client.

## Phase 5: Plan Seeding

- Seed `FREE` and `PRO` plans with limits and enabled features.
- Use idempotent `upsert` operations.
- Verify the seeded records.

**Complete when:** rerunning the seed does not create duplicate plans.

## Phase 6: Authentication

> Status: **completed** — register, login, refresh-token rotation, logout, auth middleware, `GET /api/v1/auth/me`, and error-handler hardening are implemented, verified, and committed (details in `docs/progress.md`).

- Register users with hashed passwords.
- Log in and issue access tokens.
- Store hashed refresh tokens.
- Add refresh-token rotation, logout, and authentication middleware.

**Complete when:** authenticated routes identify the current user and revoked sessions cannot be refreshed.

## Phase 7: Link Creation

- Validate destination URLs.
- Generate globally unique short codes.
- Enforce plan limits.
- Set expiry rules.
- Create links and usage counters in a transaction.

**Complete when:** an authenticated user can create a valid short link and the correct plan rules are enforced.

## Phase 8: Link Management and Redirects

> Status: **completed** — all waves 8.1–8.6 implemented, verified, and committed.

- List, filter, disable, reactivate, and soft-delete owned links.
- Resolve public short codes.
- Return `302 Found` redirects.
- Record click counts.

**Complete when:** public links redirect correctly and users can manage only their own links.

## Phase 9: Analytics and Usage

- Return click totals to Free users.
- Store and expose detailed analytics to Pro users.
- Return current plan usage.

**Complete when:** analytics visibility and usage reporting follow the active plan.

## Phase 10: Security and Testing

> Status: **in progress** — Waves 10.1–10.3 (security headers/CORS/body limit, per-group rate limiting, and Vitest + supertest test infrastructure with a dedicated test DB) are implemented, verified, and committed. Remaining: Wave 10.4 unit tests, Wave 10.5 integration/E2E tests, Wave 10.6 wrap-up.

- Add security headers, CORS, request-size limits, and rate limits.
- Add unit and integration tests for critical business rules.
- Test the end-to-end register, create, redirect, and analytics flow.

**Complete when:** critical workflows are automated and failure responses are consistent.

## Phase 11: React Client

- Build registration, login, dashboard, link creation, usage, and analytics views.
- Implement token refresh handling.

**Complete when:** the core URL-shortening workflow works end to end through the browser.

## After MVP

- Custom short-code aliases (deferred from Phase 7).
- Redis redirect caching and distributed rate limiting.
- BullMQ analytics processing and cleanup jobs.
- Dockerized API, CI/CD, and deployment.
- Horizontal scaling and load testing.
