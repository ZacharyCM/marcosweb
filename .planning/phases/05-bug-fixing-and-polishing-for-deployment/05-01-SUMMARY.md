---
phase: 05-bug-fixing-and-polishing-for-deployment
plan: 01
subsystem: infra
tags: [auth, authjs, env, sanity, vercel, cors]

requires:
  - phase: 04-product-display
    provides: completed MENU-04/MENU-05 features (product modal, media gallery)

provides:
  - AUTH_URL in .env.local for Auth.js v5 local development compatibility
  - REQUIREMENTS.md accurately reflects MENU-04 and MENU-05 as complete
  - Instructions for Vercel AUTH_SECRET/AUTH_URL/SANITY_WRITE_TOKEN configuration
  - Instructions for Sanity CORS production domain setup

affects:
  - 05-02-smoke-test (Vercel env vars and CORS must be set before smoke test)

tech-stack:
  added: []
  patterns:
    - "AUTH_URL alongside NEXTAUTH_URL: Auth.js v5 on Next.js 16 requires AUTH_URL explicitly set (not just NEXTAUTH_URL alias)"

key-files:
  created:
    - .planning/phases/05-bug-fixing-and-polishing-for-deployment/05-01-SUMMARY.md
  modified:
    - .env.local (gitignored — local change, not committed)
    - .planning/REQUIREMENTS.md

key-decisions:
  - "AUTH_URL must be set in addition to NEXTAUTH_URL: Next.js 16 + Auth.js v5 signIn() fails with Configuration error without explicit AUTH_URL (GitHub issue #13388)"
  - "REQUIREMENTS.md MENU-04/05 corrected to complete: Phase 4 delivered the product modal and media gallery; docs were lagging behind implementation"

patterns-established:
  - "Env var hygiene: both AUTH_URL and NEXTAUTH_URL maintained as fallback aliases for local dev"

requirements-completed:
  - AUTH-01
  - AUTH-02
  - AUTH-03
  - AUTH-04
  - AUTH-05
  - AUTH-06
  - INFRA-01
  - INFRA-02
  - PROD-01
  - PROD-02
  - PROD-03
  - PROD-04

duration: 5min
completed: 2026-03-02
---

# Phase 5 Plan 01: Production Hardening Summary

**AUTH_URL added to .env.local for Auth.js v5 signIn fix; REQUIREMENTS.md corrected to show MENU-04/05 complete; Vercel and Sanity manual configuration steps issued as blocking human checkpoint**

## Performance

- **Duration:** ~5 min
- **Started:** 2026-03-02T22:45:39Z
- **Completed:** 2026-03-02T22:50:00Z
- **Tasks:** 1 of 2 (Task 2 is a blocking human-action checkpoint)
- **Files modified:** 2 (.env.local local only, REQUIREMENTS.md committed)

## Accomplishments

- Added AUTH_URL=http://localhost:3000 to .env.local alongside NEXTAUTH_URL so Auth.js v5 local development works without the signIn "Configuration" error
- Corrected REQUIREMENTS.md to mark MENU-04 and MENU-05 as [x] complete in both the checklist and traceability table — Phase 4 built the product modal and media gallery but docs were behind
- Updated traceability table rows for MENU-04 and MENU-05 from Pending to Complete
- Updated REQUIREMENTS.md last-updated timestamp to reflect phase 5 status

## Task Commits

1. **Task 1: Add AUTH_URL to .env.local and mark MENU-04/05 complete** - `cf6583d` (chore)
2. **Task 2: Vercel/Sanity manual infrastructure** - BLOCKED — human checkpoint required

## Files Created/Modified

- `/Users/zacharym/marcosweb/.env.local` - Added AUTH_URL=http://localhost:3000 (gitignored, local change only)
- `/Users/zacharym/marcosweb/.planning/REQUIREMENTS.md` - MENU-04/05 marked complete in checklist and traceability table; last-updated timestamp updated

## Decisions Made

- AUTH_URL is required in addition to NEXTAUTH_URL for Auth.js v5 on Next.js 16 — the Next.js adapter resolves the signIn server action URL from AUTH_URL, not the NEXTAUTH_URL alias (GitHub issue #13388)
- MENU-04 and MENU-05 were already implemented in Phase 4 (product detail modal + media gallery carousel); REQUIREMENTS.md was a documentation lag, not a missing feature

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

- .env.local is gitignored (correct for security) — only REQUIREMENTS.md was committed; the AUTH_URL change is a local-only edit applied to the file on disk

## User Setup Required

Task 2 is a blocking human-action checkpoint. The following must be completed manually before the smoke test can proceed:

**STEP 1 — Vercel: Add/confirm AUTH_SECRET**
- Open https://vercel.com/dashboard > Pure Pressure project > Settings > Environment Variables
- Ensure AUTH_SECRET exists with value: `V2o1bgBUxPA9I6UrMwKd+uoWKbragUb+syXxcq+kItc=` (Production)

**STEP 2 — Vercel: Add/confirm AUTH_URL**
- Ensure AUTH_URL exists with value: `https://<your-production-domain>.vercel.app` (Production, NOT localhost)
- This is the critical fix for the signIn "Configuration" error on Next.js 16

**STEP 3 — Vercel: Confirm SANITY_WRITE_TOKEN**
- Ensure SANITY_WRITE_TOKEN exists with value from .env.local (skiw8t...) (Production)

**STEP 4 — Sanity: Verify CORS includes production domain with credentials**
- Open https://sanity.io/manage > Project vgi4fxay > API > CORS Origins
- Confirm production Vercel domain is listed with "Allow credentials" checked
- If missing: `npx sanity cors add https://<production-domain>.vercel.app --credentials`

**STEP 5 — Sanity: Verify write token role is Editor or higher**
- In sanity.io/manage > API > Tokens — find the skiw8t... token and confirm role is Editor

**STEP 6 — Trigger Vercel redeploy** after any env var changes

When done, type: `infrastructure-done` with a note on what was changed.

## Next Phase Readiness

- Task 1 complete: AUTH_URL in .env.local, REQUIREMENTS.md accurate
- Blocked on human checkpoint: Vercel env vars and Sanity CORS must be set before the smoke test
- Once infrastructure-done signal received, proceed to 05-02 E2E smoke test

---
*Phase: 05-bug-fixing-and-polishing-for-deployment*
*Completed: 2026-03-02 (partial — Task 2 awaits human action)*
