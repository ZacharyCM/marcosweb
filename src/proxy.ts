export { auth as proxy } from "@/auth"

export const config = {
  // Match all routes EXCEPT: Next.js internals, static assets, favicon, and /studio
  // studio exclusion prevents Auth.js from blocking the Sanity Studio (owner is not a siteUser)
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|studio).*)"],
}
