# URL Shortener — Frontend Progress

## Completed

### Frontend Phase 1: Project Scaffolding

- Initialized Vite + React 19 + TypeScript (strict mode) project in `frontend/`.
- Configured Tailwind CSS 4 via `@tailwindcss/vite` plugin.
- Configured ESLint (typescript-eslint + react-hooks + react-refresh) and Prettier.
- Set up `tsconfig.json` with strict mode, `noUncheckedIndexedAccess`, `@/` path alias.
- Created the full directory structure: `src/api/`, `src/components/{ui,layout,auth,links,analytics}`, `src/hooks/`, `src/pages/`, `src/context/`, `src/lib/`, `src/types/`, `src/styles/`.
- Added `VITE_API_BASE_URL` environment variable with dev proxy to `http://localhost:3000`.
- Created `src/styles/globals.css` with Tailwind v4 `@import "tailwindcss"` directive.
- Created `src/main.tsx` entry point (StrictMode + BrowserRouter).
- Created `src/App.tsx` with React Router v7 routes: `/`, `/login`, `/register`, `/dashboard`, `/links/:id`, `*`.
- Added 6 placeholder pages with Tailwind-styled UI:
  - `HomePage` — landing with CTA, redirects if authenticated
  - `LoginPage` — email/password form, link to register
  - `RegisterPage` — email/username/password form, link to login
  - `DashboardPage` — placeholder for link management
  - `LinkDetailPage` — placeholder for link detail + analytics
  - `NotFoundPage` — 404 with back-to-home link
- Verified: `npx tsc --noEmit` green, `npm run dev` serves on `http://localhost:5173` and responds 200.

### Frontend Phase 1.5: Design System & Firecrawl-Inspired UI

Implemented a light-mode, Firecrawl-inspired design system across all pages (orange accent theme, gradients, glassmorphism, glow hover effects, entrance animations, larger typography).

Design system (`src/styles/globals.css` + `index.html`):
- Added Inter font from Google Fonts.
- Defined an orange `--color-primary-*` token scale (`#f97316` etc.) via Tailwind v4 `@theme`.
- Added custom utilities: `gradient-text`, `gradient-text-subtle`, `glass-card`, `glass-card-hover`, `glow-hover`, `input-field`, `mesh-bg`.
- Added keyframe animations: `fade-in`, `slide-up`, `slide-up-delayed`, `glow-pulse`, wired as `--animate-*` theme tokens.

Reusable UI components (`src/components/`):
- `ui/Button.tsx` — variants (primary gradient / secondary / ghost / destructive), sizes (sm/md/lg), optional icon, loading spinner, orange glow hover + focus ring.
- `ui/Input.tsx` — labeled input with optional icon, error state, orange focus ring, larger `text-base` typography.
- `ui/Card.tsx` — glassmorphism card with optional hover effect.
- `layout/Header.tsx` — sticky frosted-glass header with gradient logo, orange active nav state, responsive mobile hamburger menu.

Pages rebuilt with the design system (all include `<Header />`):
- `HomePage` — animated gradient hero, stat counters, glass feature cards, link-management preview panel, footer.
- `LoginPage` / `RegisterPage` — centered glass card forms with gradient logo, icon inputs, gradient CTAs.
- `DashboardPage` — gradient heading, link-shortening form, status filter pills (All/Active/Disabled), glass link cards with status badge, click count, and copy-to-clipboard (currently renders mock data).
- `LinkDetailPage` — glass detail + analytics card with device/country breakdowns and sidebar stats (mock data).
- `NotFoundPage` — large gradient `404` with gradient CTA.

Verified: `npx tsc --noEmit`, `npm run lint`, and `npm run build` are all green; dev server serves and responds 200.

### Frontend Phase 2: API Client and Types

The `src/api/` and `src/types/api.ts` scaffolded in setup was completed and wired to the backend.

- Corrected the API path prefix from `/api/*` to the backend's actual mount paths:
  - `src/api/client.ts` — refresh-exempt paths and the refresh call now use `/api/v1/auth/*`.
  - `src/api/auth.ts` — register/login/refresh/logout/me all use `/api/v1/auth/*`.
  - `src/api/links.ts` — create and list use `/api/v1/links`.
- `src/types/api.ts` was verified against the backend DTOs (auth + link response shapes match the live controllers).
- The fetch wrapper (`src/api/client.ts`) already implements: base URL from env, JSON parsing, typed `ApiClientError` with `status`/`code`, `Authorization` header attachment, and automatic 401→refresh retry with a refresh lock + `session-expired` event.

### Frontend Phase 3: Authentication UI

Implemented full end-to-end authentication wired to the backend.

- `src/context/AuthContext.tsx` — `AuthProvider` providing `{ user, loading, login, register, logout }`:
  - `login(email, password)` → `POST /api/v1/auth/login`, stores the user.
  - `register(email, password, username?)` → registers then auto-logs-in.
  - `logout()` → `POST /api/v1/auth/logout` (clears cookie server-side), clears user.
  - Restores the session on mount via `GET /api/v1/auth/me` (which triggers a silent refresh on 401); clears the user on the `session-expired` window event.
- `src/components/auth/AuthGuard.tsx` — protects `/dashboard` and `/links/:id`; shows a spinner while `loading`, redirects to `/login` (preserving the intended destination) when unauthenticated.
- `src/App.tsx` — wrapped routes in `AuthProvider`; `PublicOnly` redirects authenticated users away from `/login` and `/register` to `/dashboard`.
- `src/pages/LoginPage.tsx` — controlled email/password form, submit calls `login()`, inline error banner (from `ApiClientError.message`), loading state on the button, redirects to the originally-requested route or `/dashboard`.
- `src/pages/RegisterPage.tsx` — controlled email/username/password form, submit calls `register()` then redirects to `/dashboard`, inline error banner and loading state.
- `src/components/layout/Header.tsx` — replaced the hardcoded `isAuthenticated = false` with real `useAuth()` state; shows the logged-in username, wires the Log out button to `logout()` + navigate home, and updates nav links based on auth status (desktop + mobile).

Verified: `npx tsc --noEmit`, `npm run lint`, and `npm run build` are all green.

### Frontend Phase 4: Link Creation

- `src/components/links/LinkCreationForm.tsx` — URL input, submit button with loading state, inline error display (from `ApiClientError.message`), calls `createLink()` then refreshes the list via `onCreated`.
- `src/api/links.ts` — `createLink(input)` posts to `/api/v1/links` and returns the `LinkResponseDto`.

### Frontend Phase 5: Link Listing and Pagination

- `src/hooks/useLinks.ts` — central link list state: loading, error, `status` filter (`ALL`/`ACTIVE`/`DISABLED`), pagination (`page`, `pageSize`, `total`, `totalPages`); resets to page 1 on filter change; exposes `refresh()`.
- `src/components/links/LinkCard.tsx` — shows status badge (color-coded per status), link id, truncated original URL, the full `shortUrl`, expiry date (when set), click count, copy-to-clipboard button, and a link to the detail page.
- `src/components/links/LinkFilters.tsx` — All / Active / Disabled status tabs.
- `src/components/ui/Pagination.tsx` — prev/next controls with "Page X of Y", hidden when only one page.
- `src/pages/DashboardPage.tsx` — fully wired: creation form, filters, paginated + filtered link list, loading skeletons, error banner, and empty states (differentiated between "no links yet" and "no links match this filter").

Verified: `npx tsc --noEmit`, `npm run lint`, and `npm run build` are all green.

### Frontend Phase 6: Link Management Actions

- `src/hooks/useLinkDetail.ts` — fetches a single link + analytics in parallel; tracks loading / 404 / error; exposes `disable()`, `enable()`, `remove()` actions (calls `updateLinkStatus` / `deleteLink`) and a `removed` flag so the page can redirect after delete.
- `src/components/ui/Dialog.tsx` — reusable confirmation popup (overlay + modal, Esc-to-close, click-outside-to-close).
- `src/components/links/LinkActions.tsx` — Disable/Enable toggle (shows "Disable" when active, "Enable" when disabled) + Delete button that opens the confirmation dialog.
- `src/pages/LinkDetailPage.tsx` — rewritten to show the real link (short URL with external-link icon, original URL, status badge, copy button, created/expires/custom/clicks details). Disable/Enable and Delete live here (detail page only, per roadmap). After a successful delete the page navigates back to `/dashboard`. Includes a 404 state.

### Frontend Phase 7: Analytics Display

- `src/components/analytics/ClickChart.tsx` — Recharts line chart of clicks over time (Pro).
- `src/components/analytics/BreakdownPie.tsx` — Recharts pie chart (devices; Pro).
- `src/components/analytics/BreakdownBar.tsx` — Recharts bar chart (browsers, countries, operating systems; Pro).
- `src/components/analytics/ReferrerTable.tsx` — top-referrer table with progress bars (Pro).
- `src/components/analytics/AnalyticsSection.tsx` — gates Free vs Pro: Free/expired users see only the total-clicks number ("Detailed analytics are available on the Pro plan"); Pro users see the full chart set.
- `src/pages/LinkDetailPage.tsx` — lazy-loads `AnalyticsSection` via `React.lazy` + `Suspense` so the Recharts dependency ships in a separate chunk, only fetched when viewing link details (matches the roadmap's lazy-load requirement). `npm run build` confirms Recharts is code-split (main bundle ~281 kB, `AnalyticsSection` chunk ~426 kB).

### Requested UX tweaks

- Dashboard `LinkCard` short URL is now a real `<a>` link that opens `link.shortUrl` in a new tab (`target="_blank" rel="noopener noreferrer"`), with an external-link icon.
- `HomePage` hero now reacts to auth state: logged-in users see a single "Go to your dashboard" CTA (instead of Register/Login); logged-out visitors still see the marketing CTAs.

Verified: `npx tsc --noEmit`, `npm run lint`, and `npm run build` are all green (build output clean, no chunk-size warning after code-splitting).

### Frontend Phase 8: Polish and Responsive Design

- **Toast notification system**: Created `ToastContext.tsx` (provider + `useToast()` hook) with auto-dismiss (5s), max 3 visible, success/error/info types. Added `toast-in` keyframe animation in `globals.css`.
- **Toasts wired to all user actions**: login success, register success, link creation, copy-to-clipboard (replaced `copied` toggle state in `LinkCard` and `LinkDetailPage`), link disable/enable, link delete.
- **Client-side form validation**: `LoginPage` validates email format + required; `RegisterPage` validates email format, password min 8 chars, username max 50 chars; `LinkCreationForm` validates URL format via `new URL()`. All show inline field-level errors using the `Input` component's `error` prop.
- **Responsive hardening (375px / 768px / 1280px)**:
  - `HomePage`: hero heading `text-3xl sm:text-5xl md:text-7xl`, subtitle `text-lg sm:text-xl`
  - `DashboardPage`: filter row stacks on mobile (`flex-col sm:flex-row`), heading `text-3xl sm:text-4xl`
  - `LinkDetailPage`: sidebar reordered on mobile (`order-first lg:order-last`) so total-clicks card shows first; heading and total-clicks number responsive
  - `NotFoundPage`: 404 text `text-6xl sm:text-8xl md:text-9xl`, subtitle `text-xl sm:text-2xl`
  - `AnalyticsSection`: heading and total-clicks number responsive
- **Improved skeleton loaders**: `DashboardPage` skeletons now mirror `LinkCard` layout (status badge, URL lines, action buttons). `LinkDetailPage` skeletons mirror the detail card + analytics card structure.
- **Route-based code splitting**: All 6 pages wrapped in `React.lazy()` in `App.tsx` with a shared `Suspense` fallback. Build confirms each page is a separate chunk (HomePage 8.5KB, DashboardPage 9.5KB, LinkDetailPage 12.8KB, etc.).
- **Created `src/lib/utils.ts`** with `cn()` class-name helper.

Verified: `npx tsc --noEmit`, `npm run lint`, and `npm run build` are all green.

### Frontend Phase 9: Accessibility and Error Handling

**Focus indicators & keyboard navigation:**
- `globals.css`: added a global `:focus-visible` orange outline (2px, offset 2px) for all interactive elements, with `:focus:not(:focus-visible)` suppression so the ring only shows on keyboard navigation (not mouse clicks).
- `Dialog.tsx`: implemented a full focus trap — Tab/Shift+Tab cycle within the dialog, `Escape` to close, focus moves to the confirm button on open, and focus restores to the trigger element on close. Removed the unused `children` prop from the interface.
- `main.tsx`: added a "Skip to main content" link (`.sr-only-focusable`, visible on focus) that jumps to `#main-content`; every page's `<main>` now has `id="main-content"`.
- `Pagination.tsx`: wrapped in `<nav aria-label="Pagination">` and added `role="current"` to the page indicator.
- `LinkFilters.tsx`: converted to a semantic tab group with `role="tablist"`, `role="tab"`, and `aria-selected` on each tab.

**ARIA attributes:**
- `Input.tsx`: wired `aria-describedby` (unique `{id}-error` id) linking errors to their field, added `aria-invalid` on error, and `aria-hidden="true"` on the decorative icon.
- `Button.tsx`: added `aria-busy` while loading and marked the spinner `aria-hidden`.
- `Header.tsx`: added `aria-expanded` + `aria-controls="mobile-nav"` to the hamburger toggle, `id="mobile-nav"` on the mobile nav, and `aria-label="Main navigation"` / `aria-label="Mobile navigation"` to distinguish the two navs.
- `AuthGuard.tsx`: loading container now has `role="status"`, `aria-busy="true"`, and an `sr-only` "Loading..." text.
- All decorative Lucide icons across every page/component now carry `aria-hidden="true"` (feature icons, input icons, button icons, logo icons, badges).
- `ToastContext.tsx`: toast items added `aria-atomic="true"` so the full message is announced.
- `LinkCard.tsx`: status is communicated via text + color dot (color is never the only indicator).

**Screen reader support for charts:**
- `ClickChart.tsx`: `role="img"` + `aria-label` + an `sr-only` text summary of the click data.
- `BreakdownPie.tsx` / `BreakdownBar.tsx`: same pattern (`role="img"`, `aria-label`, `sr-only` data summary).
- `ReferrerTable.tsx`: converted from `<div>` rows to a semantic `<table>` with an `sr-only` `<thead>`.

**Loading states:**
- `DashboardPage` and `LinkDetailPage` skeleton loaders now wrap in `role="status"` + `aria-busy="true"` with `sr-only` "Loading..." text.

**Error handling:**
- `api/client.ts`: `ApiClientError` now carries optional `details` (Record of backend field errors); network error message clarified to "...Check your connection and try again."
- `LinkCreationForm.tsx`: handles `PLAN_LIMIT_REACHED` with a distinct amber upgrade banner (separate from field errors) and parses `VALIDATION_ERROR` field details for `originalUrl`/`url`.
- `useLinkDetail.ts` + `LinkDetailPage.tsx`: added a `featureUnavailable` state for `FEATURE_NOT_AVAILABLE`, rendering an amber "Detailed analytics are available on the Pro plan" upgrade message instead of a generic error.
- `LoginPage` / `RegisterPage`: parse `VALIDATION_ERROR` `details` into per-field errors on their respective inputs.
- Verified every `.catch` block surfaces user-visible feedback (inline error or toast) — no silent failures.

Verified: `npx tsc --noEmit`, `npm run lint`, and `npm run build` are all green.

## Next Phase

Phase 10: Final Polish and Deployment Prep — see `docs/roadmap.md` (README, production build against the running backend, no console logs in prod, final responsive/a11y pass, commit and tag).
