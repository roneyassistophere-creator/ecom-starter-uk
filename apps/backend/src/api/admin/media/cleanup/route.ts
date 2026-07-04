import { AuthenticatedMedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import {
  getS3Config,
  listAllObjects,
  getReferencedKeys,
  normalizeKey,
  deleteKeys,
} from "../../../../lib/media-store"

// POST /admin/media/cleanup — delete all orphaned (unreferenced) files.
// Body: { dry_run?: boolean } — when true, reports what would be deleted without deleting.
export async function POST(req: AuthenticatedMedusaRequest, res: MedusaResponse) {
  const cfg = getS3Config()
  if (!cfg) {
    return res.status(400).json({ error: "S3/R2 storage is not configured." })
  }

  const dryRun = Boolean((req.body as any)?.dry_run)

  const [objects, referenced] = await Promise.all([
    listAllObjects(cfg),
    getReferencedKeys(req.scope),
  ])

  const orphans = objects.filter((o) => !referenced.has(normalizeKey(o.key) ?? o.key))
  const freedBytes = orphans.reduce((sum, o) => sum + o.size, 0)
  const orphanKeys = orphans.map((o) => o.key)

  if (dryRun) {
    return res.json({ dry_run: true, orphans: orphans.length, freed_bytes: freedBytes, keys: orphanKeys })
  }

  if (orphanKeys.length) {
    await deleteKeys(req.scope, orphanKeys)
  }

  res.json({ deleted: orphanKeys.length, freed_bytes: freedBytes })
}
