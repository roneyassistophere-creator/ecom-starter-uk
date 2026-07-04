import { AuthenticatedMedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { Modules } from "@medusajs/framework/utils"

// Typing the confirmation phrase is required to run this destructive reset.
const CONFIRM_PHRASE = "store reset"
const PAGE = 500

type ResetBody = {
  confirm?: string
  inventory?: { enabled?: boolean; value?: 0 | 1 }
  orders?: boolean
  customers?: { enabled?: boolean; identities?: boolean }
}

// Collect every id from a paginated list method: listFn(skip, take) -> rows[]
async function collectIds(
  listFn: (skip: number, take: number) => Promise<any[]>
): Promise<string[]> {
  const ids: string[] = []
  let skip = 0
  for (;;) {
    const rows = await listFn(skip, PAGE)
    if (!rows?.length) break
    ids.push(...rows.map((r) => r.id))
    if (rows.length < PAGE) break
    skip += rows.length
  }
  return ids
}

export async function POST(req: AuthenticatedMedusaRequest, res: MedusaResponse) {
  const body = (req.body ?? {}) as ResetBody
  const logger = req.scope.resolve("logger") as any

  if (body.confirm !== CONFIRM_PHRASE) {
    return res.status(400).json({ error: `Type "${CONFIRM_PHRASE}" exactly to confirm.` })
  }

  const wantInventory = Boolean(body.inventory?.enabled)
  const wantOrders = Boolean(body.orders)
  const wantCustomers = Boolean(body.customers?.enabled)

  if (!wantInventory && !wantOrders && !wantCustomers) {
    return res.status(400).json({ error: "Select at least one thing to reset." })
  }

  const summary: Record<string, unknown> = {}
  const errors: Record<string, string> = {}

  // ── Inventory: set every stock level to the chosen value (0 or 1) ────────────
  if (wantInventory) {
    const value = body.inventory?.value === 1 ? 1 : 0
    try {
      const inventory = req.scope.resolve(Modules.INVENTORY) as any
      let skip = 0
      let updated = 0
      for (;;) {
        const levels = await inventory.listInventoryLevels(
          {},
          { take: PAGE, skip, select: ["id", "inventory_item_id", "location_id"] }
        )
        if (!levels?.length) break
        await inventory.updateInventoryLevels(
          levels.map((l: any) => ({
            inventory_item_id: l.inventory_item_id,
            location_id: l.location_id,
            stocked_quantity: value,
          }))
        )
        updated += levels.length
        if (levels.length < PAGE) break
        skip += levels.length
      }
      summary.inventory = { levels_updated: updated, set_to: value }
    } catch (e: any) {
      errors.inventory = e.message
      logger?.error(`[store-reset] inventory failed: ${e.message}`)
    }
  }

  // ── Orders & sales: soft-delete orders (+drafts), returns, exchanges, carts ──
  if (wantOrders) {
    try {
      const order = req.scope.resolve(Modules.ORDER) as any

      const returnIds = await collectIds((skip, take) =>
        order.listReturns({}, { take, skip, select: ["id"] })
      )
      if (returnIds.length) await order.softDeleteReturns(returnIds)

      const exchangeIds = await collectIds((skip, take) =>
        order.listOrderExchanges({}, { take, skip, select: ["id"] })
      )
      if (exchangeIds.length) await order.softDeleteOrderExchanges(exchangeIds)

      // listOrders returns both regular and draft orders
      const orderIds = await collectIds((skip, take) =>
        order.listOrders({}, { take, skip, select: ["id"] })
      )
      if (orderIds.length) await order.softDeleteOrders(orderIds)

      let cartCount = 0
      try {
        const cart = req.scope.resolve(Modules.CART) as any
        const cartIds = await collectIds((skip, take) =>
          cart.listCarts({}, { take, skip, select: ["id"] })
        )
        if (cartIds.length) await cart.softDeleteCarts(cartIds)
        cartCount = cartIds.length
      } catch (e: any) {
        errors.carts = e.message
      }

      summary.orders = {
        orders: orderIds.length,
        returns: returnIds.length,
        exchanges: exchangeIds.length,
        carts: cartCount,
      }
    } catch (e: any) {
      errors.orders = e.message
      logger?.error(`[store-reset] orders failed: ${e.message}`)
    }
  }

  // ── Customers: soft-delete customers (+ optional auth/login identities) ──────
  if (wantCustomers) {
    try {
      const customerSvc = req.scope.resolve(Modules.CUSTOMER) as any

      // Gather customer ids (need ids for auth-identity cleanup)
      const customerIds: string[] = []
      let skip = 0
      for (;;) {
        const rows = await customerSvc.listCustomers({}, { take: PAGE, skip, select: ["id"] })
        if (!rows?.length) break
        customerIds.push(...rows.map((c: any) => c.id))
        if (rows.length < PAGE) break
        skip += rows.length
      }

      let identitiesDeleted = 0
      if (body.customers?.identities && customerIds.length) {
        try {
          const auth = req.scope.resolve(Modules.AUTH) as any
          const customerIdSet = new Set(customerIds)
          // Only delete auth identities that belong to a CUSTOMER we're removing.
          // Admin/user identities carry app_metadata.user_id and are never touched.
          const toDelete: string[] = []
          let aSkip = 0
          for (;;) {
            const idents = await auth.listAuthIdentities(
              {},
              { take: PAGE, skip: aSkip, select: ["id", "app_metadata"] }
            )
            if (!idents?.length) break
            for (const ai of idents) {
              const cid = ai.app_metadata?.customer_id
              if (cid && customerIdSet.has(cid)) toDelete.push(ai.id)
            }
            if (idents.length < PAGE) break
            aSkip += idents.length
          }
          if (toDelete.length) await auth.deleteAuthIdentities(toDelete)
          identitiesDeleted = toDelete.length
        } catch (e: any) {
          errors.customer_identities = e.message
        }
      }

      if (customerIds.length) await customerSvc.softDeleteCustomers(customerIds)

      summary.customers = {
        customers: customerIds.length,
        login_identities_deleted: identitiesDeleted,
      }
    } catch (e: any) {
      errors.customers = e.message
      logger?.error(`[store-reset] customers failed: ${e.message}`)
    }
  }

  logger?.warn(`[store-reset] executed: ${JSON.stringify(summary)}`)

  const ok = Object.keys(errors).length === 0
  return res.status(ok ? 200 : 207).json({ success: ok, summary, errors })
}
