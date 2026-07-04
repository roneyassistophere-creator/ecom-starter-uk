import type { MedusaRequest, MedusaResponse } from "@medusajs/framework"
import { AUTH_SETTINGS_MODULE } from "../../../../../modules/authSettings"
import { googleSecretConfigured } from "../../../../../lib/integration-env"
import { createState } from "../../../../../lib/google-oauth-state"

export const POST = async (req: MedusaRequest, res: MedusaResponse) => {
  const svc = req.scope.resolve(AUTH_SETTINGS_MODULE) as any
  const [rows] = await svc.listAndCountAuthSettings({}, { take: 1 })
  const s = rows?.[0]

  if (!s?.google_enabled || !s?.google_client_id || !s?.google_redirect_uri || !googleSecretConfigured()) {
    return res.status(403).json({ error: "Google auth is not configured" })
  }

  const state = createState()
  const params = new URLSearchParams({
    client_id: s.google_client_id,
    redirect_uri: s.google_redirect_uri,
    response_type: "code",
    scope: "openid email profile",
    state,
    access_type: "offline",
  })

  const url = `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`
  res.json({ url })
}
