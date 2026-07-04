// Mirrors the contract shape returned by GET /store/homepage.
// Keep in sync with apps/backend/src/modules/homepage/types.ts layout keys.

export interface HeroSlide {
  id: string
  image_url: string
  mobile_image_url: string | null
  heading: string | null
  subheading: string | null
  cta_label: string | null
  cta_link: string | null
  position: number
}

export interface HomepageCategory {
  id: string
  name: string
  handle: string
  thumbnail: string | null
}

export interface HomepageProduct {
  id: string
  title: string
  handle: string
  thumbnail: string | null
  price: { amount: number; currency_code: string } | null
}

interface SectionBase {
  id: string
  title: string
  layout: string
  position: number
  /** Which devices this section shows on. Defaults to "all". */
  visibility: "all" | "desktop" | "mobile"
}

export interface HeroSplitPanel {
  image_url: string | null
  heading: string | null
  subheading: string | null
  cta_label: string | null
  cta_link: string | null
}

export interface HeroCarouselSection extends SectionBase {
  type: "hero_carousel"
  slides: HeroSlide[]
  /** Present only when layout === "split" */
  split_panel?: HeroSplitPanel
  /** Mobile aspect ratio — always set by the store route (default: "rectangle") */
  mobile_aspect: "square" | "rectangle" | "wide"
  /** Optional dark overlay over hero images, configured in admin */
  overlay?: { enabled: boolean; opacity: number }
}

export interface FeaturedCategoriesSection extends SectionBase {
  type: "featured_categories"
  categories: HomepageCategory[]
  mobile_layout: "grid_2" | "carousel" | "strip"
}

export interface ProductShowcaseSection extends SectionBase {
  type: "product_showcase"
  products: HomepageProduct[]
  mobile_layout: "grid_2" | "carousel" | "strip"
}

export interface BrandShowcaseBrand {
  id: string
  name: string
  handle: string
  logo_url: string | null
}

export interface BrandShowcaseSection extends SectionBase {
  type: "brand_showcase"
  brands: BrandShowcaseBrand[]
}

export type HomepageSection =
  | HeroCarouselSection
  | FeaturedCategoriesSection
  | ProductShowcaseSection
  | BrandShowcaseSection

// Common props passed to every section component
export interface SectionProps {
  section: HomepageSection
  countryCode: string
}
