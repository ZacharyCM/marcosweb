# Requirements: Pure Pressure

**Defined:** 2026-03-01
**Core Value:** Approved customers can browse the full product menu by strain type, seeing pricing, potency, and descriptions — giving the dispensary a professional digital presence without any e-commerce complexity.

---

## v1 Requirements

### Authentication & Access

- [x] **AUTH-01**: User can register for an account with email and password
- [x] **AUTH-02**: User sees a "pending approval" page after registration — cannot access menu until owner approves
- [x] **AUTH-03**: User can log in with email and password
- [x] **AUTH-04**: User session persists across browser refresh (user stays logged in)
- [x] **AUTH-05**: Owner can view all pending accounts in Sanity Studio and mark each as approved or denied
- [x] **AUTH-06**: Denied user sees a clear "your access was not approved" message instead of being looped back to the login form

### Products (Sanity CMS)

- [x] **PROD-01**: Owner can add new products via Sanity Studio (name, strain type, price, THC%, CBD%, description, effects, images/videos)
- [x] **PROD-02**: Owner can edit existing product details via Sanity Studio
- [x] **PROD-03**: Owner can delete products via Sanity Studio
- [x] **PROD-04**: Owner can upload multiple images and/or videos to a single product — these appear as a browsable gallery in the product detail modal

### Menu Display

- [x] **MENU-01**: Approved user sees three horizontal carousels on the menu page — one each for Sativa, Hybrid, and Indica
- [x] **MENU-02**: Each product card displays name, strain type badge, price, THC%, and CBD%
- [x] **MENU-03**: Each product card displays the product's primary image
- [ ] **MENU-04**: Clicking a product card opens a detail modal with full description and effects
- [ ] **MENU-05**: Product detail modal contains a media gallery — user can browse through all images and videos the owner uploaded for that product
- [x] **MENU-06**: A strain carousel section is hidden entirely if no products exist for that strain type

### Legal & Compliance

- [x] **LEGAL-01**: Age gate shown to unauthenticated visitors before any dispensary content is visible
- [x] **LEGAL-02**: Jurisdiction disclaimer visible on public-facing pages ("For adults 21+ only. For use where legal.")
- [x] **LEGAL-03**: Minimal privacy policy page covering what data is collected (email, account info), why, and retention

### Infrastructure

- [x] **INFRA-01**: Site deployed and live on Vercel
- [x] **INFRA-02**: Sanity Studio embedded at `/studio` — owner accesses from the live site URL

---

## v2 Requirements

### Menu Polish

- **MPOL-01**: Effects chips displayed on product cards (e.g., "Relaxing", "Euphoric") — lets users self-select strain without opening modal
- **MPOL-02**: THC% potency tier badge on product cards — color-coded (low / mid / high) for quick visual scanning
- **MPOL-03**: Skeleton loading states on carousels while Sanity product data loads

### Legal

- **LEGAL-04**: "Display only — not an online store" label in footer or menu header

### CMS Features

- **CMS-01**: Sanity-powered "featured product" banner above carousels — owner can spotlight a product without developer involvement

---

## Out of Scope

| Feature | Reason |
|---------|--------|
| Cart / checkout / payments | Display-only site — no transactions by client decision |
| Product search / filtering | Strain carousels are sufficient navigation for this catalog size; defer if catalog exceeds ~50 items |
| Email notifications on account approval | Requires email infrastructure; owner communicates with customer directly |
| Real-time inventory sync | Requires POS integration (Dutchie, Flowhub, etc.) — significant project |
| Product ratings / reviews | Adds moderation complexity and legal liability |
| Public menu (unauthenticated browsing) | Defeats the gated access model client requested |
| Mobile native app | Web-first; mobile via responsive browser |
| Social sharing | Cannabis advertising restrictions on social platforms |
| Multi-location / multi-dispensary | Premature complexity; single-tenant for v1 |

---

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| AUTH-01 | Phase 3 | Complete |
| AUTH-02 | Phase 3 | Complete |
| AUTH-03 | Phase 3 | Complete |
| AUTH-04 | Phase 3 | Complete |
| AUTH-05 | Phase 3 | Complete |
| AUTH-06 | Phase 3 | Complete |
| PROD-01 | Phase 2 | Complete |
| PROD-02 | Phase 2 | Complete |
| PROD-03 | Phase 2 | Complete |
| PROD-04 | Phase 2 | Complete |
| MENU-01 | Phase 4 | Complete |
| MENU-02 | Phase 4 | Complete |
| MENU-03 | Phase 4 | Complete |
| MENU-04 | Phase 4 | Pending |
| MENU-05 | Phase 4 | Pending |
| MENU-06 | Phase 4 | Complete |
| LEGAL-01 | Phase 4 | Complete |
| LEGAL-02 | Phase 4 | Complete |
| LEGAL-03 | Phase 4 | Complete |
| INFRA-01 | Phase 1 | Complete |
| INFRA-02 | Phase 1 | Complete |

**Coverage:**
- v1 requirements: 21 total
- Mapped to phases: 21
- Unmapped: 0 ✓

---
*Requirements defined: 2026-03-01*
*Last updated: 2026-03-02 after plan 04-02 completion (MENU-01, MENU-02, MENU-03, MENU-06 marked complete — carousel layout, StrainCarousel, ProductCard with all required fields)*
