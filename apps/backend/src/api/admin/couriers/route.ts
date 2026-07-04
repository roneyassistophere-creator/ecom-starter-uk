import { AuthenticatedMedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { COURIER_CONFIG_MODULE } from "../../../modules/courierConfig"
import { courierEnvConfigured } from "../../../lib/integration-env"

const ALL_COURIER_IDS = ["steadfast", "redx", "pathao"] as const

type CourierRow = {
  id: string
  courier_id: string
  enabled: boolean
  is_active: boolean
  settings: Record<string, unknown> | null
}

// GET /admin/couriers — list all three courier configs (seeds if none exist).
// "configured" is derived from environment variables, never from the DB.
export async function GET(req: AuthenticatedMedusaRequest, res: MedusaResponse) {
  const svc = req.scope.resolve(COURIER_CONFIG_MODULE) as any

  let rows: CourierRow[] = await svc.listCourierConfigs({})

  // Ensure all three rows exist (seed any missing)
  const existing = new Set(rows.map((r: CourierRow) => r.courier_id))
  const missing = ALL_COURIER_IDS.filter((id) => !existing.has(id))
  if (missing.length > 0) {
    await svc.createCourierConfigs(
      missing.map((id) => ({
        courier_id: id,
        enabled: false,
        is_active: false,
        settings: null,
      }))
    )
    rows = await svc.listCourierConfigs({})
  }

  const couriers = rows.map((row: CourierRow) => ({
    id: row.id,
    courier_id: row.courier_id,
    enabled: row.enabled,
    is_active: row.is_active,
    configured: courierEnvConfigured(row.courier_id),
    settings: row.settings ?? {},
  }))

  // Sort in canonical order
  const ORDER = { steadfast: 0, redx: 1, pathao: 2 } as Record<string, number>
  couriers.sort((a, b) => (ORDER[a.courier_id] ?? 99) - (ORDER[b.courier_id] ?? 99))

  res.json({ couriers })
}
