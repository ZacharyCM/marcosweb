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
  - AUTH_SECRET and AUTH_URL on Vercel Production — fixes signIn "Configuration" error on Next.js 16
  - SANITY_WRITE_TOKEN on Vercel Production with Editor role — enables owner write access from production
  - Sanity CORS already included production domain with credentials — Studio works for client owner
  - REQUIREMENTS.md accurately reflects MENU-04 and MENU-05 as complete
  - Production deployment redeployed at https://marcosweb.vercel.app with all env vars active

affects:
  - 05-02-smoke-test (all env vars and CORS in place — smoke test can proceed immediately)

tech-stack:
  added: []
  patterns:
    - "AUTH_URL alongside NEXTAUTH_URL: Auth.js v5 on Next.js 16 requires AUTH_URL explicitly set (not just NEXTAUTH_URL alias)"
    - "Vercel env var checklist: AUTH_SECRET, AUTH_URL, SANITY_WRITE_TOKEN must all be present in Production for full Auth.js v5 + Sanity write functionality"

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
  - "Vercel production deployments require explicit redeploy after env var changes to take effect"

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

duration: 15min
completed: 2026-03-02
---

# Phase 5 Plan 01: Production Hardening Summary

**AUTH_URL and AUTH_SECRET added to Vercel Production to fix Auth.js v5 signIn bug on Next.js 16; SANITY_WRITE_TOKEN confirmed with Editor role; Sanity CORS verified; production redeployed at https://marcosweb.vercel.app**

## Performance

- **Duration:** ~15 min (Task 1 automated + Task 2 human infrastructure steps)
- **Started:** 2026-03-02T22:45:39Z
- **Completed:** 2026-03-02T23:05:00Z
- **Tasks:** 2 of 2 (all complete)
- **Files modified:** 2 (.env.local local only, REQUIREMENTS.md committed)

## Accomplishments

- Added AUTH_URL=http://localhost:3000 to .env.local alongside NEXTAUTH_URL so Auth.js v5 local development works without the signIn "Configuration" error
- Added AUTH_SECRET to Vercel Production — fixes the signIn server action "Configuration" error on Next.js 16 (GitHub issue #13388)
- Added AUTH_URL=https://marcosweb.vercel.app to Vercel Production — critical fix for Next.js 16 configuration error
- Added SANITY_WRITE_TOKEN to Vercel Production — enables editor write access from production domain
- Confirmed Sanity CORS already included https://marcosweb.vercel.app with credentials enabled
- Confirmed write token has Editor role in Sanity manage
- Triggered Vercel redeploy — build succeeded and deployed to https://marcosweb.vercel.app
- Corrected REQUIREMENTS.md to mark MENU-04 and MENU-05 as [x] complete in both the checklist and traceability table

## Task Commits

1. **Task 1: Add AUTH_URL to .env.local and mark MENU-04/05 complete** - `cf6583d` (chore)
2. **Task 2: Vercel env vars and Sanity CORS** - Completed by orchestrator (human-action checkpoint resolved)

**Plan metadata:** `220b4c1` (docs: complete plan)

## Files Created/Modified

- `/Users/zacharym/marcosweb/.env.local` - Added AUTH_URL=http://localhost:3000 (gitignored, local change only)
- `/Users/zacharym/marcosweb/.planning/REQUIREMENTS.md` - MENU-04/05 marked complete in checklist and traceability table; last-updated timestamp updated

## Decisions Made

- AUTH_URL is required in addition to NEXTAUTH_URL for Auth.js v5 on Next.js 16 — the Next.js adapter resolves the signIn server action URL from AUTH_URL, not the NEXTAUTH_URL alias (GitHub issue #13388)
- MENU-04 and MENU-05 were already implemented in Phase 4 (product detail modal + media gallery carousel); REQUIREMENTS.md was a documentation lag, not a missing feature

## Deviations from Plan

None - plan executed exactly as written. Human-action checkpoint resolved successfully by orchestrator.

## Issues Encountered

- .env.local is gitignored (correct for security) — only REQUIREMENTS.md was committed; the AUTH_URL change is a local-only edit applied to the file on disk

## User Setup Required

All infrastructure steps completed:

- AUTH_SECRET added to Vercel Production
- AUTH_URL=https://marcosweb.vercel.app added to Vercel Production
- SANITY_WRITE_TOKEN added to Vercel Production
- Sanity CORS: https://marcosweb.vercel.app already existed in CORS list with credentials enabled
- Write token confirmed Editor role
- Vercel redeployed successfully to https://marcosweb.vercel.app

No further manual setup required before smoke test.

## Next Phase Readiness

- All production infrastructure is in place
- AUTH_SECRET and AUTH_URL correctly set on Vercel — signIn should work on live URL
- SANITY_WRITE_TOKEN active on Vercel with Editor role — owner can create/upload products
- Sanity CORS allows production domain — Studio accessible from live URL
- Ready to proceed to 05-02: full E2E smoke test on https://marcosweb.vercel.app

---
*Phase: 05-bug-fixing-and-polishing-for-deployment*
*Completed: 2026-03-02*
