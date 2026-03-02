# Feature Research

**Domain:** Cannabis dispensary product display / menu website
**Researched:** 2026-03-01
**Confidence:** MEDIUM — based on analysis of Weedmaps, Leafly, Dutchie patterns. No live web verification available. Patterns are stable and well-documented.

---

## Feature Landscape

### Table Stakes (Users Expect These)

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| Gated access | Cannabis sites universally gate access — regulatory expectation | MEDIUM | This project: account creation + owner approval before menu visible. Two layers. |
| Product cards with name, strain type, price, THC% | Every Weedmaps/Leafly/Dutchie listing shows these — users arrive expecting this exact data shape | LOW | Must be scannable at small card size |
| Strain category organization (Sativa / Hybrid / Indica) | Industry de facto taxonomy — customers mentally organize this way | LOW | Three-category split is industry standard |
| Product detail view (full description, effects) | Customers need expanded info — stub card alone doesn't satisfy intent | MEDIUM | Modal pattern keeps user on menu page |
| Dark color scheme | Weedmaps-style dark UI is the industry visual norm | LOW | Client requirement aligns with market expectation |
| Session persistence | Users expect to stay logged in across sessions | LOW | Standard cookie behavior |
| Clear "pending approval" state | When not yet approved, users need explicit message — silence reads as bug | LOW | Dedicated pending screen prevents support requests |
| Mobile-responsive layout | 60%+ of cannabis shoppers browse mobile | MEDIUM | Horizontal carousels need swipe affordances |
| Product images | Visual shopping expected — text-only cards read as unfinished | LOW-MEDIUM | Sanity image pipeline handles this well |

---

### Differentiators (Competitive Advantage)

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| Netflix-style horizontal carousels per strain | Familiar interaction model, visually separates categories. Creates "browsing" experience | MEDIUM | Visible card overflow signals scrollability. Arrow buttons on desktop. |
| Smooth modal transitions | Polished open/close animation distinguishes from generic CMS templates | LOW | 200–300ms CSS transitions |
| Owner-approval account model | Exclusivity signal — feels like a private member experience | LOW | Already in scope. Language: "Request access" > "Create account" |
| Effects chips / tags on product cards | Lets customers self-select without opening modal | LOW | Additive to basic card; can ship after core |
| Potency visual indicator (THC% badge/tier) | Color-coded tier helps visual scanners identify potency immediately | LOW | Green/yellow/red tiers or mini progress bar |
| Skeleton loading states | Professional look while Sanity data loads | LOW | Tailwind CSS skeletons |

---

### Anti-Features (Deliberately NOT Building)

| Feature | Why Requested | Why Problematic | Alternative |
|---------|---------------|-----------------|-------------|
| Cart / checkout | Customers ask naturally | Payment compliance, cannabis e-commerce legal complexity. Client explicitly does not want transactions | "Visit in-store" CTA on product modal |
| Search / filtering | Power users want THC/price filters | Significant frontend state complexity; carousels by strain type are sufficient for this catalog size | Defer to v2 if catalog exceeds ~50 items |
| Email notifications on approval | "Notify me when approved" | Requires email infrastructure (Resend, etc.); increases maintenance burden | Owner communicates with customer directly |
| Product ratings / reviews | Users expect from Weedmaps/Leafly | Adds UGC moderation, review data model, potential legal liability | Owner writes curated descriptions via Sanity |
| Real-time inventory sync | "Is this in stock?" | Requires POS integration (Dutchie, Flowhub) — significant project | Owner manually updates Sanity when unavailable |
| Public (unauthenticated) menu | "Let guests browse" | Defeats the gated access model client requested | Show compelling registration page to guests |
| Social sharing | "Share on Instagram" | Cannabis advertising restrictions on social platforms; legal risk | Keep sharing off; focus on in-person experience |

---

## Feature Dependencies

```
[Account Registration Form]
    └──requires──> [Pending State UI]
                       └──requires──> [Sanity siteUser Schema]
                                          └──requires──> [Sanity Studio approval workflow]

[Menu Page - Carousels]
    └──requires──> [Auth Guard (approved users only)]
                       └──requires──> [Registration Form]
                       └──requires──> [Login Form]

[Product Detail Modal]
    └──requires──> [Product Card]
                       └──requires──> [Sanity Product Schema]
                       └──requires──> [Menu Page - Carousels]

[Product Card]
    └──requires──> [Sanity Product Schema]
    └──requires──> [Product Images in Sanity]

[Owner Approval Workflow]
    └──requires──> [Sanity siteUser Document Type]
    └──requires──> [Sanity Studio access for owner]
```

**Critical dependency:** Auth gate must be working before building the menu UI. Do not build carousels on an unprotected route and plan to "add auth later."

---

## MVP Definition

### v1 (Launch With)

- [ ] Registration form with "pending approval" state
- [ ] Login form with session persistence
- [ ] Sanity schema: siteUser document with status field
- [ ] Sanity Studio: owner can view pending users and mark approved/denied
- [ ] Sanity schema: Product document (name, strain, price, THC%, CBD%, description, effects, image)
- [ ] Menu page: three horizontal carousels (Sativa, Hybrid, Indica)
- [ ] Product card: name, strain badge, price, THC/CBD%
- [ ] Product detail modal: full description, effects, all fields
- [ ] Auth guard on menu page (redirect unauthenticated/pending users)
- [ ] Dark UI theme (Weedmaps aesthetic)
- [ ] Vercel deployment

### v1.x (Add After Validation)

- [ ] Effects chips on product cards
- [ ] Potency visual indicator (THC% tier badge)
- [ ] Skeleton loading states
- [ ] Mobile carousel swipe affordances refinement

### v2+ (Future)

- [ ] Product search / filtering (when catalog exceeds ~50 items)
- [ ] Contact / hours page
- [ ] Availability status toggle

---

## Competitor Feature Analysis

| Feature | Weedmaps | Leafly | Dutchie | Pure Pressure |
|---------|----------|--------|---------|---------------|
| Product browsing | Category tabs + grid | Strain filter + grid | Category tabs + grid | Horizontal carousels per strain |
| Product card fields | Name, price, THC%, image, brand | Name, price, THC%, image, strain | Name, price, THC%, image | Name, strain, price, THC%, image |
| Product detail | Full page | Modal overlay | Modal overlay | Modal overlay |
| Access model | Public | Public | Public | Account-approval gated |
| Dark UI | Yes | No | Varies | Yes |
| CMS | Weedmaps dashboard | Leafly dashboard | Dutchie POS | Sanity Studio |
| E-commerce | Full ordering | Menu + ordering | Full checkout | Display only |

**Takeaway:** Pure Pressure differentiates on access model (private/gated) and visual format (carousels vs grids). Does not compete on ordering.

---

## UX Pattern Notes

### Auth / Gating UX
- **Language:** "Request access" frames gating as exclusive. "Create account" undersells the approval step.
- **Pending state:** Dedicated screen with clear "Your account is pending owner approval" copy. Do not redirect pending users to login.
- **Denied accounts:** Show "Your access request was not approved. Contact the dispensary." Avoid login loop.

### Product Card Design
- Information hierarchy: Name → Strain badge (color-coded) → THC% → Price → Effects chips
- Card width: 280–320px in carousel
- Image aspect ratio: Square (1:1) or 4:3. Avoid portrait.
- Hover state: Subtle card lift (box-shadow + translate-y) signals interactivity

### Carousel UX
- Visible overflow: Show partial next card to signal scrollability ("peeking" pattern)
- Arrow buttons on desktop: overlay on carousel edges
- CSS `scroll-snap-type: x mandatory` + `scroll-snap-align: start` for polished feel
- Empty carousel: hide section entirely if strain has no products

### Modal Patterns
- Dark overlay: `rgba(0,0,0,0.7)` — never white overlay on dark UI
- Close affordances: X button + clicking outside overlay
- Keyboard: ESC closes, tab focus trapped inside
- Body scroll lock when modal is open
- Animation: fade-in + scale(0.95→1) over 200ms

---
*Feature research for: Pure Pressure cannabis dispensary display website*
*Researched: 2026-03-01*
