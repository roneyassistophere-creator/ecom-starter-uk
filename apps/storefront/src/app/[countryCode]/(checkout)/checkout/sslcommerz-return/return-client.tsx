"use client"

import { placeOrder } from "@lib/data/cart"
import { Button, Text } from "@modules/common/components/ui"
import { useEffect, useRef, useState } from "react"

type Props = {
  cartId: string
  tranId?: string
  initialError?: string
}

const MAX_RETRIES = 8
const RETRY_DELAY_MS = 2000

export default function SSLCommerzReturnClient({ cartId, tranId, initialError }: Props) {
  const [status, setStatus] = useState<"processing" | "error" | "manual">(
    initialError ? "error" : "processing"
  )
  const [errorMessage, setErrorMessage] = useState(initialError ?? "")
  const retryCount = useRef(0)

  useEffect(() => {
    if (initialError) return  // Don't auto-retry on hard errors

    const attemptOrder = async () => {
      try {
        await placeOrder(cartId)
        // If placeOrder redirected, this code won't run
      } catch (err: any) {
        if (err?.digest?.startsWith("NEXT_REDIRECT") || err?.message?.includes("NEXT_REDIRECT")) {
          return // successful redirect
        }

        retryCount.current += 1
        if (retryCount.current < MAX_RETRIES) {
          setTimeout(attemptOrder, RETRY_DELAY_MS)
        } else {
          setStatus("manual")
          setErrorMessage(err.message ?? "Payment confirmation is taking longer than expected.")
        }
      }
    }

    const timer = setTimeout(attemptOrder, 1500) // wait a moment for IPN to arrive
    return () => clearTimeout(timer)
  }, [cartId, initialError])

  if (status === "processing") {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-y-4">
        <div className="w-8 h-8 border-4 border-ui-border-base border-t-ui-fg-interactive rounded-full animate-spin" />
        <Text className="text-ui-fg-base font-medium">Confirming your payment…</Text>
        <Text size="small" className="text-ui-fg-subtle">
          Please do not close this page.
        </Text>
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-y-4 max-w-md mx-auto text-center p-6">
      <Text className="text-ui-fg-base font-medium text-lg">Payment received — verifying order</Text>
      <Text size="small" className="text-ui-fg-subtle">
        {status === "manual"
          ? "Your payment was received but we could not automatically confirm your order. Please try the button below, or contact support with your transaction ID."
          : errorMessage}
      </Text>
      {tranId && (
        <Text size="xsmall" className="text-ui-fg-muted font-mono">
          Transaction ID: {tranId}
        </Text>
      )}
      <Button
        onClick={async () => {
          setStatus("processing")
          retryCount.current = 0
          try {
            await placeOrder(cartId)
          } catch (err: any) {
            if (!err?.digest?.startsWith("NEXT_REDIRECT")) {
              setStatus("error")
              setErrorMessage(err.message ?? "Order confirmation failed.")
            }
          }
        }}
        size="large"
      >
        Confirm Order
      </Button>
    </div>
  )
}
