import { AuthenticatedMedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { PRODUCT_COST_MODULE } from "../../../modules/productCost"

// GET /admin/variant-costs?product_id=prod_xxx — a product's variants with their cost prices
export async function GET(req: AuthenticatedMedusaRequest, res: MedusaResponse) {
  const productId = req.query.product_id as string | undefined
  if (!productId) {
    return res.status(400).json({ error: "product_id query param is required" })
  }

  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
  const svc = req.scope.resolve(PRODUCT_COST_MODULE)

  const { data: products } = await query.graph({
    entity: "product",
    filters: { id: productId },
    fields: ["id", "variants.id", "variants.title", "variants.sku"],
  })
  const variants: any[] = products?.[0]?.variants ?? []
  const ids = variants.map((v) => v.id)

  const costs = ids.length ? await svc.listVariantCosts({ variant_id: ids }) : []
  const costMap = new Map(costs.map((c: any) => [c.variant_id, c.cost]))

  res.json({
    variant_costs: variants.map((v) => ({
      variant_id: v.id,
      title: v.title,
      sku: v.sku,
      cost: Number(costMap.get(v.id) ?? 0),
    })),
  })
}

// POST /admin/variant-costs — upsert cost prices: { costs: [{ variant_id, cost }] }
export async function POST(req: AuthenticatedMedusaRequest, res: MedusaResponse) {
  const svc = req.scope.resolve(PRODUCT_COST_MODULE)
  const { costs } = (req.body ?? {}) as {
    costs?: { variant_id: string; cost: number | string }[]
  }
  if (!costs?.length) {
    return res.status(400).json({ error: "costs[] is required" })
  }

  const variantIds = costs.map((c) => c.variant_id)
  const existing = await svc.listVariantCosts({ variant_id: variantIds })
  const existingMap = new Map(existing.map((e: any) => [e.variant_id, e.id]))

  const toCreate: { variant_id: string; cost: number }[] = []
  const toUpdate: { id: string; cost: number }[] = []
  for (const c of costs) {
    const amount = Math.max(0, Number(c.cost) || 0)
    const id = existingMap.get(c.variant_id)
    if (id) toUpdate.push({ id, cost: amount })
    else toCreate.push({ variant_id: c.variant_id, cost: amount })
  }

  if (toCreate.length) await svc.createVariantCosts(toCreate)
  if (toUpdate.length) await svc.updateVariantCosts(toUpdate)

  res.json({ ok: true, created: toCreate.length, updated: toUpdate.length })
}
