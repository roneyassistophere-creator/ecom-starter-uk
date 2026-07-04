import { AuthenticatedMedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { COURIER_CONFIG_MODULE } from "../../../../../modules/courierConfig"
import { courierEnvConfigured } from "../../../../../lib/integration-env"

// POST /admin/couriers/:id/activate — set this courier active, deactivate all others
export async function POST(
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) {
  const courierId = req.params.id
  const svc = req.scope.resolve(COURIER_CONFIG_MODULE) as any

  const [target] = await svc.listCourierConfigs({ courier_id: courierId })
  if (!target) {
    return res.status(404).json({ error: `Courier "${courierId}" not found` })
  }

  if (!courierEnvConfigured(courierId)) {
    return res
      .status(400)
      .json({ error: `Courier "${courierId}" is not configured — set its environment variables first` })
  }

  const all = await svc.listCourierConfigs({})

  // Deactivate all, then activate the target
  await svc.updateCourierConfigs(
    all.map((row: any) => ({
      id: row.id,
      is_active: row.courier_id === courierId,
      enabled: row.courier_id === courierId ? true : row.enabled,
    }))
  )

  res.json({ success: true, active: courierId })
}
