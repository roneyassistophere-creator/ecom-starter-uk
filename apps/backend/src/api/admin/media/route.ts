import { AuthenticatedMedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import {
  getS3Config,
  listAllObjects,
  getReferencedKeys,
  buildPublicUrl,
  normalizeKey,
  deleteKeys,
} from "../../../lib/media-store"

const EMPTY_SUMMARY = { total: 0, referenced: 0, orphans: 0, total_bytes: 0, orphan_bytes: 0 }

// GET /admin/media — list every file in the bucket, flagging which are orphaned.
export async function GET(req: AuthenticatedMedusaRequest, res: MedusaResponse) {
  const cfg = getS3Config()
  if (!cfg) {
    return res.json({ s3_configured: false, files: [], summary: EMPTY_SUMMARY })
  }

  try {
    const [objects, referenced] = await Promise.all([
      listAllObjects(cfg),
      getReferencedKeys(req.scope),
    ])

    let referencedCount = 0
    let orphanBytes = 0
    let totalBytes = 0

    const files = objects
      .map((o) => {
        const isRef = referenced.has(normalizeKey(o.key)!)
        totalBytes += o.size
        if (isRef) referencedCount++
        else orphanBytes += o.size
        return {
          key: o.key,
          url: buildPublicUrl(cfg, o.key),
          size: o.size,
          last_modified: o.lastModified,
          referenced: isRef,
        }
      })
      // Orphans first, then newest first — puts the actionable items up top.
      .sort(
        (a, b) =>
          Number(a.referenced) - Number(b.referenced) ||
          (b.last_modified || "").localeCompare(a.last_modified || "")
      )

    res.json({
      s3_configured: true,
      files,
      summary: {
        total: objects.length,
        referenced: referencedCount,
        orphans: objects.length - referencedCount,
        total_bytes: totalBytes,
        orphan_bytes: orphanBytes,
      },
    })
  } catch (e: any) {
    // Surface the real reason (bad creds, unreachable endpoint, wrong bucket, …)
    // instead of a generic 500 so the admin page can display it.
    console.error("[media] GET /admin/media failed:", e)
    let endpointHost: string | null = null
    try {
      endpointHost = cfg.endpoint ? new URL(cfg.endpoint).host : null
    } catch {
      endpointHost = cfg.endpoint || null
    }
    res.json({
      s3_configured: true,
      error:
        e?.message ||
        e?.name ||
        "Could not read the storage bucket. Check the backend S3_* settings and that the bucket is reachable.",
      // Non-secret config the listing is using — helps pinpoint endpoint/bucket/region mistakes.
      debug: { endpoint: endpointHost, bucket: cfg.bucket, region: cfg.region },
      files: [],
      summary: EMPTY_SUMMARY,
    })
  }
}

// DELETE /admin/media — delete specific keys. Refuses in-use files unless allow_referenced.
export async function DELETE(req: AuthenticatedMedusaRequest, res: MedusaResponse) {
  const { keys, allow_referenced } = (req.body ?? {}) as {
    keys?: string[]
    allow_referenced?: boolean
  }

  if (!keys?.length) {
    return res.status(400).json({ error: "Provide a non-empty `keys` array to delete." })
  }

  if (!allow_referenced) {
    const referenced = await getReferencedKeys(req.scope)
    const blocked = keys.filter((k) => referenced.has(normalizeKey(k)!))
    if (blocked.length) {
      return res.status(409).json({
        error: "Some files are still in use and were not deleted.",
        blocked,
      })
    }
  }

  await deleteKeys(req.scope, keys)
  res.json({ deleted: keys.length })
}
