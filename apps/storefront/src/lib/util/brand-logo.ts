import "server-only"
import fs from "node:fs"
import path from "node:path"
import brand from "brand.config"

let cached: boolean | null = null

/**
 * True when a logo image actually exists at `public/<brand.logoPath>`.
 * Lets the nav/footer show the logo image when present and fall back to the
 * store-name text when no logo file is shipped. Result is cached per process.
 */
export function hasBrandLogo(): boolean {
  if (cached !== null) return cached
  if (!brand.logoPath) return (cached = false)
  try {
    const rel = brand.logoPath.replace(/^\/+/, "")
    cached = fs.existsSync(path.join(process.cwd(), "public", rel))
  } catch {
    cached = false
  }
  return cached
}
