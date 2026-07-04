import { SubscriberArgs, type SubscriberConfig } from "@medusajs/framework"

export default async function passwordResetHandler({
  event: { data },
  container,
}: SubscriberArgs<{ entity_id: string; token: string; actor_type: string }>) {
  const logger = container.resolve("logger")
  try {
    const settingsSvc = container.resolve("storeSettings") as any
    const [settings] = await settingsSvc.listStoreSettings({}, { take: 1 })
    if (settings?.email_enabled === false) return
    if (settings?.email_password_reset === false) return

    const email = data.entity_id
    const storeUrl = process.env.STORE_URL ?? ""
    const reset_url = `${storeUrl}/account/reset-password?token=${encodeURIComponent(data.token)}`

    const notificationSvc = container.resolve("notification") as any
    await notificationSvc.createNotifications({
      to: email,
      template: "password-reset",
      channel: "email",
      data: { email, reset_url },
    })
    logger.info(`[email] password-reset sent to ${email}`)
  } catch (err: any) {
    logger.error(`[email] password-reset failed: ${err.message}`)
  }
}

export const config: SubscriberConfig = { event: "auth.password_reset" }
