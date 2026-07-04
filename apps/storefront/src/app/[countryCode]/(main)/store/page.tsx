import { Metadata } from "next"

import { SortOptions } from "@modules/store/components/refinement-list/sort-products"
import StoreTemplate from "@modules/store/templates"
import { listBrands, getBrand } from "@lib/data/brands"
import { listCategories, getCategoryByHandle } from "@lib/data/categories"
import { listCollections, getCollectionByHandle } from "@lib/data/collections"

export const metadata: Metadata = {
  title: "Store",
  description: "Explore all of our products.",
}

type Params = {
  searchParams: Promise<{
    sortBy?: SortOptions
    page?: string
    brand?: string
    category?: string
    collection?: string
    q?: string
  }>
  params: Promise<{
    countryCode: string
  }>
}

export default async function StorePage(props: Params) {
  const params = await props.params
  const searchParams = await props.searchParams
  const {
    sortBy,
    page,
    brand: brandHandle,
    category: categoryHandle,
    collection: collectionHandle,
    q,
  } = searchParams

  const [brands, allCategories, { collections }] = await Promise.all([
    listBrands(),
    listCategories({ parent_category_id: "null" }),
    listCollections(),
  ])

  let brandProductIds: string[] | undefined
  if (brandHandle) {
    const brandData = await getBrand(brandHandle)
    if (brandData?.products?.length) {
      brandProductIds = brandData.products.map((p) => p.id)
    } else {
      brandProductIds = []
    }
  }

  let categoryId: string | undefined
  if (categoryHandle) {
    const cat = await getCategoryByHandle([categoryHandle])
    categoryId = cat?.id
  }

  let collectionId: string | undefined
  if (collectionHandle) {
    const col = await getCollectionByHandle(collectionHandle)
    collectionId = col?.id
  }

  return (
    <StoreTemplate
      sortBy={sortBy}
      page={page}
      countryCode={params.countryCode}
      brands={brands}
      categories={allCategories.map((c) => ({
        id: c.id,
        name: c.name,
        handle: c.handle ?? "",
      }))}
      collections={collections.map((c) => ({
        id: c.id,
        handle: c.handle ?? "",
        title: c.title,
      }))}
      selectedBrand={brandHandle}
      selectedCategory={categoryHandle}
      selectedCollection={collectionHandle}
      brandProductIds={brandProductIds}
      categoryId={categoryId}
      collectionId={collectionId}
      searchQuery={q}
    />
  )
}
