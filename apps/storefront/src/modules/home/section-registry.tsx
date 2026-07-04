import type React from "react"
import type { SectionProps } from "@modules/home/types"
import { HeroCarousel } from "./components/hero-carousel"
import { FeaturedCategories } from "./components/featured-categories"
import { ProductShowcase } from "./components/product-showcase"
import { BrandShowcase } from "./components/brand-showcase"

type SectionComponent = React.ComponentType<SectionProps>

// Two-level map: section.type → section.layout → component to render.
// Unknown types or layouts are skipped in page.tsx — add entries here to extend.
export const SECTION_REGISTRY: Record<
  string,
  Record<string, SectionComponent>
> = {
  hero_carousel: {
    full_width: (props) => <HeroCarousel {...props} variant="full_width" />,
    boxed:      (props) => <HeroCarousel {...props} variant="boxed" />,
    split:      (props) => <HeroCarousel {...props} variant="split" />,
  },
  featured_categories: {
    grid: (props) => <FeaturedCategories {...props} variant="grid" />,
    circles: (props) => <FeaturedCategories {...props} variant="circles" />,
    horizontal_scroll: (props) => (
      <FeaturedCategories {...props} variant="horizontal_scroll" />
    ),
  },
  product_showcase: {
    grid_4:   (props) => <ProductShowcase {...props} variant="grid_4" />,
    grid_2:   (props) => <ProductShowcase {...props} variant="grid_2" />,
    carousel: (props) => <ProductShowcase {...props} variant="carousel" />,
    list:     (props) => <ProductShowcase {...props} variant="list" />,
  },
  brand_showcase: {
    grid:              (props) => <BrandShowcase {...props} variant="grid" />,
    horizontal_scroll: (props) => <BrandShowcase {...props} variant="horizontal_scroll" />,
  },
}
