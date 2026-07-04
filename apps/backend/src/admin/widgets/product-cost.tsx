import { defineWidgetConfig } from "@medusajs/admin-sdk"
import { Button, Container, Heading, Input, Text, toast } from "@medusajs/ui"
import { useEffect, useState } from "react"

async function adminFetch<T = unknown>(path: string, init?: RequestInit): Promise<T> {
  const token =
    localStorage.getItem("_medusa_auth_token") ||
    localStorage.getItem("medusa_auth_token") ||
    ""

  const res = await fetch(`/admin${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(init?.headers as Record<string, string> | undefined),
    },
  })

  if (!res.ok) throw new Error(`Request failed: ${res.status}`)
  return res.json() as Promise<T>
}

type Row = { variant_id: string; title: string; sku: string | null; cost: string }

const ProductCostWidget = ({ data: product }: { data: { id: string } }) => {
  const [rows, setRows] = useState<Row[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    adminFetch<{ variant_costs: { variant_id: string; title: string; sku: string | null; cost: number }[] }>(
      `/variant-costs?product_id=${product.id}`
    )
      .then(({ variant_costs }) =>
        setRows(variant_costs.map((v) => ({ ...v, cost: String(v.cost ?? 0) })))
      )
      .catch(() => toast.error("Failed to load cost prices"))
      .finally(() => setLoading(false))
  }, [product.id])

  const setCost = (variant_id: string, value: string) =>
    setRows((rs) => rs.map((r) => (r.variant_id === variant_id ? { ...r, cost: value } : r)))

  const save = async () => {
    setSaving(true)
    try {
      await adminFetch("/variant-costs", {
        method: "POST",
        body: JSON.stringify({
          costs: rows.map((r) => ({ variant_id: r.variant_id, cost: Number(r.cost) || 0 })),
        }),
      })
      toast.success("Cost prices saved")
    } catch {
      toast.error("Failed to save cost prices")
    } finally {
      setSaving(false)
    }
  }

  return (
    <Container className="px-6 py-6 flex flex-col gap-y-4">
      <div>
        <Heading level="h2">Cost Price (COGS)</Heading>
        <Text size="small" className="text-ui-fg-subtle mt-1">
          What each variant costs you. Drives profit &amp; margin in the Sales Insights dashboard.
          Use the same currency as your selling prices.
        </Text>
      </div>

      {loading ? (
        <Text size="small" className="text-ui-fg-muted">
          Loading…
        </Text>
      ) : rows.length === 0 ? (
        <Text size="small" className="text-ui-fg-muted">
          No variants on this product.
        </Text>
      ) : (
        <div className="flex flex-col gap-y-2">
          {rows.map((r) => (
            <div key={r.variant_id} className="flex items-center gap-3">
              <div className="flex-1 min-w-0">
                <Text size="small" className="truncate">
                  {r.title}
                </Text>
                {r.sku && (
                  <Text size="xsmall" className="text-ui-fg-muted truncate">
                    {r.sku}
                  </Text>
                )}
              </div>
              <Input
                type="number"
                min={0}
                step="0.01"
                className="w-32"
                value={r.cost}
                onChange={(e) => setCost(r.variant_id, e.target.value)}
                placeholder="0"
              />
            </div>
          ))}
        </div>
      )}

      <div className="flex justify-end">
        <Button size="small" onClick={save} isLoading={saving} disabled={loading || saving}>
          Save cost prices
        </Button>
      </div>
    </Container>
  )
}

export const config = defineWidgetConfig({
  zone: "product.details.after",
})

export default ProductCostWidget
