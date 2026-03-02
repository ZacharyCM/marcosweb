---
gsd_state_version: 1.0
milestone: v1.0
milestone_name: milestone
status: unknown
last_updated: "2026-03-02T23:05:00Z"
progress:
  total_phases: 5
  completed_phases: 4
  total_plans: 13
  completed_plans: 12
---

# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-03-01)

**Core value:** Approved customers can browse the full product menu by strain type, seeing pricing, potency, and descriptions — giving the dispensary a professional digital presence without any e-commerce complexity.
**Current focus:** Phase 5 — Bug Fixing and Polishing for Deployment

## Current Position

Phase: 5 of 5 (Bug Fixing and Polishing for Deployment)
Plan: 2 of 2 in current phase — Plan 05-01 complete; ready for 05-02 E2E smoke test
Status: In progress — all infrastructure complete, proceeding to smoke test
Last activity: 2026-03-02 — Plan 05-01 fully complete; Vercel env vars set, Sanity CORS verified, production redeployed

Progress: [██████████] 92% (12/13 plans done — 1 remaining in Phase 5)

## Performance Metrics

**Velocity:**
- Total plans completed: 5
- Average duration: 3 min (automated tasks)
- Total execution time: 8 min automated

**By Phase:**

| Phase | Plans | Total | Avg/Plan |
|-------|-------|-------|----------|
| 01-setup | 2/2 | 6 min | 6 min |
| 02-data-layer | 2/2 | 2 min | 1 min |
| 03-auth-gate | 4/4 | 54 min | 13.5 min |
| 04-product-display | 2/3 (so far) | 5 min | 5 min |

**Recent Trend:**
- Last 5 plans: 3 min
- Trend: —

*Updated after each plan completion*

## Accumulated Context

### Decisions

Decisions are logged in PROJECT.md Key Decisions table.
Recent decisions affecting current work:

- [Pre-build]: Auth gate must be proven before menu UI — never retrofit auth onto a working unprotected route (research finding)
- [Pre-build]: Auth.js v5 GA status was unconfirmed at training cutoff — verify at https://authjs.dev before starting Phase 3
- [Pre-build]: JWT maxAge vs. session callback re-fetch tradeoff must be decided with client before auth is built (24h stale vs. real-time revocation)
- [01-01]: Studio route kept at [[...tool]] (sanity init default) rather than [[...index]] — functionally identical catch-all route
- [01-01]: Studio page.tsx is a Server Component — "use client" would conflict with metadata re-export; NextStudio handles client internals
- [01-01]: .gitignore updated with !.env.example exception so template file can be committed despite .env* pattern
- [01-02]: NEXTAUTH_URL set to production domain in Vercel; .env.local keeps localhost — each environment has its own value
- [01-02]: Sanity API token scoped to Viewer role only — sufficient for Phase 2 reads, principle of least privilege
- [01-02]: Studio fix: "use client" + layout.tsx split required for Vercel production build — page.tsx client, layout.tsx holds metadata
- [02-01]: siteUser omits passwordHash — Phase 3 research will determine if Auth.js stores credentials separately or Sanity holds them
- [02-01]: strainType values lowercase (sativa/hybrid/indica) — Phase 4 carousel GROQ queries filter on these exact strings
- [02-01]: media uses type:file with accept:video/* for videos, not type:image — prevents Sanity from processing video assets as images
- [02-01]: effects stored as string array, not comma-separated string — enables per-effect filtering in Phase 4
- [02-02]: TypeGen naming convention uses variable name as type suffix (ALL_PRODUCTS_QUERYResult not AllProductsQueryResult) — Sanity TypeGen standard behavior
- [02-02]: sanity.cli.ts typegen block does not accept 'enabled' property — block presence enables TypeGen; removed enabled:true (plan spec error)
- [02-02]: schema.json gitignored — generated at typegen runtime, not committed
- [03-01]: JWT augmentation targets @auth/core/jwt not next-auth/jwt — moduleResolution: bundler fails on the re-export path
- [03-01]: NEXTAUTH_SECRET and NEXTAUTH_URL removed from .env.example — Auth.js v5 uses AUTH_SECRET and AUTH_URL
- [03-01]: server-only import in sanity-write.ts provides build-time guard preventing accidental client component import
- [03-02]: Split config pattern separates edge-safe auth.config.ts (no bcrypt/Node.js) from full auth.ts — required for Next.js 16 proxy compatibility
- [03-02]: DeniedError and PendingError extend CredentialsSignin with code property — Auth.js surfaces code as ?code= query param on login redirect
- [03-02]: Studio excluded from proxy.ts matcher — owner is not a siteUser, blocking /studio would lock them out of content management
- [03-02]: JWT maxAge 24h tradeoff accepted — revocation requires user re-login; acceptable for small known customer base
- [03-03]: redirect('/pending') outside try/catch in register() — redirect() throws NEXT_REDIRECT; catching it would silently swallow the redirect
- [03-03]: login() only catches AuthError — NEXT_REDIRECT (success) must re-throw and propagate naturally
- [03-03]: LoginForm handles errors from both useActionState and URL query params — covers both direct submit and Auth.js redirect flows
- [03-03]: (auth) route group has no layout.tsx — root layout.tsx provides html/body; no extra wrapper needed
- [03-04]: JWT re-fetch on every token validation — async jwt() re-queries Sanity so status changes take effect immediately without re-login; trades one Sanity read per request for real-time revocation
- [03-04]: Denied users routed to /login?code=denied (not /pending) — prevents denied → /pending loop; message shown directly on login page via existing LoginForm error-code mapping
- [03-04]: Logout redirects to /login (not /) — users land on login form after signing out
- [03-04]: login() passes explicit redirectTo: "/menu" — ensures successful auth always lands on /menu regardless of callbackUrl
- [04-01]: Age gate check runs before auth check in proxy — unverified visitors never see login form or app content
- [04-01]: PUBLIC_PATHS allow /age-gate and /privacy unconditionally — must be reachable without any cookie
- [04-01]: confirmAge redirects to /login after cookie set — age verification feeds directly into auth flow
- [04-01]: SanityLive added to (app) layout so Studio edits propagate without full redeploy
- [04-02]: Use product.primaryImage.url directly as next/image src — GROQ projects url as plain CDN string, not a Sanity image reference; urlFor() requires a reference object and would throw at runtime
- [04-02]: overflow-hidden wrapper around overflow-x-auto carousel prevents page-level horizontal scrollbar without disabling internal scrollability
- [04-02]: ProductCard onClick is empty placeholder — modal wiring deferred to Plan 03 per plan spec
- [05-01]: AUTH_URL must be set in addition to NEXTAUTH_URL for Auth.js v5 on Next.js 16 — signIn() "Configuration" error without it (GitHub issue #13388)
- [05-01]: REQUIREMENTS.md MENU-04/05 corrected to complete — Phase 4 plan 03 delivered product modal and media gallery; docs were lagging behind implementation

### Roadmap Evolution

- Phase 5 added: bug fixing and polishing for deployment

### Pending Todos

None yet.

### Blockers/Concerns

- [Phase 4]: Client's jurisdiction for cannabis compliance (state-specific labeling rules) must be confirmed before product card design is finalized
- [Phase 5]: Infrastructure checkpoint resolved — AUTH_SECRET, AUTH_URL, SANITY_WRITE_TOKEN set on Vercel; Sanity CORS verified; production redeployed at https://marcosweb.vercel.app

## Session Continuity

Last session: 2026-03-02
Stopped at: 05-01-PLAN.md complete — all infrastructure done; ready to begin 05-02 E2E smoke test
Resume file: None
