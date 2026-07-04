import { AuthenticatedMedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { COURIER_CONFIG_MODULE } from "../../../../modules/courierConfig"

// POST /admin/couriers/:id — save non-secret settings + enable toggle.
// Secrets (API keys) are configured via environment variables, never here.
export async function POST(
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) {
  const courierId = req.params.id
  const body = req.body as Record<string, unknown>
  const svc = req.scope.resolve(COURIER_CONFIG_MODULE) as any

  const [existing] = await svc.listCourierConfigs({ courier_id: courierId })
  if (!existing) {
    return res.status(404).json({ error: `Courier "${courierId}" not found` })
  }

  const update: Record<string, unknown> = { id: existing.id }

  if ("enabled" in body) update.enabled = Boolean(body.enabled)

  // Non-secret settings (pickup address). Sandbox is sourced from env, not here.
  const rawSettings = (body.settings as Record<string, unknown> | undefined) ?? {}
  const settings: Record<string, unknown> = { ...(existing.settings ?? {}) }
  const pickupVal = "pickup_address" in rawSettings ? rawSettings.pickup_address : body.pickup_address
  if (pickupVal !== undefined) settings.pickup_address = pickupVal
  update.settings = settings

  await svc.updateCourierConfigs([update])

  res.json({ success: true })
}
