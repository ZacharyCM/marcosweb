"use client"
import { useRef, useEffect, useState } from "react"
import Image from "next/image"
import type { PRODUCT_BY_ID_QUERYResult } from "@/../sanity.types"

interface ProductModalProps {
  productId: string
  isOpen: boolean
  onClose: () => void
}

export function ProductModal({ productId, isOpen, onClose }: ProductModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const [product, setProduct] = useState<PRODUCT_BY_ID_QUERYResult>(null)
  const [loading, setLoading] = useState(false)
  const [galleryIndex, setGalleryIndex] = useState(0)

  // Control dialog open/close imperatively
  useEffect(() => {
    if (isOpen) {
      dialogRef.current?.showModal()
    } else {
      dialogRef.current?.close()
      setGalleryIndex(0)
    }
  }, [isOpen])

  // Fetch full product detail when modal opens
  useEffect(() => {
    if (!isOpen) return
    setLoading(true)
    fetch(`/api/product/${productId}`)
      .then((r) => r.json())
      .then((data: PRODUCT_BY_ID_QUERYResult) => setProduct(data))
      .finally(() => setLoading(false))
  }, [isOpen, productId])

  const media = product?.media ?? []
  const currentItem = media[galleryIndex]

  return (
    <dialog
      ref={dialogRef}
      onClose={onClose}
      className="w-full max-w-2xl rounded-xl bg-gray-900 text-white p-0 m-auto
                 backdrop:bg-black/70 open:flex open:flex-col"
    >
      {/* Header */}
      <div className="flex items-start justify-between p-6 pb-0">
        <div className="space-y-1 flex-1 min-w-0 pr-4">
          <h2 className="text-xl font-bold leading-tight">
            {loading ? "Loading…" : (product?.name ?? "Product")}
          </h2>
          {product && (
            <p className="text-lg font-semibold text-gray-300">
              {product.price != null ? `${product.price.toFixed(2)}` : ""}
            </p>
          )}
        </div>
        <button
          onClick={onClose}
          className="shrink-0 rounded-lg p-1 text-gray-400 hover:text-white hover:bg-gray-800 transition-colors"
          aria-label="Close"
        >
          ✕
        </button>
      </div>

      <div className="overflow-y-auto p-6 pt-4 space-y-6">
        {loading && (
          <div className="flex items-center justify-center py-12 text-gray-500">
            Loading product details…
          </div>
        )}

        {/* Media gallery (MENU-05) */}
        {!loading && media.length > 0 && (
          <div className="space-y-3">
            {/* Main media display */}
            <div className="relative rounded-lg overflow-hidden bg-gray-800 aspect-video">
              {currentItem?._type === "image" ? (
                <Image
                  src={currentItem.url ?? ""}
                  alt={currentItem.alt ?? product?.name ?? ""}
                  fill
                  className="object-contain"
                  sizes="(max-width: 672px) 100vw, 672px"
                />
              ) : currentItem?._type === "file" ? (
                <video
                  src={currentItem.url ?? ""}
                  controls
                  className="w-full h-full"
                  preload="metadata"
                  aria-label={currentItem.caption ?? "Product video"}
                />
              ) : null}
            </div>
            {/* Thumbnail strip — only when multiple items */}
            {media.length > 1 && (
              <div className="flex gap-2 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                {media.map((item, i) => (
                  <button
                    key={item._key}
                    onClick={() => setGalleryIndex(i)}
                    className={`shrink-0 w-16 h-16 rounded overflow-hidden border-2 transition-colors ${
                      i === galleryIndex
                        ? "border-white"
                        : "border-gray-700 hover:border-gray-500"
                    }`}
                    aria-label={`View media ${i + 1}`}
                  >
                    {item._type === "image" ? (
                      <Image
                        src={item.url ?? ""}
                        alt={item.alt ?? ""}
                        width={64}
                        height={64}
                        className="object-cover w-full h-full"
                      />
                    ) : (
                      <div className="w-full h-full bg-gray-700 flex items-center justify-center text-gray-400 text-xs">
                        ▶
                      </div>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Description (MENU-04) */}
        {!loading && product?.description && (
          <div className="space-y-2">
            <h3 className="font-semibold text-gray-200">Description</h3>
            <p className="text-gray-400 leading-relaxed">{product.description}</p>
          </div>
        )}

        {/* Effects (MENU-04) */}
        {!loading && product?.effects && product.effects.length > 0 && (
          <div className="space-y-2">
            <h3 className="font-semibold text-gray-200">Effects</h3>
            <div className="flex flex-wrap gap-2">
              {product.effects.map((effect) => (
                <span
                  key={effect}
                  className="rounded-full bg-gray-800 border border-gray-700 px-3 py-1 text-sm text-gray-300"
                >
                  {effect}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Potency summary */}
        {!loading && product && (
          <div className="flex gap-6 text-sm text-gray-400 border-t border-gray-800 pt-4">
            <span>THC {product.thcPercent != null ? `${product.thcPercent}%` : "—"}</span>
            <span>CBD {product.cbdPercent != null ? `${product.cbdPercent}%` : "—"}</span>
            {product.quantity != null && <span>Qty {product.quantity}</span>}
            {product.strainType && (
              <span className="capitalize">{product.strainType}</span>
            )}
          </div>
        )}
      </div>
    </dialog>
  )
}
