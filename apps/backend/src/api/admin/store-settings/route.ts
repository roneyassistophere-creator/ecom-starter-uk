import { AuthenticatedMedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { STORE_SETTINGS_MODULE } from "../../../modules/storeSettings"
import { emailEnvConfigured, smsEnvConfigured } from "../../../lib/integration-env"

const DEFAULTS = {
  whatsapp_number: null,
  order_phone: null,
  product_card_style: null,
  product_card_fields: null,
  card_button_layout: null,
  card_action_mode: null,
  card_badge_settings: null,
  card_text_align: null,
  card_grid_columns: null,
  email_enabled: true,
  email_order_placed: true,
  email_order_shipped: true,
  email_order_canceled: true,
  email_password_reset: true,
  email_sender_name: null,
  sms_order_placed: false,
  sms_order_shipped: false,
  sms_order_canceled: false,
  resend_from_email: null,
  resend_from_name: null,
  sms_sender_id: null,
  sms_provider: null,
  sms_api_url: null,
  payment_enabled: null,
}

// Non-secret, admin-editable fields. Secrets (API keys, tokens) live only in env.
const SIMPLE_KEYS = [
  "whatsapp_number", "order_phone",
  "product_card_style", "product_card_fields",
  "card_button_layout", "card_action_mode", "card_badge_settings",
  "card_text_align", "card_grid_columns",
  "email_enabled", "email_order_placed", "email_order_shipped",
  "email_order_canceled", "email_password_reset", "email_sender_name",
  "sms_order_placed", "sms_order_shipped", "sms_order_canceled",
  // Notification branding / routing (non-secret)
  "resend_from_email", "resend_from_name",
  "sms_sender_id", "sms_provider", "sms_api_url",
  // Per-provider payment enable toggles (json map)
  "payment_enabled",
] as const

function withConfigured(setting: Record<string, unknown>) {
  // "configured" flags are derived from environment variables at runtime.
  return {
    ...setting,
    email_configured: emailEnvConfigured(),
    sms_configured: smsEnvConfigured(),
  }
}

export async function GET(req: AuthenticatedMedusaRequest, res: MedusaResponse) {
  const svc = req.scope.resolve(STORE_SETTINGS_MODULE)
  const [setting] = await svc.listStoreSettings({}, { take: 1 })

  return res.json({ setting: withConfigured(setting ?? DEFAULTS) })
}

export async function POST(req: AuthenticatedMedusaRequest, res: MedusaResponse) {
  const svc = req.scope.resolve(STORE_SETTINGS_MODULE)
  const body = req.body as Record<string, unknown>

  const [existing] = await svc.listStoreSettings({}, { take: 1 })

  // Partial-update pattern: only include a field if the caller explicitly sent it.
  const payload: Record<string, unknown> = {}
  for (const key of SIMPLE_KEYS) {
    if (key in body) payload[key] = body[key]
  }

  let updated: any
  if (existing) {
    ;[updated] = await svc.updateStoreSettings([{ id: existing.id, ...payload }])
  } else {
    ;[updated] = await svc.createStoreSettings([payload])
  }

  return res.json({ setting: withConfigured(updated) })
}
