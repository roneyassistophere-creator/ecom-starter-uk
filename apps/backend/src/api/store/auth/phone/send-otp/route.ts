import type { MedusaRequest, MedusaResponse } from "@medusajs/framework"
import { AUTH_SETTINGS_MODULE } from "../../../../../modules/authSettings"
import { smsEnvConfigured } from "../../../../../lib/integration-env"
import { generateOtp, hashOtp, normalizePhone, isValidPhone } from "../../../../../lib/otp"

export const POST = async (req: MedusaRequest, res: MedusaResponse) => {
  const { phone: rawPhone } = req.body as Record<string, any>

  if (!rawPhone || typeof rawPhone !== "string") {
    return res.status(400).json({ error: "Phone number is required" })
  }

  const phone = normalizePhone(rawPhone)
  if (!isValidPhone(phone)) {
    return res.status(400).json({ error: "Invalid phone number. Use E.164 format, e.g. +8801712345678" })
  }

  const authSvc = req.scope.resolve(AUTH_SETTINGS_MODULE) as any
  const [rows] = await authSvc.listAndCountAuthSettings({}, { take: 1 })
  const settings = rows?.[0]

  if (!settings?.phone_otp_enabled) {
    return res.status(403).json({ error: "Phone OTP auth is not enabled" })
  }

  // Check SMS is actually configured before generating and storing an OTP that can never be sent
  if (!smsEnvConfigured()) {
    return res.status(503).json({
      error: "SMS provider is not configured. Please ask the store administrator to set the SMS environment variables.",
    })
  }

  const cooldown = settings.otp_resend_cooldown_seconds ?? 60
  const expiry = settings.otp_expiry_seconds ?? 300
  const length = settings.otp_length ?? 6

  // Check resend rate limit
  const [existingRecords] = await authSvc.listAndCountOtpRecords({ phone }, { take: 1 })
  const existing = existingRecords?.[0]

  if (existing?.last_sent_at) {
    const elapsedMs = Date.now() - new Date(existing.last_sent_at).getTime()
    const elapsedSec = elapsedMs / 1000
    if (elapsedSec < cooldown) {
      const remaining = Math.ceil(cooldown - elapsedSec)
      return res.status(429).json({ error: "Please wait before requesting another code", cooldown_remaining: remaining })
    }
  }

  const code = generateOtp(length)
  const code_hash = hashOtp(code)
  const expires_at = new Date(Date.now() + expiry * 1000)
  const last_sent_at = new Date()

  if (existing) {
    await authSvc.updateOtpRecords(existing.id, { code_hash, expires_at, attempts: 0, last_sent_at })
  } else {
    await authSvc.createOtpRecords([{ phone, code_hash, expires_at, attempts: 0, last_sent_at }])
  }

  // Send SMS via existing notification layer
  const notificationSvc = req.scope.resolve("notification") as any
  try {
    await notificationSvc.createNotifications({
      to: phone,
      channel: "sms",
      template: "fallback",
      data: {
        message: `Your verification code is ${code}. Valid for ${Math.round(expiry / 60)} minutes. Do not share this code.`,
      },
    })
  } catch (err: any) {
    // Roll back OTP record if SMS fails
    if (existing) {
      await authSvc.updateOtpRecords(existing.id, {
        code_hash: existing.code_hash,
        expires_at: existing.expires_at,
        attempts: existing.attempts,
        last_sent_at: existing.last_sent_at,
      })
    } else {
      const [newRecords] = await authSvc.listAndCountOtpRecords({ phone }, { take: 1 })
      if (newRecords?.[0]) await authSvc.deleteOtpRecords([newRecords[0].id])
    }
    return res.status(500).json({ error: "Failed to send SMS. Please try again." })
  }

  res.json({ success: true, cooldown_seconds: cooldown })
  // NEVER include the code in the response
}
