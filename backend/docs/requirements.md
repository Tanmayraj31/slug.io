# URL Shortener — Requirements

## 1. Project Overview

The goal of this project is to build a production-style, subscription-based URL shortener.

The application will allow authenticated users to create short URLs from long URLs. Public visitors will be able to open the short URL and get redirected to the original destination.

The first version will be built as a modular monolith using:

- TypeScript
- Express.js
- PostgreSQL
- React
- JWT-based authentication

The system will later be extended with:

- Redis
- Distributed rate limiting
- Background queues
- Docker
- Multiple EC2 instances
- AWS Application Load Balancer
- Horizontal scaling
- Monitoring and logging

---

## 2. Project Goals

The project should demonstrate:

- Requirement analysis
- API design
- Database design
- Authentication and authorization
- Subscription-based feature access
- URL shortening and redirection
- Expiration handling
- Click analytics
- Rate limiting
- Background job processing
- Redis caching
- Docker-based deployment
- Horizontal scaling on AWS
- Production logging and monitoring

---

## 3. User Types

### 3.1 Free User

A Free user can:

- Register and log in
- Create short URLs
- View their own links
- Disable their own links
- Delete their own links
- View the total number of clicks for each link

Free users will have:

- A limited number of links that can be created per day
- A limited number of active links
- A fixed expiry period
- Automatically generated short codes
- No custom short codes
- No detailed click analytics

### 3.2 Pro User

A Pro user can:

- Access all Free user features
- Create more links per day
- Keep more active links
- Create custom short codes
- Choose an expiry date within the allowed limit
- View detailed click analytics

Pro users will still have documented system limits. The Pro plan will not be technically unlimited.

### 3.3 Public Visitor

A public visitor:

- Does not need to register or log in
- Can open a valid short URL
- Will be redirected to the original URL
- Cannot manage or view private link information

### 3.4 Administrator

Administrator functionality is not required for the first version.

It may later include:

- Viewing reported links
- Disabling malicious links
- Suspending abusive users
- Reviewing system usage
- Managing subscription plans

---

## 4. Initial Subscription Rules

The following limits are initial product decisions and may be adjusted later.

| Feature | Free Plan | Pro Plan |
|---|---:|---:|
| Links created per day | 5 | 500 |
| Maximum active links | 20 | 10,000 |
| Default link expiry | 7 days | User selected |
| Maximum link expiry | 7 days | 1 year |
| Custom short code | No | Yes |
| Total click count | Yes | Yes |
| Detailed analytics | No | Yes |

The backend must enforce these limits. The frontend must not be the only place where subscription rules are checked.

---

## 5. Authentication Requirements

The system must support:

- User registration
- User login
- User logout
- Access-token authentication
- Refresh-token support
- Password hashing
- Protected link-management routes

Passwords must never be stored in plain text.

The public redirect endpoint must not require authentication.

---

## 6. Link Creation Requirements

An authenticated user must be able to submit a long URL and receive a short URL.

The system must:

1. Authenticate the user
2. Validate the request
3. Validate the destination URL
4. Load the user’s active subscription
5. Check the daily link-creation limit
6. Check the active-link limit
7. Validate custom-code access
8. Validate the requested expiry
9. Generate or validate the short code
10. Store the link
11. Update the user’s usage count
12. Return the generated short URL

Link creation and usage-counter updates should be performed consistently, preferably within a database transaction.

---

## 7. URL Validation Requirements

The application must accept only supported web URLs.

Allowed protocols:

- `http`
- `https`

The application must reject unsupported or unsafe protocols such as:

- `javascript`
- `data`
- `file`

The system should also reject malformed URLs.

Private-network and localhost URLs may be restricted to reduce abuse and future SSRF risks.

Examples that may be rejected:

- `localhost`
- `127.0.0.1`
- Private IPv4 ranges
- Cloud metadata endpoints

---

## 8. Short-Code Requirements

Automatically generated short codes should:

- Use a URL-safe character set
- Be difficult to guess sequentially
- Be globally unique
- Have a fixed initial length
- Be generated using Base62 characters

Base62 contains:

- Lowercase letters
- Uppercase letters
- Numbers

Example short code:

```text
aZ82kLm
```

The database must enforce a unique constraint on `short_code`.

If a generated code collides with an existing code, the system must retry with a new code.

The database unique constraint must be treated as the final protection against concurrent collisions.

---

## 9. Custom Short-Code Requirements

Custom short codes are available only to eligible Pro users.

A custom short code must:

- Be globally unique
- Follow an allowed character pattern
- Meet minimum and maximum length requirements
- Not contain reserved system words
- Not already belong to another link
- Not impersonate protected routes

Examples of reserved codes may include:

- `api`
- `auth`
- `admin`
- `health`
- `login`
- `register`

If a custom short code is unavailable, the API must return a clear error.

---

## 10. Link Expiration Requirements

Every link must have an expiry date.

### Free plan

- The backend automatically assigns a fixed expiry date
- The user cannot choose the expiry date

### Pro plan

- The user may select an expiry date
- The selected date must not exceed the plan’s maximum allowed lifetime

Expired links should not be immediately deleted.

When an expired link is requested:

- The system must not redirect the visitor
- The API should return an appropriate expired-link response
- The link should remain visible to its owner
- Existing analytics should remain available according to retention rules

Expired links may be permanently removed later through a scheduled cleanup process.

---

## 11. Link Status Requirements

A link may have a status such as:

- `ACTIVE`
- `DISABLED`
- `EXPIRED`
- `DELETED`

A user must be able to:

- Disable an active link
- Reactivate a disabled link if it has not expired
- Delete a link

For the first version, users should not be allowed to change the original destination URL after link creation.

This rule reduces abuse and keeps analytics tied to a stable destination.

Deletion may initially be implemented as soft deletion.

---

## 12. Redirect Requirements

A public visitor must be able to open a short URL without logging in.

Example:

```http
GET /abc123
```

The system must:

1. Read the short code
2. Find the corresponding link
3. Verify that the link exists
4. Verify that it is active
5. Verify that it has not expired
6. Record or queue the click event
7. Redirect the visitor to the original URL

A successful redirect should use an appropriate HTTP redirect response.

The redirect path must be optimized because it is expected to be the most frequently used endpoint.

---

## 13. Link Management Requirements

An authenticated user must be able to:

- List their own links
- View details of one owned link
- Disable a link
- Reactivate an eligible link
- Delete a link
- View available analytics
- Filter links by status
- Paginate through their links

A user must not be able to access or modify another user’s links.

---

## 14. Analytics Requirements

### Free plan analytics

Free users can view:

- Total click count

### Pro plan analytics

Pro users can view:

- Total clicks
- Clicks over time
- Referrer
- Browser
- Operating system
- Device type
- Country code
- Click timestamp

The system should avoid storing unnecessary personal information.

Raw IP addresses should not be stored unless there is a justified requirement.

A hashed, anonymized, or truncated representation may be used for abuse detection or approximate unique-click analysis.

---

## 15. Usage-Limit Requirements

The system must enforce:

- Daily link-creation limits
- Maximum active-link limits
- Feature access based on subscription plan
- API rate limits

Daily usage must be calculated using a consistent timezone policy.

The chosen timezone policy must be documented. UTC is recommended for backend storage and limit calculation.

The system must correctly handle concurrent requests so that a user cannot exceed their plan limits by sending multiple link-creation requests at the same time.

---

## 16. Subscription Requirements

The first implementation may assign plans manually or through seeded database records.

Payment integration is not required for the first version.

The subscription model must support:

- Free plan
- Pro plan
- Subscription status
- Start date
- End date
- Plan downgrade
- Plan expiry

When a Pro user downgrades:

- Existing links must not be immediately deleted
- Existing custom links should remain valid unless they violate an explicit downgrade policy
- The user must not be allowed to create new links beyond Free plan limits
- Pro-only analytics may become unavailable after the subscription ends
- The downgrade behaviour must remain consistent and documented

---

## 17. API Requirements

The initial API should include the following routes.

### Authentication

```http
POST /api/v1/auth/register
POST /api/v1/auth/login
POST /api/v1/auth/refresh
POST /api/v1/auth/logout
```

### Link management

```http
POST   /api/v1/links
GET    /api/v1/links
GET    /api/v1/links/:id
PATCH  /api/v1/links/:id/status
DELETE /api/v1/links/:id
GET    /api/v1/links/:id/analytics
```

### Public redirect

```http
GET /:shortCode
```

### Health checks

```http
GET /health/live
GET /health/ready
```

The API must use consistent request validation and error responses.

---

## 18. Error-Handling Requirements

The application must use centralized error handling.

Example error response:

```json
{
  "success": false,
  "error": {
    "code": "LINK_LIMIT_REACHED",
    "message": "Your daily link creation limit has been reached.",
    "details": null
  }
}
```

Expected application error codes may include:

- `INVALID_URL`
- `INVALID_CREDENTIALS`
- `UNAUTHORIZED`
- `FORBIDDEN`
- `LINK_NOT_FOUND`
- `LINK_EXPIRED`
- `LINK_DISABLED`
- `SHORT_CODE_UNAVAILABLE`
- `PLAN_LIMIT_REACHED`
- `FEATURE_NOT_AVAILABLE`
- `VALIDATION_ERROR`
- `INTERNAL_SERVER_ERROR`

The frontend should rely on stable error codes rather than parsing error-message text.

---

## 19. Security Requirements

The application must include:

- Secure password hashing
- JWT validation
- Refresh-token protection
- Request-body validation
- SQL injection protection
- Authentication rate limiting
- Link-creation rate limiting
- Public redirect rate limiting
- Secure HTTP headers
- Restricted request-body size
- CORS configuration
- Environment-based secret management
- Authorization checks for owned resources
- Safe logging without passwords or tokens

Future versions should include:

- Abuse reporting
- Malicious-link detection
- Domain blocklists
- Account suspension
- Audit logs

---

## 20. Database Requirements

The initial PostgreSQL database should include:

- `users`
- `plans`
- `subscriptions`
- `links`
- `click_events`
- `usage_counters`
- `refresh_tokens`

Important constraints and indexes include:

- Unique user email
- Unique short code
- Index on link owner
- Index on expiry date
- Index on link status
- Unique daily usage record per user and date
- Foreign-key constraints
- Appropriate delete behaviour

Database migrations must be version-controlled.

---

## 21. Initial Architecture Requirements

The first backend will be a modular monolith.

Suggested modules:

- Authentication
- Users
- Links
- Subscriptions
- Analytics
- Usage limits

The application should separate:

- Routes
- Controllers
- Services
- Repositories
- Validation
- Domain types
- Error handling

Business logic must not be placed directly inside route definitions.

---

## 22. Redis Requirements

Redis will be added after the PostgreSQL-based implementation is working correctly.

Redis will be used for:

- Redirect caching
- Distributed rate limiting
- Shared counters
- Queue storage
- Temporary data

Redis must not become the only source of truth for permanent link data.

PostgreSQL remains the primary source of truth.

The system must define cache invalidation rules for:

- Disabled links
- Deleted links
- Expired links
- Reactivated links

---

## 23. Queue Requirements

A background queue will be introduced for non-critical work.

Suggested technology:

- BullMQ
- Redis

Queue candidates include:

- Detailed click-event processing
- User-agent parsing
- Country lookup
- Analytics aggregation
- Expired-link cleanup
- Subscription notifications
- Abuse scanning

The redirect itself must not be placed in a queue.

The user should receive the redirect immediately after the destination is resolved.

Queue workers must support:

- Retries
- Failure handling
- Idempotent processing
- Dead-letter or failed-job inspection

---

## 24. Rate-Limiting Requirements

The application must support different rate limits for:

- Registration
- Login
- Token refresh
- Link creation
- Analytics endpoints
- Public redirects

During local development, an in-memory limiter may be used.

Before horizontal scaling, rate limiting must use Redis so all backend instances share the same counters.

Plan limits and security rate limits are different concepts and must be handled separately.

---

## 25. Docker Requirements

The application will later be containerized.

Expected containers:

- API
- Background worker
- PostgreSQL
- Redis
- React frontend

Docker Compose will be used for local development.

Containerized services must support:

- Environment variables
- Health checks
- Graceful shutdown
- Persistent database volumes
- Reproducible builds

---

## 26. AWS Deployment Requirements

The production-style deployment should eventually include:

- Route 53 or another DNS provider
- HTTPS
- Application Load Balancer
- Multiple EC2 API instances
- Auto Scaling Group
- Amazon RDS for PostgreSQL
- Amazon ElastiCache for Redis
- Worker instances or worker containers
- S3 and CloudFront for the frontend
- Centralized logs
- Health checks

API instances must remain stateless.

Shared application state must be stored in PostgreSQL or Redis.

---

## 27. Logging and Monitoring Requirements

The application should use structured logging.

Suggested logger:

- Pino

Each request should include a request ID.

The system should eventually track:

- Request count
- Redirect latency
- Error rate
- Cache hit ratio
- PostgreSQL query latency
- Queue depth
- Failed jobs
- Active links
- Links created per plan
- Rate-limit rejections

Sensitive information must not appear in logs.

---

## 28. Testing Requirements

The project must include:

### Unit tests

- URL validation
- Expiry calculation
- Plan access rules
- Daily-limit checks
- Short-code generation
- Link-state validation

### Integration tests

- Authentication APIs
- PostgreSQL constraints
- Link creation
- Transactions
- Redirect behaviour
- Ownership authorization
- Subscription enforcement

### End-to-end tests

- Register
- Login
- Create link
- Open short link
- Confirm redirect
- Confirm click tracking

### Load tests

Load testing will be added later using a tool such as:

- k6
- Artillery

The load tests should measure redirect throughput, latency, cache effectiveness, and multi-instance behaviour.

---

## 29. Non-Functional Requirements

The system should:

- Return redirects quickly
- Maintain globally unique short codes
- Support horizontal scaling
- Avoid relying on local application memory for shared state
- Handle concurrent requests safely
- Return consistent errors
- Support graceful shutdown
- Remain maintainable through modular structure
- Keep database migrations version-controlled
- Keep accepted architecture decisions documented
- Support monitoring and debugging

Specific latency and availability targets will be defined after the first working version is benchmarked.

---

## 30. Out of Scope for the First Version

The following features are not required initially:

- Payment gateway integration
- Multiple custom domains
- QR-code generation
- Password-protected links
- Bulk link import
- Link previews
- Social-media preview generation
- Kafka
- Kubernetes
- Microservices
- Advanced machine-learning abuse detection
- Full administrator dashboard

These features may be added only after the core system is stable.

---

## 31. Development Phases

### Phase 1 — Planning

- Finalize requirements
- Create architecture diagram
- Design database schema
- Define API contracts
- Record architecture decisions

### Phase 2 — Backend foundation

- TypeScript setup
- Express setup
- Environment configuration
- PostgreSQL connection
- Logging
- Validation
- Centralized errors
- Test setup

### Phase 3 — Authentication

- Registration
- Login
- Access tokens
- Refresh tokens
- Logout
- Authentication middleware

### Phase 4 — Core link management

- Link creation
- Generated short codes
- Custom short codes
- Expiration
- Listing
- Disable
- Reactivate
- Delete

### Phase 5 — Redirect and analytics

- Public redirect
- Total click tracking
- Detailed click events
- Analytics API

### Phase 6 — Production hardening

- Rate limiting
- Security headers
- Transactions
- Graceful shutdown
- Integration tests
- End-to-end tests

### Phase 7 — Redis

- Redirect cache
- Distributed rate limiting
- Shared counters
- Cache invalidation

### Phase 8 — Queues

- BullMQ
- Analytics worker
- Retries
- Failed-job handling
- Idempotency

### Phase 9 — Docker

- API image
- Worker image
- Docker Compose
- Health checks

### Phase 10 — AWS deployment

- EC2
- RDS
- ElastiCache
- Application Load Balancer
- Auto Scaling Group
- HTTPS
- CI/CD

### Phase 11 — Performance testing

- Load tests
- Query optimization
- Index review
- Cache review
- Multi-instance testing
- Failure testing

---

## 32. Open Decisions

## Resolved Product Decisions

### Custom Short Codes

Custom short codes must:

* Be between 5 and 15 characters
* Contain only letters, numbers, hyphens, or underscores
* Be globally unique
* Not match a reserved system route

Validation pattern:

```regex
^[a-zA-Z0-9_-]{5,15}$
```

Initial reserved aliases include:

* `api`
* `auth`
* `login`
* `logout`
* `register`
* `admin`
* `health`
* `docs`
* `swagger`
* `app`
* `dashboard`
* `settings`
* `pricing`
* `terms`
* `privacy`
* `support`

### Link Reactivation

A disabled link may be reactivated only when:

* It has not expired
* It has not been deleted
* The owner is authorized to manage it

### Soft Deletion

Deleted links will be soft deleted for seven days.

During this period:

* The link will not redirect
* It may remain recoverable
* Its custom alias will remain unavailable
* A scheduled cleanup job will permanently delete it after seven days

### Analytics Retention

Free users can view the total click count for the lifetime of an existing link.

Pro users can view:

* Lifetime total click count
* Detailed click analytics for the most recent 90 days

Detailed click events older than 90 days may be removed while aggregated totals remain available.

### Pro Plan Downgrade

When a Pro subscription ends:

* Existing links remain active until their original expiry dates
* Existing custom aliases continue working
* Existing links are not automatically deleted
* The user cannot create new custom aliases
* The user cannot select custom expiry dates
* New actions are governed by Free plan limits
* A user above the Free active-link limit cannot create additional links
* Detailed Pro analytics becomes unavailable
* Total click counts remain visible

### Duplicate Destination URLs

When no custom alias is requested, the system should return an existing link only when:

* The link belongs to the same user
* The normalized destination URL is the same
* The existing link is active
* The existing link has not expired

Otherwise, the system creates a new short link.

When a custom alias is requested, the system creates a separate link.

Different users may create separate short links for the same destination URL.

### Redirect Status

Successful public redirects will initially use HTTP status code `302 Found`.

### Daily Usage Reset

Daily plan limits reset at `00:00 UTC`.

The API and frontend should clearly communicate that daily limits are calculated using UTC.

### Expired Custom Aliases

An expired custom alias remains reserved by its owner.

It can become reusable only after:

1. The owner deletes the expired link
2. The seven-day soft-delete retention period completes
3. The link is permanently deleted

### Authentication Tokens

The application will use:

* Short-lived JWT access tokens
* Refresh tokens stored in secure HttpOnly cookies
* Hashed refresh-token records stored in PostgreSQL

The full token rotation and revocation strategy will be finalized during authentication design.

### ORM

Prisma will be used as the PostgreSQL ORM and migration tool.

### Hosting Cost

The initial deployment should prioritize low cost.

The project will document:

* A low-cost deployment suitable for normal portfolio hosting
* A scalable AWS architecture using multiple EC2 instances, an Application Load Balancer, RDS, and Redis

The exact monthly hosting budget will be finalized during deployment planning.


Each accepted decision should be recorded in an Architecture Decision Record.
## Product and Hosting Strategy

The URL shortener will be developed as a SaaS-style portfolio project.

The application may be used by a limited number of real users, but all features will initially be provided without payment.

The system will still include Free and Pro plans to demonstrate:

* Subscription-based feature authorization
* Usage quotas
* Custom aliases
* Different expiration policies
* Analytics access control
* Plan upgrades and downgrades

During the initial release, users may be assigned a plan manually or through a promotional upgrade process. Payment-gateway integration is outside the first version.

### Live Deployment

The continuously available MVP should use free hosting tiers wherever practical.

The initial live architecture may include:

* Cloudflare Pages for the React frontend
* A free Node.js hosting service for the Express API
* A free managed PostgreSQL database
* A free managed Redis service
* GitHub Actions for CI/CD

The free deployment may have limitations such as:

* Cold starts
* Limited compute
* Limited database storage
* Limited Redis commands
* No uptime guarantee
* Temporary suspension after inactivity
* Lower throughput

These limitations are acceptable for the portfolio MVP and a small number of users.

### Scalable Demonstration Architecture

A separate scalable AWS architecture will be designed and documented using:

* Docker
* Multiple EC2 API instances
* Application Load Balancer
* Auto Scaling Group
* Amazon RDS PostgreSQL
* Redis or Amazon ElastiCache
* Background workers
* Distributed rate limiting

This architecture may be deployed temporarily for testing and demonstration but will not necessarily remain active continuously because of infrastructure costs.

### Cost Requirement

The normal portfolio deployment should target a recurring infrastructure cost of $0.

Paid AWS resources must not be left running after demonstrations or load tests.

The application should remain portable so it can later move from free-tier services to AWS without major business-logic changes.
