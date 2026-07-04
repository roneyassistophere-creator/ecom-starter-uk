import { placeOrder } from "@lib/data/cart"
import { Metadata } from "next"
import SSLCommerzReturnClient from "../sslcommerz-return/return-client"

export const metadata: Metadata = {
  title: "Processing Payment",
}

type Props = {
  searchParams: Promise<{ cart_id?: string; trx_id?: string }>
}

export default async function BkashReturnPage({ searchParams }: Props) {
  const { cart_id, trx_id } = await searchParams

  if (!cart_id) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <p className="text-ui-fg-subtle">Invalid return URL. Please contact support.</p>
      </div>
    )
  }

  try {
    await placeOrder(cart_id)
  } catch (err: any) {
    if (err?.digest?.startsWith("NEXT_REDIRECT") || err?.message?.includes("NEXT_REDIRECT")) {
      throw err
    }
    return (
      <SSLCommerzReturnClient
        cartId={cart_id}
        tranId={trx_id}
        initialError={err.message}
      />
    )
  }

  return <SSLCommerzReturnClient cartId={cart_id} tranId={trx_id} />
}
