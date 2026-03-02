import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { sanityFetch } from "@/sanity/lib/live"

export const revalidate = 0
import { PRODUCTS_BY_STRAIN_QUERY } from "@/sanity/lib/queries"
import { logout } from "@/app/actions/auth"
import { StrainCarousel } from "./strain-carousel"

const STRAINS = [
  { key: "sativa", label: "Sativa" },
  { key: "hybrid", label: "Hybrid" },
  { key: "indica", label: "Indica" },
] as const

export default async function MenuPage() {
  const session = await auth()
  if (!session || session.user.status !== "approved") {
    redirect("/login")
  }

  const [sativa, hybrid, indica] = await Promise.all(
    STRAINS.map(({ key }) =>
      sanityFetch({ query: PRODUCTS_BY_STRAIN_QUERY, params: { strainType: key } })
    )
  )

  const strainData = [
    { label: "Sativa", data: sativa.data },
    { label: "Hybrid", data: hybrid.data },
    { label: "Indica", data: indica.data },
  ]

  const hasAnyProducts = strainData.some((s) => s.data.length > 0)

  return (
    <main className="min-h-screen bg-gray-950 text-white">
      <header className="flex items-center justify-between px-6 py-4 border-b border-gray-800">
        <h1 className="text-xl font-bold">Pure Pressure</h1>
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-400">
            {session.user.name ?? session.user.email}
          </span>
          <form action={logout}>
            <button type="submit" className="text-sm text-gray-400 hover:text-white transition-colors">
              Sign out
            </button>
          </form>
        </div>
      </header>

      <div className="px-6 py-8 space-y-10">
        {hasAnyProducts ? (
          strainData.map(
            ({ label, data }) =>
              data.length > 0 && (
                <StrainCarousel key={label} label={label} products={data} />
              )
          )
        ) : (
          <p className="text-gray-500 text-center py-20">
            No products available yet. Check back soon.
          </p>
        )}
      </div>
    </main>
  )
}
