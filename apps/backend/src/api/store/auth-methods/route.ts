import type { MedusaRequest, MedusaResponse } from "@medusajs/framework"
import { AUTH_SETTINGS_MODULE } from "../../../modules/authSettings"
import { googleSecretConfigured } from "../../../lib/integration-env"

export const GET = async (req: MedusaRequest, res: MedusaResponse) => {
  const svc = req.scope.resolve(AUTH_SETTINGS_MODULE) as any
  const [rows] = await svc.listAndCountAuthSettings({}, { take: 1 })
  const row = rows?.[0]

  // Google is available when enabled, the (non-secret) client_id + redirect_uri
  // are set in admin, and GOOGLE_CLIENT_SECRET is present in the environment.
  const googleReady = Boolean(
    row?.google_enabled && row?.google_client_id && row?.google_redirect_uri && googleSecretConfigured()
  )

  // NEVER expose client_secret or any OTP internal fields
  res.json({
    google: {
      enabled: googleReady,
      client_id: googleReady ? (row?.google_client_id ?? null) : null,
      redirect_uri: googleReady ? (row?.google_redirect_uri ?? null) : null,
    },
    phone_otp: {
      enabled: Boolean(row?.phone_otp_enabled),
      otp_length: row?.otp_length ?? 6,
    },
  })
}
