/**
 * Migrates existing product images from the Medusa local file provider
 * (apps/backend/static/) to MinIO, then updates all database URLs.
 *
 * Run once after MinIO is up:
 *   node scripts/migrate-local-to-minio.mjs
 */

import {
  S3Client,
  CreateBucketCommand,
  HeadBucketCommand,
  PutBucketPolicyCommand,
  PutObjectCommand,
} from "@aws-sdk/client-s3"
import { readdir, readFile } from "fs/promises"
import { join, extname, dirname } from "path"
import { fileURLToPath } from "url"
import pg from "pg"

const __dirname = dirname(fileURLToPath(import.meta.url))

// ── Config (reads from process.env or uses the local dev defaults) ─────────
const ENDPOINT    = process.env.S3_ENDPOINT        || "http://localhost:9100"
const BUCKET      = process.env.S3_BUCKET          || "medusa-store"
const ACCESS_KEY  = process.env.S3_ACCESS_KEY_ID   || "minioadmin"
const SECRET_KEY  = process.env.S3_SECRET_ACCESS_KEY || "minioadmin"
const REGION      = process.env.S3_REGION          || "us-east-1"
const FILE_URL    = process.env.S3_FILE_URL        || `${ENDPOINT}/${BUCKET}`
const DATABASE_URL = process.env.DATABASE_URL      || "postgres://postgres:4646@localhost:5432/mystore"

// The old local URL prefix Medusa used to serve static files
const OLD_URL_PREFIX = "http://localhost:9000/static/"

const STATIC_DIR = join(__dirname, "../apps/backend/static")

const MIME_MAP = {
  ".jpg":  "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png":  "image/png",
  ".gif":  "image/gif",
  ".webp": "image/webp",
  ".svg":  "image/svg+xml",
  ".pdf":  "application/pdf",
}

function mime(filename) {
  return MIME_MAP[extname(filename).toLowerCase()] || "application/octet-stream"
}

// ── S3 client ──────────────────────────────────────────────────────────────
const s3 = new S3Client({
  endpoint: ENDPOINT,
  region: REGION,
  credentials: { accessKeyId: ACCESS_KEY, secretAccessKey: SECRET_KEY },
  forcePathStyle: true,
})

async function ensureBucket() {
  try {
    await s3.send(new HeadBucketCommand({ Bucket: BUCKET }))
    console.log(`Bucket "${BUCKET}" already exists.`)
  } catch (e) {
    if (e.name === "NoSuchBucket" || e.$metadata?.httpStatusCode === 404) {
      await s3.send(new CreateBucketCommand({ Bucket: BUCKET }))
      console.log(`Bucket "${BUCKET}" created.`)
    } else {
      throw e
    }
  }

  // Public read policy so images load without signed URLs
  const policy = JSON.stringify({
    Version: "2012-10-17",
    Statement: [
      {
        Effect: "Allow",
        Principal: { AWS: ["*"] },
        Action: ["s3:GetBucketLocation", "s3:ListBucket", "s3:GetObject"],
        Resource: [
          `arn:aws:s3:::${BUCKET}`,
          `arn:aws:s3:::${BUCKET}/*`,
        ],
      },
    ],
  })
  await s3.send(new PutBucketPolicyCommand({ Bucket: BUCKET, Policy: policy }))
  console.log("Bucket policy set to public-read.")
}

async function uploadFiles() {
  let files
  try {
    files = await readdir(STATIC_DIR)
  } catch {
    console.log("No static directory found — nothing to upload.")
    return []
  }

  if (files.length === 0) {
    console.log("Static directory is empty — nothing to upload.")
    return []
  }

  console.log(`\nUploading ${files.length} file(s) to MinIO…`)
  const uploaded = []

  for (const filename of files) {
    const filePath = join(STATIC_DIR, filename)
    const body = await readFile(filePath)

    await s3.send(new PutObjectCommand({
      Bucket: BUCKET,
      Key: filename,
      Body: body,
      ContentType: mime(filename),
      ACL: "public-read",
    }))

    uploaded.push(filename)
    console.log(`  ✓ ${filename}`)
  }

  return uploaded
}

// ── Database URL update ────────────────────────────────────────────────────
async function updateDatabase(uploadedFiles) {
  if (uploadedFiles.length === 0) return

  const client = new pg.Client({ connectionString: DATABASE_URL })
  await client.connect()

  try {
    // Find all user-defined tables with text/varchar/character varying columns
    const { rows: columns } = await client.query(`
      SELECT table_name, column_name
      FROM information_schema.columns
      WHERE table_schema = 'public'
        AND data_type IN ('text', 'character varying', 'varchar')
      ORDER BY table_name, column_name
    `)

    let totalUpdated = 0

    for (const { table_name, column_name } of columns) {
      // Skip known-system or migration tables
      if (table_name.startsWith("pg_") || table_name === "mikro_orm_migrations") continue

      // Only touch rows that actually contain the old local URL
      try {
        const res = await client.query(
          `UPDATE "${table_name}"
           SET "${column_name}" = REPLACE("${column_name}", $1, $2)
           WHERE "${column_name}" LIKE $3`,
          [OLD_URL_PREFIX, `${FILE_URL}/`, `%${OLD_URL_PREFIX}%`]
        )
        if (res.rowCount > 0) {
          console.log(`  Updated ${res.rowCount} row(s) in ${table_name}.${column_name}`)
          totalUpdated += res.rowCount
        }
      } catch {
        // Some tables may have constraints or triggers; skip them silently
      }
    }

    if (totalUpdated === 0) {
      console.log("No database rows contained the old local URL — nothing to update.")
      console.log(`(Looked for URLs starting with: ${OLD_URL_PREFIX})`)
    } else {
      console.log(`\nDatabase updated: ${totalUpdated} URL(s) migrated.`)
    }
  } finally {
    await client.end()
  }
}

// ── Main ───────────────────────────────────────────────────────────────────
async function main() {
  console.log("=== Medusa local → MinIO migration ===\n")
  console.log(`MinIO endpoint : ${ENDPOINT}`)
  console.log(`Bucket         : ${BUCKET}`)
  console.log(`Public file URL: ${FILE_URL}`)
  console.log(`Database       : ${DATABASE_URL.replace(/:([^:@]+)@/, ":***@")}\n`)

  try {
    await ensureBucket()
    const uploaded = await uploadFiles()
    console.log("\nUpdating database URLs…")
    await updateDatabase(uploaded)
    console.log("\nDone. Restart the Medusa backend to use MinIO for new uploads.")
  } catch (err) {
    console.error("\nMigration failed:", err.message)
    console.error(err)
    process.exit(1)
  }
}

main()
