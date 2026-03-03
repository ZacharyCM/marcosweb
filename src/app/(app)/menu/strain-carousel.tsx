import type { PRODUCTS_BY_STRAIN_QUERY_RESULT } from "@/../sanity.types"
import { ProductCard } from "./product-card"

interface StrainCarouselProps {
  label: string
  products: PRODUCTS_BY_STRAIN_QUERY_RESULT
}

export function StrainCarousel({ label, products }: StrainCarouselProps) {
  return (
    <section>
      <h2 className="text-lg font-semibold mb-4 text-gray-100">{label}</h2>
      <div className="overflow-hidden">
        <div
          className="flex gap-4 overflow-x-auto snap-x snap-proximity pb-2
                     [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {products.map((product) => (
            <div key={product._id} className="snap-start flex-none">
              <ProductCard product={product} />
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
