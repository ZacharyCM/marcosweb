import type { DefaultSession } from "next-auth"

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

declare module "@auth/core/jwt" {
  interface JWT {
    id: string
    status: string
  }
}
