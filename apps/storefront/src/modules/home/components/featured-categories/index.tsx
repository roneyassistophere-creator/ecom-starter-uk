import Image from "next/image"
import Link from "next/link"
import type {
  FeaturedCategoriesSection,
  HomepageCategory,
  SectionProps,
} from "@modules/home/types"
import { CategoryCarousel } from "./category-carousel"

interface Props extends SectionProps {
  variant: "grid" | "circles" | "horizontal_scroll"
}

export function FeaturedCategories({ section, variant, countryCode }: Props) {
  const s = section as FeaturedCategoriesSection
  const categories = s.categories ?? []
  if (categories.length === 0) return null
  const mobileLayout = s.mobile_layout ?? "grid_2"

  return (
    <section className="py-12">
      <div className="content-container">
        <h2
          className="text-2xl font-semibold mb-8"
          style={{ fontFamily: "var(--brand-font-heading)", color: "var(--brand-text)" }}
        >
          {s.title}
        </h2>

        {/* Mobile layout (visible below sm = 640px) */}
        <div className="block sm:hidden">
          {mobileLayout === "grid_2" && (
            <MobileCategoryGrid categories={categories} countryCode={countryCode} />
          )}
          {mobileLayout === "carousel" && (
            <CategoryCarousel categories={categories} countryCode={countryCode} />
          )}
          {mobileLayout === "strip" && (
            <MobileCategoryStrip categories={categories} countryCode={countryCode} />
          )}
        </div>

        {/* Desktop layout (visible at sm and above) */}
        <div className="hidden sm:block">
          {variant === "grid" && (
            <Grid categories={categories} countryCode={countryCode} />
          )}
          {variant === "circles" && (
            <Circles categories={categories} countryCode={countryCode} />
          )}
          {variant === "horizontal_scroll" && (
            <HorizontalScroll categories={categories} countryCode={countryCode} />
          )}
        </div>
      </div>
    </section>
  )
}

// ─── Mobile: 2-column compact grid ───────────────────────────────────────────

function MobileCategoryGrid({
  categories,
  countryCode,
}: {
  categories: HomepageCategory[]
  countryCode: string
}) {
  return (
    <div className="grid grid-cols-2 gap-3">
      {categories.map((cat) => (
        <Link
          key={cat.id}
          href={`/${countryCode}/categories/${cat.handle}`}
          className="group relative aspect-square overflow-hidden rounded-xl bg-gray-100 hover:opacity-90 transition-opacity"
        >
          {cat.thumbnail ? (
            <Image src={cat.thumbnail} alt={cat.name} fill className="object-cover" />
          ) : (
            <>
              <div
                className="absolute inset-0"
                style={{ backgroundColor: "var(--brand-primary)", opacity: 0.2 }}
              />
              <span
                className="absolute inset-0 flex items-center justify-center text-2xl font-bold"
                style={{ color: "var(--brand-primary)" }}
              >
                {cat.name[0]}
              </span>
            </>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
          <span className="absolute bottom-2 left-2 right-2 text-white font-semibold text-xs truncate">
            {cat.name}
          </span>
        </Link>
      ))}
    </div>
  )
}

// ─── Mobile: circle strip (3 items + See all circle) ─────────────────────────

function MobileCategoryStrip({
  categories,
  countryCode,
}: {
  categories: HomepageCategory[]
  countryCode: string
}) {
  const preview = categories.slice(0, 3)

  return (
    <div className="flex items-start gap-3">
      {preview.map((cat) => (
        <Link
          key={cat.id}
          href={`/${countryCode}/categories/${cat.handle}`}
          className="flex flex-col items-center gap-1.5 flex-1 min-w-0"
        >
          <div
            className="w-16 h-16 rounded-full overflow-hidden bg-gray-100 flex items-center justify-center"
            style={{ border: "2px solid var(--brand-primary)" }}
          >
            {cat.thumbnail ? (
              <div className="relative w-full h-full">
                <Image src={cat.thumbnail} alt={cat.name} fill className="object-cover" />
              </div>
            ) : (
              <span
                className="text-xl font-bold"
                style={{ color: "var(--brand-primary)" }}
              >
                {cat.name[0]}
              </span>
            )}
          </div>
          <span
            className="text-xs font-medium text-center line-clamp-2 w-full leading-tight"
            style={{ color: "var(--brand-text)" }}
          >
            {cat.name}
          </span>
        </Link>
      ))}
      {/* See all tile */}
      <Link
        href={`/${countryCode}/categories`}
        className="flex flex-col items-center gap-1.5 flex-1 min-w-0"
      >
        <div
          className="w-16 h-16 rounded-full flex items-center justify-center"
          style={{ backgroundColor: "var(--brand-primary)" }}
        >
          <span className="text-white text-xl font-bold">&rarr;</span>
        </div>
        <span
          className="text-xs font-medium text-center leading-tight"
          style={{ color: "var(--brand-text)" }}
        >
          See all
        </span>
      </Link>
    </div>
  )
}

// ─── Desktop: grid ────────────────────────────────────────────────────────────

function Grid({
  categories,
  countryCode,
}: {
  categories: HomepageCategory[]
  countryCode: string
}) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
      {categories.map((cat) => (
        <Link
          key={cat.id}
          href={`/${countryCode}/categories/${cat.handle}`}
          className="group relative aspect-square overflow-hidden rounded-xl bg-gray-100 hover:opacity-90 transition-opacity"
        >
          {cat.thumbnail ? (
            <Image src={cat.thumbnail} alt={cat.name} fill className="object-cover" />
          ) : (
            <>
              <div className="absolute inset-0" style={{ backgroundColor: "var(--brand-primary)", opacity: 0.2 }} />
              <span
                className="absolute inset-0 flex items-center justify-center text-2xl font-bold"
                style={{ color: "var(--brand-primary)" }}
              >
                {cat.name[0]}
              </span>
            </>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
          <span className="absolute bottom-3 left-3 right-3 text-white font-semibold text-sm truncate">
            {cat.name}
          </span>
        </Link>
      ))}
    </div>
  )
}

// ─── Desktop: circles ─────────────────────────────────────────────────────────

function Circles({
  categories,
  countryCode,
}: {
  categories: HomepageCategory[]
  countryCode: string
}) {
  return (
    <div className="flex flex-wrap gap-6 justify-center">
      {categories.map((cat) => (
        <Link
          key={cat.id}
          href={`/${countryCode}/categories/${cat.handle}`}
          className="flex flex-col items-center gap-3 group"
        >
          <div
            className="relative w-24 h-24 rounded-full overflow-hidden bg-gray-100 ring-0 group-hover:ring-2 group-hover:ring-offset-2 ring-offset-white transition-all"
            style={{ "--tw-ring-color": "var(--brand-primary)" } as React.CSSProperties}
          >
            {cat.thumbnail ? (
              <Image src={cat.thumbnail} alt={cat.name} fill className="object-cover" />
            ) : (
              <div
                className="w-full h-full flex items-center justify-center text-xl font-bold text-white"
                style={{ backgroundColor: "var(--brand-primary)" }}
              >
                {cat.name[0]}
              </div>
            )}
          </div>
          <span
            className="text-sm font-medium text-center max-w-[6rem] leading-tight"
            style={{ color: "var(--brand-text)" }}
          >
            {cat.name}
          </span>
        </Link>
      ))}
    </div>
  )
}

// ─── Desktop: horizontal_scroll ───────────────────────────────────────────────

function HorizontalScroll({
  categories,
  countryCode,
}: {
  categories: HomepageCategory[]
  countryCode: string
}) {
  return (
    // px-6 gives room for the -left-5/-right-5 arrow buttons on desktop
    <div className="sm:px-6">
      <CategoryCarousel categories={categories} countryCode={countryCode} />
    </div>
  )
}
