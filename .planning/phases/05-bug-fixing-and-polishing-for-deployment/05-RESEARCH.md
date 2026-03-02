# Phase 5: Bug Fixing and Polishing for Deployment - Research

**Researched:** 2026-03-02
**Domain:** Auth.js v5 / Next.js 16 production hardening, Sanity CORS, Vercel env vars, E2E smoke testing
**Confidence:** HIGH (codebase read directly; critical issues verified against live GitHub issues)

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- Every auth flow must work without errors on Vercel production: registration, login, logout, pending, denied, approved
- No login or registration form errors allowed — includes network errors, redirect loops, env var mismatches
- No Sanity Studio upload errors when client is invited as editor/admin — product image/video upload, document creation, publishing
- Client will be invited to the Sanity project (not using dev credentials) — test that invite + first-time use works correctly
- Sanity API token and CORS must be correct for both localhost and production Vercel URL
- Product creation schema must accept all required fields with no validation errors
- All required env vars must be present and correct on Vercel (AUTH_SECRET, AUTH_URL, SANITY_PROJECT_ID, SANITY_DATASET, SANITY_API_TOKEN)
- AUTH_URL must be set to the production Vercel domain — not localhost
- No console errors or unhandled runtime exceptions in production build
- Phase 5 only fixes bugs, does not add features
- Phase 4's 04-03-PLAN.md (product modal) must complete before Phase 5 executes — Phase 5 QA includes the modal
- After fixes: full E2E smoke test on Vercel production covering every user flow
- Sanity Studio: create a product, edit it, upload an image, approve a user — all must work
- Site UX: age gate → register → pending → (approve in Studio) → login → browse menu → open modal

### Claude's Discretion
- Order of bug fixing: auth-layer issues first (most likely to break on Vercel), then Sanity Studio issues, then frontend polish
- How to surface bugs: read current codebase, check known env-var pitfalls, inspect next.config / middleware for deployment issues
- Any minor UX polish (loading states, error messages) appropriate for client delivery is in scope

### Deferred Ideas (OUT OF SCOPE)
- v2 features (effects chips, potency tiers, skeleton loaders, featured product banner)
- Multi-tenant / multi-location support
</user_constraints>

---

## Summary

The codebase was read end-to-end. The architecture is sound: `src/proxy.ts` uses the correct Next.js 16 file convention (renamed from `middleware.ts`), `next.config.ts` already includes `cdn.sanity.io` in `remotePatterns`, `SanityLive` is correctly placed in the `(app)` layout, and the product modal is already implemented in `product-modal.tsx` (wired into `product-card.tsx`).

Two critical production bugs were discovered by direct codebase audit and cross-referenced with live GitHub issues. First: `.env.local` uses Auth.js v4 env var names (`NEXTAUTH_SECRET`, `NEXTAUTH_URL`) but Vercel needs Auth.js v5 names (`AUTH_SECRET`, `AUTH_URL`). The v4 names are aliased in v5 and work in many cases, but `AUTH_URL` must be set explicitly on Vercel to avoid a Next.js 16–specific `signIn` server action failure (GitHub issue #13388, opened 2026-03-02). Second: the Sanity project's CORS origin list must include the production Vercel domain with credentials enabled — without it, Sanity Studio will fail to load for the client owner.

Three env var gaps require Vercel dashboard updates before handover: setting `AUTH_SECRET` (from `NEXTAUTH_SECRET`), setting `AUTH_URL` to the production domain, and confirming `SANITY_API_TOKEN` has editor-level permissions. Beyond env vars, the smoke test checklist (age gate → register → pending → approve → login → menu → modal) must pass end-to-end on the live Vercel URL before delivery.

**Primary recommendation:** Fix env vars on Vercel first (15 minutes), add CORS origin in Sanity manage (5 minutes), then run the full E2E smoke test on the live production URL to surface any remaining issues.

---

## Codebase Audit — Current State

This section documents what was found by reading every file. The planner MUST start from this ground truth.

### Files That Exist and Are Correct
| File | Status | Notes |
|------|--------|-------|
| `src/proxy.ts` | Correct | Next.js 16 convention — exports `proxy` function and `config`. Auth + age-gate logic correct. `/studio` excluded from both `ASSET_PREFIXES` and matcher pattern. |
| `next.config.ts` | Correct | `remotePatterns` already includes `cdn.sanity.io`. No changes needed. |
| `src/sanity/lib/live.ts` | Correct | `defineLive` with no token — works for published content only (no draft preview needed for this project). |
| `src/app/(app)/layout.tsx` | Correct | `SanityLive` is present. Correct placement for the app route group. |
| `src/app/(app)/menu/product-modal.tsx` | Exists | Full implementation: `<dialog>`, media gallery, description, effects, potency. Wired to `/api/product/[id]`. |
| `src/app/(app)/menu/product-card.tsx` | Exists | Wired to `ProductModal` with `useState(open)`. MENU-04 and MENU-05 already implemented. |
| `src/app/api/product/[id]/route.ts` | Correct | Auth check (approved only), then `sanityFetch`. API prefix excluded from proxy by matcher. |
| `src/lib/sanity-write.ts` | Correct | `server-only` guard. Falls back to `SANITY_API_TOKEN` if `SANITY_WRITE_TOKEN` not set. |
| `src/auth.ts` | Correct | Credentials provider, JWT re-fetch on every token validation. DeniedError/PendingError surface correctly. |
| `src/auth.config.ts` | Correct | authorized() callback handles denied/pending/unauthenticated cases. |
| `src/app/actions/auth.ts` | RISK | `signIn("credentials", ...)` called from server action — known broken pattern on Next.js 16 without `AUTH_URL` set. |
| `src/app/(auth)/login/login-form.tsx` | Correct | Handles both `useActionState` errors and URL `?code=` errors. |
| `src/app/(public)/age-gate/page.tsx` | Correct | `confirmAge` sets `age-verified` cookie, redirects to `/login`. |
| `src/app/actions/age-gate.ts` | Correct | Cookie with `secure: process.env.NODE_ENV === "production"`. Correct. |
| `src/app/studio/[[...tool]]/page.tsx` | Correct | `"use client"` + `NextStudio`. |
| `src/app/studio/layout.tsx` | Correct | Exports `metadata` and `viewport` from `next-sanity/studio`. |
| `src/sanity/schemaTypes/product.ts` | Correct | All fields with validation. `media` array accepts images and video files. |
| `src/sanity/schemaTypes/siteUser.ts` | Correct | `passwordHash` hidden in Studio. `status` radio with `pending`/`approved`/`denied`. |
| `sanity.config.ts` | Correct | `basePath: "/studio"`. Uses `NEXT_PUBLIC_SANITY_PROJECT_ID` and `NEXT_PUBLIC_SANITY_DATASET`. |
| `.env.example` | Correct | Documents `AUTH_SECRET`, `AUTH_URL`, `SANITY_API_TOKEN`, `SANITY_WRITE_TOKEN`. |

### Critical Gap: `.env.local` Uses v4 Env Var Names
```
# What .env.local currently has (v4 names):
NEXTAUTH_SECRET=<value>
NEXTAUTH_URL=http://localhost:3000

# What Vercel must have (v5 names):
AUTH_SECRET=<same value>
AUTH_URL=https://your-production-domain.vercel.app
```

Auth.js v5 documents that `NEXTAUTH_SECRET` is an alias for `AUTH_SECRET` and SHOULD still work. However, setting `AUTH_URL` explicitly on Vercel is the documented fix for issue #13388 (signIn server action fails with "Configuration" error on Next.js 16 when the header `x-forwarded-proto` is absent from server action context).

---

## Standard Stack

### Core (Already Installed — No New Dependencies Needed)
| Library | Version | Purpose | Status |
|---------|---------|---------|--------|
| `next` | 16.1.6 | App framework — uses `proxy.ts` convention (not `middleware.ts`) | Installed |
| `next-auth` | ^5.0.0-beta.30 | Auth — `AUTH_SECRET`/`AUTH_URL` env vars | Installed |
| `next-sanity` | ^11.6.12 | Sanity integration — `SanityLive`, `sanityFetch`, `defineLive` | Installed |
| `sanity` | ^4.22.0 | Studio, schema, GROQ | Installed |
| `bcryptjs` | ^3.0.3 | Password hashing | Installed |
| `zod` | ^4.3.6 | Form validation | Installed |

**No new packages required for Phase 5.** This phase only fixes configuration, env vars, and any remaining bugs.

---

## Architecture Patterns

### File Convention: proxy.ts (Next.js 16)

Next.js 16 renamed `middleware.ts` to `proxy.ts` (breaking change from v16.0.0). The project already uses this convention correctly.

```typescript
// src/proxy.ts — correct for Next.js 16
// exports named `proxy` function (not `middleware`) and `config`
export const proxy = auth(function proxyHandler(req) { ... })
export const config = { matcher: [...] }
```

The matcher excludes `studio` from the regex pattern AND the `ASSET_PREFIXES` array provides a redundant early-exit for `/api`, `/_next`, `/favicon.ico`, and `/studio`. This double-exclusion is intentional and correct.

### Auth.js v5 on Vercel — Required Env Vars

```bash
# Required on Vercel (set in Vercel Dashboard > Project > Settings > Environment Variables)
AUTH_SECRET=<random-32-char-string>        # REQUIRED — JWT signing key
AUTH_URL=https://your-app.vercel.app       # REQUIRED on Next.js 16 — fixes signIn server action

# Optional aliases (v4 names still work as aliases but should not be relied on alone)
# NEXTAUTH_SECRET=<same value>             # alias, still accepted
# NEXTAUTH_URL=https://your-app.vercel.app # alias, still accepted
```

Source: [authjs.dev/getting-started/deployment](https://authjs.dev/getting-started/deployment), GitHub issue #13388

### Sanity CORS Configuration

Studio at `/studio` sends authenticated browser requests to the Sanity Content Lake. Without CORS configured, Studio will fail to load or fail to save documents.

```
Required CORS origin in Sanity manage (sanity.io/manage > Project > API > CORS Origins):
- https://your-app.vercel.app   (with "Allow credentials" checked)
- http://localhost:3000          (with "Allow credentials" checked — for local dev)
```

Source: [sanity.io/docs/cors](https://www.sanity.io/docs/cors)

### Sanity API Token Permissions

The `SANITY_API_TOKEN` (or `SANITY_WRITE_TOKEN`) must have **editor** role to:
- Create product documents
- Upload image assets
- Upload video/file assets
- Publish documents

Viewer role is NOT sufficient for write operations. Editor role is available on all plans including free.

Source: [sanity.io/docs/content-lake/roles-concepts](https://www.sanity.io/docs/content-lake/roles-concepts)

### next/image remotePatterns — Already Correct

```typescript
// next.config.ts — ALREADY CORRECT, no changes needed
const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "cdn.sanity.io" },
    ],
  },
}
```

Product images are fetched via `asset->url` in GROQ, which returns `https://cdn.sanity.io/...` URLs. This is already configured.

### SanityLive — Already Correct, No Token Needed

```typescript
// src/sanity/lib/live.ts — ALREADY CORRECT for published content
export const { sanityFetch, SanityLive } = defineLive({ client })
// No token passed = published content only, uses CDN with 60s revalidation
// This is correct — no draft preview is needed for this project
```

SanityLive uses Server-Sent Events (not WebSockets) internally. No browser CORS issues for the live updates themselves — it runs server-side. The Sanity CORS requirement is for the Studio's direct API calls, not for SanityLive.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| CORS header config | Custom CORS headers | Sanity manage dashboard | Sanity manages its own CORS — app code has no role here |
| Env var validation at runtime | Custom env checker | Vercel dashboard + `.env.example` | Build-time type assertions in `src/sanity/env.ts` already catch missing vars |
| Auth URL detection | Custom header parsing | Setting `AUTH_URL` explicitly | Auth.js already handles host detection when `AUTH_URL` is set |
| Token role validation | Runtime permission check | Sanity manage token settings | Set role at token creation time, not at runtime |

---

## Common Pitfalls

### Pitfall 1: signIn Server Action Fails with "Configuration" Error on Next.js 16

**What goes wrong:** Calling `signIn("credentials", { ...formData, redirectTo: "/menu" })` from a Server Action throws a generic `Configuration` error. Login appears broken. Auth error page shown.

**Why it happens:** Next.js 16's server action context does not pass the `x-forwarded-proto` header to Auth.js. Auth.js uses this header to construct the base URL for the auth callback. Without it, the URL construction fails, and Auth.js converts the error to the generic `Configuration` type.

**How to avoid:** Set `AUTH_URL=https://your-production-domain.vercel.app` in Vercel environment variables. This bypasses the header-based URL detection and provides an explicit base URL.

**Also affects local dev:** Can surface on localhost if `NEXTAUTH_URL` or `AUTH_URL` is not set in `.env.local`. Current `.env.local` has `NEXTAUTH_URL=http://localhost:3000` which may be working as an alias. The safer fix is to also add `AUTH_URL=http://localhost:3000` to `.env.local`.

**Warning signs:** Login form submits, shows spinner briefly, then returns "Configuration" error message. No 401/403 — the error is a generic Auth.js error code.

**References:** GitHub issue #13388 (opened 2026-03-02, confirmed reproducible on Next.js 16 + next-auth beta.30)

### Pitfall 2: Vercel Missing AUTH_SECRET Breaks All Auth

**What goes wrong:** Every request to any protected route fails. Sessions cannot be created. JWT cannot be signed. All users see the login page even after logging in successfully.

**Why it happens:** If `AUTH_SECRET` is not set on Vercel and `NEXTAUTH_SECRET` is not accepted as an alias, the JWT signing key is undefined. Auth.js in v5 will throw on startup.

**How to avoid:** Set `AUTH_SECRET` explicitly in Vercel dashboard. Use `openssl rand -base64 32` to generate a value or copy from `NEXTAUTH_SECRET` in `.env.local`.

**Warning signs:** All pages redirect to login. Sessions don't persist across requests. Vercel function logs show `MissingSecret` or similar Auth.js error.

### Pitfall 3: Sanity Studio CORS Error Blocks Client Owner

**What goes wrong:** Client opens `/studio` on the production URL. Browser console shows CORS error. Studio loads the UI shell but cannot fetch documents. Cannot create, edit, or upload products.

**Why it happens:** Sanity Content Lake rejects browser requests from origins not in the project's CORS allow-list. Server-side fetches (RSC, Server Actions) bypass CORS, but Studio runs in the browser and sends authenticated requests directly.

**How to avoid:** Add the production Vercel URL to Sanity CORS origins with "Allow credentials" checked. Do this in the Sanity manage dashboard at sanity.io/manage > [project] > API > CORS Origins.

**Warning signs:** Products load on the menu page (server-side fetches work) but `/studio` shows blank or broken content. Browser DevTools Network tab shows 403 with CORS headers missing.

### Pitfall 4: SANITY_API_TOKEN Has Viewer-Only Permissions

**What goes wrong:** Client can view Studio but cannot save products. Clicking "Publish" shows a permissions error. Image/video uploads fail.

**Why it happens:** The token was set to Viewer role (principle of least privilege from Phase 1 decisions). Write operations require Editor role minimum.

**How to avoid:** In Sanity manage dashboard, check the token role for the `SANITY_API_TOKEN` / `SANITY_WRITE_TOKEN`. If Viewer, create a new Editor-role token and update Vercel env var.

**State.md note:** [01-02] decision: "Sanity API token scoped to Viewer role only — sufficient for Phase 2 reads." Phase 5 must verify if a write token with editor role was added as `SANITY_WRITE_TOKEN` (the fallback in `sanity-write.ts` uses `SANITY_WRITE_TOKEN` first, then `SANITY_API_TOKEN`). If `SANITY_WRITE_TOKEN` is set on Vercel with editor role, this is not a bug. If it was never added, it is.

**Warning signs:** "Insufficient permissions" error in Sanity Studio when publishing or uploading.

### Pitfall 5: Production Domain Not Added to Sanity CORS with Credentials

**What goes wrong:** Studio loads visually but cannot authenticate or save. API calls in browser console return 403 with CORS error.

**How to avoid:** CORS origin must be added with "Allow credentials" checkbox ticked. Adding the origin without credentials still blocks Studio's authenticated reads.

### Pitfall 6: Age-Verified Cookie Not Set as Secure in Previews

**What goes wrong:** If testing on a Vercel preview URL (https), the cookie was already written as `secure` due to `process.env.NODE_ENV === "production"`. But if accidentally testing on a staging environment that isn't HTTPS, the cookie may not be set.

**Status:** This is unlikely to be a bug — `NODE_ENV` is `production` on Vercel, so cookies will be `secure`. The current implementation is correct.

---

## Code Examples

Verified patterns from codebase and official sources:

### Correct: Env Vars for Vercel Dashboard

```bash
# Vercel Dashboard > Settings > Environment Variables
# (Production environment — not Preview unless also needed there)

AUTH_SECRET=<same value as NEXTAUTH_SECRET in .env.local>
AUTH_URL=https://your-app.vercel.app

NEXT_PUBLIC_SANITY_PROJECT_ID=<from sanity.io/manage>
NEXT_PUBLIC_SANITY_DATASET=production

SANITY_API_TOKEN=<viewer role — for read operations>
SANITY_WRITE_TOKEN=<editor role — for write operations / auth password lookup>
```

### Correct: Sanity CORS CLI (Alternative to Dashboard)

```bash
# Add production domain to Sanity CORS origins with credentials
npx sanity cors add https://your-app.vercel.app --credentials

# Also ensure localhost is present for local dev
npx sanity cors add http://localhost:3000 --credentials
```

Source: [sanity.io/docs/cors](https://www.sanity.io/docs/cors)

### Correct: proxy.ts Pattern (Already Implemented — Reference Only)

```typescript
// src/proxy.ts — Next.js 16 pattern (correct, no changes needed)
// The function name must be "proxy" not "middleware" in Next.js 16
export const proxy = auth(function proxyHandler(req) {
  const { pathname } = req.nextUrl
  if (PUBLIC_PATHS.some(p => pathname.startsWith(p)) ||
      ASSET_PREFIXES.some(p => pathname.startsWith(p))) {
    return NextResponse.next()
  }
  if (!req.cookies.has("age-verified")) {
    return NextResponse.redirect(new URL("/age-gate", req.url))
  }
})
export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|studio).*)"],
}
```

### Correct: SanityLive Without Token (Already Implemented — Reference Only)

```typescript
// src/sanity/lib/live.ts — no token needed for published content
// Works in production — uses CDN with 60s revalidation
export const { sanityFetch, SanityLive } = defineLive({ client })
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `middleware.ts` file | `proxy.ts` file | Next.js v16.0.0 | Must export `proxy` (not `middleware`) — already done correctly |
| `NEXTAUTH_SECRET` / `NEXTAUTH_URL` | `AUTH_SECRET` / `AUTH_URL` | Auth.js v5 | Old names are aliases but `AUTH_URL` is critical for Next.js 16 signIn fix |
| `middleware.ts` matcher excludes studio | `proxy.ts` matcher regex + `ASSET_PREFIXES` array | Phase 4 | Double exclusion is correct — studio owners bypass all auth |

**Already correct — no changes needed:**
- `remotePatterns: cdn.sanity.io` — in place
- `SanityLive` without token — correct for published content
- `proxy.ts` file convention — correct for Next.js 16
- Product modal — fully implemented

---

## E2E Smoke Test Checklist

Phase 5 success requires this full flow to pass on the **live Vercel production URL** (not localhost):

```
FLOW 1 — New user registration
[ ] Visit production URL (no cookie) → redirected to /age-gate
[ ] Click "I am 21 or older" → age-verified cookie set → redirected to /login
[ ] Click "Request an account" → /register page loads
[ ] Submit registration form (name, email, password) → redirected to /pending
[ ] /pending shows "Your account is pending approval" message
[ ] Sign out from /pending → redirected to /login

FLOW 2 — Owner approves in Sanity Studio
[ ] Owner visits /studio on production URL → Studio loads without errors
[ ] Owner can see siteUser documents
[ ] Owner marks newly registered user as "Approved" and publishes
[ ] Owner creates a test product (name, strain, price, THC, CBD, image upload)
[ ] Product saves and publishes without errors

FLOW 3 — Approved user login
[ ] Approved user visits production URL (age cookie already set) → /login
[ ] Submit login form with approved credentials → redirected to /menu
[ ] Menu shows carousels (Sativa, Hybrid, Indica) — products visible with images
[ ] Click a product card → modal opens with description, effects, media gallery
[ ] Close modal → carousel still visible
[ ] Sign out → redirected to /login

FLOW 4 — Denied user
[ ] Owner denies a test user in Sanity Studio
[ ] Denied user attempts login → login page shows "Your access was not approved" message
[ ] No redirect loop

FLOW 5 — Direct URL access protection
[ ] Visit /menu without being logged in (age cookie set) → redirected to /login
[ ] Visit /menu while pending → redirected to /pending or /login
```

---

## Open Questions

1. **Was `SANITY_WRITE_TOKEN` ever added to Vercel?**
   - What we know: `sanity-write.ts` falls back to `SANITY_API_TOKEN` if `SANITY_WRITE_TOKEN` is not set. The `.env.local` has `SANITY_WRITE_TOKEN` set. The STATE.md decision [01-02] said `SANITY_API_TOKEN` was scoped to Viewer role only.
   - What's unclear: Was a separate Editor-role `SANITY_WRITE_TOKEN` added to Vercel during Phase 3 when auth needed to create siteUser documents?
   - Recommendation: First task of Phase 5 should be to check Vercel dashboard for both tokens and verify their roles in Sanity manage.

2. **Has signIn() ever been tested on the live Vercel production URL?**
   - What we know: issue #13388 is fresh (2026-03-02) and confirms the bug on Next.js 16 + beta.30. The workaround is setting AUTH_URL.
   - What's unclear: Whether the project was fully tested on Vercel with login working, or only tested locally.
   - Recommendation: Set AUTH_URL on Vercel as the first fix, then test login before investigating further.

3. **Is the production Vercel domain already in Sanity CORS origins?**
   - What we know: Phase 1 plan 01-02 set up CORS, but the STATE.md decision [01-02] says "Sanity CORS origins include localhost and the Vercel domain" — this may already be done.
   - What's unclear: Whether credentials were enabled and whether the current Vercel domain matches.
   - Recommendation: Verify in Sanity manage dashboard before assuming it's done.

---

## Sources

### Primary (HIGH confidence)
- Codebase direct read — all files in `src/` and root config files read verbatim
- [authjs.dev/getting-started/deployment](https://authjs.dev/getting-started/deployment) — AUTH_SECRET required, AUTH_URL optional but needed on Next.js 16
- [authjs.dev/getting-started/migrating-to-v5](https://authjs.dev/getting-started/migrating-to-v5) — NEXTAUTH_* aliases
- [nextjs.org docs - proxy.ts convention](https://nextjs.org/docs/app/api-reference/file-conventions/proxy) — Next.js 16 renamed middleware.ts to proxy.ts
- [sanity.io/docs/cors](https://www.sanity.io/docs/cors) — CORS origins must include credentials for Studio

### Secondary (MEDIUM confidence)
- [GitHub issue #13388](https://github.com/nextauthjs/next-auth/issues/13388) — signIn server action fails with Configuration error on Next.js 16; opened 2026-03-02; workaround: set AUTH_URL
- [GitHub issue #13302](https://github.com/nextauthjs/next-auth/issues/13302) — next-auth peer dependency does not include Next.js 16; functionality works but peer dep warning
- [community.vercel.com ERR_INVALID_URL](https://community.vercel.com/t/err-invalid-url-possibly-linked-to-nextauth-v5/24925/4) — VERCEL_URL fallback doesn't prepend https://; fix is setting AUTH_URL explicitly

### Tertiary (LOW confidence — for awareness only)
- Multiple community sources confirm NEXTAUTH_SECRET is aliased to AUTH_SECRET in v5 beta

---

## Metadata

**Confidence breakdown:**
- Env var requirements: HIGH — official Auth.js docs and verified codebase
- signIn server action bug on Next.js 16: HIGH — live GitHub issue, fresh, confirmed reproducible
- Sanity CORS requirements: HIGH — official Sanity docs
- Token role requirements: MEDIUM — official Sanity role docs, but actual Vercel token state is unknown until inspected
- SanityLive production behavior: MEDIUM — multiple sources confirm no token needed for published content

**Research date:** 2026-03-02
**Valid until:** 2026-04-02 (30 days; Auth.js v5 beta may release fixes for issue #13388 in this window)
