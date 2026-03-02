---
phase: 03-auth-gate
verified: 2026-03-02T00:00:00Z
status: human_needed
score: 17/17 must-haves verified
human_verification:
  - test: "End-to-end registration → approval → login → /menu flow"
    expected: "User registers at /register, lands on /pending, owner approves in Sanity Studio, user logs out, logs back in, lands on /menu"
    why_human: "Owner approval step requires manual action in Sanity Studio — cannot automate; E2E summary claims 6 tests passed but verifier cannot independently confirm live runtime behavior"
  - test: "Pending page sign-out destination"
    expected: "After clicking Sign out on /pending, user lands on /login (not /)"
    why_human: "The inline server action in pending/page.tsx uses redirectTo='/' (root), while logout() in actions/auth.ts uses redirectTo='/login'. The human E2E summary says sign-out from /pending lands on /login — but the code says '/'. Runtime may behave differently if Auth.js post-signout redirect overrides the inline value. Needs visual confirmation."
---

# Phase 3: Auth Gate Verification Report

**Phase Goal:** Implement a full authentication gate — registration, admin approval workflow, login, and route protection — so only approved users can access the menu.
**Verified:** 2026-03-02
**Status:** human_needed (all automated checks pass; 2 items flag for human confirmation)
**Re-verification:** No — initial verification

---

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | siteUser schema accepts passwordHash field | VERIFIED | `src/sanity/schemaTypes/siteUser.ts` line 33–38: defineField with name='passwordHash', hidden: true |
| 2 | passwordHash is hidden in Sanity Studio | VERIFIED | `hidden: true` present in field definition |
| 3 | Server-only Sanity write client exists and is importable | VERIFIED | `src/lib/sanity-write.ts`: `import "server-only"` guard + `export const sanityWriteClient` |
| 4 | TypeScript session types include id and status without errors | VERIFIED | `src/lib/auth-types.ts`: augments `next-auth` Session/User and `@auth/core/jwt` JWT |
| 5 | next-auth@beta, bcryptjs, and zod installed | VERIFIED | `package.json` dependencies: next-auth@^5.0.0-beta.30, bcryptjs@^3.0.3, zod@^4.3.6; devDeps: @types/bcryptjs@^2.4.6 |
| 6 | Credentials provider authorizes by querying Sanity + bcrypt compare + status check | VERIFIED | `src/auth.ts` lines 21–59: full authorize() with sanityWriteClient.fetch, bcrypt.compare, DeniedError/PendingError throws |
| 7 | JWT carries id and status; re-fetched on every token validation | VERIFIED | `src/auth.ts` lines 65–77: async jwt() re-fetches status from Sanity when no `user` object |
| 8 | Session persists across browser refresh (24h JWT) | VERIFIED | `src/auth.ts` line 18: `session: { strategy: "jwt", maxAge: 24 * 60 * 60 }` |
| 9 | Denied users get DeniedError code="denied"; pending get PendingError code="pending" | VERIFIED | `src/auth.ts` lines 9–14, 49–50: class definitions and throws |
| 10 | proxy.ts intercepts routes, gates /menu/**, excludes /studio and /api | VERIFIED | `src/proxy.ts`: matcher `/((?!api|_next/static|_next/image|favicon.ico|studio).*)` |
| 11 | GET and POST exported from auth API route | VERIFIED | `src/app/api/auth/[...nextauth]/route.ts`: `export const { GET, POST } = handlers` |
| 12 | Registration creates siteUser in Sanity with bcrypt hash and status=pending | VERIFIED | `src/app/actions/auth.ts` lines 35–52: bcrypt.hash(12) + sanityWriteClient.create + redirect('/pending') outside try/catch |
| 13 | Duplicate email returns field-level error without crashing | VERIFIED | `src/app/actions/auth.ts` lines 27–33: sanityWriteClient.fetch check + return { errors: { email: [...] } } |
| 14 | Login with approved credentials redirects to /menu | VERIFIED | `src/app/actions/auth.ts` line 71: signIn("credentials", { ..., redirectTo: "/menu" }) |
| 15 | Denied account shows "not approved" message; pending shows "pending approval" message | VERIFIED | `src/app/(auth)/login/login-form.tsx` lines 7–10: getErrorMessage maps code=denied and code=pending to correct strings |
| 16 | A newly registered user sees "pending approval" page and sign-out button | VERIFIED | `src/app/(auth)/pending/page.tsx`: renders message + form with signOut action |
| 17 | Approved user redirected from /pending to /menu | VERIFIED | `src/app/(auth)/pending/page.tsx` line 11: if status===approved → redirect("/menu") |

**Score:** 17/17 truths verified by code inspection

---

## Required Artifacts

| Artifact | Provides | Status | Details |
|----------|----------|--------|---------|
| `src/sanity/schemaTypes/siteUser.ts` | passwordHash field (hidden: true) | VERIFIED | Field present at line 33; hidden: true at line 37 |
| `src/lib/sanity-write.ts` | Server-only write client | VERIFIED | server-only import + sanityWriteClient export; SANITY_WRITE_TOKEN wired |
| `src/lib/auth-types.ts` | Auth.js v5 module augmentations | VERIFIED | Augments next-auth Session/User and @auth/core/jwt JWT |
| `src/auth.config.ts` | Edge-safe auth config | VERIFIED | Exports authConfig; pages.signIn="/login"; authorized callback with denied→/login?code=denied, pending→/pending |
| `src/auth.ts` | Full Auth.js config | VERIFIED | Exports auth, signIn, signOut, handlers; Credentials provider; DeniedError/PendingError; JWT re-fetch; session callbacks |
| `src/proxy.ts` | Route protection | VERIFIED | export { auth as proxy }; matcher excludes api/_next/favicon/studio |
| `src/app/api/auth/[...nextauth]/route.ts` | Auth.js API handler | VERIFIED | export const { GET, POST } = handlers |
| `src/app/actions/auth.ts` | register/login/logout server actions | VERIFIED | "use server"; all three exported; redirect outside try/catch; explicit redirectTo="/menu" on login |
| `src/app/(auth)/register/page.tsx` | Registration form | VERIFIED | "use client"; useActionState(register); name/email/password fields; field-level error display |
| `src/app/(auth)/login/page.tsx` | Login page (Server Component) | VERIFIED | Reads searchParams Promise; auth() session check; redirects approved users; passes error/code to LoginForm |
| `src/app/(auth)/login/login-form.tsx` | Login form (Client Component) | VERIFIED | "use client"; useActionState(login); getErrorMessage maps denied/pending/CredentialsSignin |
| `src/app/(auth)/pending/page.tsx` | Pending approval page | VERIFIED | auth() + redirect to /login (no session) + redirect to /menu (approved); sign-out form action |
| `src/app/(app)/menu/page.tsx` | Protected menu stub | VERIFIED | auth() + status check; defense-in-depth redirect; welcome message; logout() form action |

---

## Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| `src/proxy.ts` | `src/auth.ts` | export { auth as proxy } from '@/auth' | WIRED | Exact pattern present at line 1 |
| `src/auth.ts` | `src/lib/sanity-write.ts` | sanityWriteClient.fetch in authorize() | WIRED | sanityWriteClient imported line 6; used at lines 32 and 70 |
| `src/auth.ts` | bcryptjs | bcrypt.compare in authorize() | WIRED | bcrypt imported line 5; bcrypt.compare at line 45 |
| `src/app/api/auth/[...nextauth]/route.ts` | `src/auth.ts` | import { handlers } from '@/auth' | WIRED | handlers imported line 1; GET/POST exported line 2 |
| `src/app/(auth)/register/page.tsx` | `src/app/actions/auth.ts` | useActionState(register, undefined) | WIRED | register imported line 3; useActionState(register) at line 7 |
| `src/app/(auth)/login/login-form.tsx` | `src/app/actions/auth.ts` | useActionState(login, undefined) | WIRED | login imported line 3; useActionState(login) at line 20 |
| `src/app/actions/auth.ts` | `src/lib/sanity-write.ts` | sanityWriteClient.fetch() and .create() | WIRED | sanityWriteClient imported line 7; used at lines 27 and 39 |
| `src/app/actions/auth.ts` | `src/auth.ts` | signIn() and signOut() imports | WIRED | signIn, signOut imported line 6; used at lines 71 and 86 |
| `src/app/(auth)/pending/page.tsx` | `src/auth.ts` | auth() session check + signOut() form action | WIRED | auth and signOut imported line 1; auth() called line 5; signOut in form action line 24 |
| `src/app/(app)/menu/page.tsx` | `src/app/actions/auth.ts` | logout() form action | WIRED | logout imported line 3; used in form action line 19 |

---

## Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|-------------|-------------|-------------|--------|---------|
| AUTH-01 | 03-03 | User can register for an account with email and password | SATISFIED | register() server action + /register page: zod validation, bcrypt hash, sanityWriteClient.create, redirect to /pending |
| AUTH-02 | 03-04 | User sees "pending approval" page after registration — cannot access menu until owner approves | SATISFIED | /pending page: auth guards; proxy.ts authorized callback blocks non-approved from /menu; menu page defense-in-depth |
| AUTH-03 | 03-02 | User can log in with email and password | SATISFIED | Credentials provider in auth.ts: Sanity query + bcrypt.compare; login() server action; /login page + LoginForm |
| AUTH-04 | 03-02 | User session persists across browser refresh | SATISFIED | JWT strategy maxAge 24*60*60; jwt() + session() callbacks; status re-fetched from Sanity on every token validation |
| AUTH-05 | 03-01 | Owner can view pending accounts in Sanity Studio and mark as approved or denied | SATISFIED | siteUser schema: status field with radio layout (pending/approved/denied), initialValue='pending'; passwordHash hidden: true keeps Studio clean |
| AUTH-06 | 03-02, 03-03 | Denied user sees "your access was not approved" — not looped back to login | SATISFIED | DeniedError (code="denied") in auth.ts; auth.config.ts redirects denied users from /menu to /login?code=denied; LoginForm getErrorMessage maps code=denied to "Your access request was not approved. Please contact the dispensary." |

All 6 requirements (AUTH-01 through AUTH-06) are satisfied with no orphaned requirements. REQUIREMENTS.md traceability table marks all 6 as Complete for Phase 3.

---

## Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| `src/app/(auth)/pending/page.tsx` | 24 | `redirectTo: "/"` on sign-out | Info | Minor UX inconsistency: pending page sign-out goes to root (`/`) rather than `/login`. The `logout()` server action in actions/auth.ts correctly goes to `/login`. The human E2E verification summary claims sign-out from /pending lands on /login — this may be an Auth.js default override, a post-signout redirect that hits the root then gets redirected, or a documentation error. Does not block the auth gate goal. |
| `src/app/(app)/menu/page.tsx` | 17 | "Product display coming in Phase 4." stub text | Info | Intentional stub — Plan 04 explicitly specifies stub content acceptable. Phase 4 will replace with real product display. |

No blocker or warning anti-patterns found. All `return null` occurrences are guard clauses in the authorize() callback, not empty implementations.

---

## Human Verification Required

### 1. End-to-End Auth Gate Flow

**Test:** Follow the 6-scenario test plan from Plan 03-04:
1. Visit /register — submit name, email, password — expect redirect to /pending with "pending approval" message
2. While on /pending, navigate directly to /menu — expect redirect (blocked)
3. Open incognito, navigate to /menu — expect redirect to /login
4. In Sanity Studio, find the siteUser document and change Status to "Approved" — Publish
5. Sign out from /pending, log in at /login with the same credentials — expect redirect to /menu; refresh — still on /menu
6. Set a user to "Denied" in Studio, attempt login — expect "Your access request was not approved" on /login

**Expected:** All 6 scenarios produce the described outcomes without crashes or infinite redirect loops.

**Why human:** Owner approval requires manual interaction with Sanity Studio. Registration and session persistence involve runtime behavior (cookies, network requests to Sanity) that cannot be verified by static code inspection. The phase SUMMARY states all 6 tests passed — this verification confirms the code is correctly wired; a human should independently confirm the runtime behavior has not regressed.

---

### 2. Pending Page Sign-Out Destination

**Test:** Register a new user (creates a pending siteUser). Visit /pending. Click "Sign out".

**Expected:** Land on /login (not /).

**Why human:** The inline server action in `src/app/(auth)/pending/page.tsx` line 24 calls `signOut({ redirectTo: "/" })` (root), not `"/login"`. The logout() server action in actions/auth.ts uses `"/login"`. The SUMMARY (plan 03-04) states sign-out from /pending lands on /login — it is possible Auth.js overrides the redirectTo with its configured pages.signIn, or the root / is immediately redirected by proxy.ts to /login because the user is no longer authenticated. Either way, the intent (land on /login) may or may not hold at runtime. The code discrepancy is worth confirming and potentially correcting for consistency.

---

## Gaps Summary

No gaps found that block the phase goal. All artifacts exist, are substantive, and are correctly wired. The pending page sign-out destination discrepancy (`"/"` vs `"/login"`) is a minor UX inconsistency that does not break the auth gate but should be confirmed or corrected by a human. Stub content on /menu is intentional per the plan.

The phase goal — "Implement a full authentication gate — registration, admin approval workflow, login, and route protection — so only approved users can access the menu" — is achieved by the codebase as implemented.

---

## Commit Verification

All documented commits verified to exist in git history:

| Commit | Description |
|--------|-------------|
| `2a563eb` | feat(03-01): add passwordHash to siteUser schema and install auth packages |
| `bb3662c` | feat(03-01): create sanity-write.ts client, auth-types.ts augmentation, update .env.example |
| `968bcd3` | feat(03-02): create auth.config.ts and auth.ts (split config pattern) |
| `77f38ef` | feat(03-02): create proxy.ts and auth API route handler |
| `f64f718` | feat(03-03): create auth server actions (register, login, logout) |
| `4b196f0` | feat(03-03): create register page and login page + login-form component |
| `a1ae66a` | feat(03-04): create pending page and menu stub |
| `35488d4` | fix(03-04): apply post-task-1 bug fixes verified by E2E testing |

---

_Verified: 2026-03-02_
_Verifier: Claude (gsd-verifier)_
