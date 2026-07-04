import { SubscriberArgs, type SubscriberConfig } from "@medusajs/framework"

export default async function orderShippedHandler({
  event: { data },
  container,
}: SubscriberArgs<{ id: string }>) {
  const logger = container.resolve("logger")
  try {
    const settingsSvc = container.resolve("storeSettings") as any
    const [settings] = await settingsSvc.listStoreSettings({}, { take: 1 })

    const emailEnabled = settings?.email_enabled !== false && settings?.email_order_shipped !== false
    const smsEnabled = settings?.sms_order_shipped === true

    if (!emailEnabled && !smsEnabled) return

    const query = container.resolve("query") as any
    const { data: orders } = await query.graph({
      entity: "order",
      fields: [
        "id", "display_id", "email", "currency_code",
        "customer.first_name", "customer.last_name", "customer.phone",
        "shipping_address.*",
        "fulfillments.*", "fulfillments.tracking_links.*",
      ],
      filters: { id: data.id },
    })
    const order = orders?.[0]
    if (!order) return

    // Pull tracking data from the first courier-booked fulfillment (if any)
    const courierFulfillment = (order.fulfillments ?? []).find(
      (f: any) => f.data?.courier_id && f.data?.tracking_id
    )
    const trackingData = courierFulfillment
      ? {
          courier_id: courierFulfillment.data.courier_id,
          tracking_id: courierFulfillment.data.tracking_id,
          consignment_id: courierFulfillment.data.consignment_id,
        }
      : null

    const notificationSvc = container.resolve("notification") as any

    if (emailEnabled) {
      await notificationSvc.createNotifications({
        to: order.email,
        template: "order-shipped",
        channel: "email",
        data: { order, tracking: trackingData },
      })
      logger.info(`[email] order-shipped sent to ${order.email}`)
    }

    if (smsEnabled) {
      const phone = order.shipping_address?.phone || order.customer?.phone
      if (phone) {
        await notificationSvc.createNotifications({
          to: phone,
          template: "order-shipped",
          channel: "sms",
          data: { order, tracking: trackingData },
        })
        logger.info(`[sms] order-shipped sent to ${phone}`)
      }
    }
  } catch (err: any) {
    logger.error(`[order-shipped] failed: ${err.message}`)
  }
}

export const config: SubscriberConfig = { event: "order.shipment_created" }
