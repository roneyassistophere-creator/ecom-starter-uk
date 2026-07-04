import { Suspense } from "react"

import SkeletonProductGrid from "@modules/skeletons/templates/skeleton-product-grid"
import { SortOptions } from "@modules/store/components/refinement-list/sort-products"
import FilterSortBar from "@modules/store/components/filter-sort-bar"
import { buildGridClass, getStorefrontCardSettings } from "@lib/data/store-settings"
import { StoreBrand } from "@lib/data/brands"

import PaginatedProducts from "./paginated-products"

const StoreTemplate = async ({
  sortBy,
  page,
  countryCode,
  brands = [],
  categories = [],
  collections = [],
  selectedBrand,
  selectedCategory,
  selectedCollection,
  brandProductIds,
  categoryId,
  collectionId,
  searchQuery,
}: {
  sortBy?: SortOptions
  page?: string
  countryCode: string
  brands?: Pick<StoreBrand, "id" | "name" | "handle">[]
  categories?: { id: string; name: string; handle: string }[]
  collections?: { id: string; handle: string; title: string }[]
  selectedBrand?: string
  selectedCategory?: string
  selectedCollection?: string
  brandProductIds?: string[]
  categoryId?: string
  collectionId?: string
  searchQuery?: string
}) => {
  const pageNumber = page ? parseInt(page) : 1
  const sort = sortBy || "created_at"
  const { card_grid_columns } = await getStorefrontCardSettings()
  const gridClass = buildGridClass(card_grid_columns)

  return (
    <div className="flex flex-col py-6 content-container" data-testid="category-container">
      <div className="mb-2 text-2xl-semi">
        <h1 data-testid="store-page-title">
          {searchQuery ? `Results for "${searchQuery}"` : "All products"}
        </h1>
      </div>
      <FilterSortBar
        sortBy={sort}
        brands={brands}
        categories={categories}
        collections={collections}
        selectedBrand={selectedBrand}
        selectedCategory={selectedCategory}
        selectedCollection={selectedCollection}
      />
      <Suspense fallback={<SkeletonProductGrid gridClass={gridClass} />}>
        <PaginatedProducts
          sortBy={sort}
          page={pageNumber}
          countryCode={countryCode}
          gridClass={gridClass}
          productsIds={brandProductIds}
          categoryId={categoryId}
          collectionId={collectionId}
          searchQuery={searchQuery}
        />
      </Suspense>
    </div>
  )
}

export default StoreTemplate
