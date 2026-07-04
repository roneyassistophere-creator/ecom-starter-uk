import { useEffect, useState } from "react"
import { Switch, Text, toast } from "@medusajs/ui"
import {
  IntegrationSetupGuide,
  type IntegrationGuideConfig,
} from "../../../components/integration-setup-guide"
import { adminFetch } from "../../../lib/api"

const STRIPE_GUIDE: IntegrationGuideConfig = {
  integrationId: "stripe",
  title: "Stripe (Cards, Apple Pay, Google Pay)",
  intro: "Accept international card payments and digital wallets. Stripe is the recommended provider for global customers.",
  steps: [
    {
      title: "Create a Stripe account",
      body: "Sign up at stripe.com if you don't have an account. You can start in test mode immediately — no business verification required for sandbox.",
      link: { label: "Open Stripe", url: "https://stripe.com" },
    },
    {
      title: "Get your API key",
      body: 'In Stripe → Developers → API Keys, copy the "Secret key" (starts with sk_test_ for sandbox, sk_live_ for production). Never use the publishable key here.',
      link: { label: "Open API Keys", url: "https://dashboard.stripe.com/apikeys" },
    },
    {
      title: "Create a webhook endpoint",
      body: "In Stripe → Developers → Webhooks, click \"Add endpoint\". Set the URL to your backend URL + /hooks/payment/stripe_stripe. Select events: payment_intent.succeeded, payment_intent.payment_failed, payment_intent.canceled.",
      link: { label: "Open Webhooks", url: "https://dashboard.stripe.com/webhooks" },
    },
    {
      title: "Add vars to your server environment and restart",
      body: "Set STRIPE_API_KEY and STRIPE_WEBHOOK_SECRET in your server environment, then restart. The status badge turns green. Then enable Stripe in Settings → Regions.",
      envCheck: ["STRIPE_API_KEY", "STRIPE_WEBHOOK_SECRET"],
    },
  ],
  externalEnvStep: {
    varsToSet: [
      { name: "STRIPE_API_KEY",        description: "Stripe secret key (sk_test_... or sk_live_...)",           example: "sk_test_..." },
      { name: "STRIPE_WEBHOOK_SECRET", description: "Webhook signing secret from Stripe Developers → Webhooks", example: "whsec_..." },
    ],
    note: "API keys are never stored in the admin dashboard. Set these in your server environment and restart to apply.",
  },
  test: { enabled: false, inputLabel: "", buttonLabel: "Test connection" },
  troubleshooting: [
    { problem: "Stripe doesn't appear at checkout",    fix: "Go to Settings → Regions → your region → Payment Providers and enable pp_stripe_stripe." },
    { problem: "Test card not working",                fix: 'Use test card 4242 4242 4242 4242 with any future expiry and any CVV. The region currency must match your Stripe account.' },
    { problem: "Webhook signature verification fails", fix: "Make sure STRIPE_WEBHOOK_SECRET matches the secret shown in the webhook endpoint details in Stripe dashboard." },
    { problem: "Status stays amber after adding vars", fix: "Restart the server — env vars are read at startup." },
  ],
}

const SSLCOMMERZ_GUIDE: IntegrationGuideConfig = {
  integrationId: "sslcommerz",
  title: "SSLCommerz (BD Aggregator)",
  intro: "Accept cards, bKash, Nagad, Rocket, internet banking, and EMI through one integration. The primary payment gateway for Bangladeshi customers.",
  steps: [
    {
      title: "Create a merchant account",
      body: "Go to sslcommerz.com and apply for a merchant account. You'll receive sandbox credentials immediately for testing; live credentials follow after business verification.",
      link: { label: "Apply at SSLCommerz", url: "https://www.sslcommerz.com/product/s2/" },
    },
    {
      title: "Get sandbox credentials",
      body: "After registration, SSLCommerz provides a Store ID and Store Password for sandbox. Use these for testing — they hit the sandbox.sslcommerz.com gateway.",
    },
    {
      title: "Configure IPN URL",
      body: "In your SSLCommerz merchant panel, set the IPN URL to your backend: {BACKEND_URL}/store/sslcommerz/ipn. This URL must be publicly reachable (use ngrok in local dev: ngrok http 9000).",
    },
    {
      title: "Add vars to your server environment and restart",
      body: "After restarting, the status badge turns green. Then enable SSLCommerz in Settings → Regions → Payment Providers.",
      envCheck: ["SSLCOMMERZ_STORE_ID", "SSLCOMMERZ_STORE_PASSWORD"],
    },
  ],
  externalEnvStep: {
    varsToSet: [
      { name: "SSLCOMMERZ_STORE_ID",       description: "Your SSLCommerz Store ID",                              example: "your_store_id" },
      { name: "SSLCOMMERZ_STORE_PASSWORD", description: "Your SSLCommerz Store Password",                        example: "your_store_password" },
      { name: "SSLCOMMERZ_SANDBOX",        description: 'Set to "false" for live; "true" (default) for sandbox', example: "true" },
      { name: "BACKEND_URL",               description: "Your backend public URL (used to build callback URLs)", example: "https://yourdomain.com" },
    ],
    note: "Store credentials are never stored in the admin dashboard. Set these in your server environment and restart to apply.",
  },
  test: { enabled: true, inputLabel: "Test credentials", inputPlaceholder: "(no input needed — just click test)", buttonLabel: "Test SSLCommerz connection" },
  troubleshooting: [
    { problem: "IPN not arriving",                      fix: "The IPN URL must be publicly reachable. Use ngrok in local dev and set BACKEND_URL to the ngrok https URL." },
    { problem: "Session creation fails: invalid store", fix: "Double-check SSLCOMMERZ_STORE_ID and SSLCOMMERZ_STORE_PASSWORD match the sandbox or live credentials from your merchant panel." },
    { problem: "Amount mismatch in IPN validation",     fix: "The order total must be in BDT. Ensure the cart is set to a BDT currency region." },
    { problem: "SSLCommerz doesn't appear at checkout", fix: "Enable pp_sslcommerz_sslcommerz in Settings → Regions → Payment Providers for the BD region." },
  ],
}

const BKASH_GUIDE: IntegrationGuideConfig = {
  integrationId: "bkash",
  title: "bKash Direct (Tokenized PGW)",
  intro: "Accept bKash payments directly via bKash's tokenized Checkout API. Note: SSLCommerz already includes bKash — enable this only if you want a dedicated bKash-only option.",
  steps: [
    {
      title: "Get merchant PGW credentials",
      body: "Contact bKash (developer.bka.sh) to get tokenized PGW sandbox credentials: App Key, App Secret, Username, and Password.",
      link: { label: "bKash Developer Portal", url: "https://developer.bka.sh" },
    },
    {
      title: "Configure callback URL",
      body: "Your bKash callback URL is: {BACKEND_URL}/store/bkash/callback. This must be registered with bKash and publicly reachable (use ngrok in local dev).",
    },
    {
      title: "Add vars to your server environment and restart",
      body: "After restarting, the status badge turns green. Then enable bKash in Settings → Regions → Payment Providers.",
      envCheck: ["BKASH_APP_KEY", "BKASH_USERNAME"],
    },
  ],
  externalEnvStep: {
    varsToSet: [
      { name: "BKASH_APP_KEY",    description: "bKash App Key from PGW credentials",            example: "your_app_key" },
      { name: "BKASH_APP_SECRET", description: "bKash App Secret",                              example: "your_app_secret" },
      { name: "BKASH_USERNAME",   description: "bKash merchant username",                       example: "your_username" },
      { name: "BKASH_PASSWORD",   description: "bKash merchant password",                       example: "your_password" },
      { name: "BKASH_SANDBOX",    description: '"false" for live, "true" (default) for sandbox', example: "true" },
    ],
    note: "bKash credentials are never stored in the admin dashboard. Set these in your server environment and restart to apply.",
  },
  test: { enabled: true, inputLabel: "Test token grant", inputPlaceholder: "(no input needed — just click test)", buttonLabel: "Test bKash connection" },
  troubleshooting: [
    { problem: "Token grant fails",                fix: "Verify BKASH_USERNAME and BKASH_PASSWORD exactly. Check BKASH_SANDBOX matches your credentials." },
    { problem: "Callback not received",            fix: "The callback URL must be https and publicly reachable. Register it with bKash support." },
    { problem: "bKash doesn't appear at checkout", fix: "Enable pp_bkash_bkash in Settings → Regions → Payment Providers for the BD region." },
  ],
}

const GUIDES = [STRIPE_GUIDE, SSLCOMMERZ_GUIDE, BKASH_GUIDE]

export function PaymentsSection() {
  const [enabled, setEnabled] = useState<Record<string, boolean>>({})
  const [configured, setConfigured] = useState<Record<string, boolean>>({})
  const [loaded, setLoaded] = useState(false)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    adminFetch<{ setting: { payment_enabled: Record<string, boolean> | null } }>("/store-settings")
      .then(({ setting }) => setEnabled(setting?.payment_enabled ?? {}))
      .catch(() => {})
      .finally(() => setLoaded(true))
  }, [])

  const toggle = async (id: string, value: boolean) => {
    const next = { ...enabled, [id]: value }
    setEnabled(next)
    setSaving(true)
    try {
      await adminFetch("/store-settings", {
        method: "POST",
        body: JSON.stringify({ payment_enabled: next }),
      })
    } catch {
      toast.error("Failed to save")
      setEnabled(enabled) // revert
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="flex flex-col gap-y-2">
      <Text size="small" className="text-ui-fg-subtle">
        Set each provider's keys in your server environment, then turn it on here. It must also be enabled
        per region in Settings → Regions → Payment Providers to appear at checkout.
      </Text>
      {GUIDES.map((guide) => {
        const id = guide.integrationId
        const isConfigured = configured[id] ?? false
        return (
          <IntegrationSetupGuide
            key={id}
            config={guide}
            onStatusChange={(c) => setConfigured((prev) => ({ ...prev, [id]: c }))}
            rightSlot={
              <Switch
                checked={Boolean(enabled[id])}
                disabled={!isConfigured || !loaded || saving}
                onCheckedChange={(v) => toggle(id, v)}
              />
            }
          />
        )
      })}
    </div>
  )
}
