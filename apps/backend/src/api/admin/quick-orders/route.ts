import { AuthenticatedMedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { Modules } from "@medusajs/framework/utils"
import { createOrderWorkflow } from "@medusajs/core-flows"

// POST /admin/quick-orders — create an order on behalf of a customer (social/phone/in-store).
// Works with phone + address only: a synthetic, non-deliverable email is generated when none
// is given, so Medusa's email requirement is satisfied invisibly. Uses the same workflow the
// native Draft Order route uses, so inventory/totals are handled natively.

type LineInput = {
  variant_id: string
  product_id?: string
  title: string
  quantity: number | string
  unit_price: number | string
}

type Body = {
  customer: {
    name: string
    phone: string
    email?: string
    address_1: string
    city?: string
    postal_code?: string
    country_code?: string
  }
  items: LineInput[]
  region_id: string
  sales_channel_id: string
  shipping?: { name?: string; amount: number | string; shipping_option_id?: string }
  currency_code?: string
  note?: string
}

function syntheticEmail(phone: string): string {
  const digits = (phone || "").replace(/\D/g, "")
  return `p${digits || Date.now()}@manual.local`
}

export async function POST(req: AuthenticatedMedusaRequest, res: MedusaResponse) {
  const b = (req.body ?? {}) as Body
  const c = b.customer

  if (!c?.phone?.trim() || !c?.name?.trim() || !c?.address_1?.trim()) {
    return res.status(400).json({ error: "Customer name, phone and address are required." })
  }
  if (!b.items?.length) {
    return res.status(400).json({ error: "Add at least one item." })
  }
  if (!b.region_id || !b.sales_channel_id) {
    return res.status(400).json({ error: "region_id and sales_channel_id are required." })
  }

  const [first_name, ...rest] = c.name.trim().split(/\s+/)
  const last_name = rest.join(" ") || undefined
  const email = (c.email && c.email.trim()) || syntheticEmail(c.phone)

  // Resolve or create the customer (by phone, then email)
  const customerSvc: any = req.scope.resolve(Modules.CUSTOMER)
  let customerId: string | undefined
  const byPhone = await customerSvc.listCustomers({ phone: c.phone.trim() }, { take: 1 })
  if (byPhone?.length) {
    customerId = byPhone[0].id
  } else {
    const byEmail = await customerSvc.listCustomers({ email }, { take: 1 })
    if (byEmail?.length) {
      customerId = byEmail[0].id
    } else {
      const [created] = await customerSvc.createCustomers([
        { email, phone: c.phone.trim(), first_name, last_name },
      ])
      customerId = created.id
    }
  }

  const address = {
    first_name,
    last_name,
    phone: c.phone.trim(),
    address_1: c.address_1.trim(),
    city: c.city?.trim() || undefined,
    postal_code: c.postal_code?.trim() || undefined,
    country_code: (c.country_code || "bd").toLowerCase(),
  }

  const items = b.items.map((it) => ({
    title: it.title,
    variant_id: it.variant_id,
    product_id: it.product_id,
    quantity: Math.max(1, Number(it.quantity) || 1),
    unit_price: Math.max(0, Number(it.unit_price) || 0),
  }))

  const shipping_methods = b.shipping
    ? [
        {
          name: b.shipping.name || "Delivery",
          amount: Math.max(0, Number(b.shipping.amount) || 0),
          shipping_option_id: b.shipping.shipping_option_id,
        },
      ]
    : []

  const { result: order } = await createOrderWorkflow(req.scope).run({
    input: {
      region_id: b.region_id,
      sales_channel_id: b.sales_channel_id,
      customer_id: customerId,
      email,
      currency_code: (b.currency_code || "bdt").toLowerCase(),
      status: "pending",
      no_notification: true,
      shipping_address: address,
      billing_address: address,
      items,
      shipping_methods,
      metadata: b.note ? { manual_note: b.note } : undefined,
    } as any,
  })

  res.json({ order_id: (order as any)?.id, order })
}
