# Phase 1: Setup - Research

**Researched:** 2026-03-01
**Domain:** Next.js 15 App Router + Sanity Studio (embedded) + Tailwind CSS v4 + Vercel deployment
**Confidence:** HIGH

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**Framework**
- Next.js 15 with App Router (default for v15)
- TypeScript throughout

**Sanity integration**
- Embedded Studio via `next-sanity` at the `/studio` route
- New Sanity project (greenfield — no existing project)

**Deployment**
- Vercel with GitHub integration for auto-deploy on push to main
- Single production environment for v1

**Styling foundation**
- Tailwind CSS v4 set up in Phase 1 — Phase 4 needs it for the dark Netflix-style theme; installing it now avoids retrofitting later

**Home page placeholder**
- Minimal placeholder at `/` (e.g., project name + "Coming soon") — just enough to satisfy the success criterion that the home page renders without errors

**Environment variables**
- `.env.local` for local dev (gitignored)
- `.env.example` committed, documenting all required keys: `NEXT_PUBLIC_SANITY_PROJECT_ID`, `NEXT_PUBLIC_SANITY_DATASET`, `SANITY_API_TOKEN`, `NEXTAUTH_SECRET`, `NEXTAUTH_URL`
- Same vars added to Vercel project settings for production

### Claude's Discretion
- Exact Sanity dataset name (default: `production`)
- ESLint/Prettier configuration details
- Specific Next.js config options (image domains, etc.)

### Deferred Ideas (OUT OF SCOPE)
None — discussion stayed within phase scope
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| INFRA-01 | Site deployed and live on Vercel | Vercel GitHub integration, env var setup, and production deployment pattern documented in Architecture Patterns section |
| INFRA-02 | Sanity Studio embedded at `/studio` — owner accesses from the live site URL | `next-sanity` NextStudio component with catch-all route pattern, CORS configuration, and basePath setup documented in Standard Stack and Code Examples sections |
</phase_requirements>

---

## Summary

This phase scaffolds a greenfield Next.js 15 (App Router, TypeScript) project with Sanity Studio embedded at `/studio`, Tailwind CSS v4 installed, and the full stack deployed to Vercel. There is no prior codebase — everything starts from `npx create-next-app@latest`.

The critical insight is that the embedded studio requires three coordinated pieces: (1) a catch-all route `app/studio/[[...index]]/page.tsx` rendering `<NextStudio>`, (2) a `sanity.config.ts` at the project root with `basePath: "/studio"`, and (3) Sanity CORS origins configured to include both `http://localhost:3000` and the Vercel production domain. Missing any of these causes the studio to fail silently or produce authentication errors that are hard to diagnose after deployment.

Tailwind CSS v4 setup is straightforward in Next.js 15.2+: the `--tailwind` flag in `create-next-app` now generates a v4-compatible setup (PostCSS plugin, `@import "tailwindcss"` in globals.css). The project should be bootstrapped with this flag rather than manually adding Tailwind post-creation, to avoid postcss configuration drift.

**Primary recommendation:** Bootstrap with `npx create-next-app@latest --typescript --tailwind --eslint --app --src-dir`, then run `npx sanity@latest init` from within the project to auto-generate the Sanity configuration and environment variable files.

---

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| next | 15.x | React framework, App Router | Locked decision; v15 is current stable |
| react | 19.x | UI library | Peer dep of Next.js 15 |
| typescript | 5.x | Type safety | Locked decision |
| next-sanity | 12.x (latest) | Sanity client + embedded Studio + live preview utilities | Official Sanity toolkit for Next.js; exports `NextStudio`, `createClient`, `defineLive` |
| sanity | 3.x | Sanity Studio core | Required peer dep of next-sanity |
| tailwindcss | 4.x | Utility CSS | Locked decision; v4 is current; required for Phase 4 theme |
| @tailwindcss/postcss | 4.x | PostCSS plugin for Tailwind v4 | Replaces `tailwindcss` as PostCSS plugin in v4 |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| @sanity/image-url | ^1.0 | Generate Sanity image URLs | When rendering images from Sanity CDN in later phases |
| postcss | ^8 | CSS transformation pipeline | Required by Tailwind v4 PostCSS approach |
| eslint-config-next | 15.x | Next.js ESLint rules | Created automatically by create-next-app |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| `next-sanity` embedded studio | Separate standalone Sanity Studio deployment | Locked decision — embedded is required; standalone would mean separate URL, separate deploy |
| Tailwind v4 | Tailwind v3 | v4 is now default in create-next-app; no reason to use v3 on a new project |
| `npx create-next-app` bootstrap | Manual project scaffold | create-next-app sets up correct Next.js 15 config, TypeScript, and Tailwind v4 in one command |

**Installation:**
```bash
# Bootstrap project (Tailwind v4, TypeScript, App Router, src/ directory)
npx create-next-app@latest . --typescript --tailwind --eslint --app --src-dir

# Install Sanity into the existing Next.js project
npx sanity@latest init

# Install next-sanity and sanity packages
npm install next-sanity sanity
```

---

## Architecture Patterns

### Recommended Project Structure

```
project-root/
├── src/
│   ├── app/
│   │   ├── (app)/                    # Route group: all non-studio app routes
│   │   │   ├── layout.tsx            # App layout (Tailwind, shared UI)
│   │   │   └── page.tsx              # Home placeholder ("Coming soon")
│   │   └── studio/
│   │       └── [[...index]]/
│   │           └── page.tsx          # Catch-all: renders NextStudio
│   ├── sanity/
│   │   ├── env.ts                    # Export projectId, dataset, apiVersion
│   │   └── lib/
│   │       └── client.ts             # createClient() instance
│   └── styles/
│       └── globals.css               # @import "tailwindcss"
├── sanity.config.ts                  # Studio config with basePath: "/studio"
├── sanity.cli.ts                     # CLI config (projectId, dataset)
├── .env.local                        # Local secrets (gitignored)
├── .env.example                      # Committed template of all required keys
├── postcss.config.mjs                # @tailwindcss/postcss plugin
├── next.config.ts                    # Next.js config
└── tsconfig.json                     # TypeScript config
```

### Pattern 1: Route Groups to Isolate Studio from App

**What:** Use a `(app)` route group for all non-studio pages so the studio layout never inherits the app's `<html>`/`<body>` wrapper or Tailwind globals. The studio must receive the full browser viewport with no parent layout injecting extra DOM.

**When to use:** Always, when embedding Sanity Studio in Next.js App Router.

**Example:**
```typescript
// src/app/(app)/layout.tsx  — app layout with Tailwind globals
import "@/styles/globals.css";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
```

```typescript
// src/app/studio/[[...index]]/page.tsx
// Source: next-sanity docs (github.com/sanity-io/next-sanity)
"use client";

import { NextStudio } from "next-sanity/studio";
import config from "@/sanity.config";

export { metadata, viewport } from "next-sanity/studio";

export default function StudioPage() {
  return <NextStudio config={config} />;
}
```

**Why the `export { metadata, viewport }` matters:** next-sanity's built-in metadata disables search engine indexing and sets the correct mobile viewport for Studio. Without it, Studio can appear broken on mobile and gets indexed by Google.

### Pattern 2: sanity.config.ts with basePath

**What:** The `basePath` in `sanity.config.ts` MUST match the route where Studio is mounted. If it says `/studio`, Studio's internal links and auth redirects all prefix `/studio`. A mismatch causes blank screen or infinite redirect loops.

**Example:**
```typescript
// sanity.config.ts
// Source: freecodecamp.org/news/how-to-build-a-portfolio-site-with-sanity-and-nextjs/
import { defineConfig } from "sanity";
import { structureTool } from "sanity/structure";

export default defineConfig({
  name: "default",
  title: "Pure Pressure",
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || "production",
  basePath: "/studio",
  plugins: [structureTool()],
  schema: { types: [] }, // schemas added in Phase 2
});
```

**Note:** Use `structureTool` from `sanity/structure` — the old `deskTool` from `sanity/desk` is deprecated as of Sanity v3.20.0 and will be removed in a future major version.

### Pattern 3: Sanity Client in sanity/env.ts + sanity/lib/client.ts

**What:** Centralize all Sanity connection config in two files so every other file imports from one place.

**Example:**
```typescript
// src/sanity/env.ts
// Source: github.com/sanity-io/next-sanity README
export const apiVersion =
  process.env.NEXT_PUBLIC_SANITY_API_VERSION || "2024-07-11";
export const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET!;
export const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!;
```

```typescript
// src/sanity/lib/client.ts
import { createClient } from "next-sanity";
import { apiVersion, dataset, projectId } from "../env";

export const client = createClient({
  projectId,
  dataset,
  apiVersion,
  useCdn: true,
});
```

### Pattern 4: Environment Variables — Local and Vercel

**Local `.env.local` (gitignored):**
```bash
NEXT_PUBLIC_SANITY_PROJECT_ID=your_project_id
NEXT_PUBLIC_SANITY_DATASET=production
SANITY_API_TOKEN=your_read_token
NEXTAUTH_SECRET=your_secret_32_chars_min
NEXTAUTH_URL=http://localhost:3000
```

**Committed `.env.example` (documents all required keys):**
```bash
NEXT_PUBLIC_SANITY_PROJECT_ID=
NEXT_PUBLIC_SANITY_DATASET=production
SANITY_API_TOKEN=
NEXTAUTH_SECRET=
NEXTAUTH_URL=
```

**Vercel project settings:** Add the same keys under Settings > Environment Variables, scoped to Production (and Preview if needed). The `NEXTAUTH_URL` on Vercel should be the production domain (e.g., `https://marcosweb.vercel.app`). Note: In Auth.js v5, `NEXTAUTH_URL` is auto-detected on Vercel and may not be strictly required — verify this in Phase 3.

### Anti-Patterns to Avoid

- **Root layout wrapping studio:** Never put `<html>/<body>` in a parent layout that also wraps `/studio`. Studio injects its own full-screen DOM; double-wrapping causes styling breakage.
- **Hardcoding projectId/dataset in sanity.config.ts:** Use `process.env.NEXT_PUBLIC_SANITY_PROJECT_ID` so the same config file works in both local dev and production.
- **Using `deskTool` from `sanity/desk`:** Deprecated. Use `structureTool` from `sanity/structure`.
- **Forgetting `basePath` in sanity.config.ts:** Without it, Studio routes to `localhost:3333` internally even when mounted at `/studio`, causing broken navigation.
- **Adding Tailwind v4 manually after create-next-app:** The `--tailwind` flag in create-next-app@latest (15.2+) produces a correct v4 setup. Manual post-install requires careful postcss.config.mjs alignment.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Studio embedding in Next.js | Custom iframe or server component wrapper | `next-sanity` `NextStudio` component | Handles viewport meta, no-index robots, mobile layout, and React hydration edge cases |
| Sanity HTTP client | `fetch()` calls to Sanity API | `createClient` from `next-sanity` | Handles CDN, API versioning, auth headers, error normalization |
| CORS configuration | Custom proxy | Sanity project settings (manage.sanity.io) | Native platform feature; proxy adds latency and maintenance overhead |
| Secret generation | Custom randomness | `openssl rand -base64 32` or https://generate-secret.vercel.app/32 | Ensures cryptographic strength for `NEXTAUTH_SECRET` |

**Key insight:** The next-sanity package exists precisely to handle the non-obvious integration points between Next.js App Router's server/client boundaries and Sanity Studio's browser-only rendering requirements. Bypassing it introduces subtle hydration errors and CSP issues.

---

## Common Pitfalls

### Pitfall 1: CORS not configured for production domain

**What goes wrong:** The Sanity Studio at `https://yourdomain.vercel.app/studio` loads a blank white page or shows authentication errors after deployment. GROQ queries from the frontend return CORS blocked errors in the browser console.

**Why it happens:** Sanity's API defaults to allowing only `localhost:3333` (the default standalone Studio port) and the domain used during `sanity deploy`. When Studio is embedded in a Next.js app on a different domain, that domain is not automatically whitelisted.

**How to avoid:** Before deploying, add these CORS origins in Sanity project settings (manage.sanity.io > Project > API > CORS origins):
- `http://localhost:3000` — with credentials enabled (for local Studio auth)
- `https://yourdomain.vercel.app` — with credentials enabled (for production Studio auth)

**Warning signs:** Studio loads locally but shows blank or "Unauthorized" after Vercel deploy. Browser DevTools Network tab shows `403` or CORS blocked on `api.sanity.io` requests.

### Pitfall 2: Missing `basePath` or basePath mismatch

**What goes wrong:** Studio mounts at `/studio` but internal Studio navigation links point to the wrong URL, causing a 404 on any Studio page other than the root. Or Studio shows nothing because it redirects to `localhost:3333`.

**Why it happens:** Sanity Studio is a single-page app that manages its own routing. Without `basePath: "/studio"` in `sanity.config.ts`, Studio generates internal hrefs without the `/studio` prefix.

**How to avoid:** Always set `basePath` in `sanity.config.ts` to exactly match the Next.js route where Studio is mounted.

**Warning signs:** Clicking any item in the Studio sidebar causes a 404. The browser URL changes to `/studio/desk/...` but the page is blank.

### Pitfall 3: Studio rendered in a Server Component

**What goes wrong:** Build error: "You're importing a component that needs `useState`/browser APIs."

**Why it happens:** Sanity Studio is a browser-only React SPA. Next.js App Router defaults all components to Server Components. The `NextStudio` component uses browser APIs and React hooks that cannot run on the server.

**How to avoid:** Always add `"use client"` as the first line of `app/studio/[[...index]]/page.tsx`. This marks the entire subtree as client-rendered.

**Warning signs:** Build fails with hydration or `window is not defined` errors from the studio route.

### Pitfall 4: Parent layout injects `<html>/<body>` around Studio

**What goes wrong:** Studio appears with broken layout — doubled scrollbars, incorrect viewport, Tailwind base styles bleeding into Studio UI.

**Why it happens:** Studio needs to control the entire browser viewport. If a parent `layout.tsx` wraps it in an `<html><body>` element that also has Tailwind reset styles applied, both stylesheets conflict.

**How to avoid:** Use route groups: put app pages in `(app)/` with their layout, and keep the studio route `app/studio/` outside that group with no parent layout other than the root (which should be minimal or non-existent for the studio path).

**Warning signs:** Studio toolbar is cut off, fonts look wrong, or you see Tailwind typography styles appearing inside the Studio UI.

### Pitfall 5: Tailwind v4 PostCSS configuration wrong

**What goes wrong:** CSS classes don't apply. Build succeeds but styles are missing in dev and production.

**Why it happens:** Tailwind v4 requires `@tailwindcss/postcss` as the PostCSS plugin (not `tailwindcss` directly). Old tutorials show `require('tailwindcss')` in `postcss.config.js`, which doesn't work with v4.

**How to avoid:** Use `postcss.config.mjs` with `"@tailwindcss/postcss": {}`. Use `@import "tailwindcss"` in globals.css (not `@tailwind base; @tailwind components; @tailwind utilities`). The `--tailwind` flag in create-next-app@latest (15.2+) does this correctly automatically.

**Warning signs:** Tailwind classes produce no styling output. `npx tailwindcss --help` shows incorrect version.

### Pitfall 6: `NEXTAUTH_SECRET` missing from Vercel

**What goes wrong:** Phase 3 authentication will fail immediately in production with a cryptic "no secret" error even though auth works locally.

**Why it happens:** `NEXTAUTH_SECRET` is required in production but not in development (where Auth.js falls back to a dev default). Forgetting to add it to Vercel is a deployment-time mistake that surfaces only when auth is implemented.

**How to avoid:** Add `NEXTAUTH_SECRET` to Vercel project settings now in Phase 1, even though auth isn't implemented yet. Generate it with `openssl rand -base64 32`.

**Warning signs:** Auth.js v5 / NextAuth throws "No `secret` was set in your NextAuth.js configuration" in Vercel function logs.

---

## Code Examples

Verified patterns from official sources:

### Studio Catch-All Route Page

```typescript
// src/app/studio/[[...index]]/page.tsx
// Source: github.com/sanity-io/next-sanity (official README)
"use client";

import { NextStudio } from "next-sanity/studio";
import config from "@/sanity.config";

export { metadata, viewport } from "next-sanity/studio";

export default function StudioPage() {
  return <NextStudio config={config} />;
}
```

### sanity.config.ts (Phase 1 minimal — no schemas yet)

```typescript
// sanity.config.ts (project root)
// Source: freecodecamp.org/news/how-to-build-a-portfolio-site-with-sanity-and-nextjs/
//         + structureTool from sanity.io/docs/help/desk-is-now-structure
import { defineConfig } from "sanity";
import { structureTool } from "sanity/structure";

export default defineConfig({
  name: "default",
  title: "Pure Pressure",
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || "production",
  basePath: "/studio",
  plugins: [structureTool()],
  schema: { types: [] },
});
```

### Sanity Client

```typescript
// src/sanity/env.ts
// Source: github.com/sanity-io/next-sanity README
export const apiVersion =
  process.env.NEXT_PUBLIC_SANITY_API_VERSION || "2024-07-11";
export const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET!;
export const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!;
```

```typescript
// src/sanity/lib/client.ts
// Source: github.com/sanity-io/next-sanity README
import { createClient } from "next-sanity";
import { apiVersion, dataset, projectId } from "../env";

export const client = createClient({
  projectId,
  dataset,
  apiVersion,
  useCdn: true,
});
```

### Tailwind v4 PostCSS Config

```javascript
// postcss.config.mjs
// Source: tailwindcss.com/docs/guides/nextjs
const config = {
  plugins: {
    "@tailwindcss/postcss": {},
  },
};
export default config;
```

```css
/* src/styles/globals.css (or app/globals.css) */
/* Source: tailwindcss.com/docs/guides/nextjs */
@import "tailwindcss";
```

### Home Placeholder Page

```typescript
// src/app/(app)/page.tsx
export default function Home() {
  return (
    <main className="flex min-h-screen items-center justify-center">
      <h1 className="text-2xl font-bold">Pure Pressure — Coming Soon</h1>
    </main>
  );
}
```

### CORS Configuration via CLI

```bash
# Source: sanity.io/docs/cors
# Run from project root after sanity init
npx sanity@latest cors add http://localhost:3000 --credentials
npx sanity@latest cors add https://your-vercel-domain.vercel.app --credentials
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `deskTool` from `sanity/desk` | `structureTool` from `sanity/structure` | Sanity v3.20.0 (2024) | Old import still works but is deprecated; use new name to avoid future breaking change |
| `@tailwind base; @tailwind components; @tailwind utilities` directives | `@import "tailwindcss"` single import | Tailwind v4.0 (Jan 2025) | Old directives removed in v4; must use new import |
| `tailwindcss` as PostCSS plugin | `@tailwindcss/postcss` as PostCSS plugin | Tailwind v4.0 (Jan 2025) | Different package; old approach silently produces no output |
| Separate Sanity Studio app at `localhost:3333` | Embedded in Next.js app at `/studio` route | next-sanity v3+ (Sanity v3 era) | Studio lives at same domain, simplifying CORS and deployment |
| `tailwind.config.js` for configuration | CSS `@theme` directive in globals.css | Tailwind v4.0 (Jan 2025) | No JS config file needed; content scanning is automatic |
| Manual `npx sanity@latest init` after `create-next-app` | `create-next-app --tailwind` + `sanity init` in project | 2024-2025 | Still two commands, but both are well-supported |

**Deprecated/outdated:**
- `sanity/desk` (deskTool): Replaced by `sanity/structure` (structureTool) — still works but prints deprecation warning
- `@tailwind base/components/utilities` directives: Removed in Tailwind v4; replaced by single `@import`
- `next-sanity/studio/metadata` and `next-sanity/studio/viewport` as separate imports: Consolidated into `next-sanity/studio` in recent versions

---

## Open Questions

1. **Exact Sanity project ID and dataset name**
   - What we know: Dataset defaults to `production`; project ID is auto-generated by `sanity init`
   - What's unclear: Whether the user already has a Sanity account or needs to create one during `sanity init`
   - Recommendation: Run `npx sanity@latest init` interactively and create a new project; note the project ID for CORS configuration

2. **Vercel production domain / project name**
   - What we know: Vercel creates a domain at `{project-name}.vercel.app` on first deploy
   - What's unclear: Exact slug until first deploy happens
   - Recommendation: Deploy to Vercel first, then add the assigned domain to Sanity CORS origins in a follow-up task

3. **NEXTAUTH_URL behavior on Vercel with Auth.js v5**
   - What we know: Auth.js v5 (not yet used in Phase 1) auto-detects `VERCEL_URL` on Vercel and may not need `NEXTAUTH_URL`
   - What's unclear: Whether `NEXTAUTH_URL` in Vercel env vars causes conflicts with v5 auto-detection
   - Recommendation: Add `NEXTAUTH_URL` to `.env.example` as documented, but verify behavior in Phase 3 before setting it as a hard requirement

---

## Sources

### Primary (HIGH confidence)
- [github.com/sanity-io/next-sanity](https://github.com/sanity-io/next-sanity) — NextStudio component API, environment variables, client setup pattern, metadata/viewport exports
- [tailwindcss.com/docs/guides/nextjs](https://tailwindcss.com/docs/guides/nextjs) — Official Tailwind v4 + Next.js installation steps, postcss.config.mjs, @import syntax
- [sanity.io/docs/cors](https://www.sanity.io/docs/cors) — CORS origin configuration requirements, credential flag, management console steps
- [sanity.io/docs/help/desk-is-now-structure](https://www.sanity.io/docs/help/desk-is-now-structure) — structureTool migration from deskTool

### Secondary (MEDIUM confidence)
- [freecodecamp.org — Sanity + Next.js portfolio guide](https://www.freecodecamp.org/news/how-to-build-a-portfolio-site-with-sanity-and-nextjs/) — Verified catch-all route page.tsx code with NextStudio, sanity.config.ts with basePath
- [tailwindcss.com/blog/tailwindcss-v4](https://tailwindcss.com/blog/tailwindcss-v4) — v4 CSS-first config, @theme directive, automatic content detection
- [vercel.com/docs/projects/environment-variables](https://vercel.com/docs/projects/environment-variables) — Official Vercel env var scopes (Production/Preview/Development), .env.local behavior
- [next-auth.js.org/deployment](https://next-auth.js.org/deployment) — NEXTAUTH_SECRET requirement for production

### Tertiary (LOW confidence)
- WebSearch: next-sanity version 12.x (latest as of March 2026) — cross-verify with `npm view next-sanity version` before pinning

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — verified with official docs (Tailwind, Sanity, next-sanity GitHub, Vercel)
- Architecture: HIGH — route group pattern and catch-all studio route verified via official Sanity docs and next-sanity GitHub README; structureTool migration verified via official Sanity changelog
- Pitfalls: HIGH — CORS and basePath pitfalls verified via official Sanity docs; Tailwind v4 config pitfalls verified via official Tailwind docs; server component pitfall is a documented Next.js constraint

**Research date:** 2026-03-01
**Valid until:** 2026-04-01 (stable ecosystem — next-sanity, Next.js 15, and Tailwind v4 are all stable releases)
