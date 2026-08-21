# URL Shortener — Frontend Requirements

## 1. Project Overview

This document defines the requirements for the React frontend of the URL shortener application.

The frontend is a single-page application (SPA) that communicates with the existing Express backend API. It provides the user interface for authentication, link creation, link management, and analytics viewing.

The frontend does not contain business logic for link validation, plan enforcement, or redirect handling — those responsibilities belong to the backend.

---

## 2. Tech Stack

| Concern | Technology |
|---------|------------|
| Build tool | Vite |
| UI library | React 19 |
| Language | TypeScript (strict) |
| CSS | Tailwind CSS 4 |
| Routing | React Router v7 |
| State | React Context + hooks |
| HTTP client | Fetch API (native) |
| Charts | Recharts |
| Icons | Lucide React |
| Linting | ESLint + Prettier |
| Formatting | Prettier |

---

## 3. Project Structure

```
frontend/
├── index.html
├── package.json
├── tsconfig.json
├── vite.config.ts
├── tailwind.config.ts
├── .env                         # VITE_API_BASE_URL
├── public/
├── src/
│   ├── main.tsx                 # Entry point, renders App
│   ├── App.tsx                  # Router setup, providers
│   ├── api/
│   │   ├── client.ts            # Fetch wrapper (base URL, auth headers, error handling)
│   │   ├── auth.ts              # Auth API calls
│   │   └── links.ts             # Links API calls
│   ├── components/
│   │   ├── ui/                  # Reusable primitives (Button, Input, Card, Badge, etc.)
│   │   ├── layout/              # Header, Footer, Sidebar, PageContainer
│   │   ├── auth/                # LoginForm, RegisterForm
│   │   ├── links/               # LinkCard, LinkForm, LinkTable, LinkFilters, Pagination
│   │   └── analytics/           # ClickChart, ReferrerTable, DeviceBreakdown
│   ├── hooks/
│   │   ├── useAuth.ts           # Auth context consumer
│   │   ├── useLinks.ts          # Link list with pagination/filter
│   │   └── useAnalytics.ts      # Analytics data fetching
│   ├── pages/
│   │   ├── HomePage.tsx         # Landing / marketing page
│   │   ├── LoginPage.tsx        # Login form
│   │   ├── RegisterPage.tsx     # Registration form
│   │   ├── DashboardPage.tsx    # Main link management view
│   │   ├── LinkDetailPage.tsx   # Single link detail + analytics
│   │   └── NotFoundPage.tsx     # 404 catch-all
│   ├── context/
│   │   └── AuthContext.tsx      # Auth state, login/logout/refresh
│   ├── lib/
│   │   ├── utils.ts             # cn() helper, date formatting, etc.
│   │   └── constants.ts         # App-wide constants
│   ├── types/
│   │   ├── api.ts               # API response types (mirrors backend DTOs)
│   │   └── index.ts             # Shared domain types
│   └── styles/
│       └── globals.css          # Tailwind directives, custom styles
├── docs/
│   ├── requirements.md
│   └── roadmap.md
└── README.md
```

---

## 4. API Integration

### 4.1 Base Configuration

- The API base URL is configured via `VITE_API_BASE_URL` (default: `http://localhost:3000`).
- All API calls go through a shared `api/client.ts` fetch wrapper.
- The wrapper automatically prefixes the base URL and attaches the `Authorization: Bearer` header from stored access tokens.
- The wrapper parses JSON responses and throws typed errors for non-2xx responses.

### 4.2 API Endpoints Consumed

#### Authentication

| Method | Path | Purpose |
|--------|------|---------|
| `POST` | `/api/v1/auth/register` | Create account |
| `POST` | `/api/v1/auth/login` | Log in, receive access token |
| `POST` | `/api/v1/auth/refresh` | Refresh access token (via cookie) |
| `POST` | `/api/v1/auth/logout` | Revoke refresh token, clear cookie |
| `GET` | `/api/v1/auth/me` | Get current user profile |

#### Links

| Method | Path | Purpose |
|--------|------|---------|
| `POST` | `/api/v1/links` | Create a short link |
| `GET` | `/api/v1/links` | List links with filter and pagination |
| `GET` | `/api/v1/links/:id` | Get single link detail |
| `PATCH` | `/api/v1/links/:id/status` | Disable or reactivate a link |
| `DELETE` | `/api/v1/links/:id` | Soft-delete a link |
| `GET` | `/api/v1/links/:id/analytics` | Get link analytics |

### 4.3 API Response Types

The frontend must mirror the backend's DTOs. All types are defined in `src/types/api.ts`.

```typescript
interface ApiError {
  error: {
    code: string;
    message: string;
  };
}

interface AuthUser {
  id: number;
  email: string;
  username: string | null;
  createdAt: string;
}

interface AuthSuccessResponse {
  accessToken: string;
  user: AuthUser;
}

type LinkStatus = "ACTIVE" | "DISABLED" | "DELETED";

interface LinkResponse {
  id: number;
  originalUrl: string;
  shortCode: string;
  status: LinkStatus;
  isCustom: boolean;
  totalClicks: number;
  expiresAt: string | null;
  createdAt: string;
  updatedAt: string;
  shortUrl: string;
}

interface LinkListResponse {
  links: LinkResponse[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

interface AnalyticsResponse {
  totalClicks: number;
  detailed: {
    clicksOverTime: { date: string; clicks: number }[];
    referrers: { referrer: string | null; clicks: number }[];
    browsers: { browser: string | null; clicks: number }[];
    operatingSystems: { operatingSystem: string | null; clicks: number }[];
    deviceTypes: { deviceType: string | null; clicks: number }[];
    countries: { countryCode: string | null; clicks: number }[];
  } | null;
}
```

### 4.4 Error Handling

The frontend relies on stable error codes from the backend, not message text.

Handled error codes:

| Code | User Action |
|------|-------------|
| `INVALID_CREDENTIALS` | Show "Invalid email or password" |
| `EMAIL_TAKEN` | Show "Email already registered" |
| `VALIDATION_ERROR` | Show field-level errors from the form |
| `INVALID_URL` | Show "Invalid URL" on the link creation form |
| `UNAUTHORIZED` | Redirect to login page |
| `INVALID_REFRESH_TOKEN` | Clear auth state, redirect to login |
| `PLAN_LIMIT_REACHED` | Show plan limit message with upgrade prompt |
| `FEATURE_NOT_AVAILABLE` | Show "Upgrade to Pro" message |
| `LINK_NOT_FOUND` | Show not-found message on link detail page |
| `INTERNAL_ERROR` | Show generic error toast |

---

## 5. Authentication Flow

### 5.1 Token Management

- On login, the backend returns a short-lived JWT access token in the JSON response body.
- The backend sets an HttpOnly `refreshToken` cookie (SameSite=Lax, 30-day max age).
- The frontend stores the access token in memory (React Context state). It is never persisted to localStorage or sessionStorage.
- The access token is attached to every authenticated request via the `Authorization: Bearer` header.

### 5.2 Token Refresh

- The `api/client.ts` wrapper intercepts 401 `UNAUTHORIZED` responses on authenticated requests.
- When a 401 is received, the wrapper automatically calls `POST /api/v1/auth/refresh` (which uses the cookie).
- If the refresh succeeds, the wrapper retries the original request with the new access token.
- If the refresh fails (401 `INVALID_REFRESH_TOKEN`), the user is logged out and redirected to the login page.
- A refresh lock prevents multiple simultaneous refresh attempts (only one refresh request at a time).

### 5.3 Session Lifecycle

1. User opens the app.
2. `AuthContext` calls `GET /api/v1/auth/me` with any stored access token.
3. If the token is valid, the user is authenticated and the dashboard is accessible.
4. If the token is expired, the app attempts a silent refresh.
5. If the refresh succeeds, the user is authenticated.
6. If the refresh fails, the user is shown the login page.

### 5.4 Auth State

The `AuthContext` provides:

```typescript
interface AuthContextType {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, username?: string) => Promise<void>;
  logout: () => Promise<void>;
}
```

---

## 6. Page Requirements

### 6.1 Home Page (`/`)

- Public landing page for unauthenticated visitors.
- Headline, brief description, and call-to-action buttons (Sign Up / Login).
- If the user is already authenticated, redirect to `/dashboard`.

### 6.2 Login Page (`/login`)

- Email and password fields.
- "Log in" button.
- Link to registration page.
- Error messages below the form for invalid credentials.
- Redirect to `/dashboard` on success.

### 6.3 Register Page (`/register`)

- Email, password, and optional username fields.
- "Create account" button.
- Link to login page.
- Field-level validation (email format, password min 8 chars, username max 50 chars).
- Error messages for duplicate email.
- Redirect to `/dashboard` on success.

### 6.4 Dashboard Page (`/dashboard`)

- Requires authentication.
- Displays the link creation form at the top.
- Displays the user's link list below.
- Status filter tabs: All / Active / Disabled.
- Pagination controls.
- Each link shows: original URL, short URL, status badge, total clicks, created date.
- Actions per link: Copy short URL, Disable/Enable toggle, View details, Delete.
- Shows daily usage count and plan limits.

### 6.5 Link Detail Page (`/links/:id`)

- Requires authentication.
- Shows full link details: original URL, short URL, status, created date, expiry date, total clicks.
- Shows analytics section (Pro users see detailed charts, Free users see total clicks only).
- Actions: Copy short URL, Disable/Enable, Delete, Back to dashboard.
- Charts: clicks over time (line chart), top referrers (bar chart), device breakdown (pie chart), browser/OS breakdown (bar charts).

### 6.6 Not Found Page (`/404`)

- Shown for any unmatched route.
- "Page not found" message with a link back to home.

---

## 7. Component Requirements

### 7.1 UI Primitives

Reusable, unstyled-by-default components built on Tailwind:

- **Button** — variants: primary, secondary, destructive, ghost. Sizes: sm, md, lg. Loading state.
- **Input** — text input with label, error message, and optional icon.
- **Card** — container with optional header, content, and footer sections.
- **Badge** — status indicator (active = green, disabled = gray, expired = yellow, deleted = red).
- **Dialog** — modal overlay for confirmations (delete confirmation, logout confirmation).
- **Toast** — temporary notification (success, error, info). Auto-dismisses after 5 seconds.
- **Spinner** — loading indicator.
- **Pagination** — page number buttons with previous/next controls.

### 7.2 Layout Components

- **Header** — app name/logo, navigation links, user menu (username, logout). Shows different items for authenticated vs. unauthenticated users.
- **PageContainer** — centered content wrapper with max-width and padding.
- **Footer** — minimal footer with copyright and links.

### 7.3 Form Components

- **LoginForm** — email + password fields, submit button, error display.
- **RegisterForm** — email + password + username fields, submit button, error display.
- **LinkCreationForm** — original URL input, optional expiry date picker (Pro only), submit button, loading state, error display. Shows remaining daily usage.
- **LinkFilters** — status filter tabs, clear filters button.

### 7.4 Link Components

- **LinkCard** — compact view of a link in the list: original URL (truncated), short URL with copy button, status badge, click count, action buttons.
- **LinkTable** — tabular view with sortable columns (alternative to cards on wider screens).
- **LinkActions** — disable/enable toggle, delete button with confirmation dialog.

### 7.5 Analytics Components

- **ClickChart** — Recharts line chart showing clicks over time. Pro only.
- **ReferrerTable** — table of top referrers with click counts.
- **DeviceBreakdown** — Recharts pie chart of device types (desktop, mobile, tablet). Pro only.
- **BrowserStats** — bar chart of browsers. Pro only.
- **OsStats** — bar chart of operating systems. Pro only.
- **CountryStats** — bar chart of countries. Pro only.
- **TotalClicks** — simple number display. Available to all plans.

---

## 8. Routing

| Path | Component | Auth Required | Description |
|------|-----------|:------------:|-------------|
| `/` | `HomePage` | No | Landing page, redirects to `/dashboard` if authenticated |
| `/login` | `LoginPage` | No | Login form, redirects to `/dashboard` if authenticated |
| `/register` | `RegisterPage` | No | Registration form, redirects to `/dashboard` if authenticated |
| `/dashboard` | `DashboardPage` | Yes | Link management |
| `/links/:id` | `LinkDetailPage` | Yes | Link detail + analytics |
| `*` | `NotFoundPage` | No | 404 catch-all |

Protected routes use an `AuthGuard` wrapper that checks authentication state and redirects to `/login` if not authenticated.

---

## 9. Responsive Design

The frontend must be responsive across these breakpoints:

| Breakpoint | Width | Layout |
|-----------|-------|--------|
| Mobile | < 640px | Single column, stacked forms, card-based link list |
| Tablet | 640px – 1024px | Two-column where appropriate, expanded cards |
| Desktop | > 1024px | Full layout with sidebar/header, table-based link list |

Priority areas for responsive design:
- Link creation form (full width on mobile, inline on desktop)
- Link list (cards on mobile, table on desktop)
- Analytics charts (stacked on mobile, side-by-side on desktop)
- Navigation (hamburger menu on mobile)

---

## 10. Accessibility

The frontend must meet WCAG 2.1 AA basics:

- All interactive elements are keyboard-navigable.
- Forms have visible labels (not just placeholders).
- Error messages are associated with their fields via `aria-describedby`.
- Status badges have screen-reader-friendly text.
- Color contrast meets AA ratios.
- Focus indicators are visible on all interactive elements.
- Images and icons have appropriate `alt` text or `aria-label`.

---

## 11. Security Considerations

- Access tokens are stored in memory only (React state). Never in localStorage, sessionStorage, or cookies accessible to JavaScript.
- The refresh token is HttpOnly and SameSite=Lax. The frontend never reads it directly.
- All API calls use HTTPS in production.
- The frontend never logs tokens or sensitive user data to the console in production.
- The `VITE_API_BASE_URL` is the only environment variable. Secrets are not exposed to the frontend.
- CSRF is handled by the backend's SameSite cookie policy.

---

## 12. Performance Requirements

- Initial page load (LCP) under 2.5 seconds on 3G.
- Code-split by route using React.lazy() and Suspense.
- Lazy-load analytics charts only on the link detail page.
- Debounce search/filter inputs (300ms).
- Optimistic UI updates for disable/enable toggles.
- Show skeleton loaders during data fetching.

---

## 13. Error Display Strategy

| Error Type | Display Method |
|-----------|---------------|
| Form validation errors | Inline below each field |
| API errors on form submit | Inline error message below the form |
| 401 Unauthorized | Redirect to login (silent) |
| 403 Plan limit | Inline message with upgrade prompt |
| 404 Not found | Full-page error with back link |
| 500 Server error | Toast notification |
| Network error | Toast notification with retry option |

---

## 14. Out of Scope (MVP)

The following are not required in the first version:

- Custom short code input (deferred with backend)
- QR code generation
- Password-protected links
- Dark mode toggle
- Internationalization (i18n)
- Push notifications
- PWA / offline support
- Social login (OAuth)
- Email verification flow
- Password reset flow

These features may be added after the core workflow is stable.
