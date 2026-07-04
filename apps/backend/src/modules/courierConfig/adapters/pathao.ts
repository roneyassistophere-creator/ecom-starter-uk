import type { FulfillmentOrderDTO } from "@medusajs/types"
import type { CourierAdapter, NormalizedStatus, ParcelResult } from "./interface"

const SANDBOX_BASE = "https://hermes-sandbox.pathao.com"
const LIVE_BASE = "https://api-hermes.pathao.com"

type PathaoToken = { access_token: string; expires_at: number }
// Session-scoped token cache per client_id
const tokenCache = new Map<string, PathaoToken>()

// City/zone/area ID caches (string key = "city:zone_name" etc.)
const cityCache = new Map<string, number>()
const zoneCache = new Map<string, number>()
const areaCache = new Map<string, number>()

const STATUS_MAP: Record<string, NormalizedStatus> = {
  "Pickup Requested":  "pending",
  "Pickup Completed":  "in_transit",
  "Pickup Cancelled":  "cancelled",
  "Picked Up":         "in_transit",
  "In Transit":        "in_transit",
  "Out For Delivery":  "in_transit",
  "Delivered":         "delivered",
  "Returned":          "returned",
  "Partial Delivery":  "in_transit",
  "Hold":              "in_transit",
  "Cancelled":         "cancelled",
}

async function getToken(
  credentials: Record<string, string>,
  sandbox: boolean
): Promise<string> {
  const base = sandbox ? SANDBOX_BASE : LIVE_BASE
  const { client_id, client_secret, username, password } = credentials
  const cacheKey = client_id

  const cached = tokenCache.get(cacheKey)
  if (cached && Date.now() < cached.expires_at) return cached.access_token

  const res = await fetch(`${base}/aladdin/api/v1/issue-token`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      client_id,
      client_secret,
      username,
      password,
      grant_type: "password",
    }),
  })

  const json = (await res.json()) as any
  if (!res.ok || !json.access_token) {
    throw new Error(`Pathao token grant failed: ${json.message ?? json.error ?? res.status}`)
  }

  const expiresIn = Number(json.expires_in ?? 3600)
  tokenCache.set(cacheKey, {
    access_token: json.access_token,
    expires_at: Date.now() + (expiresIn - 60) * 1000,
  })
  return json.access_token
}

async function lookupCity(
  name: string,
  token: string,
  base: string
): Promise<number | null> {
  const key = name.toLowerCase()
  if (cityCache.has(key)) return cityCache.get(key)!

  try {
    const res = await fetch(`${base}/aladdin/api/v1/countries/cities`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    if (!res.ok) return null
    const json = (await res.json()) as any
    const cities: any[] = json.data?.data ?? json.data ?? []
    for (const c of cities) {
      cityCache.set(String(c.city_name ?? "").toLowerCase(), c.city_id)
    }
    return cityCache.get(key) ?? null
  } catch {
    return null
  }
}

async function lookupZone(
  cityId: number,
  zoneName: string,
  token: string,
  base: string
): Promise<number | null> {
  const key = `${cityId}:${zoneName.toLowerCase()}`
  if (zoneCache.has(key)) return zoneCache.get(key)!

  try {
    const res = await fetch(`${base}/aladdin/api/v1/cities/${cityId}/zone-list`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    if (!res.ok) return null
    const json = (await res.json()) as any
    const zones: any[] = json.data?.data ?? json.data ?? []
    for (const z of zones) {
      zoneCache.set(`${cityId}:${String(z.zone_name ?? "").toLowerCase()}`, z.zone_id)
    }
    return zoneCache.get(key) ?? null
  } catch {
    return null
  }
}

async function lookupArea(
  zoneId: number,
  areaName: string,
  token: string,
  base: string
): Promise<number | null> {
  const key = `${zoneId}:${areaName.toLowerCase()}`
  if (areaCache.has(key)) return areaCache.get(key)!

  try {
    const res = await fetch(`${base}/aladdin/api/v1/zones/${zoneId}/area-list`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    if (!res.ok) return null
    const json = (await res.json()) as any
    const areas: any[] = json.data?.data ?? json.data ?? []
    for (const a of areas) {
      areaCache.set(`${zoneId}:${String(a.area_name ?? "").toLowerCase()}`, a.area_id)
    }
    return areaCache.get(key) ?? null
  } catch {
    return null
  }
}

export const pathaoAdapter: CourierAdapter = {
  async createParcel(
    order: Partial<FulfillmentOrderDTO>,
    credentials: Record<string, string>
  ): Promise<ParcelResult> {
    const sandbox = credentials.sandbox === "true"
    const base = sandbox ? SANDBOX_BASE : LIVE_BASE
    const token = await getToken(credentials, sandbox)

    const address = (order as any).shipping_address
    const city = address?.city || "Dhaka"
    const zone = address?.province || city
    const area = address?.address_2 || zone

    const cityId = (await lookupCity(city, token, base)) ?? 1
    const zoneId = (await lookupZone(cityId, zone, token, base)) ?? 1
    const areaId = (await lookupArea(zoneId, area, token, base)) ?? 1

    const recipientName =
      address?.first_name && address?.last_name
        ? `${address.first_name} ${address.last_name}`.trim()
        : address?.first_name || "Customer"
    const recipientPhone = address?.phone || (order as any).email || ""

    const paymentStatus = (order as any).payment_status
    const collectAmount =
      paymentStatus === "not_paid" || paymentStatus === "awaiting"
        ? Number((order as any).total ?? 0)
        : 0

    const body = {
      store_id: Number(credentials.store_id ?? 0) || undefined,
      merchant_order_id: String((order as any).display_id ?? (order as any).id ?? ""),
      recipient_name: recipientName,
      recipient_phone: recipientPhone,
      recipient_address: [address?.address_1, address?.address_2].filter(Boolean).join(", ") || city,
      recipient_city: cityId,
      recipient_zone: zoneId,
      recipient_area: areaId,
      delivery_type: 48, // standard
      item_type: 2,       // parcel
      special_instruction: `Order #${(order as any).display_id ?? ""}`,
      item_quantity: 1,
      item_weight: 0.5,
      amount_to_collect: collectAmount,
      item_description: "E-commerce order",
    }

    const res = await fetch(`${base}/aladdin/api/v1/orders/`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    })

    const json = (await res.json()) as any
    if (!res.ok) {
      const msg = json.message ?? JSON.stringify(json.errors ?? json) ?? res.status
      throw new Error(`Pathao createParcel failed: ${msg}`)
    }

    const parcel = json.data ?? json
    return {
      tracking_id: String(parcel.consignment_id ?? parcel.order_consignment_id ?? ""),
      consignment_id: String(parcel.consignment_id ?? ""),
      raw: json,
    }
  },

  async getStatus(
    consignment_id: string,
    credentials: Record<string, string>
  ): Promise<NormalizedStatus> {
    const sandbox = credentials.sandbox === "true"
    const base = sandbox ? SANDBOX_BASE : LIVE_BASE

    let token: string
    try {
      token = await getToken(credentials, sandbox)
    } catch {
      return "unknown"
    }

    try {
      const res = await fetch(`${base}/aladdin/api/v1/orders/summary?consignment_id=${consignment_id}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok) return "unknown"
      const json = (await res.json()) as any
      const rawStatus: string = json.data?.order_status ?? json.data?.status ?? ""
      return STATUS_MAP[rawStatus] ?? "unknown"
    } catch {
      return "unknown"
    }
  },
}
