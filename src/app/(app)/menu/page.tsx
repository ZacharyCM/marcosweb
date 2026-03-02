import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { logout } from "@/app/actions/auth"

export default async function MenuPage() {
  const session = await auth()

  // Double-check in the page itself — proxy.ts is the primary gate but defense in depth
  if (!session || session.user.status !== "approved") {
    redirect("/login")
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 p-8">
      <h1 className="text-2xl font-bold">Menu</h1>
      <p className="text-gray-600">
        Welcome, {session.user.name ?? session.user.email}. Product display coming in Phase 4.
      </p>
      <form action={logout}>
        <button type="submit" className="text-sm text-gray-500 underline">
          Sign out
        </button>
      </form>
    </main>
  )
}
