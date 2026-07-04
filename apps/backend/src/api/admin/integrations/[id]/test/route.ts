import { AuthenticatedMedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { getIntegration } from "../../../../../integrations/registry"

export async function POST(req: AuthenticatedMedusaRequest, res: MedusaResponse) {
  const { id } = req.params as { id: string }
  const integration = getIntegration(id)

  if (!integration) {
    return res.status(404).json({ message: `Integration "${id}" not found.` })
  }

  if (!integration.test) {
    return res.json({ success: false, message: "No test available for this integration." })
  }

  try {
    const input = (req.body ?? {}) as Record<string, string>
    const result = await integration.test(req.scope as any, input)
    res.json(result)
  } catch (err: any) {
    res.json({ success: false, message: err.message ?? "Unknown error" })
  }
}
