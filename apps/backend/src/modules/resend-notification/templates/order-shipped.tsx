import { Button, Heading, Section, Text, Hr } from "@react-email/components"
import * as React from "react"
import brand from "../../../brand.config"
import { EmailLayout } from "./shared/layout"

export type OrderShippedProps = {
  order: {
    display_id: number | string
    email: string
    currency_code: string
    customer?: { first_name?: string; last_name?: string } | null
    shipping_address?: {
      first_name?: string
      last_name?: string
      address_1?: string
      city?: string
      country_code?: string
      postal_code?: string
    } | null
    fulfillments?: Array<{
      tracking_numbers?: string[]
      tracking_links?: Array<{ url?: string; tracking_number?: string }>
    }> | null
  }
}

const storeUrl = process.env.STORE_URL ?? ""

export function OrderShippedEmail({ order }: OrderShippedProps) {
  const customerName =
    order.customer?.first_name
      ? `${order.customer.first_name} ${order.customer.last_name ?? ""}`.trim()
      : order.email

  const trackingNumbers =
    order.fulfillments?.flatMap((f) => f.tracking_numbers ?? []) ?? []
  const trackingLinks =
    order.fulfillments?.flatMap((f) => f.tracking_links ?? []) ?? []
  const firstTrackingLink = trackingLinks[0]

  return (
    <EmailLayout preview={`Your ${brand.storeName} order #${order.display_id} has shipped!`}>
      <Heading style={h1}>Your order is on its way!</Heading>
      <Text style={para}>Hi {customerName},</Text>
      <Text style={para}>
        Great news — your order <strong>#{order.display_id}</strong> has been shipped and is heading your way.
      </Text>

      {trackingNumbers.length > 0 && (
        <Section style={callout}>
          <Text style={calloutLabel}>Tracking number{trackingNumbers.length > 1 ? "s" : ""}</Text>
          {trackingNumbers.map((num, i) => (
            <Text key={i} style={calloutValue}>{num}</Text>
          ))}
        </Section>
      )}

      {firstTrackingLink?.url && (
        <>
          <Hr style={divider} />
          <Section style={{ textAlign: "center" }}>
            <Button href={firstTrackingLink.url} style={{ ...btn, backgroundColor: brand.colors.primary }}>
              Track your shipment
            </Button>
          </Section>
        </>
      )}

      {order.shipping_address?.address_1 && (
        <>
          <Hr style={divider} />
          <Text style={sectionLabel}>Delivering to</Text>
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
            <Button href={`${storeUrl}/account/orders`} style={{ ...btnSecondary }}>
              View order details
            </Button>
          </Section>
        </>
      )}
    </EmailLayout>
  )
}

export default OrderShippedEmail

const h1: React.CSSProperties = { color: brand.colors.text, fontSize: "24px", fontWeight: "700", margin: "0 0 16px" }
const para: React.CSSProperties = { color: brand.colors.text, fontSize: "15px", lineHeight: "1.6", margin: "0 0 12px" }
const callout: React.CSSProperties = { backgroundColor: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: "6px", padding: "16px 20px", margin: "16px 0" }
const calloutLabel: React.CSSProperties = { color: "#16a34a", fontSize: "12px", fontWeight: "600", letterSpacing: "0.05em", margin: 0, textTransform: "uppercase" }
const calloutValue: React.CSSProperties = { color: "#15803d", fontSize: "18px", fontWeight: "700", margin: "4px 0 0", fontFamily: "monospace" }
const sectionLabel: React.CSSProperties = { color: "#6b7280", fontSize: "12px", fontWeight: "600", letterSpacing: "0.05em", margin: "0 0 8px", textTransform: "uppercase" }
const divider: React.CSSProperties = { borderColor: "#e5e7eb", margin: "16px 0" }
const addressText: React.CSSProperties = { color: brand.colors.text, fontSize: "14px", lineHeight: "1.6", margin: 0 }
const btn: React.CSSProperties = { borderRadius: "6px", color: "#ffffff", display: "inline-block", fontSize: "14px", fontWeight: "600", padding: "12px 24px", textDecoration: "none" }
const btnSecondary: React.CSSProperties = { ...btn, backgroundColor: brand.colors.secondary }
