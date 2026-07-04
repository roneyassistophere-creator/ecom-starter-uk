"use client"

import { addToCart } from "@lib/data/cart"
import { CardActionMode, CardButtonLayout } from "@lib/data/store-settings"
import { HttpTypes } from "@medusajs/types"
import { useRouter } from "next/navigation"
import { useState } from "react"
import VariantSelectModal from "./variant-select-modal"

type CardActionsProps = {
  product: HttpTypes.StoreProduct
  showAddToCart: boolean
  showBuyNow: boolean
  buttonLayout: CardButtonLayout
  actionMode: CardActionMode
  countryCode: string
}

export default function CardActions({
  product,
  showAddToCart,
  showBuyNow,
  buttonLayout,
  actionMode,
  countryCode,
}: CardActionsProps) {
  const router = useRouter()
  const [adding, setAdding] = useState(false)
  const [buyingNow, setBuyingNow] = useState(false)
  const [modal, setModal] = useState<"add" | "buy" | null>(null)

  if (!showAddToCart && !showBuyNow) return null

  const isSingleVariant = product.variants?.length === 1 && !!product.variants[0].id
  const variantId = isSingleVariant ? product.variants![0].id! : null

  const handleAddToCart = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (!isSingleVariant) {
      if (actionMode === "modal") {
        setModal("add")
      } else {
        router.push(`/${countryCode}/products/${product.handle}`)
      }
      return
    }
    setAdding(true)
    await addToCart({ variantId: variantId!, quantity: 1, countryCode })
    setAdding(false)
  }

  const handleBuyNow = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (!isSingleVariant) {
      if (actionMode === "modal") {
        setModal("buy")
      } else {
        router.push(`/${countryCode}/products/${product.handle}`)
      }
      return
    }
    setBuyingNow(true)
    await addToCart({ variantId: variantId!, quantity: 1, countryCode })
    router.push(`/${countryCode}/checkout`)
  }

  const containerClass =
    buttonLayout === "stacked"
      ? "mt-2 flex flex-col gap-y-2 w-full"
      : "mt-2 flex flex-row gap-x-2 w-full"

  const btnBase =
    "flex-1 flex items-center justify-center gap-x-1.5 rounded-lg px-3 py-2 text-xs font-semibold transition-colors duration-150 disabled:opacity-60"

  return (
    <>
      <div className={containerClass}>
        {showAddToCart && (
          <button
            onClick={handleAddToCart}
            disabled={adding || buyingNow}
            className={`${btnBase} bg-gray-900 text-white hover:bg-gray-700`}
          >
            {adding ? (
              <span className="animate-pulse">Adding…</span>
            ) : isSingleVariant ? (
              <>
                <svg className="w-3.5 h-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                Add to Cart
              </>
            ) : (
              "Select Options"
            )}
          </button>
        )}

        {showBuyNow && (
          <button
            onClick={handleBuyNow}
            disabled={adding || buyingNow}
            className={`${btnBase} bg-orange-500 text-white hover:bg-orange-600`}
          >
            {buyingNow ? (
              <span className="animate-pulse">Processing…</span>
            ) : isSingleVariant ? (
              "Buy Now"
            ) : (
              "Buy Now →"
            )}
          </button>
        )}
      </div>

      {modal && (
        <VariantSelectModal
          product={product}
          mode={modal}
          countryCode={countryCode}
          onClose={() => setModal(null)}
        />
      )}
    </>
  )
}
