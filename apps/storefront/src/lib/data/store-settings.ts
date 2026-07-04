const BACKEND = process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL ?? "http://localhost:9000"
const PK = process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY ?? ""

export type StoreContactSettings = {
  whatsapp_number: string | null
  order_phone: string | null
}

export async function getStoreSettings(): Promise<StoreContactSettings> {
  try {
    const res = await fetch(`${BACKEND}/store/settings`, {
      headers: { "x-publishable-api-key": PK },
      next: { revalidate: 0 },
    })
    if (!res.ok) return { whatsapp_number: null, order_phone: null }
    return res.json()
  } catch {
    return { whatsapp_number: null, order_phone: null }
  }
}

// ─── Card Style Settings ──────────────────────────────────────────────────────

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

export type CardTextAlign = "left" | "center" | "right"

export type CardGridColumns = { mobile: 1 | 2 | 3; tablet: 2 | 3 | 4; desktop: 3 | 4 | 5 | 6 }

// Full class strings must be literals so Tailwind includes them in the build
const GRID_CLASS = {
  mobile:  { 1: "grid-cols-1",        2: "grid-cols-2",        3: "grid-cols-3" },
  tablet:  { 2: "small:grid-cols-2",  3: "small:grid-cols-3",  4: "small:grid-cols-4" },
  desktop: { 3: "medium:grid-cols-3", 4: "medium:grid-cols-4", 5: "medium:grid-cols-5", 6: "medium:grid-cols-6" },
} as const

export function buildGridClass(cols: CardGridColumns): string {
  return [
    GRID_CLASS.mobile[cols.mobile]   ?? "grid-cols-2",
    GRID_CLASS.tablet[cols.tablet]   ?? "small:grid-cols-3",
    GRID_CLASS.desktop[cols.desktop] ?? "medium:grid-cols-4",
  ].join(" ")
}

export type BadgeSaleFormat = "label" | "percent"
export type BadgeColor = "red" | "green" | "orange" | "blue" | "purple"

export type CardBadgeSettings = {
  sale: boolean
  sale_format: BadgeSaleFormat
  new_arrival: boolean
  new_days: number
  custom: boolean
}

export type StorefrontCardSettings = {
  product_card_style: CardStyleKey
  product_card_fields: CardFields
  card_button_layout: CardButtonLayout
  card_action_mode: CardActionMode
  card_badge_settings: CardBadgeSettings
  card_text_align: CardTextAlign
  card_grid_columns: CardGridColumns
}

const DEFAULT_BADGE_SETTINGS: CardBadgeSettings = {
  sale: true,
  sale_format: "label",
  new_arrival: false,
  new_days: 30,
  custom: true,
}

const CARD_DEFAULTS: StorefrontCardSettings = {
  product_card_style: "minimal",
  product_card_fields: { name: true, price: true },
  card_button_layout: "side_by_side",
  card_action_mode: "navigate",
  card_badge_settings: DEFAULT_BADGE_SETTINGS,
  card_text_align: "center",
  card_grid_columns: { mobile: 2, tablet: 3, desktop: 4 },
}

export async function getStorefrontCardSettings(): Promise<StorefrontCardSettings> {
  try {
    const res = await fetch(`${BACKEND}/store/storefront-settings`, {
      headers: { "x-publishable-api-key": PK },
      next: { revalidate: 0 },
    })
    if (!res.ok) return CARD_DEFAULTS
    const data = await res.json()
    return {
      product_card_style: data.product_card_style ?? CARD_DEFAULTS.product_card_style,
      product_card_fields: data.product_card_fields ?? CARD_DEFAULTS.product_card_fields,
      card_button_layout: data.card_button_layout ?? CARD_DEFAULTS.card_button_layout,
      card_action_mode: data.card_action_mode ?? CARD_DEFAULTS.card_action_mode,
      card_badge_settings: data.card_badge_settings ?? CARD_DEFAULTS.card_badge_settings,
      card_text_align: data.card_text_align ?? CARD_DEFAULTS.card_text_align,
      card_grid_columns: data.card_grid_columns ?? CARD_DEFAULTS.card_grid_columns,
    }
  } catch {
    return CARD_DEFAULTS
  }
}
