import { AbstractPaymentProvider } from "@medusajs/framework/utils"
import type {
  AuthorizePaymentInput,
  AuthorizePaymentOutput,
  CancelPaymentInput,
  CancelPaymentOutput,
  CapturePaymentInput,
  CapturePaymentOutput,
  DeletePaymentInput,
  DeletePaymentOutput,
  GetPaymentStatusInput,
  GetPaymentStatusOutput,
  InitiatePaymentInput,
  InitiatePaymentOutput,
  RefundPaymentInput,
  RefundPaymentOutput,
  RetrievePaymentInput,
  RetrievePaymentOutput,
  UpdatePaymentInput,
  UpdatePaymentOutput,
} from "@medusajs/types"
import type { ProviderWebhookPayload, WebhookActionResult } from "@medusajs/types"

type InjectedDeps = {
  logger: { info: (m: string) => void; warn: (m: string) => void; error: (m: string) => void }
}

type TokenCache = { token: string; expiresAt: number } | null

export class BkashPaymentService extends AbstractPaymentProvider<Record<string, never>> {
  static identifier = "bkash"

  private logger: InjectedDeps["logger"]
  private appKey: string | null
  private appSecret: string | null
  private username: string | null
  private password: string | null
  private sandbox: boolean
  private backendUrl: string

  // Token cached at module level for this service instance
  private tokenCache: TokenCache = null

  private get baseUrl(): string {
    return this.sandbox
      ? "https://tokenized.sandbox.bka.sh/v1.2.0-beta/tokenized"
      : "https://tokenized.pay.bka.sh/v1.2.0-beta/tokenized"
  }

  constructor({ logger }: InjectedDeps, config?: Record<string, never>) {
    super({ logger } as InjectedDeps, config ?? {})
    this.logger = logger
    this.appKey = process.env.BKASH_APP_KEY ?? null
    this.appSecret = process.env.BKASH_APP_SECRET ?? null
    this.username = process.env.BKASH_USERNAME ?? null
    this.password = process.env.BKASH_PASSWORD ?? null
    this.sandbox = process.env.BKASH_SANDBOX !== "false"
    this.backendUrl = (process.env.BACKEND_URL ?? "http://localhost:9000").replace(/\/$/, "")

    if (!this.appKey || !this.appSecret || !this.username || !this.password) {
      this.logger.warn("[bkash] One or more required env vars not set — bKash is disabled")
    } else {
      this.logger.info(`[bkash] Initialized in ${this.sandbox ? "sandbox" : "live"} mode`)
    }
  }

  private get disabled(): boolean {
    return !this.appKey || !this.appSecret || !this.username || !this.password
  }

  private async getToken(): Promise<string> {
    const now = Date.now()

    // Return cached token if still valid (refresh 5 min before expiry)
    if (this.tokenCache && this.tokenCache.expiresAt - now > 5 * 60 * 1000) {
      return this.tokenCache.token
    }

    const credentials = Buffer.from(`${this.appKey}:${this.appSecret}`).toString("base64")

    const res = await fetch(`${this.baseUrl}/checkout/token/grant`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Basic ${credentials}`,
        username: this.username!,
        password: this.password!,
      },
      body: JSON.stringify({ app_key: this.appKey, app_secret: this.appSecret }),
    })

    if (!res.ok) {
      throw new Error(`[bkash] Token grant HTTP ${res.status}`)
    }

    const json = (await res.json()) as { id_token?: string; expires_in?: number; statusCode?: string; statusMessage?: string }

    if (!json.id_token) {
      throw new Error(`[bkash] Token grant failed: ${json.statusMessage ?? json.statusCode}`)
    }

    const expiresIn = (json.expires_in ?? 3600) * 1000
    this.tokenCache = { token: json.id_token, expiresAt: now + expiresIn }
    this.logger.info("[bkash] Token granted/refreshed")
    return json.id_token
  }

  async initiatePayment(input: InitiatePaymentInput): Promise<InitiatePaymentOutput> {
    if (this.disabled) {
      return { id: "noop", data: { disabled: true } }
    }

    const cart_id = (input.data as Record<string, string> | undefined)?.cart_id ?? ""
    const country_code = (input.data as Record<string, string> | undefined)?.country_code ?? "bd"
    const amount = Number(input.amount).toFixed(2)
    const token = await this.getToken()

    const res = await fetch(`${this.baseUrl}/checkout/create`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
        "x-app-key": this.appKey!,
      },
      body: JSON.stringify({
        mode: "0011",
        payerReference: cart_id || "store-order",
        callbackURL: `${this.backendUrl}/store/bkash/callback`,
        amount,
        currency: "BDT",
        intent: "sale",
        merchantInvoiceNumber: cart_id,
      }),
    })

    if (!res.ok) {
      throw new Error(`[bkash] Create payment HTTP ${res.status}`)
    }

    const json = (await res.json()) as {
      paymentID?: string
      bkashURL?: string
      statusCode: string
      statusMessage?: string
    }

    if (json.statusCode !== "0000" || !json.paymentID || !json.bkashURL) {
      throw new Error(`[bkash] Create payment failed: ${json.statusMessage ?? json.statusCode}`)
    }

    this.logger.info(`[bkash] Payment created: paymentID=${json.paymentID} cart_id=${cart_id}`)

    return {
      id: json.paymentID,
      data: {
        paymentID: json.paymentID,
        redirect_url: json.bkashURL,
        cart_id,
        country_code,
        status: "pending",
        validated: false,
      },
    }
  }

  async authorizePayment(input: AuthorizePaymentInput): Promise<AuthorizePaymentOutput> {
    const data = (input.data ?? {}) as Record<string, unknown>
    if (data.validated === true) {
      return { status: "authorized", data }
    }
    return { status: "pending", data }
  }

  async capturePayment(input: CapturePaymentInput): Promise<CapturePaymentOutput> {
    // bKash capture happens during execute; nothing to do here
    return { data: input.data ?? {} }
  }

  async cancelPayment(input: CancelPaymentInput): Promise<CancelPaymentOutput> {
    return { data: input.data ?? {} }
  }

  async deletePayment(input: DeletePaymentInput): Promise<DeletePaymentOutput> {
    return { data: input.data ?? {} }
  }

  async refundPayment(input: RefundPaymentInput): Promise<RefundPaymentOutput> {
    const data = (input.data ?? {}) as Record<string, unknown>
    const paymentID = data.paymentID as string | undefined
    const trxID = data.trxID as string | undefined

    if (!paymentID || !trxID) {
      throw new Error("[bkash] Cannot refund: paymentID or trxID not found. Refund manually via bKash merchant dashboard.")
    }

    if (this.disabled) {
      throw new Error("[bkash] Credentials not configured")
    }

    const token = await this.getToken()
    const refundAmount = Number(input.amount).toFixed(2)

    const res = await fetch(`${this.baseUrl}/checkout/payment/refund`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
        "x-app-key": this.appKey!,
      },
      body: JSON.stringify({
        paymentID,
        amount: refundAmount,
        trxID,
        sku: "refund",
        reason: "Customer refund",
      }),
    })

    if (!res.ok) {
      throw new Error(`[bkash] Refund API HTTP ${res.status}. Refund manually via bKash dashboard.`)
    }

    const json = (await res.json()) as { statusCode: string; statusMessage?: string; refundTrxID?: string }

    if (json.statusCode !== "0000") {
      throw new Error(`[bkash] Refund failed: ${json.statusMessage ?? json.statusCode}. Refund manually via bKash dashboard.`)
    }

    this.logger.info(`[bkash] Refund of ${refundAmount} BDT successful, refundTrxID=${json.refundTrxID}`)
    return { data: { ...data, refunded: true, refundTrxID: json.refundTrxID } }
  }

  async retrievePayment(input: RetrievePaymentInput): Promise<RetrievePaymentOutput> {
    return { data: input.data ?? {} }
  }

  async updatePayment(input: UpdatePaymentInput): Promise<UpdatePaymentOutput> {
    return { data: input.data ?? {} }
  }

  async getPaymentStatus(input: GetPaymentStatusInput): Promise<GetPaymentStatusOutput> {
    const data = (input.data ?? {}) as Record<string, unknown>
    if (data.validated === true) {
      return { status: "authorized", data }
    }
    return { status: "pending", data }
  }

  async getWebhookActionAndData(
    payload: ProviderWebhookPayload["payload"]
  ): Promise<WebhookActionResult> {
    // bKash callback is handled by our custom /store/bkash/callback route
    return { action: "not_supported" }
  }

  // Expose token getter for use in the callback route
  async getAuthToken(): Promise<string> {
    return this.getToken()
  }
}

export default BkashPaymentService
