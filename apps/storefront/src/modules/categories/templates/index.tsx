import { notFound } from "next/navigation"
import { Suspense } from "react"

import InteractiveLink from "@modules/common/components/interactive-link"
import SkeletonProductGrid from "@modules/skeletons/templates/skeleton-product-grid"
import { SortOptions } from "@modules/store/components/refinement-list/sort-products"
import FilterSortBar from "@modules/store/components/filter-sort-bar"
import PaginatedProducts from "@modules/store/templates/paginated-products"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { buildGridClass, getStorefrontCardSettings } from "@lib/data/store-settings"
import { HttpTypes } from "@medusajs/types"

export default async function CategoryTemplate({
  category,
  sortBy,
  page,
  countryCode,
}: {
  category: HttpTypes.StoreProductCategory
  sortBy?: SortOptions
  page?: string
  countryCode: string
}) {
  const pageNumber = page ? parseInt(page) : 1
  const sort = sortBy || "created_at"

  if (!category || !countryCode) notFound()

  const { card_grid_columns } = await getStorefrontCardSettings()
  const gridClass = buildGridClass(card_grid_columns)

  const parents = [] as HttpTypes.StoreProductCategory[]

  const getParents = (category: HttpTypes.StoreProductCategory) => {
    if (category.parent_category) {
      parents.push(category.parent_category)
      getParents(category.parent_category)
    }
  }

  getParents(category)

  return (
    <div className="flex flex-col py-6 content-container" data-testid="category-container">
      <div className="flex flex-row mb-2 text-2xl-semi gap-4">
        {parents.map((parent) => (
          <span key={parent.id} className="text-ui-fg-subtle">
            <LocalizedClientLink
              className="mr-4 hover:text-black"
              href={`/categories/${parent.handle}`}
              data-testid="sort-by-link"
            >
              {parent.name}
            </LocalizedClientLink>
            /
          </span>
        ))}
        <h1 data-testid="category-page-title">{category.name}</h1>
      </div>

      {category.description && (
        <div className="mb-4 text-base-regular">
          <p>{category.description}</p>
        </div>
      )}

      {category.category_children && (
        <div className="mb-6 text-base-large">
          <ul className="grid grid-cols-1 gap-2">
            {category.category_children.map((c) => (
              <li key={c.id}>
                <InteractiveLink href={`/categories/${c.handle}`}>
                  {c.name}
                </InteractiveLink>
              </li>
            ))}
          </ul>
        </div>
      )}

      <FilterSortBar sortBy={sort} brands={[]} categories={[]} collections={[]} />

      <Suspense
        fallback={<SkeletonProductGrid numberOfProducts={category.products?.length ?? 8} gridClass={gridClass} />}
      >
        <PaginatedProducts
          sortBy={sort}
          page={pageNumber}
          categoryId={category.id}
          countryCode={countryCode}
          gridClass={gridClass}
        />
      </Suspense>
    </div>
  )
}
