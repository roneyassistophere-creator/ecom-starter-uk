import { SubscriberArgs, type SubscriberConfig } from "@medusajs/framework"
import { TRACKING_SETTINGS_MODULE } from "../modules/trackingSettings"
import { capiEnvConfigured } from "../lib/integration-env"
import { sendCapiPurchase } from "../lib/capi"

export default async function orderPlacedHandler({
  event: { data },
  container,
}: SubscriberArgs<{ id: string }>) {
  const logger = container.resolve("logger")

  // Fetch order — needed by both notifications and CAPI
  const query = container.resolve("query") as any
  const { data: orders } = await query.graph({
    entity: "order",
    fields: [
      "id", "display_id", "email", "total", "currency_code",
      "customer.first_name", "customer.last_name", "customer.phone",
      "items.*", "items.variant_id", "items.product.title",
      "shipping_address.*",
      "metadata",
    ],
    filters: { id: data.id },
  })
  const order = orders?.[0]
  if (!order) return

  // ── Notifications ──────────────────────────────────────────────────────────
  try {
    const settingsSvc = container.resolve("storeSettings") as any
    const [settings] = await settingsSvc.listStoreSettings({}, { take: 1 })

    const emailEnabled = settings?.email_enabled !== false && settings?.email_order_placed !== false
    const smsEnabled = settings?.sms_order_placed === true

    const notificationSvc = container.resolve("notification") as any

    if (emailEnabled) {
      await notificationSvc.createNotifications({
        to: order.email,
        template: "order-placed",
        channel: "email",
        data: { order },
      })
      logger.info(`[email] order-placed sent to ${order.email}`)
    }

    if (smsEnabled) {
      const phone = order.shipping_address?.phone || order.customer?.phone
      if (phone) {
        await notificationSvc.createNotifications({
          to: phone,
          template: "order-placed",
          channel: "sms",
          data: { order },
        })
        logger.info(`[sms] order-placed sent to ${phone}`)
      }
    }
  } catch (err: any) {
    logger.error(`[order-placed:notifications] failed: ${err.message}`)
  }

  // ── Meta CAPI Purchase ─────────────────────────────────────────────────────
  try {
    const trackingSvc = container.resolve(TRACKING_SETTINGS_MODULE) as any
    const [rows] = await trackingSvc.listAndCountTrackingSettings({}, { take: 1 })
    const t = rows?.[0]

    if (t?.capi_enabled && capiEnvConfigured() && t?.purchase_event_enabled && t?.meta_pixel_id) {
      const token = process.env.META_CAPI_ACCESS_TOKEN as string

      // order.total is in smallest currency unit (cents for USD) — divide by 100
      const value = (order.total ?? 0) / 100
      const contentIds = (order.items ?? []).map((i: any) => i.variant_id ?? i.id)

      await sendCapiPurchase({
        pixelId: t.meta_pixel_id,
        token,
        eventId: order.id,       // same id used by browser Pixel → dedup
        orderId: order.id,
        value,
        currency: order.currency_code ?? "USD",
        contentIds,
        userEmail: order.email,
        userPhone: order.shipping_address?.phone,
        firstName: order.shipping_address?.first_name,
        lastName: order.shipping_address?.last_name,
        fbp: order.metadata?.meta_fbp as string | undefined,
        fbc: order.metadata?.meta_fbc as string | undefined,
        testEventCode: t.capi_test_event_code ?? undefined,
      })

      logger.info(`[capi] Purchase event sent for order ${order.id}`)
    }
  } catch (err: any) {
    logger.error(`[capi] Purchase event failed for order ${data.id}: ${err.message}`)
  }
}

export const config: SubscriberConfig = { event: "order.placed" }
