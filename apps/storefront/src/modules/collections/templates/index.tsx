import { Suspense } from "react"

import SkeletonProductGrid from "@modules/skeletons/templates/skeleton-product-grid"
import { SortOptions } from "@modules/store/components/refinement-list/sort-products"
import FilterSortBar from "@modules/store/components/filter-sort-bar"
import PaginatedProducts from "@modules/store/templates/paginated-products"
import { buildGridClass, getStorefrontCardSettings } from "@lib/data/store-settings"
import { HttpTypes } from "@medusajs/types"

export default async function CollectionTemplate({
  sortBy,
  collection,
  page,
  countryCode,
}: {
  sortBy?: SortOptions
  collection: HttpTypes.StoreCollection
  page?: string
  countryCode: string
}) {
  const pageNumber = page ? parseInt(page) : 1
  const sort = sortBy || "created_at"
  const { card_grid_columns } = await getStorefrontCardSettings()
  const gridClass = buildGridClass(card_grid_columns)

  return (
    <div className="flex flex-col py-6 content-container">
      <div className="mb-2 text-2xl-semi">
        <h1>{collection.title}</h1>
      </div>
      <FilterSortBar sortBy={sort} brands={[]} categories={[]} collections={[]} />
      <Suspense
        fallback={<SkeletonProductGrid numberOfProducts={collection.products?.length} gridClass={gridClass} />}
      >
        <PaginatedProducts
          sortBy={sort}
          page={pageNumber}
          collectionId={collection.id}
          countryCode={countryCode}
          gridClass={gridClass}
        />
      </Suspense>
    </div>
  )
}
