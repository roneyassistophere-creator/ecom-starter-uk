"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { HttpTypes } from "@medusajs/types"
import { ArrowRightMini } from "@medusajs/icons"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { clx } from "@modules/common/components/ui"

type Category = HttpTypes.StoreProductCategory

// ─── Single item (leaf or parent with dropdown) ──────────────────────────────

function CategoryItem({
  category,
  isFirst,
}: {
  category: Category
  isFirst?: boolean
}) {
  const [isOpen, setIsOpen] = useState(false)
  const ref = useRef<HTMLLIElement>(null)
  const children = (category.category_children ?? []) as Category[]
  const hasChildren = children.length > 0

  const open = useCallback(() => setIsOpen(true), [])
  const close = useCallback(() => setIsOpen(false), [])

  // Close on Escape while dropdown is open
  useEffect(() => {
    if (!isOpen) return
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") close()
    }
    document.addEventListener("keydown", handler)
    return () => document.removeEventListener("keydown", handler)
  }, [isOpen, close])

  // Close when focus moves entirely outside this item
  const onBlur = useCallback(
    (e: React.FocusEvent) => {
      if (!ref.current?.contains(e.relatedTarget as Node)) close()
    },
    [close]
  )

  // First item removes left padding so its text aligns with the header brand name
  const linkCls =
    clx(
      "flex items-center gap-1.5 h-9 lg:h-12 text-[13px] lg:text-sm font-medium text-white",
      "hover:bg-white/10 focus:bg-white/10 focus:outline-none transition-colors whitespace-nowrap",
      isFirst ? "pl-0 pr-3 lg:pr-4" : "px-3 lg:px-4"
    )

  if (!hasChildren) {
    return (
      <li>
        <LocalizedClientLink
          href={`/categories/${category.handle}`}
          className={linkCls}
        >
          {category.name}
        </LocalizedClientLink>
      </li>
    )
  }

  return (
    <li
      ref={ref}
      className="relative"
      onMouseEnter={open}
      onMouseLeave={close}
      onBlur={onBlur}
    >
      {/* Trigger button */}
      <button
        className={linkCls}
        aria-expanded={isOpen}
        aria-haspopup="menu"
        onFocus={open}
      >
        {category.name}
        <ArrowRightMini
          className={clx(
            "transition-transform duration-150",
            isOpen ? "-rotate-90" : "rotate-90"
          )}
        />
      </button>

      {/* Dropdown panel */}
      {isOpen && (
        <ul
          role="menu"
          aria-label={`${category.name} subcategories`}
          className="absolute top-full left-0 min-w-[180px] bg-white border border-ui-border-base shadow-md rounded-b z-50 py-1"
        >
          {children.map((child) => (
            <li key={child.id} role="presentation">
              <LocalizedClientLink
                href={`/categories/${child.handle}`}
                role="menuitem"
                className="block px-4 py-2 text-sm text-ui-fg-base hover:bg-ui-bg-subtle transition-colors"
                onClick={close}
              >
                {child.name}
              </LocalizedClientLink>
            </li>
          ))}
        </ul>
      )}
    </li>
  )
}

// ─── Full bar ─────────────────────────────────────────────────────────────────

export default function CategoryBar({
  categories,
}: {
  categories: Category[]
}) {
  if (categories.length === 0) return null

  return (
    <nav
      aria-label="Product categories"
      style={{
        backgroundColor: "var(--brand-primary)",
        fontFamily: "var(--brand-font-body)",
      }}
    >
      <ul className="content-container flex items-center overflow-x-auto no-scrollbar">
        {/* All Products — separated by a subtle right border */}
        <li className="flex-shrink-0 border-r border-white/20 mr-2 pr-2">
          <LocalizedClientLink
            href="/store"
            className="flex items-center h-9 lg:h-12 pl-0 pr-3 lg:pr-4 text-[13px] lg:text-sm font-semibold text-white/90 hover:bg-white/10 focus:bg-white/10 focus:outline-none transition-colors whitespace-nowrap tracking-wide"
          >
            All Products
          </LocalizedClientLink>
        </li>
        {categories.map((cat, index) => (
          <CategoryItem key={cat.id} category={cat} isFirst={index === 0} />
        ))}
      </ul>
    </nav>
  )
}
