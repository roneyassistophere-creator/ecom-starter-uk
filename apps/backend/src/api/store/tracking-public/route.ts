import type { MedusaRequest, MedusaResponse } from "@medusajs/framework"
import { TRACKING_SETTINGS_MODULE } from "../../../modules/trackingSettings"

export const GET = async (req: MedusaRequest, res: MedusaResponse) => {
  const svc = req.scope.resolve(TRACKING_SETTINGS_MODULE) as any
  const [rows] = await svc.listAndCountTrackingSettings({}, { take: 1 })
  const row = rows?.[0]

  // NEVER expose capi_token_encrypted or any secret field
  res.json({
    meta_pixel_id: row?.meta_pixel_id ?? null,
    ga4_measurement_id: row?.ga4_measurement_id ?? null,
  })
}
