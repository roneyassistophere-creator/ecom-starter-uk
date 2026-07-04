"use client"

import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { useCallback } from "react"
import { SortOptions } from "@modules/store/components/refinement-list/sort-products"

const sortOptions: { value: SortOptions; label: string }[] = [
  { value: "created_at", label: "Latest" },
  { value: "price_asc", label: "Price: Low → High" },
  { value: "price_desc", label: "Price: High → Low" },
]

type SortBarProps = {
  sortBy: SortOptions
}

const SortBar = ({ sortBy }: SortBarProps) => {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const setSort = useCallback(
    (value: SortOptions) => {
      const params = new URLSearchParams(searchParams)
      params.set("sortBy", value)
      router.push(`${pathname}?${params.toString()}`)
    },
    [pathname, router, searchParams]
  )

  return (
    <div className="flex items-center justify-end gap-x-2 mb-6">
      <span className="text-sm text-ui-fg-muted mr-1">Sort by:</span>
      {sortOptions.map((opt) => {
        const active = sortBy === opt.value
        return (
          <button
            key={opt.value}
            onClick={() => setSort(opt.value)}
            className={[
              "px-3 py-1.5 rounded-full text-sm font-medium transition-colors duration-150",
              active
                ? "bg-gray-900 text-white"
                : "bg-ui-bg-subtle text-ui-fg-subtle hover:bg-ui-bg-base hover:text-ui-fg-base border border-ui-border-base",
            ].join(" ")}
          >
            {opt.label}
          </button>
        )
      })}
    </div>
  )
}

export default SortBar
