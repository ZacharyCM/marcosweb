---
phase: 03-auth-gate
plan: "04"
subsystem: auth
tags: [auth.js, next.js, sanity, jwt, server-components, proxy]

# Dependency graph
requires:
  - phase: 03-auth-gate plan 03
    provides: register/login/logout server actions, register page, login page, LoginForm component
  - phase: 03-auth-gate plan 02
    provides: auth.ts split-config pattern, proxy.ts with authorized callback, status-aware CredentialsSignin errors
  - phase: 03-auth-gate plan 01
    provides: siteUser Sanity schema with passwordHash + status, sanity-write.ts client, JWT type augmentations
provides:
  - Pending approval page at /pending — shown after registration, blocks approved users with redirect to /menu
  - Menu stub at /menu — protected by proxy.ts authorized callback; confirms auth gate works end-to-end
  - JWT callback re-fetches user status from Sanity on every token validation (immediate revocation)
  - Denied user redirection to /login?code=denied (no looping back to /pending)
  - Logout redirects to /login; login success redirects to /menu
  - Sign-out button on /menu page
  - Human-verified end-to-end auth gate (all 6 E2E scenarios pass)
affects: [04-menu-ui, future-phases]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Server Component session guards: auth() + redirect() at page level as defense-in-depth below proxy.ts"
    - "JWT status re-fetch: async jwt() callback re-queries Sanity on every token validation for real-time revocation"
    - "Inline server action: async function inside form action attribute for sign-out without a separate actions file"
    - "Status-aware routing: denied vs. pending users sent to different destinations in authorized callback"

key-files:
  created:
    - src/app/(auth)/pending/page.tsx
    - src/app/(app)/menu/page.tsx
  modified:
    - src/auth.ts
    - src/auth.config.ts
    - src/app/actions/auth.ts

key-decisions:
  - "JWT re-fetch on every token validation: async jwt() re-queries Sanity so status changes (approval/denial) take effect on the next request without requiring re-login — trades one Sanity read per request for real-time revocation"
  - "Denied users routed to /login?code=denied (not /pending): prevents denied → /pending → /pending loop; denied message shows directly on login page via existing LoginForm error-code mapping"
  - "Logout redirects to /login (not /): users should land on the login form after signing out, not the public root"
  - "login() passes redirectTo: '/menu' explicitly: ensures successful login always lands on /menu regardless of callbackUrl"
  - "Sign-out button on /menu: users need a way to sign out from the protected app area; added as form action calling logout() server action"

patterns-established:
  - "Page-level auth guards: always call auth() and redirect() in Server Components as defense-in-depth even when proxy.ts covers the route"
  - "Human checkpoint for approval flows: owner action in Sanity Studio cannot be automated — checkpoint:human-verify is correct pattern for this gate"

requirements-completed: [AUTH-02]

# Metrics
duration: 45min
completed: 2026-03-02
---

# Phase 3 Plan 04: Auth Gate — Pending Page, Menu Stub, E2E Verification Summary

**Pending approval page + protected menu stub with JWT status re-fetch enabling real-time revocation; all 6 E2E auth gate scenarios verified by human**

## Performance

- **Duration:** ~45 min (including human E2E verification window)
- **Started:** 2026-03-02
- **Completed:** 2026-03-02
- **Tasks:** 2 (1 auto + 1 human-verify checkpoint)
- **Files modified:** 5

## Accomplishments
- Pending page at /pending: auth() session check, redirect to /login (no session), redirect to /menu (approved), "pending approval" message + sign-out form action for pending/denied users
- Menu stub at /menu: auth() + status check + welcome message; protected by proxy.ts as primary gate with page-level redirect as defense-in-depth
- JWT callback upgraded to async re-fetch — user status changes in Sanity Studio take effect on the very next request without requiring re-login
- All 6 E2E test scenarios passed human verification: registration, unauthenticated block, owner approval in Studio, approved login + session persistence, denied message (no loop), invalid credentials

## Task Commits

Each task was committed atomically:

1. **Task 1: Create pending page and menu stub** - `a1ae66a` (feat)
2. **Post-task bug fixes (pre-E2E)** - `35488d4` (fix)
3. **Task 2: End-to-end human verification** - approved; verification passed

**Plan metadata:** (docs commit — see below)

## Files Created/Modified
- `src/app/(auth)/pending/page.tsx` - Pending approval page: session guard, redirects, sign-out inline server action
- `src/app/(app)/menu/page.tsx` - Menu stub: defense-in-depth auth check, welcome message, sign-out button
- `src/auth.ts` - JWT callback upgraded to async re-fetch user status from Sanity on every token validation
- `src/auth.config.ts` - authorized callback: denied users → /login?code=denied, pending users → /pending
- `src/app/actions/auth.ts` - logout() redirects to /login; login() passes explicit redirectTo: "/menu"

## Decisions Made

- **JWT re-fetch on every token validation:** async jwt() re-queries Sanity so status changes take effect on the next request without re-login. Trades one Sanity read per request for real-time revocation — acceptable for a small known customer base.
- **Denied → /login?code=denied (not /pending):** Prevents a looping redirect where denied users hit /menu → /pending → sign out → login → /menu → /pending repeatedly. The denied message is surfaced directly on the login page using the existing error-code mapping in LoginForm.
- **Logout → /login:** After signing out users should land on the login form, not the public root page.
- **login() explicit redirectTo: "/menu":** Ensures successful authentication always navigates to /menu regardless of any callbackUrl that Auth.js might have stored.
- **Sign-out on /menu:** Users need a way to log out from within the protected app area; added as a form action calling the logout() server action.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] JWT callback re-fetches status on every token validation**
- **Found during:** Post-task-1 testing (pre-E2E verification)
- **Issue:** JWT baked status at sign-in time — owner approval in Sanity Studio had no effect until user re-logged in, making real-time revocation impossible
- **Fix:** Converted jwt() to async, added Sanity fetch when no `user` object (i.e., subsequent requests after initial sign-in)
- **Files modified:** src/auth.ts
- **Verification:** Approved user immediately accessible to /menu after Studio publish without re-login
- **Committed in:** 35488d4

**2. [Rule 1 - Bug] Denied users sent to /login?code=denied instead of /pending**
- **Found during:** Post-task-1 testing (pre-E2E verification)
- **Issue:** Denied users hitting /menu were redirected to /pending, which then shows a "pending approval" message — wrong message for denied users and creates confusing UX
- **Fix:** authorized callback checks status === "denied" first and redirects to /login?code=denied
- **Files modified:** src/auth.config.ts
- **Verification:** E2E Test 5 — denied user sees "Your access request was not approved" on login page; no loop
- **Committed in:** 35488d4

**3. [Rule 1 - Bug] Logout redirect was "/" instead of "/login"**
- **Found during:** Post-task-1 testing (pre-E2E verification)
- **Issue:** After signing out, users landed on the root page (/) rather than the login form — poor UX; user had to navigate manually to log back in
- **Fix:** signOut({ redirectTo: "/login" }) in logout() server action
- **Files modified:** src/app/actions/auth.ts
- **Verification:** Sign-out from /pending and /menu both land on /login
- **Committed in:** 35488d4

**4. [Rule 1 - Bug] Login success redirect was implicit (not "/menu")**
- **Found during:** Post-task-1 testing (pre-E2E verification)
- **Issue:** signIn("credentials", formData) relied on Auth.js default callbackUrl which could resolve to "/" instead of "/menu"
- **Fix:** Pass redirectTo: "/menu" explicitly in signIn() call
- **Files modified:** src/app/actions/auth.ts
- **Verification:** E2E Test 4 — approved user lands on /menu after login
- **Committed in:** 35488d4

**5. [Rule 2 - Missing Critical] Sign-out button added to /menu page**
- **Found during:** Post-task-1 testing (pre-E2E verification)
- **Issue:** Approved users on /menu had no way to sign out from within the protected area — required navigating back to /pending or clearing cookies manually
- **Fix:** Added form action calling logout() server action; styled as subtle underlined link button
- **Files modified:** src/app/(app)/menu/page.tsx
- **Verification:** Sign out button visible on /menu; clicking it redirects to /login
- **Committed in:** 35488d4

---

**Total deviations:** 5 auto-fixed (4 bugs, 1 missing critical functionality)
**Impact on plan:** All fixes required for correct behavior and acceptable UX. The JWT re-fetch was the most significant — without it, the entire approval flow would not work in real-time. No scope creep.

## Issues Encountered

The initial task 1 implementation was functionally correct per the plan spec, but testing revealed five issues that needed resolution before the human E2E checkpoint could pass. All five were addressed in a single fix commit (35488d4) applied between task 1 completion and human verification. The human confirmed all 6 E2E tests passed after the fixes.

## User Setup Required

None — no new external service configuration required. SANITY_WRITE_TOKEN and AUTH_SECRET (already documented in earlier plans) remain the only env requirements.

## Next Phase Readiness

- Auth gate is fully proven: registration → pending → Studio approval → login → /menu works end-to-end
- proxy.ts (auth.config.ts authorized callback) blocks unauthenticated and non-approved users from /menu
- JWT re-fetch ensures status changes are reflected immediately — no stale session risk
- /menu currently shows a stub; Phase 4 will replace it with real product display (strain carousel by type)
- No blockers for Phase 4

---
*Phase: 03-auth-gate*
*Completed: 2026-03-02*
