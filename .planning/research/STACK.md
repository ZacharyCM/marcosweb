# Stack Research

**Domain:** Cannabis dispensary product display website (Next.js + Sanity CMS)
**Researched:** 2026-03-01
**Confidence:** MEDIUM — based on training knowledge (cutoff Aug 2025). Verify current versions before implementation.

---

## Recommended Stack

### Core Framework

| Library | Version | Rationale | Confidence |
|---------|---------|-----------|------------|
| Next.js | ^15.x | App Router, React Server Components, Middleware for auth gating, Vercel-native | HIGH |
| TypeScript | ^5.x | Client requirement; type safety essential for Sanity query projections | HIGH |
| React | ^19.x | Ships with Next.js 15 | HIGH |

**Decision:** Use App Router (not Pages Router). RSC = no client-side Sanity queries, better performance.

---

### CMS

| Library | Version | Rationale | Confidence |
|---------|---------|-----------|------------|
| `@sanity/client` | ^6.x | Official Sanity JS client; GROQ queries | HIGH |
| `next-sanity` | ^9.x | Next.js integration — `sanityFetch`, embedded Studio, live preview support | MEDIUM |
| `@sanity/image-url` | ^1.x | Required to convert Sanity image references to CDN URLs | HIGH |
| Sanity Studio | v3 | Embedded at `/studio` — owner manages products and user approvals here | HIGH |

**Decision:** Sanity v3 + embedded Studio in the same Next.js repo. Owner accesses `/studio` on the live site.

---

### Authentication

| Library | Version | Rationale | Confidence |
|---------|---------|-----------|------------|
| `next-auth` (Auth.js v5) | `^5.0` (was beta at cutoff) | App Router native; JWT sessions; Credentials provider for Sanity-backed auth | MEDIUM |

**Decision:** JWT session strategy — no database adapter. Approval status stored as `status` field on Sanity `siteUser` document, loaded into JWT at sign-in. Owner approves in Sanity Studio.

**NOT:** next-auth v4 (Pages Router patterns), Prisma/database adapter (adds infrastructure the client doesn't need), Clerk (paid, overkill for this use case).

**Verify:** Auth.js v5 GA status at https://authjs.dev before implementing.

---

### UI / Styling

| Library | Version | Rationale | Confidence |
|---------|---------|-----------|------------|
| Tailwind CSS | ^3.4 (or v4 if stable) | Dark theme via CSS variables, utility-first, zero-runtime | HIGH for v3.4 |
| shadcn/ui | latest | Copy-on-install components — Dialog (modal), Button; dark theme built-in | HIGH |
| Embla Carousel | ^8.x | The carousel library used by shadcn/ui; lightweight, no deps, touch scroll | HIGH |

**Decision:** shadcn/ui + Embla for carousels. Dark theme via `class="dark"` on `<html>`. Color palette: deep blacks (#0a0a0a, #111), muted greens (Weedmaps-style), white text.

**NOT:** react-slick (CSS conflicts, old), MUI/Chakra (RSC incompatible), swiper.js (overkill).

---

### Deployment

| Service | Rationale | Confidence |
|---------|-----------|------------|
| Vercel | Client requirement; zero-config Next.js deploy; preview URLs; env var management | HIGH |

---

## What NOT to Use

| Library | Reason |
|---------|--------|
| `next-auth` v4 | Pages Router API; incompatible with App Router session patterns |
| Prisma + PostgreSQL | Adds database infrastructure just for user management; Sanity handles it |
| MUI / Chakra UI | Not RSC-compatible; bloated for this use case |
| react-slick / slick-carousel | Requires jQuery-era CSS, poor TypeScript support |
| Sanity v2 | End-of-life; Studio v3 is the current standard |
| SWR / React Query (for products) | Unnecessary — Server Components fetch directly |
| Pages Router | No App Router features; Vercel favors App Router |
| `NEXT_PUBLIC_SANITY_API_TOKEN` | Never expose write token client-side |

---

## Environment Variables Required

```bash
# Sanity (public — baked into client bundle at build)
NEXT_PUBLIC_SANITY_PROJECT_ID=
NEXT_PUBLIC_SANITY_DATASET=production

# Sanity (server-only — never NEXT_PUBLIC_)
SANITY_API_READ_TOKEN=

# Auth
NEXTAUTH_SECRET=        # openssl rand -base64 32
NEXTAUTH_URL=https://yourdomain.com

# Vercel auto-populates VERCEL_URL for preview deployments
```

---

## Version Verification Checklist

Before starting implementation, verify:
- [ ] `next-auth@5` GA status (was beta at Aug 2025 cutoff) — https://authjs.dev
- [ ] `next-sanity` current major version — https://www.npmjs.com/package/next-sanity
- [ ] Tailwind v4 stability — https://tailwindcss.com/blog
- [ ] Embla Carousel current version — https://www.embla-carousel.com

---
*Stack research for: Pure Pressure cannabis dispensary display website*
*Researched: 2026-03-01*
