---
phase: 03-auth-gate
plan: "02"
subsystem: auth
tags: [next-auth, auth-js-v5, credentials-provider, bcryptjs, jwt, zod, sanity, middleware, proxy]

# Dependency graph
requires:
  - phase: 03-auth-gate/03-01
    provides: next-auth@beta installed, sanityWriteClient, auth-types.ts module augmentations, passwordHash in siteUser schema

provides:
  - src/auth.config.ts — edge-safe auth config with pages.signIn="/login" and authorized callback gating /menu/** by status
  - src/auth.ts — full Auth.js config with Credentials provider, bcryptjs hash compare, Sanity siteUser query, DeniedError/PendingError, JWT/session callbacks
  - src/proxy.ts — Next.js 16 proxy exporting auth as proxy with matcher excluding studio/api/_next/favicon
  - src/app/api/auth/[...nextauth]/route.ts — Auth.js API route handler exporting GET and POST from handlers

affects: [03-03-PLAN, 03-04-PLAN]

# Tech tracking
tech-stack:
  added: []
  patterns: [Auth.js v5 split config pattern (auth.config.ts edge-safe + auth.ts Node.js), CredentialsSignin subclass for typed error codes, proxy.ts as Next.js 16 middleware replacement]

key-files:
  created:
    - src/auth.config.ts
    - src/auth.ts
    - src/proxy.ts
    - src/app/api/auth/[...nextauth]/route.ts

key-decisions:
  - "Split config pattern separates edge-safe auth.config.ts (no bcrypt/Node.js) from full auth.ts — required for Next.js 16 proxy compatibility"
  - "DeniedError and PendingError extend CredentialsSignin with code property — Auth.js surfaces code as ?code= query param on login redirect"
  - "Studio excluded from proxy.ts matcher — owner is not a siteUser, blocking /studio would lock them out of content management"
  - "JWT maxAge 24h tradeoff accepted: approved status baked into token, revocation requires user re-login (no real-time Sanity check per request)"

patterns-established:
  - "Auth.js v5 split config: auth.config.ts is edge-safe (no Node APIs), auth.ts imports auth.config.ts and adds providers/callbacks that need Node.js"
  - "CredentialsSignin subclass pattern: class FooError extends CredentialsSignin { code = 'foo' } for typed login error discrimination"
  - "proxy.ts pattern: export { auth as proxy } from '@/auth' — Auth.js authorized callback runs as Next.js 16 proxy middleware"

requirements-completed: [AUTH-03, AUTH-04, AUTH-06]

# Metrics
duration: 5min
completed: 2026-03-02
---

# Phase 3 Plan 02: Auth.js Core Summary

**Auth.js v5 split config pattern with Credentials provider (bcryptjs + Sanity query), DeniedError/PendingError typed errors, JWT strategy, and Next.js 16 proxy.ts route protection for /menu/***

## Performance

- **Duration:** 5 min
- **Started:** 2026-03-02T17:52:31Z
- **Completed:** 2026-03-02T17:57:30Z
- **Tasks:** 2
- **Files modified:** 4

## Accomplishments

- Auth.js v5 Credentials provider implemented in auth.ts — queries Sanity for siteUser, compares bcryptjs hash, throws DeniedError/PendingError for non-approved users, returns user object only for approved accounts
- JWT strategy with 24h maxAge wired in — id and status baked into the JWT cookie at sign-in, session callbacks expose them on session.user without a Sanity re-query on every request
- proxy.ts created as Next.js 16 proxy middleware — exports auth as proxy, matcher excludes /studio so the owner's Sanity Studio is never blocked by the auth gate

## Task Commits

Each task was committed atomically:

1. **Task 1: Create auth.config.ts and auth.ts (split config pattern)** - `968bcd3` (feat)
2. **Task 2: Create proxy.ts and API route handler** - `77f38ef` (feat)

**Plan metadata:** (docs commit — see final_commit)

## Files Created/Modified

- `src/auth.config.ts` — Edge-safe auth config with pages.signIn="/login" and authorized callback gating /menu/** by user.status
- `src/auth.ts` — Full Auth.js config: Credentials provider with bcryptjs + Sanity siteUser query; DeniedError (code="denied") and PendingError (code="pending"); JWT/session callbacks extending token and session with id/status
- `src/proxy.ts` — Next.js 16 proxy: export { auth as proxy } from "@/auth"; matcher excludes api, _next/*, favicon.ico, studio
- `src/app/api/auth/[...nextauth]/route.ts` — Auth.js API route: export const { GET, POST } = handlers

## Decisions Made

- Split config pattern is mandatory for Next.js 16 proxy compatibility — auth.config.ts must be edge-safe (no bcrypt, no Node.js APIs) since proxy.ts runs in the Edge runtime; auth.ts imports auth.config.ts and adds the Credentials provider that needs Node.js bcryptjs
- DeniedError and PendingError extend CredentialsSignin with a typed `code` property — Auth.js surfaces this code as the `?code=` query parameter when redirecting back to the login page, enabling the login form in Plan 03-03 to display status-specific error messages without parsing generic error text
- Studio exclusion in proxy.ts matcher is load-bearing — without it, the authorized callback would run on /studio routes and redirect the owner (not a siteUser) to /login, locking them out of content management
- 24h JWT maxAge tradeoff explicitly accepted: if the owner changes a user's status from approved to denied, the denied user retains valid access until their 24h JWT expires; the owner must manually communicate to the user to log out. This is acceptable for a dispensary with a small known customer base.

## Deviations from Plan

None — plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None — no new external service configuration required beyond what Plan 03-01 documented (SANITY_WRITE_TOKEN and AUTH_SECRET must be set in .env.local).

## Next Phase Readiness

- Plan 03-03 (login form) can proceed — auth, signIn, signOut exports are available from src/auth.ts
- Plan 03-04 (registration) can proceed — sanityWriteClient and auth exports are in place
- proxy.ts is active and will block /menu/** in the dev server once AUTH_SECRET is set in .env.local
- next build produces zero TypeScript errors and confirms proxy.ts is recognized as ƒ Proxy (Middleware)

---
*Phase: 03-auth-gate*
*Completed: 2026-03-02*

## Self-Check: PASSED

All created files verified on disk and all task commits confirmed in git history.
