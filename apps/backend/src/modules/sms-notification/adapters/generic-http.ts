import type { SmsAdapter } from "./interface"

/**
 * Generic HTTP adapter for SMS gateways that accept a simple JSON POST.
 * Payload sent: { to, message, sender_id, api_key }
 * The "Authorization: Bearer" header is also set if api_key is present.
 * Works with most local/regional gateways (e.g. SSL Wireless, BulkSMS, etc.).
 */
export class GenericHttpSmsAdapter implements SmsAdapter {
  constructor(
    private apiUrl: string,
    private apiKey: string,
    private senderId: string
  ) {}

  async send({ to, body }: { to: string; body: string }): Promise<void> {
    const response = await fetch(this.apiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(this.apiKey ? { Authorization: `Bearer ${this.apiKey}` } : {}),
      },
      body: JSON.stringify({
        to,
        message: body,
        sender_id: this.senderId,
        api_key: this.apiKey,
      }),
    })

    if (!response.ok) {
      const text = await response.text()
      throw new Error(`SMS gateway error ${response.status}: ${text.slice(0, 300)}`)
    }
  }
}
