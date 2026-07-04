import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { CLIENT_ERRORS_MODULE } from "../../../modules/clientErrors"

// POST /store/client-errors — the storefront reports a customer-facing error here
// (called server-side from Next.js `onRequestError`). Best-effort; never throws.
const trunc = (v: unknown, n: number): string | null =>
  typeof v === "string" && v.length ? v.slice(0, n) : null

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  try {
    const svc = req.scope.resolve(CLIENT_ERRORS_MODULE)
    const b = (req.body ?? {}) as Record<string, unknown>

    await svc.createClientErrors([
      {
        message: trunc(b.message, 2000) ?? "Unknown error",
        digest: trunc(b.digest, 200),
        path: trunc(b.path, 500),
        method: trunc(b.method, 16),
        router_kind: trunc(b.router_kind, 64),
        render_source: trunc(b.render_source, 64),
        stack: trunc(b.stack, 8000),
      },
    ])
  } catch (e) {
    // Reporting must never break the storefront — swallow and log.
    console.error("[client-errors] failed to record:", e)
  }

  res.json({ ok: true })
}
