import { auth } from "@/auth"
import { redirect } from "next/navigation"
import LoginForm from "./login-form"

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; code?: string }>
}) {
  // Already approved and logged in — skip login
  const session = await auth()
  if (session?.user?.status === "approved") redirect("/menu")

  const { error, code } = await searchParams
  return <LoginForm error={error} code={code} />
}
