import { STORE_SETTINGS_MODULE } from "../modules/storeSettings"

export type EmailCreds = {
  apiKey: string
  fromEmail: string
  fromName: string
}

export type SmsCreds = {
  apiKey: string
  senderId: string
  provider: string
  twilioAuthToken?: string
  apiUrl?: string
}

/**
 * Resolves email credentials. The API key (secret) always comes from the
 * RESEND_API_KEY environment variable. From-email and from-name are non-secret
 * branding and may be overridden by admin-editable store settings; otherwise
 * env defaults (RESEND_FROM_EMAIL / RESEND_FROM_NAME) or hard defaults apply.
 * Returns null when RESEND_API_KEY is not set.
 */
export async function resolveEmailCreds(container?: any): Promise<EmailCreds | null> {
  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) return null

  let fromEmail = process.env.RESEND_FROM_EMAIL || "noreply@resend.dev"
  let fromName = process.env.RESEND_FROM_NAME || "My Store"

  if (container) {
    try {
      const svc = container.resolve?.(STORE_SETTINGS_MODULE)
      if (svc) {
        const [settings] = await svc.listStoreSettings({}, { take: 1 })
        if (settings?.resend_from_email) fromEmail = settings.resend_from_email
        if (settings?.resend_from_name) fromName = settings.resend_from_name
      }
    } catch {
      // fall back to env/defaults
    }
  }

  return { apiKey, fromEmail, fromName }
}

/**
 * Resolves SMS credentials. The API key and Twilio auth token (secrets) come
 * from environment variables. Provider, sender ID, and API URL are non-secret
 * and admin-editable (with env defaults). Returns null when SMS_API_KEY is unset.
 */
export async function resolveSmsCreds(container?: any): Promise<SmsCreds | null> {
  const apiKey = process.env.SMS_API_KEY
  if (!apiKey) return null

  let provider = (process.env.SMS_PROVIDER || "twilio").toLowerCase()
  let senderId = process.env.SMS_SENDER_ID || ""
  let apiUrl = process.env.SMS_API_URL || undefined

  if (container) {
    try {
      const svc = container.resolve?.(STORE_SETTINGS_MODULE)
      if (svc) {
        const [settings] = await svc.listStoreSettings({}, { take: 1 })
        if (settings?.sms_provider) provider = String(settings.sms_provider).toLowerCase()
        if (settings?.sms_sender_id) senderId = settings.sms_sender_id
        if (settings?.sms_api_url) apiUrl = settings.sms_api_url
      }
    } catch {
      // fall back to env/defaults
    }
  }

  return {
    apiKey,
    senderId,
    provider,
    twilioAuthToken: process.env.TWILIO_AUTH_TOKEN || undefined,
    apiUrl,
  }
}
