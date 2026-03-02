import { auth } from "@/auth"
import { NextResponse } from "next/server"
import { sanityFetch } from "@/sanity/lib/live"
import { PRODUCT_BY_ID_QUERY } from "@/sanity/lib/queries"

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session || session.user.status !== "approved") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  const { id } = await params
  const { data } = await sanityFetch({ query: PRODUCT_BY_ID_QUERY, params: { id } })
  return NextResponse.json(data)
}
