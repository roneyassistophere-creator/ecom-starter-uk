import { HttpTypes } from "@medusajs/types"
import { CardActionMode, CardButtonLayout, CardFields, CardTextAlign } from "@lib/data/store-settings"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import CardImage from "../card-image"
import CardActions from "../card-actions"

type MinimalCardProps = {
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
  textAlign?: CardTextAlign
}

const ALIGN_CLASS: Record<CardTextAlign, string> = {
  left: "items-start text-left",
  center: "items-center text-center",
  right: "items-end text-right",
}

const MinimalCard = ({
  product,
  cheapestPrice,
  fields,
  countryCode,
  buttonLayout = "side_by_side",
  actionMode = "navigate",
  textAlign = "center",
}: MinimalCardProps) => {
  const hasButtons = fields.add_to_cart === true || fields.buy_now === true
  const alignClass = ALIGN_CLASS[textAlign]

  const image = (
    <CardImage
      thumbnail={product.thumbnail}
      images={product.images}
      alt={product.title ?? "Product"}
      aspectClass="aspect-[4/5]"
      className="rounded-2xl"
    />
  )

  const nameEl = fields.name !== false && (
    <p className="text-sm font-medium text-ui-fg-base line-clamp-1 w-full">
      {product.title}
    </p>
  )

  return (
    <div className={`flex flex-col group ${alignClass}`}>
      <div className="w-full">
        {hasButtons ? (
          <LocalizedClientLink href={`/products/${product.handle}`}>
            {image}
          </LocalizedClientLink>
        ) : (
          image
        )}
      </div>

      <div className={`mt-3 flex flex-col gap-y-1 w-full px-1 ${alignClass}`}>
        {hasButtons ? (
          <LocalizedClientLink href={`/products/${product.handle}`} className="w-full">
            {nameEl}
          </LocalizedClientLink>
        ) : (
          nameEl
        )}

        {fields.price !== false && cheapestPrice && (
          <div className="flex items-center gap-x-1.5">
            {cheapestPrice.price_type === "sale" && (
              <span className="text-xs text-ui-fg-muted line-through">
                {cheapestPrice.original_price}
              </span>
            )}
            <span
              className={
                cheapestPrice.price_type === "sale"
                  ? "text-sm font-semibold text-orange-500"
                  : "text-sm font-semibold text-ui-fg-base"
              }
            >
              {cheapestPrice.calculated_price}
            </span>
          </div>
        )}

        {hasButtons && (
          <CardActions
            product={product}
            showAddToCart={fields.add_to_cart === true}
            showBuyNow={fields.buy_now === true}
            buttonLayout={buttonLayout}
            actionMode={actionMode}
            countryCode={countryCode}
          />
        )}
      </div>
    </div>
  )
}

export default MinimalCard
