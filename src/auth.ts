import NextAuth, { CredentialsSignin } from "next-auth"
import Credentials from "next-auth/providers/credentials"
import { authConfig } from "./auth.config"
import { z } from "zod"
import bcrypt from "bcryptjs"
import { sanityWriteClient } from "@/lib/sanity-write"

// Custom error classes — code property is surfaced to the login form via ?code= query param
class DeniedError extends CredentialsSignin {
  code = "denied"
}
class PendingError extends CredentialsSignin {
  code = "pending"
}

export const { auth, signIn, signOut, handlers } = NextAuth({
  ...authConfig,
  session: { strategy: "jwt", maxAge: 24 * 60 * 60 }, // 24-hour JWT — short enough that denied users are re-blocked on next login
  providers: [
    Credentials({
      async authorize(credentials) {
        // Validate input shape first — malformed credentials return null (no error thrown)
        const parsed = z
          .object({ email: z.string().email(), password: z.string().min(8) })
          .safeParse(credentials)

        if (!parsed.success) return null

        const { email, password } = parsed.data

        // Query Sanity for the siteUser by email — include passwordHash (server-only, write client)
        const user = await sanityWriteClient.fetch<{
          _id: string
          email: string
          name: string
          passwordHash: string
          status: string
        } | null>(
          `*[_type == "siteUser" && email == $email][0]{_id, email, name, passwordHash, status}`,
          { email }
        )

        if (!user || !user.passwordHash) return null

        const passwordsMatch = await bcrypt.compare(password, user.passwordHash)
        if (!passwordsMatch) return null

        // AUTH-06: Surface denied/pending states as distinct error codes — not generic auth errors
        if (user.status === "denied") throw new DeniedError()
        if (user.status === "pending") throw new PendingError()

        // Only 'approved' users reach here — return user object for JWT
        return {
          id: user._id,
          email: user.email,
          name: user.name,
          status: user.status,
        }
      },
    }),
  ],
  callbacks: {
    // AUTH-04: Extend JWT with id and status — re-fetch status on every validation
    // so admin status changes (denied/pending) take effect on the next request
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id as string
        token.status = user.status
      } else if (token.id) {
        const fresh = await sanityWriteClient.fetch<{ status: string } | null>(
          `*[_type == "siteUser" && _id == $id][0]{status}`,
          { id: token.id }
        )
        if (fresh) token.status = fresh.status
      }
      return token
    },
    // AUTH-04: Expose id and status on the session object for server components and actions
    session({ session, token }) {
      session.user.id = token.id
      session.user.status = token.status
      return session
    },
  },
})
