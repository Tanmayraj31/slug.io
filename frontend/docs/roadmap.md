# URL Shortener — Frontend Roadmap

This roadmap defines the implementation order and completion criteria for each phase.

The frontend is built in parallel with the backend's Phase 8+ completion. The backend already has auth (Phase 6), link creation (Phase 7), and link listing (Wave 8.1) implemented. Remaining backend features (link detail, status updates, deletion, redirect, analytics) are in progress.

## Version Control Checkpoint

After completing and verifying every phase, commit the relevant files.

```powershell
git status
git add <relevant-files>
git diff --staged
git commit -m "<descriptive phase commit message>"
```

Never commit `.env`, `node_modules`, or build output.

---

## Phase 1: Project Scaffolding

- Initialize Vite + React + TypeScript project.
- Configure Tailwind CSS 4.
- Configure ESLint and Prettier.
- Set up `tsconfig.json` with strict mode.
- Create the directory structure (`src/api/`, `src/components/`, `src/pages/`, etc.).
- Add `VITE_API_BASE_URL` environment variable.
- Create `src/styles/globals.css` with Tailwind directives.
- Create `src/App.tsx` with basic React Router setup.
- Create `src/main.tsx` entry point.
- Add placeholder pages (Home, Login, Register, Dashboard, NotFound).
- Verify `npm run dev` starts the dev server.

**Complete when:** `npm run dev` serves a page with working React Router and Tailwind styles.

---

## Phase 1.5: Design System & Base UI (Completed ahead of plan)

> Carried out as part of the Firecrawl-inspired UI work; see `docs/progress.md`. These reusable primitives are already implemented and should be reused in later phases rather than recreated:
> - `components/ui/Button.tsx`, `components/ui/Input.tsx`, `components/ui/Card.tsx`
> - `components/layout/Header.tsx` (shared sticky header)
> - Design tokens + custom utilities in `globals.css` (`gradient-text`, `glass-card`, `glow-hover`, `mesh-bg`, etc.)

---

## Phase 2: API Client and Types

- Create `src/types/api.ts` with all API response types (mirrors backend DTOs).
- Create `src/api/client.ts` fetch wrapper:
  - Base URL from env.
  - JSON parsing.
  - Typed error responses.
  - `Authorization: Bearer` header attachment.
  - Automatic token refresh on 401 (with refresh lock).
- Create `src/api/auth.ts` with auth API functions (register, login, refresh, logout, me).
- Create `src/api/links.ts` with link API functions (create, list).
- Verify API calls work against the running backend.

**Complete when:** all API functions return correctly typed responses and 401 triggers a silent refresh.

---

## Phase 3: Authentication UI

- Create `src/context/AuthContext.tsx` with auth state management.
- Implement `login`, `register`, `logout` functions in context.
- Implement session restoration on app load (call `/me` → silent refresh if expired).
- Create `src/components/auth/LoginForm.tsx`.
- Create `src/components/auth/RegisterForm.tsx`.
- Create `src/pages/LoginPage.tsx` and `src/pages/RegisterPage.tsx`.
- Create `AuthGuard` component for protected routes.
- Add redirect logic: authenticated users go to `/dashboard`, unauthenticated go to `/login`.
- Create `src/components/layout/Header.tsx` with nav and user menu.
- Test full auth flow: register → login → session restore → logout.

**Complete when:** a user can register, log in, see their email in the header, refresh the page and stay logged in, and log out.

---

## Phase 4: Link Creation

- UI primitives (Button, Input, Card) already exist from Phase 1.5 — build the remaining `Badge.tsx` and `Spinner.tsx`.
- Create `src/components/links/LinkCreationForm.tsx`:
  - URL input field.
  - Submit button with loading state.
  - Error display for `INVALID_URL`, `PLAN_LIMIT_REACHED`, `VALIDATION_ERROR`.
  - Shows remaining daily usage after successful creation.
- Create `src/hooks/useLinks.ts` for link list state management.
- Create `src/components/links/LinkCard.tsx`:
  - Shows original URL (truncated), short URL, status badge, click count.
  - Copy short URL button.
- Create `src/pages/DashboardPage.tsx`:
  - Link creation form at top.
  - Link list below using `LinkCard` components.
  - Loading skeleton while fetching.
- Test: create a link → it appears in the list → copy button works.

**Complete when:** an authenticated user can create a short link and see it in their dashboard.

---

## Phase 5: Link Listing and Pagination

- Extend `src/api/links.ts` with list API function (query params: status, page, pageSize).
- Create `src/components/links/LinkFilters.tsx` with status filter tabs (All / Active / Disabled).
- Create `src/components/ui/Pagination.tsx`.
- Integrate pagination and filters into `DashboardPage.tsx`.
- Handle empty states (no links yet).
- Handle loading states (skeleton placeholders).
- Test: filter by status, paginate through pages, verify correct data.

**Complete when:** the dashboard correctly filters and paginates the user's links.

---

## Phase 6: Link Management Actions

- Extend `src/api/links.ts` with detail, status update, and delete API functions.
- Create `src/components/links/LinkActions.tsx`:
  - Disable/Enable toggle button.
  - Delete button with confirmation dialog.
- Create `src/components/ui/Dialog.tsx` for delete confirmation.
- Create `src/pages/LinkDetailPage.tsx`:
  - Full link details display.
  - Copy short URL button.
  - Disable/Enable and Delete actions.
  - Back to dashboard link.
- Wire status toggle: optimistic UI update, rollback on error.
- Wire delete: confirmation dialog, redirect to dashboard on success.
- Test: disable a link → status badge changes → re-enable → delete → confirm → link removed.

**Complete when:** a user can disable, re-enable, and delete their own links from the detail page.

---

## Phase 7: Analytics Display

- Extend `src/api/links.ts` with analytics API function.
- Create `src/hooks/useAnalytics.ts`.
- Create `src/components/analytics/TotalClicks.tsx` (simple number display, all plans).
- Create `src/components/analytics/ClickChart.tsx` (Recharts line chart, Pro only).
- Create `src/components/analytics/ReferrerTable.tsx` (table, Pro only).
- Create `src/components/analytics/DeviceBreakdown.tsx` (Recharts pie chart, Pro only).
- Create `src/components/analytics/BrowserStats.tsx` (Recharts bar chart, Pro only).
- Create `src/components/analytics/OsStats.tsx` (Recharts bar chart, Pro only).
- Create `src/components/analytics/CountryStats.tsx` (Recharts bar chart, Pro only).
- Integrate analytics into `LinkDetailPage.tsx`:
  - Free users see total clicks only.
  - Pro users see all charts.
- Lazy-load analytics components.
- Test: view link detail → charts render for Pro, total clicks for Free.

**Complete when:** analytics display correctly for both Free and Pro plans.

---

## Phase 8: Polish and Responsive Design

- Implement responsive layouts across all pages.
- Mobile: hamburger menu in header, stacked cards, full-width forms.
- Tablet: expanded cards, two-column where appropriate.
- Desktop: table-based link list, side-by-side charts.
- Add skeleton loaders for all data-fetching states.
- Add empty states with helpful messages.
- Add form validation messages (inline, below fields).
- Add toast notifications for success/error actions.
- Test on mobile viewport (375px), tablet (768px), desktop (1280px).

**Complete when:** the app looks and works correctly at 375px, 768px, and 1280px widths.

---

## Phase 9: Accessibility and Error Handling (Completed)

> Carried out as described; see `docs/progress.md` for full details. Phase 9 delivered visible focus indicators, ARIA attributes (`aria-describedby`, `role="alert"`, `aria-busy`, `role="status"`, `aria-hidden` on decorative icons, chart `role="img"` + `sr-only` data summaries), keyboard navigation (skip-to-content link, dialog focus trap), a semantic `role="tablist"` filter group, screen-reader-friendly chart/textual alternatives, and full backend error-code coverage (`PLAN_LIMIT_REACHED`, `FEATURE_NOT_AVAILABLE`, `VALIDATION_ERROR` field-level parsing, `NETWORK_ERROR`).

- Add visible focus indicators to all interactive elements.
- Add `aria-label` to icon-only buttons.
- Add `aria-describedby` to form error messages.
- Add `role="alert"` to error containers.
- Verify keyboard navigation through all forms and interactive elements.
- Verify color contrast ratios.
- Handle all backend error codes with appropriate UI.
- Test: tab through login form, dashboard, link detail page.

**Complete when:** the app is navigable by keyboard and error messages are accessible.

---

## Phase 10: Final Polish and Deployment Prep (Completed)

> Carried out as described; see `docs/progress.md` for full details. Phase 10 delivered a `frontend/README.md`, a verified clean production build (code-split via `React.lazy`; Recharts in a separate lazy-loaded chunk), confirmed no `console.log`/`console.debug` or hardcoded secrets in the build, and added `*.tsbuildinfo` to `.gitignore`.

- Add `README.md` with setup instructions.
- Verify production build (`npm run build`) works.
- Test production build against the running backend.
- Add route-based code splitting (React.lazy).
- Verify no console logs or sensitive data in production build.
- Final responsive and accessibility pass.
- Commit and tag.

**Complete when:** `npm run build` produces a working production build that serves correctly.

---

## Backend Dependencies

The frontend can proceed through most phases while the backend is still in progress. The only blocking dependencies are:

| Frontend Phase | Backend API Needed | Backend Status |
|---------------|-------------------|----------------|
| Phase 1 (Scaffolding) | None | — |
| Phase 2 (API client) | All implemented endpoints | Available |
| Phase 3 (Auth) | register, login, refresh, logout, me | Implemented |
| Phase 4 (Link creation) | create link | Implemented |
| Phase 5 (Link listing) | list links | Implemented |
| Phase 6 (Link management) | get link, update status, delete link | **Planned (8.2–8.4)** |
| Phase 7 (Analytics) | get analytics | **Planned (Phase 9)** |
| Phase 8–10 (Polish) | All above | — |

Phases 1–5 can proceed immediately. Phases 6–7 will need the corresponding backend endpoints to be implemented first (or can be stubbed with mock data).

---

## Phase 10.5: Baseline Unit Testing (v1 smoke tests)

> Scope decision: for v1, add only the test tooling plus targeted "smoke" unit tests over the highest-value pure-logic code. The full component + page-level suite is intentionally deferred to v2 to keep Phase 10 / deployment moving. See `docs/progress.md` for what was delivered.

- Add test tooling: `vitest`, `jsdom`, `@testing-library/react`, `@testing-library/jest-dom`, `@vitest/coverage-v8`.
- Add scripts: `test`, `test:watch`, `test:coverage`, `typecheck:test`.
- Add `vitest.config.ts` (jsdom env, `@/` alias, `src/test/setup.ts`) and `src/test/setup.ts` (jest-dom matchers).
- Add `tsconfig.test.json` so test files are typechecked with vitest/jest-dom types (`typecheck:test`), separate from the app build config which excludes `*.test.*`.
- Smoke tests cover: `src/api/client.ts` (refresh-on-401, error envelope/`VALIDATION_ERROR` details parsing, 204/network handling, `session-expired` on refresh failure) and `src/hooks/useLinks.ts` (mount fetch, filter/page reset, error state, `refresh()`), plus `src/lib/utils.ts` (`cn()`).

**Complete when:** `npm test`, `npm run typecheck:test`, `npm run lint`, and `npm run build` all pass.

