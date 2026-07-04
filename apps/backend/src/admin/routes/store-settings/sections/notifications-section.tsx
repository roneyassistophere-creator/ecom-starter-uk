import { useEffect, useState } from "react"
import { Container, Text, Badge, Button, Input, Label, Switch, toast } from "@medusajs/ui"
import {
  IntegrationSetupGuide,
  type IntegrationGuideConfig,
} from "../../../components/integration-setup-guide"
import { adminFetch } from "../../../lib/api"

const EMAIL_GUIDE: IntegrationGuideConfig = {
  integrationId: "email",
  title: "Transactional Email (Resend)",
  intro: "Connect Resend to send order confirmations, shipping updates, and password resets automatically.",
  steps: [
    { title: "Create a Resend account", body: "Sign up at Resend.com. The free tier supports up to 3,000 emails/month.", link: { label: "Open Resend", url: "https://resend.com" } },
    { title: "Verify your sending domain", body: "In Resend → Domains, add your domain and the SPF/DKIM DNS records at your registrar.", link: { label: "Domain setup", url: "https://resend.com/docs/dashboard/domains/introduction" } },
    { title: "Create an API key", body: 'In Resend → API Keys, create a key with Sending access. Copy it — you won\'t see it again.', link: { label: "Open API Keys", url: "https://resend.com/api-keys" } },
    { title: "Add vars to your server environment and restart", body: "Set RESEND_API_KEY (and optionally RESEND_FROM_EMAIL / RESEND_FROM_NAME) and restart. The status badge turns green.", envCheck: ["RESEND_API_KEY"] },
  ],
  externalEnvStep: {
    varsToSet: [
      { name: "RESEND_API_KEY",    description: "Resend API key with Sending access", example: "re_..." },
      { name: "RESEND_FROM_EMAIL", description: "From address on a verified domain (optional — can also set below)", example: "noreply@yourdomain.com" },
      { name: "RESEND_FROM_NAME",  description: "Default sender name (optional — can also set below)", example: "My Store" },
      { name: "STORE_URL",         description: "Storefront URL used for logo/links in templates", example: "https://yourdomain.com" },
    ],
    note: "The API key is never stored in the admin dashboard. Set it in your server environment and restart to apply. From-email/name can also be edited below.",
  },
  test: { enabled: true, inputLabel: "Send a test email to", inputPlaceholder: "you@example.com", buttonLabel: "Send test email" },
  troubleshooting: [
    { problem: "Status badge stays amber", fix: "Confirm RESEND_API_KEY is set and the server was restarted." },
    { problem: "Test email fails: domain not verified", fix: "The From Email must use a domain verified in Resend → Domains." },
    { problem: "Test email fails: 401", fix: "The API key must have Sending access, not View-only." },
  ],
}

const SMS_GUIDE: IntegrationGuideConfig = {
  integrationId: "sms",
  title: "Transactional SMS",
  intro: "Send order confirmations and shipping updates via SMS. Works with Twilio or any HTTP-API SMS gateway.",
  steps: [
    { title: "Choose a provider", body: 'Set SMS_PROVIDER to "twilio" (default) or "generic_http" for a regional gateway.' },
    { title: "Get your credentials", body: "Twilio: Account SID (API key) + Auth Token + a From number. Generic HTTP: API key, sender ID, gateway URL.", link: { label: "Open Twilio Console", url: "https://console.twilio.com" } },
    { title: "Add vars to your server environment and restart", body: "Set SMS_API_KEY (and TWILIO_AUTH_TOKEN for Twilio), then restart. The status badge turns green.", envCheck: ["SMS_API_KEY"] },
    { title: "Enable per-type SMS toggles below", body: "SMS toggles default to OFF — each message costs money. Enable only what you need, then test before going live." },
  ],
  externalEnvStep: {
    varsToSet: [
      { name: "SMS_API_KEY",       description: "API key (Twilio Account SID, or gateway key)", example: "ACxxxx / your_key" },
      { name: "TWILIO_AUTH_TOKEN", description: "Twilio auth token (Twilio only)", example: "your_auth_token" },
      { name: "SMS_PROVIDER",      description: '"twilio" or "generic_http" (optional — can also set below)', example: "twilio" },
      { name: "SMS_SENDER_ID",     description: "From number / sender ID (optional — can also set below)", example: "+18005551234" },
      { name: "SMS_API_URL",       description: "Gateway URL for generic_http (optional — can also set below)", example: "https://sms.gateway.com/api/send" },
    ],
    note: "Secret keys are never stored in the admin dashboard. Set them in your server environment and restart. Provider/sender/URL can also be edited below.",
  },
  test: { enabled: true, inputLabel: "Send a test SMS to", inputPlaceholder: "+8801XXXXXXXXX", buttonLabel: "Send test SMS" },
  troubleshooting: [
    { problem: "Status badge stays amber", fix: "Confirm SMS_API_KEY is set and the server was restarted." },
    { problem: "Test fails: invalid phone number", fix: "Phone must be E.164: + followed by country code and number." },
    { problem: "Twilio: 401/auth error", fix: "Re-check SMS_API_KEY (Account SID) and TWILIO_AUTH_TOKEN." },
  ],
}

type Settings = {
  email_enabled: boolean
  email_order_placed: boolean
  email_order_shipped: boolean
  email_order_canceled: boolean
  email_password_reset: boolean
  email_sender_name: string | null
  sms_order_placed: boolean
  sms_order_shipped: boolean
  sms_order_canceled: boolean
  resend_from_email: string | null
  resend_from_name: string | null
  sms_sender_id: string | null
  sms_provider: string | null
  sms_api_url: string | null
  email_configured: boolean
  sms_configured: boolean
}

function ConfiguredBadge({ configured }: { configured: boolean }) {
  return configured
    ? <Badge color="green" size="2xsmall">Configured</Badge>
    : <Badge color="orange" size="2xsmall">Not configured</Badge>
}

export function NotificationsSection() {
  const [emailEnabled, setEmailEnabled] = useState(true)
  const [orderPlaced, setOrderPlaced] = useState(true)
  const [orderShipped, setOrderShipped] = useState(true)
  const [orderCanceled, setOrderCanceled] = useState(true)
  const [passwordReset, setPasswordReset] = useState(true)
  const [senderName, setSenderName] = useState("")
  const [fromEmail, setFromEmail] = useState("")
  const [fromName, setFromName] = useState("")
  const [smsOrderPlaced, setSmsOrderPlaced] = useState(false)
  const [smsOrderShipped, setSmsOrderShipped] = useState(false)
  const [smsOrderCanceled, setSmsOrderCanceled] = useState(false)
  const [smsProvider, setSmsProvider] = useState("twilio")
  const [smsSenderId, setSmsSenderId] = useState("")
  const [smsApiUrl, setSmsApiUrl] = useState("")
  const [emailConfigured, setEmailConfigured] = useState(false)
  const [smsConfigured, setSmsConfigured] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    adminFetch<{ setting: Settings }>("/store-settings")
      .then(({ setting }) => {
        setEmailEnabled(setting?.email_enabled ?? true)
        setOrderPlaced(setting?.email_order_placed ?? true)
        setOrderShipped(setting?.email_order_shipped ?? true)
        setOrderCanceled(setting?.email_order_canceled ?? true)
        setPasswordReset(setting?.email_password_reset ?? true)
        setSenderName(setting?.email_sender_name ?? "")
        setFromEmail(setting?.resend_from_email ?? "")
        setFromName(setting?.resend_from_name ?? "")
        setSmsOrderPlaced(setting?.sms_order_placed ?? false)
        setSmsOrderShipped(setting?.sms_order_shipped ?? false)
        setSmsOrderCanceled(setting?.sms_order_canceled ?? false)
        setSmsProvider(setting?.sms_provider ?? "twilio")
        setSmsSenderId(setting?.sms_sender_id ?? "")
        setSmsApiUrl(setting?.sms_api_url ?? "")
        setEmailConfigured(Boolean(setting?.email_configured))
        setSmsConfigured(Boolean(setting?.sms_configured))
      })
      .catch(() => toast.error("Failed to load settings"))
      .finally(() => setLoading(false))
  }, [])

  const handleSave = async () => {
    setSaving(true)
    try {
      await adminFetch("/store-settings", {
        method: "POST",
        body: JSON.stringify({
          email_enabled: emailEnabled,
          email_order_placed: orderPlaced,
          email_order_shipped: orderShipped,
          email_order_canceled: orderCanceled,
          email_password_reset: passwordReset,
          email_sender_name: senderName.trim() || null,
          resend_from_email: fromEmail.trim() || null,
          resend_from_name: fromName.trim() || null,
          sms_order_placed: smsOrderPlaced,
          sms_order_shipped: smsOrderShipped,
          sms_order_canceled: smsOrderCanceled,
          sms_provider: smsProvider.trim() || null,
          sms_sender_id: smsSenderId.trim() || null,
          sms_api_url: smsApiUrl.trim() || null,
        }),
      })
      toast.success("Notification settings saved")
    } catch {
      toast.error("Failed to save settings")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="flex flex-col gap-y-3">
      <IntegrationSetupGuide config={EMAIL_GUIDE} />
      <IntegrationSetupGuide config={SMS_GUIDE} />

      {/* Email settings */}
      <Container className="p-0 divide-y divide-ui-border-base">
        <div className="flex items-center justify-between px-6 py-4">
          <Text size="base" weight="plus">Email</Text>
          <ConfiguredBadge configured={emailConfigured} />
        </div>

        <div className="px-6 py-4 flex flex-col gap-y-4">
          <div className="flex flex-col gap-y-1">
            <Label>From Email</Label>
            <Text size="xsmall" className="text-ui-fg-muted">Must be on a domain verified in Resend</Text>
            <Input value={fromEmail} onChange={(e) => setFromEmail(e.target.value)} placeholder="noreply@yourdomain.com" disabled={loading || !emailConfigured} />
          </div>
          <div className="flex flex-col gap-y-1">
            <Label>From Name</Label>
            <Input value={fromName} onChange={(e) => setFromName(e.target.value)} placeholder="My Store" disabled={loading || !emailConfigured} />
          </div>
          <div className="flex flex-col gap-y-1">
            <Label>Sender Name Override</Label>
            <Text size="xsmall" className="text-ui-fg-muted">Overrides From Name above. Leave blank to use From Name.</Text>
            <Input value={senderName} onChange={(e) => setSenderName(e.target.value)} placeholder="My Store" disabled={loading || !emailConfigured} />
          </div>
        </div>

        <div className="px-6 py-4 flex flex-col gap-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label>All Email Notifications</Label>
              <Text size="xsmall" className="text-ui-fg-muted">Master switch — disabling overrides all per-type email settings.</Text>
            </div>
            <Switch checked={emailEnabled} onCheckedChange={setEmailEnabled} disabled={loading || !emailConfigured} />
          </div>
          {([
            { label: "Order Placed",   value: orderPlaced,   setter: setOrderPlaced },
            { label: "Order Shipped",  value: orderShipped,  setter: setOrderShipped },
            { label: "Order Canceled", value: orderCanceled, setter: setOrderCanceled },
            { label: "Password Reset", value: passwordReset, setter: setPasswordReset },
          ] as const).map(({ label, value, setter }) => (
            <div key={label} className="flex items-center justify-between">
              <Label className={!emailEnabled ? "text-ui-fg-muted" : ""}>{label}</Label>
              <Switch checked={value} onCheckedChange={(v) => setter(v)} disabled={loading || !emailConfigured || !emailEnabled} />
            </div>
          ))}
        </div>
      </Container>

      {/* SMS settings */}
      <Container className="p-0 divide-y divide-ui-border-base">
        <div className="flex items-center justify-between px-6 py-4">
          <Text size="base" weight="plus">SMS</Text>
          <ConfiguredBadge configured={smsConfigured} />
        </div>

        <div className="px-6 py-4 flex flex-col gap-y-4">
          <div className="flex flex-col gap-y-1">
            <Label>Provider</Label>
            <Text size="xsmall" className="text-ui-fg-muted">"twilio" or "generic_http"</Text>
            <Input value={smsProvider} onChange={(e) => setSmsProvider(e.target.value)} placeholder="twilio" disabled={loading || !smsConfigured} />
          </div>
          <div className="flex flex-col gap-y-1">
            <Label>Sender ID {smsProvider === "twilio" ? "(From Number)" : ""}</Label>
            <Input value={smsSenderId} onChange={(e) => setSmsSenderId(e.target.value)} placeholder={smsProvider === "twilio" ? "+18005551234" : "MySender"} disabled={loading || !smsConfigured} />
          </div>
          {smsProvider === "generic_http" && (
            <div className="flex flex-col gap-y-1">
              <Label>API URL</Label>
              <Input value={smsApiUrl} onChange={(e) => setSmsApiUrl(e.target.value)} placeholder="https://sms.yourgateway.com/api/send" disabled={loading || !smsConfigured} />
            </div>
          )}
          <Text size="xsmall" className="text-ui-fg-muted">
            The API key{smsProvider === "twilio" ? " and Twilio auth token" : ""} are set via environment variables (SMS_API_KEY{smsProvider === "twilio" ? ", TWILIO_AUTH_TOKEN" : ""}).
          </Text>
        </div>

        <div className="px-6 py-4 flex flex-col gap-y-4">
          <Text size="xsmall" className="text-ui-fg-muted">All SMS types default to OFF — each message costs money.</Text>
          {([
            { label: "Order Placed",   value: smsOrderPlaced,   setter: setSmsOrderPlaced },
            { label: "Order Shipped",  value: smsOrderShipped,  setter: setSmsOrderShipped },
            { label: "Order Canceled", value: smsOrderCanceled, setter: setSmsOrderCanceled },
          ] as const).map(({ label, value, setter }) => (
            <div key={label} className="flex items-center justify-between">
              <Label>{label}</Label>
              <Switch checked={value} onCheckedChange={(v) => setter(v)} disabled={loading || !smsConfigured} />
            </div>
          ))}
        </div>
      </Container>

      <div className="flex justify-end">
        <Button onClick={handleSave} isLoading={saving} disabled={loading || saving}>
          Save notification settings
        </Button>
      </div>
    </div>
  )
}
