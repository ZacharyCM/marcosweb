import { auth } from "@/auth"
import { NextResponse } from "next/server"

const PUBLIC_PATHS = ["/age-gate", "/privacy"]
const ASSET_PREFIXES = ["/_next", "/api", "/favicon.ico", "/studio"]

export const proxy = auth(function proxyHandler(req) {
  const { pathname } = req.nextUrl

  // Step 1: Always allow public/asset paths through
  if (
    PUBLIC_PATHS.some((p) => pathname.startsWith(p)) ||
    ASSET_PREFIXES.some((p) => pathname.startsWith(p))
  ) {
    return NextResponse.next()
  }

  // Step 2: Age gate — redirect if cookie missing
  if (!req.cookies.has("age-verified")) {
    return NextResponse.redirect(new URL("/age-gate", req.url))
  }

  // Step 3: Auth gate — auth() callback provides req.auth
  // Auth.js handles unauthenticated → /login and non-approved → /login?code=pending/denied
  // If no redirect needed, auth() returns undefined → Next.js continues
})

export const config = {
  // Match all routes EXCEPT: Next.js internals, static assets, favicon, and /studio
  // studio exclusion prevents Auth.js from blocking the Sanity Studio (owner is not a siteUser)
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|studio).*)"],
}
