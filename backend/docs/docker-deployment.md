# Docker Deployment Documentation

## Table of Contents

1. [Containerization Concepts](#1-containerization-concepts)
2. [Dockerfile Anatomy](#2-dockerfile-anatomy)
3. [Dockerignore](#3-dockerignore)
4. [Docker Compose](#4-docker-compose)
5. [Implementation Phases](#5-implementation-phases)
6. [Key Engineering Decisions](#6-key-engineering-decisions)
7. [Common Commands Reference](#7-common-commands-reference)
8. [Troubleshooting](#8-troubleshooting)

---

## 1. Containerization Concepts

### What is a Container?

A container is a lightweight, standalone, executable unit that packages your application code together with all its dependencies (libraries, runtime, system tools, system libraries). It guarantees the software will run the same regardless of where it is deployed.

### Container vs Virtual Machine

```
Virtual Machine                    Container
┌─────────────────────┐           ┌─────────────────────┐
│   App A  │  App B   │           │   App A  │  App B   │
├─────────────────────┤           ├─────────────────────┤
│  Bins/Libs (guest)  │           │  Bins/Libs (shared) │
├─────────────────────┤           ├─────────────────────┤
│  Guest OS (full)    │           │  Docker Engine      │
├─────────────────────┤           ├─────────────────────┤
│  Hypervisor         │           │  Host OS            │
├─────────────────────┤           ├─────────────────────┤
│  Host OS            │           │  Hardware           │
├─────────────────────┤           └─────────────────────┘
│  Hardware           │
└─────────────────────┘
~700MB per VM          ~150MB per container
Minutes to start       Seconds to start
Full OS isolation      Shared kernel
```

| Aspect | VM | Container |
|--------|-----|-----------|
| Size | GBs | MBs |
| Boot time | Minutes | Seconds |
| Isolation | Full (separate OS) | Process-level (shared kernel) |
| Resource overhead | High | Low |
| Use case | Running different OSes | Running apps on same OS |

### Why Docker for Backend Deployment?

1. **Reproducibility** — "works on my machine" disappears. The Dockerfile IS the machine.
2. **Isolation** — Your app, Postgres, and Nginx each run in their own container with their own dependencies. No conflicts.
3. **Portability** — The same image runs on your laptop, a $5 VPS, or AWS ECS. No changes needed.
4. **Scaling** — Need more capacity? Run 5 copies of the same container behind a load balancer.
5. **Rollback** — Bad deploy? `docker compose pull previous-sha && docker compose up -d`. Done.

### Key Terminology

| Term | What It Means |
|------|---------------|
| **Image** | A read-only template. Like a class in OOP. Contains your code + dependencies + config. |
| **Container** | A running instance of an image. Like an object. Has its own filesystem, network, process. |
| **Dockerfile** | A text file with instructions to build an image. Like a recipe. |
| **Docker Compose** | A tool to define and run multi-container apps. Reads `compose.yaml`. |
| **Volume** | Persistent storage that survives container restarts. Your Postgres data lives here. |
| **Registry** | Where images are stored (Docker Hub, GitHub Container Registry, AWS ECR). |
| **Tag** | A label for an image version (e.g., `sha-a1b2c3d`, `latest`, `v1.0.0`). |

---

## 2. Dockerfile Anatomy

### What is a Dockerfile?

A Dockerfile is a text file containing sequential instructions that Docker reads to automatically build an image. Each instruction creates a **layer** in the image. Layers are cached — if nothing changes in a layer, Docker reuses the cached version instead of rebuilding.

### Why Multi-Stage Builds?

A single-stage Dockerfile would either:
- Include dev dependencies (~400MB wasted) → big, insecure image
- Try to remove them after install → still in a layer, still in the image

Multi-stage builds solve this by using multiple `FROM` statements. Each `FROM` starts a new stage. You can `COPY --from=previous_stage` to cherry-pick only what you need. The final image only contains what you explicitly copy — build tools, test frameworks, and dev dependencies are discarded.

### The 3-Stage Pattern for This Project

```
┌─────────────────────────────────────────────────┐
│  Stage 1: deps                                  │
│  Purpose: Install ALL dependencies              │
│  Why: Need devDeps for TypeScript compilation   │
│  Output: node_modules/ (with dev deps)          │
├─────────────────────────────────────────────────┤
│  Stage 2: builder                               │
│  Purpose: Compile TypeScript → JavaScript       │
│  Why: Production runs JS, not TS                │
│  Output: dist/ (compiled JS files)              │
├─────────────────────────────────────────────────┤
│  Stage 3: runner                                │
│  Purpose: Minimal production image              │
│  Why: Small, secure, fast to pull               │
│  Output: dist/ + prod-only node_modules         │
└─────────────────────────────────────────────────┘
```

### Line-by-Line Breakdown

```dockerfile
# syntax=docker/dockerfile:1
```
**Why:** Enables BuildKit syntax features (parallel builds, mount caches). This is the modern way to start any Dockerfile. The `# syntax` parser directive must be the very first line.

---

```dockerfile
# ──────────────────────────────────────────────
# Stage 1: Install dependencies
# ──────────────────────────────────────────────
FROM node:20-alpine AS deps
```
- `FROM` — Start a new build stage. Everything before the next `FROM` is part of this stage.
- `node:20-alpine` — Base image. Alpine Linux (~5MB) with Node.js 20. Tiny, secure, has `wget` (needed for HEALTHCHECK).
- `AS deps` — Name this stage "deps" so we can reference it later with `COPY --from=deps`.

```dockerfile
WORKDIR /app
```
Sets the working directory inside the container. All subsequent commands run from `/app`. Creates the directory if it doesn't exist.

```dockerfile
COPY package.json package-lock.json ./
```
**Why copy package files first?** Docker layer caching. If only your source code changes (not package.json), Docker reuses the cached `npm ci` layer. This cuts rebuilds from ~2 min to <30s.

```dockerfile
RUN npm ci
```
- `npm ci` (not `npm install`) — Deletes `node_modules` first, then installs exactly from `lockfile`. Deterministic, faster, catches lockfile inconsistencies.
- This installs BOTH dependencies and devDependencies (we need `typescript` and `prisma` for the build stage).

---

```dockerfile
# ──────────────────────────────────────────────
# Stage 2: Build TypeScript
# ──────────────────────────────────────────────
FROM node:20-alpine AS builder
WORKDIR /app
```
New stage. Fresh Alpine image — no `node_modules` from stage 1.

```dockerfile
COPY --from=deps /app/node_modules ./node_modules
```
Copy the `node_modules` from the "deps" stage. This gives us all dependencies including `typescript`, `prisma`, etc.

```dockerfile
COPY . .
```
Copy all source code, `tsconfig.json`, `prisma/schema.prisma`, etc. Note: `.dockerignore` excludes `node_modules/`, `.env`, `tests/`, etc. so they don't get copied.

```dockerfile
RUN npx prisma generate
```
**Why here?** Prisma needs to generate the type-safe client before TypeScript can compile. The `schema.prisma` file references `output = "../src/generated/prisma"`, so the generated client appears at `src/generated/prisma/`. After `tsc` compiles, it ends up at `dist/generated/prisma/`.

```dockerfile
RUN npm run build
```
Runs `tsc` (the `build` script we add in Phase 1). Compiles all `.ts` files in `src/` → `.js` files in `dist/`, preserving directory structure. The `tsconfig.json` has `"rootDir": "./src"` and `"outDir": "./dist"`.

---

```dockerfile
# ──────────────────────────────────────────────
# Stage 3: Production runtime
# ──────────────────────────────────────────────
FROM node:20-alpine AS runner
WORKDIR /app
```
New stage. Fresh Alpine — only ~50MB. No build tools, no devDependencies, no TypeScript.

```dockerfile
RUN addgroup --system --gid 1001 appgroup && \
    adduser --system --uid 1001 --ingroup appgroup appuser
```
Creates a non-root user. **Critical security practice.** If an attacker escapes the container, they only get `appuser` privileges, not root. Root inside a container can escape to the host kernel.

```dockerfile
COPY --from=builder --chown=appuser:appgroup /app/dist ./dist
```
Copy only the compiled JS from the "builder" stage. The `--chown` sets file ownership so the non-root user can read them.

```dockerfile
COPY --from=deps --chown=appuser:appgroup /app/node_modules ./node_modules
```
**Wait — why copy ALL node_modules again?** We don't. The runner needs production dependencies at runtime (express, pg, bcryptjs, etc.). We could do `npm ci --omit=dev` in this stage, but copying from deps and then pruning is also a valid pattern. The cleanest approach is a separate prod-deps install in the runner stage.

**The correct approach for production:**
```dockerfile
COPY --from=builder --chown=appuser:appgroup /app/dist ./dist
COPY --from=builder --chown=appuser:appgroup /app/package.json ./
COPY --from=builder --chown=appuser:appgroup /app/package-lock.json ./
RUN npm ci --omit=dev --ignore-scripts
```
This installs ONLY production dependencies (~60MB vs ~200MB with devDeps).

```dockerfile
COPY --from=builder --chown=appuser:appgroup /app/prisma ./prisma
```
Prisma migrations directory. Needed if you run `prisma migrate deploy` at container startup.

```dockerfile
USER appuser
```
Switch to non-root user. All subsequent commands (and the running app) execute as `appuser`.

```dockerfile
EXPOSE 3000
```
**Documentation only** — does not actually publish the port. Tells anyone reading the Dockerfile which port the app uses. The actual port mapping happens in `compose.yaml`.

```dockerfile
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/health/live || exit 1
```
Docker runs this command every 30s to check if the app is alive.

| Parameter | Value | Why |
|-----------|-------|-----|
| `interval` | 30s | Check every 30 seconds |
| `timeout` | 5s | Kill check if no response in 5s |
| `start-period` | 20s | Don't mark as unhealthy during first 20s (app is still booting) |
| `retries` | 3 | Mark unhealthy only after 3 consecutive failures |

**Why `wget` not `curl`?** Alpine doesn't ship with `curl`. `wget` is built-in. The `--spider` flag means "don't download the body, just check if the URL is accessible."

```dockerfile
CMD ["node", "dist/server.js"]
```
The command Docker runs when the container starts.

**Why exec form `["node", "dist/server.js"]` instead of shell form `node dist/server.js`?**
- Exec form: Node gets PID 1 directly, receives `SIGTERM` from Docker → graceful shutdown works
- Shell form: `/bin/sh` gets PID 1, Node is a child process → `SIGTERM` goes to shell, not Node → graceful shutdown breaks

---

## 3. Dockerignore

The `.dockerignore` file works like `.gitignore` but for Docker context. When you run `docker build`, Docker sends the **build context** (all files in the directory) to the Docker daemon. Without `.dockerignore`, it sends everything including:

| What gets excluded | Why |
|-------------------|-----|
| `node_modules/` | 800MB+ of files that get reinstalled by `npm ci` anyway |
| `.env` | Contains secrets — should never be in an image |
| `.env.*` | All environment files (except .env.example) |
| `tests/` | Test files are not needed in production |
| `coverage/` | Test coverage reports not needed in production |
| `dist/` | Built output — we rebuild it inside the container |
| `.git/` | Git history (can be hundreds of MB) |
| `*.log` | Log files from local development |
| `docker-compose*.yml` | Compose files are not needed inside the image |
| `Dockerfile` | The Dockerfile itself is not needed inside the image |
| `README.md` | Documentation not needed in production |

**Impact:** Without `.dockerignore`, a `docker build` for this project would send ~1GB+ of context to the Docker daemon. With it, ~2MB.

---

## 4. Docker Compose

### What is Docker Compose?

Docker Compose is a tool for defining and running multi-container Docker applications. Instead of running multiple `docker run` commands with long flags, you define everything in a `compose.yaml` file and run one command: `docker compose up`.

### The 3 Compose Files

We use three compose files for different environments:

| File | When loaded | Purpose |
|------|-------------|---------|
| `compose.yaml` | Always | Base config shared by all environments |
| `compose.override.yaml` | Automatically (no flag needed) | Dev-specific overrides |
| `compose.prod.yaml` | Explicitly (`-f compose.prod.yaml`) | Production-specific overrides |

**Why not one file?** Because dev and production have different needs:
- Dev: expose Postgres port for local tools, bind mount source for hot reload
- Production: no exposed ports, resource limits, restart policies, log rotation

**How merge works:** Compose merges the files, with later files overriding earlier ones. So `compose.prod.yaml` values take precedence over `compose.yaml` values.

### compose.yaml — Base Configuration

> **Note:** The examples below use `app` as a placeholder for the backend service. In the root-level compose, the service is named **`backend`** (and the SPA service is named **`frontend`**). Service names matter — they become Docker DNS hostnames (nginx proxies to `backend:3000`, the backend connects to `postgres:5432`).

```yaml
services:
  app:
    build:
      context: .
      dockerfile: Dockerfile
```
**`build.context`** — The directory sent to Docker daemon for building. In the **root-level compose**, the context points at each subdirectory: `./backend` for the API and `./frontend` for the SPA (not `.` at the repo root, since the Dockerfile lives inside each service folder).

**`build.dockerfile`** — Which Dockerfile to use. Can be `Dockerfile` (default), `Dockerfile.dev`, etc.

```yaml
    ports:
      - "3000:3000"
```
**Port mapping format:** `HOST_PORT:CONTAINER_PORT`
- `3000:3000` — Traffic on host's port 3000 goes to container's port 3000
- In production, we remove this (only nginx exposes ports)

```yaml
    depends_on:
      postgres:
        condition: service_healthy
```
**Why `condition: service_healthy`?** Without it, Docker only waits for the postgres container to *start* (process running). Your app would crash trying to connect because Postgres isn't ready to accept connections yet. With `service_healthy`, Docker waits for the `pg_isready` healthcheck to pass.

```yaml
    env_file: .env
```
Reads environment variables from `.env` file and injects them into the container. This is how your app gets `DATABASE_URL`, `JWT_SECRET`, etc. inside the container without hardcoding them in the Dockerfile.

```yaml
    healthcheck:
      test: ["CMD", "wget", "-q", "-O-", "http://localhost:3000/health/live"]
      interval: 30s
      timeout: 5s
      retries: 3
      start_period: 15s
```
Overrides the Dockerfile HEALTHCHECK (or adds one if Dockerfile doesn't have it). Same logic — checks `/health/live` endpoint.

```yaml
  postgres:
    image: postgres:17-alpine
```
**No `build:` here** — we use a pre-built public image from Docker Hub. No Dockerfile needed.

```yaml
    container_name: url-shortener-postgres
```
Gives the container a predictable name. Without this, Docker generates a random name like `url-shortener-postgres-abc123`. Predictable names are useful for `docker exec` commands.

```yaml
    environment:
      POSTGRES_DB: ${POSTGRES_DB}
      POSTGRES_USER: ${POSTGRES_USER}
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
```
**`${VAR}` syntax** — Reads from the host's environment or `.env` file. Postgres official image uses these to create the database and user on first run.

```yaml
    volumes:
      - postgres_data:/var/lib/postgresql/data
```
**Named volume** — Postgres data persists even if the container is deleted and recreated. Without this, all your data is lost when you `docker compose down`.

The volume name `postgres_data` is defined at the bottom of the file:
```yaml
volumes:
  postgres_data:
```

```yaml
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ${POSTGRES_USER} -d ${POSTGRES_DB}"]
      interval: 5s
      timeout: 5s
      retries: 5
```
`pg_isready` is a Postgres utility that checks if the server is accepting connections. `CMD-SHELL` runs the command through `/bin/sh` so `${VAR}` interpolation works.

### compose.override.yaml — Dev Overrides

```yaml
services:
  postgres:
    ports:
      - "5432:5432"
```
Exposes Postgres to the host machine so you can connect with local tools (pgAdmin, DBeaver, TablePlus) on `localhost:5432`. In production, Postgres is internal only.

### compose.prod.yaml — Production Overrides

```yaml
services:
  app:
    ports: []  # Remove port mapping
```
In production, only the reverse proxy (nginx) exposes ports. The app container is internal.

```yaml
    restart: unless-stopped
```
| Policy | Behavior |
|--------|----------|
| `no` | Never restart (default) |
| `always` | Always restart, including after manual `docker compose stop` |
| `unless-stopped` | Restart on crash/server reboot, but NOT after manual stop |

`unless-stopped` is the correct production default — if you manually stop it, it stays stopped.

```yaml
    deploy:
      resources:
        limits:
          cpus: "1.0"
          memory: 512M
```
Prevents a runaway container from consuming all server resources. Your app shouldn't need more than 512MB. Without limits, a memory leak could OOM the entire server.

```yaml
    logging:
      driver: json-file
      options:
        max-size: "10m"
        max-file: "3"
```
**Log rotation.** Without this, Docker logs grow forever and fill your disk. With this config, each log file is max 10MB, and Docker keeps only the last 3 files. Total max log storage: 30MB per container.

```yaml
    security_opt:
      - no-new-privileges:true
```
Prevents processes inside the container from gaining more privileges via `setuid`/`setgid` bits. Defense-in-depth security measure.

```yaml
    healthcheck:
      interval: 60s  # Override 30s from base
```
Production healthchecks can be less frequent — reduces CPU overhead.

---

## 5. Implementation Phases

> **Structure note:** This project is a **monolith** deployed on a single machine. Phases 1–4 containerize the backend; Phase 5 consolidates everything (backend, frontend, postgres, reverse proxy) into a **root-level compose**; Phases 6–8 cover the frontend container, env docs, and CI. Phase 9 documents the database hosting decision.

### Phase 1: Production Build Step
**Goal:** Add a `tsc` build step so production runs compiled JS, not TypeScript.

**Files:** `backend/package.json`

**Changes:**
- Add `"build": "tsc"` script
- Change `"start": "tsx src/server.ts"` to `"start": "node dist/server.js"`

**Verification:** `npm run build && node dist/server.js` starts the server successfully.

---

### Phase 2: Graceful Shutdown
**Goal:** Handle `SIGTERM`/`SIGINT` so containers shut down cleanly.

**Files:** `backend/src/server.ts`

**Changes:**
- Capture the `http.Server` return value from `app.listen()`
- Add `SIGTERM` and `SIGINT` handlers that:
  1. Stop accepting new HTTP connections (`server.close()`)
  2. Wait for in-flight requests to finish
  3. Disconnect Prisma client (`prisma.$disconnect()`)
  4. Exit with code 0
- Add a 10s forced timeout if graceful shutdown hangs

**Why this matters for Docker:**
- `docker compose down` → sends `SIGTERM` → waits 10s → sends `SIGKILL`
- Without handler: requests dropped, Postgres connections leak
- With handler: clean drain, all requests complete, connections closed

**Verification:** Start server, `docker compose stop` sends SIGTERM, logs show "Received SIGTERM. Shutting down gracefully..."

---

### Phase 3: Dockerfile
**Goal:** Create a multi-stage Dockerfile for the backend.

**Files:** `backend/Dockerfile`

**What it produces:** A ~150MB image containing:
- Node.js 20 runtime (Alpine)
- Compiled JS from `dist/`
- Production-only `node_modules/`
- Prisma migrations
- Non-root user `appuser`

---

### Phase 4: .dockerignore
**Goal:** Prevent unnecessary and sensitive files from entering the Docker build context.

**Files:** `backend/.dockerignore`

---

### Phase 5: Root-Level Compose Files
**Goal:** Define how the backend, frontend, PostgreSQL, and reverse proxy run together on one machine.

**Location:** The compose files live at the **repo root** (not in `backend/`) so a single command orchestrates the whole monolith.

**Files:** `compose.yaml`, `compose.override.yaml`, `compose.prod.yaml` (repo root)

**Services (all in the root `compose.yaml`):**

| Service | Source | Purpose | Port |
|---------|--------|---------|------|
| `backend` | `./backend/Dockerfile` | Express API (monolith) | `3000` (internal) |
| `frontend` | `./frontend/Dockerfile` | React SPA served by nginx | `80` (internal) |
| `postgres` | `postgres:17-alpine` | Database (same instance) | `5432` (internal) |
| `nginx` | `nginx:alpine` | Reverse proxy | `80` (exposed) |

> **Decision made during implementation:** the reverse proxy is **nginx, not Caddy**. Caddy's automatic TLS was swapped for a hand-rolled `nginx/nginx.conf` so certificate/host management stays explicit and adds no image dependency. The frontend container *also* runs nginx, but only as an internal static server.

**How they talk (Docker DNS):**
- `nginx` → `/api/*` and `/health/live` → `proxy_pass http://backend:3000`; `/` → `proxy_pass http://frontend:80` (see `nginx/nginx.conf`)
- `backend` → `DATABASE_URL=...@postgres:5432/...`
- `frontend` → also proxies `/api/*` → `backend:3000` (`frontend/nginx.conf`), so the SPA stays self-contained if it is ever served directly

**Why root-level for a monolith?** Backend + frontend + DB are one deployable unit. One compose file = one `docker compose up` to bring up the whole product, one place to manage restart policies, resource limits, and healthchecks. This is the standard production pattern for a single-machine monolith. (The original doc kept compose in `backend/`; with the frontend now existing, we consolidate at root.)

**Configuration notes (implemented):**
- Compose interpolates `${POSTGRES_*}` (used by the `postgres` service and the backend's generated `DATABASE_URL`) from `backend/.env` — run every root command with `--env-file ./backend/.env`, or export the vars in the shell.
- Base `compose.yaml` maps only `nginx` port `80`. `compose.override.yaml` exposes `postgres:5432` for local tooling. `compose.prod.yaml` adds restart policies, CPU/memory limits, log rotation, `no-new-privileges`, and slower healthchecks.
- Committed layout at repo root: `compose.yaml`, `compose.override.yaml`, `compose.prod.yaml`, `nginx/nginx.conf`, plus `frontend/Dockerfile`, `frontend/nginx.conf`, `frontend/.dockerignore`.

**Verification:**
- Dev: `docker compose --env-file ./backend/.env up` → SPA on :80, backend internal, postgres on :5432 (dev override), all healthy
- Prod: `docker compose --env-file ./backend/.env -f compose.yaml -f compose.prod.yaml up -d` → only nginx exposes a port

---

### Phase 6: Frontend Dockerfile
**Goal:** Create a multi-stage Dockerfile for the React frontend (Vite build + nginx static serve).

**Files:** `frontend/Dockerfile`, `frontend/nginx.conf`, `frontend/.dockerignore`

**What it produces:**
- **Stage 1 (builder):** `node:20-alpine`, `npm ci`, `npm run build` → static `dist/`
- **Stage 2 (runner):** nginx serving the built SPA, with a `location /api/` block reverse-proxying to `backend:3000`

**Key detail:** Because the frontend is served at the same origin and `VITE_API_BASE_URL` is empty, nginx handles all `/api/*` calls by proxying to the backend container. No CORS needed in production (same-origin).

**Status:** ✅ implemented (pulled forward with Phase 5 — the SPA container is required for the root compose to come up).

---

### Phase 7: .env.example
**Goal:** Document all required environment variables for anyone who clones the repo.

**Files:** `backend/.env.example` (core app + Postgres vars) and `frontend/.env.example` (e.g., `VITE_API_BASE_URL`)

**Status:** ✅ implemented — both files are committed.

---

### Phase 8: CI Pipeline
**Goal:** Automate testing and Docker image building on GitHub.

**Files:** `.github/workflows/ci.yml`

**Status:** ✅ implemented.

**What it runs** (on push to `main` and every pull request):

| Job | Steps | Why |
|-----|-------|-----|
| `backend` | `npm ci` → `npx prisma generate` → write `.env.test` → `npm run typecheck:test` → `npm test` → `npm run build` | Full backend gate. Backend tests hit a real Postgres 17 **service container** (gha service, healthchecked via `pg_isready`); the `.env.test` written in CI points at it with relaxed `RATE_LIMIT_*` values, mirroring local dev. `prisma generate` is required because the generated client is gitignored. |
| `frontend` | `npm ci` → `npm run lint` → `npm run typecheck:test` → `npm test` → `npm run build` | Frontend gate. jsdom tests need no services; `build` validates the `tsc -b && vite build` step the Docker image relies on. |
| `docker` | `docker build backend` → `docker build frontend` | Proves both multi-stage `Dockerfile`s compile standalone, so `docker compose ... up --build` won't fail on a broken image. Images are tagged `:ci` and not pushed (no registry auth needed yet). |

**GitHub Actions specifics**
- `actions/checkout@v4` + `actions/setup-node@v4` with `node-version: 20` and `cache: npm` (both lockfiles are dependency-path-hinted so each job caches separately).
- The backend's `tests/setup.ts` and `tests/global-setup.ts` load `.env.test` with `dotenv` `override: true`, so CI must **create that file** (job env vars would be overwritten). `global-setup` then creates `url_shortener_test`, runs `prisma migrate deploy`, and seeds the FREE/PRO plans — no secrets needed in CI.
- If you later want to push images: add the `docker build` + `docker/login-action@v3` + `docker/build-push-action` trio, set `push: true`, and tag by `sha-${GITHUB_SHA::7}` instead of `:ci`.

---

### Phase 9: Database Hosting Decision
**Goal:** Decide where PostgreSQL runs.

**Decision: Postgres on the same instance (in the root compose).**

| Option | When to use |
|--------|-------------|
| **Postgres in compose (same instance)** ✅ | Default. Simplest, one command, free, low latency. Good for a single-machine monolith. |
| **Managed service (Supabase / Neon / AWS RDS / Oracle DB Cloud)** | Only if you need async off-host backups, a higher uptime SLA, or horizontal scaling later. |

**If switching to a managed DB:** Remove the `postgres` service from compose and point `DATABASE_URL` at the remote host (e.g., `postgresql://user:pass@supabase-host:5432/db`). No other changes needed — the backend reads `DATABASE_URL` from env.

---

## 6. Key Engineering Decisions

### Why `npm ci` instead of `npm install`?

| | `npm ci` | `npm install` |
|--|---------|---------------|
| Reads lockfile | Exactly | May update it |
| Deletes node_modules first | Yes | No |
| Deterministic builds | Yes | No |
| Speed | Faster | Slower |
| Used in CI/Docker | **Yes** | No |

### Why Alpine over Debian/Ubuntu?

| | Alpine | Debian slim | Full Debian |
|--|--------|-------------|-------------|
| Base size | ~5MB | ~80MB | ~120MB |
| Final image | ~150MB | ~250MB | ~350MB |
| Package manager | apk | apt | apt |
| Attack surface | Smallest | Small | Large |
| Pre-installed tools | wget, sh | bash, many utils | Everything |

### Why `USER node` (non-root)?

If an attacker exploits a vulnerability in your app and escapes the container:
- **Root user:** Can modify system files, install backdoors, potentially escape to host
- **Non-root user:** Limited permissions, can only affect files owned by `appuser`

This is a **defense-in-depth** measure. Always use non-root in production.

### Why `exec form` for CMD?

```dockerfile
# ✅ Correct — Node gets PID 1, receives SIGTERM directly
CMD ["node", "dist/server.js"]

# ❌ Wrong — /bin/sh gets PID 1, Node is a child process
CMD node dist/server.js
```

With shell form, SIGTERM goes to `/bin/sh`, not Node. Your graceful shutdown handler never fires.

### Why healthcheck with `wget` not `curl`?

Alpine Linux doesn't include `curl`. Adding it (`apk add curl`) increases the image by ~2MB and adds another binary to the attack surface. `wget` is already present and does the same job for healthchecks.

### Why `start_period` in HEALTHCHECK?

Without `start_period`, Docker marks the container as unhealthy during startup (before the app is ready to serve requests). This causes:
- `docker compose up` to report the app as unhealthy
- Dependent services to think the app is broken
- False alerts in monitoring

With `start_period: 20s`, Docker ignores healthcheck failures during the first 20 seconds.

---

## 7. Common Commands Reference

### Building

> All compose commands run from the **repo root** with `--env-file ./backend/.env` (supplies `POSTGRES_*` for interpolation). Without the flag, `${POSTGRES_USER}` etc. interpolate to empty.

```bash
# Build all services defined in compose.yaml
docker compose --env-file ./backend/.env build

# Build only a service (backend / frontend / nginx / postgres)
docker compose --env-file ./backend/.env build backend

# Build with no cache (fresh build)
docker compose --env-file ./backend/.env build --no-cache backend
```

### Running

```bash
# Start all services (dev — auto-loads compose.override.yaml)
docker compose --env-file ./backend/.env up

# Start in background (detached)
docker compose --env-file ./backend/.env up -d

# Start with production config
docker compose --env-file ./backend/.env -f compose.yaml -f compose.prod.yaml up -d

# Postgres only (DB for backend `npm run dev`)
docker compose --env-file ./backend/.env up -d postgres

# Stop all services
docker compose --env-file ./backend/.env down

# Stop and remove volumes (destroys database data!)
docker compose --env-file ./backend/.env down -v
```

### Debugging

```bash
# View logs from all services
docker compose logs

# Follow logs in real-time
docker compose logs -f

# Follow logs from a specific service
docker compose logs -f backend

# View running containers
docker compose ps

# Execute command inside running container
docker compose exec backend sh

# Check container health status
docker inspect --format='{{.State.Health.Status}}' url-shortener-backend
```

### Database Operations

```bash
# Run Prisma migration inside the backend container
docker compose exec backend npx prisma migrate deploy

# Seed the database inside the backend container
docker compose exec backend npm run db:seed

# Open psql inside Postgres container
docker compose exec postgres psql -U url_app -d url_shortener
```

### Cleanup

```bash
# Remove stopped containers
docker compose down

# Remove containers + volumes (destroys data)
docker compose down -v

# Remove dangling images
docker image prune

# Remove ALL unused Docker resources
docker system prune -a

# Check disk usage
docker system df
```

---

## 8. Troubleshooting

### App crashes on startup with "Connection refused"

**Cause:** App tries to connect to Postgres before it's ready.
**Fix:** Ensure `depends_on` has `condition: service_healthy`.

### App crashes with "DATABASE_URL is invalid"

**Cause:** `DATABASE_URL` uses `localhost` inside a container. Containers have their own network — `localhost` inside the app container is the app itself, not Postgres.
**Fix:** Use the service name: `postgresql://user:pass@postgres:5432/dbname`.

### Container keeps restarting

**Cause:** App crashes immediately after starting (check logs).
**Fix:** `docker compose logs app` to see the error.

### "Permission denied" errors in container

**Cause:** Files in the image are owned by root, but the app runs as `appuser`.
**Fix:** Use `--chown=appuser:appgroup` in `COPY` instructions.

### Image is much larger than expected

**Cause:** Dev dependencies included in production image, or `.dockerignore` not excluding `node_modules/`.
**Fix:** Check with `docker image inspect <image>` and `docker history <image>`.

### Postgres data lost after `docker compose down`

**Cause:** Used `docker compose down -v` (volumes flag) or never configured a named volume.
**Fix:** Named volumes persist across `docker compose down` (without `-v`). Only `-v` deletes them.
