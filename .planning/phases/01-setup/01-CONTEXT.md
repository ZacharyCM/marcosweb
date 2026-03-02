# Phase 1: Setup - Context

**Gathered:** 2026-03-01
**Status:** Ready for planning

<domain>
## Phase Boundary

Scaffold a Next.js 15 project with Sanity Studio embedded at `/studio`, deployed to Vercel with all environment variables configured. No product UI, no auth, no schemas — purely the operational foundation every other phase depends on.

</domain>

<decisions>
## Implementation Decisions

### Framework
- Next.js 15 with App Router (default for v15)
- TypeScript throughout

### Sanity integration
- Embedded Studio via `next-sanity` at the `/studio` route
- New Sanity project (greenfield — no existing project)

### Deployment
- Vercel with GitHub integration for auto-deploy on push to main
- Single production environment for v1

### Styling foundation
- Tailwind CSS v4 set up in Phase 1 — Phase 4 needs it for the dark Netflix-style theme; installing it now avoids retrofitting later

### Home page placeholder
- Minimal placeholder at `/` (e.g., project name + "Coming soon") — just enough to satisfy the success criterion that the home page renders without errors

### Environment variables
- `.env.local` for local dev (gitignored)
- `.env.example` committed, documenting all required keys: `NEXT_PUBLIC_SANITY_PROJECT_ID`, `NEXT_PUBLIC_SANITY_DATASET`, `SANITY_API_TOKEN`, `NEXTAUTH_SECRET`, `NEXTAUTH_URL`
- Same vars added to Vercel project settings for production

### Claude's Discretion
- Exact Sanity dataset name (default: `production`)
- ESLint/Prettier configuration details
- Specific Next.js config options (image domains, etc.)

</decisions>

<specifics>
## Specific Ideas

No specific requirements — standard Next.js 15 + Sanity setup following official `next-sanity` documentation.

</specifics>

<code_context>
## Existing Code Insights

### Reusable Assets
- None — greenfield project, no existing code

### Established Patterns
- None yet — this phase establishes the baseline patterns all future phases follow

### Integration Points
- Vercel ↔ GitHub: auto-deploy on push to main
- Next.js app ↔ Sanity: via `next-sanity` client and Studio route

</code_context>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 01-setup*
*Context gathered: 2026-03-01*
