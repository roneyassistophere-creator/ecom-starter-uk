import { AuthenticatedMedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { BRAND_MODULE } from "../../../modules/brand"
import { createBrandWorkflow } from "../../../workflows/create-brand"

export async function GET(req: AuthenticatedMedusaRequest, res: MedusaResponse) {
  const brandService = req.scope.resolve(BRAND_MODULE)
  const [brands, count] = await brandService.listAndCountBrands(
    {},
    { order: { position: "ASC", created_at: "ASC" } }
  )
  res.json({ brands, count })
}

export async function POST(req: AuthenticatedMedusaRequest, res: MedusaResponse) {
  const body = req.body as {
    name: string
    handle: string
    logo_url?: string | null
    description?: string | null
    website?: string | null
    position?: number
  }

  const { result: brand } = await createBrandWorkflow(req.scope).run({
    input: body,
  })

  res.json({ brand })
}
