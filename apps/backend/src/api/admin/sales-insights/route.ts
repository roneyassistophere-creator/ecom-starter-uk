import { AuthenticatedMedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { PRODUCT_COST_MODULE } from "../../../modules/productCost"

// Orders that count toward realized sales/profit: fulfilled in some way and not canceled.
const EXCLUDED_FULFILLMENT = new Set(["not_fulfilled", "canceled"])
const PAID_STATUSES = new Set(["captured", "partially_captured"])

function monthStart(d = new Date()): Date {
  return new Date(d.getFullYear(), d.getMonth(), 1)
}

// GET /admin/sales-insights?from=ISO&to=ISO — profit/loss + COD/delivery over FULFILLED orders.
export async function GET(req: AuthenticatedMedusaRequest, res: MedusaResponse) {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
  const costSvc = req.scope.resolve(PRODUCT_COST_MODULE)

  const now = new Date()
  const from = req.query.from ? new Date(String(req.query.from)) : monthStart(now)
  const to = req.query.to ? new Date(String(req.query.to)) : new Date(now)
  to.setHours(23, 59, 59, 999)

  // Cost lookup: variant_id -> cost
  const allCosts = await costSvc.listVariantCosts({}, { take: 100000 })
  const costMap = new Map<string, number>(
    allCosts.map((c: any) => [c.variant_id, Number(c.cost) || 0])
  )

  // Pull orders placed in the range
  const orders: any[] = []
  let offset = 0
  for (;;) {
    const { data } = await query.graph({
      entity: "order",
      fields: [
        "id", "status", "fulfillment_status", "payment_status", "currency_code",
        "total", "item_total", "shipping_total", "created_at",
        "items.id", "items.quantity", "items.variant_id", "items.unit_price",
        "returns.id", "returns.items.item_id", "returns.items.quantity",
      ],
      filters: { created_at: { $gte: from, $lte: to } },
      pagination: { skip: offset, take: 200 },
    })
    orders.push(...data)
    if (data.length < 200) break
    offset += data.length
  }

  const counted = orders.filter(
    (o) => o.status !== "canceled" && !EXCLUDED_FULFILLMENT.has(o.fulfillment_status)
  )

  let productRevenue = 0
  let cogs = 0
  let shippingCollected = 0
  let totalRevenue = 0
  let codPaid = 0
  let codPending = 0
  let currency: string | null = null
  let variantsMissingCost = 0
  let returnedOrders = 0
  let returnedValue = 0 // product revenue of returned items
  const seenMissing = new Set<string>()

  // Returned amounts for an order: item revenue + COGS of returned line quantities.
  const returnedAmounts = (o: any): { revenue: number; cogs: number; hasReturn: boolean } => {
    const itemById = new Map<string, any>((o.items ?? []).map((it: any) => [it.id, it]))
    let revenue = 0
    let retCogs = 0
    for (const ret of o.returns ?? []) {
      for (const ri of ret.items ?? []) {
        const it = itemById.get(ri.item_id)
        const q = Number(ri.quantity) || 0
        if (!it || q <= 0) continue
        revenue += (Number(it.unit_price) || 0) * q
        const vid = it.variant_id
        if (vid && costMap.has(vid)) retCogs += (costMap.get(vid) as number) * q
      }
    }
    return { revenue, cogs: retCogs, hasReturn: (o.returns?.length ?? 0) > 0 }
  }

  for (const o of counted) {
    currency = currency || o.currency_code
    const itemTotal = Number(o.item_total) || 0
    const total = Number(o.total) || 0

    // Net out anything returned — the product came back to stock.
    const ret = returnedAmounts(o)
    const netItem = Math.max(0, itemTotal - ret.revenue)
    const netTotal = Math.max(0, total - ret.revenue)
    if (ret.hasReturn) {
      returnedOrders++
      returnedValue += ret.revenue
    }

    productRevenue += netItem
    shippingCollected += Number(o.shipping_total) || 0
    totalRevenue += netTotal

    for (const it of o.items || []) {
      const vid = it.variant_id
      const qty = Number(it.quantity) || 0
      if (vid && costMap.has(vid)) {
        cogs += (costMap.get(vid) as number) * qty
      } else if (vid && !seenMissing.has(vid)) {
        seenMissing.add(vid)
        variantsMissingCost++
      }
    }
    // Returned items are back in stock, so their COGS is not a cost.
    cogs -= ret.cogs

    if (PAID_STATUSES.has(o.payment_status)) codPaid += netTotal
    else codPending += netTotal
  }

  cogs = Math.max(0, cogs)
  const grossProfit = productRevenue - cogs
  const marginPct = productRevenue > 0 ? (grossProfit / productRevenue) * 100 : 0

  res.json({
    range: { from: from.toISOString(), to: to.toISOString() },
    currency_code: currency,
    counted_orders: counted.length,
    total_orders_in_range: orders.length,
    variants_missing_cost: variantsMissingCost,
    metrics: {
      total_revenue: totalRevenue,
      product_revenue: productRevenue,
      cogs,
      gross_profit: grossProfit,
      margin_pct: marginPct,
      shipping_collected: shippingCollected,
      cod_paid: codPaid,
      cod_pending: codPending,
      avg_order_value: counted.length ? totalRevenue / counted.length : 0,
      returned_orders: returnedOrders,
      returned_value: returnedValue,
    },
  })
}
