import { Button, Heading, Row, Column, Section, Text, Hr } from "@react-email/components"
import * as React from "react"
import brand from "../../../brand.config"
import { EmailLayout } from "./shared/layout"

export type OrderPlacedProps = {
  order: {
    display_id: number | string
    email: string
    total: number
    currency_code: string
    customer?: { first_name?: string; last_name?: string } | null
    items?: Array<{
      title: string
      quantity: number
      unit_price: number
      thumbnail?: string | null
      product?: { title?: string } | null
    }>
    shipping_address?: {
      first_name?: string
      last_name?: string
      address_1?: string
      city?: string
      country_code?: string
      postal_code?: string
    } | null
  }
}

const storeUrl = process.env.STORE_URL ?? ""

export function OrderPlacedEmail({ order }: OrderPlacedProps) {
  const customerName =
    order.customer?.first_name
      ? `${order.customer.first_name} ${order.customer.last_name ?? ""}`.trim()
      : order.email

  const formatPrice = (amount: number, currency: string) =>
    new Intl.NumberFormat("en-US", { style: "currency", currency: currency.toUpperCase() }).format(amount)

  return (
    <EmailLayout preview={`Order #${order.display_id} confirmed — thank you for shopping with ${brand.storeName}!`}>
      <Heading style={h1}>Order Confirmed</Heading>
      <Text style={para}>Hi {customerName},</Text>
      <Text style={para}>
        Thank you for your order! We've received it and will begin processing shortly.
      </Text>

      {/* Order number callout */}
      <Section style={callout}>
        <Text style={calloutLabel}>Order number</Text>
        <Text style={calloutValue}>#{order.display_id}</Text>
      </Section>

      {/* Items */}
      {(order.items ?? []).length > 0 && (
        <>
          <Text style={sectionLabel}>Items ordered</Text>
          {order.items!.map((item, i) => (
            <Row key={i} style={itemRow}>
              <Column style={itemMeta}>
                <Text style={itemTitle}>
                  {item.product?.title ?? item.title}
                  {item.title !== item.product?.title ? ` — ${item.title}` : ""}
                </Text>
                <Text style={itemQty}>Qty: {item.quantity}</Text>
              </Column>
              <Column style={itemPrice}>
                <Text style={itemPriceText}>
                  {formatPrice(item.unit_price * item.quantity, order.currency_code)}
                </Text>
              </Column>
            </Row>
          ))}
          <Hr style={divider} />
        </>
      )}

      {/* Total */}
      <Row>
        <Column>
          <Text style={totalLabel}>Order total</Text>
        </Column>
        <Column style={{ textAlign: "right" }}>
          <Text style={totalValue}>{formatPrice(order.total, order.currency_code)}</Text>
        </Column>
      </Row>

      {/* Shipping address */}
      {order.shipping_address?.address_1 && (
        <>
          <Hr style={divider} />
          <Text style={sectionLabel}>Shipping to</Text>
          <Text style={addressText}>
            {[order.shipping_address.first_name, order.shipping_address.last_name].filter(Boolean).join(" ")}
            <br />
            {order.shipping_address.address_1}
            <br />
            {[order.shipping_address.city, order.shipping_address.postal_code, order.shipping_address.country_code?.toUpperCase()].filter(Boolean).join(", ")}
          </Text>
        </>
      )}

      {storeUrl && (
        <>
          <Hr style={divider} />
          <Section style={{ textAlign: "center" }}>
            <Button href={`${storeUrl}/account/orders`} style={{ ...btn, backgroundColor: brand.colors.primary }}>
              View your order
            </Button>
          </Section>
        </>
      )}
    </EmailLayout>
  )
}

export default OrderPlacedEmail

const h1: React.CSSProperties = { color: brand.colors.text, fontSize: "24px", fontWeight: "700", margin: "0 0 16px" }
const para: React.CSSProperties = { color: brand.colors.text, fontSize: "15px", lineHeight: "1.6", margin: "0 0 12px" }
const callout: React.CSSProperties = { backgroundColor: "#f9fafb", borderRadius: "6px", padding: "16px 20px", margin: "16px 0 24px" }
const calloutLabel: React.CSSProperties = { color: "#6b7280", fontSize: "12px", fontWeight: "600", letterSpacing: "0.05em", margin: 0, textTransform: "uppercase" }
const calloutValue: React.CSSProperties = { color: brand.colors.text, fontSize: "22px", fontWeight: "700", margin: "4px 0 0" }
const sectionLabel: React.CSSProperties = { color: "#6b7280", fontSize: "12px", fontWeight: "600", letterSpacing: "0.05em", margin: "0 0 8px", textTransform: "uppercase" }
const itemRow: React.CSSProperties = { borderBottom: "1px solid #f3f4f6", padding: "10px 0" }
const itemMeta: React.CSSProperties = { verticalAlign: "top" }
const itemTitle: React.CSSProperties = { color: brand.colors.text, fontSize: "14px", fontWeight: "600", margin: 0 }
const itemQty: React.CSSProperties = { color: "#6b7280", fontSize: "13px", margin: "2px 0 0" }
const itemPrice: React.CSSProperties = { textAlign: "right", verticalAlign: "top", width: "100px" }
const itemPriceText: React.CSSProperties = { color: brand.colors.text, fontSize: "14px", margin: 0 }
const divider: React.CSSProperties = { borderColor: "#e5e7eb", margin: "16px 0" }
const totalLabel: React.CSSProperties = { color: brand.colors.text, fontSize: "15px", fontWeight: "700", margin: 0 }
const totalValue: React.CSSProperties = { color: brand.colors.text, fontSize: "15px", fontWeight: "700", margin: 0, textAlign: "right" }
const addressText: React.CSSProperties = { color: brand.colors.text, fontSize: "14px", lineHeight: "1.6", margin: 0 }
const btn: React.CSSProperties = { borderRadius: "6px", color: "#ffffff", display: "inline-block", fontSize: "14px", fontWeight: "600", padding: "12px 24px", textDecoration: "none" }
