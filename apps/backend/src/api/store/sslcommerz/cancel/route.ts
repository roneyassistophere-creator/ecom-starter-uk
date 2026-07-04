import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const body = req.body as Record<string, string>
  const country_code = body.value_b ?? "bd"
  const storeUrl = (process.env.STORE_URL ?? "http://localhost:8000").replace(/\/$/, "")
  return res.redirect(
    `${storeUrl}/${country_code}/checkout?step=payment`
  )
}
