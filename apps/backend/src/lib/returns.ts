import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { createAndCompleteReturnOrderWorkflow } from "@medusajs/core-flows"

export type ReturnRestockResult = {
  created: boolean
  items: number
  reason?: string
}

/**
 * Creates AND receives a native Medusa return for the whole order, which
 * restocks the returned items' inventory. No refund is issued (restock only).
 *
 * Idempotent: if the order is canceled, has no items, or already has a return,
 * it does nothing (prevents double-restock when called from both the courier
 * sync job and the manual button).
 */
export async function returnAndRestockOrder(
  container: any,
  orderId: string
): Promise<ReturnRestockResult> {
  const query = container.resolve(ContainerRegistrationKeys.QUERY)

  const { data: orders } = await query.graph({
    entity: "order",
    fields: ["id", "status", "items.id", "items.quantity", "returns.id"],
    filters: { id: orderId },
  })
  const order = orders?.[0]

  if (!order) return { created: false, items: 0, reason: "Order not found" }
  if (order.status === "canceled") return { created: false, items: 0, reason: "Order is canceled" }
  if ((order.returns ?? []).length > 0) return { created: false, items: 0, reason: "Order already has a return" }

  const items = (order.items ?? [])
    .filter((i: any) => Number(i.quantity) > 0)
    .map((i: any) => ({ id: i.id, quantity: Number(i.quantity) }))

  if (items.length === 0) return { created: false, items: 0, reason: "No returnable items" }

  await createAndCompleteReturnOrderWorkflow(container).run({
    input: { order_id: orderId, items },
  })

  return { created: true, items: items.length }
}
