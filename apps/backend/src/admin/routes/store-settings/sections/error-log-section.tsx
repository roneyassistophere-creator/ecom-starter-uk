import { Badge, Button, Container, Prompt, Text, toast } from "@medusajs/ui"
import { useCallback, useEffect, useState } from "react"
import { adminFetch } from "../../../lib/api"

type ClientError = {
  id: string
  message: string
  digest: string | null
  path: string | null
  method: string | null
  router_kind: string | null
  render_source: string | null
  stack: string | null
  created_at: string
}

function timeAgo(iso: string): string {
  const d = new Date(iso)
  const diff = Date.now() - d.getTime()
  const m = Math.floor(diff / 60000)
  if (m < 1) return "just now"
  if (m < 60) return `${m}m ago`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h ago`
  return d.toLocaleString()
}

function Detail({ label, value }: { label: string; value: string | null }) {
  return (
    <div className="flex flex-col">
      <Text size="xsmall" className="text-ui-fg-muted">{label}</Text>
      <Text size="small" className="text-ui-fg-base break-words">{value || "—"}</Text>
    </div>
  )
}

function ErrorRow({ err }: { err: ClientError }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="border border-ui-border-base rounded-lg overflow-hidden">
      <button
        onClick={() => setOpen((p) => !p)}
        className="flex w-full items-start gap-3 px-4 py-3 text-left hover:bg-ui-bg-subtle transition-colors"
      >
        <span className="text-ui-fg-muted mt-0.5 transition-transform" style={{ transform: open ? "rotate(90deg)" : "none" }}>▸</span>
        <div className="flex flex-col gap-y-1 min-w-0 flex-1">
          <Text size="small" weight="plus" className="truncate">{err.message}</Text>
          <div className="flex items-center gap-2 flex-wrap">
            <Text size="xsmall" className="text-ui-fg-muted">{timeAgo(err.created_at)}</Text>
            {err.path && <Badge size="2xsmall" color="grey">{err.method ? `${err.method} ` : ""}{err.path}</Badge>}
            {err.digest && <Badge size="2xsmall" color="orange">{err.digest}</Badge>}
          </div>
        </div>
      </button>

      {open && (
        <div className="border-t border-ui-border-base bg-ui-bg-subtle px-4 py-3 flex flex-col gap-y-3">
          <Detail label="Message" value={err.message} />
          <div className="grid grid-cols-2 gap-3">
            <Detail label="Path" value={err.path} />
            <Detail label="Method" value={err.method} />
            <Detail label="Router" value={err.router_kind} />
            <Detail label="Render source" value={err.render_source} />
            <Detail label="Digest" value={err.digest} />
            <Detail label="When" value={new Date(err.created_at).toLocaleString()} />
          </div>
          {err.stack && (
            <div className="flex flex-col gap-y-1">
              <Text size="xsmall" weight="plus" className="text-ui-fg-subtle">Stack trace</Text>
              <pre className="text-[11px] leading-relaxed text-ui-fg-subtle bg-ui-bg-base border border-ui-border-base rounded-md p-3 overflow-x-auto whitespace-pre-wrap break-words max-h-72">{err.stack}</pre>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export function ErrorLogSection() {
  const [errors, setErrors] = useState<ClientError[]>([])
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [confirmClear, setConfirmClear] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const { errors } = await adminFetch<{ errors: ClientError[] }>("/client-errors")
      setErrors(errors)
    } catch {
      toast.error("Failed to load error log")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  const clearAll = async () => {
    setBusy(true)
    try {
      await adminFetch("/client-errors", { method: "DELETE" })
      toast.success("Error log cleared")
      await load()
    } catch {
      toast.error("Failed to clear")
    } finally {
      setBusy(false)
      setConfirmClear(false)
    }
  }

  return (
    <Container className="px-6 py-6 flex flex-col gap-y-5">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <Text size="small" className="text-ui-fg-subtle">
          Errors customers hit on the storefront. Click a row to expand the full details.
        </Text>
        <div className="flex items-center gap-2">
          <Button size="small" variant="secondary" disabled={loading || busy} onClick={load}>Refresh</Button>
          {errors.length > 0 && (
            <Button size="small" variant="danger" disabled={busy} onClick={() => setConfirmClear(true)}>Clear all</Button>
          )}
        </div>
      </div>

      {loading ? (
        <Text size="small" className="text-ui-fg-muted">Loading…</Text>
      ) : errors.length === 0 ? (
        <Text size="small" className="text-ui-fg-muted">No errors recorded. 🎉</Text>
      ) : (
        <div className="flex flex-col gap-y-2">
          {errors.map((err) => <ErrorRow key={err.id} err={err} />)}
        </div>
      )}

      <Prompt open={confirmClear} onOpenChange={setConfirmClear}>
        <Prompt.Content>
          <Prompt.Header>
            <Prompt.Title>Clear error log?</Prompt.Title>
            <Prompt.Description>This permanently deletes all recorded errors. This cannot be undone.</Prompt.Description>
          </Prompt.Header>
          <Prompt.Footer>
            <Prompt.Cancel disabled={busy}>Cancel</Prompt.Cancel>
            <Prompt.Action onClick={clearAll}>Clear all</Prompt.Action>
          </Prompt.Footer>
        </Prompt.Content>
      </Prompt>
    </Container>
  )
}
