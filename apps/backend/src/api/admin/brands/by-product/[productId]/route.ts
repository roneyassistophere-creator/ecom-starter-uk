import { AuthenticatedMedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"

export async function GET(
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) {
  const { productId } = req.params
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)

  const { data: products } = await query.graph({
    entity: "product",
    fields: ["id", "brand.id", "brand.name", "brand.handle", "brand.logo_url"],
    filters: { id: productId },
  })

  const brand = (products[0] as any)?.brand ?? null
  res.json({ brand })
}
