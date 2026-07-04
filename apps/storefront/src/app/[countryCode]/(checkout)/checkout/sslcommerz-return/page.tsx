import { placeOrder } from "@lib/data/cart"
import { Metadata } from "next"
import SSLCommerzReturnClient from "./return-client"

export const metadata: Metadata = {
  title: "Processing Payment",
}

type Props = {
  searchParams: Promise<{ cart_id?: string; tran_id?: string }>
}

export default async function SSLCommerzReturnPage({ searchParams }: Props) {
  const { cart_id, tran_id } = await searchParams

  if (!cart_id) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <p className="text-ui-fg-subtle">Invalid return URL. Please contact support.</p>
      </div>
    )
  }

  try {
    // placeOrder calls cart.complete() → authorizePayment() → if validated, redirects to /order/confirmed
    await placeOrder(cart_id)
    // If we reach here, cart is still pending (redirect didn't happen)
  } catch (err: any) {
    // next/navigation redirect throws — that's expected when successful
    // Re-throw so Next.js handles the redirect
    if (err?.message?.includes("NEXT_REDIRECT") || err?.digest?.startsWith("NEXT_REDIRECT")) {
      throw err
    }
    // Any other error: show retry UI with the error message
    return (
      <SSLCommerzReturnClient
        cartId={cart_id}
        tranId={tran_id}
        initialError={err.message}
      />
    )
  }

  // Cart not yet authorized (IPN may not have arrived yet) — show retry UI
  return <SSLCommerzReturnClient cartId={cart_id} tranId={tran_id} />
}
