# Phase 4: Product Display - Research

**Researched:** 2026-03-02
**Domain:** React/Next.js 16 UI components — horizontal scroll carousels, modal dialog, Sanity image rendering, age gate cookie, legal compliance
**Confidence:** HIGH

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| MENU-01 | Approved user sees three horizontal carousels on the menu page — one each for Sativa, Hybrid, and Indica | CSS scroll-snap carousel pattern + GROQ queries by strainType (queries already written in Phase 2) |
| MENU-02 | Each product card displays name, strain type badge, price, THC%, and CBD% | Tailwind utility classes + product schema already has all these fields |
| MENU-03 | Each product card displays the product's primary image | `urlFor` from `@sanity/image-url` (already wired in image.ts) + Next.js `<Image>` with loader |
| MENU-04 | Clicking a product card opens a detail modal with full description and effects | Native HTML `<dialog>` element with `showModal()` — no additional library required |
| MENU-05 | Product detail modal contains a media gallery — user can browse all images and videos | Array of `_type === 'image'` and `_type === 'file'` items from Sanity media[] field — render with conditional `<Image>` or `<video>` |
| MENU-06 | A strain carousel section is hidden entirely if no products exist for that strain type | Conditional render: `{products.length > 0 && <StrainCarousel .../>}` — GROQ `PRODUCTS_BY_STRAIN_QUERY` returns empty array for missing strain types |
| LEGAL-01 | Age gate shown to unauthenticated visitors before any dispensary content is visible | Cookie set from client Server Action; proxy.ts reads `request.cookies.get('age-verified')` and redirects if missing |
| LEGAL-02 | Jurisdiction disclaimer visible on public-facing pages ("For adults 21+ only. For use where legal.") | Static text in a shared layout component or footer — no library needed |
| LEGAL-03 | Minimal privacy policy page covering what data is collected, why, and retention | New static route `/privacy` — server component with hardcoded content |
</phase_requirements>

---

## Summary

Phase 4 builds all user-facing UI on top of the auth gate and data layer already in place from Phases 2 and 3. The core work is three horizontal scroll carousels, a product detail modal, an age gate for public visitors, a jurisdiction disclaimer, and a minimal privacy policy page. Every piece of data Phase 4 needs is already defined: the Sanity `product` schema (PROD-01 through PROD-04), the GROQ queries (`PRODUCTS_BY_STRAIN_QUERY`, `PRODUCT_BY_ID_QUERY`), the `urlFor` image builder, and the `sanityFetch` / `SanityLive` fetching utilities.

The stack for this phase is entirely the project's existing technology: Next.js 16 App Router Server Components, Tailwind CSS v4 (scroll-snap utilities), the native HTML `<dialog>` element (no modal library), and `@sanity/image-url`. The project already has `@sanity/image-url` installed and a configured `urlFor` builder at `src/sanity/lib/image.ts`. No new dependencies are required for the menu UI. The age gate adds one new cookie — readable in `proxy.ts` using `request.cookies.get()`, writable from a Server Action using `(await cookies()).set()`.

A critical project-specific detail: Next.js 16 renamed `middleware.ts` to `proxy.ts`. The project already uses `proxy.ts`. Any docs or examples that reference `middleware.ts` must be mentally translated — the API is identical, just the filename and export name changed. The proxy currently only gates `/menu` routes; it must be extended to also redirect unauthenticated visitors who lack an age-verification cookie away from public routes.

**Primary recommendation:** Build all menu UI as React Server Components (fetch with `sanityFetch`), use CSS scroll-snap for carousels (no JS library), use native `<dialog>` for the product modal (no modal library), and store the age-gate confirmation in a 365-day cookie set via Server Action and read in `proxy.ts`.

---

## Standard Stack

### Core (already installed — no new installs needed for menu UI)

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| next | 16.1.6 | App Router, Server Components, Image optimization | Already in use; RSCs eliminate client state for data fetching |
| react | 19.2.3 | UI rendering | Already in use |
| next-sanity | ^11.6.12 | `sanityFetch`, `SanityLive`, `defineLive` | Already wired; live content updates without page reload |
| @sanity/image-url | ^1.2.0 | Build responsive CDN URLs from Sanity image references | Already installed and configured at `src/sanity/lib/image.ts` |
| tailwindcss | ^4 | Utility CSS — scroll-snap carousel, card layout, modal backdrop | Already in use; v4 provides `snap-x`, `snap-mandatory`, `snap-center`, `overflow-x-auto` |

### Supporting (already installed)

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| sanity | ^4.22.0 | GROQ `defineQuery`, schema, TypeGen | Already used for all queries in `src/sanity/lib/queries.ts` |
| next-auth | ^5.0.0-beta.30 | `auth()` session check in pages | Already wired; menu page already uses `session.user.status === "approved"` gate |

### NOT Needed — Avoid Installing

| Problem | Do Not Install | Why |
|---------|---------------|-----|
| Horizontal carousel | embla-carousel-react, swiper, keen-slider | CSS scroll-snap handles the use case; any library adds React 19 peer dep risk |
| Modal/dialog | @radix-ui/react-dialog, headlessui, react-modal | Native `<dialog>` element + `showModal()` is sufficient and has full browser support |
| Image handling | next-sanity-image | `urlFor().width().height().url()` with the Next.js `<Image>` `src` prop is simpler for this project's needs |

**Installation:** No new packages required for MENU-01 through MENU-06, LEGAL-02, LEGAL-03. All dependencies are already installed.

---

## Architecture Patterns

### Recommended File Structure for Phase 4

```
src/
├── app/
│   ├── (app)/
│   │   ├── menu/
│   │   │   ├── page.tsx              # RSC — fetch all 3 strains, render carousels
│   │   │   ├── strain-carousel.tsx   # RSC or client component — carousel row
│   │   │   ├── product-card.tsx      # Client component — card + modal trigger
│   │   │   └── product-modal.tsx     # Client component — <dialog> with gallery
│   │   └── layout.tsx                # (app) layout — add SanityLive here
│   ├── (public)/
│   │   ├── age-gate/
│   │   │   └── page.tsx              # Age gate — confirm age form + Server Action
│   │   └── privacy/
│   │       └── page.tsx              # Static privacy policy
│   ├── actions/
│   │   └── age-gate.ts               # 'use server' — set age-verified cookie
│   └── layout.tsx                    # Root layout (unchanged)
├── proxy.ts                          # Extend to check age-verified cookie
└── styles/
    └── globals.css                   # Add @utility no-scrollbar if needed
```

### Pattern 1: RSC Data Fetching for Strain Carousels

**What:** Fetch products by strain type in the menu page Server Component using `sanityFetch`, pass as props to carousel components. No `useState` or client-side fetch needed for data.
**When to use:** All data is known at request time and user is already authenticated.

```typescript
// Source: next-sanity defineLive pattern (https://github.com/sanity-io/next-sanity)
// src/app/(app)/menu/page.tsx
import { sanityFetch } from "@/sanity/lib/live"
import { PRODUCTS_BY_STRAIN_QUERY } from "@/sanity/lib/queries"
import { StrainCarousel } from "./strain-carousel"

const STRAIN_TYPES = ["sativa", "hybrid", "indica"] as const

export default async function MenuPage() {
  const [sativa, hybrid, indica] = await Promise.all(
    STRAIN_TYPES.map((strainType) =>
      sanityFetch({ query: PRODUCTS_BY_STRAIN_QUERY, params: { strainType } })
    )
  )

  return (
    <main>
      {sativa.data.length > 0 && (
        <StrainCarousel label="Sativa" products={sativa.data} />
      )}
      {hybrid.data.length > 0 && (
        <StrainCarousel label="Hybrid" products={hybrid.data} />
      )}
      {indica.data.length > 0 && (
        <StrainCarousel label="Indica" products={indica.data} />
      )}
    </main>
  )
}
```

### Pattern 2: CSS Scroll-Snap Horizontal Carousel (No JS Library)

**What:** Pure Tailwind v4 CSS — `overflow-x-auto snap-x snap-proximity` on the container, `snap-start flex-none` on each card. Scrollbar hidden with arbitrary Tailwind values.
**When to use:** Horizontal browsable list of fixed-width cards — exactly the strain carousel use case.

```typescript
// Source: Tailwind CSS docs (https://tailwindcss.com/docs/scroll-snap-type)
// src/app/(app)/menu/strain-carousel.tsx
export function StrainCarousel({ label, products }) {
  return (
    <section>
      <h2 className="text-xl font-semibold mb-4">{label}</h2>
      <div
        className="flex gap-4 overflow-x-auto snap-x snap-proximity pb-4
                   [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {products.map((product) => (
          <ProductCard key={product._id} product={product} />
        ))}
      </div>
    </section>
  )
}
```

### Pattern 3: Native `<dialog>` Product Modal

**What:** Client component that holds the `<dialog>` ref. A trigger button on `ProductCard` calls `dialogRef.current.showModal()`. Escape key close is built into the browser. Backdrop is styled with `::backdrop` pseudo-element via arbitrary Tailwind.
**When to use:** Any modal that does not need a URL-based route (intercepting routes would add complexity with no user-facing benefit here).

```typescript
// Source: MDN Web Docs — HTMLDialogElement, React 19 ref-as-prop
// src/app/(app)/menu/product-modal.tsx
"use client"
import { useRef, useEffect } from "react"

export function ProductModal({ product, isOpen, onClose }) {
  const dialogRef = useRef<HTMLDialogElement>(null)

  useEffect(() => {
    if (isOpen) {
      dialogRef.current?.showModal()
    } else {
      dialogRef.current?.close()
    }
  }, [isOpen])

  return (
    <dialog
      ref={dialogRef}
      onClose={onClose}
      className="w-full max-w-2xl rounded-xl p-6
                 backdrop:bg-black/60"
    >
      <h2>{product.name}</h2>
      {/* description, effects, media gallery */}
      <button onClick={onClose}>Close</button>
    </dialog>
  )
}
```

**Alternative pattern — ProductCard owns modal state:**

```typescript
// 'use client' ProductCard that opens the modal directly
"use client"
import { useState, useRef } from "react"

export function ProductCard({ product }) {
  const [open, setOpen] = useState(false)
  const dialogRef = useRef<HTMLDialogElement>(null)

  function handleOpen() {
    setOpen(true)
    dialogRef.current?.showModal()
  }
  function handleClose() {
    setOpen(false)
  }

  return (
    <>
      <button onClick={handleOpen} className="...">
        {/* card content */}
      </button>
      <dialog ref={dialogRef} onClose={handleClose} className="...">
        {/* modal content */}
      </dialog>
    </>
  )
}
```

The second pattern (modal co-located with card) is simpler — avoids lifting state and avoids prop drilling.

### Pattern 4: Sanity Image with `urlFor`

**What:** Use `urlFor(source).width(W).height(H).url()` as the `src` prop on `next/image`. The project already has `urlFor` wired at `src/sanity/lib/image.ts`. The Sanity CDN supports `auto=format` for WebP negotiation.
**When to use:** All product card thumbnails and modal gallery images.

```typescript
// Source: @sanity/image-url docs (https://www.sanity.io/docs/image-url)
// src/app/(app)/menu/product-card.tsx
import Image from "next/image"
import { urlFor } from "@/sanity/lib/image"

// Product card thumbnail — fixed 300×300 crop
<Image
  src={urlFor(product.primaryImage).width(300).height(300).auto("format").url()}
  alt={product.primaryImage.alt ?? product.name}
  width={300}
  height={300}
  className="object-cover rounded-lg"
/>
```

**Important:** `next/image` requires the Sanity CDN hostname to be configured in `next.config.ts`:

```typescript
// next.config.ts
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "cdn.sanity.io",
      },
    ],
  },
}
```

Check whether this config already exists before adding.

### Pattern 5: Age Gate Cookie via Server Action + Proxy Check

**What:** Public visitors land on `/age-gate`, click "I am 21+", a Server Action sets a 365-day `age-verified` cookie, and redirects to the site. `proxy.ts` reads `request.cookies.get('age-verified')` and redirects unauthenticated visitors without the cookie to `/age-gate`.
**When to use:** LEGAL-01 requirement.

```typescript
// Source: Next.js 16 official docs (https://nextjs.org/docs/app/api-reference/functions/cookies)
// src/app/actions/age-gate.ts
"use server"
import { cookies } from "next/headers"
import { redirect } from "next/navigation"

export async function confirmAge() {
  const cookieStore = await cookies()
  cookieStore.set("age-verified", "1", {
    maxAge: 60 * 60 * 24 * 365, // 365 days
    path: "/",
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
  })
  redirect("/login") // or "/" depending on routing
}
```

```typescript
// Source: Next.js 16 proxy docs (https://nextjs.org/docs/app/api-reference/file-conventions/middleware)
// Extension to existing src/proxy.ts
export function proxy(request: NextRequest) {
  const isAgeVerified = request.cookies.has("age-verified")
  const isAgeGateRoute = request.nextUrl.pathname.startsWith("/age-gate")
  const isPublicAsset = /* _next, favicon, studio, api */ false

  // Unauthenticated + no age cookie → redirect to age gate
  if (!isAgeVerified && !isAgeGateRoute && !isPublicAsset) {
    return NextResponse.redirect(new URL("/age-gate", request.url))
  }

  // ... existing auth logic from auth()
}
```

**Critical caveat:** The current `proxy.ts` re-exports `auth` from `@/auth` as the proxy function. Adding age-gate logic means the proxy function must become a real function that calls `auth()` internally AND checks the age cookie. This requires restructuring `proxy.ts`.

### Pattern 6: Media Gallery (Images + Videos)

**What:** The `media[]` field contains mixed `_type === 'image'` and `_type === 'file'` (video) items. Render conditionally based on `_type`. The GROQ query already returns `mimeType` from the asset.

```typescript
// Source: Sanity schema (src/sanity/schemaTypes/product.ts)
// Modal gallery — conditional render by _type
{product.media.map((item, i) => (
  item._type === "image" ? (
    <Image
      key={item._key}
      src={urlFor(item).width(800).url()}
      alt={item.alt ?? ""}
      width={800}
      height={600}
      className="object-contain"
    />
  ) : (
    <video
      key={item._key}
      src={item.url}
      controls
      className="w-full"
      aria-label={item.caption ?? "Product video"}
    />
  )
))}
```

**Note:** `urlFor` only works on image-type items. Calling `urlFor` on a file/video item will produce an invalid URL. Always guard with `item._type === "image"`.

### Anti-Patterns to Avoid

- **Using `useEffect` + fetch for product data:** Sanity data belongs in RSC layer with `sanityFetch`. Only UI interaction state (modal open/close, gallery index) belongs in client state.
- **Calling `urlFor` on video items:** Videos use `item.url` directly (the GROQ query already resolves `asset->url`). Images use `urlFor(item)`.
- **Importing bcrypt or Node.js-only modules in proxy.ts:** The current proxy.ts re-exports `auth` from `@/auth` which does import bcrypt. Adding raw age-gate logic to `proxy.ts` must use only edge-safe code — but since the project runs Node.js runtime (not edge), this is acceptable.
- **Intercepting routes for the product modal:** Adds file system complexity with no benefit for this display-only use case. Use client-side state + `<dialog>` instead.
- **`overflow-x-scroll` instead of `overflow-x-auto`:** Always shows scrollbar. Use `overflow-x-auto` so scrollbar only appears when content overflows.
- **`snap-mandatory` for product carousels:** Forces hard snap after each card. `snap-proximity` is more comfortable for browsing. Only use `mandatory` for full-screen slides.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Responsive image CDN URLs | Custom URL builder for Sanity images | `urlFor` from `@sanity/image-url` (already installed) | Handles hotspot cropping, format negotiation, CDN routing |
| Modal keyboard trap, focus management, Escape key | Custom focus-trap logic | Native `<dialog>` element with `showModal()` | Browser handles all accessibility — Escape key, focus trap, aria-modal, backdrop |
| Live content updates | Polling or manual revalidation | `SanityLive` + `sanityFetch` (already wired in `live.ts`) | Automatic stale-while-revalidate through Sanity's live content API |
| Cookie parsing in proxy | Manual `Cookie` header splitting | `request.cookies.get('name')` from NextRequest | NextRequest wraps the Cookie header with full RFC parsing |

**Key insight:** This phase is essentially "wire data to UI" — the hard work (schema, queries, auth, data layer) was done in Phases 2 and 3. Don't re-invent what's already there.

---

## Common Pitfalls

### Pitfall 1: `urlFor` Called on Video File Items

**What goes wrong:** `urlFor(mediaItem)` throws or produces a broken URL when `mediaItem._type === 'file'`. The `@sanity/image-url` library only handles image assets.
**Why it happens:** The `media[]` field is a mixed array of `image` and `file` (video) items. Developers iterate the array without checking `_type`.
**How to avoid:** Always guard: `item._type === 'image' ? urlFor(item)... : item.url`.
**Warning signs:** Empty or malformed `src` attributes on `<Image>` components; browser errors about invalid image URLs.

### Pitfall 2: Missing `remotePatterns` for `cdn.sanity.io` in next.config.ts

**What goes wrong:** `next/image` refuses to optimize images from external hostnames not declared in `remotePatterns`. Build passes but images 404 in production.
**Why it happens:** `next/image` requires explicit allowlisting of external domains for security.
**How to avoid:** Check `next.config.ts` for `images.remotePatterns` before writing any image code. If `cdn.sanity.io` is not listed, add it.
**Warning signs:** `Error: Invalid src prop ... hostname "cdn.sanity.io" is not configured under images in your next.config.js`.

### Pitfall 3: `proxy.ts` Re-export Pattern Conflicts with Age Gate Logic

**What goes wrong:** The current `proxy.ts` is `export { auth as proxy } from "@/auth"` — a one-liner re-export. This cannot be extended with age-gate cookie logic without rewriting it as a full proxy function.
**Why it happens:** Auth.js provides a convenient re-export shortcut, but it gives no hook point for additional logic.
**How to avoid:** Refactor `proxy.ts` into a real proxy function that calls `auth()` for the auth check AND checks `request.cookies.has('age-verified')` for the age gate. The `config.matcher` stays the same.
**Warning signs:** Age gate cookie check being skipped entirely; all visitors going directly to `/login` without seeing age gate.

### Pitfall 4: Age Gate Cookie Not Sent by Middleware to RSC

**What goes wrong:** Cookie set in Server Action is readable by browser but proxy.ts reads the *request* cookies — the cookie is only available on subsequent requests after the browser stores it.
**Why it happens:** Cookie set in a Server Action takes effect after the HTTP response is sent; the current request's proxy.ts runs before the action.
**How to avoid:** This is expected behavior. The Server Action sets the cookie → browser stores it → next request to proxy.ts will have it. No workaround needed; just don't test "same-request" visibility.
**Warning signs:** Testing in the same request cycle and concluding the cookie isn't working.

### Pitfall 5: `<dialog>` Not Visible or Not Modal

**What goes wrong:** Rendering `<dialog open>` (controlled attribute) instead of calling `dialogRef.current.showModal()` — the dialog renders without the modal backdrop and without keyboard focus trap.
**Why it happens:** React developers reach for declarative `open` prop, but `showModal()` is what activates the modal behavior.
**How to avoid:** Always use `useRef` + `showModal()` / `close()` in a `useEffect` (or imperative event handler). Never set the `open` attribute directly on a dialog that needs modal behavior.
**Warning signs:** Dialog appears but page content behind it remains interactive; Escape key doesn't close; no backdrop visible.

### Pitfall 6: SanityLive Not Added to App Layout

**What goes wrong:** `sanityFetch` works for initial data but live content updates (when owner edits products in Studio) don't propagate to the browser.
**Why it happens:** `SanityLive` must be rendered in a layout component to establish the live subscription. Without it, `sanityFetch` still works but there is no live refresh.
**How to avoid:** Add `<SanityLive />` to `src/app/(app)/layout.tsx` (the authenticated app shell, not the root layout).
**Warning signs:** Product edits in Studio require a full page reload to appear.

### Pitfall 7: Horizontal Overflow Caused by Carousel Breaking Page Layout

**What goes wrong:** Carousel container causes `overflow-x` at the page level, creating a horizontal page scrollbar.
**Why it happens:** The carousel container must be constrained to a known width (e.g., `w-full max-w-screen-xl mx-auto`) and `overflow-x-hidden` must be set on a parent element if needed.
**How to avoid:** Wrap the carousel section in a `<div className="overflow-hidden">` parent, and ensure the carousel container has explicit `w-full`.
**Warning signs:** Entire page becomes horizontally scrollable.

---

## Code Examples

### Fetching Products by Strain with `sanityFetch`

```typescript
// Source: next-sanity live API (src/sanity/lib/live.ts — already configured)
import { sanityFetch } from "@/sanity/lib/live"
import { PRODUCTS_BY_STRAIN_QUERY } from "@/sanity/lib/queries"
import type { PRODUCTS_BY_STRAIN_QUERYResult } from "@/sanity/types"

// In a React Server Component:
const { data: sativaProducts } = await sanityFetch({
  query: PRODUCTS_BY_STRAIN_QUERY,
  params: { strainType: "sativa" },
})
// data is typed as PRODUCTS_BY_STRAIN_QUERYResult (TypeGen-generated)
```

### Scrollbar-Hidden Carousel Container (Tailwind v4)

```typescript
// Source: Tailwind CSS docs + GitHub discussion #16744
// Container: horizontal scroll, snap, hidden scrollbar
<div className="flex gap-4 overflow-x-auto snap-x snap-proximity pb-2
               [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
  {products.map((p) => (
    // Each card: fixed width, snaps at start
    <div key={p._id} className="snap-start flex-none w-64">
      {/* ProductCard */}
    </div>
  ))}
</div>
```

**Alternative with `@utility` in globals.css:**

```css
/* Source: Tailwind CSS v4 @utility directive */
/* src/styles/globals.css */
@utility no-scrollbar {
  scrollbar-width: none;
  &::-webkit-scrollbar {
    display: none;
  }
}
```

Then use `className="... no-scrollbar"`.

### Setting Age-Verified Cookie in Server Action

```typescript
// Source: Next.js 16 official docs (https://nextjs.org/docs/app/api-reference/functions/cookies)
// src/app/actions/age-gate.ts
"use server"
import { cookies } from "next/headers"
import { redirect } from "next/navigation"

export async function confirmAge() {
  const cookieStore = await cookies()
  cookieStore.set("age-verified", "1", {
    maxAge: 60 * 60 * 24 * 365, // 365 days in seconds
    path: "/",
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    httpOnly: true,
  })
  redirect("/")
}
```

### Reading Age Cookie in proxy.ts

```typescript
// Source: Next.js 16 proxy docs (https://nextjs.org/docs/app/api-reference/file-conventions/middleware)
// Reading from request cookies — no await needed, this is the RequestCookies API
const isAgeVerified = request.cookies.has("age-verified")
// or
const ageCookie = request.cookies.get("age-verified")?.value
```

### Conditional Media Render in Modal Gallery

```typescript
// Source: Sanity product schema (src/sanity/schemaTypes/product.ts)
// The PRODUCT_BY_ID_QUERY returns: { _type, _key, alt, caption, url, mimeType }
{product.media.map((item) =>
  item._type === "image" ? (
    <Image
      key={item._key}
      src={urlFor(item).width(800).auto("format").url()}
      alt={item.alt ?? product.name}
      width={800}
      height={600}
      className="w-full h-auto object-contain rounded"
    />
  ) : (
    <video
      key={item._key}
      src={item.url}
      controls
      className="w-full rounded"
      preload="metadata"
    />
  )
)}
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `middleware.ts` | `proxy.ts` | Next.js 16 | File renamed; export must be `proxy`, not `middleware`. Existing `src/proxy.ts` already uses the new name. |
| `useMiddleware` (Express style) | Built-in proxy file convention | Next.js 12 | N/A — already on new approach |
| Synchronous `cookies()` | Async `cookies()` (must `await`) | Next.js 15 | `const cookieStore = await cookies()` is required |
| `forwardRef` to pass ref to dialog | Ref as prop (React 19) | React 19 | `<Modal ref={ref} />` works without `forwardRef` wrapper |
| `getServerSideProps` | RSC with `async` page component | Next.js 13+ | Already using App Router correctly |
| Manual `fetch()` with Sanity token | `sanityFetch` from `defineLive` | next-sanity v8+ | Already wired; includes live content subscription |

**Deprecated/outdated:**
- `middleware.ts` filename: renamed to `proxy.ts` in Next.js 16. The project already uses `proxy.ts`.
- Synchronous `cookies()`: deprecated since Next.js 15; must use `await cookies()`.
- `React.FC` type annotation: outdated practice per React team; omit it.

---

## Open Questions

1. **Does `next.config.ts` already allow `cdn.sanity.io` as an image remote pattern?**
   - What we know: The project uses `@sanity/image-url` and the Sanity CDN but the config file was not checked during research.
   - What's unclear: Whether `remotePatterns` with `cdn.sanity.io` is configured.
   - Recommendation: Wave 0 task — read `next.config.ts` and add `cdn.sanity.io` if missing. This is a build-time failure if overlooked.

2. **Age gate scope: does it gate all public routes or only the root?**
   - What we know: LEGAL-01 says "before any dispensary content is visible." The site's public content is the age gate page itself, the privacy policy, and the login/register flow. The menu is already auth-gated.
   - What's unclear: Whether the age gate should apply before `/login` and `/register` (which show no product content) or only before specific pages.
   - Recommendation: Apply age gate to all routes except: `/age-gate`, `/api`, `/_next`, `/favicon.ico`, `/studio`. Exempt `/login`, `/register`, `/pending` if they show no product content. Update the proxy.ts matcher accordingly.

3. **Does `proxy.ts` currently run Node.js or Edge runtime?**
   - What we know: Next.js 16 defaults proxy to Node.js runtime. The project `proxy.ts` re-exports `auth` which uses bcrypt (Node.js only) — confirming Node.js runtime is in use.
   - What's unclear: Whether any edge-compatibility constraints apply when refactoring proxy.ts to include age-gate logic.
   - Recommendation: No constraints — Node.js runtime is confirmed. Add age-gate logic freely.

4. **Client's jurisdiction for cannabis compliance labeling?**
   - What we know: STATE.md flags this as a blocker: "Client's jurisdiction for cannabis compliance (state-specific labeling rules) must be confirmed before product card design is finalized."
   - What's unclear: Whether the jurisdiction affects the age gate wording, disclaimer text, or product labeling beyond what's specified in LEGAL-01/02/03.
   - Recommendation: Implement per the requirements as written (21+, "For adults 21+ only. For use where legal."). The privacy policy covers data retention per LEGAL-03 as a static page. Flag for client confirmation but don't block implementation.

5. **Should `SanityLive` be added to `(app)/layout.tsx` now, or was it already added?**
   - What we know: `src/app/(app)/layout.tsx` currently just renders `<>{children}</>`. The `live.ts` file exports `SanityLive` but it was not found in any layout during code inspection.
   - What's unclear: Whether Phase 4 menu data needs live updates or static fetch is sufficient.
   - Recommendation: Add `<SanityLive />` to `(app)/layout.tsx` in Wave 0. Owner editing products in Studio should reflect without full redeploy.

---

## Sources

### Primary (HIGH confidence)

- Next.js 16.1.6 official docs (https://nextjs.org/docs/app/api-reference/functions/cookies) — cookies() API, async requirement, set/get/has methods
- Next.js 16.1.6 official docs (https://nextjs.org/docs/app/api-reference/file-conventions/middleware) — proxy.ts cookie API, `request.cookies.get()`, `response.cookies.set()` patterns
- Tailwind CSS official docs (https://tailwindcss.com/docs/scroll-snap-type) — `snap-x`, `snap-mandatory`, `snap-proximity` classes
- Tailwind CSS official docs (https://tailwindcss.com/docs/overflow) — `overflow-x-auto`, `overflow-x-scroll` classes
- Tailwind CSS official docs (https://tailwindcss.com/docs/scroll-snap-align) — `snap-start`, `snap-center`, `snap-end` classes
- Tailwind CSS GitHub discussion #16744 — `[scrollbar-width:none] [&::-webkit-scrollbar]:hidden` pattern for v4
- Sanity docs (https://www.sanity.io/docs/presenting-images) — `urlFor` builder with `.width().height().auto().url()`
- Project source: `src/sanity/lib/queries.ts` — `PRODUCTS_BY_STRAIN_QUERY`, `PRODUCT_BY_ID_QUERY` already written
- Project source: `src/sanity/lib/image.ts` — `urlFor` already configured
- Project source: `src/sanity/lib/live.ts` — `sanityFetch`, `SanityLive` already configured
- Project source: `src/sanity/schemaTypes/product.ts` — `media[]` field structure confirmed (mixed image/file)

### Secondary (MEDIUM confidence)

- MDN Web Docs pattern (via web search) — `<dialog>` + `showModal()` + `close()` + `onClose` event; Escape key behavior; focus trap; `::backdrop` styling
- LogRocket blog (updated Jan 2025) — React 19 `<dialog>` compatibility, removal of `forwardRef` requirement
- GitHub discussion — Embla Carousel React 19 support confirmed in v8.x; but NOT recommended for this project (CSS snap is sufficient)

### Tertiary (LOW confidence)

- Cannabis age gate compliance best practices: "session cookie vs. persistent cookie" — common dispensary practice is 365-day persistent cookie; no authoritative legal source specifies the exact duration. Treat as implementation guidance, not legal requirement.

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all libraries are already installed and in use; verified via project `package.json`
- Architecture patterns: HIGH — patterns confirmed against Next.js 16 official docs and project source code
- Pitfalls: HIGH for Sanity/proxy/dialog pitfalls (verified against docs); MEDIUM for age gate cookie compliance (no authoritative legal source)
- Carousel implementation: HIGH — Tailwind v4 scroll-snap API confirmed from official docs

**Research date:** 2026-03-02
**Valid until:** 2026-04-02 (30 days — stable libraries; Tailwind v4 and Next.js 16 are stable releases)
