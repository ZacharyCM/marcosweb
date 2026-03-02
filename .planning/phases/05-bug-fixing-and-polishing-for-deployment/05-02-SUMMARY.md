---
phase: 05-bug-fixing-and-polishing-for-deployment
plan: 02
subsystem: testing
tags: [e2e, smoke-test, vercel, sanity, production, cdn, cache]

# Dependency graph
requires:
  - phase: 05-bug-fixing-and-polishing-for-deployment
    provides: "Plan 05-01 infrastructure fixes: AUTH_URL set on Vercel, AUTH_SECRET, SANITY_WRITE_TOKEN, Sanity CORS verified, redeployed to marcosweb.vercel.app"
provides:
  - "Human-verified confirmation all 5 E2E user flows pass on live Vercel production URL"
  - "Two production bugs found and fixed: stale CDN data and indefinite Next.js Data Cache"
  - "Site validated and ready for client handover"
affects: []

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "useCdn: false in Sanity client.ts ensures real-time content accuracy — never serve stale CDN data in production"
    - "export const revalidate = 0 in route segments that must always reflect Sanity content changes immediately"

key-files:
  created: []
  modified:
    - src/lib/client.ts
    - src/app/(app)/menu/page.tsx

key-decisions:
  - "useCdn: false is the correct default for this app — the owner manages content in real time; CDN caching would cause deleted products to persist for minutes"
  - "revalidate = 0 on menu/page.tsx — menu data must always be fresh; indefinite Next.js Data Cache was silently preventing changes from appearing"

patterns-established:
  - "Smoke test pattern: run all critical user flows in incognito on live URL before client handover — not just localhost"
  - "CDN bypass pattern: Sanity useCdn:false + Next.js revalidate:0 ensures any content change is immediately visible on reload"

requirements-completed:
  - AUTH-01
  - AUTH-02
  - AUTH-03
  - AUTH-04
  - AUTH-05
  - AUTH-06
  - PROD-01
  - PROD-02
  - PROD-03
  - PROD-04
  - MENU-01
  - MENU-02
  - MENU-03
  - MENU-04
  - MENU-05
  - MENU-06
  - LEGAL-01
  - LEGAL-02
  - LEGAL-03
  - INFRA-01
  - INFRA-02

# Metrics
duration: ~30min (human-verify session)
completed: 2026-03-02
---

# Phase 5 Plan 02: E2E Production Smoke Test Summary

**All 5 production user flows verified live on https://marcosweb.vercel.app — two caching bugs found and fixed, site cleared for client handover**

## Performance

- **Duration:** ~30 min (human-verify session)
- **Started:** 2026-03-02
- **Completed:** 2026-03-02T23:05:00Z
- **Tasks:** 1 (human-verify checkpoint + 2 auto-fixes)
- **Files modified:** 2

## Accomplishments

- All 5 E2E smoke test flows passed on the live Vercel production URL (marcosweb.vercel.app)
- Discovered and fixed deleted products still appearing on menu — root cause: `useCdn: true` in Sanity client was serving stale CDN-cached content after deletions
- Discovered and fixed menu not reflecting changes after reloads — root cause: `export const revalidate` unset, causing Next.js Data Cache to hold menu data indefinitely
- Both fixes deployed and verified in production before handover

## Task Commits

Each task was committed atomically:

1. **Task 1: E2E Production Smoke Test** - human-verify (smoke-test-passed)
   - Bug Fix 1: `fae678a` — fix(menu): disable Sanity CDN so content deletions reflect immediately on reload
   - Bug Fix 2: `8170f0c` — fix(menu): bypass Next.js Data Cache so product changes reflect immediately

## Files Created/Modified

- `src/lib/client.ts` - Changed `useCdn: true` to `useCdn: false` so every Sanity read goes directly to the API, not the CDN cache
- `src/app/(app)/menu/page.tsx` - Added `export const revalidate = 0` so Next.js never holds a stale cached copy of menu data

## Decisions Made

- **useCdn: false is correct for this app:** The owner manages products in real time via Sanity Studio. If `useCdn: true`, a deleted product could continue appearing on the live menu for several minutes (Sanity CDN cache TTL). Since this is a small owner-managed catalog with immediate expectations, real-time reads are mandatory.
- **revalidate = 0 over ISR:** Incremental Static Regeneration with a TTL (e.g., `revalidate = 60`) would still introduce a window where stale data is shown. `revalidate = 0` ensures every page request re-fetches from Sanity — acceptable given the small user base and content volume.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Deleted products still visible on production menu**
- **Found during:** Task 1 (E2E Smoke Test — Flow 3, menu browsing)
- **Issue:** Products deleted in Sanity Studio remained visible on the live menu page. Root cause: `useCdn: true` in `src/lib/client.ts` caused all GROQ reads to go through Sanity's CDN, which caches responses and does not invalidate immediately on document deletion.
- **Fix:** Set `useCdn: false` in `src/lib/client.ts` so all queries bypass CDN and hit the Sanity API directly.
- **Files modified:** `src/lib/client.ts`
- **Verification:** Deleted a test product in Studio; reloaded live menu — product no longer appeared.
- **Committed in:** `fae678a`

**2. [Rule 1 - Bug] Menu page not reflecting content changes after reloads**
- **Found during:** Task 1 (E2E Smoke Test — Flow 3, menu browsing)
- **Issue:** Even after fixing `useCdn`, the Next.js Data Cache was holding a stale copy of the GROQ query results indefinitely. New products published in Studio did not appear on menu reloads until a full redeploy. Root cause: `export const revalidate` was not set on `menu/page.tsx`, defaulting to Next.js indefinite caching.
- **Fix:** Added `export const revalidate = 0` to `src/app/(app)/menu/page.tsx` so every request fetches fresh data from Sanity.
- **Files modified:** `src/app/(app)/menu/page.tsx`
- **Verification:** Published a new test product in Studio; reloaded live menu without redeployment — product appeared immediately.
- **Committed in:** `8170f0c`

---

**Total deviations:** 2 auto-fixed (both Rule 1 - Bug)
**Impact on plan:** Both fixes necessary for correct production behavior. No scope creep. The plan stated "no code changes expected" but the smoke test is specifically designed to catch exactly these kinds of production-only issues.

## Issues Encountered

- Sanity CDN + Next.js Data Cache were independently caching menu data in production — neither was observable in local development (local dev bypasses both). The bugs were only discoverable by running the smoke test on the live URL, which is exactly why the plan existed.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- All 5 user flows verified in production: age gate, registration, Studio management, approved user menu browsing with modal, denied user error, URL protection
- All 21 v1 requirements (AUTH-01 through INFRA-02) verified complete in production
- Site is ready for client handover — no known bugs, no blocking issues
- Phase 5 complete; project milestone v1.0 complete

---
*Phase: 05-bug-fixing-and-polishing-for-deployment*
*Completed: 2026-03-02*
