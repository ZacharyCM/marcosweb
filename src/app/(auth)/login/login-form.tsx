"use client"
import { useActionState } from "react"
import { login } from "@/app/actions/auth"
import Link from "next/link"

function getErrorMessage(error?: string, code?: string): string | null {
  if (code === "denied") return "Your access request was not approved. Please contact the distribution."
  if (code === "pending") return "Your account is pending approval. Please check back later."
  if (error === "CredentialsSignin") return "Invalid email or password."
  return null
}

export default function LoginForm({
  error,
  code,
}: {
  error?: string
  code?: string
}) {
  const [state, action, pending] = useActionState(login, undefined)

  // Show action-returned error first; fall back to URL query param errors (from Auth.js redirect)
  const errorMessage = state?.error
    ? getErrorMessage(state.error, state.code)
    : getErrorMessage(error, code)

  return (
    <main className="flex min-h-screen items-center justify-center">
      <div className="w-full max-w-sm space-y-6 p-8">
        <h1 className="text-2xl font-bold">Sign In</h1>

        {errorMessage && (
          <p role="alert" className="rounded bg-red-50 px-4 py-3 text-sm text-red-700">
            {errorMessage}
          </p>
        )}

        <form action={action} className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium">Email</label>
            <input
              id="email"
              name="email"
              type="email"
              required
              autoComplete="email"
              className="mt-1 block w-full rounded border border-gray-300 px-3 py-2"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium">Password</label>
            <input
              id="password"
              name="password"
              type="password"
              required
              autoComplete="current-password"
              minLength={8}
              className="mt-1 block w-full rounded border border-gray-300 px-3 py-2"
            />
          </div>

          <button
            type="submit"
            disabled={pending}
            className="w-full rounded bg-black py-2 text-white disabled:opacity-50"
          >
            {pending ? "Signing in..." : "Sign In"}
          </button>
        </form>

        <p className="text-center text-sm">
          Need access?{" "}
          <Link href="/register" className="underline">Request an account</Link>
        </p>
      </div>
    </main>
  )
}
