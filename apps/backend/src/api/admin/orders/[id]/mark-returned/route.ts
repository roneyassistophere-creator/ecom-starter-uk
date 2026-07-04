import { AuthenticatedMedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { returnAndRestockOrder } from "../../../../../lib/returns"

// POST /admin/orders/:id/mark-returned — create + receive a native return for the
// whole order, restocking inventory. No refund is issued. Idempotent.
export async function POST(req: AuthenticatedMedusaRequest, res: MedusaResponse) {
  const orderId = req.params.id
  const logger = req.scope.resolve("logger") as any

  try {
    const result = await returnAndRestockOrder(req.scope, orderId)
    if (!result.created) {
      return res.status(200).json({ success: false, created: false, message: result.reason })
    }
    return res.status(200).json({ success: true, created: true, items: result.items })
  } catch (err: any) {
    logger?.error(`[orders:mark-returned] ${orderId} failed: ${err.message}`)
    return res.status(500).json({ success: false, error: err.message })
  }
}
