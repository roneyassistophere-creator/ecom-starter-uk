"use client"

import { useEffect, useState } from "react"
import { createPortal } from "react-dom"
import { HttpTypes } from "@medusajs/types"
import { XMark } from "@medusajs/icons"
import { convertToLocale } from "@lib/util/money"
import { Button } from "@modules/common/components/ui"
import DeleteButton from "@modules/common/components/delete-button"
import LineItemOptions from "@modules/common/components/line-item-options"
import LineItemPrice from "@modules/common/components/line-item-price"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import Thumbnail from "@modules/products/components/thumbnail"

const CartDrawer = ({ cart }: { cart?: HttpTypes.StoreCart | null }) => {
  const [isOpen, setIsOpen] = useState(false)
  const [mounted, setMounted] = useState(false)

  const open = () => {
    setIsOpen(true)
    document.documentElement.classList.add("cart-drawer-open")
    document.body.style.overflow = "hidden"
  }

  const close = () => {
    setIsOpen(false)
    document.documentElement.classList.remove("cart-drawer-open")
    document.body.style.overflow = ""
  }

  useEffect(() => {
    setMounted(true)
    document.addEventListener("cart-drawer-open", open)
    return () => {
      document.removeEventListener("cart-drawer-open", open)
      document.documentElement.classList.remove("cart-drawer-open")
      document.body.style.overflow = ""
    }
  }, [])

  const totalItems = cart?.items?.reduce((acc, item) => acc + item.quantity, 0) ?? 0
  const subtotal = cart?.subtotal ?? 0

  if (!mounted) return null

  return createPortal(
    <>
      <div
        className="mobile-drawer-backdrop"
        onClick={close}
        aria-hidden="true"
      />

      <div className="mobile-cart-drawer flex flex-col">
        {/* Header */}
        <div
          className="relative flex items-center justify-between p-4 flex-shrink-0 border-b border-ui-border-base"
          style={{ backgroundColor: "var(--brand-primary)" }}
        >
          <h2 className="text-base font-semibold text-white">Your Cart ({totalItems})</h2>
          <button
            onClick={close}
            aria-label="Close cart"
            className="w-7 h-7 flex items-center justify-center rounded-full bg-white/15 hover:bg-white/25 transition-colors"
          >
            <XMark className="text-white w-4 h-4" />
          </button>
        </div>

        {/* Items */}
        <div className="flex-1 overflow-y-auto no-scrollbar">
          {cart && cart.items && cart.items.length > 0 ? (
            <div className="flex flex-col gap-4 p-4">
              {cart.items
                .sort((a, b) => ((a.created_at ?? "") > (b.created_at ?? "") ? -1 : 1))
                .map((item) => (
                  <div key={item.id} className="grid grid-cols-[80px_1fr] gap-3">
                    <LocalizedClientLink href={`/products/${item.product_handle}`} onClick={close}>
                      <Thumbnail
                        thumbnail={item.thumbnail}
                        images={item.variant?.product?.images}
                        size="square"
                      />
                    </LocalizedClientLink>
                    <div className="flex flex-col justify-between">
                      <div>
                        <h3 className="text-sm font-medium text-ui-fg-base leading-tight line-clamp-2">
                          <LocalizedClientLink
                            href={`/products/${item.product_handle}`}
                            onClick={close}
                          >
                            {item.title}
                          </LocalizedClientLink>
                        </h3>
                        <LineItemOptions variant={item.variant} />
                        <span className="text-xs text-ui-fg-muted">Qty: {item.quantity}</span>
                      </div>
                      <div className="flex items-center justify-between mt-1">
                        <LineItemPrice
                          item={item}
                          style="tight"
                          currencyCode={cart.currency_code}
                        />
                        <DeleteButton id={item.id} className="text-xs">
                          Remove
                        </DeleteButton>
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center gap-4 py-16 px-4">
              <div className="w-12 h-12 rounded-full bg-ui-bg-subtle flex items-center justify-center">
                <span className="text-2xl">🛒</span>
              </div>
              <p className="text-sm text-ui-fg-subtle text-center">Your bag is empty.</p>
              <LocalizedClientLink href="/store" onClick={close}>
                <Button size="small">Explore products</Button>
              </LocalizedClientLink>
            </div>
          )}
        </div>

        {/* Footer */}
        {cart && cart.items && cart.items.length > 0 && (
          <div className="border-t border-ui-border-base p-4 flex flex-col gap-3 flex-shrink-0">
            <div className="flex items-center justify-between text-sm">
              <span className="text-ui-fg-subtle">Subtotal <span className="text-xs">(excl. taxes)</span></span>
              <span className="font-semibold text-ui-fg-base">
                {convertToLocale({ amount: subtotal, currency_code: cart.currency_code })}
              </span>
            </div>
            <LocalizedClientLink href="/cart" onClick={close}>
              <Button className="w-full" size="large">
                Go to cart
              </Button>
            </LocalizedClientLink>
            <button
              onClick={close}
              className="text-sm text-ui-fg-muted hover:text-ui-fg-base transition-colors text-center"
            >
              Continue shopping
            </button>
          </div>
        )}
      </div>
    </>,
    document.body
  )
}

export default CartDrawer
