"use server"
import { z } from "zod"
import bcrypt from "bcryptjs"
import { redirect } from "next/navigation"
import { AuthError } from "next-auth"
import { signIn, signOut } from "@/auth"
import { sanityWriteClient } from "@/lib/sanity-write"

const RegisterSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
})

export async function register(
  prevState: { errors?: Record<string, string[]>; error?: string } | undefined,
  formData: FormData
) {
  const parsed = RegisterSchema.safeParse(Object.fromEntries(formData))
  if (!parsed.success) {
    return { errors: parsed.error.flatten().fieldErrors }
  }

  const { name, email, password } = parsed.data

  // Check for duplicate email before attempting to write
  const existing = await sanityWriteClient.fetch<string | null>(
    `*[_type == "siteUser" && email == $email][0]._id`,
    { email }
  )
  if (existing) {
    return { errors: { email: ["An account with this email already exists."] } }
  }

  const passwordHash = await bcrypt.hash(password, 12)

  // Write the new siteUser document — status defaults to "pending" via schema initialValue
  try {
    await sanityWriteClient.create({
      _type: "siteUser",
      name,
      email,
      passwordHash,
      status: "pending",
    })
  } catch {
    return { error: "Registration failed. Please try again." }
  }

  // CRITICAL: redirect() MUST be outside the try/catch block.
  // redirect() internally throws NEXT_REDIRECT — if caught, the redirect is swallowed.
  redirect("/pending")
}

const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
})

export async function login(
  prevState: { error?: string; code?: string } | undefined,
  formData: FormData
) {
  const parsed = LoginSchema.safeParse(Object.fromEntries(formData))
  if (!parsed.success) {
    return { error: "CredentialsSignin", code: undefined }
  }

  try {
    // signIn() redirects to /menu on success (throws NEXT_REDIRECT — not an error)
    await signIn("credentials", formData)
  } catch (error) {
    if (error instanceof AuthError) {
      // Auth.js surfaces DeniedError.code and PendingError.code here
      return {
        error: error.type,
        code: (error as AuthError & { code?: string }).code,
      }
    }
    // Re-throw everything else — including the NEXT_REDIRECT thrown on successful sign-in
    throw error
  }
}

export async function logout() {
  await signOut({ redirectTo: "/" })
}
