# URL Shortener — Frontend

The React + TypeScript web client for the URL shortener. Built with Vite, Tailwind CSS 4, React Router 7, and Recharts. Light-mode, Firecrawl-inspired design system.

## Tech Stack

| Layer | Technology |
| --- | --- |
| Framework | React 19 + TypeScript (strict) |
| Build | Vite 6 |
| Styling | Tailwind CSS 4 (via `@tailwindcss/vite`) |
| Routing | React Router 7 |
| Charts | Recharts (code-split into the analytics bundle) |
| Testing | Vitest + jsdom + Testing Library |

## Getting Started

### Prerequisites

- Node.js 18+
- The backend running (see the repo-root `README.md` / `backend/`). The frontend talks to the backend on `http://localhost:3000`.

### Setup

```bash
# Install dependencies
npm install

# Create .env (gitignored). Leave VITE_API_BASE_URL empty to use the dev proxy.
# VITE_API_BASE_URL=http://localhost:3000

# Start the dev server
npm run dev
```

The dev server starts at `http://localhost:5173`. Requests to `/api/*` and `/health/*` are proxied to `http://localhost:3000` by `vite.config.ts`, so with a running backend you can log in immediately.

### Environment Variables

Create a `.env` file in the frontend root:

```env
# Base URL of the backend API. Leave empty to rely on the Vite dev proxy (/api and /health).
VITE_API_BASE_URL=
```

In production, set `VITE_API_BASE_URL` to your API origin (must be baked in at build time since it is read from `import.meta.env`).

## Project Commands

```bash
npm run dev          # Start the Vite dev server (port 5173)
npm run build        # Typecheck + production build (output to dist/)
npm run preview      # Preview the production build locally
npm run lint         # ESLint
npm run format       # Prettier
npm test             # Run tests once (vitest run)
npm run test:watch   # Run tests in watch mode
npm run test:coverage# Run tests with coverage report
npm run typecheck:test # Typecheck src + test files (tsconfig.test.json)
```

## Testing

Baseline unit tests cover the core non-UI logic:

- `src/api/client.ts` — auth header attachment, typed error envelope / `VALIDATION_ERROR` details parsing, 204/network handling, silent 401→refresh→retry, `session-expired` on refresh failure.
- `src/hooks/useLinks.ts` — mount fetch, filter/page reset, error state, refresh.
- `src/lib/utils.ts` — `cn()`.

Tests use vitest with a jsdom environment and are configured in `vitest.config.ts` / `src/test/setup.ts`. The full component- and page-level suite (form validation, dialogs, auth context/flows, analytics gating) is planned for v2.

## Project Structure

```
src/
├── api/            # Fetch wrapper + typed API functions (auth, links)
├── components/
│   ├── ui/         # Button, Input, Card, Dialog, Pagination
│   ├── layout/     # Header, AuthGuard
│   ├── auth/       # Login/Register forms
│   ├── links/      # Creation form, cards, filters, actions
│   └── analytics/  # Charts, referrer table, Free/Pro gating
├── context/        # AuthContext, ToastContext
├── hooks/          # useLinks, useLinkDetail
├── lib/            # Utils
├── pages/          # Home, Login, Register, Dashboard, LinkDetail, NotFound
├── styles/         # globals.css (design tokens, Tailwind)
├── test/           # Test setup
└── types/          # Shared API types (mirrors backend DTOs)
```

## Production Build

```bash
npm run build
```

This runs `tsc -b` (typecheck) followed by `vite build`. All pages are code-split via `React.lazy`; the Recharts analytics bundle ships separately and is lazy-loaded from the link-detail page. Verify the output serves correctly with `npm run preview`.
