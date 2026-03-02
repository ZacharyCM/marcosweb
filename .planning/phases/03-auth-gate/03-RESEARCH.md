# Phase 3: Auth Gate - Research

**Researched:** 2026-03-02
**Domain:** Authentication, session management, route protection — Auth.js v5 (next-auth@beta) + Sanity CMS as user store + Next.js 16 proxy.ts
**Confidence:** HIGH (core patterns verified via official Next.js 16 docs and authjs.dev)

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| AUTH-01 | User can register for an account with email and password | Registration server action writes siteUser doc to Sanity with `bcrypt`-hashed password; `SANITY_WRITE_TOKEN` with Editor role required |
| AUTH-02 | User sees a "pending approval" page after registration — cannot access menu until owner approves | After registration, redirect to `/pending`; proxy.ts checks `session.user.status !== 'approved'` and blocks `/menu/**` |
| AUTH-03 | User can log in with email and password | Auth.js Credentials provider — `authorize()` queries Sanity for siteUser by email, compares bcrypt hash, returns user object |
| AUTH-04 | User session persists across browser refresh (user stays logged in) | JWT strategy in Auth.js — encrypted cookie with 30-day maxAge; proxy.ts session check on every request keeps session alive |
| AUTH-05 | Owner can view all pending accounts in Sanity Studio and mark each as approved or denied | `status` field already in `siteUser` schema (pending/approved/denied) with radio UI; owner edits in Studio at `/studio` |
| AUTH-06 | Denied user sees a clear "your access was not approved" message instead of being looped to login | Custom `CredentialsSignin` subclass throws code `"denied"` when status === 'denied'; login form reads `?code=denied` param and displays message |
</phase_requirements>

---

## Summary

Phase 3 implements the full authentication gate for Pure Pressure. The project is already on Next.js 16.1.6, which uses `proxy.ts` (not `middleware.ts`) for request interception. Auth.js v5 (`next-auth@beta`) is the current standard for Next.js App Router credential-based auth — it remains in beta but is widely used in production and is the library the project's `.env.example` already references with `NEXTAUTH_SECRET`.

The Sanity `siteUser` schema (already defined in Phase 2) stores `email`, `name`, and `status` (pending/approved/denied). Auth.js will NOT use a database adapter — instead, the `authorize()` callback queries Sanity directly for the user, compares the bcrypt-hashed password, and checks the approval status before issuing a session. The JWT token is extended to carry `status` so proxy.ts can gate `/menu/**` without a Sanity round-trip on every request.

The critical architecture decision is the **split config pattern**: `auth.config.ts` (edge-safe, no Node.js APIs) is imported by `proxy.ts`; `auth.ts` (full config with bcrypt + Sanity queries) is used in server actions and server components. This was required in Next.js 15 to avoid edge runtime errors, but in Next.js 16, `proxy.ts` runs on Node.js runtime, making the split optional — however the split is still recommended practice to keep proxy.ts lightweight. The session staleness tradeoff (JWT status cached in cookie vs. real-time Sanity lookup) must be understood: a denied user's session token will remain valid until expiry unless the token is explicitly invalidated or the session maxAge is kept short.

**Primary recommendation:** Use Auth.js v5 (`next-auth@beta`) with the Credentials provider, JWT strategy, no database adapter. Store password hashes in Sanity `siteUser` documents. Extend the JWT with `status` and `sanityId` fields. Gate `/menu/**` via `proxy.ts` checking `session.user.status === 'approved'`. Use custom `CredentialsSignin` subclasses to surface "pending" vs "denied" states to the login form.

---

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| next-auth | @beta (v5.x) | Authentication, session management, JWT | Official Next.js auth library; already referenced in .env.example; App Router native |
| bcryptjs | ^2.4.3 | Password hashing (registration) and comparison (login) | Pure JS bcrypt — no native binaries, works everywhere including Vercel; `bcrypt` (native) causes Vercel build issues |
| zod | ^3.x | Server-side form validation in server actions | Already ecosystem standard; catches bad input before Sanity write |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| @sanity/client | (already installed via `sanity` pkg) | Server-side Sanity mutations with write token | Registration action — creating siteUser documents; lookup in authorize() |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| next-auth@beta | Better Auth | Better Auth is now the recommended successor per the Auth.js team announcement; but next-auth@beta is the existing project choice and already in .env.example — do not switch |
| bcryptjs | bcrypt (native) | bcrypt (native) causes Vercel serverless build failures with native binaries; bcryptjs is pure JS and deploys without issues |
| Custom session cookies | next-auth JWT strategy | Custom cookies require manual CSRF protection, signing, rotation — Auth.js handles all of this correctly |
| Auth.js Sanity adapter (next-auth-sanity) | Direct Sanity queries in authorize() | next-auth-sanity targets v4 patterns and v5 compatibility is unconfirmed; direct queries in authorize() are simpler and give full control |

**Installation:**
```bash
npm install next-auth@beta bcryptjs zod
npm install --save-dev @types/bcryptjs
```

---

## Architecture Patterns

### Recommended Project Structure

```
src/
├── auth.config.ts           # Edge-safe config (pages, authorized callback shape) — imported by proxy.ts
├── auth.ts                  # Full auth config (Credentials provider, jwt/session callbacks, bcrypt)
├── proxy.ts                 # Route protection — export { auth as proxy } from "@/auth"
├── app/
│   ├── (auth)/              # Auth route group (no shared layout needed)
│   │   ├── login/
│   │   │   └── page.tsx     # Login form — reads ?error and ?code query params
│   │   ├── register/
│   │   │   └── page.tsx     # Registration form
│   │   └── pending/
│   │       └── page.tsx     # "Pending approval" page — shown after registration
│   ├── (app)/               # Existing app route group
│   │   └── menu/            # Protected — proxy.ts blocks non-approved users
│   │       └── page.tsx
│   ├── api/
│   │   └── auth/
│   │       └── [...nextauth]/
│   │           └── route.ts # Auth.js API route handler
│   └── actions/
│       └── auth.ts          # Server actions: register(), login(), logout()
├── lib/
│   ├── sanity-write.ts      # Server-only Sanity client with write token
│   └── auth-types.ts        # TypeScript module augmentation for session types
```

### Pattern 1: Split Config (proxy.ts + auth.ts)

**What:** Two auth config files — `auth.config.ts` for edge-compatible settings, `auth.ts` for the full Credentials provider with bcrypt.
**When to use:** Always in this project. Keeps proxy.ts import clean and separates edge concerns.

```typescript
// Source: https://authjs.dev/getting-started/migrating-to-v5
// auth.config.ts — edge-safe, no Node.js APIs
import type { NextAuthConfig } from "next-auth"

export const authConfig = {
  pages: {
    signIn: "/login",
  },
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user
      const isMenuRoute = nextUrl.pathname.startsWith("/menu")
      const isApproved = auth?.user?.status === "approved"

      if (isMenuRoute) {
        if (isLoggedIn && isApproved) return true
        if (isLoggedIn && !isApproved) {
          // Redirect pending/denied users away from menu
          return Response.redirect(new URL("/pending", nextUrl))
        }
        return false // Redirect unauthenticated to /login
      }
      return true
    },
  },
  providers: [], // populated in auth.ts
} satisfies NextAuthConfig
```

```typescript
// Source: https://authjs.dev/getting-started/providers/credentials
// auth.ts — full config with bcrypt + Sanity
import NextAuth, { CredentialsSignin } from "next-auth"
import Credentials from "next-auth/providers/credentials"
import { authConfig } from "./auth.config"
import { z } from "zod"
import bcrypt from "bcryptjs"
import { sanityWriteClient } from "@/lib/sanity-write"

class DeniedError extends CredentialsSignin {
  code = "denied"
}
class PendingError extends CredentialsSignin {
  code = "pending"
}

export const { auth, signIn, signOut, handlers } = NextAuth({
  ...authConfig,
  session: { strategy: "jwt" },
  providers: [
    Credentials({
      async authorize(credentials) {
        const parsed = z
          .object({ email: z.string().email(), password: z.string().min(8) })
          .safeParse(credentials)

        if (!parsed.success) return null

        const { email, password } = parsed.data

        // Query Sanity for the siteUser by email
        const user = await sanityWriteClient.fetch(
          `*[_type == "siteUser" && email == $email][0]{_id, email, name, passwordHash, status}`,
          { email }
        )

        if (!user || !user.passwordHash) return null

        const passwordsMatch = await bcrypt.compare(password, user.passwordHash)
        if (!passwordsMatch) return null

        if (user.status === "denied") throw new DeniedError()
        if (user.status === "pending") throw new PendingError()

        // Only 'approved' users reach here
        return { id: user._id, email: user.email, name: user.name, status: user.status }
      },
    }),
  ],
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.status = user.status
      }
      return token
    },
    session({ session, token }) {
      session.user.id = token.id as string
      session.user.status = token.status as string
      return session
    },
  },
})
```

### Pattern 2: proxy.ts Route Protection

**What:** Export Auth.js `auth` as `proxy` — runs on every request, gates `/menu/**`.
**When to use:** This is the sole route protection layer. Auth.js `authorized` callback handles the redirect logic.

```typescript
// Source: https://nextjs.org/docs/app/getting-started/proxy (Next.js 16 docs)
// proxy.ts — at project root (or src/ if using src/ directory)
export { auth as proxy } from "@/auth"

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|studio).*)"],
}
```

Note: `middleware.ts` is deprecated in Next.js 16. The file is `proxy.ts` and the exported function must be named `proxy` (or default export). Next.js 16 proxy runs on Node.js runtime — no edge constraints.

### Pattern 3: Registration Server Action

**What:** Server action that validates input, checks for duplicate email, hashes password, creates Sanity document, then redirects to `/pending`.
**When to use:** Registration form submission.

```typescript
// app/actions/auth.ts
"use server"
import { z } from "zod"
import bcrypt from "bcryptjs"
import { redirect } from "next/navigation"
import { sanityWriteClient } from "@/lib/sanity-write"

const RegisterSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(8),
})

export async function register(prevState: unknown, formData: FormData) {
  const parsed = RegisterSchema.safeParse(Object.fromEntries(formData))
  if (!parsed.success) {
    return { errors: parsed.error.flatten().fieldErrors }
  }

  const { name, email, password } = parsed.data

  // Check for duplicate email
  const existing = await sanityWriteClient.fetch(
    `*[_type == "siteUser" && email == $email][0]._id`,
    { email }
  )
  if (existing) {
    return { errors: { email: ["An account with this email already exists."] } }
  }

  const passwordHash = await bcrypt.hash(password, 12)

  await sanityWriteClient.create({
    _type: "siteUser",
    name,
    email,
    passwordHash,
    status: "pending",
  })

  redirect("/pending")
}
```

### Pattern 4: Sanity Write Client (server-only)

**What:** A separate Sanity client configured with a write token, marked server-only.
**When to use:** All mutations — registration creates siteUser doc, authorize() reads it.

```typescript
// Source: https://www.sanity.io/answers/how-to-securely-send-requests-to-sanity-in-a-next-js-app-using-api-routes-
// lib/sanity-write.ts
import "server-only"
import { createClient } from "next-sanity"
import { apiVersion, dataset, projectId } from "@/sanity/env"

export const sanityWriteClient = createClient({
  projectId,
  dataset,
  apiVersion,
  useCdn: false, // Always fetch fresh data for auth operations
  token: process.env.SANITY_WRITE_TOKEN, // Editor role token — NOT NEXT_PUBLIC_
})
```

### Pattern 5: TypeScript Session Augmentation

**What:** Extend Auth.js types to include `status` and `id` on the session user.
**When to use:** Required to avoid TypeScript errors when reading `session.user.status`.

```typescript
// lib/auth-types.ts  (or next-auth.d.ts at project root)
import { DefaultSession } from "next-auth"

declare module "next-auth" {
  interface Session {
    user: {
      id: string
      status: string
    } & DefaultSession["user"]
  }
  interface User {
    status: string
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string
    status: string
  }
}
```

### Pattern 6: Sanity Schema — passwordHash Field Addition

**What:** The existing `siteUser` schema omits `passwordHash`. This field must be added to store credentials. It should NOT be visible in Studio (owner should not see or edit raw hashes).

```typescript
// Add to siteUser.ts
defineField({
  name: "passwordHash",
  title: "Password Hash",
  type: "string",
  hidden: true, // Hidden in Studio — owner never sees this field
})
```

### Anti-Patterns to Avoid

- **Protecting routes only in layout.tsx**: Next.js layouts do not re-render on navigation. Use proxy.ts for all route-level protection — layouts are for UI only.
- **Using bcrypt (native) instead of bcryptjs**: Native bcrypt triggers Vercel build failures. Always use `bcryptjs`.
- **Exposing SANITY_WRITE_TOKEN with NEXT_PUBLIC_ prefix**: Write tokens must only exist as server-side env vars. Never prefix with NEXT_PUBLIC_.
- **Checking status only in proxy.ts**: The proxy is an optimistic layer. Server components rendering `/menu/**` content should also verify `session.user.status === 'approved'` close to the data fetch.
- **Storing plaintext passwords**: Always hash with `bcrypt.hash(password, 12)` before writing to Sanity. Never store the raw password.
- **Relying on `middleware.ts` in Next.js 16**: It is deprecated. Use `proxy.ts` with a named `proxy` export or default export.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| JWT signing/verification | Custom JOSE implementation | Auth.js JWT strategy | CSRF, rotation, secret management all handled; edge cases are catastrophic |
| Password hashing | Custom hash function | bcryptjs | bcrypt is the standard for password hashing — salt rounds, timing attack resistance |
| CSRF protection | Token in hidden input | Server Actions (built-in) | Next.js Server Actions have CSRF protection by design |
| Session cookie management | Manual cookie set/read | Auth.js session | HttpOnly, Secure, SameSite, expiry all handled correctly |
| Form validation | Manual string checks | Zod safeParse | Schema validation catches all edge cases and gives typed results |

**Key insight:** Authentication has catastrophic failure modes. Every component above has years of security hardening. The only custom logic this phase should write is: Sanity lookups, status checking, and UI.

---

## Common Pitfalls

### Pitfall 1: JWT Status Staleness

**What goes wrong:** Owner approves a user in Sanity Studio, but the user's JWT still contains `status: 'pending'` and they are still blocked from `/menu`. They must log out and back in to refresh the token.
**Why it happens:** JWT strategy bakes `status` into the token at sign-in. The token is not re-fetched on every request.
**How to avoid:** Document this behavior clearly. For this app (low traffic, owner contacts users directly), the tradeoff is acceptable. If real-time revocation is needed, the JWT callback can be modified to re-query Sanity on each token refresh — but this adds latency.
**Warning signs:** Approved user still seeing `/pending` after approval without logging out.

### Pitfall 2: Auth.js redirect() in Server Actions

**What goes wrong:** `redirect()` from `next/navigation` throws an error that looks like an exception, but is actually the redirect mechanism. If you wrap your server action in a try/catch that catches everything, you'll catch the redirect and swallow it.
**Why it happens:** Next.js `redirect()` internally throws a special `NEXT_REDIRECT` error.
**How to avoid:** Never call `redirect()` inside a try/catch block. Call it after the try/catch.

```typescript
// WRONG
export async function register(_, formData: FormData) {
  try {
    await sanityWriteClient.create(...)
    redirect("/pending") // caught by catch!
  } catch (e) {
    return { error: "failed" }
  }
}

// CORRECT
export async function register(_, formData: FormData) {
  try {
    await sanityWriteClient.create(...)
  } catch (e) {
    return { error: "failed" }
  }
  redirect("/pending") // outside try/catch
}
```

### Pitfall 3: signIn() throws on redirect — not an error

**What goes wrong:** The `signIn()` call in a login server action throws an error when it redirects on success. Wrapping it in try/catch incorrectly treats a successful redirect as an error.
**Why it happens:** Auth.js `signIn()` uses `redirect()` internally on success.
**How to avoid:** Only catch `AuthError` subclasses. Let the redirect propagate.

```typescript
export async function login(_, formData: FormData) {
  try {
    await signIn("credentials", formData)
  } catch (error) {
    if (error instanceof AuthError) {
      return { error: error.type, code: (error as any).code }
    }
    throw error // Re-throw non-auth errors (including redirect)
  }
}
```

### Pitfall 4: siteUser schema missing passwordHash

**What goes wrong:** The existing `siteUser` schema has no `passwordHash` field. Registration will fail silently or the hash will be dropped by Sanity's schema validation.
**Why it happens:** Phase 2 deliberately deferred this decision (noted in STATE.md: "siteUser omits passwordHash — Phase 3 research will determine if Auth.js stores credentials separately or Sanity holds them").
**How to avoid:** Add `passwordHash` field (type: string, hidden: true) to `siteUser` schema as the first task of this phase.

### Pitfall 5: Sanity Viewer Token Can't Write

**What goes wrong:** Registration fails with "Insufficient permissions" when trying to create a siteUser document.
**Why it happens:** The existing `SANITY_API_TOKEN` was scoped to Viewer role (read-only) per Phase 1 decision. Write operations need Editor role.
**How to avoid:** Create a new Sanity API token with Editor role. Store as `SANITY_WRITE_TOKEN` (server-only, no NEXT_PUBLIC_ prefix). Use this only in `lib/sanity-write.ts`. Keep the Viewer token for read operations.

### Pitfall 6: proxy.ts matcher including /studio

**What goes wrong:** Proxy.ts runs on the `/studio` route and Auth.js `authorized` callback blocks the Sanity Studio because the owner isn't a "siteUser" with approved status.
**Why it happens:** The matcher catches all routes without exceptions.
**How to avoid:** Add `studio` to the matcher exclusion list.

```typescript
export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|studio).*)"],
}
```

### Pitfall 7: next-auth@beta breaking changes

**What goes wrong:** Installing next-auth@beta pulls a version with a breaking change not in the docs.
**Why it happens:** The library is in beta — the API can shift between beta versions.
**How to avoid:** Pin the exact version after installation (`npm install next-auth@beta` — then lock what version you got in package.json). Check the Auth.js changelog before upgrading.

---

## Code Examples

Verified patterns from official sources:

### Auth.js API Route Handler

```typescript
// Source: https://authjs.dev/reference/nextjs
// app/api/auth/[...nextauth]/route.ts
import { handlers } from "@/auth"
export const { GET, POST } = handlers
```

### Login Form with Error Display

```typescript
// Source: https://nextjs.org/docs/app/guides/authentication
// app/(auth)/login/page.tsx (Server Component)
import { auth } from "@/auth"
import { redirect } from "next/navigation"
import LoginForm from "./login-form"

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; code?: string }>
}) {
  const session = await auth()
  if (session?.user?.status === "approved") redirect("/menu")

  const { error, code } = await searchParams
  return <LoginForm error={error} code={code} />
}
```

```typescript
// app/(auth)/login/login-form.tsx ("use client")
"use client"
import { useActionState } from "react"
import { login } from "@/app/actions/auth"

function getErrorMessage(error?: string, code?: string): string | null {
  if (code === "denied") return "Your access request was not approved."
  if (code === "pending") return "Your account is pending approval. Please check back later."
  if (error === "CredentialsSignin") return "Invalid email or password."
  return null
}

export default function LoginForm({ error, code }: { error?: string; code?: string }) {
  const [state, action, pending] = useActionState(login, undefined)
  const errorMessage = state?.error
    ? getErrorMessage(state.error, state.code)
    : getErrorMessage(error, code)

  return (
    <form action={action}>
      {errorMessage && <p role="alert">{errorMessage}</p>}
      <input name="email" type="email" required />
      <input name="password" type="password" required />
      <button disabled={pending}>Log in</button>
    </form>
  )
}
```

### Pending Page (Server Component — blocks if user is approved)

```typescript
// app/(auth)/pending/page.tsx
import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { signOut } from "@/auth"

export default async function PendingPage() {
  const session = await auth()

  // If no session, send to login
  if (!session) redirect("/login")

  // If somehow approved, send to menu
  if (session.user.status === "approved") redirect("/menu")

  return (
    <main>
      <h1>Your account is pending approval</h1>
      <p>The owner will review your registration and approve your access.</p>
      <form action={async () => { "use server"; await signOut({ redirectTo: "/" }) }}>
        <button type="submit">Sign out</button>
      </form>
    </main>
  )
}
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `middleware.ts` with Edge runtime | `proxy.ts` with Node.js runtime | Next.js 16 (Oct 2025) | No more edge/Node split — bcrypt can run anywhere; file renamed, export renamed |
| `getServerSession(authOptions)` | `auth()` from `@/auth` | Auth.js v5 | Single function works in Server Components, Actions, Route Handlers |
| `withAuth()` middleware wrapper | Auth.js `authorized` callback | Auth.js v5 | Cleaner integration — no separate middleware wrapper needed |
| Split `auth.config.ts` + `auth.ts` for edge compat | Still recommended but not required in Next.js 16 | Next.js 16 | Edge split was required in Next.js 14/15; proxy.ts is Node.js in 16, so the split is now optional but still good practice |
| `useFormStatus` for pending state | `useActionState` (React 19) | React 19 | `useActionState` replaces `useFormState` and integrates pending state |

**Deprecated/outdated:**
- `middleware.ts` filename: deprecated in Next.js 16. Rename to `proxy.ts`, export named `proxy` or default export.
- `NEXTAUTH_URL` env var: Auth.js v5 uses `AUTH_URL` instead. However, since `.env.example` already uses `NEXTAUTH_URL`, verify if the beta version being installed respects both. Check the installed version's docs.

---

## Open Questions

1. **Exact next-auth@beta version to pin**
   - What we know: next-auth@beta exists; the Auth.js project transferred to Better Auth but is still maintained
   - What's unclear: Whether the most recent beta has any breaking API changes from what the docs show
   - Recommendation: Run `npm install next-auth@beta` and immediately pin the exact version. Check `npm info next-auth@beta version` before installing.

2. **AUTH_URL vs NEXTAUTH_URL in next-auth@beta**
   - What we know: Auth.js v5 officially renamed the env var to `AUTH_URL`; `.env.example` uses `NEXTAUTH_URL`
   - What's unclear: Whether current beta still accepts `NEXTAUTH_URL` as a fallback
   - Recommendation: Add both to `.env.example` and `.env.local`. Check the installed version's startup logs — Auth.js will warn if required env vars are missing.

3. **NEXTAUTH_SECRET vs AUTH_SECRET**
   - What we know: Auth.js v5 uses `AUTH_SECRET`; the project's `.env.example` has `NEXTAUTH_SECRET`
   - What's unclear: Same fallback question as above
   - Recommendation: Rename `NEXTAUTH_SECRET` to `AUTH_SECRET` in `.env.example` and Vercel settings when starting this phase. Generate with `openssl rand -base64 32`.

4. **JWT status staleness — acceptable for this use case?**
   - What we know: JWT strategy caches status in the token for 30 days by default; owner contacts users directly per REQUIREMENTS.md (no email notifications)
   - What's unclear: Whether the client expects near-real-time revocation
   - Recommendation: For now, short `maxAge` (e.g., 24 hours) is a reasonable compromise. Denied users will be re-blocked on next login attempt. Document the behavior.

---

## Sources

### Primary (HIGH confidence)
- https://nextjs.org/docs/app/getting-started/proxy — Next.js 16.1.6 official proxy.ts docs (checked 2026-03-02)
- https://nextjs.org/docs/app/guides/authentication — Next.js 16.1.6 official auth guide (checked 2026-03-02)
- https://nextjs.org/blog/next-16 — Next.js 16 release notes confirming proxy.ts + Node.js runtime
- https://authjs.dev/getting-started/providers/credentials — Auth.js v5 Credentials provider docs
- https://authjs.dev/getting-started/migrating-to-v5 — Auth.js v5 migration guide, split config pattern
- https://authjs.dev/guides/extending-the-session — JWT + session callback custom field pattern
- https://authjs.dev/reference/nextjs — Auth.js Next.js reference
- `/src/sanity/schemaTypes/siteUser.ts` — existing schema (email, name, status fields confirmed)
- `/package.json` — Next.js 16.1.6, React 19.2.3, no next-auth installed yet

### Secondary (MEDIUM confidence)
- https://nextjs.org/learn/dashboard-app/adding-authentication — Official Next.js auth tutorial with complete code examples
- https://www.sanity.io/answers/how-to-securely-send-requests-to-sanity-in-a-next-js-app-using-api-routes- — Sanity write token pattern
- https://github.com/nextauthjs/next-auth/discussions/13252 — Auth.js now maintained by Better Auth team confirmation

### Tertiary (LOW confidence)
- https://www.bswanson.dev/blog/nextauth-oauth-passing-errors-to-the-client/ — Custom error code pattern (community blog, referenced against official CredentialsSignin extension pattern)

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — next-auth@beta is the documented choice; bcryptjs vs bcrypt is verified community knowledge (Vercel native binary issue is well-documented); both confirmed in authjs.dev official docs
- Architecture: HIGH — split config and proxy.ts patterns are from Next.js 16 official docs; siteUser schema is verified from source code
- Pitfalls: HIGH for redirect() pitfall (Next.js docs), MEDIUM for staleness (known JWT limitation, documented in Auth.js discussions), HIGH for Studio matcher exclusion (proxy.ts docs), HIGH for passwordHash missing field (STATE.md explicit note)

**Research date:** 2026-03-02
**Valid until:** 2026-04-02 (Auth.js beta moves fast — verify next-auth@beta version before starting)
