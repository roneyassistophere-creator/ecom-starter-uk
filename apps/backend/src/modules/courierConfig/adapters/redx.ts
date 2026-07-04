import type { FulfillmentOrderDTO } from "@medusajs/types"
import type { CourierAdapter, NormalizedStatus, ParcelResult } from "./interface"

const SANDBOX_BASE = "https://sandbox.redx.com.bd"
const LIVE_BASE = "https://openapi.redx.com.bd"

type AreaCacheEntry = { district_id: number; area_id: number }
// Session-scoped cache: city name → IDs (avoids repeated lookup per fulfillment)
const areaCache = new Map<string, AreaCacheEntry>()

const STATUS_MAP: Record<string, NormalizedStatus> = {
  "pickup-pending":    "pending",
  "pickup-assigned":   "pending",
  "picked-up":         "in_transit",
  "in-transit":        "in_transit",
  "out-for-delivery":  "in_transit",
  "delivered":         "delivered",
  "partially-delivered": "in_transit",
  "returned":          "returned",
  "return-in-transit": "returned",
  "cancelled":         "cancelled",
}

async function lookupArea(
  city: string,
  token: string,
  sandbox: boolean
): Promise<AreaCacheEntry | null> {
  const cached = areaCache.get(city.toLowerCase())
  if (cached) return cached

  const base = sandbox ? SANDBOX_BASE : LIVE_BASE
  try {
    const res = await fetch(`${base}/v1.0.0-beta/areas?name=${encodeURIComponent(city)}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    if (!res.ok) return null

    const json = (await res.json()) as any
    const areas: any[] = json.areas ?? json.data ?? []
    if (areas.length === 0) return null

    const entry: AreaCacheEntry = {
      district_id: areas[0].district_id ?? areas[0].districtId ?? 0,
      area_id: areas[0].id ?? areas[0].area_id ?? 0,
    }
    areaCache.set(city.toLowerCase(), entry)
    return entry
  } catch {
    return null
  }
}

export const redxAdapter: CourierAdapter = {
  async createParcel(
    order: Partial<FulfillmentOrderDTO>,
    credentials: Record<string, string>
  ): Promise<ParcelResult> {
    const sandbox = credentials.sandbox === "true"
    const base = sandbox ? SANDBOX_BASE : LIVE_BASE
    const token = credentials.api_token ?? ""

    const address = (order as any).shipping_address
    const recipientName =
      address?.first_name && address?.last_name
        ? `${address.first_name} ${address.last_name}`.trim()
        : address?.first_name || "Customer"
    const recipientPhone = address?.phone || (order as any).email || ""
    const city = address?.city || "Dhaka"

    const area = await lookupArea(city, token, sandbox)

    const paymentStatus = (order as any).payment_status
    const cashOnDelivery =
      paymentStatus === "not_paid" || paymentStatus === "awaiting"
        ? Number((order as any).total ?? 0)
        : 0

    const body: Record<string, unknown> = {
      name: recipientName,
      phone: recipientPhone,
      address: [address?.address_1, address?.address_2].filter(Boolean).join(", ") || city,
      cash_on_delivery: cashOnDelivery,
      invoice_id: String((order as any).display_id ?? (order as any).id ?? ""),
      parcel_weight: 0.5,
    }
    if (area) {
      body.area_id = area.area_id
      body.district_id = area.district_id
    }

    const res = await fetch(`${base}/v1.0.0-beta/parcel`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    })

    const json = (await res.json()) as any
    if (!res.ok) {
      throw new Error(`RedX createParcel failed: ${json.message ?? res.status}`)
    }

    const parcel = json.parcel ?? json
    return {
      tracking_id: String(parcel.tracking_id ?? parcel.trackingId ?? ""),
      consignment_id: String(parcel.id ?? parcel.parcel_id ?? ""),
      raw: json,
    }
  },

  async getStatus(
    consignment_id: string,
    credentials: Record<string, string>
  ): Promise<NormalizedStatus> {
    const sandbox = credentials.sandbox === "true"
    const base = sandbox ? SANDBOX_BASE : LIVE_BASE
    const token = credentials.api_token ?? ""

    try {
      const res = await fetch(`${base}/v1.0.0-beta/parcel/info?tracking_id=${consignment_id}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok) return "unknown"

      const json = (await res.json()) as any
      const rawStatus: string = (
        json.parcel?.status ?? json.status ?? ""
      ).toLowerCase()

      return STATUS_MAP[rawStatus] ?? "unknown"
    } catch {
      return "unknown"
    }
  },
}
