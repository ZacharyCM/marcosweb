---
phase: 03-auth-gate
plan: "01"
subsystem: auth
tags: [next-auth, auth-js-v5, bcryptjs, zod, sanity, typescript]

# Dependency graph
requires:
  - phase: 02-data-layer
    provides: siteUser schema with email/name/status fields

provides:
  - siteUser schema with passwordHash field (hidden: true in Studio)
  - src/lib/sanity-write.ts — server-only Sanity write client with SANITY_WRITE_TOKEN
  - src/lib/auth-types.ts — Auth.js v5 TypeScript module augmentations (Session, User, JWT)
  - next-auth@beta (5.0.0-beta.30), bcryptjs, zod installed in package.json
  - .env.example updated with AUTH_SECRET, AUTH_URL, SANITY_WRITE_TOKEN

affects: [03-02-PLAN, 03-03-PLAN, 03-04-PLAN]

# Tech tracking
tech-stack:
  added: [next-auth@5.0.0-beta.30, bcryptjs@3.0.3, zod@4.3.6, @types/bcryptjs@2.4.6, server-only]
  patterns: [server-only import guard for write clients, @auth/core augmentation for JWT types]

key-files:
  created:
    - src/lib/sanity-write.ts
    - src/lib/auth-types.ts
  modified:
    - src/sanity/schemaTypes/siteUser.ts
    - .env.example
    - package.json

key-decisions:
  - "JWT augmentation targets @auth/core/jwt not next-auth/jwt — moduleResolution: bundler fails on the re-export path"
  - "NEXTAUTH_SECRET and NEXTAUTH_URL removed from .env.example — Auth.js v5 uses AUTH_SECRET and AUTH_URL"
  - "server-only import in sanity-write.ts provides build-time guard preventing accidental client component import"

patterns-established:
  - "server-only: import guard pattern for any server-exclusive module"
  - "Auth.js v5 module augmentation: extend Session/User in next-auth, extend JWT in @auth/core/jwt"

requirements-completed: [AUTH-05]

# Metrics
duration: 2min
completed: 2026-03-02
---

# Phase 3 Plan 01: Auth Foundation Summary

**passwordHash field added to siteUser Sanity schema, next-auth@beta/bcryptjs/zod installed, sanityWriteClient with server-only guard created, Auth.js v5 TypeScript session/JWT type augmentations defined**

## Performance

- **Duration:** 2 min
- **Started:** 2026-03-02T17:47:00Z
- **Completed:** 2026-03-02T17:49:00Z
- **Tasks:** 2
- **Files modified:** 5

## Accomplishments

- passwordHash field added to siteUser Sanity schema with `hidden: true` — visible to API but invisible in Studio UI, preserving the owner's clean radio-button status management
- Server-only Sanity write client created at src/lib/sanity-write.ts — required for all registration/user creation server actions in Plans 02-04
- Auth.js v5 TypeScript augmentations defined for Session (id, status), User (status), and JWT (id, status) — enables typed access to `session.user.id` and `session.user.status` without casting

## Task Commits

Each task was committed atomically:

1. **Task 1: Add passwordHash to siteUser schema and install packages** - `2a563eb` (feat)
2. **Task 2: Create sanity-write.ts client and auth-types.ts augmentation** - `bb3662c` (feat)

**Plan metadata:** (docs commit — see final_commit)

## Files Created/Modified

- `src/sanity/schemaTypes/siteUser.ts` - Added passwordHash field (hidden: true) after status field
- `src/lib/sanity-write.ts` - Server-only Sanity write client using SANITY_WRITE_TOKEN
- `src/lib/auth-types.ts` - Auth.js v5 module augmentations for Session, User, and JWT interfaces
- `.env.example` - Added SANITY_WRITE_TOKEN, AUTH_SECRET, AUTH_URL; removed NEXTAUTH_SECRET/NEXTAUTH_URL
- `package.json` - Added next-auth@^5.0.0-beta.30, bcryptjs, zod, @types/bcryptjs

## Decisions Made

- JWT augmentation uses `@auth/core/jwt` instead of `next-auth/jwt` — with `moduleResolution: "bundler"`, the `next-auth/jwt` re-export path fails as an augmentation target; `@auth/core/jwt` is where JWT is actually declared and works correctly
- Removed NEXTAUTH_SECRET and NEXTAUTH_URL from .env.example — Auth.js v5 renames these to AUTH_SECRET and AUTH_URL
- `useCdn: false` in sanityWriteClient — auth operations must read fresh data, never stale CDN cache

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] JWT augmentation target changed from next-auth/jwt to @auth/core/jwt**
- **Found during:** Task 2 (auth-types.ts creation)
- **Issue:** `declare module "next-auth/jwt"` fails with TS2664 ("module cannot be found") when using `moduleResolution: "bundler"` because the path is a re-export wrapper, not the original module
- **Fix:** Changed augmentation target to `declare module "@auth/core/jwt"` where the JWT interface is actually declared
- **Files modified:** src/lib/auth-types.ts
- **Verification:** `npx tsc --noEmit` exits 0 with no errors
- **Committed in:** bb3662c (Task 2 commit)

---

**Total deviations:** 1 auto-fixed (Rule 1 - Bug)
**Impact on plan:** Necessary correction — wrong augmentation path would cause compile errors in all future plans that rely on typed JWT access. No scope creep.

## Issues Encountered

None beyond the auto-fixed JWT augmentation target.

## User Setup Required

External services require manual configuration before Plans 02-04 can run:

1. **SANITY_WRITE_TOKEN** — Sanity Dashboard -> [project] -> API -> Tokens -> Add API token -> Name: "Pure Pressure Write" -> Permissions: Editor -> Save. Add to `.env.local`.
2. **AUTH_SECRET** — Generate with `openssl rand -base64 32`, add to `.env.local` and Vercel project settings.
3. **AUTH_URL** — Set to `http://localhost:3000` in `.env.local`; set to production domain in Vercel.

## Next Phase Readiness

- Plan 03-02 (credentials provider + auth.ts) can proceed — all prerequisites are in place
- siteUser schema accepts passwordHash writes via sanityWriteClient
- TypeScript will recognize typed session fields when auth.ts is implemented
- Blocker: SANITY_WRITE_TOKEN and AUTH_SECRET must be set in .env.local before running dev server after Plans 02-04

---
*Phase: 03-auth-gate*
*Completed: 2026-03-02*

## Self-Check: PASSED

All created files verified on disk and all task commits confirmed in git history.
