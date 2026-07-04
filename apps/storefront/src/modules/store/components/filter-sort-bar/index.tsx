"use client"

import { useState } from "react"
import { Funnel } from "@medusajs/icons"
import { SortOptions } from "@modules/store/components/refinement-list/sort-products"
import FilterDrawer from "@modules/store/components/filter-drawer"
import { StoreBrand } from "@lib/data/brands"

const sortLabels: Record<SortOptions, string> = {
  created_at: "Latest",
  price_asc: "Price: Low → High",
  price_desc: "Price: High → Low",
}

type Props = {
  sortBy: SortOptions
  brands: Pick<StoreBrand, "id" | "name" | "handle">[]
  categories: { id: string; name: string; handle: string }[]
  collections: { id: string; handle: string; title: string }[]
  selectedBrand?: string
  selectedCategory?: string
  selectedCollection?: string
}

export default function FilterSortBar({
  sortBy,
  brands,
  categories,
  collections,
  selectedBrand,
  selectedCategory,
  selectedCollection,
}: Props) {
  const [filterOpen, setFilterOpen] = useState(false)

  const activeCount = [selectedBrand, selectedCategory, selectedCollection].filter(Boolean).length
  const hasFilters = brands.length > 0 || categories.length > 0 || collections.length > 0
  const buttonLabel = hasFilters ? "Filters & Sort" : "Sort"

  return (
    <>
      <div className="flex items-center justify-between gap-3 mb-6">
        <span className="text-sm text-ui-fg-muted">
          Sorted by:{" "}
          <span className="text-ui-fg-base font-medium">{sortLabels[sortBy]}</span>
        </span>

        <button
          onClick={() => setFilterOpen(true)}
          className="flex items-center gap-1.5 px-4 py-1.5 rounded-full text-sm font-medium border transition-colors duration-150"
          style={
            activeCount > 0
              ? {
                  backgroundColor: "var(--brand-primary)",
                  color: "#fff",
                  borderColor: "var(--brand-primary)",
                }
              : undefined
          }
          data-active={activeCount > 0}
        >
          <Funnel className="w-4 h-4" />
          {buttonLabel}
          {activeCount > 0 ? ` (${activeCount})` : ""}
        </button>
      </div>

      <FilterDrawer
        open={filterOpen}
        onClose={() => setFilterOpen(false)}
        sortBy={sortBy}
        brands={brands}
        categories={categories}
        collections={collections}
        selectedBrand={selectedBrand}
        selectedCategory={selectedCategory}
        selectedCollection={selectedCollection}
      />
    </>
  )
}
