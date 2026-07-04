import { HttpTypes } from "@medusajs/types"
import Image from "next/image"
import { Heading, Text } from "@modules/common/components/ui"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { StoreBrand } from "@lib/data/brands"

type ProductInfoProps = {
  product: HttpTypes.StoreProduct
  productBrand?: StoreBrand | null
  /** When false, the description is rendered elsewhere (e.g. below the price/actions). */
  showDescription?: boolean
}

const ProductInfo = ({ product, productBrand, showDescription = true }: ProductInfoProps) => {
  const modelNumber = product.metadata?.model_number as string | undefined

  return (
    <div id="product-info">
      <div className="flex flex-col gap-y-3">
        {product.collection && (
          <LocalizedClientLink
            href={`/collections/${product.collection.handle}`}
            className="text-sm text-ui-fg-muted hover:text-ui-fg-subtle uppercase tracking-wide font-medium"
          >
            {product.collection.title}
          </LocalizedClientLink>
        )}

        {productBrand && (
          <LocalizedClientLink
            href={`/brands/${productBrand.handle}`}
            className="flex items-center gap-x-2 group w-fit"
          >
            {productBrand.logo_url && (
              <div className="relative h-6 w-12 flex-shrink-0">
                <Image
                  src={productBrand.logo_url}
                  alt={productBrand.name}
                  fill
                  className="object-contain"
                  sizes="48px"
                />
              </div>
            )}
            <span className="text-sm text-ui-fg-muted group-hover:text-ui-fg-subtle font-medium">
              {productBrand.name}
            </span>
          </LocalizedClientLink>
        )}

        <Heading
          level="h1"
          className="text-2xl lg:text-3xl font-bold leading-tight text-ui-fg-base"
          data-testid="product-title"
        >
          {product.title}
        </Heading>

        {modelNumber && (
          <p className="text-sm text-ui-fg-muted">
            Model: <span className="font-semibold text-ui-fg-subtle">{modelNumber}</span>
          </p>
        )}

        {showDescription && product.description && (
          <Text
            className="text-sm text-ui-fg-subtle leading-relaxed whitespace-pre-line"
            data-testid="product-description"
          >
            {product.description}
          </Text>
        )}
      </div>
    </div>
  )
}

export default ProductInfo
