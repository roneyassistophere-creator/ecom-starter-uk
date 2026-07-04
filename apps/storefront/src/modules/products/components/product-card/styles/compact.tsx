import { HttpTypes } from "@medusajs/types"
import { CardActionMode, CardButtonLayout, CardFields, CardTextAlign } from "@lib/data/store-settings"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import CardImage from "../card-image"
import CardActions from "../card-actions"

type CompactCardProps = {
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

const CompactCard = ({
  product,
  cheapestPrice,
  fields,
  countryCode,
  buttonLayout = "side_by_side",
  actionMode = "navigate",
  textAlign = "left",
}: CompactCardProps) => {
  const modelNumber = product.metadata?.model_number as string | undefined
  const hasButtons = fields.add_to_cart === true || fields.buy_now === true
  const alignClass = ALIGN_CLASS[textAlign]

  const image = (
    <CardImage
      thumbnail={product.thumbnail}
      images={product.images}
      alt={product.title ?? "Product"}
      aspectClass="aspect-[1/1]"
      className="rounded-lg"
    />
  )

  const nameEl = fields.name !== false && (
    <p className="text-xs font-medium text-ui-fg-base line-clamp-1 leading-snug w-full">
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

      <div className={`mt-2 flex flex-col gap-y-0.5 w-full px-0.5 ${alignClass}`}>
        {hasButtons && nameEl ? (
          <LocalizedClientLink href={`/products/${product.handle}`} className="w-full">
            {nameEl}
          </LocalizedClientLink>
        ) : (
          nameEl
        )}

        {fields.model !== false && modelNumber && (
          <p className="text-[10px] text-ui-fg-muted leading-tight">{modelNumber}</p>
        )}

        {fields.price !== false && cheapestPrice && (
          <div className="flex items-center gap-x-1">
            <span
              className={
                cheapestPrice.price_type === "sale"
                  ? "text-xs font-semibold text-[#b88a00]"
                  : "text-xs font-semibold text-ui-fg-base"
              }
            >
              {cheapestPrice.calculated_price}
            </span>
            {fields.compare_price !== false &&
              cheapestPrice.price_type === "sale" && (
                <span className="text-[10px] text-ui-fg-muted line-through">
                  {cheapestPrice.original_price}
                </span>
              )}
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

export default CompactCard
