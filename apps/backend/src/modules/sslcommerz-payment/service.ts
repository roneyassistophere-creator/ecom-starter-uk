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

function randomHex(length: number): string {
  return Array.from({ length }, () => Math.floor(Math.random() * 16).toString(16)).join("")
}

export class SslcommerzPaymentService extends AbstractPaymentProvider<Record<string, never>> {
  static identifier = "sslcommerz"

  private logger: InjectedDeps["logger"]
  private storeId: string | null
  private storePassword: string | null
  private sandbox: boolean
  private backendUrl: string

  private get apiBase(): string {
    return this.sandbox
      ? "https://sandbox.sslcommerz.com"
      : "https://securepay.sslcommerz.com"
  }

  constructor({ logger }: InjectedDeps, config?: Record<string, never>) {
    super({ logger } as InjectedDeps, config ?? {})
    this.logger = logger
    this.storeId = process.env.SSLCOMMERZ_STORE_ID ?? null
    this.storePassword = process.env.SSLCOMMERZ_STORE_PASSWORD ?? null
    this.sandbox = process.env.SSLCOMMERZ_SANDBOX !== "false"
    this.backendUrl = (process.env.BACKEND_URL ?? "http://localhost:9000").replace(/\/$/, "")

    if (!this.storeId || !this.storePassword) {
      this.logger.warn("[sslcommerz] SSLCOMMERZ_STORE_ID or SSLCOMMERZ_STORE_PASSWORD not set — SSLCommerz is disabled")
    } else {
      this.logger.info(`[sslcommerz] Initialized in ${this.sandbox ? "sandbox" : "live"} mode`)
    }
  }

  async initiatePayment(input: InitiatePaymentInput): Promise<InitiatePaymentOutput> {
    if (!this.storeId || !this.storePassword) {
      return { id: "noop", data: { disabled: true } }
    }

    const tran_id = `ssl_${Date.now()}_${randomHex(6)}`
    const cart_id = (input.data as Record<string, string> | undefined)?.cart_id ?? ""
    const country_code = (input.data as Record<string, string> | undefined)?.country_code ?? "bd"
    const customer = input.context?.customer
    const amount = Number(input.amount)

    const params = new URLSearchParams({
      store_id: this.storeId,
      store_passwd: this.storePassword,
      total_amount: amount.toFixed(2),
      currency: "BDT",
      tran_id,
      success_url: `${this.backendUrl}/store/sslcommerz/success`,
      fail_url: `${this.backendUrl}/store/sslcommerz/fail`,
      cancel_url: `${this.backendUrl}/store/sslcommerz/cancel`,
      ipn_url: `${this.backendUrl}/store/sslcommerz/ipn`,
      // Pass cart_id and country_code back via custom fields
      value_a: cart_id,
      value_b: country_code,
      // Customer info (required by SSLCommerz)
      cus_name: customer ? `${customer.first_name ?? ""} ${customer.last_name ?? ""}`.trim() || "Customer" : "Customer",
      cus_email: customer?.email ?? "customer@store.com",
      cus_phone: customer?.phone ?? "01700000000",
      cus_add1: "Dhaka",
      cus_city: "Dhaka",
      cus_country: "Bangladesh",
      // Shipping same as billing for digital stores
      ship_name: customer ? `${customer.first_name ?? ""} ${customer.last_name ?? ""}`.trim() || "Customer" : "Customer",
      ship_add1: "Dhaka",
      ship_city: "Dhaka",
      ship_country: "Bangladesh",
      // Product info
      product_name: "Store Order",
      product_category: "general",
      product_profile: "general",
    })

    const res = await fetch(`${this.apiBase}/gwprocess/v4/api.php`, {
      method: "POST",
      body: params,
    })

    if (!res.ok) {
      throw new Error(`[sslcommerz] Session API returned HTTP ${res.status}`)
    }

    const json = (await res.json()) as { status: string; GatewayPageURL?: string; failedreason?: string }

    if (json.status !== "SUCCESS" || !json.GatewayPageURL) {
      throw new Error(`[sslcommerz] Session creation failed: ${json.failedreason ?? json.status}`)
    }

    this.logger.info(`[sslcommerz] Payment session created: tran_id=${tran_id} cart_id=${cart_id}`)

    return {
      id: tran_id,
      data: {
        tran_id,
        redirect_url: json.GatewayPageURL,
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
    // SSLCommerz auto-captures on successful payment; nothing to do here
    return { data: input.data ?? {} }
  }

  async cancelPayment(input: CancelPaymentInput): Promise<CancelPaymentOutput> {
    // No cancel API for pending SSLCommerz transactions
    return { data: input.data ?? {} }
  }

  async deletePayment(input: DeletePaymentInput): Promise<DeletePaymentOutput> {
    return { data: input.data ?? {} }
  }

  async refundPayment(input: RefundPaymentInput): Promise<RefundPaymentOutput> {
    const data = (input.data ?? {}) as Record<string, unknown>
    const bank_tran_id = data.bank_tran_id as string | undefined

    if (!bank_tran_id) {
      throw new Error("[sslcommerz] Cannot refund: bank_tran_id not found in payment data. Refund manually via SSLCommerz merchant panel.")
    }
    if (!this.storeId || !this.storePassword) {
      throw new Error("[sslcommerz] Credentials not configured")
    }

    const refundAmount = Number(input.amount).toFixed(2)
    const params = new URLSearchParams({
      store_id: this.storeId,
      store_passwd: this.storePassword,
      bank_tran_id,
      trans_id: (data.tran_id as string) ?? "",
      refund_amount: refundAmount,
      refund_remarks: "Customer refund",
    })

    const res = await fetch(`${this.apiBase}/validator/api/merchantTransIDvalidationAPI.php`, {
      method: "POST",
      body: params,
    })

    if (!res.ok) {
      throw new Error(`[sslcommerz] Refund API returned HTTP ${res.status}. Refund manually via SSLCommerz merchant panel.`)
    }

    const json = (await res.json()) as { status: string; errorReason?: string }
    if (json.status !== "success") {
      throw new Error(`[sslcommerz] Refund failed: ${json.errorReason ?? json.status}. Refund manually via SSLCommerz merchant panel.`)
    }

    this.logger.info(`[sslcommerz] Refund of ${refundAmount} BDT successful for bank_tran_id=${bank_tran_id}`)
    return { data: { ...data, refunded: true, refund_amount: refundAmount } }
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
    // IPN is handled by our custom /store/sslcommerz/ipn route, not via this webhook path
    return { action: "not_supported" }
  }
}

export default SslcommerzPaymentService
