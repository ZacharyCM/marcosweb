# Pure Pressure

## What This Is

Pure Pressure is a cannabis dispensary product display website for a client's retail menu. Visitors must create an account and receive owner approval before accessing the menu. The site displays products organized by strain type (Sativa, Hybrid, Indica) in Netflix-style horizontal carousels — no checkout or payment processing involved.

## Core Value

Approved customers can browse the full product menu by strain type, seeing pricing, potency, and descriptions — giving the dispensary a professional digital presence without any e-commerce complexity.

## Requirements

### Validated

(None yet — ship to validate)

### Active

- [ ] Visitor can create an account (pending approval until owner approves)
- [ ] Owner can approve/deny pending accounts via Sanity Studio
- [ ] Approved user can log in and access the product menu
- [ ] Menu displays three horizontal carousels: Sativa, Hybrid, Indica
- [ ] Each product card shows name, strain type, price, and THC/CBD %
- [ ] Clicking a product card opens a modal with full description and effects
- [ ] Owner/client can add new products via Sanity Studio
- [ ] Owner/client can edit product details (name, price, THC%, description) via Sanity Studio
- [ ] Owner/client can delete products via Sanity Studio
- [ ] Dark color scheme consistent with Weedmaps aesthetic
- [ ] Site is hosted on Vercel

### Out of Scope

- Checkout / cart / payment processing — display-only site, no transactions
- Mobile app — web only
- Notifications to customers — no email/push alerts
- Product search or filtering — carousels by strain type is sufficient for v1
- Order history — no purchases occur

## Context

- Greenfield project — only the GSD tooling exists in this repo currently
- Client (dispensary owner) manages all content through Sanity Studio (no code required)
- Account approval is managed through Sanity Studio, keeping the owner's workflow in one place
- No real-money transactions — avoids payment compliance complexity
- Target users are dispensary customers browsing what's currently in stock

## Constraints

- **CMS**: Sanity — client requirement, headless CMS for all product data
- **Frontend Language**: TypeScript — type safety for maintainability
- **Hosting**: Vercel — client requirement
- **No Payments**: Site is display-only; no checkout flow at any point
- **Auth Model**: Account creation is gated — new signups stay pending until owner approves in Sanity

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Sanity as CMS | Client needs non-technical content management for products | — Pending |
| Account approval via Sanity Studio | Keeps owner's workflow centralized in one tool | — Pending |
| Modal for product detail | Keeps user on menu page, faster UX than navigating away | — Pending |
| Netflix-style horizontal carousels per strain | Familiar UI pattern, visually separates strain categories | — Pending |

---
*Last updated: 2026-03-01 after initialization*
