import { AbstractNotificationProviderService } from "@medusajs/framework/utils"
import type { ProviderSendNotificationDTO, ProviderSendNotificationResultsDTO } from "@medusajs/types"
import { resolveSmsCreds } from "../../../lib/notification-creds"
import type { SmsCreds } from "../../../lib/notification-creds"
import { GenericHttpSmsAdapter } from "../adapters/generic-http"
import type { SmsAdapter } from "../adapters/interface"
import { TwilioSmsAdapter } from "../adapters/twilio"
import {
  fallbackSms,
  orderCanceledSms,
  orderPlacedSms,
  orderShippedSms,
} from "../templates"

type InjectedDeps = {
  logger: {
    info: (msg: string) => void
    error: (msg: string) => void
    warn: (msg: string) => void
  }
}

function normalizePhone(input: string): string | null {
  if (!input) return null
  const stripped = input.replace(/[\s\-().]/g, "")
  return /^\+\d{7,15}$/.test(stripped) ? stripped : null
}

function buildAdapter(creds: SmsCreds, logger: InjectedDeps["logger"]): SmsAdapter | null {
  if (creds.provider === "twilio") {
    if (!creds.twilioAuthToken) {
      logger.warn("[sms] Twilio auth token not configured — skipping SMS")
      return null
    }
    return new TwilioSmsAdapter(creds.apiKey, creds.twilioAuthToken, creds.senderId)
  }
  if (creds.provider === "generic_http") {
    if (!creds.apiUrl) {
      logger.warn("[sms] SMS_API_URL not configured for generic_http — skipping SMS")
      return null
    }
    return new GenericHttpSmsAdapter(creds.apiUrl, creds.apiKey, creds.senderId)
  }
  logger.warn(`[sms] Unknown provider "${creds.provider}" — skipping SMS`)
  return null
}

export class SmsNotificationService extends AbstractNotificationProviderService {
  static identifier = "sms"

  private logger: InjectedDeps["logger"]

  constructor({ logger }: InjectedDeps) {
    super()
    this.logger = logger
    // Credentials and adapter resolved lazily at send time via resolveSmsCreds()
  }

  async send(
    notification: ProviderSendNotificationDTO
  ): Promise<ProviderSendNotificationResultsDTO> {
    const creds = await resolveSmsCreds((this as any).container_)
    if (!creds) {
      this.logger.info("[sms] No SMS credentials configured — skipping")
      return {}
    }

    const adapter = buildAdapter(creds, this.logger)
    if (!adapter) return {}

    const rawPhone = notification.to
    const to = normalizePhone(rawPhone)
    if (!to) {
      this.logger.warn(
        `[sms] Recipient "${rawPhone}" is not a valid E.164 phone number — skipping`
      )
      return {}
    }

    const template = notification.template ?? "fallback"
    const data = (notification.data ?? {}) as any

    let body: string
    switch (template) {
      case "order-placed":
        body = orderPlacedSms(data.order)
        break
      case "order-shipped":
        body = orderShippedSms(data.order)
        break
      case "order-canceled":
        body = orderCanceledSms(data.order)
        break
      default:
        body = fallbackSms(data)
    }

    try {
      await adapter.send({ to, body })
      this.logger.info(`[sms] "${template}" sent to ${to}`)
      return {}
    } catch (err: any) {
      this.logger.error(`[sms] Failed to send "${template}" to ${to}: ${err.message}`)
      throw err
    }
  }
}

export default SmsNotificationService
