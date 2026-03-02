---
phase: 01-setup
plan: 02
subsystem: infra
tags: [vercel, sanity, cors, nextauth, environment-variables, deployment]

# Dependency graph
requires:
  - phase: 01-setup plan 01
    provides: Next.js 15 project scaffolded with embedded Sanity Studio, .env.example with 5 keys
provides:
  - Live Vercel deployment at https://marcosweb.vercel.app
  - Sanity CORS origins configured for localhost:3000 and https://marcosweb.vercel.app
  - All 5 environment variables set in Vercel project settings (Production scope)
  - NEXTAUTH_SECRET and SANITY_API_TOKEN populated in .env.local
  - Sanity Studio accessible at /studio in production without CORS errors
affects: [02-data-layer, 03-auth-gate, 04-product-display]

# Tech tracking
tech-stack:
  added: [vercel-hosting, sanity-api-token]
  patterns: [credentials-enabled-cors, vercel-env-vars-production-scope, nextauth-url-prod-override]

key-files:
  created:
    - src/app/studio/layout.tsx
  modified:
    - src/app/studio/[[...tool]]/page.tsx
    - .env.local

key-decisions:
  - "NEXTAUTH_URL set to https://marcosweb.vercel.app in Vercel env vars — local .env.local keeps http://localhost:3000"
  - "Sanity API token scoped to Viewer role only — sufficient for read operations in Phase 2, matches principle of least privilege"
  - "Studio fix applied: page.tsx given 'use client' and metadata moved to studio/layout.tsx — required for Vercel production build to pass"

patterns-established:
  - "Vercel env vars scoped to Production — local .env.local overrides for dev (NEXTAUTH_URL differs by environment)"
  - "CORS origins added with --credentials flag — required for Studio authentication flow"

requirements-completed: [INFRA-01, INFRA-02]

# Metrics
duration: manual (human-action tasks)
completed: 2026-03-01
---

# Phase 1 Plan 02: Vercel Deployment and CORS Configuration Summary

**Next.js 15 app deployed to https://marcosweb.vercel.app with Sanity CORS configured for both localhost and production, all 5 env vars set in Vercel, and Studio accessible at /studio without CORS errors**

## Performance

- **Duration:** Manual (human-action checkpoint tasks — Vercel dashboard and Sanity manage.sanity.io interactions)
- **Started:** 2026-03-01
- **Completed:** 2026-03-01
- **Tasks:** 3
- **Files modified:** 3

## Accomplishments
- NEXTAUTH_SECRET generated via `openssl rand -base64 32` and saved to .env.local
- SANITY_API_TOKEN created at manage.sanity.io with Viewer permissions (name: next-app-viewer) and saved to .env.local
- Project deployed to Vercel at https://marcosweb.vercel.app via GitHub repository import
- All 5 environment variables added to Vercel production scope: NEXT_PUBLIC_SANITY_PROJECT_ID, NEXT_PUBLIC_SANITY_DATASET, SANITY_API_TOKEN, NEXTAUTH_SECRET, NEXTAUTH_URL=https://marcosweb.vercel.app
- Sanity CORS configured for http://localhost:3000 and https://marcosweb.vercel.app, both with credentials enabled
- Production build passing — home page and /studio load without errors

## Task Commits

These tasks were human-action checkpoints requiring Vercel/Sanity dashboard interactions. No code commits were generated for Tasks 1-3 themselves.

1. **Task 1: Generate NEXTAUTH_SECRET and create Sanity API token** - Human action (no commit — credentials set in .env.local and Sanity dashboard)
2. **Task 2: Deploy to Vercel and connect GitHub repository** - Human action (Vercel dashboard — deployment at https://marcosweb.vercel.app)
3. **Task 3: Configure Sanity CORS and verify production stack** - Human action (manage.sanity.io CORS config)

**Studio fix (applied during deployment verification):** `2c1fb80` (fix — "use client" + layout.tsx for metadata export)

## Files Created/Modified
- `src/app/studio/layout.tsx` - Created: Studio-specific layout exporting metadata/viewport for production build compatibility
- `src/app/studio/[[...tool]]/page.tsx` - Modified: Added "use client" directive; metadata moved to layout.tsx
- `.env.local` - Modified: NEXTAUTH_SECRET and SANITY_API_TOKEN populated with real values (gitignored)

## Decisions Made
- NEXTAUTH_URL is set to the production domain in Vercel env vars (`https://marcosweb.vercel.app`) while `.env.local` keeps `http://localhost:3000`. This is the standard pattern — each environment has its own value.
- Sanity API token uses Viewer role only, matching principle of least privilege. Phase 2 data layer reads are covered; write access is not needed from the app.
- Studio fix: `"use client"` added to studio `page.tsx` and metadata/viewport exports moved to a new `studio/layout.tsx`. The production Vercel build required this separation — the previous Server Component approach that worked locally surfaced an incompatibility in the production build.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Studio page required "use client" + layout.tsx split for production build compatibility**
- **Found during:** Task 3 (production stack verification)
- **Issue:** The studio page.tsx was kept as a Server Component in Plan 01 to allow metadata re-exports. The production Vercel build revealed an incompatibility — the page required "use client" for the embedded Studio to function correctly in production while metadata export needed to move out.
- **Fix:** Added `"use client"` to `src/app/studio/[[...tool]]/page.tsx` and created `src/app/studio/layout.tsx` to hold the `metadata` and `viewport` exports. This is the correct Next.js App Router pattern for co-locating metadata with a client-side route.
- **Files modified:** src/app/studio/[[...tool]]/page.tsx, src/app/studio/layout.tsx (created)
- **Verification:** Production build passes on Vercel, /studio loads without errors at https://marcosweb.vercel.app/studio
- **Committed in:** 2c1fb80 (fix(studio))

---

**Total deviations:** 1 auto-fixed (1 correctness/build fix)
**Impact on plan:** Auto-fix was required for production correctness. No scope creep.

## Issues Encountered
- Studio page Server Component approach (established in Plan 01) was incompatible with production Vercel build requirements. The fix — splitting into page.tsx ("use client") + layout.tsx (metadata) — is the canonical Next.js App Router pattern and resolves the conflict cleanly.

## User Setup Required
Tasks 2 and 3 were human-action checkpoints. The following external service steps were completed manually:
- **Vercel:** GitHub repository imported, project deployed, all 5 env vars configured in Production scope
- **Sanity manage.sanity.io:** API token created (Viewer role, name: next-app-viewer), CORS origins added for localhost:3000 and https://marcosweb.vercel.app (both with credentials)

## Next Phase Readiness
- Full production stack operational: https://marcosweb.vercel.app loads home page, /studio loads Sanity Studio
- All environment variables present locally and in Vercel — Phase 2 data layer can begin immediately
- Sanity project ID vgi4fxay, dataset production, CORS configured — GROQ queries will work from both dev and production
- No blockers for Phase 2 (Data Layer)

## Self-Check: PASSED

- `src/app/studio/layout.tsx` exists on disk
- `src/app/studio/[[...tool]]/page.tsx` modified (verified via git log)
- Commit `2c1fb80` confirmed in git log (fix(studio): use client directive + layout for metadata export)

---
*Phase: 01-setup*
*Completed: 2026-03-01*
