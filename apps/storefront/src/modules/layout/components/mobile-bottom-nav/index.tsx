"use client"

import { House, ShoppingCart, MagnifyingGlass, User, Tag } from "@medusajs/icons"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { clx } from "@modules/common/components/ui"

type Props = {
  totalItems: number
  countryCode: string
}

export default function BottomMobileNav({ totalItems, countryCode }: Props) {
  const openCart = () => {
    document.dispatchEvent(new CustomEvent("cart-drawer-open"))
  }

  const btnCls = "flex flex-col items-center justify-center flex-1 h-full gap-0.5 text-white/90 hover:text-white transition-colors focus:outline-none"
  const labelCls = "text-[9px] leading-none font-medium"

  return (
    <nav
      className="mobile-bottom-nav md:hidden flex items-center"
      style={{ backgroundColor: "var(--brand-primary)" }}
      aria-label="Mobile navigation"
    >
      <LocalizedClientLink href="/" className={btnCls} aria-label="Home">
        <House className="w-5 h-5" />
        <span className={labelCls}>HOME</span>
      </LocalizedClientLink>

      <LocalizedClientLink href="/store" className={btnCls} aria-label="Categories">
        <Tag className="w-5 h-5" />
        <span className={labelCls}>CATEGORIES</span>
      </LocalizedClientLink>

      <button className={clx(btnCls, "relative")} onClick={openCart} aria-label="Cart">
        <span className="relative">
          <ShoppingCart className="w-5 h-5" />
          {totalItems > 0 && (
            <span className="absolute -top-1.5 -right-1.5 bg-white text-[var(--brand-primary)] text-[8px] font-bold leading-none w-3.5 h-3.5 rounded-full flex items-center justify-center">
              {totalItems > 9 ? "9+" : totalItems}
            </span>
          )}
        </span>
        <span className={labelCls}>CART</span>
      </button>

      <button
        className={btnCls}
        aria-label="Search"
        onClick={() => document.dispatchEvent(new CustomEvent("mobile-search-open"))}
      >
        <MagnifyingGlass className="w-5 h-5" />
        <span className={labelCls}>SEARCH</span>
      </button>

      <LocalizedClientLink href="/account" className={btnCls} aria-label="Account">
        <User className="w-5 h-5" />
        <span className={labelCls}>ACCOUNT</span>
      </LocalizedClientLink>
    </nav>
  )
}
