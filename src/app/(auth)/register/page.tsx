"use client"
import { useActionState } from "react"
import { register } from "@/app/actions/auth"
import Link from "next/link"

export default function RegisterPage() {
  const [state, action, pending] = useActionState(register, undefined)

  return (
    <main className="flex min-h-screen items-center justify-center">
      <div className="w-full max-w-sm space-y-6 p-8">
        <h1 className="text-2xl font-bold">Request Access</h1>
        <p className="text-sm text-gray-600">
          Create an account to request access to the menu. The owner will review and approve your request.
        </p>

        {state?.error && (
          <p role="alert" className="text-sm text-red-600">{state.error}</p>
        )}

        <form action={action} className="space-y-4">
          <div>
            <label htmlFor="name" className="block text-sm font-medium">Name</label>
            <input
              id="name"
              name="name"
              type="text"
              required
              minLength={2}
              className="mt-1 block w-full rounded border border-gray-300 px-3 py-2"
            />
            {state?.errors?.name && (
              <p className="mt-1 text-xs text-red-600">{state.errors.name[0]}</p>
            )}
          </div>

          <div>
            <label htmlFor="email" className="block text-sm font-medium">Email</label>
            <input
              id="email"
              name="email"
              type="email"
              required
              className="mt-1 block w-full rounded border border-gray-300 px-3 py-2"
            />
            {state?.errors?.email && (
              <p className="mt-1 text-xs text-red-600">{state.errors.email[0]}</p>
            )}
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium">Password</label>
            <input
              id="password"
              name="password"
              type="password"
              required
              minLength={8}
              className="mt-1 block w-full rounded border border-gray-300 px-3 py-2"
            />
            {state?.errors?.password && (
              <p className="mt-1 text-xs text-red-600">{state.errors.password[0]}</p>
            )}
          </div>

          <button
            type="submit"
            disabled={pending}
            className="w-full rounded bg-black py-2 text-white disabled:opacity-50"
          >
            {pending ? "Submitting..." : "Request Access"}
          </button>
        </form>

        <p className="text-center text-sm">
          Already have an account?{" "}
          <Link href="/login" className="underline">Sign in</Link>
        </p>
      </div>
    </main>
  )
}
