import { HttpTypes } from "@medusajs/types"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { getProductPrice } from "@lib/util/get-product-price"
import {
  BadgeColor,
  CardBadgeSettings,
  CardFields,
  CardTextAlign,
  getStorefrontCardSettings,
} from "@lib/data/store-settings"
import { CARD_REGISTRY } from "./registry"

type ProductCardProps = {
  product: HttpTypes.StoreProduct
  region: HttpTypes.StoreRegion
  countryCode: string
}

type ComputedBadge = { label: string; color: BadgeColor }

const COLOR_CLASS: Record<BadgeColor, string> = {
  red: "bg-red-500",
  green: "bg-emerald-500",
  orange: "bg-orange-500",
  blue: "bg-blue-600",
  purple: "bg-purple-600",
}

function computeBadges(
  product: HttpTypes.StoreProduct,
  cheapestPrice: { price_type: string; percentage_diff?: string } | null,
  settings: CardBadgeSettings
): ComputedBadge[] {
  const badges: ComputedBadge[] = []

  if (settings.custom && product.metadata?.badge_label) {
    badges.push({
      label: product.metadata.badge_label as string,
      color: ((product.metadata.badge_color as BadgeColor) in COLOR_CLASS
        ? product.metadata.badge_color as BadgeColor
        : "orange"),
    })
  }

  if (settings.sale && cheapestPrice?.price_type === "sale") {
    const label =
      settings.sale_format === "percent" && cheapestPrice.percentage_diff
        ? `-${cheapestPrice.percentage_diff}%`
        : "Sale"
    badges.push({ label, color: "red" })
  }

  if (settings.new_arrival && product.created_at) {
    const ageDays = Math.floor(
      (Date.now() - new Date(product.created_at).getTime()) / 86_400_000
    )
    if (ageDays <= settings.new_days) {
      badges.push({ label: "New", color: "green" })
    }
  }

  return badges.slice(0, 2)
}

export default async function ProductCard({
  product,
  countryCode,
}: ProductCardProps) {
  const {
    product_card_style,
    product_card_fields,
    card_button_layout,
    card_action_mode,
    card_badge_settings,
    card_text_align,
  } = await getStorefrontCardSettings()

  const entry = CARD_REGISTRY[product_card_style] ?? CARD_REGISTRY.minimal

  const filteredFields: CardFields = {}
  for (const key of entry.supportedFields) {
    filteredFields[key] = product_card_fields[key] ?? false
  }

  const { cheapestPrice } = getProductPrice({ product })

  const priceInfo = cheapestPrice
    ? {
        calculated_price: cheapestPrice.calculated_price,
        original_price: cheapestPrice.original_price,
        price_type: cheapestPrice.price_type,
      }
    : null

  const badges = computeBadges(product, cheapestPrice ?? null, card_badge_settings)

  const badgeOverlay =
    badges.length > 0 ? (
      <div className="absolute top-2 left-2 z-10 flex flex-col gap-y-1 pointer-events-none">
        {badges.map((b, i) => (
          <span
            key={i}
            className={`${COLOR_CLASS[b.color]} text-white text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full`}
          >
            {b.label}
          </span>
        ))}
      </div>
    ) : null

  const CardComponent = entry.component

  const hasButtons = filteredFields.add_to_cart === true || filteredFields.buy_now === true

  if (hasButtons) {
    return (
      <div data-testid="product-wrapper" className="group relative">
        <CardComponent
          product={product}
          cheapestPrice={priceInfo}
          fields={filteredFields}
          countryCode={countryCode}
          buttonLayout={card_button_layout}
          actionMode={card_action_mode}
          textAlign={card_text_align}
        />
        {badgeOverlay}
      </div>
    )
  }

  return (
    <LocalizedClientLink
      href={`/products/${product.handle}`}
      className="group relative block"
      data-testid="product-wrapper"
    >
      <CardComponent
        product={product}
        cheapestPrice={priceInfo}
        fields={filteredFields}
        countryCode={countryCode}
        textAlign={card_text_align}
      />
      {badgeOverlay}
    </LocalizedClientLink>
  )
}
