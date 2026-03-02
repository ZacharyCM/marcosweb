# Project Research Summary

**Project:** Pure Pressure — Cannabis Dispensary Product Display Website
**Domain:** Gated cannabis product display / menu website (Next.js + Sanity CMS)
**Researched:** 2026-03-01
**Confidence:** MEDIUM — training knowledge through Aug 2025. Key dependency (Auth.js v5 GA status) must be verified before implementation.

## Executive Summary

Pure Pressure is a private, gated cannabis dispensary menu display site. The core product pattern is: visitors request access, the owner approves them via a CMS dashboard, and only approved users can browse product carousels. This is not an e-commerce site — no cart, no checkout, no ordering. The entire product is a display layer on top of Sanity CMS with an auth gate built using Next.js 15 App Router and Auth.js v5. The recommended stack is well-established: Next.js 15 (App Router + RSC), Sanity v3 with embedded Studio, NextAuth v5 Credentials provider backed by Sanity user documents, Tailwind CSS + shadcn/ui for UI, deployed on Vercel.

The architecture is deliberately minimal: Sanity handles both content (products) and user data (approval status) — eliminating the need for any separate database. Authentication state (including approval status) is encoded in a JWT at login time, and a single `middleware.ts` enforces the gate on all `/menu/**` routes. Product data is fetched server-side via GROQ at request time, never client-side. The visual model is Netflix-style horizontal carousels per strain type (Sativa / Hybrid / Indica), with a product detail modal, a dark Weedmaps-aesthetic color scheme, and mobile touch scroll.

The biggest risks are infrastructure configuration failures (CORS, Vercel env vars, NEXTAUTH_URL mismatch) and auth sequencing errors (building menu UI before the auth gate is hardened). Both risks are well-documented and fully preventable by following the prescribed build order: Sanity schemas first, then auth layer + middleware, then product display UI. Legal compliance (age gate, jurisdiction disclaimer, "display only" labeling) must be present at launch — not deferred.

---

## Key Findings

### Recommended Stack

Next.js 15 App Router is the clear choice: React Server Components eliminate client-side Sanity fetches (better performance, no token exposure), and App Router middleware provides the single-enforced auth gate the project requires. Auth.js v5 (formerly next-auth) provides App Router-native JWT sessions with a Credentials provider backed by Sanity documents — no separate database required. Sanity v3 with embedded Studio runs at `/studio` in the same repo, giving the owner a self-service CMS for products and user approvals without developer involvement. Tailwind CSS + shadcn/ui delivers the dark theme and carousel/modal components quickly. Embla Carousel (bundled with shadcn) handles horizontal scrolling.

**Core technologies:**
- **Next.js 15 (App Router):** Framework — RSC + middleware for auth gating, Vercel-native deployment
- **TypeScript 5.x:** Type safety — critical for Sanity GROQ query projections and prop passing
- **Sanity v3 + embedded Studio:** CMS and user management — single source of truth for products and approval status
- **@sanity/client v6 + next-sanity v9:** Sanity integration — GROQ queries server-side, live preview support
- **Auth.js v5 (next-auth):** Authentication — JWT sessions, Credentials provider, App Router compatible
- **Tailwind CSS 3.4 + shadcn/ui:** Styling and components — dark theme, Dialog (modal), carousel primitives
- **Embla Carousel v8:** Horizontal carousels — lightweight, touch-scroll, no external CSS dependencies
- **Vercel:** Deployment — zero-config Next.js, preview URLs, env var management

**Do not use:** next-auth v4 (Pages Router patterns), Prisma/PostgreSQL (unnecessary infrastructure), MUI/Chakra (RSC-incompatible), react-slick (jQuery-era CSS), Pages Router, SWR/React Query for products (Server Components fetch directly).

### Expected Features

The access model (owner-approval gating) is the primary differentiator from Weedmaps, Leafly, and Dutchie, which are all public. The carousel-per-strain format differentiates from the competitor grid layout. Everything else follows industry standards.

**Must have (table stakes):**
- Owner-approval gated access with explicit pending/denied states — regulatory expectation + client requirement
- Three strain category carousels (Sativa / Hybrid / Indica) — industry de facto taxonomy
- Product cards: name, strain badge, price, THC/CBD% — users arrive expecting this exact data shape
- Product detail modal: full description, effects, all fields — card alone doesn't satisfy browse intent
- Dark color scheme (Weedmaps aesthetic) — client requirement aligns with market expectation
- Session persistence — standard cookie behavior users expect
- Mobile-responsive layout with touch-scroll carousels — 60%+ of cannabis shoppers browse mobile
- Product images — text-only cards read as unfinished

**Should have (competitive):**
- Netflix-style visible overflow ("peeking" cards) — signals scrollability without instructions
- Smooth modal transitions (200-300ms) — distinguishes from generic CMS templates
- Skeleton loading states — professional feel while Sanity data loads
- Potency visual indicator (THC% tier badge) — helps visual scanners immediately
- Effects chips on product cards — lets customers self-select without opening modal

**Defer (v2+):**
- Product search / filtering (when catalog exceeds ~50 items)
- Cart / checkout — out of scope by client decision; use "Visit in-store" CTA instead
- Email notifications on approval — requires email infrastructure
- Real-time inventory sync — requires POS integration
- Contact / hours page

### Architecture Approach

The system splits cleanly into three layers: Sanity Content Lake (data store for products and user approvals), Next.js server (middleware gate + RSC data fetching + auth), and browser client (pure display components — carousels, cards, modals). Critically, `middleware.ts` is the single enforcement point for auth — it reads JWT status on every `/menu/**` request and redirects pending/denied/unauthenticated users before any Server Component runs. Two separate Sanity clients exist: a read-only frontend client in `lib/sanity/` and a write-capable Studio client in `sanity/` — these must never cross-import.

**Major components:**
1. `middleware.ts` — single auth + approval gate for all `/menu/**` routes; reads JWT status field
2. Auth Layer (NextAuth v5 Credentials) — sign-up via Server Action writes bcrypt-hashed password + pending status to Sanity; sign-in loads status into JWT
3. Sanity Content Lake — `product` schema (name, strain, price, THC%, CBD%, description, effects, image) + `siteUser` schema (email, passwordHash, status: pending|approved|denied)
4. Server Components (menu page) — GROQ fetch at request time, passes typed `Product[]` to client components
5. Menu UI Client Components — `StrainCarousel`, `ProductCard`, `ProductModal` — pure display, zero auth logic
6. Embedded Sanity Studio at `/studio` — owner's self-service interface for products and user approvals

**Build order is mandatory:** Sanity schemas → Sanity client + GROQ queries → TypeScript types → Auth layer + middleware → Menu UI components → Menu page wiring → Studio route. Never retrofit auth onto a working unprotected page.

### Critical Pitfalls

1. **Sanity images are not URLs** — `product.image` is a reference object, not a string. Install `@sanity/image-url` and create `urlFor()` utility on day one before building any product card.

2. **GROQ missing `.asset->` dereference** — querying `image` without `image.asset->{ url, metadata }` returns undefined URLs. Test all GROQ queries before building UI.

3. **Stale product data from App Router caching** — without explicit cache policy, product fetches cache indefinitely at build time. Set `{ next: { revalidate: 60 } }` on all Sanity fetches. Optionally add a Sanity webhook for instant revalidation on publish.

4. **Auth redirect loop on Vercel from NEXTAUTH_URL mismatch** — `NEXTAUTH_URL` must exactly match the canonical production URL. For Preview deploys, use `VERCEL_URL`. Test auth on a Vercel Preview URL before calling auth complete.

5. **CORS not configured for Vercel domains** — Sanity queries work on localhost but fail on Vercel. Add `http://localhost:3000`, `https://*.vercel.app`, and `https://yourdomain.com` to Sanity CORS origins before first Vercel deploy.

6. **Approval status stale in JWT** — status is encoded at login; owner revoking access in Studio has no immediate effect. Acceptable for v1 with 24h JWT maxAge. If immediate revocation is required, re-fetch status from Sanity in the `session` callback (adds a Sanity query per session check — decide before auth is finalized).

7. **Security: write token must never be `NEXT_PUBLIC_`** — `SANITY_API_READ_TOKEN` (and any write token) must be server-only environment variables. Never prefix with `NEXT_PUBLIC_`. Create `.env.example` on day one.

8. **Cannabis legal compliance required at launch** — age gate before any content, jurisdiction disclaimer, "display only, not an online store" label, and a minimal privacy policy covering user account data collection are required before public launch.

---

## Implications for Roadmap

Based on the feature dependency graph and architectural build order from research, the roadmap should follow this sequence strictly. The most critical constraint: auth gate must be proven before menu UI is built.

### Phase 1: Project Setup and Infrastructure

**Rationale:** All downstream phases depend on Sanity project existence, environment variables, and Next.js scaffold. CORS and `next.config.ts` image domains must be configured before any Sanity-integrated code can be tested. The `.env.example` file prevents the most common deployment failure.
**Delivers:** Working Next.js 15 app on Vercel with Sanity project connected, environment variables configured, and `cdn.sanity.io` in remotePatterns.
**Addresses:** Table-stakes foundation — nothing else can be built without this.
**Avoids:** Missing Vercel env vars pitfall, CORS failure on first deploy, broken Sanity image pipeline.

### Phase 2: Sanity Schemas and Data Layer

**Rationale:** Both the auth layer and the product display layer depend on Sanity schemas being defined first. GROQ queries cannot be typed until the `product` and `siteUser` document schemas are committed to the project.
**Delivers:** `product` and `siteUser` schemas in `sanity/schemaTypes/`, Sanity client in `lib/sanity/client.ts`, all GROQ queries in `lib/sanity/queries.ts`, TypeScript types in `lib/sanity/types.ts`, `@sanity/image-url` utility, embedded Studio route at `/studio`.
**Avoids:** Sanity image reference pitfall (establish `urlFor()` here), GROQ asset dereference pitfall (validate all queries return resolved image URLs before proceeding).

### Phase 3: Authentication and Approval Gate

**Rationale:** FEATURES.md is explicit — auth gate must be working before building menu UI. Building carousels on an unprotected route and adding auth later is the single most cited anti-pattern in the architecture research. This phase is the core business logic of the product.
**Delivers:** Registration form (Server Action writes bcrypt-hashed siteUser to Sanity with `status: 'pending'`), login form (NextAuth v5 Credentials), JWT with status field, `/pending` and `/denied` pages, `middleware.ts` enforcing the gate on `/menu/**`. Owner can approve users in Sanity Studio.
**Avoids:** JWT stale approval status (decide 24h maxAge vs. session callback re-fetch), NEXTAUTH_URL mismatch (test on Vercel Preview before calling complete), plaintext passwords in Sanity.

### Phase 4: Product Display — Carousels and Modal

**Rationale:** With the auth gate proven, the menu UI can be built safely. This phase delivers the core visible product — the browsing experience.
**Delivers:** `StrainCarousel` component, `ProductCard` component (name, strain badge, price, THC/CBD%), `ProductModal` component (full description, effects), menu page Server Component wiring three carousels to GROQ query results, dark Weedmaps-aesthetic theme applied. Mobile touch scroll and empty carousel hide behavior included.
**Avoids:** App Router stale caching (set `revalidate: 60` on product fetch), client-side Sanity fetch anti-pattern (keep product fetch in Server Component), empty carousel showing with no products.

### Phase 5: Polish, Legal Compliance, and Launch Readiness

**Rationale:** Visual polish (skeleton states, effects chips, potency badges) and legal compliance (age gate, disclaimers) are distinct from core functionality. Decouple them to avoid scope creep in earlier phases. Legal compliance must be verified before public launch — not treated as optional.
**Delivers:** Skeleton loading states, effects chips on product cards, THC% potency badge, age gate before content visible to unauthenticated users, jurisdiction disclaimer, "display only" label, minimal privacy policy. Final QA against the "looks done but isn't" checklist from PITFALLS.md.
**Avoids:** Cannabis legal compliance pitfall (age gate + disclaimers required at launch, not deferred).

### Phase Ordering Rationale

- Phase 1 before everything: Vercel + Sanity connectivity is a prerequisite — no code works without project IDs and tokens.
- Phase 2 before Phase 3: `siteUser` schema must exist before NextAuth can be configured to read from it.
- Phase 3 before Phase 4: The feature dependency graph in FEATURES.md and the ARCHITECTURE.md build order both state this explicitly. Auth gate retrofitted onto existing UI creates security gaps.
- Phase 5 last: Polish and legal review are iterative improvements on a working product. Age gate and disclaimers are launch blockers but not build blockers.

### Research Flags

Phases likely needing deeper research during planning:
- **Phase 3 (Auth):** Auth.js v5 was in beta at training cutoff (Aug 2025). GA status, export patterns, and session callback signature must be verified against https://authjs.dev before implementation. The credentials provider pattern with Sanity as the user store is documented but not a first-class example in the official docs.
- **Phase 5 (Legal):** Cannabis digital menu labeling requirements vary by state. Client's specific jurisdiction (state DCC/MED rules) needs to be confirmed with the client before copy is finalized.

Phases with standard patterns (skip research-phase):
- **Phase 1 (Setup):** Next.js 15 scaffold + Sanity project creation + Vercel deployment is well-documented with zero ambiguity.
- **Phase 2 (Schemas):** Sanity v3 schema definition is highly documented. GROQ syntax is stable. No research needed.
- **Phase 4 (Product Display):** Tailwind + shadcn/ui + Embla Carousel patterns are standard and well-documented.

---

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | MEDIUM | Core stack (Next.js 15, Sanity v3, Tailwind, Vercel) is HIGH confidence. Auth.js v5 GA status was unconfirmed at Aug 2025 training cutoff — verify at https://authjs.dev before starting Phase 3. |
| Features | MEDIUM | Based on analysis of Weedmaps/Leafly/Dutchie patterns — no live verification available. Feature set is stable industry standard; patterns are well-understood. |
| Architecture | MEDIUM | Next.js App Router + Sanity patterns are well-documented. NextAuth v5 App Router integration patterns were in beta at cutoff — verify export patterns. |
| Pitfalls | MEDIUM-HIGH | Pitfalls are concrete and reproducible (CORS, env vars, image URL handling, JWT stale state). Prevention strategies are tested patterns. |

**Overall confidence:** MEDIUM

### Gaps to Address

- **Auth.js v5 GA status:** Was in beta at Aug 2025 training cutoff. Before starting Phase 3, verify: (1) Is v5 GA? (2) Has the export pattern changed (`auth()` from `./auth.ts`)? (3) Does the `session` callback signature match expected patterns? Source: https://authjs.dev
- **next-sanity version:** Verify current major version before install — the `sanityFetch` and `LiveQuery` APIs shifted between major versions. Source: https://www.npmjs.com/package/next-sanity
- **Tailwind v4 stability:** If v4 is stable by implementation time, evaluate whether to adopt it. v3.4 is the safe default. Source: https://tailwindcss.com/blog
- **Client's jurisdiction for cannabis compliance:** State-specific labeling rules for THC/CBD% display must be confirmed with the client before finalizating product card design.
- **JWT maxAge vs. session callback re-fetch decision:** The tradeoff between simplicity (24h JWT maxAge, stale approval status acceptable) vs. real-time revocation (Sanity query on every session check) must be decided with the client before auth is built.

---

## Sources

### Primary (HIGH confidence)
- Next.js 15 App Router documentation — RSC patterns, middleware, project structure
- Sanity v3 documentation — schema types, GROQ syntax, embedded Studio, image CDN
- Tailwind CSS v3.4 documentation — utility classes, dark mode via class strategy
- shadcn/ui documentation — Dialog, Button, dark theme
- Embla Carousel v8 documentation — horizontal scroll, touch support

### Secondary (MEDIUM confidence)
- Auth.js v5 (next-auth) documentation at Aug 2025 training cutoff — Credentials provider, JWT session, middleware integration
- next-sanity v9 documentation — `sanityFetch`, embedded Studio integration
- Weedmaps, Leafly, Dutchie feature analysis — industry UX patterns, product card fields, access models

### Tertiary (LOW confidence — verify before implementation)
- Auth.js v5 GA release status — was beta at cutoff; verify at https://authjs.dev
- Tailwind CSS v4 stability — was in active development at cutoff; verify at https://tailwindcss.com/blog
- State-specific cannabis digital menu labeling rules — jurisdiction-dependent; confirm with client

---
*Research completed: 2026-03-01*
*Ready for roadmap: yes*
