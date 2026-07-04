import type { MedusaRequest, MedusaResponse } from "@medusajs/framework"
import { AUTH_SETTINGS_MODULE } from "../../../../../modules/authSettings"
import { hashOtp, normalizePhone, isValidPhone } from "../../../../../lib/otp"
import { generateCustomerToken } from "../../../../../lib/jwt"

export const POST = async (req: MedusaRequest, res: MedusaResponse) => {
  const { phone: rawPhone, code } = req.body as Record<string, any>

  if (!rawPhone || typeof rawPhone !== "string") {
    return res.status(400).json({ error: "Phone number is required" })
  }
  if (!code || typeof code !== "string") {
    return res.status(400).json({ error: "Code is required" })
  }

  const phone = normalizePhone(rawPhone)
  if (!isValidPhone(phone)) {
    return res.status(400).json({ error: "Invalid phone number format" })
  }

  const authSvc = req.scope.resolve(AUTH_SETTINGS_MODULE) as any
  const [rows] = await authSvc.listAndCountAuthSettings({}, { take: 1 })
  const settings = rows?.[0]

  if (!settings?.phone_otp_enabled) {
    return res.status(403).json({ error: "Phone OTP auth is not enabled" })
  }

  const maxAttempts = settings.otp_max_attempts ?? 5

  // Look up OTP record
  const [records] = await authSvc.listAndCountOtpRecords({ phone }, { take: 1 })
  const record = records?.[0]

  if (!record) {
    return res.status(400).json({ error: "No verification code found for this number. Please request a new code." })
  }

  // Check expiry
  if (new Date() > new Date(record.expires_at)) {
    await authSvc.deleteOtpRecords([record.id])
    return res.status(400).json({ error: "Verification code has expired. Please request a new code." })
  }

  // Check max attempts
  if (record.attempts >= maxAttempts) {
    await authSvc.deleteOtpRecords([record.id])
    return res.status(429).json({ error: "Too many incorrect attempts. Please request a new code." })
  }

  // Verify code hash
  const providedHash = hashOtp(code.trim())
  if (providedHash !== record.code_hash) {
    const newAttempts = record.attempts + 1
    await authSvc.updateOtpRecords(record.id, { attempts: newAttempts })
    const remaining = maxAttempts - newAttempts
    return res.status(401).json({ error: "Invalid verification code", attempts_remaining: remaining })
  }

  // Valid — delete OTP record immediately
  await authSvc.deleteOtpRecords([record.id])

  // Find or create customer by phone
  const customerSvc = req.scope.resolve("customer") as any
  const [existingCustomers] = await customerSvc.listCustomers({ phone }, { take: 1 })

  let customer: any
  if (existingCustomers.length > 0) {
    customer = existingCustomers[0]
  } else {
    const created = await customerSvc.createCustomers([{ phone }])
    customer = Array.isArray(created) ? created[0] : created
  }

  // Find or create auth identity for this phone
  const medusaAuthSvc = req.scope.resolve("auth") as any
  const [existingIdentities] = await medusaAuthSvc.listProviderIdentities(
    { entity_id: phone, provider: "phone-otp" },
    { take: 1 }
  )

  let authIdentityId: string
  if (existingIdentities.length > 0) {
    authIdentityId = existingIdentities[0].auth_identity_id
  } else {
    const created = await medusaAuthSvc.createAuthIdentities([{
      provider_identities: [{
        entity_id: phone,
        provider: "phone-otp",
        provider_metadata: { customer_id: customer.id },
      }],
    }])
    const identity = Array.isArray(created) ? created[0] : created
    authIdentityId = identity.id
  }

  const token = generateCustomerToken(customer.id, authIdentityId)
  res.json({ token })
}
