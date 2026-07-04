import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { Container, Text, Badge, Button, Input, Switch, toast } from "@medusajs/ui"
import { adminFetch } from "../../../lib/api"
import { NotConfiguredNotice } from "../../../components/integration-setup-guide"

type AuthSettings = {
  google_enabled: boolean
  google_client_id: string | null
  google_redirect_uri: string | null
  google_configured: boolean
  google_secret_present: boolean
  phone_otp_enabled: boolean
  otp_length: number
  otp_expiry_seconds: number
  otp_max_attempts: number
  otp_resend_cooldown_seconds: number
  sms_configured: boolean
}

function ConfiguredBadge({ configured }: { configured: boolean }) {
  return configured
    ? <Badge color="green" size="2xsmall">Configured</Badge>
    : <Badge color="orange" size="2xsmall">Not configured</Badge>
}

export function AuthSection() {
  const queryClient = useQueryClient()
  const { data, isLoading, error } = useQuery<AuthSettings>({
    queryKey: ["admin-auth-settings"],
    queryFn: () => adminFetch<AuthSettings>("/auth-settings"),
  })

  const [googleEnabled, setGoogleEnabled] = useState(false)
  const [googleClientId, setGoogleClientId] = useState("")
  const [googleRedirectUri, setGoogleRedirectUri] = useState("")
  const [phoneOtpEnabled, setPhoneOtpEnabled] = useState(false)
  const [otpLength, setOtpLength] = useState("6")
  const [otpExpiry, setOtpExpiry] = useState("300")
  const [otpMaxAttempts, setOtpMaxAttempts] = useState("5")
  const [otpCooldown, setOtpCooldown] = useState("60")
  const [initialized, setInitialized] = useState(false)

  if (data && !initialized) {
    setGoogleEnabled(data.google_enabled ?? false)
    setGoogleClientId(data.google_client_id ?? "")
    setGoogleRedirectUri(data.google_redirect_uri ?? "")
    setPhoneOtpEnabled(data.phone_otp_enabled ?? false)
    setOtpLength(String(data.otp_length ?? 6))
    setOtpExpiry(String(data.otp_expiry_seconds ?? 300))
    setOtpMaxAttempts(String(data.otp_max_attempts ?? 5))
    setOtpCooldown(String(data.otp_resend_cooldown_seconds ?? 60))
    setInitialized(true)
  }

  const saveMutation = useMutation({
    mutationFn: () =>
      adminFetch("/auth-settings", {
        method: "POST",
        body: JSON.stringify({
          google_enabled: googleEnabled,
          google_client_id: googleClientId || null,
          google_redirect_uri: googleRedirectUri || null,
          phone_otp_enabled: phoneOtpEnabled,
          otp_length: Number(otpLength),
          otp_expiry_seconds: Number(otpExpiry),
          otp_max_attempts: Number(otpMaxAttempts),
          otp_resend_cooldown_seconds: Number(otpCooldown),
        }),
      }),
    onSuccess: () => {
      toast.success("Authentication settings saved")
      queryClient.invalidateQueries({ queryKey: ["admin-auth-settings"] })
      setInitialized(false)
    },
    onError: (err: Error) => toast.error(err.message || "Save failed"),
  })

  if (error) {
    return (
      <div className="rounded-md bg-ui-tag-red-bg px-4 py-3">
        <Text size="small" className="text-ui-tag-red-text">{(error as Error).message || "Failed to load settings"}</Text>
      </div>
    )
  }
  if (isLoading) return <Text size="small" className="text-ui-fg-subtle">Loading settings…</Text>

  return (
    <div className="flex flex-col gap-y-3">
      <Text size="small" className="text-ui-fg-subtle">
        Configure customer login methods. Disabled or unconfigured methods are hidden from the storefront automatically.
      </Text>

      {/* Google OAuth */}
      <Container className="p-0 divide-y divide-ui-border-base">
        <div className="flex items-center justify-between px-6 py-4">
          <Text size="base" weight="plus">Google Sign-In</Text>
          <div className="flex items-center gap-x-2">
            <ConfiguredBadge configured={Boolean(data?.google_configured)} />
            {googleEnabled && <Badge color="blue" size="2xsmall">Enabled</Badge>}
          </div>
        </div>

        <div className="px-6 py-4">
          <Text size="small" className="text-ui-fg-subtle">
            The client secret is set via the <code className="bg-ui-bg-subtle px-1 rounded text-xs">GOOGLE_CLIENT_SECRET</code> environment variable.{" "}
            {data?.google_secret_present
              ? "It is currently set on the server."
              : "It is not set yet — add it and restart the server."}
          </Text>
          {!data?.google_configured && (
            <NotConfiguredNotice className="mt-3">
              Not configured yet — set the Client ID below and <b>GOOGLE_CLIENT_SECRET</b> on the server (or contact your developer). Until then Google Sign-In stays disabled.
            </NotConfiguredNotice>
          )}
        </div>

        <div className="px-6 py-4 flex items-center justify-between">
          <div>
            <Text size="small" weight="plus">Enable Google Sign-In</Text>
            <Text size="small" className="text-ui-fg-subtle">Show "Sign in with Google" on the storefront login page</Text>
          </div>
          <Switch checked={googleEnabled} onCheckedChange={setGoogleEnabled} disabled={!data?.google_configured} />
        </div>

        <div className="px-6 py-4 flex flex-col gap-y-4">
          <div className="flex flex-col gap-y-2">
            <Text size="small" weight="plus">Client ID</Text>
            <Input placeholder={data?.google_client_id || "Paste from Google Cloud Console"} value={googleClientId} onChange={(e) => setGoogleClientId(e.target.value)} />
            <Text size="small" className="text-ui-fg-subtle">The client ID is not a secret — it is sent to the storefront.</Text>
          </div>
          <div className="flex flex-col gap-y-2">
            <Text size="small" weight="plus">Redirect URI</Text>
            <Input placeholder="e.g. https://yourdomain.com/en/account/google-callback" value={googleRedirectUri} onChange={(e) => setGoogleRedirectUri(e.target.value)} />
            <Text size="small" className="text-ui-fg-subtle">Must exactly match an Authorized Redirect URI in your Google Cloud Console OAuth client.</Text>
          </div>
        </div>
      </Container>

      {/* Phone OTP */}
      <Container className="p-0 divide-y divide-ui-border-base">
        <div className="flex items-center justify-between px-6 py-4">
          <Text size="base" weight="plus">Phone Number + OTP</Text>
          {phoneOtpEnabled ? <Badge color="blue" size="2xsmall">Enabled</Badge> : <Badge color="orange" size="2xsmall">Disabled</Badge>}
        </div>

        <div className="px-6 py-4 flex items-center justify-between">
          <div>
            <Text size="small" weight="plus">Enable Phone OTP</Text>
            <Text size="small" className="text-ui-fg-subtle">Allow customers to sign in using phone number and a one-time SMS code</Text>
            {!data?.sms_configured && (
              <Text size="small" className="text-ui-tag-orange-text mt-1">Requires SMS configured (set SMS_API_KEY) — see Notifications below</Text>
            )}
          </div>
          <Switch checked={phoneOtpEnabled} onCheckedChange={setPhoneOtpEnabled} disabled={!data?.sms_configured} />
        </div>

        <div className="px-6 py-4 grid grid-cols-2 gap-4">
          <div className="flex flex-col gap-y-2">
            <Text size="small" weight="plus">OTP Length (digits)</Text>
            <Input type="number" min={4} max={8} value={otpLength} onChange={(e) => setOtpLength(e.target.value)} />
          </div>
          <div className="flex flex-col gap-y-2">
            <Text size="small" weight="plus">OTP Expiry (seconds)</Text>
            <Input type="number" min={60} value={otpExpiry} onChange={(e) => setOtpExpiry(e.target.value)} />
          </div>
          <div className="flex flex-col gap-y-2">
            <Text size="small" weight="plus">Max Attempts</Text>
            <Input type="number" min={1} max={10} value={otpMaxAttempts} onChange={(e) => setOtpMaxAttempts(e.target.value)} />
          </div>
          <div className="flex flex-col gap-y-2">
            <Text size="small" weight="plus">Resend Cooldown (seconds)</Text>
            <Input type="number" min={30} value={otpCooldown} onChange={(e) => setOtpCooldown(e.target.value)} />
          </div>
        </div>
      </Container>

      <div>
        <Button size="small" variant="primary" isLoading={saveMutation.isPending} disabled={saveMutation.isPending} onClick={() => saveMutation.mutate()}>
          Save authentication settings
        </Button>
      </div>
    </div>
  )
}
