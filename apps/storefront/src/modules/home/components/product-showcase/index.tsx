import Image from "next/image"
import Link from "next/link"
import type { HttpTypes } from "@medusajs/types"
import type {
  HomepageProduct,
  ProductShowcaseSection,
  SectionProps,
} from "@modules/home/types"
import StoreProductCard from "@modules/products/components/product-card"
import { listProducts } from "@lib/data/products"
import { getRegion } from "@lib/data/regions"
import { ProductCarousel } from "./product-carousel"

interface Props extends SectionProps {
  variant: "grid_4" | "grid_2" | "carousel" | "list"
}

export async function ProductShowcase({ section, variant, countryCode }: Props) {
  const s = section as ProductShowcaseSection
  const products = s.products ?? []
  if (products.length === 0) return null
  const mobileLayout = s.mobile_layout ?? "grid_2"

  // Fetch full product objects (in the section's order) so the standard grids can
  // reuse the store's configured ProductCard (style, fields, buttons, badges, price).
  const region = await getRegion(countryCode)
  let ordered: HttpTypes.StoreProduct[] = []
  if (region) {
    const ids = products.map((p) => p.id)
    const { response } = await listProducts({
      countryCode,
      queryParams: { id: ids, limit: ids.length } as any,
    })
    const byId = new Map(response.products.map((p) => [p.id, p]))
    ordered = ids
      .map((id) => byId.get(id))
      .filter((p): p is HttpTypes.StoreProduct => Boolean(p))
  }
  const useShared = !!region && ordered.length > 0

  return (
    <section className="py-12">
      <div className="content-container">
        <div className="flex items-center justify-between mb-8">
          <h2
            className="text-2xl font-semibold"
            style={{ fontFamily: "var(--brand-font-heading)", color: "var(--brand-text)" }}
          >
            {s.title}
          </h2>
          <Link
            href={`/${countryCode}/store`}
            className="text-sm font-medium hover:underline underline-offset-4"
            style={{ color: "var(--brand-primary)" }}
          >
            View all &rarr;
          </Link>
        </div>

        {/* Mobile layout (visible below sm = 640px) */}
        <div className="block sm:hidden">
          {mobileLayout === "grid_2" &&
            (useShared ? (
              <SharedGrid
                products={ordered}
                region={region!}
                countryCode={countryCode}
                className="grid grid-cols-2 gap-3"
              />
            ) : (
              <MobileProductGrid products={products} countryCode={countryCode} />
            ))}
          {mobileLayout === "carousel" && (
            <ProductCarousel products={products} countryCode={countryCode} />
          )}
          {mobileLayout === "strip" && (
            <MobileProductStrip
              products={products}
              countryCode={countryCode}
              href={`/${countryCode}/store`}
            />
          )}
        </div>

        {/* Desktop layout (visible at sm and above) */}
        <div className="hidden sm:block">
          {variant === "grid_4" &&
            (useShared ? (
              <SharedGrid
                products={ordered}
                region={region!}
                countryCode={countryCode}
                className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6"
              />
            ) : (
              <ProductGrid products={products} countryCode={countryCode} />
            ))}
          {variant === "grid_2" && (
            <BestSellingGrid products={products} countryCode={countryCode} />
          )}
          {variant === "carousel" && (
            <ProductCarousel products={products} countryCode={countryCode} />
          )}
          {variant === "list" && (
            <ProductList products={products} countryCode={countryCode} />
          )}
        </div>
      </div>
    </section>
  )
}

// Standard product grids reuse the store's configured ProductCard.
function SharedGrid({
  products,
  region,
  countryCode,
  className,
}: {
  products: HttpTypes.StoreProduct[]
  region: HttpTypes.StoreRegion
  countryCode: string
  className: string
}) {
  return (
    <div className={className}>
      {products.map((p) => (
        <StoreProductCard key={p.id} product={p} region={region} countryCode={countryCode} />
      ))}
    </div>
  )
}

// ─── Price formatter ──────────────────────────────────────────────────────────

function formatPrice(amount: number, currencyCode: string): string {
  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currencyCode.toUpperCase(),
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  } catch {
    return `${amount.toLocaleString()} ${currencyCode.toUpperCase()}`
  }
}

// ─── Mobile: 2-column compact grid ───────────────────────────────────────────

function MobileProductGrid({
  products,
  countryCode,
}: {
  products: HomepageProduct[]
  countryCode: string
}) {
  return (
    <div className="grid grid-cols-2 gap-3">
      {products.map((p) => (
        <Link
          key={p.id}
          href={`/${countryCode}/products/${p.handle}`}
          className="group block"
        >
          <div className="relative aspect-square w-full overflow-hidden rounded-xl bg-gray-100 mb-2">
            {p.thumbnail ? (
              <Image
                src={p.thumbnail}
                alt={p.title}
                fill
                className="object-cover group-hover:scale-105 transition-transform duration-300"
              />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center text-gray-300 text-xs">
                No image
              </div>
            )}
          </div>
          <p
            className="text-xs font-medium truncate leading-snug"
            style={{ color: "var(--brand-text)" }}
          >
            {p.title}
          </p>
          {p.price && (
            <p
              className="text-xs font-semibold mt-0.5"
              style={{ color: "var(--brand-primary)" }}
            >
              {formatPrice(p.price.amount, p.price.currency_code)}
            </p>
          )}
        </Link>
      ))}
    </div>
  )
}

// ─── Mobile: peek strip (2 items + See all) ───────────────────────────────────

function MobileProductStrip({
  products,
  countryCode,
  href,
}: {
  products: HomepageProduct[]
  countryCode: string
  href: string
}) {
  const preview = products.slice(0, 2)

  return (
    <div className="flex items-stretch gap-3">
      {preview.map((p) => (
        <Link
          key={p.id}
          href={`/${countryCode}/products/${p.handle}`}
          className="flex-1 group block min-w-0"
        >
          <div className="relative aspect-square w-full overflow-hidden rounded-xl bg-gray-100 mb-1.5">
            {p.thumbnail ? (
              <Image
                src={p.thumbnail}
                alt={p.title}
                fill
                className="object-cover group-hover:scale-105 transition-transform duration-300"
              />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center text-gray-300 text-xs">
                No image
              </div>
            )}
          </div>
          <p
            className="text-xs font-medium truncate"
            style={{ color: "var(--brand-text)" }}
          >
            {p.title}
          </p>
          {p.price && (
            <p
              className="text-xs font-semibold mt-0.5"
              style={{ color: "var(--brand-primary)" }}
            >
              {formatPrice(p.price.amount, p.price.currency_code)}
            </p>
          )}
        </Link>
      ))}
      <Link
        href={href}
        className="flex-none w-14 flex flex-col items-center justify-center gap-1 rounded-xl"
        style={{ backgroundColor: "var(--brand-primary)" }}
      >
        <span className="text-white text-lg font-bold leading-none">&rarr;</span>
        <span className="text-white text-xs font-medium text-center leading-tight">
          See all
        </span>
      </Link>
    </div>
  )
}

// ─── Desktop: grid_2 — horizontal "Best Selling" cards ───────────────────────

function BestSellingGrid({
  products,
  countryCode,
}: {
  products: HomepageProduct[]
  countryCode: string
}) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      {products.map((p) => (
        <BestSellingCard key={p.id} product={p} countryCode={countryCode} />
      ))}
    </div>
  )
}

function BestSellingCard({
  product,
  countryCode,
}: {
  product: HomepageProduct
  countryCode: string
}) {
  const href = `/${countryCode}/products/${product.handle}`

  return (
    <div className="relative flex bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden min-h-[160px]">
      {/* Best Selling badge */}
      <div
        className="absolute top-3 right-3 z-10 flex items-center gap-1 text-white text-xs font-semibold px-2.5 py-1 rounded-full"
        style={{ backgroundColor: "#e53e3e" }}
      >
        <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 14H9V8h2v8zm4 0h-2V8h2v8z" />
        </svg>
        Best Selling
      </div>

      {/* Left: product image */}
      <Link href={href} className="relative flex-shrink-0 w-36 sm:w-44 bg-gray-50" tabIndex={-1} aria-hidden="true">
        {product.thumbnail ? (
          <Image src={product.thumbnail} alt={product.title} fill className="object-contain p-3" />
        ) : (
          <div
            className="absolute inset-0 flex items-center justify-center text-3xl font-bold"
            style={{ color: "var(--brand-primary)", opacity: 0.3 }}
          >
            {product.title[0]}
          </div>
        )}
      </Link>

      {/* Right: info */}
      <div className="flex flex-col justify-center gap-2.5 p-4 pr-12 flex-1 min-w-0">
        <Link href={href}>
          <h3
            className="font-semibold text-base leading-snug line-clamp-2 hover:underline underline-offset-2"
            style={{ color: "var(--brand-text)" }}
          >
            {product.title}
          </h3>
        </Link>

        {product.price && (
          <p className="text-lg font-bold leading-none" style={{ color: "var(--brand-primary)" }}>
            {formatPrice(product.price.amount, product.price.currency_code)}
          </p>
        )}

        <div className="flex gap-2 flex-wrap">
          <Link
            href={href}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border text-xs font-semibold transition-colors hover:bg-gray-50"
            style={{ borderColor: "var(--brand-primary)", color: "var(--brand-primary)" }}
          >
            <CartIcon />
            Add To Cart
          </Link>
          <Link
            href={href}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold transition-opacity hover:opacity-90"
            style={{ backgroundColor: "var(--brand-primary)", color: "#fff" }}
          >
            <CartIcon />
            Buy now
          </Link>
        </div>
      </div>
    </div>
  )
}

function CartIcon() {
  return (
    <svg
      width="13"
      height="13"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <circle cx="9" cy="21" r="1" />
      <circle cx="20" cy="21" r="1" />
      <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
    </svg>
  )
}

// ─── Desktop: grid_4 ──────────────────────────────────────────────────────────

function ProductGrid({
  products,
  countryCode,
}: {
  products: HomepageProduct[]
  countryCode: string
}) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
      {products.map((p) => (
        <ProductCard key={p.id} product={p} countryCode={countryCode} />
      ))}
    </div>
  )
}

function ProductCard({
  product,
  countryCode,
}: {
  product: HomepageProduct
  countryCode: string
}) {
  return (
    <Link href={`/${countryCode}/products/${product.handle}`} className="group block">
      <div className="relative aspect-[3/4] w-full overflow-hidden rounded-xl bg-gray-100 mb-3">
        {product.thumbnail ? (
          <Image
            src={product.thumbnail}
            alt={product.title}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-gray-300 text-xs">
            No image
          </div>
        )}
      </div>
      <p className="text-sm font-medium truncate" style={{ color: "var(--brand-text)" }}>
        {product.title}
      </p>
      {product.price && (
        <p className="text-sm font-semibold mt-0.5" style={{ color: "var(--brand-primary)" }}>
          {formatPrice(product.price.amount, product.price.currency_code)}
        </p>
      )}
    </Link>
  )
}

// ─── Desktop: list ────────────────────────────────────────────────────────────

function ProductList({
  products,
  countryCode,
}: {
  products: HomepageProduct[]
  countryCode: string
}) {
  return (
    <div className="flex flex-col divide-y" style={{ borderColor: "var(--brand-bg)" }}>
      {products.map((p) => (
        <Link
          key={p.id}
          href={`/${countryCode}/products/${p.handle}`}
          className="flex items-center gap-4 py-4 px-2 rounded-lg hover:bg-gray-50 transition-colors group"
        >
          <div className="relative w-16 h-16 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
            {p.thumbnail && (
              <Image src={p.thumbnail} alt={p.title} fill className="object-cover" />
            )}
          </div>
          <span
            className="flex-1 text-sm font-medium truncate group-hover:underline underline-offset-4"
            style={{ color: "var(--brand-text)" }}
          >
            {p.title}
          </span>
          <span className="text-sm shrink-0" style={{ color: "var(--brand-primary)" }}>
            &rarr;
          </span>
        </Link>
      ))}
    </div>
  )
}
