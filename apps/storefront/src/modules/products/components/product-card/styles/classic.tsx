import { HttpTypes } from "@medusajs/types"
import { CardActionMode, CardButtonLayout, CardFields } from "@lib/data/store-settings"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import CardImage from "../card-image"
import CardActions from "../card-actions"

type ClassicCardProps = {
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

const ClassicCard = ({
  product,
  cheapestPrice,
  fields,
  countryCode,
  buttonLayout = "side_by_side",
  actionMode = "navigate",
}: ClassicCardProps) => {
  const modelNumber = product.metadata?.model_number as string | undefined
  const hasButtons = fields.add_to_cart === true || fields.buy_now === true

  const image = (
    <CardImage
      thumbnail={product.thumbnail}
      images={product.images}
      alt={product.title ?? "Product"}
      aspectClass="aspect-[4/5]"
      className="rounded-none"
    />
  )

  return (
    <div className="flex flex-col group rounded-2xl border border-ui-border-base shadow-sm hover:shadow-md transition-shadow duration-200 overflow-hidden">
      {hasButtons ? (
        <LocalizedClientLink href={`/products/${product.handle}`}>
          {image}
        </LocalizedClientLink>
      ) : (
        image
      )}

      <div className="flex flex-col gap-y-1.5 p-3">
        {fields.name !== false && (
          hasButtons ? (
            <LocalizedClientLink href={`/products/${product.handle}`}>
              <p className="text-sm font-semibold text-ui-fg-base line-clamp-2 leading-snug hover:text-ui-fg-interactive transition-colors">
                {product.title}
              </p>
            </LocalizedClientLink>
          ) : (
            <p className="text-sm font-semibold text-ui-fg-base line-clamp-2 leading-snug">
              {product.title}
            </p>
          )
        )}

        {fields.model !== false && modelNumber && (
          <p className="text-xs text-ui-fg-muted">{modelNumber}</p>
        )}

        {fields.price !== false && cheapestPrice && (
          <div className="flex items-center gap-x-2 mt-0.5">
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

export default ClassicCard
