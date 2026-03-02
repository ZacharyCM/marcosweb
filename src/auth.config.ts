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
        if (isLoggedIn) {
          const status = auth?.user?.status
          // Denied users go to /login with code=denied so the message shows immediately
          if (status === "denied") {
            const url = new URL("/login", nextUrl)
            url.searchParams.set("code", "denied")
            return Response.redirect(url)
          }
          // Pending users go to /pending
          return Response.redirect(new URL("/pending", nextUrl))
        }
        return false // Unauthenticated — Auth.js redirects to pages.signIn (/login)
      }
      return true // All non-menu routes are public
    },
  },
  providers: [], // Populated in auth.ts — not here
} satisfies NextAuthConfig
