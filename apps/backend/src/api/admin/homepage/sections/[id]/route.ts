import { AuthenticatedMedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { HOMEPAGE_MODULE } from "../../../../../modules/homepage"

// GET /admin/homepage/sections/:id — one section with slides
export async function GET(req: AuthenticatedMedusaRequest, res: MedusaResponse) {
  const svc = req.scope.resolve(HOMEPAGE_MODULE)
  const { id } = req.params

  const section = await svc.retrieveHomeSection(id, { relations: ["slides"] })

  if (Array.isArray(section.slides)) {
    section.slides.sort((a: any, b: any) => a.position - b.position)
  }

  res.json({ section })
}

// POST /admin/homepage/sections/:id — update title/type/layout/enabled/settings
export async function POST(req: AuthenticatedMedusaRequest, res: MedusaResponse) {
  const svc = req.scope.resolve(HOMEPAGE_MODULE)
  const { id } = req.params
  const { title, type, layout, enabled, settings } = req.body as any

  const update: Record<string, unknown> = {}
  if (title    !== undefined) update.title   = title
  if (type     !== undefined) update.type    = type
  if (layout   !== undefined) update.layout  = layout
  if (enabled  !== undefined) update.enabled = enabled
  if (settings !== undefined) {
    // Merge into existing settings so partial saves (e.g. split panel vs mobile aspect)
    // don't overwrite each other's fields.
    const existing = await svc.retrieveHomeSection(id)
    update.settings = { ...(existing.settings as Record<string, unknown> ?? {}), ...settings }
  }

  const [section] = await svc.updateHomeSections([{ id, ...update }])

  res.json({ section })
}

// DELETE /admin/homepage/sections/:id — delete section and its slides
export async function DELETE(req: AuthenticatedMedusaRequest, res: MedusaResponse) {
  const svc = req.scope.resolve(HOMEPAGE_MODULE)
  const { id } = req.params

  // Cascade: soft-delete all slides first (no DB-level cascade on delete)
  const slides = await svc.listHomeSlides({ section_id: id })
  if (slides.length > 0) {
    await svc.softDeleteHomeSlides(slides.map((s: any) => s.id))
  }

  await svc.softDeleteHomeSections([id])

  res.json({ id, deleted: true })
}
