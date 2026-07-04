import type { AuthenticatedMedusaRequest, MedusaResponse } from "@medusajs/framework"
import { TRACKING_SETTINGS_MODULE } from "../../../modules/trackingSettings"
import { capiEnvConfigured } from "../../../lib/integration-env"

type TrackingService = {
  listAndCountTrackingSettings: (filters?: object, options?: object) => Promise<[any[], number]>
  createTrackingSettings: (data: object) => Promise<any>
  updateTrackingSettings: (id: string, data: object) => Promise<any>
}

async function getOrCreate(svc: TrackingService) {
  const [rows] = await svc.listAndCountTrackingSettings({}, { take: 1 })
  if (rows.length > 0) return rows[0]
  return svc.createTrackingSettings({})
}

export const GET = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) => {
  const svc = req.scope.resolve<TrackingService>(TRACKING_SETTINGS_MODULE)
  const row = await getOrCreate(svc)

  res.json({
    meta_pixel_id: row.meta_pixel_id ?? null,
    ga4_measurement_id: row.ga4_measurement_id ?? null,
    capi_enabled: row.capi_enabled ?? false,
    // CAPI access token is provided via the META_CAPI_ACCESS_TOKEN env var.
    capi_configured: capiEnvConfigured(),
    capi_test_event_code: row.capi_test_event_code ?? null,
    purchase_event_enabled: row.purchase_event_enabled ?? true,
  })
}

export const POST = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) => {
  const svc = req.scope.resolve<TrackingService>(TRACKING_SETTINGS_MODULE)
  const row = await getOrCreate(svc)

  const {
    meta_pixel_id,
    ga4_measurement_id,
    capi_enabled,
    capi_test_event_code,
    purchase_event_enabled,
  } = req.body as Record<string, any>

  const update: Record<string, unknown> = {}

  if (meta_pixel_id !== undefined) update.meta_pixel_id = meta_pixel_id || null
  if (ga4_measurement_id !== undefined) update.ga4_measurement_id = ga4_measurement_id || null
  if (capi_enabled !== undefined) update.capi_enabled = Boolean(capi_enabled)
  if (purchase_event_enabled !== undefined) update.purchase_event_enabled = Boolean(purchase_event_enabled)
  if (capi_test_event_code !== undefined) update.capi_test_event_code = capi_test_event_code || null

  await svc.updateTrackingSettings(row.id, update)

  res.json({ success: true })
}
