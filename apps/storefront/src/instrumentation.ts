// Next.js server-side error hook. Fires for every server error (RSC render,
// server actions, route handlers) with the REAL message + stack (which are
// hidden from the browser in production). We forward it to the Medusa backend
// so it shows up in Admin → Error Log. Best-effort: never throws.
export async function onRequestError(
  error: unknown,
  request: { path?: string; method?: string },
  context: { routerKind?: string; renderSource?: string }
) {
  try {
    const backend =
      process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL ?? "http://localhost:9000"
    const pk = process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY ?? ""

    const err = error as { message?: string; stack?: string; digest?: string }

    await fetch(`${backend}/store/client-errors`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-publishable-api-key": pk,
      },
      body: JSON.stringify({
        message: err?.message ?? String(error),
        digest: err?.digest ?? null,
        stack: err?.stack ?? null,
        path: request?.path ?? null,
        method: request?.method ?? null,
        router_kind: context?.routerKind ?? null,
        render_source: context?.renderSource ?? null,
      }),
      // Don't let a slow/down backend hang the error path.
      cache: "no-store",
    })
  } catch {
    // Never let error reporting throw.
  }
}
