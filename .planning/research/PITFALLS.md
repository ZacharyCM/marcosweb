# Pitfalls Research

**Domain:** Cannabis dispensary display website (Next.js + Sanity CMS + NextAuth + Vercel)
**Researched:** 2026-03-01
**Confidence:** MEDIUM — training knowledge. All LOW confidence items flagged for verification.

---

## Critical Pitfalls

### 1. Sanity Image References Are Objects, Not URLs

**What goes wrong:** Query returns `{ _type: "image", asset: { _ref: "image-abc123-800x600-jpg" } }`. Developer tries `<img src={product.image}>` and gets `[object Object]`.

**Prevention:** Install `@sanity/image-url` and create a shared utility immediately:

```typescript
// lib/sanity/image.ts
import imageUrlBuilder from '@sanity/image-url'
import { client } from './client'
const builder = imageUrlBuilder(client)
export const urlFor = (source: any) => builder.image(source)

// Usage: urlFor(product.image).width(400).url()
```

**Phase:** CMS integration setup — establish before building any product card component.

---

### 2. GROQ Missing `.asset->` Dereference

**What goes wrong:** `*[_type == "product"]{ name, image }` returns image asset as a reference stub. `product.image.asset.url` is `undefined`.

**Prevention:** Always dereference image assets in GROQ:

```groq
*[_type == "product"]{
  name,
  "image": image.asset->{ url, metadata }
}
```

**Phase:** CMS integration setup — test all GROQ queries before building UI.

---

### 3. Approval Status Stale in JWT After Revocation

**What goes wrong:** Approval status encoded in JWT at login time. Owner revokes approval in Sanity Studio — user's JWT still shows `approved` for up to session duration. Revoked user continues accessing menu.

**Prevention:** On sign-in, load status from Sanity into JWT. Keep JWT `maxAge` reasonable (e.g., 24 hours). For immediate revocation, re-fetch status from Sanity in `session` callback:

```typescript
callbacks: {
  async session({ session, token }) {
    const user = await sanityClient.fetch(userByEmailQuery, { email: token.email })
    session.user.status = user?.status ?? 'pending'
    return session
  }
}
```

**Note:** This adds a Sanity query on every session check. For v1, loading at login with 24h maxAge is acceptable. Decide before auth is considered done.

**Phase:** Auth implementation.

---

### 4. App Router Default Caching Serving Stale Product Data

**What goes wrong:** Products fetched at build time never update. Owner changes prices in Sanity Studio — visitors still see old data for hours or indefinitely.

**Prevention:** Set explicit cache policy on every Sanity fetch:

```typescript
// In Server Component
const products = await client.fetch(productsQuery, {}, {
  next: { revalidate: 60 }  // Revalidate every 60 seconds
})
```

Also set up a Sanity webhook to call `/api/revalidate` on content publish for instant updates.

**Phase:** Product display phase — caching strategy decided before first product fetch.

---

### 5. Missing or Wrong Vercel Environment Variables

**What goes wrong:** App works locally. Products empty or auth fails on Vercel. `NEXT_PUBLIC_*` vars baked at build time — if missing from Vercel dashboard at build time, client gets `undefined`.

**Prevention:**
- Create `.env.example` on day one listing all required var names
- Add all vars to Vercel project settings before first deploy
- `SANITY_API_TOKEN` must NOT have `NEXT_PUBLIC_` prefix

```bash
# .env.example
NEXT_PUBLIC_SANITY_PROJECT_ID=
NEXT_PUBLIC_SANITY_DATASET=production
SANITY_API_READ_TOKEN=       # server-only — NEVER NEXT_PUBLIC_
NEXTAUTH_SECRET=             # openssl rand -base64 32
NEXTAUTH_URL=https://yourdomain.com
```

**Phase:** Initial setup / deployment — create `.env.example` on day one.

---

### 6. NEXTAUTH_URL Mismatch Causing Auth Redirect Loop

**What goes wrong:** Login works locally, redirect loop on Vercel. `NEXTAUTH_URL` must match exact canonical URL.

**Prevention:**
- Set `NEXTAUTH_URL` to production URL in Vercel Production env
- For Preview deployments: use `VERCEL_URL` auto-variable
- Test auth on a Vercel Preview URL before considering auth complete

**Phase:** Auth implementation.

---

### 7. Sanity CORS Not Configured for Vercel Domains

**What goes wrong:** Sanity queries work in dev (`localhost:3000`) but return 401/CORS errors on Vercel Preview and Production URLs.

**Prevention:** Add all required origins to Sanity CORS settings (Sanity Manage dashboard):
- `http://localhost:3000` (dev)
- `https://*.vercel.app` (Vercel Previews)
- `https://yourdomain.com` (Production)

**Phase:** Initial setup / first Vercel deployment.

---

### 8. `cdn.sanity.io` Missing from next.config.js remotePatterns

**What goes wrong:** Next.js `<Image>` component throws error or shows broken images for Sanity CDN URLs in production.

**Prevention:**

```typescript
// next.config.ts
const config = {
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'cdn.sanity.io' },
    ],
  },
}
```

**Phase:** Initial setup.

---

## Security Mistakes

| Mistake | Risk | Prevention |
|---------|------|------------|
| `SANITY_API_TOKEN` in `NEXT_PUBLIC_` env var | Token exposed in JS bundle — anyone can mutate CMS | Keep token server-only (no `NEXT_PUBLIC_` prefix) |
| Plaintext passwords in Sanity `siteUser` | Credential exposure | Always bcrypt hash before writing to Sanity |
| Client-side-only approval check | User manipulates session or bypasses gate | Enforce in middleware — not just in components |
| Weak `NEXTAUTH_SECRET` | JWTs can be forged | `openssl rand -base64 32` |
| No rate limiting on signup | Flood of fake pending accounts | Add rate limiting on signup API route |

---

## Integration Gotchas

| Integration | Common Mistake | Correct Approach |
|-------------|----------------|------------------|
| Sanity image CDN | Use `image.asset._ref` as img src | `urlFor(image).width(800).url()` |
| Sanity + App Router | No explicit cache policy — stale data | `{ next: { revalidate: 60 } }` on all fetches |
| NextAuth credentials | Not hashing passwords before Sanity write | `bcryptjs` — never store plaintext |
| Vercel + Sanity | Forgetting CORS for Vercel preview URLs | Add `*.vercel.app` to Sanity CORS origins |
| Sanity Studio + Vercel | Missing `basePath: '/studio'` in `sanity.config.ts` | Set basePath to match route |
| Next.js Image + Sanity | `cdn.sanity.io` not in `remotePatterns` | Add to `next.config.ts` |
| NextAuth v5 | Using v4 docs/patterns | Verify against https://authjs.dev — v5 has different export patterns |

---

## Cannabis / Legal Pitfalls

| Pitfall | Risk | Prevention |
|---------|------|------------|
| No age gate on public-facing site | Regulatory violation; license risk | Age gate before any content visible to unauthenticated users |
| Missing jurisdiction disclaimer | Non-compliance | "For adults 21+ only. For use where legal." persistent disclaimer |
| No "display only, not an online store" label | Consumer/regulatory confusion | Clearly label as menu display |
| THC/CBD % without required context | State-specific DCC/MED violation | Verify with client on their state's digital menu labeling rules |
| No privacy policy with user account collection | CCPA/GDPR exposure | Draft minimal privacy policy covering data collected, purpose, retention |

---

## "Looks Done But Isn't" Checklist

Before marking each phase complete, verify:

**Auth:**
- [ ] Hitting `/menu` directly while logged out → redirects to `/sign-in`
- [ ] Pending user hitting `/menu` → redirects to `/pending` (not shown menu)
- [ ] Wrong password → "Incorrect credentials" error (not "awaiting approval")
- [ ] Approved user → can access menu without re-registering

**Products:**
- [ ] Product images load on Vercel production (not just localhost)
- [ ] Updating price in Sanity → change appears within revalidation window
- [ ] Empty strain carousel → section hidden entirely (not empty carousel with header)

**Studio:**
- [ ] `/studio` route requires Sanity login — not open to public
- [ ] Owner can approve a pending user in Studio without a developer
- [ ] Owner can add / edit / delete a product without a developer

**Infrastructure:**
- [ ] `NEXT_PUBLIC_SANITY_PROJECT_ID` resolves correctly on Vercel Production and Preview
- [ ] CORS configured — Sanity queries succeed from Vercel Preview URL
- [ ] Mobile carousels: horizontal scroll works on iOS Safari and Android Chrome
- [ ] Legal disclaimer and age gate present before launch

---

## Pitfall-to-Phase Mapping

| Pitfall | Phase to Address |
|---------|------------------|
| Sanity image not a URL | CMS integration / product schema phase |
| GROQ missing asset dereference | CMS integration / product schema phase |
| App Router stale caching | Product display phase |
| Approval status stale in JWT | Auth implementation phase |
| Missing Vercel env vars | Initial setup phase |
| NEXTAUTH_URL mismatch | Auth implementation / first Vercel deploy |
| CORS not configured | Initial setup / first Vercel deploy |
| `cdn.sanity.io` missing from remotePatterns | Initial setup phase |
| Cannabis legal compliance | UI/layout phase |
| No rate limiting on signup | Auth implementation phase |

---
*Pitfalls research for: Pure Pressure Next.js + Sanity CMS cannabis dispensary display website*
*Researched: 2026-03-01*
