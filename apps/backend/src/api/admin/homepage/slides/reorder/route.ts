import { AuthenticatedMedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { HOMEPAGE_MODULE } from "../../../../../modules/homepage"

// POST /admin/homepage/slides/reorder — body: { ids: string[] } ordered array
export async function POST(req: AuthenticatedMedusaRequest, res: MedusaResponse) {
  const svc = req.scope.resolve(HOMEPAGE_MODULE)
  const { ids } = req.body as { ids: string[] }

  if (!Array.isArray(ids) || ids.length === 0) {
    return res.status(400).json({ error: "ids must be a non-empty array" })
  }

  await svc.updateHomeSlides(
    ids.map((id: string, index: number) => ({ id, position: index }))
  )

  res.json({ success: true })
}
