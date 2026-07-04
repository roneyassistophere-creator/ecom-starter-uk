import type { AuthenticatedMedusaRequest, MedusaResponse } from "@medusajs/framework"
import { TRACKING_SETTINGS_MODULE } from "../../../../modules/trackingSettings"
import { capiEnvConfigured } from "../../../../lib/integration-env"
import { sendCapiPurchase } from "../../../../lib/capi"

// Simple in-memory rate limiter: max 2 requests per 60 seconds
const rateLimitMap = new Map<string, number[]>()
function isRateLimited(key: string): boolean {
  const now = Date.now()
  const timestamps = (rateLimitMap.get(key) ?? []).filter((t) => now - t < 60_000)
  if (timestamps.length >= 2) return true
  timestamps.push(now)
  rateLimitMap.set(key, timestamps)
  return false
}

export const POST = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) => {
  // Rate limit per admin user
  const userId = (req.auth_context as any)?.actor_id ?? "anon"
  if (isRateLimited(userId)) {
    return res.status(429).json({ success: false, message: "Rate limited — max 2 test events per minute" })
  }

  if (!capiEnvConfigured()) {
    return res.status(400).json({
      success: false,
      message: "META_CAPI_ACCESS_TOKEN is not set in your server environment",
    })
  }

  const svc = req.scope.resolve(TRACKING_SETTINGS_MODULE) as any
  const [rows] = await svc.listAndCountTrackingSettings({}, { take: 1 })
  const row = rows?.[0]

  if (!row?.meta_pixel_id) {
    return res.status(400).json({ success: false, message: "Meta Pixel ID is not configured" })
  }

  const token = process.env.META_CAPI_ACCESS_TOKEN as string

  try {
    await sendCapiPurchase({
      pixelId: row.meta_pixel_id,
      token,
      eventId: `test_${Date.now()}`,
      orderId: "test_order",
      value: 9.99,
      currency: "USD",
      contentIds: ["test_product"],
      testEventCode: row.capi_test_event_code ?? undefined,
    })
    res.json({ success: true, message: "Test Purchase event sent to Meta successfully" })
  } catch (err: any) {
    res.json({ success: false, message: err.message || "Failed to send test event" })
  }
}
