import type { MedusaRequest, MedusaResponse } from "@medusajs/framework"
import { AUTH_SETTINGS_MODULE } from "../../../../../modules/authSettings"
import { googleSecretConfigured } from "../../../../../lib/integration-env"
import { validateAndConsumeState } from "../../../../../lib/google-oauth-state"
import { generateCustomerToken } from "../../../../../lib/jwt"

type GoogleTokenResponse = {
  access_token: string
  id_token: string
  error?: string
}

type GoogleUserInfo = {
  sub: string
  email: string
  given_name?: string
  family_name?: string
}

export const POST = async (req: MedusaRequest, res: MedusaResponse) => {
  const { code, state } = req.body as Record<string, any>

  if (!code || !state) {
    return res.status(400).json({ error: "Missing code or state" })
  }

  if (!validateAndConsumeState(state)) {
    return res.status(400).json({ error: "Invalid or expired state parameter" })
  }

  const svc = req.scope.resolve(AUTH_SETTINGS_MODULE) as any
  const [rows] = await svc.listAndCountAuthSettings({}, { take: 1 })
  const s = rows?.[0]

  if (!s?.google_enabled || !s?.google_client_id || !googleSecretConfigured()) {
    return res.status(403).json({ error: "Google auth is not configured" })
  }

  const clientSecret = process.env.GOOGLE_CLIENT_SECRET as string

  // Exchange authorization code for tokens
  let tokenData: GoogleTokenResponse
  try {
    const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        code,
        client_id: s.google_client_id,
        client_secret: clientSecret,
        redirect_uri: s.google_redirect_uri,
        grant_type: "authorization_code",
      }),
    })
    tokenData = await tokenRes.json() as GoogleTokenResponse
    if (tokenData.error) {
      return res.status(400).json({ error: `Google token exchange failed: ${tokenData.error}` })
    }
  } catch (err: any) {
    return res.status(500).json({ error: `Token exchange error: ${err.message}` })
  }

  // Get user profile
  let profile: GoogleUserInfo
  try {
    const profileRes = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    })
    profile = await profileRes.json() as GoogleUserInfo
    if (!profile.sub || !profile.email) {
      return res.status(400).json({ error: "Invalid Google profile response" })
    }
  } catch (err: any) {
    return res.status(500).json({ error: `Profile fetch error: ${err.message}` })
  }

  // Find or create customer by email
  const customerSvc = req.scope.resolve("customer") as any
  const [existingCustomers] = await customerSvc.listCustomers(
    { email: profile.email },
    { take: 1 }
  )

  let customer: any
  if (existingCustomers.length > 0) {
    customer = existingCustomers[0]
  } else {
    const created = await customerSvc.createCustomers([{
      email: profile.email,
      first_name: profile.given_name || "",
      last_name: profile.family_name || "",
    }])
    customer = Array.isArray(created) ? created[0] : created
  }

  // Find or create auth identity for this Google user
  const authSvc = req.scope.resolve("auth") as any
  const [existingIdentities] = await authSvc.listProviderIdentities(
    { entity_id: profile.sub, provider: "google" },
    { take: 1 }
  )

  let authIdentityId: string
  if (existingIdentities.length > 0) {
    authIdentityId = existingIdentities[0].auth_identity_id
  } else {
    const created = await authSvc.createAuthIdentities([{
      provider_identities: [{
        entity_id: profile.sub,
        provider: "google",
        provider_metadata: {
          email: profile.email,
          customer_id: customer.id,
        },
      }],
    }])
    const identity = Array.isArray(created) ? created[0] : created
    authIdentityId = identity.id
  }

  const token = generateCustomerToken(customer.id, authIdentityId)
  res.json({ token })
}
