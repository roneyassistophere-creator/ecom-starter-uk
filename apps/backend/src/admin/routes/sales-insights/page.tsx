import { defineRouteConfig } from "@medusajs/admin-sdk"
import { CurrencyDollar } from "@medusajs/icons"
import { Badge, Button, Container, Heading, Text, toast } from "@medusajs/ui"
import { useCallback, useEffect, useState } from "react"

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

type Insights = {
  currency_code: string | null
  counted_orders: number
  total_orders_in_range: number
  variants_missing_cost: number
  metrics: {
    total_revenue: number
    product_revenue: number
    cogs: number
    gross_profit: number
    margin_pct: number
    shipping_collected: number
    cod_paid: number
    cod_pending: number
    avg_order_value: number
    returned_orders: number
    returned_value: number
  }
}

function money(n: number, cur: string | null): string {
  const c = (cur || "BDT").toUpperCase()
  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: c,
      maximumFractionDigits: 0,
    }).format(n || 0)
  } catch {
    return `${Math.round(n || 0).toLocaleString()} ${c}`
  }
}

const iso = (d: Date) => d.toISOString().slice(0, 10)

function presetRange(key: string): [string, string] {
  const now = new Date()
  const today = iso(now)
  if (key === "this_month") return [iso(new Date(now.getFullYear(), now.getMonth(), 1)), today]
  if (key === "last_month") {
    const start = new Date(now.getFullYear(), now.getMonth() - 1, 1)
    const end = new Date(now.getFullYear(), now.getMonth(), 0)
    return [iso(start), iso(end)]
  }
  if (key === "last_30") {
    const start = new Date(now)
    start.setDate(start.getDate() - 29)
    return [iso(start), today]
  }
  if (key === "this_year") return [iso(new Date(now.getFullYear(), 0, 1)), today]
  return [iso(new Date(now.getFullYear(), now.getMonth(), 1)), today]
}

function Kpi({
  label,
  value,
  hint,
  accent,
}: {
  label: string
  value: string
  hint?: string
  accent?: "green" | "red" | "base"
}) {
  const color =
    accent === "green"
      ? "text-ui-tag-green-text"
      : accent === "red"
      ? "text-ui-tag-red-text"
      : "text-ui-fg-base"
  return (
    <div className="flex flex-col gap-y-1 rounded-lg border border-ui-border-base p-4">
      <Text size="xsmall" className="text-ui-fg-muted">
        {label}
      </Text>
      <Text className={`text-xl font-semibold ${color}`}>{value}</Text>
      {hint && (
        <Text size="xsmall" className="text-ui-fg-muted">
          {hint}
        </Text>
      )}
    </div>
  )
}

const SalesInsightsPage = () => {
  const [[from, to], setRange] = useState<[string, string]>(() => presetRange("this_month"))
  const [data, setData] = useState<Insights | null>(null)
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      setData(
        await adminFetch<Insights>(`/sales-insights?from=${from}&to=${to}`)
      )
    } catch {
      toast.error("Failed to load sales insights")
    } finally {
      setLoading(false)
    }
  }, [from, to])

  useEffect(() => {
    load()
  }, [load])

  const m = data?.metrics
  const cur = data?.currency_code ?? null

  const presets: { key: string; label: string }[] = [
    { key: "this_month", label: "This month" },
    { key: "last_month", label: "Last month" },
    { key: "last_30", label: "Last 30 days" },
    { key: "this_year", label: "This year" },
  ]

  return (
    <div className="flex flex-col gap-y-4 p-4">
      <Container className="px-6 py-6 flex flex-col gap-y-5">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <Heading level="h1">Sales Insights</Heading>
            <Text size="small" className="text-ui-fg-subtle mt-1">
              Profit/loss, COD, and delivery — over <b>fulfilled</b> orders. Returned orders are
              netted out (their items go back to stock), and shown under <b>Returns</b>.
            </Text>
          </div>
        </div>

        {/* Date range */}
        <div className="flex items-end gap-3 flex-wrap">
          <div className="flex flex-wrap gap-1.5">
            {presets.map((p) => (
              <Button
                key={p.key}
                size="small"
                variant="secondary"
                onClick={() => setRange(presetRange(p.key))}
              >
                {p.label}
              </Button>
            ))}
          </div>
          <div className="flex items-end gap-2">
            <div className="flex flex-col gap-y-1">
              <Text size="xsmall" className="text-ui-fg-muted">From</Text>
              <input
                type="date"
                value={from}
                onChange={(e) => setRange([e.target.value, to])}
                className="h-8 rounded-md border border-ui-border-base bg-ui-bg-field px-2 text-sm"
              />
            </div>
            <div className="flex flex-col gap-y-1">
              <Text size="xsmall" className="text-ui-fg-muted">To</Text>
              <input
                type="date"
                value={to}
                onChange={(e) => setRange([from, e.target.value])}
                className="h-8 rounded-md border border-ui-border-base bg-ui-bg-field px-2 text-sm"
              />
            </div>
          </div>
        </div>

        {loading || !m ? (
          <Text size="small" className="text-ui-fg-muted">
            Loading…
          </Text>
        ) : (
          <>
            {data!.variants_missing_cost > 0 && (
              <Badge size="small" color="orange">
                {data!.variants_missing_cost} sold variant(s) have no cost price set — profit is
                understated. Set costs on their product pages.
              </Badge>
            )}

            {/* Profit headline */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <Kpi
                label="Gross profit"
                value={money(m.gross_profit, cur)}
                hint={`${m.margin_pct.toFixed(1)}% margin`}
                accent={m.gross_profit >= 0 ? "green" : "red"}
              />
              <Kpi label="Product revenue" value={money(m.product_revenue, cur)} hint="items only (excl. shipping)" />
              <Kpi label="Cost of goods (COGS)" value={money(m.cogs, cur)} />
            </div>

            {/* COD + delivery */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <Kpi label="COD collected (paid)" value={money(m.cod_paid, cur)} hint="payment captured" accent="green" />
              <Kpi label="COD pending" value={money(m.cod_pending, cur)} hint="delivered/awaiting, not captured" accent="red" />
              <Kpi label="Delivery collected" value={money(m.shipping_collected, cur)} />
              <Kpi label="Total revenue" value={money(m.total_revenue, cur)} hint="incl. shipping, net of returns" />
            </div>

            {/* Orders + returns */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <Kpi label="Fulfilled orders" value={String(data!.counted_orders)} hint={`${data!.total_orders_in_range} placed in range`} />
              <Kpi label="Avg order value" value={money(m.avg_order_value, cur)} />
              <Kpi
                label="Returns"
                value={String(m.returned_orders)}
                hint={`${money(m.returned_value, cur)} netted out`}
                accent={m.returned_orders > 0 ? "red" : "base"}
              />
            </div>
          </>
        )}
      </Container>
    </div>
  )
}

export const config = defineRouteConfig({
  label: "Sales Insights",
  icon: CurrencyDollar,
  rank: 5,
})

export default SalesInsightsPage
