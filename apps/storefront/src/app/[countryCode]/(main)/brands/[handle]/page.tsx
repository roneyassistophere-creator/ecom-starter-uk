import { Metadata } from "next"
import { notFound } from "next/navigation"
import Image from "next/image"
import Link from "next/link"
import { getBrand } from "@lib/data/brands"
import { listProducts } from "@lib/data/products"
import { getRegion } from "@lib/data/regions"
import ProductCard from "@modules/products/components/product-card"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import brand from "brand.config"

export const revalidate = 3600

type Props = {
  params: Promise<{ countryCode: string; handle: string }>
}

export async function generateMetadata(props: Props): Promise<Metadata> {
  const { handle } = await props.params
  const brandData = await getBrand(handle)
  if (!brandData) return {}
  return {
    title: `${brandData.name} | ${brand.storeName}`,
    description: brandData.description ?? `Browse ${brandData.name} products`,
  }
}

export default async function BrandPage(props: Props) {
  const { countryCode, handle } = await props.params

  const [brandData, region] = await Promise.all([
    getBrand(handle),
    getRegion(countryCode),
  ])

  if (!brandData || !region) {
    notFound()
  }

  const productIds = brandData.products.map((p) => p.id)

  const products =
    productIds.length > 0
      ? await listProducts({
          countryCode,
          queryParams: {
            id: productIds as string[],
            limit: 100,
            fields:
              "*variants.calculated_price,+variants.inventory_quantity,*variants.images,+metadata,+tags,",
          },
        }).then((r) => r.response.products)
      : []

  return (
    <div className="content-container py-12">
      {/* Brand header */}
      <div className="mb-10 flex flex-col items-start gap-y-4">
        <LocalizedClientLink
          href="/brands"
          className="text-sm text-ui-fg-muted hover:text-ui-fg-subtle"
        >
          ← All Brands
        </LocalizedClientLink>

        <div className="flex items-center gap-x-6">
          {brandData.logo_url && (
            <div className="relative h-20 w-40 flex-shrink-0">
              <Image
                src={brandData.logo_url}
                alt={brandData.name}
                fill
                className="object-contain"
                sizes="160px"
                priority
              />
            </div>
          )}
          <div>
            <h1 className="text-3xl font-bold text-ui-fg-base">{brandData.name}</h1>
            {brandData.description && (
              <p className="text-ui-fg-subtle mt-2 max-w-prose">{brandData.description}</p>
            )}
            {brandData.website && (
              <a
                href={brandData.website}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm mt-2 inline-block hover:underline"
                style={{ color: brand.colors.primary }}
              >
                {brandData.website.replace(/^https?:\/\//, "")}
              </a>
            )}
          </div>
        </div>
      </div>

      {/* Products */}
      {products.length === 0 ? (
        <div className="py-16 text-center border rounded-2xl border-ui-border-base">
          <p className="text-ui-fg-subtle">No products found for this brand yet.</p>
        </div>
      ) : (
        <>
          <p className="text-sm text-ui-fg-muted mb-6">
            {products.length} product{products.length !== 1 ? "s" : ""}
          </p>
          <ul className="grid grid-cols-2 small:grid-cols-3 medium:grid-cols-4 gap-x-6 gap-y-8">
            {products.map((p) => (
              <li key={p.id}>
                <ProductCard product={p} region={region} countryCode={countryCode} />
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  )
}
