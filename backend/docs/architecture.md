React Frontend
      |
      v
TypeScript + Express API
      |
      v
PostgreSQL

src/
├── modules/
│   ├── auth/
│   ├── users/
│   ├── links/
│   ├── subscriptions/
│   ├── analytics/
│   └── usage/
├── common/
├── config/
├── database/
├── middleware/
├── app.ts
└── server.ts

# Each module should eventually contain:
- controller
- service
- repository
- routes
- validation
- types
# Architecture

## Current Architecture

React frontend  
TypeScript Express API  
PostgreSQL with Prisma

## Backend Structure

Route → Middleware → Controller → Service → Repository → Prisma → PostgreSQL

## Main Modules

- Auth
- Users
- Links
- Subscriptions
- Usage
- Analytics

## Core Flows

### Link Creation

1. Authenticate user
2. Validate request
3. Check plan and usage limits
4. Validate expiry (custom aliases deferred until after MVP)
5. Generate short code
6. Create link and update usage in a transaction
7. Return short URL

### Redirect

1. Read short code
2. Find link
3. Check status and expiry
4. Record click
5. Return 302 redirect

## Future Architecture

Redis caching, BullMQ workers, Docker, multiple EC2 instances and an Application Load Balancer.