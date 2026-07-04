import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { deleteFilesWorkflow } from "@medusajs/core-flows"
import { S3Client, ListObjectsV2Command } from "@aws-sdk/client-s3"

// ─────────────────────────────────────────────────────────────────────────────
// Media (R2 / S3) storage helper used by the admin Media Library page.
//
// Medusa never deletes the underlying file when a product/image/page is removed,
// so files accumulate as "orphans". This module lists everything in the bucket
// and figures out which keys are still referenced anywhere, so the admin can
// safely garbage-collect the rest.
// ─────────────────────────────────────────────────────────────────────────────

export type S3Config = {
  bucket: string
  fileUrl: string
  accessKeyId: string
  secretAccessKey: string
  region: string
  endpoint?: string
}

/** Reads the same S3_* env vars that medusa-config.ts uses. Returns null when storage isn't configured (e.g. local-disk dev). */
export function getS3Config(): S3Config | null {
  const bucket = process.env.S3_BUCKET
  const fileUrl = process.env.S3_FILE_URL
  const accessKeyId = process.env.S3_ACCESS_KEY_ID
  const secretAccessKey = process.env.S3_SECRET_ACCESS_KEY
  if (!bucket || !fileUrl || !accessKeyId || !secretAccessKey) return null
  return {
    bucket,
    fileUrl,
    accessKeyId,
    secretAccessKey,
    region: process.env.S3_REGION || "us-east-1",
    endpoint: process.env.S3_ENDPOINT || undefined,
  }
}

let _client: S3Client | null = null
function getClient(cfg: S3Config): S3Client {
  if (_client) return _client
  _client = new S3Client({
    region: cfg.region,
    endpoint: cfg.endpoint,
    // MinIO and most non-AWS S3 endpoints require path-style addressing.
    forcePathStyle: Boolean(cfg.endpoint),
    credentials: { accessKeyId: cfg.accessKeyId, secretAccessKey: cfg.secretAccessKey },
  })
  return _client
}

export type MediaObject = { key: string; size: number; lastModified: string | null }

/** Lists every object in the bucket (paginated). */
export async function listAllObjects(cfg: S3Config): Promise<MediaObject[]> {
  const client = getClient(cfg)
  const out: MediaObject[] = []
  let token: string | undefined

  do {
    const r = await client.send(
      new ListObjectsV2Command({ Bucket: cfg.bucket, ContinuationToken: token, MaxKeys: 1000 })
    )
    for (const o of r.Contents ?? []) {
      if (!o.Key || o.Key.endsWith("/")) continue
      out.push({
        key: o.Key,
        size: o.Size ?? 0,
        lastModified: o.LastModified ? o.LastModified.toISOString() : null,
      })
    }
    token = r.IsTruncated ? r.NextContinuationToken : undefined
  } while (token)

  return out
}

/** Reduces any stored URL (or raw key) to the bucket object key — the decoded final path segment. */
export function normalizeKey(value: string | null | undefined): string | null {
  if (!value) return null
  const clean = value.split("?")[0].split("#")[0]
  const seg = clean.substring(clean.lastIndexOf("/") + 1)
  if (!seg) return null
  try {
    return decodeURIComponent(seg)
  } catch {
    return seg
  }
}

/** Builds the public URL for an object key from S3_FILE_URL. */
export function buildPublicUrl(cfg: S3Config, key: string): string {
  const base = cfg.fileUrl.replace(/\/+$/, "")
  const encoded = key.split("/").map(encodeURIComponent).join("/")
  return `${base}/${encoded}`
}

const URL_RE = /https?:\/\/[^"'\s)]+/gi

/**
 * Collects every object key still referenced anywhere in the system.
 *
 * SAFETY: core sources (products, categories) are NOT wrapped in try/catch — if
 * they fail we let the error propagate so cleanup aborts rather than treating
 * real files as orphans. Optional custom modules are wrapped, because if a module
 * isn't installed it can't have uploaded anything to the bucket.
 */
export async function getReferencedKeys(scope: any): Promise<Set<string>> {
  const query = scope.resolve(ContainerRegistrationKeys.QUERY)
  const keys = new Set<string>()
  const add = (url: string | null | undefined) => {
    const n = normalizeKey(url)
    if (n) keys.add(n)
  }

  // Products: thumbnail + gallery images (core — must succeed)
  let offset = 0
  for (;;) {
    const { data } = await query.graph({
      entity: "product",
      fields: ["thumbnail", "images.url"],
      pagination: { skip: offset, take: 200 },
    })
    for (const p of data) {
      add(p.thumbnail)
      for (const img of p.images ?? []) add(img.url)
    }
    if (data.length < 200) break
    offset += data.length
  }

  // Categories: thumbnail stored in metadata.thumbnail_url (core — must succeed)
  const { data: cats } = await query.graph({ entity: "product_category", fields: ["metadata"] })
  for (const c of cats) add((c.metadata as any)?.thumbnail_url)

  // Homepage slides (optional module)
  try {
    const { data: slides } = await query.graph({
      entity: "home_slide",
      fields: ["image_url", "mobile_image_url"],
    })
    for (const s of slides) {
      add(s.image_url)
      add(s.mobile_image_url)
    }
  } catch {
    /* homepage module not installed */
  }

  // Homepage section settings JSON — scan for any embedded image URLs (optional module)
  try {
    const { data: sections } = await query.graph({ entity: "home_section", fields: ["settings"] })
    for (const sec of sections) {
      const blob = JSON.stringify(sec.settings ?? {})
      for (const m of blob.match(URL_RE) ?? []) add(m)
    }
  } catch {
    /* homepage module not installed */
  }

  // Brand logos (optional module)
  try {
    const { data: brands } = await query.graph({ entity: "brand", fields: ["logo_url"] })
    for (const b of brands) add(b.logo_url)
  } catch {
    /* brand module not installed */
  }

  return keys
}

/** Deletes object keys through the File module (provider-aware), in batches. */
export async function deleteKeys(scope: any, keys: string[]): Promise<void> {
  for (let i = 0; i < keys.length; i += 100) {
    await deleteFilesWorkflow(scope).run({ input: { ids: keys.slice(i, i + 100) } })
  }
}
