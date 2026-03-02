# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-03-01)

**Core value:** Approved customers can browse the full product menu by strain type, seeing pricing, potency, and descriptions — giving the dispensary a professional digital presence without any e-commerce complexity.
**Current focus:** Phase 1 — Setup

## Current Position

Phase: 2 of 4 (Data Layer)
Plan: 1 of 2 in current phase — plan 01 complete
Status: Phase 2 in progress, Plan 02-01 complete
Last activity: 2026-03-02 — Plan 02-01 complete (Sanity schemas: product + siteUser, registered in Studio)

Progress: [███░░░░░░░] 30%

## Performance Metrics

**Velocity:**
- Total plans completed: 2
- Average duration: 6 min (automated tasks only; Plan 02 was human-action tasks)
- Total execution time: 6 min automated

**By Phase:**

| Phase | Plans | Total | Avg/Plan |
|-------|-------|-------|----------|
| 01-setup | 2/2 | 6 min | 6 min |

**Recent Trend:**
- Last 5 plans: 6 min
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

### Pending Todos

None yet.

### Blockers/Concerns

- [Phase 3]: Auth.js v5 GA status unconfirmed — verify before implementation begins
- [Phase 4]: Client's jurisdiction for cannabis compliance (state-specific labeling rules) must be confirmed before product card design is finalized

## Session Continuity

Last session: 2026-03-02
Stopped at: Completed 02-01-PLAN.md — Sanity product and siteUser schemas defined, registered in Studio, TypeScript clean, build succeeds
Resume file: None
