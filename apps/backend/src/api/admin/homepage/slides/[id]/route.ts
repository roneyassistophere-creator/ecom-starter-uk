import { AuthenticatedMedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { HOMEPAGE_MODULE } from "../../../../../modules/homepage"

// POST /admin/homepage/slides/:id — update a slide
export async function POST(req: AuthenticatedMedusaRequest, res: MedusaResponse) {
  const svc = req.scope.resolve(HOMEPAGE_MODULE)
  const { id } = req.params
  const {
    image_url,
    mobile_image_url,
    heading,
    subheading,
    cta_label,
    cta_link,
    position,
  } = req.body as any

  const update: Record<string, unknown> = {}
  if (image_url        !== undefined) update.image_url        = image_url
  if (mobile_image_url !== undefined) update.mobile_image_url = mobile_image_url
  if (heading          !== undefined) update.heading          = heading
  if (subheading       !== undefined) update.subheading       = subheading
  if (cta_label        !== undefined) update.cta_label        = cta_label
  if (cta_link         !== undefined) update.cta_link         = cta_link
  if (position         !== undefined) update.position         = position

  const [slide] = await svc.updateHomeSlides([{ id, ...update }])

  res.json({ slide })
}

// DELETE /admin/homepage/slides/:id — delete a slide
export async function DELETE(req: AuthenticatedMedusaRequest, res: MedusaResponse) {
  const svc = req.scope.resolve(HOMEPAGE_MODULE)
  const { id } = req.params

  await svc.softDeleteHomeSlides([id])

  res.json({ id, deleted: true })
}
