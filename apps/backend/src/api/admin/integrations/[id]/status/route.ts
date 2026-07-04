import { AuthenticatedMedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { buildVarDisplay, getIntegration } from "../../../../../integrations/registry"

export async function GET(req: AuthenticatedMedusaRequest, res: MedusaResponse) {
  const { id } = req.params as { id: string }
  const integration = getIntegration(id)

  if (!integration) {
    return res.status(404).json({ message: `Integration "${id}" not found.` })
  }

  const vars = integration.env.map((def) => ({
    key: def.key,
    present: Boolean(process.env[def.key]),
    required: Boolean(def.required),
    display: buildVarDisplay(def),
  }))

  // Use custom isConfigured check if present (email/sms check both admin DB and env)
  const configured = integration.isConfigured
    ? await integration.isConfigured(req.scope as any)
    : vars.filter((v) => v.required).every((v) => v.present)

  res.json({ id: integration.id, label: integration.label, configured, vars })
}
