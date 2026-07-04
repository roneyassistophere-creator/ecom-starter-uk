import type { SmsAdapter } from "./interface"

export class TwilioSmsAdapter implements SmsAdapter {
  constructor(
    private accountSid: string,
    private authToken: string,
    private fromNumber: string
  ) {}

  async send({ to, body }: { to: string; body: string }): Promise<void> {
    const params = new URLSearchParams({ To: to, From: this.fromNumber, Body: body })
    const auth = Buffer.from(`${this.accountSid}:${this.authToken}`).toString("base64")

    const response = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${this.accountSid}/Messages.json`,
      {
        method: "POST",
        headers: {
          Authorization: `Basic ${auth}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: params,
      }
    )

    const result = (await response.json()) as any
    if (!response.ok) {
      throw new Error(result.message ?? `Twilio error ${response.status}: ${result.code ?? ""}`)
    }
  }
}
