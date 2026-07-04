import { model } from "@medusajs/framework/utils"

const AuthSettings = model.define("auth_settings", {
  id: model.id().primaryKey(),
  google_enabled: model.boolean().default(false),
  google_client_id: model.text().nullable(),
  // Client secret lives in the GOOGLE_CLIENT_SECRET env var; "configured" is derived.
  google_redirect_uri: model.text().nullable(),
  phone_otp_enabled: model.boolean().default(false),
  otp_length: model.number().default(6),
  otp_expiry_seconds: model.number().default(300),
  otp_max_attempts: model.number().default(5),
  otp_resend_cooldown_seconds: model.number().default(60),
})

export default AuthSettings
