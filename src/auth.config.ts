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
          // Pending or denied users hit /menu — redirect them to /pending
          return Response.redirect(new URL("/pending", nextUrl))
        }
        return false // Unauthenticated — Auth.js redirects to pages.signIn (/login)
      }
      return true // All non-menu routes are public
    },
  },
  providers: [], // Populated in auth.ts — not here
} satisfies NextAuthConfig
