// Central env-based configuration checks for integrations.
// Secrets live in environment variables (set on the server), never in the admin DB.
// "Configured" = the required env vars for a provider are present at runtime.

// ── Notifications ──────────────────────────────────────────────────────────────

export function emailEnvConfigured(): boolean {
  return Boolean(process.env.RESEND_API_KEY)
}

export function smsEnvConfigured(): boolean {
  return Boolean(process.env.SMS_API_KEY)
}

// ── Tracking (Meta Conversions API) ────────────────────────────────────────────

export function capiEnvConfigured(): boolean {
  return Boolean(process.env.META_CAPI_ACCESS_TOKEN)
}

// ── Authentication (Google OAuth) ──────────────────────────────────────────────

export function googleSecretConfigured(): boolean {
  return Boolean(process.env.GOOGLE_CLIENT_SECRET)
}

// ── Couriers ───────────────────────────────────────────────────────────────────

export type CourierId = "steadfast" | "redx" | "pathao"

// Env vars that must all be present for a courier to count as configured.
export const COURIER_REQUIRED_ENV: Record<CourierId, string[]> = {
  steadfast: ["STEADFAST_API_KEY", "STEADFAST_SECRET_KEY"],
  redx: ["REDX_API_TOKEN"],
  pathao: ["PATHAO_CLIENT_ID", "PATHAO_CLIENT_SECRET", "PATHAO_USERNAME", "PATHAO_PASSWORD"],
}

export function courierEnvConfigured(courierId: string): boolean {
  const required = COURIER_REQUIRED_ENV[courierId as CourierId]
  if (!required) return false
  return required.every((key) => Boolean(process.env[key]))
}

// Returns the credential record an adapter expects (matching the field names the
// adapters read), or null if the courier's required env vars aren't all set.
export function getCourierCreds(courierId: string): Record<string, string> | null {
  if (!courierEnvConfigured(courierId)) return null

  switch (courierId as CourierId) {
    case "steadfast":
      return {
        api_key: process.env.STEADFAST_API_KEY!,
        secret_key: process.env.STEADFAST_SECRET_KEY!,
      }
    case "redx":
      return {
        api_token: process.env.REDX_API_TOKEN!,
        sandbox: process.env.REDX_SANDBOX === "true" ? "true" : "false",
      }
    case "pathao":
      return {
        client_id: process.env.PATHAO_CLIENT_ID!,
        client_secret: process.env.PATHAO_CLIENT_SECRET!,
        username: process.env.PATHAO_USERNAME!,
        password: process.env.PATHAO_PASSWORD!,
        store_id: process.env.PATHAO_STORE_ID ?? "",
        sandbox: process.env.PATHAO_SANDBOX === "true" ? "true" : "false",
      }
    default:
      return null
  }
}
