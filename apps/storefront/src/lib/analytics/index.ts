// Typed analytics helpers for GTM, Meta Pixel, TikTok Pixel, Google Ads, and GA4.
// Meta Pixel and GA4 are runtime-loaded from admin settings — no NEXT_PUBLIC_* env var required.
// Guards check window.fbq / window.gtag existence rather than env vars.

export type AnalyticsProduct = {
  id: string
  name: string
  price?: number
  currency?: string
}

export type PurchaseData = {
  orderId: string
  total: number
  currency: string
  products: AnalyticsProduct[]
}

declare global {
  interface Window {
    dataLayer: unknown[]
    fbq: (...args: unknown[]) => void
    ttq: { track: (event: string, data?: unknown) => void }
    gtag: (...args: unknown[]) => void
  }
}

function gtmPush(event: string, data?: Record<string, unknown>) {
  if (typeof window === "undefined" || !process.env.NEXT_PUBLIC_GTM_ID) return
  window.dataLayer = window.dataLayer || []
  window.dataLayer.push({ event, ...data })
}

function metaTrack(event: string, data?: Record<string, unknown>, options?: Record<string, unknown>) {
  if (typeof window === "undefined" || !window.fbq) return
  window.fbq("track", event, data, options)
}

function tiktokTrack(event: string, data?: Record<string, unknown>) {
  if (typeof window === "undefined" || !process.env.NEXT_PUBLIC_TIKTOK_PIXEL_ID) return
  window.ttq?.track(event, data)
}

function gadsEvent(event: string, data?: Record<string, unknown>) {
  if (typeof window === "undefined" || !window.gtag) return
  window.gtag("event", event, data)
}

function ga4Event(event: string, data?: Record<string, unknown>) {
  if (typeof window === "undefined" || !window.gtag) return
  window.gtag("event", event, data)
}

export function trackPageView() {
  gtmPush("page_view")
  metaTrack("PageView")
  tiktokTrack("ViewContent")
}

export function trackViewContent(product: AnalyticsProduct) {
  gtmPush("view_item", {
    item_id: product.id,
    item_name: product.name,
    value: product.price,
    currency: product.currency,
  })
  metaTrack("ViewContent", {
    content_ids: [product.id],
    content_name: product.name,
    value: product.price,
    currency: product.currency,
  })
  tiktokTrack("ViewContent", {
    content_id: product.id,
    content_name: product.name,
    value: product.price,
    currency: product.currency,
  })
  gadsEvent("view_item", {
    items: [{ id: product.id, google_business_vertical: "retail" }],
  })
}

export function trackAddToCart(product: AnalyticsProduct) {
  gtmPush("add_to_cart", {
    item_id: product.id,
    item_name: product.name,
    value: product.price,
    currency: product.currency,
  })
  metaTrack("AddToCart", {
    content_ids: [product.id],
    content_name: product.name,
    value: product.price,
    currency: product.currency,
  })
  tiktokTrack("AddToCart", {
    content_id: product.id,
    value: product.price,
    currency: product.currency,
  })
  gadsEvent("add_to_cart", {
    value: product.price,
    currency: product.currency,
    items: [{ id: product.id }],
  })
}

export function trackInitiateCheckout(data: {
  value: number
  currency: string
  numItems: number
}) {
  gtmPush("begin_checkout", { value: data.value, currency: data.currency })
  metaTrack("InitiateCheckout", {
    value: data.value,
    currency: data.currency,
    num_items: data.numItems,
  })
  tiktokTrack("InitiateCheckout", { value: data.value, currency: data.currency })
  gadsEvent("begin_checkout", { value: data.value, currency: data.currency })
}

export function trackPurchase(data: PurchaseData) {
  gtmPush("purchase", {
    transaction_id: data.orderId,
    value: data.total,
    currency: data.currency,
  })
  metaTrack("Purchase", {
    value: data.total,
    currency: data.currency,
    content_ids: data.products.map((p) => p.id),
  })
  tiktokTrack("CompletePayment", { value: data.total, currency: data.currency })
  gadsEvent("purchase", {
    transaction_id: data.orderId,
    value: data.total,
    currency: data.currency,
  })
  ga4Event("purchase", {
    transaction_id: data.orderId,
    value: data.total,
    currency: data.currency,
    items: data.products.map((p) => ({
      item_id: p.id,
      item_name: p.name,
      price: p.price,
      currency: p.currency || data.currency,
    })),
  })
}

// Purchase with event_id for Meta CAPI deduplication.
// event_id must match the event_id used in the server-side CAPI Purchase call.
export function trackPurchaseWithEventId(data: PurchaseData & { eventId: string }) {
  gtmPush("purchase", {
    transaction_id: data.orderId,
    value: data.total,
    currency: data.currency,
  })
  metaTrack(
    "Purchase",
    {
      value: data.total,
      currency: data.currency,
      content_ids: data.products.map((p) => p.id),
    },
    { eventID: data.eventId }
  )
  tiktokTrack("CompletePayment", { value: data.total, currency: data.currency })
  gadsEvent("purchase", {
    transaction_id: data.orderId,
    value: data.total,
    currency: data.currency,
  })
  ga4Event("purchase", {
    transaction_id: data.orderId,
    value: data.total,
    currency: data.currency,
    items: data.products.map((p) => ({
      item_id: p.id,
      item_name: p.name,
      price: p.price,
      currency: p.currency || data.currency,
    })),
  })
}
