"use client"

import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { useCallback, useState } from "react"
import { XMark } from "@medusajs/icons"
import { StoreBrand } from "@lib/data/brands"
import { SortOptions } from "@modules/store/components/refinement-list/sort-products"

const sortOptions: { value: SortOptions; label: string }[] = [
  { value: "created_at", label: "Latest" },
  { value: "price_asc", label: "Price: Low → High" },
  { value: "price_desc", label: "Price: High → Low" },
]

type Props = {
  open: boolean
  onClose: () => void
  sortBy: SortOptions
  brands: Pick<StoreBrand, "id" | "name" | "handle">[]
  categories: { id: string; name: string; handle: string }[]
  collections: { id: string; handle: string; title: string }[]
  selectedBrand?: string
  selectedCategory?: string
  selectedCollection?: string
}

function AccordionSection({
  title,
  children,
  defaultExpanded = true,
}: {
  title: string
  children: React.ReactNode
  defaultExpanded?: boolean
}) {
  const [expanded, setExpanded] = useState(defaultExpanded)
  return (
    <div className="border-b border-ui-border-base">
      <button
        onClick={() => setExpanded((p) => !p)}
        className="flex items-center justify-between w-full py-3 text-sm font-semibold text-ui-fg-base"
      >
        {title}
        <span
          className="text-ui-fg-muted transition-transform duration-200"
          style={{ transform: expanded ? "rotate(0deg)" : "rotate(-90deg)" }}
        >
          ▾
        </span>
      </button>
      {expanded && <div className="pb-3 flex flex-col gap-1">{children}</div>}
    </div>
  )
}

export default function FilterDrawer({
  open,
  onClose,
  sortBy,
  brands,
  categories,
  collections,
  selectedBrand,
  selectedCategory,
  selectedCollection,
}: Props) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  // Instant-apply: each selection updates the URL immediately. Filters are driven
  // entirely by the URL, so a fresh load (no query params) has nothing pre-applied.
  const updateFilter = useCallback(
    (key: "brand" | "category" | "collection", value: string | null) => {
      const params = new URLSearchParams(searchParams)
      if (value) params.set(key, value)
      else params.delete(key)
      params.delete("page")
      router.push(`${pathname}?${params.toString()}`)
    },
    [pathname, router, searchParams]
  )

  const setSort = useCallback(
    (value: SortOptions) => {
      const params = new URLSearchParams(searchParams)
      // Keep the URL clean — "Latest" is the default, so it needs no param.
      if (value && value !== "created_at") params.set("sortBy", value)
      else params.delete("sortBy")
      router.push(`${pathname}?${params.toString()}`)
    },
    [pathname, router, searchParams]
  )

  const clearAll = () => {
    const params = new URLSearchParams(searchParams)
    params.delete("brand")
    params.delete("category")
    params.delete("collection")
    params.delete("page")
    router.push(`${pathname}?${params.toString()}`)
  }

  const activeCount = [selectedBrand, selectedCategory, selectedCollection].filter(Boolean).length

  const optionCls = (active: boolean) =>
    [
      "flex items-center gap-2 px-2 py-1.5 rounded-lg text-sm cursor-pointer transition-colors text-left w-full",
      active
        ? "font-semibold"
        : "text-ui-fg-subtle hover:text-ui-fg-base hover:bg-ui-bg-subtle",
    ].join(" ")

  const dot = (
    <span className="w-1.5 h-1.5 rounded-full bg-current flex-shrink-0" />
  )

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-[58] transition-opacity duration-300"
        style={{
          background: "rgba(0,0,0,0.25)",
          opacity: open ? 1 : 0,
          pointerEvents: open ? "auto" : "none",
        }}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Panel */}
      <div
        className="fixed top-0 right-0 h-full w-[300px] bg-white z-[59] flex flex-col shadow-xl"
        style={{
          transform: open ? "translateX(0)" : "translateX(300px)",
          transition: "transform 0.35s cubic-bezier(0.4,0,0.2,1)",
        }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-4 py-3 border-b border-ui-border-base flex-shrink-0"
          style={{ backgroundColor: "var(--brand-primary)" }}
        >
          <span className="text-sm font-semibold text-white">
            Filters &amp; Sort{activeCount > 0 ? ` (${activeCount})` : ""}
          </span>
          <div className="flex items-center gap-2">
            {activeCount > 0 && (
              <button
                onClick={clearAll}
                className="text-xs text-white/80 hover:text-white underline underline-offset-2"
              >
                Clear all
              </button>
            )}
            <button
              onClick={onClose}
              className="w-7 h-7 flex items-center justify-center rounded-full bg-white/15 hover:bg-white/25 transition-colors"
              aria-label="Close filters"
            >
              <XMark className="text-white w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto no-scrollbar px-4 py-2">
          {/* Sort */}
          <AccordionSection title="Sort by">
            {sortOptions.map((opt) => (
              <button
                key={opt.value}
                className={optionCls(sortBy === opt.value)}
                onClick={() => setSort(opt.value)}
                style={sortBy === opt.value ? { color: "var(--brand-primary)" } : undefined}
              >
                {sortBy === opt.value && dot}
                {opt.label}
              </button>
            ))}
          </AccordionSection>

          {/* Categories */}
          {categories.length > 0 && (
            <AccordionSection title="Categories">
              <button
                className={optionCls(!selectedCategory)}
                onClick={() => updateFilter("category", null)}
                style={!selectedCategory ? { color: "var(--brand-primary)" } : undefined}
              >
                All Categories
              </button>
              {categories.map((c) => (
                <button
                  key={c.id}
                  className={optionCls(selectedCategory === c.handle)}
                  onClick={() =>
                    updateFilter("category", selectedCategory === c.handle ? null : c.handle)
                  }
                  style={selectedCategory === c.handle ? { color: "var(--brand-primary)" } : undefined}
                >
                  {selectedCategory === c.handle && dot}
                  {c.name}
                </button>
              ))}
            </AccordionSection>
          )}

          {/* Brands */}
          {brands.length > 0 && (
            <AccordionSection title="Brands" defaultExpanded={false}>
              <button
                className={optionCls(!selectedBrand)}
                onClick={() => updateFilter("brand", null)}
                style={!selectedBrand ? { color: "var(--brand-primary)" } : undefined}
              >
                All Brands
              </button>
              {brands.map((b) => (
                <button
                  key={b.id}
                  className={optionCls(selectedBrand === b.handle)}
                  onClick={() =>
                    updateFilter("brand", selectedBrand === b.handle ? null : b.handle)
                  }
                  style={selectedBrand === b.handle ? { color: "var(--brand-primary)" } : undefined}
                >
                  {selectedBrand === b.handle && dot}
                  {b.name}
                </button>
              ))}
            </AccordionSection>
          )}

          {/* Collections */}
          {collections.length > 0 && (
            <AccordionSection title="Collections">
              <button
                className={optionCls(!selectedCollection)}
                onClick={() => updateFilter("collection", null)}
                style={!selectedCollection ? { color: "var(--brand-primary)" } : undefined}
              >
                All Collections
              </button>
              {collections.map((c) => (
                <button
                  key={c.id}
                  className={optionCls(selectedCollection === c.handle)}
                  onClick={() =>
                    updateFilter("collection", selectedCollection === c.handle ? null : c.handle)
                  }
                  style={selectedCollection === c.handle ? { color: "var(--brand-primary)" } : undefined}
                >
                  {selectedCollection === c.handle && dot}
                  {c.title}
                </button>
              ))}
            </AccordionSection>
          )}
        </div>
      </div>
    </>
  )
}
