// Card style registry.
// supportedFields MUST stay in sync with apps/backend/src/admin/lib/card-styles.ts

import { CardActionMode, CardButtonLayout, CardFieldKey, CardFields, CardStyleKey, CardTextAlign } from "@lib/data/store-settings"
import { HttpTypes } from "@medusajs/types"
import MinimalCard from "./styles/minimal"
import ClassicCard from "./styles/classic"
import DetailedCard from "./styles/detailed"
import OverlayCard from "./styles/overlay"
import CompactCard from "./styles/compact"

export type PriceInfo = {
  calculated_price: string
  original_price: string
  price_type: string
} | null

export type CardStyleComponent = (props: {
  product: HttpTypes.StoreProduct
  cheapestPrice: PriceInfo
  fields: CardFields
  countryCode: string
  buttonLayout?: CardButtonLayout
  actionMode?: CardActionMode
  textAlign?: CardTextAlign
}) => React.ReactNode

export interface CardRegistryEntry {
  component: CardStyleComponent
  supportedFields: CardFieldKey[]
}

export const CARD_REGISTRY: Record<CardStyleKey, CardRegistryEntry> = {
  minimal: {
    component: MinimalCard as CardStyleComponent,
    supportedFields: ["name", "price", "add_to_cart", "buy_now"],
  },
  classic: {
    component: ClassicCard as CardStyleComponent,
    supportedFields: ["name", "price", "compare_price", "model", "add_to_cart", "buy_now"],
  },
  detailed: {
    component: DetailedCard as CardStyleComponent,
    supportedFields: ["name", "price", "compare_price", "model", "description", "add_to_cart", "buy_now"],
  },
  overlay: {
    component: OverlayCard as CardStyleComponent,
    supportedFields: ["name", "price"],
  },
  compact: {
    component: CompactCard as CardStyleComponent,
    supportedFields: ["name", "price", "compare_price", "model", "add_to_cart", "buy_now"],
  },
}
