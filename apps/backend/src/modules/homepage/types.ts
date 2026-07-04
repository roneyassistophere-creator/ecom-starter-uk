// ─── Section type enum ────────────────────────────────────────────────────────

export const SECTION_TYPES = [
  "hero_carousel",
  "featured_categories",
  "product_showcase",
  "brand_showcase",
] as const

export type SectionType = (typeof SECTION_TYPES)[number]

// ─── Layout keys per section type ─────────────────────────────────────────────

export const HERO_CAROUSEL_LAYOUTS = ["full_width", "boxed", "split"] as const
export const FEATURED_CATEGORIES_LAYOUTS = [
  "grid",
  "circles",
  "horizontal_scroll",
] as const
export const PRODUCT_SHOWCASE_LAYOUTS = ["grid_4", "grid_2", "carousel", "list"] as const
export const BRAND_SHOWCASE_LAYOUTS = ["grid", "horizontal_scroll"] as const
export type BrandShowcaseLayout = (typeof BRAND_SHOWCASE_LAYOUTS)[number]

export type HeroCarouselLayout = (typeof HERO_CAROUSEL_LAYOUTS)[number]
export type FeaturedCategoriesLayout =
  (typeof FEATURED_CATEGORIES_LAYOUTS)[number]
export type ProductShowcaseLayout = (typeof PRODUCT_SHOWCASE_LAYOUTS)[number]

export type SectionLayout =
  | HeroCarouselLayout
  | FeaturedCategoriesLayout
  | ProductShowcaseLayout
  | BrandShowcaseLayout

/** Central lookup so future code can validate a layout against its type. */
export const LAYOUT_KEYS: Record<SectionType, readonly string[]> = {
  hero_carousel: HERO_CAROUSEL_LAYOUTS,
  featured_categories: FEATURED_CATEGORIES_LAYOUTS,
  product_showcase: PRODUCT_SHOWCASE_LAYOUTS,
  brand_showcase: BRAND_SHOWCASE_LAYOUTS,
}

// ─── Settings JSON shapes per section type ────────────────────────────────────

/** hero_carousel — slides live in HomeSlide rows; split layout adds a static right panel */
export type HeroCarouselSettings = {
  /** Only used when layout === "split" */
  split_image_url?: string
  split_heading?: string | null
  split_subheading?: string | null
  split_cta_label?: string | null
  split_cta_link?: string | null
  /** Mobile aspect ratio: square=1:1, rectangle=4:3 (default), wide=16:9 */
  mobile_aspect?: "square" | "rectangle" | "wide"
  /** Dark overlay over hero images (improves text legibility) */
  overlay_enabled?: boolean
  /** Overlay strength, 0–100 (%) */
  overlay_opacity?: number
}

export const PRODUCT_SHOWCASE_MOBILE_LAYOUTS = ["grid_2", "carousel", "strip"] as const
export const FEATURED_CATEGORIES_MOBILE_LAYOUTS = ["grid_2", "carousel", "strip"] as const
export type ProductShowcaseMobileLayout = (typeof PRODUCT_SHOWCASE_MOBILE_LAYOUTS)[number]
export type FeaturedCategoriesMobileLayout = (typeof FEATURED_CATEGORIES_MOBILE_LAYOUTS)[number]

/** featured_categories — [] means auto-resolve top-level categories */
export type FeaturedCategoriesSettings = {
  category_ids: string[]
  mobile_layout?: FeaturedCategoriesMobileLayout
}

/** product_showcase */
export type ProductShowcaseSettings = {
  source: "manual" | "category" | "bestsellers"
  category_id?: string
  product_ids?: string[]
  limit: number
  time_window_days?: number // used with source "bestsellers"
  mobile_layout?: ProductShowcaseMobileLayout
}

/** brand_showcase */
export type BrandShowcaseSettings = {
  max_brands?: number
}

export type SectionSettings =
  | HeroCarouselSettings
  | FeaturedCategoriesSettings
  | ProductShowcaseSettings
  | BrandShowcaseSettings

// ─── Module identifier ────────────────────────────────────────────────────────

export const HOMEPAGE_MODULE = "homepage"
