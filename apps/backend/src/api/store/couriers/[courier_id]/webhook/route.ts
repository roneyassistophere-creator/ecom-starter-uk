import type { MedusaRequest, MedusaResponse } from "@medusajs/framework"

/**
 * Webhook stub for courier push notifications.
 * Steadfast does not push webhooks; RedX and Pathao may.
 * Implement signature verification and status updates per courier when needed.
 */
export const POST = async (
  req: MedusaRequest,
  res: MedusaResponse
) => {
  const { courier_id } = req.params
  const logger = req.scope.resolve("logger") as { info: (m: string) => void }

  logger.info(`[courier:webhook] Received webhook from ${courier_id}: ${JSON.stringify(req.body)}`)

  // TODO: verify webhook signature per courier, then update fulfillment status
  // via the same logic as sync-courier-status.ts

  res.json({ received: true })
}
