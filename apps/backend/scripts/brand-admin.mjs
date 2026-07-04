// Post-build: rebrand the generated Medusa admin (browser tab title + favicon)
// so the admin matches the storefront branding. Runs after `medusa build`
// (see package.json "build"). Medusa v2 exposes no config for the admin
// title/favicon, so we patch the generated index.html and drop the favicon
// into the served admin folder.
//
// Configure per store:
//   • Title  — set ADMIN_APP_NAME (build-time env) to your store name,
//              or edit ADMIN_TITLE_FALLBACK below.
//   • Favicon — place your favicon at apps/backend/scripts/admin-favicon.ico
//              (use the SAME file as apps/storefront/public/favicon.ico).
import { readFileSync, writeFileSync, copyFileSync, existsSync } from "node:fs"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"

const ADMIN_TITLE_FALLBACK = "Medusa Admin"
const ADMIN_TITLE = process.env.ADMIN_APP_NAME || ADMIN_TITLE_FALLBACK

const here = dirname(fileURLToPath(import.meta.url))
const adminDir = join(process.cwd(), ".medusa", "server", "public", "admin")
const indexPath = join(adminDir, "index.html")
const faviconSrc = join(here, "admin-favicon.ico")

if (!existsSync(indexPath)) {
  console.warn(`[brand-admin] ${indexPath} not found — skipping (did 'medusa build' run?)`)
  process.exit(0)
}

// 1) Favicon → place it where the admin is served (…/public/admin/favicon.ico → /app/favicon.ico)
const hasFavicon = existsSync(faviconSrc)
if (hasFavicon) {
  copyFileSync(faviconSrc, join(adminDir, "favicon.ico"))
}

let html = readFileSync(indexPath, "utf8")

// 2) Title
if (/<title>[\s\S]*?<\/title>/i.test(html)) {
  html = html.replace(/<title>[\s\S]*?<\/title>/i, `<title>${ADMIN_TITLE}</title>`)
} else {
  html = html.replace(/<head>/i, `<head><title>${ADMIN_TITLE}</title>`)
}

// 3) Favicon link (only when a favicon was shipped)
if (hasFavicon) {
  const faviconTag = `<link rel="icon" type="image/x-icon" href="/app/favicon.ico" />`
  if (/<link[^>]*rel=["']icon["'][^>]*>/i.test(html)) {
    html = html.replace(/<link[^>]*rel=["']icon["'][^>]*>/gi, faviconTag)
  } else {
    html = html.replace(/<\/head>/i, `${faviconTag}</head>`)
  }
}

writeFileSync(indexPath, html)
console.log(
  `[brand-admin] applied title="${ADMIN_TITLE}"${hasFavicon ? " + favicon" : " (no favicon shipped)"}`
)
