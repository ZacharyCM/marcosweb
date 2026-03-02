---
phase: 01-setup
plan: 01
subsystem: infra
tags: [next.js, sanity, tailwind, typescript, eslint]

# Dependency graph
requires: []
provides:
  - Next.js 15 App Router project with TypeScript and Tailwind CSS v4
  - Sanity Studio embedded at /studio via next-sanity NextStudio component
  - Centralized Sanity client at src/sanity/lib/client.ts
  - Route group (app) isolating Tailwind globals from studio route
  - .env.example documenting all 5 required environment variable keys
  - cdn.sanity.io image remotePatterns configured for Phase 4 product images
affects: [02-data-layer, 03-auth-gate, 04-product-display]

# Tech tracking
tech-stack:
  added: [next.js@15, sanity@latest, next-sanity, tailwind-css@v4, typescript, eslint-config-next]
  patterns: [app-router-route-groups, embedded-sanity-studio, centralized-sanity-client, env-var-non-null-assertion]

key-files:
  created:
    - src/app/(app)/layout.tsx
    - src/app/(app)/page.tsx
    - src/app/studio/[[...tool]]/page.tsx
    - src/styles/globals.css
    - src/sanity/env.ts
    - src/sanity/lib/client.ts
    - sanity.config.ts
    - .env.example
  modified:
    - next.config.ts
    - .gitignore
    - eslint.config.mjs

key-decisions:
  - "Studio route kept at [[...tool]] (sanity init default) rather than [[...index]] (plan specified) — functionally identical"
  - "Studio page.tsx kept as Server Component (no 'use client') — NextStudio handles client internally, metadata re-export requires server context"
  - "src/sanity/env.ts uses non-null assertion (!) instead of assertValue helper — simpler, consistent with plan spec"
  - ".gitignore updated with !.env.example exception so template file can be committed alongside .env* ignore rule"
  - ".claude/ tooling added to eslint ignore list — pre-existing CommonJS .cjs files caused false positive errors"

patterns-established:
  - "Route group (app) pattern: all user-facing routes nest under src/app/(app)/ to isolate layout from studio"
  - "Sanity env vars read via src/sanity/env.ts — single source of truth for projectId, dataset, apiVersion"
  - "Sanity client singleton at src/sanity/lib/client.ts — import client from this file in all data-fetching code"

requirements-completed: [INFRA-02]

# Metrics
duration: 6min
completed: 2026-03-01
---

# Phase 1 Plan 01: Project Scaffold Summary

**Next.js 15 App Router + embedded Sanity Studio at /studio with (app) route group isolation, centralized Sanity client, and Tailwind CSS v4 globals**

## Performance

- **Duration:** 6 min
- **Started:** 2026-03-02T03:01:49Z
- **Completed:** 2026-03-02T03:07:49Z
- **Tasks:** 1 (Task 1 by user, Task 2 automated)
- **Files modified:** 27

## Accomplishments
- App Router (app) route group established — home page at / renders "Pure Pressure — Coming Soon" with Tailwind v4
- Sanity Studio embedded at /studio using NextStudio from next-sanity with structureTool and empty schema
- Centralized Sanity client and env helpers created — projectId vgi4fxay, dataset production
- next.config.ts updated with cdn.sanity.io remotePatterns for Phase 4 product image rendering
- .env.example committed with all 5 required keys (no secrets)
- TypeScript compiles clean and ESLint passes with zero errors

## Task Commits

Each task was committed atomically:

1. **Task 1: Bootstrap Next.js 15 project and initialize Sanity** - completed by user manually (no commit hash — user ran interactive CLI commands)
2. **Task 2: Configure project structure, embedded Studio, Sanity client, and env files** - `99baaed` (feat)

**Plan metadata:** (in-progress — final docs commit follows)

## Files Created/Modified
- `src/app/(app)/layout.tsx` - Route group layout importing src/styles/globals.css, wraps all app routes
- `src/app/(app)/page.tsx` - Home page placeholder: "Pure Pressure — Coming Soon"
- `src/app/studio/[[...tool]]/page.tsx` - Embedded Sanity Studio via NextStudio, re-exports metadata/viewport
- `src/styles/globals.css` - Tailwind v4 globals (@import "tailwindcss"), moved from src/app/
- `src/sanity/env.ts` - Exports apiVersion, dataset, projectId from NEXT_PUBLIC_ env vars
- `src/sanity/lib/client.ts` - createClient singleton with useCdn: true
- `sanity.config.ts` - defineConfig with structureTool(), basePath: "/studio", schema: { types: [] }
- `next.config.ts` - Added images.remotePatterns for cdn.sanity.io
- `.env.example` - Template with 5 keys: NEXT_PUBLIC_SANITY_PROJECT_ID, NEXT_PUBLIC_SANITY_DATASET, SANITY_API_TOKEN, NEXTAUTH_SECRET, NEXTAUTH_URL
- `.gitignore` - Added !.env.example exception to allow template to be committed
- `eslint.config.mjs` - Added .claude/** to globalIgnores to prevent tooling file false positives

## Decisions Made
- Studio route uses `[[...tool]]` (sanity init default) rather than `[[...index]]` (plan specified). Functionally identical — catch-all route works the same either way.
- Studio page.tsx is a Server Component (no `"use client"` at page level). The plan specified adding `"use client"`, but this would conflict with `metadata`/`viewport` re-exports which require server context. NextStudio handles its own client-side rendering internally via React.lazy.
- src/sanity/env.ts uses the simpler non-null assertion pattern from the plan spec, replacing the `assertValue` helper generated by `sanity init`.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Studio page kept as Server Component — plan's "use client" instruction would break metadata export**
- **Found during:** Task 2 (studio page.tsx configuration)
- **Issue:** Plan specified adding `"use client"` to the studio page, but Next.js App Router does not allow `metadata`/`viewport` exports from Client Components. Adding `"use client"` would silently break metadata or cause a runtime warning.
- **Fix:** Kept studio page as Server Component. NextStudio from next-sanity already handles client-side rendering internally (it's lazy-loaded with `"use client"` inside next-sanity). This is consistent with the sanity init generated code.
- **Files modified:** src/app/studio/[[...tool]]/page.tsx
- **Verification:** TypeScript compiles clean, ESLint passes
- **Committed in:** 99baaed (Task 2 commit)

**2. [Rule 2 - Missing Critical] Added !.env.example to .gitignore so template can be committed**
- **Found during:** Task 2 (.env.example creation)
- **Issue:** create-next-app generated `.gitignore` with `.env*` pattern, which also matched `.env.example`. The plan requires `.env.example` to be committed to document required keys.
- **Fix:** Added `!.env.example` negation after the `.env*` line in .gitignore
- **Files modified:** .gitignore
- **Verification:** `git check-ignore -v .env.example` shows negation rule active; file appears in `git status` as untracked (committable)
- **Committed in:** 99baaed (Task 2 commit)

**3. [Rule 1 - Bug] Added .claude/ to ESLint ignore list — tooling .cjs files caused 85 false-positive errors**
- **Found during:** Task 2 (ESLint verification)
- **Issue:** ESLint scanned the .claude/ tooling directory (CommonJS .cjs files using require()) and reported 85 errors. These are pre-existing GSD framework files, not project source.
- **Fix:** Added `.claude/**` to globalIgnores in eslint.config.mjs
- **Files modified:** eslint.config.mjs
- **Verification:** `npm run lint` exits with 0 errors
- **Committed in:** 99baaed (Task 2 commit)

---

**Total deviations:** 3 auto-fixed (1 correctness, 1 missing critical, 1 correctness)
**Impact on plan:** All auto-fixes necessary for correct operation. No scope creep.

## Issues Encountered
- Stale `.next/types/` cache referenced deleted `src/app/page.js` and `src/app/layout.js` after moving to (app) route group. Resolved by clearing `.next/` cache before running tsc.

## User Setup Required
None - .env.local already populated by user during Task 1 (sanity init provided project ID vgi4fxay).

## Next Phase Readiness
- Local dev environment fully operational: home page at /, Sanity Studio at /studio
- Sanity project ID vgi4fxay with dataset production ready for schema definition (Phase 1 Plan 02)
- All configuration files in place for data layer, auth gate, and product display phases

## Self-Check: PASSED

All files verified present on disk. Commit 99baaed confirmed in git log.

---
*Phase: 01-setup*
*Completed: 2026-03-01*
