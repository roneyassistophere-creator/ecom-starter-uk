import { defineRouteConfig } from "@medusajs/admin-sdk"
import { ShoppingBag, Trash, Plus } from "@medusajs/icons"
import { Button, Container, Heading, Input, Label, Select, Text, toast } from "@medusajs/ui"
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

type Channel = { id: string; name: string }
type Line = {
  variant_id: string
  product_id: string
  title: string
  quantity: number
  unit_price: number
}
type SearchVariant = {
  variant_id: string
  product_id: string
  title: string
  unit_price: number
}

function variantPrice(prices: any[] | undefined, cur: string): number {
  if (!prices?.length) return 0
  const hit = prices.find((p) => (p.currency_code || "").toLowerCase() === cur)
  return Number((hit ?? prices[0])?.amount ?? 0)
}

const QuickOrderPage = () => {
  // reference data
  const [channels, setChannels] = useState<Channel[]>([])
  const [regionId, setRegionId] = useState("")
  const [currency, setCurrency] = useState("bdt")
  const [shipOptId, setShipOptId] = useState<string | undefined>()

  // form state
  const [name, setName] = useState("")
  const [phone, setPhone] = useState("")
  const [email, setEmail] = useState("")
  const [address, setAddress] = useState("")
  const [city, setCity] = useState("")
  const [postal, setPostal] = useState("")
  const [channelId, setChannelId] = useState("")
  const [delivery, setDelivery] = useState("0")
  const [note, setNote] = useState("")

  // items
  const [query, setQuery] = useState("")
  const [results, setResults] = useState<SearchVariant[]>([])
  const [lines, setLines] = useState<Line[]>([])

  const [creating, setCreating] = useState(false)
  const [createdId, setCreatedId] = useState<string | null>(null)

  useEffect(() => {
    adminFetch<{ sales_channels: Channel[] }>("/sales-channels?fields=id,name&limit=100")
      .then(({ sales_channels }) => {
        setChannels(sales_channels)
        if (sales_channels[0]) setChannelId(sales_channels[0].id)
      })
      .catch(() => toast.error("Failed to load sales channels"))

    adminFetch<{ regions: { id: string; currency_code: string }[] }>("/regions?fields=id,currency_code&limit=10")
      .then(({ regions }) => {
        if (regions[0]) {
          setRegionId(regions[0].id)
          setCurrency((regions[0].currency_code || "bdt").toLowerCase())
        }
      })
      .catch(() => {})

    adminFetch<{ shipping_options: { id: string; name: string; prices?: any[] }[] }>(
      "/shipping-options?fields=id,name,prices.amount,prices.currency_code&limit=20"
    )
      .then(({ shipping_options }) => {
        const opt = shipping_options[0]
        if (opt) {
          setShipOptId(opt.id)
          setDelivery(String(variantPrice(opt.prices, "bdt") || 0))
        }
      })
      .catch(() => {})
  }, [])

  // product search (debounced)
  useEffect(() => {
    const q = query.trim()
    if (!q) {
      setResults([])
      return
    }
    const t = setTimeout(async () => {
      try {
        const { products } = await adminFetch<{ products: any[] }>(
          `/products?q=${encodeURIComponent(q)}&limit=8&fields=id,title,variants.id,variants.title,variants.sku,variants.prices.amount,variants.prices.currency_code`
        )
        const flat: SearchVariant[] = []
        for (const p of products) {
          for (const v of p.variants ?? []) {
            flat.push({
              variant_id: v.id,
              product_id: p.id,
              title:
                v.title && v.title !== "Default variant" ? `${p.title} — ${v.title}` : p.title,
              unit_price: variantPrice(v.prices, currency),
            })
          }
        }
        setResults(flat)
      } catch {
        /* ignore */
      }
    }, 300)
    return () => clearTimeout(t)
  }, [query, currency])

  const addLine = (v: SearchVariant) => {
    setLines((ls) => {
      const existing = ls.find((l) => l.variant_id === v.variant_id)
      if (existing) {
        return ls.map((l) =>
          l.variant_id === v.variant_id ? { ...l, quantity: l.quantity + 1 } : l
        )
      }
      return [...ls, { ...v, quantity: 1 }]
    })
    setQuery("")
    setResults([])
  }

  const updateLine = (variant_id: string, patch: Partial<Line>) =>
    setLines((ls) => ls.map((l) => (l.variant_id === variant_id ? { ...l, ...patch } : l)))
  const removeLine = (variant_id: string) =>
    setLines((ls) => ls.filter((l) => l.variant_id !== variant_id))

  const itemsTotal = lines.reduce((s, l) => s + l.quantity * l.unit_price, 0)
  const grandTotal = itemsTotal + (Number(delivery) || 0)

  const fmt = (n: number) => `${(n || 0).toLocaleString()} ${currency.toUpperCase()}`

  const create = async () => {
    if (!name.trim() || !phone.trim() || !address.trim())
      return toast.error("Name, phone and address are required")
    if (!lines.length) return toast.error("Add at least one item")
    if (!channelId || !regionId) return toast.error("Sales channel / region not loaded")

    setCreating(true)
    try {
      const { order_id } = await adminFetch<{ order_id: string }>("/quick-orders", {
        method: "POST",
        body: JSON.stringify({
          customer: {
            name,
            phone,
            email: email.trim() || undefined,
            address_1: address,
            city,
            postal_code: postal,
            country_code: "bd",
          },
          items: lines.map((l) => ({
            variant_id: l.variant_id,
            product_id: l.product_id,
            title: l.title,
            quantity: l.quantity,
            unit_price: l.unit_price,
          })),
          region_id: regionId,
          sales_channel_id: channelId,
          shipping: { name: "Delivery", amount: Number(delivery) || 0, shipping_option_id: shipOptId },
          currency_code: currency,
          note: note.trim() || undefined,
        }),
      })
      setCreatedId(order_id)
      toast.success("Order created")
    } catch {
      toast.error("Failed to create order")
    } finally {
      setCreating(false)
    }
  }

  const resetForm = () => {
    setName(""); setPhone(""); setEmail(""); setAddress(""); setCity(""); setPostal("")
    setNote(""); setLines([]); setQuery(""); setResults([]); setCreatedId(null)
  }

  if (createdId) {
    return (
      <div className="flex flex-col gap-y-4 p-4">
        <Container className="px-6 py-10 flex flex-col items-center gap-y-4 text-center">
          <Heading level="h1">Order created 🎉</Heading>
          <Text size="small" className="text-ui-fg-subtle">
            The order is in your Orders list, ready to fulfill and print an invoice.
          </Text>
          <div className="flex gap-3">
            <a href={`/app/orders/${createdId}`}>
              <Button>Open order</Button>
            </a>
            <Button variant="secondary" onClick={resetForm}>
              Create another
            </Button>
          </div>
        </Container>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-y-4 p-4">
      <Container className="px-6 py-6 flex flex-col gap-y-6">
        <div>
          <Heading level="h1">New Order</Heading>
          <Text size="small" className="text-ui-fg-subtle mt-1">
            Place an order for a customer from social, phone, WhatsApp, or in-store. Email is
            optional — phone + address is enough.
          </Text>
        </div>

        {/* Customer */}
        <div className="flex flex-col gap-y-3">
          <Text size="small" weight="plus">Customer</Text>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Field label="Name *"><Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Customer name" /></Field>
            <Field label="Phone *"><Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+8801…" /></Field>
            <Field label="Address *"><Input value={address} onChange={(e) => setAddress(e.target.value)} placeholder="House, road, area" /></Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="City"><Input value={city} onChange={(e) => setCity(e.target.value)} /></Field>
              <Field label="Postal"><Input value={postal} onChange={(e) => setPostal(e.target.value)} /></Field>
            </div>
            <Field label="Email (optional)"><Input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Leave blank if none" /></Field>
          </div>
        </div>

        {/* Items */}
        <div className="flex flex-col gap-y-3 border-t border-ui-border-base pt-4">
          <Text size="small" weight="plus">Items</Text>
          <div className="relative">
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search products by name or SKU…"
            />
            {results.length > 0 && (
              <div className="absolute z-10 mt-1 w-full max-h-72 overflow-y-auto rounded-lg border border-ui-border-base bg-ui-bg-base shadow-lg">
                {results.map((r) => (
                  <button
                    key={r.variant_id}
                    onClick={() => addLine(r)}
                    className="flex w-full items-center justify-between gap-2 px-3 py-2 text-left hover:bg-ui-bg-subtle"
                  >
                    <Text size="small" className="truncate">{r.title}</Text>
                    <span className="flex items-center gap-1 text-ui-fg-muted">
                      <Text size="xsmall">{fmt(r.unit_price)}</Text>
                      <Plus className="w-3 h-3" />
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {lines.length === 0 ? (
            <Text size="small" className="text-ui-fg-muted">No items yet — search above.</Text>
          ) : (
            <div className="flex flex-col gap-y-2">
              {lines.map((l) => (
                <div key={l.variant_id} className="flex items-center gap-2">
                  <Text size="small" className="flex-1 min-w-0 truncate">{l.title}</Text>
                  <Input
                    type="number" min={1} className="w-16"
                    value={String(l.quantity)}
                    onChange={(e) => updateLine(l.variant_id, { quantity: Math.max(1, Number(e.target.value) || 1) })}
                  />
                  <Input
                    type="number" min={0} className="w-28"
                    value={String(l.unit_price)}
                    onChange={(e) => updateLine(l.variant_id, { unit_price: Math.max(0, Number(e.target.value) || 0) })}
                  />
                  <Text size="small" className="w-24 text-right text-ui-fg-subtle">{fmt(l.quantity * l.unit_price)}</Text>
                  <button onClick={() => removeLine(l.variant_id)} className="text-ui-fg-muted hover:text-ui-fg-error">
                    <Trash className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Options */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 border-t border-ui-border-base pt-4">
          <Field label="Sales channel">
            <Select value={channelId} onValueChange={setChannelId}>
              <Select.Trigger><Select.Value placeholder="Channel" /></Select.Trigger>
              <Select.Content>
                {channels.map((ch) => (
                  <Select.Item key={ch.id} value={ch.id}>{ch.name}</Select.Item>
                ))}
              </Select.Content>
            </Select>
          </Field>
          <Field label={`Delivery charge (${currency.toUpperCase()})`}>
            <Input type="number" min={0} value={delivery} onChange={(e) => setDelivery(e.target.value)} />
          </Field>
          <Field label="Note (optional)">
            <Input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Internal note" />
          </Field>
        </div>

        {/* Total + submit */}
        <div className="flex items-center justify-between border-t border-ui-border-base pt-4">
          <div className="flex flex-col">
            <Text size="small" className="text-ui-fg-muted">
              Items {fmt(itemsTotal)} + Delivery {fmt(Number(delivery) || 0)}
            </Text>
            <Text className="text-lg font-semibold">Total {fmt(grandTotal)}</Text>
          </div>
          <Button onClick={create} isLoading={creating} disabled={creating}>
            Create order
          </Button>
        </div>
      </Container>
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-y-1">
      <Label size="small">{label}</Label>
      {children}
    </div>
  )
}

export const config = defineRouteConfig({
  label: "New Order",
  icon: ShoppingBag,
  rank: 1,
})

export default QuickOrderPage
