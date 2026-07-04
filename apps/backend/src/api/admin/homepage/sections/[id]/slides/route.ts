import { AuthenticatedMedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { HOMEPAGE_MODULE } from "../../../../../../modules/homepage"

// POST /admin/homepage/sections/:id/slides — add a slide to this section
export async function POST(req: AuthenticatedMedusaRequest, res: MedusaResponse) {
  const svc = req.scope.resolve(HOMEPAGE_MODULE)
  const { id: section_id } = req.params
  const {
    image_url,
    mobile_image_url,
    heading,
    subheading,
    cta_label,
    cta_link,
    position,
  } = req.body as any

  // Auto-assign next position if not supplied
  let resolvedPosition = position
  if (resolvedPosition === undefined) {
    const existing = await svc.listHomeSlides({ section_id })
    resolvedPosition = existing.length
  }

  const [slide] = await svc.createHomeSlides([
    {
      section_id,
      image_url,
      mobile_image_url: mobile_image_url ?? null,
      heading: heading ?? null,
      subheading: subheading ?? null,
      cta_label: cta_label ?? null,
      cta_link: cta_link ?? null,
      position: resolvedPosition,
    },
  ])

  res.status(201).json({ slide })
}
