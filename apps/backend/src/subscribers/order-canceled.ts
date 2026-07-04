import { SubscriberArgs, type SubscriberConfig } from "@medusajs/framework"

export default async function orderCanceledHandler({
  event: { data },
  container,
}: SubscriberArgs<{ id: string }>) {
  const logger = container.resolve("logger")
  try {
    const settingsSvc = container.resolve("storeSettings") as any
    const [settings] = await settingsSvc.listStoreSettings({}, { take: 1 })

    const emailEnabled = settings?.email_enabled !== false && settings?.email_order_canceled !== false
    const smsEnabled = settings?.sms_order_canceled === true

    if (!emailEnabled && !smsEnabled) return

    const query = container.resolve("query") as any
    const { data: orders } = await query.graph({
      entity: "order",
      fields: [
        "id", "display_id", "email", "total", "currency_code",
        "customer.first_name", "customer.last_name", "customer.phone",
        "shipping_address.*",
      ],
      filters: { id: data.id },
    })
    const order = orders?.[0]
    if (!order) return

    const notificationSvc = container.resolve("notification") as any

    if (emailEnabled) {
      await notificationSvc.createNotifications({
        to: order.email,
        template: "order-canceled",
        channel: "email",
        data: { order },
      })
      logger.info(`[email] order-canceled sent to ${order.email}`)
    }

    if (smsEnabled) {
      const phone = order.shipping_address?.phone || order.customer?.phone
      if (phone) {
        await notificationSvc.createNotifications({
          to: phone,
          template: "order-canceled",
          channel: "sms",
          data: { order },
        })
        logger.info(`[sms] order-canceled sent to ${phone}`)
      }
    }
  } catch (err: any) {
    logger.error(`[order-canceled] failed: ${err.message}`)
  }
}

export const config: SubscriberConfig = { event: "order.canceled" }
