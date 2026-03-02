"use server"
import { cookies } from "next/headers"
import { redirect } from "next/navigation"

export async function confirmAge(): Promise<void> {
  const cookieStore = await cookies()
  cookieStore.set("age-verified", "1", {
    maxAge: 60 * 60 * 24 * 365, // 365 days
    path: "/",
    sameSite: "lax",
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
  })
  redirect("/login")
}
