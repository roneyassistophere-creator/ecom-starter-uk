import type { AuthenticatedMedusaRequest, MedusaResponse } from "@medusajs/framework"
import { AUTH_SETTINGS_MODULE } from "../../../modules/authSettings"
import { googleSecretConfigured, smsEnvConfigured } from "../../../lib/integration-env"

type AuthSettingsService = {
  listAndCountAuthSettings: (filters?: object, options?: object) => Promise<[any[], number]>
  createAuthSettings: (data: object) => Promise<any>
  updateAuthSettings: (id: string, data: object) => Promise<any>
}

async function getOrCreate(svc: AuthSettingsService) {
  const [rows] = await svc.listAndCountAuthSettings({}, { take: 1 })
  if (rows.length > 0) return rows[0]
  return svc.createAuthSettings({})
}

export const GET = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) => {
  const svc = req.scope.resolve<AuthSettingsService>(AUTH_SETTINGS_MODULE)
  const row = await getOrCreate(svc)

  // Google is "configured" when the non-secret client_id is set in admin and the
  // GOOGLE_CLIENT_SECRET env var is present.
  const googleConfigured = Boolean(row.google_client_id && googleSecretConfigured())

  res.json({
    google_enabled: row.google_enabled ?? false,
    google_client_id: row.google_client_id ?? null,
    google_redirect_uri: row.google_redirect_uri ?? null,
    google_configured: googleConfigured,
    google_secret_present: googleSecretConfigured(),
    phone_otp_enabled: row.phone_otp_enabled ?? false,
    otp_length: row.otp_length ?? 6,
    otp_expiry_seconds: row.otp_expiry_seconds ?? 300,
    otp_max_attempts: row.otp_max_attempts ?? 5,
    otp_resend_cooldown_seconds: row.otp_resend_cooldown_seconds ?? 60,
    sms_configured: smsEnvConfigured(),
  })
}

export const POST = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) => {
  const svc = req.scope.resolve<AuthSettingsService>(AUTH_SETTINGS_MODULE)
  const row = await getOrCreate(svc)

  const {
    google_enabled,
    google_client_id,
    google_redirect_uri,
    phone_otp_enabled,
    otp_length,
    otp_expiry_seconds,
    otp_max_attempts,
    otp_resend_cooldown_seconds,
  } = req.body as Record<string, any>

  const update: Record<string, unknown> = {}

  if (google_enabled !== undefined) update.google_enabled = Boolean(google_enabled)
  if (google_client_id !== undefined) update.google_client_id = google_client_id || null
  if (google_redirect_uri !== undefined) update.google_redirect_uri = google_redirect_uri || null
  if (phone_otp_enabled !== undefined) update.phone_otp_enabled = Boolean(phone_otp_enabled)
  if (otp_length !== undefined) update.otp_length = Number(otp_length)
  if (otp_expiry_seconds !== undefined) update.otp_expiry_seconds = Number(otp_expiry_seconds)
  if (otp_max_attempts !== undefined) update.otp_max_attempts = Number(otp_max_attempts)
  if (otp_resend_cooldown_seconds !== undefined) update.otp_resend_cooldown_seconds = Number(otp_resend_cooldown_seconds)

  await svc.updateAuthSettings(row.id, update)

  res.json({ success: true })
}
