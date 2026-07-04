import { AuthenticatedMedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils"
import { BRAND_MODULE } from "../../../../../modules/brand"
import { setProductBrandWorkflow } from "../../../../../workflows/set-product-brand"

export async function POST(
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) {
  const { id: brand_id } = req.params
  const { product_id } = req.body as { product_id: string }

  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)

  const { data: products } = await query.graph({
    entity: "product",
    fields: ["id", "brand.id"],
    filters: { id: product_id },
  })

  const old_brand_id = (products[0] as any)?.brand?.id ?? null

  await setProductBrandWorkflow(req.scope).run({
    input: { product_id, brand_id, old_brand_id },
  })

  res.json({ success: true })
}

export async function DELETE(
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) {
  const { id: brand_id, productId: product_id } = req.params

  await setProductBrandWorkflow(req.scope).run({
    input: { product_id, brand_id: null, old_brand_id: brand_id },
  })

  res.json({ success: true })
}
