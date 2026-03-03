"use client"
import { useState } from "react"
import Image from "next/image"
import type { PRODUCTS_BY_STRAIN_QUERY_RESULT } from "@/../sanity.types"
import { ProductModal } from "./product-modal"

type Product = PRODUCTS_BY_STRAIN_QUERY_RESULT[number]

const STRAIN_BADGE: Record<string, string> = {
  sativa: "bg-green-800 text-green-200",
  hybrid: "bg-purple-800 text-purple-200",
  indica: "bg-blue-800 text-blue-200",
}

interface ProductCardProps {
  product: Product
}

export function ProductCard({ product }: ProductCardProps) {
  const [open, setOpen] = useState(false)
  const badgeClass =
    STRAIN_BADGE[product.strainType ?? ""] ?? "bg-gray-700 text-gray-200"

  return (
    <>
    <button
      type="button"
      onClick={() => setOpen(true)}
      className="w-60 rounded-xl bg-gray-900 border border-gray-800 overflow-hidden
                 hover:border-gray-600 hover:scale-[1.02] transition-all duration-200
                 text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-white"
    >
      <div className="relative h-48 w-full bg-gray-800">
        {product.primaryImage?.url ? (
          <Image
            src={product.primaryImage.url}
            alt={product.primaryImage.alt ?? product.name ?? "Product image"}
            fill
            className="object-cover"
            sizes="240px"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-gray-600 text-sm">
            No image
          </div>
        )}
      </div>
      <div className="p-4 space-y-2">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-semibold text-white leading-tight line-clamp-2">
            {product.name ?? "Unnamed Product"}
          </h3>
          {product.strainType && (
            <span
              className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium capitalize ${badgeClass}`}
            >
              {product.strainType}
            </span>
          )}
        </div>
        <p className="text-lg font-bold text-white">
          {product.price != null ? `${product.price.toFixed(2)}` : "—"}
        </p>
        <div className="flex gap-3 text-sm text-gray-400">
          <span>THC {product.thcPercent != null ? `${product.thcPercent}%` : "—"}</span>
          <span>CBD {product.cbdPercent != null ? `${product.cbdPercent}%` : "—"}</span>
        </div>
      </div>
    </button>
    <ProductModal
      productId={product._id}
      isOpen={open}
      onClose={() => setOpen(false)}
    />
    </>
  )
}
