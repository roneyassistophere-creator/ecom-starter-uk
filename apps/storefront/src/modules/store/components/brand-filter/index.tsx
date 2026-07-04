"use client"

import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { useCallback } from "react"
import { StoreBrand } from "@lib/data/brands"

type BrandFilterProps = {
  brands: Pick<StoreBrand, "id" | "name" | "handle">[]
  selectedBrand?: string
}

const BrandFilter = ({ brands, selectedBrand }: BrandFilterProps) => {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const setBrand = useCallback(
    (handle: string | null) => {
      const params = new URLSearchParams(searchParams)
      if (handle) {
        params.set("brand", handle)
      } else {
        params.delete("brand")
      }
      params.delete("page")
      router.push(`${pathname}?${params.toString()}`)
    },
    [pathname, router, searchParams]
  )

  if (brands.length === 0) return null

  const active = selectedBrand ?? ""

  return (
    <div className="flex items-center gap-x-2 mb-6 flex-wrap gap-y-2">
      <span className="text-sm text-ui-fg-muted mr-1">Brand:</span>
      <button
        onClick={() => setBrand(null)}
        className={[
          "px-3 py-1.5 rounded-full text-sm font-medium transition-colors duration-150",
          !active
            ? "bg-gray-900 text-white"
            : "bg-ui-bg-subtle text-ui-fg-subtle hover:bg-ui-bg-base hover:text-ui-fg-base border border-ui-border-base",
        ].join(" ")}
      >
        All
      </button>
      {brands.map((b) => {
        const isActive = active === b.handle
        return (
          <button
            key={b.id}
            onClick={() => setBrand(isActive ? null : b.handle)}
            className={[
              "px-3 py-1.5 rounded-full text-sm font-medium transition-colors duration-150",
              isActive
                ? "bg-gray-900 text-white"
                : "bg-ui-bg-subtle text-ui-fg-subtle hover:bg-ui-bg-base hover:text-ui-fg-base border border-ui-border-base",
            ].join(" ")}
          >
            {b.name}
          </button>
        )
      })}
    </div>
  )
}

export default BrandFilter
