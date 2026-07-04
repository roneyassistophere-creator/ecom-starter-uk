import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const body = req.body as Record<string, string>
  const cart_id = body.value_a
  const tran_id = body.tran_id
  const country_code = body.value_b ?? "bd"

  const storeUrl = (process.env.STORE_URL ?? "http://localhost:8000").replace(/\/$/, "")

  if (!cart_id) {
    return res.redirect(`${storeUrl}/${country_code}/checkout?step=payment&error=payment_error`)
  }

  // Redirect customer to storefront return page; the return page will complete the order
  return res.redirect(
    `${storeUrl}/${country_code}/checkout/sslcommerz-return?cart_id=${encodeURIComponent(cart_id)}&tran_id=${encodeURIComponent(tran_id ?? "")}`
  )
}
