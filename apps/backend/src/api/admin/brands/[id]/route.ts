import { AuthenticatedMedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { BRAND_MODULE } from "../../../../modules/brand"
import { updateBrandWorkflow } from "../../../../workflows/update-brand"
import { deleteBrandWorkflow } from "../../../../workflows/delete-brand"

export async function GET(
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) {
  const { id } = req.params
  const brandService = req.scope.resolve(BRAND_MODULE)
  const brand = await brandService.retrieveBrand(id)
  res.json({ brand })
}

export async function POST(
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) {
  const { id } = req.params
  const body = req.body as {
    name?: string
    handle?: string
    logo_url?: string | null
    description?: string | null
    website?: string | null
    position?: number
  }

  const { result: brand } = await updateBrandWorkflow(req.scope).run({
    input: { id, ...body },
  })

  res.json({ brand })
}

export async function DELETE(
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) {
  const { id } = req.params
  await deleteBrandWorkflow(req.scope).run({ input: id })
  res.json({ deleted: true, id })
}
