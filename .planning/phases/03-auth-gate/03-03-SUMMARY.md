---
phase: 03-auth-gate
plan: "03"
subsystem: auth
tags: [next-auth, react, server-actions, zod, bcryptjs, sanity, useActionState]

# Dependency graph
requires:
  - phase: 03-auth-gate/03-01
    provides: sanity-write.ts write client, type augmentations
  - phase: 03-auth-gate/03-02
    provides: auth.ts signIn/signOut/auth exports, DeniedError/PendingError custom errors
provides:
  - register() server action — zod validation, duplicate-email check, bcrypt.hash(12), sanityWriteClient.create siteUser, redirect outside try/catch
  - login() server action — signIn("credentials", formData), AuthError catch, re-throw NEXT_REDIRECT on success
  - logout() server action — signOut({ redirectTo: "/" })
  - /register page — "use client", useActionState(register), field-level validation error display
  - /login page — async Server Component, reads searchParams Promise, session redirect if already approved
  - LoginForm component — "use client", useActionState(login), getErrorMessage maps denied/pending/CredentialsSignin codes
affects: [03-04, phase-04-menu-ui]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "useActionState(serverAction, undefined) — React 19 form state pattern for server actions"
    - "redirect() outside try/catch — prevents NEXT_REDIRECT from being swallowed"
    - "AuthError catch + re-throw — catches only auth errors, lets NEXT_REDIRECT propagate"
    - "Route group (auth) — groups auth pages without affecting URL path"
    - "getErrorMessage() — maps Auth.js error codes to human-readable messages"

key-files:
  created:
    - src/app/actions/auth.ts
    - src/app/(auth)/register/page.tsx
    - src/app/(auth)/login/page.tsx
    - src/app/(auth)/login/login-form.tsx

key-decisions:
  - "register() places redirect('/pending') outside try/catch — redirect() throws NEXT_REDIRECT internally; inside try/catch would silently swallow the redirect"
  - "login() only catches AuthError — any other throw (including NEXT_REDIRECT on successful sign-in) is re-thrown to propagate correctly"
  - "LoginForm reads error/code from both useActionState and URL params — handles both direct form submission and Auth.js redirect-with-query-params flows"
  - "(auth) route group has no layout.tsx — root layout in src/app/ provides html/body; no extra layout needed"

patterns-established:
  - "Server action error state: { errors?: Record<string, string[]>; error?: string } — fieldErrors from zod.flatten() vs top-level error string"
  - "Error code mapping: getErrorMessage(error, code) function pattern — centralizes Auth.js code-to-message translation"

requirements-completed: [AUTH-01, AUTH-06]

# Metrics
duration: 2min
completed: 2026-03-02
---

# Phase 3 Plan 03: Auth Server Actions and Auth Pages Summary

**Server actions (register/login/logout) and auth pages (/register, /login) wiring form submissions to Auth.js credentials flow with per-status error messages**

## Performance

- **Duration:** 2 min
- **Started:** 2026-03-02T17:57:03Z
- **Completed:** 2026-03-02T17:58:42Z
- **Tasks:** 2
- **Files modified:** 4

## Accomplishments
- register() server action creates siteUser in Sanity with bcrypt-hashed password and status=pending, with redirect outside try/catch
- login() server action surfaces DeniedError.code and PendingError.code from Auth.js to the form as distinct error messages
- LoginForm maps "denied", "pending", and "CredentialsSignin" error codes to user-facing human-readable messages
- Auth pages use React 19 useActionState pattern for progressive enhancement-compatible form handling

## Task Commits

Each task was committed atomically:

1. **Task 1: Create auth server actions (register, login, logout)** - `f64f718` (feat)
2. **Task 2: Create register page and login page + login-form component** - `4b196f0` (feat)

**Plan metadata:** (pending final docs commit)

## Files Created/Modified
- `src/app/actions/auth.ts` - register(), login(), logout() server actions
- `src/app/(auth)/register/page.tsx` - Registration form, useActionState(register), field-level errors
- `src/app/(auth)/login/page.tsx` - Server Component, reads searchParams, session redirect if approved
- `src/app/(auth)/login/login-form.tsx` - Login form, useActionState(login), getErrorMessage error display

## Decisions Made
- redirect('/pending') placed outside try/catch in register() — redirect() internally throws NEXT_REDIRECT; catching it would silently swallow the redirect and leave the user on the form
- login() only catches AuthError instances — all other throws (including NEXT_REDIRECT on success) propagate naturally
- LoginForm handles errors from both sources: useActionState state (direct form submit) and URL query params (Auth.js redirect flow)
- No layout.tsx in (auth) route group — root layout.tsx already provides html/body wrapper

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required beyond env vars already documented in Phase 3 blockers.

## Next Phase Readiness
- Auth actions and pages complete — registration and login flows are fully wired
- Plan 03-04 (pending page + menu protection) can now be executed
- SANITY_WRITE_TOKEN and AUTH_SECRET must be set in .env.local for runtime testing

## Self-Check: PASSED

- FOUND: src/app/actions/auth.ts
- FOUND: src/app/(auth)/register/page.tsx
- FOUND: src/app/(auth)/login/page.tsx
- FOUND: src/app/(auth)/login/login-form.tsx
- FOUND: commit f64f718
- FOUND: commit 4b196f0
- TSC --noEmit: 0 errors

---
*Phase: 03-auth-gate*
*Completed: 2026-03-02*
