"use client"

import { trackPurchaseWithEventId, type AnalyticsProduct } from "@lib/analytics"
import { useEffect } from "react"

type Props = {
  orderId: string
  total: number
  currency: string
  products: AnalyticsProduct[]
}

export default function PurchaseTracker({ orderId, total, currency, products }: Props) {
  useEffect(() => {
    // eventId = orderId ensures deduplication with server-side CAPI Purchase event
    trackPurchaseWithEventId({ orderId, total, currency, products, eventId: orderId })
  }, [orderId])

  return null
}
