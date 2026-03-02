# Architecture Research

**Domain:** Gated dispensary product display — Next.js App Router + Sanity CMS
**Researched:** 2026-03-01
**Confidence:** MEDIUM — training data Aug 2025. Verify NextAuth v5 GA status and next-sanity version before implementation.

---

## System Overview

```
┌─────────────────────────────────────────────────────────────┐
│                      BROWSER / CLIENT                        │
│  ┌─────────────┐  ┌──────────────┐  ┌───────────────────┐  │
│  │  Auth UI    │  │  Menu Page   │  │  Sanity Studio    │  │
│  │ (sign-up /  │  │  (carousels) │  │  (owner: products │  │
│  │  sign-in)   │  │              │  │   + user approvals│  │
│  └──────┬──────┘  └──────┬───────┘  └─────────┬─────────┘  │
├─────────┴────────────────┴───────────────────── ┴───────────┤
│                   NEXT.JS SERVER (Vercel)                    │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  middleware.ts — auth + approval gate on /menu/**    │   │
│  └──────────────────────┬───────────────────────────────┘   │
│  ┌──────────────┐  ┌────┴──────────────┐  ┌─────────────┐  │
│  │  Auth Layer  │  │  Server Components │  │ /studio     │  │
│  │  (NextAuth)  │  │  (GROQ queries     │  │ (embedded   │  │
│  │  JWT session │  │   server-side)     │  │  Studio)    │  │
│  └──────┬───────┘  └────┬───────────────┘  └─────────────┘  │
└─────────┼───────────────┼─────────────────────────────────--┘
          │               │
┌─────────┴───────────────┴──────────────────────────────────┐
│                  SANITY CONTENT LAKE                         │
│  ┌───────────────────┐   ┌──────────────────────────────┐  │
│  │  product schema   │   │  siteUser schema              │  │
│  │  (name, strain,   │   │  (email, passwordHash,        │  │
│  │   price, THC%,    │   │   status: pending|approved    │  │
│  │   CBD%, desc,     │   │   |denied)                    │  │
│  │   effects, image) │   │                              │  │
│  └───────────────────┘   └──────────────────────────────┘  │
└────────────────────────────────────────────────────────────┘
```

---

## Component Responsibilities

| Component | Responsibility | Implementation |
|-----------|----------------|----------------|
| `middleware.ts` | Intercepts `/menu/**`; checks session + `status === 'approved'`; redirects otherwise | Next.js Middleware with `auth()` from NextAuth v5 |
| Auth Layer | Sign-up, sign-in, session; loads `status` from Sanity into JWT at sign-in | `next-auth` v5 Credentials provider backed by Sanity |
| Server Components (menu page) | GROQ queries at request time; passes typed Product[] to Client Components | `app/menu/page.tsx` — async Server Component |
| GROQ query layer | Typed wrappers around `@sanity/client` | `lib/sanity/client.ts` + `lib/sanity/queries.ts` |
| Sanity Studio (embedded) | Owner's UI for products + user approvals at `/studio` | `app/studio/[[...index]]/page.tsx` using `NextStudio` |
| Menu UI (Client Components) | Carousels, product cards, modal — pure display, no auth logic | `'use client'` components receiving typed props |
| Pending/Denied pages | Static pages for not-yet-approved or denied users | Simple Server Components at `/pending`, `/denied` |

---

## Recommended Project Structure

```
marcosweb/
├── app/
│   ├── (auth)/
│   │   ├── sign-in/page.tsx          # Sign-in form (Client Component)
│   │   └── sign-up/page.tsx          # Registration form (Client Component)
│   ├── (site)/
│   │   ├── layout.tsx                # Shared layout for site pages
│   │   ├── menu/page.tsx             # Server Component — GROQ fetch + carousel render
│   │   ├── pending/page.tsx          # Shown after sign-up, awaiting approval
│   │   └── denied/page.tsx           # Shown if owner denies account
│   ├── studio/
│   │   └── [[...index]]/page.tsx     # Embedded Sanity Studio (catch-all required)
│   ├── api/
│   │   └── auth/[...nextauth]/route.ts  # NextAuth route handler
│   └── layout.tsx                    # Root layout with SessionProvider
├── components/
│   ├── menu/
│   │   ├── StrainCarousel.tsx        # Horizontal scroll row for one strain
│   │   ├── ProductCard.tsx           # Name, strain badge, price, THC/CBD
│   │   └── ProductModal.tsx          # Full description + effects modal
│   └── ui/                           # shadcn/ui primitives (dialog, button, etc.)
├── lib/
│   ├── sanity/
│   │   ├── client.ts                 # createClient() — read-only for frontend
│   │   ├── queries.ts                # All GROQ queries as typed constants
│   │   └── types.ts                  # TypeScript types matching query projections
│   └── auth/
│       └── config.ts                 # NextAuth config: providers, callbacks, session
├── sanity/
│   ├── schemaTypes/
│   │   ├── product.ts                # Product document schema
│   │   └── siteUser.ts               # User document schema (status field)
│   ├── lib/client.ts                 # Studio-internal write client
│   └── sanity.config.ts             # Studio configuration
├── middleware.ts                     # Route protection — must be at project root
├── sanity.cli.ts                     # Sanity CLI config
├── auth.ts                           # NextAuth v5 exported auth() helper
└── next.config.ts
```

**Key rules:**
- `lib/sanity/` = read-only frontend client. Never cross-import with `sanity/`.
- `sanity/` = Studio config with write access. Never imported by app code.
- `middleware.ts` at project root (not inside `app/`) — Next.js requirement.
- `auth.ts` at root — NextAuth v5 pattern; exports `auth()` for middleware + Server Components.

---

## Auth + Approval Data Flow

```
Visitor submits sign-up form
    │
    ▼  (Server Action: hash password, write to Sanity)
siteUser document { status: 'pending' }
    │
    ▼
User sees /pending page
    │
    ▼  (Owner opens Sanity Studio)
Owner sets siteUser.status = 'approved'
    │
    ▼  (User signs in)
NextAuth credentials callback → GROQ userByEmailQuery
    → bcrypt verify → load status into JWT
    │
    ▼
middleware.ts reads JWT status
    → 'approved'  → pass through to /menu
    → 'pending'   → redirect /pending
    → 'denied'    → redirect /denied
```

**Important:** `status` is loaded into JWT at sign-in. If owner approves a pending user, that user must sign in (or their session must expire) for the change to take effect. Acceptable for v1 — avoids Sanity call on every request.

---

## Product Display Data Flow

```
Owner adds product in Sanity Studio
    │
    ▼
Sanity Content Lake (product document stored)
    │
    ▼  (GROQ query on request — server-side)
Next.js Server Component (MenuPage)
    │
    ▼  (typed Product[] as props)
StrainCarousel × 3 (Sativa, Hybrid, Indica)
    │
    ▼  (user clicks card)
ProductModal — full description + effects
```

---

## Sanity Schemas

### `product` Document

```typescript
export default {
  name: 'product',
  title: 'Product',
  type: 'document',
  fields: [
    { name: 'name',        type: 'string',  validation: (r) => r.required() },
    { name: 'strainType',  type: 'string',
      options: { list: ['Sativa', 'Hybrid', 'Indica'] },
      validation: (r) => r.required() },
    { name: 'price',       type: 'number',  validation: (r) => r.required().min(0) },
    { name: 'thcPercent',  type: 'number' },
    { name: 'cbdPercent',  type: 'number' },
    { name: 'description', type: 'text' },
    { name: 'effects',     type: 'array', of: [{ type: 'string' }] },
    { name: 'image',       type: 'image', options: { hotspot: true } },
  ],
}
```

### `siteUser` Document

```typescript
export default {
  name: 'siteUser',
  title: 'Site User',
  type: 'document',
  fields: [
    { name: 'email',        type: 'string', validation: (r) => r.required().email() },
    { name: 'passwordHash', type: 'string' },  // bcrypt hash — NEVER plaintext
    { name: 'status',       type: 'string',
      options: { list: ['pending', 'approved', 'denied'] },
      initialValue: 'pending',
      validation: (r) => r.required() },
    { name: 'name',         type: 'string' },
  ],
  preview: { select: { title: 'email', subtitle: 'status' } },
}
```

---

## Key Architectural Patterns

### Middleware Auth Gate
```typescript
// middleware.ts
import { auth } from '@/auth'
import { NextResponse } from 'next/server'

export default auth((req) => {
  if (!req.nextUrl.pathname.startsWith('/menu')) return NextResponse.next()
  if (!req.auth) return NextResponse.redirect(new URL('/sign-in', req.url))
  if (req.auth.user.status === 'pending') return NextResponse.redirect(new URL('/pending', req.url))
  if (req.auth.user.status === 'denied') return NextResponse.redirect(new URL('/denied', req.url))
  return NextResponse.next()
})
export const config = { matcher: ['/menu/:path*'] }
```

### GROQ Queries Module
```typescript
// lib/sanity/queries.ts
export const productsQuery = groq`
  *[_type == "product"] | order(name asc) {
    _id, name, strainType, price, thcPercent, cbdPercent,
    description, effects,
    "image": image.asset->{ url, metadata }
  }
`
export const userByEmailQuery = groq`
  *[_type == "siteUser" && email == $email][0] { _id, email, status }
`
```

---

## Build Order

```
1. Sanity project setup + schemas (product + siteUser)
   — prerequisite for everything

2. Sanity client + GROQ queries (lib/sanity/)
   — depends on schemas

3. TypeScript types (lib/sanity/types.ts)
   — depends on query projections

4. Auth layer (NextAuth config + Sanity credentials provider)
   — depends on siteUser schema + Sanity client

5. Middleware (route protection)
   — depends on auth exporting session with status in JWT

6. Menu UI components (StrainCarousel, ProductCard, ProductModal)
   — depends on TypeScript Product type

7. Menu page (Server Component wiring GROQ + UI)
   — depends on steps 2, 5, 6

8. Embedded Sanity Studio route (/studio)
   — can be set up in parallel with steps 3-7
```

**CRITICAL:** Build and test auth gate (steps 4-5) before building menu UI (steps 6-7). Never retrofit auth onto a working unprotected page.

---

## Anti-Patterns to Avoid

| Anti-Pattern | Do This Instead |
|-------------|-----------------|
| Client-side Sanity fetch (`useEffect`) | Async Server Component calling `sanityFetch()` directly |
| Auth check only in Server Component (no middleware) | `middleware.ts` as single enforced gate |
| Database adapter (Prisma) for user management | `siteUser` documents in Sanity; owner approves in Studio |
| Write token in frontend `lib/sanity/client.ts` | Two clients: read-only frontend, write-only Studio |
| Inline GROQ strings in components | All GROQ in `lib/sanity/queries.ts` with `groq` tag |

---
*Architecture research for: Pure Pressure Next.js + Sanity CMS gated dispensary display site*
*Researched: 2026-03-01*
