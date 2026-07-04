import { defineWidgetConfig } from "@medusajs/admin-sdk"
import { Button, Container, Heading, Text, toast } from "@medusajs/ui"
import { useState } from "react"

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

const esc = (s: unknown) =>
  String(s ?? "").replace(/[&<>"']/g, (m) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[m] as string)
  )

function money(n: number, cur: string): string {
  const sym = cur.toLowerCase() === "bdt" ? "৳" : `${cur.toUpperCase()} `
  return `${sym}${(Number(n) || 0).toLocaleString()}`
}

function buildHtml(
  order: any,
  store: { name: string; phone: string; whatsapp: string },
  mode: "invoice" | "packing"
): string {
  const cur = order.currency_code || "bdt"
  const a = order.shipping_address || {}
  const name = [a.first_name, a.last_name].filter(Boolean).join(" ") || order.email || "Customer"
  const addr = [a.address_1, a.address_2, a.city, a.postal_code, (a.country_code || "").toUpperCase()]
    .filter(Boolean)
    .join(", ")
  const paid = ["captured", "partially_captured"].includes(order.payment_status)
  const items = (order.items || [])
    .map(
      (it: any) => `<tr>
        <td>${esc(it.product_title ? it.product_title + (it.variant_title && it.variant_title !== "Default variant" ? " — " + it.variant_title : "") : it.title)}</td>
        <td class="num">${Number(it.quantity) || 0}</td>
        ${mode === "invoice" ? `<td class="num">${money(Number(it.unit_price) || 0, cur)}</td><td class="num">${money((Number(it.unit_price) || 0) * (Number(it.quantity) || 0), cur)}</td>` : ""}
      </tr>`
    )
    .join("")

  const total = Number(order.total) || 0
  const itemTotal = Number(order.item_total ?? order.subtotal) || 0
  const shipping = Number(order.shipping_total) || 0

  return `<!doctype html><html><head><meta charset="utf-8"><title>${mode === "invoice" ? "Invoice" : "Packing Slip"} #${esc(order.display_id)}</title>
  <style>
    * { box-sizing: border-box; }
    body { font-family: -apple-system, Segoe UI, Roboto, sans-serif; color:#111; margin:0; padding:24px; font-size:13px; }
    .head { display:flex; justify-content:space-between; align-items:flex-start; border-bottom:2px solid #111; padding-bottom:12px; }
    .store { font-size:20px; font-weight:800; }
    .muted { color:#555; font-size:12px; }
    h1 { font-size:16px; margin:0; text-transform:uppercase; letter-spacing:1px; }
    .row { display:flex; justify-content:space-between; gap:24px; margin-top:16px; }
    .box { flex:1; }
    .box .label { font-size:11px; text-transform:uppercase; color:#888; margin-bottom:2px; }
    table { width:100%; border-collapse:collapse; margin-top:18px; }
    th, td { text-align:left; padding:7px 8px; border-bottom:1px solid #ddd; }
    th { background:#f5f5f5; font-size:11px; text-transform:uppercase; }
    td.num, th.num { text-align:right; }
    .totals { margin-top:14px; margin-left:auto; width:280px; }
    .totals .line { display:flex; justify-content:space-between; padding:4px 0; }
    .cod { margin-top:14px; padding:10px 14px; border:2px solid #111; border-radius:8px; display:flex; justify-content:space-between; align-items:center; font-weight:700; font-size:15px; }
    .paid { color:#0a0; }
    .foot { margin-top:28px; text-align:center; color:#888; font-size:11px; }
    @media print { body { padding:0; } @page { margin:12mm; } }
  </style></head><body>
    <div class="head">
      <div>
        <div class="store">${esc(store.name)}</div>
        <div class="muted">${store.phone ? "Phone: " + esc(store.phone) : ""}${store.whatsapp ? " · WhatsApp: " + esc(store.whatsapp) : ""}</div>
      </div>
      <div style="text-align:right">
        <h1>${mode === "invoice" ? "Invoice" : "Packing Slip"}</h1>
        <div class="muted">#${esc(order.display_id)}</div>
        <div class="muted">${new Date(order.created_at).toLocaleString()}</div>
      </div>
    </div>

    <div class="row">
      <div class="box">
        <div class="label">Deliver to</div>
        <div><b>${esc(name)}</b></div>
        <div>${esc(a.phone || order.email || "")}</div>
        <div>${esc(addr)}</div>
      </div>
    </div>

    <table>
      <thead><tr><th>Item</th><th class="num">Qty</th>${mode === "invoice" ? `<th class="num">Price</th><th class="num">Total</th>` : ""}</tr></thead>
      <tbody>${items}</tbody>
    </table>

    ${
      mode === "invoice"
        ? `<div class="totals">
            <div class="line"><span>Subtotal</span><span>${money(itemTotal, cur)}</span></div>
            <div class="line"><span>Delivery</span><span>${money(shipping, cur)}</span></div>
            <div class="line" style="border-top:1px solid #ccc;font-weight:700"><span>Total</span><span>${money(total, cur)}</span></div>
          </div>
          <div class="cod">
            ${paid ? `<span>Payment</span><span class="paid">PAID</span>` : `<span>Cash on Delivery — collect</span><span>${money(total, cur)}</span>`}
          </div>`
        : ""
    }

    ${order.metadata?.manual_note ? `<div class="muted" style="margin-top:14px">Note: ${esc(order.metadata.manual_note)}</div>` : ""}
    <div class="foot">Thank you for shopping with ${esc(store.name)}!</div>
  </body></html>`
}

const OrderInvoiceWidget = ({ data: order }: { data: { id: string } }) => {
  const [busy, setBusy] = useState(false)

  const print = async (mode: "invoice" | "packing") => {
    setBusy(true)
    try {
      const { order: full } = await adminFetch<{ order: any }>(
        `/orders/${order.id}?fields=id,display_id,created_at,email,currency_code,payment_status,fulfillment_status,total,item_total,subtotal,shipping_total,metadata,*items,*shipping_address`
      )
      let store = { name: "", phone: "", whatsapp: "" }
      try {
        const { setting } = await adminFetch<{ setting: any }>("/store-settings")
        store.phone = setting?.order_phone || ""
        store.whatsapp = setting?.whatsapp_number || ""
      } catch {
        /* ignore */
      }
      try {
        const { stores } = await adminFetch<{ stores: { name: string }[] }>("/stores?fields=id,name")
        store.name = stores?.[0]?.name || "Store"
      } catch {
        store.name = "Store"
      }

      const w = window.open("", "_blank", "width=820,height=920")
      if (!w) {
        toast.error("Allow pop-ups to print the invoice")
        return
      }
      w.document.write(buildHtml(full, store, mode))
      w.document.close()
      w.focus()
      setTimeout(() => w.print(), 350)
    } catch {
      toast.error("Failed to build invoice")
    } finally {
      setBusy(false)
    }
  }

  return (
    <Container className="px-6 py-4 flex flex-col gap-y-3">
      <Heading level="h2">Print</Heading>
      <Text size="small" className="text-ui-fg-subtle">
        Invoice (with prices &amp; COD) or a packing slip to attach to the parcel.
      </Text>
      <div className="flex gap-2">
        <Button size="small" disabled={busy} onClick={() => print("invoice")}>
          Print invoice
        </Button>
        <Button size="small" variant="secondary" disabled={busy} onClick={() => print("packing")}>
          Packing slip
        </Button>
      </div>
    </Container>
  )
}

export const config = defineWidgetConfig({
  zone: "order.details.side.after",
})

export default OrderInvoiceWidget
