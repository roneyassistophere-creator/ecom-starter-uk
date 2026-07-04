// Shared card style metadata.
// Keep supportedFields in sync with registry.tsx in the storefront.

export type CardStyleKey = "minimal" | "classic" | "detailed" | "overlay" | "compact"
export type CardFieldKey =
  | "name"
  | "price"
  | "compare_price"
  | "model"
  | "description"
  | "add_to_cart"
  | "buy_now"
export type CardFields = Partial<Record<CardFieldKey, boolean>>
export type CardButtonLayout = "side_by_side" | "stacked"
export type CardActionMode = "navigate" | "modal"

export interface CardStyleMeta {
  key: CardStyleKey
  label: string
  description: string
  supportedFields: CardFieldKey[]
}

export const CARD_STYLES: CardStyleMeta[] = [
  {
    key: "minimal",
    label: "Minimal",
    description: "Centered, borderless layout with generous whitespace",
    supportedFields: ["name", "price", "add_to_cart", "buy_now"],
  },
  {
    key: "classic",
    label: "Classic",
    description: "Bordered card with shadow and hover lift effect",
    supportedFields: ["name", "price", "compare_price", "model", "add_to_cart", "buy_now"],
  },
  {
    key: "detailed",
    label: "Detailed",
    description: "Rich card with description, model, and action buttons",
    supportedFields: ["name", "price", "compare_price", "model", "description", "add_to_cart", "buy_now"],
  },
  {
    key: "overlay",
    label: "Overlay",
    description: "Name and price overlaid on the image with gradient",
    supportedFields: ["name", "price"],
  },
  {
    key: "compact",
    label: "Compact",
    description: "Square image with tight spacing — great for dense grids",
    supportedFields: ["name", "price", "compare_price", "model", "add_to_cart", "buy_now"],
  },
]

export const ALL_FIELDS: { key: CardFieldKey; label: string }[] = [
  { key: "name", label: "Product Name" },
  { key: "price", label: "Price" },
  { key: "compare_price", label: "Compare-at Price" },
  { key: "model", label: "Model Number" },
  { key: "description", label: "Short Description" },
  { key: "add_to_cart", label: "Add to Cart Button" },
  { key: "buy_now", label: "Buy Now Button" },
]

export const DEFAULT_STYLE: CardStyleKey = "minimal"
export const DEFAULT_FIELDS: CardFields = { name: true, price: true }
export const DEFAULT_BUTTON_LAYOUT: CardButtonLayout = "side_by_side"
export const DEFAULT_ACTION_MODE: CardActionMode = "navigate"

export type CardTextAlign = "left" | "center" | "right"
export const DEFAULT_TEXT_ALIGN: CardTextAlign = "center"

export type BadgeSaleFormat = "label" | "percent"
export type BadgeColor = "red" | "green" | "orange" | "blue" | "purple"

export type CardBadgeSettings = {
  sale: boolean
  sale_format: BadgeSaleFormat
  new_arrival: boolean
  new_days: number
  custom: boolean
}

export type CardGridColumns = { mobile: 1 | 2 | 3; tablet: 2 | 3 | 4; desktop: 3 | 4 | 5 | 6 }
export const DEFAULT_GRID_COLUMNS: CardGridColumns = { mobile: 2, tablet: 3, desktop: 4 }

export const DEFAULT_BADGE_SETTINGS: CardBadgeSettings = {
  sale: true,
  sale_format: "label",
  new_arrival: false,
  new_days: 30,
  custom: true,
}
