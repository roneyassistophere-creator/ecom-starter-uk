"use client"

import { trackInitiateCheckout } from "@lib/analytics"
import { useEffect } from "react"

type Props = {
  value: number
  currency: string
  numItems: number
}

export default function InitiateCheckoutTracker({ value, currency, numItems }: Props) {
  useEffect(() => {
    trackInitiateCheckout({ value, currency, numItems })
  }, [])

  return null
}
