# Phase 5: Bug Fixing and Polishing for Deployment - Context

**Gathered:** 2026-03-02
**Status:** Ready for planning
**Source:** User-provided context

<domain>
## Phase Boundary

This phase delivers a production-ready, client-handover-ready site. The buyer/client will own the Sanity project and the Vercel deployment. They will:
- Invite themselves as owner to the Sanity project and upload/edit/delete products
- Approve or deny user registrations via Sanity Studio
- Hand the live site to their dispensary customers

Phase 5 scope: audit every user-facing flow end-to-end on Vercel production, find and fix all bugs, verify Sanity Studio works correctly for a new invited owner, and confirm no broken experiences remain before handover.

</domain>

<decisions>
## Implementation Decisions

### Zero-Bug Deployment Goal
- Every auth flow must work without errors on Vercel production: registration, login, logout, pending, denied, approved
- No login or registration form errors allowed — includes network errors, redirect loops, env var mismatches
- No Sanity Studio upload errors when client is invited as editor/admin — product image/video upload, document creation, publishing

### Sanity Owner Onboarding
- Client will be invited to the Sanity project (not using dev credentials) — test that invite + first-time use works correctly
- Sanity API token and CORS must be correct for both localhost and production Vercel URL
- Product creation schema must accept all required fields with no validation errors

### Production Environment Hardening
- All required env vars must be present and correct on Vercel (AUTH_SECRET, AUTH_URL, SANITY_PROJECT_ID, SANITY_DATASET, SANITY_API_TOKEN)
- AUTH_URL must be set to the production Vercel domain — not localhost
- No console errors or unhandled runtime exceptions in production build

### No Code Changes to Core Features
- Phase 5 only fixes bugs, does not add features
- Phase 4's 04-03-PLAN.md (product modal) must complete before Phase 5 executes — Phase 5 QA includes the modal

### Handover Verification
- After fixes: full E2E smoke test on Vercel production covering every user flow
- Sanity Studio: create a product, edit it, upload an image, approve a user — all must work
- Site UX: age gate → register → pending → (approve in Studio) → login → browse menu → open modal

### Claude's Discretion
- Order of bug fixing: auth-layer issues first (most likely to break on Vercel), then Sanity Studio issues, then frontend polish
- How to surface bugs: read current codebase, check known env-var pitfalls, inspect next.config / middleware for deployment issues
- Any minor UX polish (loading states, error messages) appropriate for client delivery is in scope

</decisions>

<specifics>
## Specific Ideas

- Check AUTH_URL / NEXTAUTH_URL — Auth.js v5 uses AUTH_URL, not NEXTAUTH_URL; Vercel must have this set correctly
- Check SANITY_API_TOKEN write permissions — token must have editor/contributor rights for Sanity Studio product uploads from client's browser
- Check Sanity CORS — studio route must allow Vercel production domain without credentials errors
- Check next/image domains — if Sanity CDN domain is not in next.config.ts remotePatterns, images may fail in production
- Check that /studio route is accessible to the client (excluded from middleware auth check)
- Verify no TypeScript errors or build warnings that surface as runtime issues
- Confirm SanityLive works in production (no WebSocket or CORS errors in browser console)

</specifics>

<deferred>
## Deferred Ideas

- v2 features (effects chips, potency tiers, skeleton loaders, featured product banner) — explicitly out of scope for Phase 5
- Multi-tenant / multi-location support — out of scope

</deferred>

---

*Phase: 05-bug-fixing-and-polishing-for-deployment*
*Context gathered: 2026-03-02 via user discussion*
