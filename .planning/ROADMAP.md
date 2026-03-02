# Roadmap: Pure Pressure

## Overview

Four phases, each delivering one coherent capability that the next phase depends on. The mandatory build order — infrastructure first, then Sanity schemas, then auth gate, then product display — is enforced by real dependency: nothing downstream can be built or tested until the layer beneath it exists. Legal compliance ships with the product display phase because it is a launch blocker, not an afterthought.

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

- [x] **Phase 1: Setup** - Next.js 15 project and Sanity project wired together and deployed on Vercel
- [ ] **Phase 2: Data Layer** - Sanity schemas, GROQ queries, TypeScript types, and embedded Studio route
- [ ] **Phase 3: Auth Gate** - Registration, login, approval flow, middleware — fully hardened before any menu UI
- [ ] **Phase 4: Product Display** - Netflix-style carousels, product cards, detail modal, dark theme, legal compliance

## Phase Details

### Phase 1: Setup
**Goal**: The development environment and production deployment are fully operational — no Sanity query or auth call can fail due to missing configuration
**Depends on**: Nothing (first phase)
**Requirements**: INFRA-01, INFRA-02
**Success Criteria** (what must be TRUE):
  1. Running `npm run dev` starts the app without errors and the home page renders at localhost:3000
  2. The Sanity Studio is accessible at `/studio` in the running app
  3. The site deploys to Vercel and the live URL loads without errors
  4. Sanity CORS origins include localhost and the Vercel domain — a GROQ query run from the deployed URL returns data without a CORS error
  5. Environment variables (SANITY project ID, dataset, API token, NEXTAUTH_SECRET) are present in both local `.env.local` and Vercel project settings, and `.env.example` documents all required keys
**Plans**: 2 plans

Plans:
- [x] 01-01-PLAN.md — Scaffold Next.js 15 project with embedded Sanity Studio, Tailwind v4, Sanity client, and env files
- [x] 01-02-PLAN.md — Deploy to Vercel, configure Sanity CORS origins, verify production stack

### Phase 2: Data Layer
**Goal**: All Sanity document schemas are defined, the typed GROQ query library is complete, and the owner can create/edit/delete products in Sanity Studio
**Depends on**: Phase 1
**Requirements**: PROD-01, PROD-02, PROD-03, PROD-04
**Success Criteria** (what must be TRUE):
  1. Owner can log into Sanity Studio and create a product with name, strain type, price, THC%, CBD%, description, effects, and at least one image/video — the document saves without error
  2. Owner can edit an existing product's fields and delete a product from Sanity Studio
  3. A GROQ query run against the Sanity dataset returns products with resolved image URLs (not raw asset reference objects)
  4. TypeScript types for Product and SiteUser match the Sanity schema fields — the project compiles with zero type errors
**Plans**: TBD

Plans:

### Phase 3: Auth Gate
**Goal**: Users can register, log in, and be approved/denied — and the middleware blocks all unauthenticated or non-approved users from accessing `/menu/**` with no bypass possible
**Depends on**: Phase 2
**Requirements**: AUTH-01, AUTH-02, AUTH-03, AUTH-04, AUTH-05, AUTH-06
**Success Criteria** (what must be TRUE):
  1. A new visitor can submit the registration form and is redirected to a "pending approval" page — they cannot access the menu
  2. Attempting to navigate directly to `/menu` without being logged in redirects to the login page
  3. An approved user can log in with email and password, reach the menu page, refresh the browser, and remain logged in
  4. The owner can open Sanity Studio, view pending accounts, and mark one as approved or denied — the status change is reflected in Sanity
  5. A denied user who attempts to log in sees a clear "your access was not approved" message and is not sent to the login form in a loop
**Plans**: TBD

Plans:

### Phase 4: Product Display
**Goal**: An approved user can browse the full dispensary menu by strain type, open any product for full detail, and the site meets all legal compliance requirements for public launch
**Depends on**: Phase 3
**Requirements**: MENU-01, MENU-02, MENU-03, MENU-04, MENU-05, MENU-06, LEGAL-01, LEGAL-02, LEGAL-03
**Success Criteria** (what must be TRUE):
  1. An approved logged-in user sees the menu page with three horizontal carousels labeled Sativa, Hybrid, and Indica — each carousel contains only the products of that strain type
  2. Each product card shows the product's primary image, name, strain badge, price, THC%, and CBD%
  3. Clicking a product card opens a modal showing the full description, effects, and a browsable media gallery of all images and videos the owner uploaded for that product
  4. A strain carousel section is not rendered at all when no products of that strain type exist
  5. An unauthenticated visitor to the site sees an age gate before any dispensary content is visible, and a jurisdiction disclaimer ("For adults 21+ only. For use where legal.") is present on public-facing pages
  6. A minimal privacy policy page is accessible explaining what data is collected, why, and how long it is retained
**Plans**: TBD

Plans:

## Progress

**Execution Order:**
Phases execute in numeric order: 1 → 2 → 3 → 4

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Setup | 2/2 | Complete | 2026-03-01 |
| 2. Data Layer | 0/TBD | Not started | - |
| 3. Auth Gate | 0/TBD | Not started | - |
| 4. Product Display | 0/TBD | Not started | - |
