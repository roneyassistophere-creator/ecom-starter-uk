import brand from "../../../brand.config"

function formatAmount(amount: number, currency: string): string {
  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency.toUpperCase(),
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(amount)
  } catch {
    return `${amount} ${currency.toUpperCase()}`
  }
}

// Sample: "My Store: Order #1234 confirmed! Total $49.99. Thank you!"  (~55 chars)
export function orderPlacedSms(order: {
  display_id: number | string
  total: number
  currency_code: string
}): string {
  const total = formatAmount(order.total, order.currency_code)
  return `${brand.storeName}: Order #${order.display_id} confirmed! Total ${total}. Thank you!`
}

// Sample: "My Store: Your order #1234 has shipped! Tracking: 1Z999AA10123."  (~65 chars)
export function orderShippedSms(order: {
  display_id: number | string
  fulfillments?: Array<{ tracking_numbers?: string[] }> | null
}): string {
  const trackingNumber = order.fulfillments?.flatMap((f) => f.tracking_numbers ?? [])[0]
  const trackingPart = trackingNumber ? ` Tracking: ${trackingNumber}.` : ""
  return `${brand.storeName}: Your order #${order.display_id} has shipped!${trackingPart}`
}

// Sample: "My Store: Order #1234 has been canceled. Questions? Contact us."  (~64 chars)
export function orderCanceledSms(order: { display_id: number | string }): string {
  return `${brand.storeName}: Order #${order.display_id} has been canceled. Questions? Contact us.`
}

// Generic fallback message
export function fallbackSms(data: { message?: string }): string {
  return data.message ?? `${brand.storeName}: You have a new notification. Log in to your account for details.`
}
