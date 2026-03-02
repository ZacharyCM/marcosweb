---
phase: 04-product-display
plan: 01
subsystem: ui
tags: [age-gate, cookie, legal-compliance, sanity-live, next-middleware]

# Dependency graph
requires:
  - phase: 03-auth-gate
    provides: auth proxy pattern and auth() callback form used as base for proxy.ts refactor
provides:
  - Age gate enforcement via proxy middleware (age-verified cookie check before auth check)
  - /age-gate route with confirmAge Server Action setting httpOnly cookie
  - /privacy route with static privacy policy (data collected, purpose, retention)
  - Public layout with jurisdiction disclaimer footer
  - SanityLive in (app) layout enabling live content updates from Studio
affects: [04-product-display, menu UI, product pages]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Server Action cookie pattern: await cookies() then .set() with httpOnly/secure options"
    - "Auth.js callback form: auth(function handler(req) {}) for custom proxy logic"
    - "Route group (public) for unauthenticated-accessible pages sharing a layout"

key-files:
  created:
    - src/app/actions/age-gate.ts
    - src/app/(public)/layout.tsx
    - src/app/(public)/age-gate/page.tsx
    - src/app/(public)/privacy/page.tsx
  modified:
    - src/proxy.ts
    - src/app/(app)/layout.tsx

key-decisions:
  - "Age gate check runs before auth check in proxy — unverified visitors never see login form"
  - "PUBLIC_PATHS allow /age-gate and /privacy through unconditionally — must be reachable without cookie"
  - "confirmAge redirects to /login after setting cookie — age verification immediately gates into auth flow"
  - "SanityLive added to (app) layout so Studio edits propagate without full redeploy"

patterns-established:
  - "Server Action redirect pattern: redirect() outside try/catch — throws NEXT_REDIRECT which must propagate"
  - "Proxy layering: public path bypass first, then age gate, then auth gate"

requirements-completed: [LEGAL-01, LEGAL-02, LEGAL-03]

# Metrics
duration: 5min
completed: 2026-03-02
---

# Phase 4 Plan 01: Legal Compliance and SanityLive Summary

**Age gate enforced in proxy middleware via age-verified httpOnly cookie, /age-gate and /privacy routes created, jurisdiction disclaimer added to public layout, SanityLive wired to (app) shell for live Studio updates**

## Performance

- **Duration:** 5 min
- **Started:** 2026-03-02T19:30:54Z
- **Completed:** 2026-03-02T19:35:00Z
- **Tasks:** 3
- **Files modified:** 6

## Accomplishments
- proxy.ts refactored from one-liner re-export to full function with ordered gate checks (bypass public paths → age gate → auth gate)
- Age gate page at /age-gate with confirmAge Server Action setting a 365-day httpOnly cookie then redirecting to /login
- Privacy policy at /privacy covering data collected, purpose, and retention (LEGAL-03)
- Public layout with "For adults 21+ only. For use where legal." footer disclaimer (LEGAL-02)
- SanityLive rendered in (app) layout so Sanity Studio edits reflect without redeploy

## Task Commits

Each task was committed atomically:

1. **Task 1: Refactor proxy.ts with age-gate cookie check** - `4240db8` (feat)
2. **Task 2: Age gate page, Server Action, and privacy policy** - `13723cb` (feat)
3. **Task 3: Add SanityLive to (app) layout** - `18a8778` (feat)

## Files Created/Modified
- `src/proxy.ts` - Full proxy function with ordered gate logic (public bypass → age cookie check → auth)
- `src/app/actions/age-gate.ts` - confirmAge Server Action: sets age-verified cookie (365d, httpOnly) and redirects to /login
- `src/app/(public)/layout.tsx` - Public route group layout with jurisdiction disclaimer footer
- `src/app/(public)/age-gate/page.tsx` - Age gate page with form calling confirmAge Server Action
- `src/app/(public)/privacy/page.tsx` - Static privacy policy with collected/purpose/retention sections
- `src/app/(app)/layout.tsx` - App shell layout with SanityLive rendered

## Decisions Made
- Age gate check runs before auth check in proxy — unverified visitors never see login form or app content
- PUBLIC_PATHS allow /age-gate and /privacy unconditionally — they must be reachable without any cookie
- confirmAge redirects to /login after cookie set — age verification feeds directly into the auth flow
- SanityLive added to (app) layout per research Pitfall 6 — without it, Studio edits require full redeploy

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None — all three tasks compiled cleanly on first attempt. Full production build passed with zero errors, all routes (/age-gate, /privacy, middleware proxy) visible in build output.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- All legal compliance requirements met (LEGAL-01, LEGAL-02, LEGAL-03)
- Age gate is live — unauthenticated visitors without cookie are redirected to /age-gate before any other page
- SanityLive active in app shell — product edits in Studio will propagate to live menu without redeploy
- Ready for Plan 02: product display components (StrainCarousel, ProductCard, menu page)

---
*Phase: 04-product-display*
*Completed: 2026-03-02*
