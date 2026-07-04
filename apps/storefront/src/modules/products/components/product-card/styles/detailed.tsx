import { HttpTypes } from "@medusajs/types"
import { CardActionMode, CardButtonLayout, CardFields } from "@lib/data/store-settings"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import CardImage from "../card-image"
import CardActions from "../card-actions"

type DetailedCardProps = {
  product: HttpTypes.StoreProduct
  cheapestPrice: {
    calculated_price: string
    original_price: string
    price_type: string
  } | null
  fields: CardFields
  countryCode: string
  buttonLayout?: CardButtonLayout
  actionMode?: CardActionMode
}

// DetailedCard manages its own link structure so CardActions sits outside the anchor.
const DetailedCard = ({
  product,
  cheapestPrice,
  fields,
  countryCode,
  buttonLayout = "side_by_side",
  actionMode = "navigate",
}: DetailedCardProps) => {
  const modelNumber = product.metadata?.model_number as string | undefined

  return (
    <div className="flex flex-col group rounded-2xl border border-ui-border-base overflow-hidden hover:shadow-md transition-shadow duration-200">
      <LocalizedClientLink href={`/products/${product.handle}`}>
        <CardImage
          thumbnail={product.thumbnail}
          images={product.images}
          alt={product.title ?? "Product"}
          aspectClass="aspect-[4/5]"
          className="rounded-none"
        />
      </LocalizedClientLink>

      <div className="flex flex-col gap-y-2 p-4">
        <LocalizedClientLink href={`/products/${product.handle}`}>
          {fields.name !== false && (
            <p className="text-sm font-semibold text-ui-fg-base line-clamp-2 leading-snug">
              {product.title}
            </p>
          )}
        </LocalizedClientLink>

        {fields.model !== false && modelNumber && (
          <p className="text-xs text-ui-fg-muted">{modelNumber}</p>
        )}

        {fields.description !== false && product.description && (
          <p className="text-xs text-ui-fg-subtle line-clamp-3 leading-relaxed">
            {product.description}
          </p>
        )}

        {fields.price !== false && cheapestPrice && (
          <div className="flex items-center gap-x-2">
            <span
              className={
                cheapestPrice.price_type === "sale"
                  ? "text-sm font-semibold text-orange-500"
                  : "text-sm font-semibold text-ui-fg-base"
              }
            >
              {cheapestPrice.calculated_price}
            </span>
            {fields.compare_price !== false &&
              cheapestPrice.price_type === "sale" && (
                <span className="text-xs text-ui-fg-muted line-through">
                  {cheapestPrice.original_price}
                </span>
              )}
          </div>
        )}

        <CardActions
          product={product}
          showAddToCart={fields.add_to_cart === true}
          showBuyNow={fields.buy_now === true}
          buttonLayout={buttonLayout}
          actionMode={actionMode}
          countryCode={countryCode}
        />
      </div>
    </div>
  )
}

export default DetailedCard
