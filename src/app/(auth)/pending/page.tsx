import { auth, signOut } from "@/auth"
import { redirect } from "next/navigation"

export default async function PendingPage() {
  const session = await auth()

  // No session — send to login
  if (!session) redirect("/login")

  // Approved — skip the waiting room, go straight to menu
  if (session.user.status === "approved") redirect("/menu")

  // Pending or denied — show the waiting message
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 p-8 text-center">
      <h1 className="text-2xl font-bold">Your account is pending approval</h1>
      <p className="max-w-sm text-gray-600">
        The dispensary owner will review your registration and approve your access.
        You will need to sign in again after your account is approved.
      </p>
      <form
        action={async () => {
          "use server"
          await signOut({ redirectTo: "/login" })
        }}
      >
        <button
          type="submit"
          className="rounded border border-gray-300 px-4 py-2 text-sm hover:bg-gray-50"
        >
          Sign out
        </button>
      </form>
    </main>
  )
}
