import { AbstractNotificationProviderService } from "@medusajs/framework/utils"
import type { ProviderSendNotificationDTO, ProviderSendNotificationResultsDTO } from "@medusajs/types"
import { render } from "@react-email/render"
import * as React from "react"
import { Resend } from "resend"
import { resolveEmailCreds } from "../../../lib/notification-creds"
import { FallbackEmail } from "../templates/fallback"
import { OrderCanceledEmail } from "../templates/order-canceled"
import { OrderPlacedEmail } from "../templates/order-placed"
import { OrderShippedEmail } from "../templates/order-shipped"
import { PasswordResetEmail } from "../templates/password-reset"

type InjectedDeps = {
  logger: { info: (msg: string) => void; error: (msg: string) => void; warn: (msg: string) => void }
}

const TEMPLATE_MAP: Record<string, (data: any) => React.ReactElement> = {
  "order-placed": (data) => React.createElement(OrderPlacedEmail, data),
  "order-shipped": (data) => React.createElement(OrderShippedEmail, data),
  "order-canceled": (data) => React.createElement(OrderCanceledEmail, data),
  "password-reset": (data) => React.createElement(PasswordResetEmail, data),
}

const SUBJECT_MAP: Record<string, (data: any) => string> = {
  "order-placed": (d) => `Order #${d?.order?.display_id ?? ""} confirmed`,
  "order-shipped": (d) => `Your order #${d?.order?.display_id ?? ""} has shipped`,
  "order-canceled": (d) => `Order #${d?.order?.display_id ?? ""} has been canceled`,
  "password-reset": () => "Reset your password",
}

export class ResendNotificationService extends AbstractNotificationProviderService {
  static identifier = "resend"

  private logger: InjectedDeps["logger"]

  constructor({ logger }: InjectedDeps) {
    super()
    this.logger = logger
    // Credentials are resolved lazily at send time via resolveEmailCreds()
  }

  async send(notification: ProviderSendNotificationDTO): Promise<ProviderSendNotificationResultsDTO> {
    const creds = await resolveEmailCreds((this as any).container_)
    if (!creds) {
      this.logger.info("[resend] No email credentials configured — skipping")
      return {}
    }

    const client = new Resend(creds.apiKey)
    const fromAddress = `${creds.fromName} <${creds.fromEmail}>`

    const template = notification.template ?? "fallback"
    const data = (notification.data ?? {}) as any
    const to = notification.to

    const buildElement = TEMPLATE_MAP[template] ?? ((d: any) => React.createElement(FallbackEmail, d))
    const buildSubject = SUBJECT_MAP[template] ?? (() => "Notification")

    const element = buildElement(data)
    const html = await render(element)
    const subject = buildSubject(data)

    const { data: result, error } = await client.emails.send({
      from: fromAddress,
      to,
      subject,
      html,
    })

    if (error) {
      this.logger.error(`[resend] Failed to send "${template}" to ${to}: ${error.message}`)
      throw new Error(error.message)
    }

    this.logger.info(`[resend] Sent "${template}" to ${to} (id: ${result?.id})`)
    return { id: result?.id }
  }
}

export default ResendNotificationService
