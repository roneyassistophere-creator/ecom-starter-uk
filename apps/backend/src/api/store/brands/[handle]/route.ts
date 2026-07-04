import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const { handle } = req.params
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)

  const { data: brands } = await query.graph({
    entity: "brand",
    fields: [
      "id",
      "name",
      "handle",
      "logo_url",
      "description",
      "website",
      "position",
      "products.id",
      "products.title",
      "products.handle",
      "products.thumbnail",
      "products.variants.id",
      "products.variants.calculated_price",
    ],
    filters: { handle },
  })

  if (!brands.length) {
    return res.status(404).json({ error: "Brand not found" })
  }

  res.json({ brand: brands[0] })
}
