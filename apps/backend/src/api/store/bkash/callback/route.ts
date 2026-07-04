import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { Modules } from "@medusajs/framework/utils"

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const logger = req.scope.resolve("logger") as any
  const query = req.query as Record<string, string>

  const paymentID = query.paymentID
  const status = query.status
  const storeUrl = (process.env.STORE_URL ?? "http://localhost:8000").replace(/\/$/, "")

  if (status !== "success" || !paymentID) {
    logger.warn(`[bkash:callback] Payment not successful: status=${status} paymentID=${paymentID}`)
    return res.redirect(`${storeUrl}/bd/checkout?step=payment&error=payment_failed`)
  }

  const appKey = process.env.BKASH_APP_KEY
  const appSecret = process.env.BKASH_APP_SECRET
  const username = process.env.BKASH_USERNAME
  const password = process.env.BKASH_PASSWORD
  const sandbox = process.env.BKASH_SANDBOX !== "false"
  const baseUrl = sandbox
    ? "https://tokenized.sandbox.bka.sh/v1.2.0-beta/tokenized"
    : "https://tokenized.pay.bka.sh/v1.2.0-beta/tokenized"

  if (!appKey || !appSecret || !username || !password) {
    logger.error("[bkash:callback] bKash credentials not configured")
    return res.redirect(`${storeUrl}/bd/checkout?step=payment&error=payment_error`)
  }

  try {
    // Grant a fresh token for the execute call
    const credentials = Buffer.from(`${appKey}:${appSecret}`).toString("base64")
    const tokenRes = await fetch(`${baseUrl}/checkout/token/grant`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Basic ${credentials}`,
        username,
        password,
      },
      body: JSON.stringify({ app_key: appKey, app_secret: appSecret }),
    })

    if (!tokenRes.ok) {
      throw new Error(`Token grant HTTP ${tokenRes.status}`)
    }

    const tokenJson = (await tokenRes.json()) as { id_token?: string; statusMessage?: string }
    if (!tokenJson.id_token) {
      throw new Error(`Token grant failed: ${tokenJson.statusMessage}`)
    }

    // Execute the payment to confirm
    const execRes = await fetch(`${baseUrl}/checkout/execute`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${tokenJson.id_token}`,
        "x-app-key": appKey,
      },
      body: JSON.stringify({ paymentID }),
    })

    if (!execRes.ok) {
      throw new Error(`Execute HTTP ${execRes.status}`)
    }

    const execJson = (await execRes.json()) as {
      statusCode: string
      statusMessage?: string
      trxID?: string
      amount?: string
      merchantInvoiceNumber?: string  // = cart_id
    }

    if (execJson.statusCode !== "0000") {
      throw new Error(`Execute failed: ${execJson.statusMessage ?? execJson.statusCode}`)
    }

    const cart_id = execJson.merchantInvoiceNumber ?? ""
    const trxID = execJson.trxID ?? ""

    if (!cart_id) {
      throw new Error("merchantInvoiceNumber (cart_id) missing from bKash execute response")
    }

    // Find the payment session via cart
    const cartModule = req.scope.resolve(Modules.CART) as any
    const cart = await cartModule.retrieveCart(cart_id, {
      relations: ["payment_collection", "payment_collection.payment_sessions"],
    })

    if (!cart?.payment_collection) {
      throw new Error(`No payment collection for cart ${cart_id}`)
    }

    const session = cart.payment_collection.payment_sessions?.find(
      (s: any) => s.provider_id === "pp_bkash_bkash"
    )

    if (!session) {
      throw new Error(`No bKash session for cart ${cart_id}`)
    }

    // Update session to mark validated
    const paymentModule = req.scope.resolve(Modules.PAYMENT) as any
    await paymentModule.updatePaymentSession({
      id: session.id,
      data: {
        ...(session.data ?? {}),
        validated: true,
        paymentID,
        trxID,
        validated_amount: execJson.amount,
      },
      currency_code: session.currency_code,
      amount: session.amount,
    })

    logger.info(`[bkash:callback] Executed and validated paymentID=${paymentID} cart=${cart_id} trxID=${trxID}`)

    // Redirect to storefront return page
    const country_code = (session.data as any)?.country_code ?? "bd"
    return res.redirect(
      `${storeUrl}/${country_code}/checkout/bkash-return?cart_id=${encodeURIComponent(cart_id)}&trx_id=${encodeURIComponent(trxID)}`
    )
  } catch (err: any) {
    logger.error(`[bkash:callback] Error: ${err.message}`)
    return res.redirect(`${storeUrl}/bd/checkout?step=payment&error=payment_error`)
  }
}
