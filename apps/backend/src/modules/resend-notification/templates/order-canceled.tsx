import { Button, Heading, Section, Text, Hr } from "@react-email/components"
import * as React from "react"
import brand from "../../../brand.config"
import { EmailLayout } from "./shared/layout"

export type OrderCanceledProps = {
  order: {
    display_id: number | string
    email: string
    total: number
    currency_code: string
    customer?: { first_name?: string; last_name?: string } | null
  }
}

const storeUrl = process.env.STORE_URL ?? ""

export function OrderCanceledEmail({ order }: OrderCanceledProps) {
  const customerName =
    order.customer?.first_name
      ? `${order.customer.first_name} ${order.customer.last_name ?? ""}`.trim()
      : order.email

  const formatPrice = (amount: number, currency: string) =>
    new Intl.NumberFormat("en-US", { style: "currency", currency: currency.toUpperCase() }).format(amount)

  return (
    <EmailLayout preview={`Your ${brand.storeName} order #${order.display_id} has been canceled`}>
      <Heading style={h1}>Order Canceled</Heading>
      <Text style={para}>Hi {customerName},</Text>
      <Text style={para}>
        Your order <strong>#{order.display_id}</strong> has been canceled. If a payment was charged, a refund will be issued within 5–10 business days depending on your payment provider.
      </Text>

      <Section style={callout}>
        <Text style={calloutLabel}>Order total</Text>
        <Text style={calloutValue}>{formatPrice(order.total, order.currency_code)}</Text>
      </Section>

      <Text style={para}>
        If you have any questions, please contact us at{" "}
        <a href={`mailto:${brand.contact.email}`} style={link}>
          {brand.contact.email}
        </a>.
      </Text>

      {storeUrl && (
        <>
          <Hr style={divider} />
          <Section style={{ textAlign: "center" }}>
            <Button href={storeUrl} style={{ ...btn, backgroundColor: brand.colors.primary }}>
              Continue shopping
            </Button>
          </Section>
        </>
      )}
    </EmailLayout>
  )
}

export default OrderCanceledEmail

const h1: React.CSSProperties = { color: brand.colors.text, fontSize: "24px", fontWeight: "700", margin: "0 0 16px" }
const para: React.CSSProperties = { color: brand.colors.text, fontSize: "15px", lineHeight: "1.6", margin: "0 0 12px" }
const callout: React.CSSProperties = { backgroundColor: "#fef2f2", border: "1px solid #fecaca", borderRadius: "6px", padding: "16px 20px", margin: "16px 0" }
const calloutLabel: React.CSSProperties = { color: "#dc2626", fontSize: "12px", fontWeight: "600", letterSpacing: "0.05em", margin: 0, textTransform: "uppercase" }
const calloutValue: React.CSSProperties = { color: "#b91c1c", fontSize: "22px", fontWeight: "700", margin: "4px 0 0" }
const divider: React.CSSProperties = { borderColor: "#e5e7eb", margin: "16px 0" }
const link: React.CSSProperties = { color: brand.colors.primary }
const btn: React.CSSProperties = { borderRadius: "6px", color: "#ffffff", display: "inline-block", fontSize: "14px", fontWeight: "600", padding: "12px 24px", textDecoration: "none" }
