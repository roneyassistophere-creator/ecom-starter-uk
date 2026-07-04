import type { FulfillmentOrderDTO } from "@medusajs/types"
import type { CourierAdapter, NormalizedStatus, ParcelResult } from "./interface"

// Steadfast status → NormalizedStatus mapping
const STATUS_MAP: Record<string, NormalizedStatus> = {
  pending: "pending",
  in_review: "pending",
  partially_delivered: "in_transit",
  out_for_delivery: "in_transit",
  delivered: "delivered",
  returned: "returned",
  cancelled: "cancelled",
}

export const steadfastAdapter: CourierAdapter = {
  async createParcel(
    order: Partial<FulfillmentOrderDTO>,
    credentials: Record<string, string>
  ): Promise<ParcelResult> {
    const address = (order as any).shipping_address
    const recipientName =
      address?.first_name && address?.last_name
        ? `${address.first_name} ${address.last_name}`.trim()
        : address?.first_name || address?.last_name || "Customer"

    const recipientPhone =
      address?.phone || (order as any).email || ""

    const recipientAddress = [
      address?.address_1,
      address?.address_2,
      address?.city,
    ]
      .filter(Boolean)
      .join(", ")

    // COD amount: full order total if no online payment, else 0
    const paymentMethod = (order as any).payment_status
    const codAmount =
      paymentMethod === "not_paid" || paymentMethod === "awaiting"
        ? Number(((order as any).total ?? 0))
        : 0

    const body = {
      invoice: String((order as any).display_id ?? (order as any).id ?? ""),
      recipient_name: recipientName,
      recipient_phone: recipientPhone,
      recipient_address: recipientAddress || "Dhaka, Bangladesh",
      cod_amount: codAmount,
      note: `Order #${(order as any).display_id ?? ""}`,
    }

    const res = await fetch("https://portal.packzy.com/api/v1/create_order", {
      method: "POST",
      headers: {
        "Api-Key": credentials.api_key ?? "",
        "Secret-Key": credentials.secret_key ?? "",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    })

    const json = (await res.json()) as any

    if (!res.ok || json.status !== 200) {
      throw new Error(
        `Steadfast createParcel failed: ${json.message ?? res.status}`
      )
    }

    const consignment = json.consignment ?? {}
    return {
      tracking_id: String(consignment.tracking_code ?? consignment.consignment_id ?? ""),
      consignment_id: String(consignment.consignment_id ?? ""),
      raw: json,
    }
  },

  async getStatus(
    consignment_id: string,
    credentials: Record<string, string>
  ): Promise<NormalizedStatus> {
    const res = await fetch(
      `https://portal.packzy.com/api/v1/status_by_cid/${consignment_id}`,
      {
        headers: {
          "Api-Key": credentials.api_key ?? "",
          "Secret-Key": credentials.secret_key ?? "",
          "Content-Type": "application/json",
        },
      }
    )

    if (!res.ok) return "unknown"

    const json = (await res.json()) as any
    const rawStatus: string = (
      json.delivery_status ??
      json.consignment?.delivery_status ??
      ""
    ).toLowerCase()

    return STATUS_MAP[rawStatus] ?? "unknown"
  },
}
