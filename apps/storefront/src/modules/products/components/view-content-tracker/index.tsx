"use client"

import { trackViewContent, type AnalyticsProduct } from "@lib/analytics"
import { useEffect } from "react"

export default function ViewContentTracker({ product }: { product: AnalyticsProduct }) {
  useEffect(() => {
    trackViewContent(product)
  }, [product.id])

  return null
}
