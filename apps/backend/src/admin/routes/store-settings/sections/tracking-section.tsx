import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { Container, Text, Badge, Button, Input, Switch, toast } from "@medusajs/ui"
import { adminFetch } from "../../../lib/api"
import { NotConfiguredNotice } from "../../../components/integration-setup-guide"

type TrackingSettings = {
  meta_pixel_id: string | null
  ga4_measurement_id: string | null
  capi_enabled: boolean
  capi_configured: boolean
  capi_test_event_code: string | null
  purchase_event_enabled: boolean
}

function ConfiguredBadge({ configured }: { configured: boolean }) {
  return configured
    ? <Badge color="green" size="2xsmall">Configured</Badge>
    : <Badge color="orange" size="2xsmall">Not configured</Badge>
}

export function TrackingSection() {
  const queryClient = useQueryClient()
  const { data, isLoading, error } = useQuery<TrackingSettings>({
    queryKey: ["admin-tracking"],
    queryFn: () => adminFetch<TrackingSettings>("/tracking"),
  })

  const [pixelId, setPixelId] = useState("")
  const [ga4Id, setGa4Id] = useState("")
  const [testEventCode, setTestEventCode] = useState("")
  const [capiEnabled, setCapiEnabled] = useState(false)
  const [purchaseEnabled, setPurchaseEnabled] = useState(true)
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null)
  const [testing, setTesting] = useState(false)
  const [initialized, setInitialized] = useState(false)

  if (data && !initialized) {
    setPixelId(data.meta_pixel_id ?? "")
    setGa4Id(data.ga4_measurement_id ?? "")
    setTestEventCode(data.capi_test_event_code ?? "")
    setCapiEnabled(data.capi_enabled ?? false)
    setPurchaseEnabled(data.purchase_event_enabled ?? true)
    setInitialized(true)
  }

  const saveMutation = useMutation({
    mutationFn: () =>
      adminFetch("/tracking", {
        method: "POST",
        body: JSON.stringify({
          meta_pixel_id: pixelId || null,
          ga4_measurement_id: ga4Id || null,
          capi_enabled: capiEnabled,
          purchase_event_enabled: purchaseEnabled,
          capi_test_event_code: testEventCode || null,
        }),
      }),
    onSuccess: () => {
      toast.success("Tracking settings saved")
      queryClient.invalidateQueries({ queryKey: ["admin-tracking"] })
      setInitialized(false)
    },
    onError: (err: Error) => toast.error(err.message || "Save failed"),
  })

  const handleTest = async () => {
    setTesting(true)
    setTestResult(null)
    try {
      const result = await adminFetch<{ success: boolean; message: string }>("/tracking/test-capi", { method: "POST" })
      setTestResult(result)
      if (result.success) toast.success(result.message)
      else toast.error(result.message)
    } catch (err: any) {
      const msg = err.message || "Test failed"
      setTestResult({ success: false, message: msg })
      toast.error(msg)
    } finally {
      setTesting(false)
    }
  }

  if (error) {
    return (
      <div className="rounded-md bg-ui-tag-red-bg px-4 py-3">
        <Text size="small" className="text-ui-tag-red-text">{(error as Error).message || "Failed to load tracking settings"}</Text>
      </div>
    )
  }

  if (isLoading) {
    return <Text size="small" className="text-ui-fg-subtle">Loading settings…</Text>
  }

  return (
    <div className="flex flex-col gap-y-3">
      {/* Meta Pixel */}
      <Container className="p-0 divide-y divide-ui-border-base">
        <div className="flex items-center justify-between px-6 py-4">
          <Text size="base" weight="plus">Meta Pixel</Text>
          <ConfiguredBadge configured={Boolean(data?.meta_pixel_id)} />
        </div>
        <div className="px-6 py-4 flex flex-col gap-y-2">
          <Text size="small" weight="plus">Pixel ID</Text>
          <Input placeholder={data?.meta_pixel_id ? `Current: ${data.meta_pixel_id}` : "e.g. 1234567890123456"} value={pixelId} onChange={(e) => setPixelId(e.target.value)} />
          <Text size="small" className="text-ui-fg-subtle">15-16 digit number from Meta Events Manager. Not a secret — stored plainly.</Text>
        </div>
      </Container>

      {/* GA4 */}
      <Container className="p-0 divide-y divide-ui-border-base">
        <div className="flex items-center justify-between px-6 py-4">
          <Text size="base" weight="plus">Google Analytics 4</Text>
          <ConfiguredBadge configured={Boolean(data?.ga4_measurement_id)} />
        </div>
        <div className="px-6 py-4 flex flex-col gap-y-2">
          <Text size="small" weight="plus">Measurement ID</Text>
          <Input placeholder={data?.ga4_measurement_id ? `Current: ${data.ga4_measurement_id}` : "e.g. G-XXXXXXXXXX"} value={ga4Id} onChange={(e) => setGa4Id(e.target.value)} />
          <Text size="small" className="text-ui-fg-subtle">Format: G-XXXXXXXXXX. From Google Analytics → Data Streams → Web.</Text>
        </div>
      </Container>

      {/* Meta CAPI */}
      <Container className="p-0 divide-y divide-ui-border-base">
        <div className="flex items-center justify-between px-6 py-4">
          <Text size="base" weight="plus">Meta Conversions API</Text>
          <div className="flex items-center gap-x-2">
            <ConfiguredBadge configured={Boolean(data?.capi_configured)} />
            {capiEnabled && <Badge color="blue" size="2xsmall">Enabled</Badge>}
          </div>
        </div>

        <div className="px-6 py-4 flex flex-col gap-y-3">
          <Text size="small" className="text-ui-fg-subtle">
            The CAPI access token is set via the <code className="bg-ui-bg-subtle px-1 rounded text-xs">META_CAPI_ACCESS_TOKEN</code> environment variable. Generate it in Events Manager → your Pixel → Conversions API.
          </Text>
          {!data?.capi_configured && (
            <NotConfiguredNotice>
              Not configured yet — set <b>META_CAPI_ACCESS_TOKEN</b> on the server (or contact your developer). Until then CAPI stays disabled.
            </NotConfiguredNotice>
          )}
        </div>

        <div className="px-6 py-4 flex items-center justify-between">
          <div>
            <Text size="small" weight="plus">Enable CAPI</Text>
            <Text size="small" className="text-ui-fg-subtle">Send server-side events to Meta's Conversions API</Text>
          </div>
          <Switch checked={capiEnabled} onCheckedChange={setCapiEnabled} disabled={!data?.capi_configured} />
        </div>

        <div className="px-6 py-4 flex items-center justify-between">
          <div>
            <Text size="small" weight="plus">Send Purchase events</Text>
            <Text size="small" className="text-ui-fg-subtle">Fire a CAPI Purchase event on order placement (deduplicated with browser Pixel)</Text>
          </div>
          <Switch checked={purchaseEnabled} onCheckedChange={setPurchaseEnabled} disabled={!capiEnabled} />
        </div>

        <div className="px-6 py-4 flex flex-col gap-y-4">
          <div className="flex flex-col gap-y-2">
            <Text size="small" weight="plus">Test Event Code (optional)</Text>
            <Input placeholder="e.g. TEST12345" value={testEventCode} onChange={(e) => setTestEventCode(e.target.value)} />
            <Text size="small" className="text-ui-fg-subtle">From Meta Events Manager → Test Events. Verifies events without polluting real data.</Text>
          </div>

          <div className="flex items-center gap-x-2">
            <Button size="small" variant="secondary" disabled={!data?.capi_configured || testing} isLoading={testing} onClick={handleTest}>
              Send test event
            </Button>
          </div>

          {testResult && (
            <div className={`flex items-center gap-x-2 rounded-md px-3 py-2 text-sm ${testResult.success ? "bg-ui-tag-green-bg text-ui-tag-green-text" : "bg-ui-tag-red-bg text-ui-tag-red-text"}`}>
              <span>{testResult.success ? "✓" : "✗"}</span>
              <span>{testResult.message}</span>
            </div>
          )}
        </div>
      </Container>

      <div>
        <Button size="small" variant="primary" isLoading={saveMutation.isPending} disabled={saveMutation.isPending} onClick={() => saveMutation.mutate()}>
          Save tracking settings
        </Button>
      </div>
    </div>
  )
}
