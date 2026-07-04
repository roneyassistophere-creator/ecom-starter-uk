import type { FulfillmentOrderDTO } from "@medusajs/types"

export type NormalizedStatus =
  | "pending"
  | "in_transit"
  | "delivered"
  | "returned"
  | "cancelled"
  | "unknown"

export type ParcelResult = {
  tracking_id: string
  consignment_id: string
  raw?: Record<string, unknown>
}

export interface CourierAdapter {
  createParcel(
    order: Partial<FulfillmentOrderDTO>,
    credentials: Record<string, string>
  ): Promise<ParcelResult>

  getStatus(
    consignment_id: string,
    credentials: Record<string, string>
  ): Promise<NormalizedStatus>

  cancelParcel?(
    consignment_id: string,
    credentials: Record<string, string>
  ): Promise<void>
}
