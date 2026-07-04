import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)

  const { data: allBrands } = await query.graph({
    entity: "brand",
    fields: ["id", "name", "handle", "logo_url", "description", "website", "position", "products.id"],
  })

  // Only expose brands that have at least one product linked
  const brands = allBrands
    .filter((b: any) => Array.isArray(b.products) && b.products.length > 0)
    .sort((a: any, b: any) => a.position - b.position || a.created_at?.localeCompare(b.created_at ?? "") || 0)
    .map(({ products: _p, ...rest }: any) => rest)

  res.json({ brands, count: brands.length })
}
