import { AuthenticatedMedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { HOMEPAGE_MODULE } from "../../../../modules/homepage"

// GET /admin/homepage/sections — list all sections (+ slides) ordered by position
export async function GET(req: AuthenticatedMedusaRequest, res: MedusaResponse) {
  const svc = req.scope.resolve(HOMEPAGE_MODULE)

  const sections = await svc.listHomeSections(
    {},
    { relations: ["slides"], order: { position: "ASC" } }
  )

  // Ensure slides within each section are ordered by position
  for (const s of sections) {
    if (Array.isArray(s.slides)) {
      s.slides.sort((a: any, b: any) => a.position - b.position)
    }
  }

  res.json({ sections })
}

// POST /admin/homepage/sections — create a section
export async function POST(req: AuthenticatedMedusaRequest, res: MedusaResponse) {
  const svc = req.scope.resolve(HOMEPAGE_MODULE)
  const { title, type, layout, position, enabled, settings } = req.body as any

  // Auto-place at end when position is not supplied, so new sections never
  // collide with existing positions (which start at 0).
  let resolvedPosition = position
  if (resolvedPosition === undefined) {
    const existing = await svc.listHomeSections({})
    resolvedPosition = existing.length
  }

  const [section] = await svc.createHomeSections([
    {
      title,
      type,
      layout,
      position: resolvedPosition,
      enabled: enabled ?? true,
      settings: settings ?? null,
    },
  ])

  res.status(201).json({ section })
}
