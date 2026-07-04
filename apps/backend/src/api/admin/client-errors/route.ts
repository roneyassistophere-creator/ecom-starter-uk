import { AuthenticatedMedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { CLIENT_ERRORS_MODULE } from "../../../modules/clientErrors"

// GET /admin/client-errors — newest errors first (for the admin Error Log page)
export async function GET(req: AuthenticatedMedusaRequest, res: MedusaResponse) {
  const svc = req.scope.resolve(CLIENT_ERRORS_MODULE)
  const [errors, count] = await svc.listAndCountClientErrors(
    {},
    { order: { created_at: "DESC" }, take: 200 }
  )
  res.json({ errors, count })
}

// DELETE /admin/client-errors — clear the whole log
export async function DELETE(req: AuthenticatedMedusaRequest, res: MedusaResponse) {
  const svc = req.scope.resolve(CLIENT_ERRORS_MODULE)
  const all = await svc.listClientErrors({}, { select: ["id"], take: 100000 })
  if (all.length) {
    await svc.deleteClientErrors(all.map((e: { id: string }) => e.id))
  }
  res.json({ deleted: all.length })
}
