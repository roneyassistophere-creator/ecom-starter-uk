import { createHash } from "node:crypto"

const META_GRAPH_VERSION = "v22.0"

function hashValue(val: string): string {
  return createHash("sha256").update(val).digest("hex")
}

function normEmail(email: string): string {
  return email.toLowerCase().trim()
}

function normPhone(phone: string): string {
  return phone.replace(/\D/g, "")
}

function normName(name: string): string {
  return name.toLowerCase().trim()
}

type CapiPurchaseParams = {
  pixelId: string
  token: string
  eventId: string
  orderId: string
  value: number
  currency: string
  contentIds: string[]
  userEmail?: string
  userPhone?: string
  firstName?: string
  lastName?: string
  fbp?: string
  fbc?: string
  ipAddress?: string
  userAgent?: string
  testEventCode?: string
}

export async function sendCapiPurchase(params: CapiPurchaseParams): Promise<void> {
  const {
    pixelId, token, eventId, orderId, value, currency, contentIds,
    userEmail, userPhone, firstName, lastName,
    fbp, fbc, ipAddress, userAgent, testEventCode,
  } = params

  const userData: Record<string, string> = {}
  if (userEmail) userData.em = hashValue(normEmail(userEmail))
  if (userPhone) userData.ph = hashValue(normPhone(userPhone))
  if (firstName) userData.fn = hashValue(normName(firstName))
  if (lastName) userData.ln = hashValue(normName(lastName))
  // fbp/fbc/ip/ua are NOT hashed per Meta spec
  if (fbp) userData.fbp = fbp
  if (fbc) userData.fbc = fbc
  if (ipAddress) userData.client_ip_address = ipAddress
  if (userAgent) userData.client_user_agent = userAgent

  const body: Record<string, unknown> = {
    data: [
      {
        event_name: "Purchase",
        event_time: Math.floor(Date.now() / 1000),
        event_id: eventId,
        action_source: "website",
        user_data: userData,
        custom_data: {
          value,
          currency: currency.toUpperCase(),
          content_ids: contentIds,
          num_items: contentIds.length,
        },
      },
    ],
  }

  if (testEventCode) {
    body.test_event_code = testEventCode
  }

  const url = `https://graph.facebook.com/${META_GRAPH_VERSION}/${pixelId}/events?access_token=${token}`

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  })

  if (!res.ok) {
    const text = await res.text().catch(() => res.status.toString())
    throw new Error(`Meta CAPI error ${res.status}: ${text}`)
  }
}
