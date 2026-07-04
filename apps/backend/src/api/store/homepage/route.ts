import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { HOMEPAGE_MODULE } from "../../../modules/homepage"
import { BRAND_MODULE } from "../../../modules/brand"
import type {
  BrandShowcaseSettings,
  FeaturedCategoriesSettings,
  HeroCarouselSettings,
  ProductShowcaseSettings,
} from "../../../modules/homepage/types"

// ─── Category resolution ──────────────────────────────────────────────────────

async function resolveCategories(
  query: any,
  categoryIds: string[]
): Promise<{ id: string; name: string; handle: string; thumbnail: string | null }[]> {
  const filters =
    categoryIds.length > 0
      ? { id: categoryIds }
      : { parent_category_id: null } // top-level fallback when category_ids is []

  const { data } = await query.graph({
    entity: "product_category",
    fields: ["id", "name", "handle", "metadata"],
    filters,
  })

  // Preserve order for explicit id lists
  if (categoryIds.length > 0) {
    const order = new Map(categoryIds.map((id, i) => [id, i]))
    data.sort((a: any, b: any) => (order.get(a.id) ?? 99) - (order.get(b.id) ?? 99))
  }

  return (data as any[]).map((c) => ({
    id: c.id,
    name: c.name,
    handle: c.handle,
    thumbnail: (c.metadata?.thumbnail_url as string) || null,
  }))
}

// ─── Product resolution helpers ───────────────────────────────────────────────

/** Lean product shape matching the contract */
function shapeProduct(p: any) {
  // Pick the first price found across all variants
  let price: { amount: number; currency_code: string } | null = null
  for (const variant of p.variants ?? []) {
    for (const pr of variant.prices ?? []) {
      if (pr.amount != null && pr.currency_code) {
        price = { amount: pr.amount, currency_code: pr.currency_code }
        break
      }
    }
    if (price) break
  }

  return {
    id: p.id,
    title: p.title,
    handle: p.handle,
    thumbnail: p.thumbnail ?? null,
    price,
  }
}

const PRODUCT_FIELDS = [
  "id", "title", "handle", "thumbnail",
  "variants.prices.amount", "variants.prices.currency_code",
]

async function resolveManualProducts(
  query: any,
  productIds: string[],
  limit: number
): Promise<any[]> {
  if (!productIds?.length) return []

  const { data } = await query.graph({
    entity: "product",
    fields: PRODUCT_FIELDS,
    filters: { id: productIds.slice(0, limit), status: "published" },
  })

  // Preserve the admin-defined order
  const order = new Map(productIds.map((id, i) => [id, i]))
  return (data as any[])
    .sort((a, b) => (order.get(a.id) ?? 99) - (order.get(b.id) ?? 99))
    .map(shapeProduct)
}

async function resolveCategoryProducts(
  query: any,
  categoryId: string,
  limit: number
): Promise<any[]> {
  const { data } = await query.graph({
    entity: "product",
    fields: PRODUCT_FIELDS,
    filters: {
      categories: { id: categoryId },
      status: "published",
    },
    pagination: { take: limit },
  })

  return (data as any[]).map(shapeProduct)
}

async function resolveNewestProducts(query: any, limit: number): Promise<any[]> {
  const { data } = await query.graph({
    entity: "product",
    fields: PRODUCT_FIELDS,
    filters: { status: "published" },
    pagination: { take: limit, order: { created_at: "DESC" } },
  })
  return (data as any[]).map(shapeProduct)
}

/**
 * Bestsellers: aggregate order line-item quantities per product within the
 * time window, then return the top `limit` products by quantity sold.
 *
 * Fallback: if there are no orders yet, if the query fails, or if the result
 * set is empty, fall back to newest-products ordering and log a note.
 */
async function resolveBestsellers(
  query: any,
  limit: number,
  timeWindowDays: number
): Promise<any[]> {
  try {
    const cutoff = new Date()
    cutoff.setDate(cutoff.getDate() - timeWindowDays)

    // Fetch recent orders with their line items (capped to 500 orders to keep
    // the aggregation lightweight; for high-volume stores replace with a raw SQL
    // aggregate query or a dedicated analytics table).
    const { data: orders } = await query.graph({
      entity: "order",
      fields: ["id", "items.product_id", "items.quantity"],
      filters: { created_at: { $gte: cutoff.toISOString() } },
      pagination: { take: 500 },
    })

    // Aggregate quantities per product
    const qty = new Map<string, number>()
    for (const order of orders as any[]) {
      for (const item of order.items ?? []) {
        if (item.product_id) {
          qty.set(item.product_id, (qty.get(item.product_id) ?? 0) + (item.quantity ?? 0))
        }
      }
    }

    if (qty.size === 0) {
      // No order data in the window — fall back to newest
      return resolveNewestProducts(query, limit)
    }

    const topIds = [...qty.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, limit)
      .map(([id]) => id)

    const { data } = await query.graph({
      entity: "product",
      fields: PRODUCT_FIELDS,
      filters: { id: topIds, status: "published" },
    })

    const order = new Map(topIds.map((id, i) => [id, i]))
    return (data as any[])
      .sort((a, b) => (order.get(a.id) ?? 99) - (order.get(b.id) ?? 99))
      .map(shapeProduct)
  } catch {
    // Fallback: query.graph on orders failed (no orders table, empty DB, etc.)
    return resolveNewestProducts(query, limit)
  }
}

async function resolveProducts(query: any, settings: ProductShowcaseSettings): Promise<any[]> {
  const limit = settings.limit ?? 8

  switch (settings.source) {
    case "manual":
      return resolveManualProducts(query, settings.product_ids ?? [], limit)

    case "category":
      if (!settings.category_id) return []
      return resolveCategoryProducts(query, settings.category_id, limit)

    case "bestsellers":
      return resolveBestsellers(query, limit, settings.time_window_days ?? 30)

    default:
      return []
  }
}

// ─── Store route ──────────────────────────────────────────────────────────────

// GET /store/homepage — public, no auth required
export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const svc   = req.scope.resolve(HOMEPAGE_MODULE)
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)

  // Fetch only enabled sections, sorted by position
  const sections = await svc.listHomeSections(
    { enabled: true },
    { relations: ["slides"], order: { position: "ASC" } }
  )

  const resolved = await Promise.all(
    sections.map(async (section: any) => {
      const base = {
        id:         section.id,
        type:       section.type,
        layout:     section.layout,
        title:      section.title,
        position:   section.position,
        visibility: ((section.settings as any)?.visibility as string) ?? "all",
      }

      switch (section.type) {
        case "hero_carousel": {
          const slides = (section.slides ?? [])
            .sort((a: any, b: any) => a.position - b.position)
            .map((s: any) => ({
              id:               s.id,
              image_url:        s.image_url,
              mobile_image_url: s.mobile_image_url,
              heading:          s.heading,
              subheading:       s.subheading,
              cta_label:        s.cta_label,
              cta_link:         s.cta_link,
              position:         s.position,
            }))

          const cfg = (section.settings ?? {}) as HeroCarouselSettings
          const result: Record<string, unknown> = {
            ...base,
            slides,
            mobile_aspect: cfg.mobile_aspect ?? "rectangle",
            overlay: {
              enabled: Boolean(cfg.overlay_enabled),
              opacity: typeof cfg.overlay_opacity === "number" ? cfg.overlay_opacity : 40,
            },
          }
          if (section.layout === "split") {
            result.split_panel = {
              image_url:  cfg.split_image_url  ?? null,
              heading:    cfg.split_heading    ?? null,
              subheading: cfg.split_subheading ?? null,
              cta_label:  cfg.split_cta_label  ?? null,
              cta_link:   cfg.split_cta_link   ?? null,
            }
          }
          return result
        }

        case "featured_categories": {
          const settings = (section.settings ?? { category_ids: [] }) as FeaturedCategoriesSettings
          const categories = await resolveCategories(query, settings.category_ids ?? [])
          const mobile_layout = settings.mobile_layout ?? "grid_2"
          return { ...base, categories, mobile_layout }
        }

        case "product_showcase": {
          const settings = section.settings as ProductShowcaseSettings
          if (!settings) return { ...base, products: [], mobile_layout: "grid_2" }
          const products = await resolveProducts(query, settings)
          const mobile_layout = settings.mobile_layout ?? "grid_2"
          return { ...base, products, mobile_layout }
        }

        case "brand_showcase": {
          const brandSvc = req.scope.resolve(BRAND_MODULE)
          const settings = (section.settings ?? {}) as BrandShowcaseSettings
          const limit = settings.max_brands || 100
          const [brands] = await brandSvc.listBrands(
            {},
            { take: limit, order: { position: "ASC" } }
          )
          const shaped = (brands as unknown as any[]).map((b) => ({
            id: b.id,
            name: b.name,
            handle: b.handle,
            logo_url: b.logo_url ?? null,
          }))
          return { ...base, brands: shaped }
        }

        default:
          return base
      }
    })
  )

  res.json({ sections: resolved })
}
