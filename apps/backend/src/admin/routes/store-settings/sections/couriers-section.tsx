import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { Text, Badge, Button, Input, Alert, toast } from "@medusajs/ui"
import {
  IntegrationSetupGuide,
  type IntegrationGuideConfig,
} from "../../../components/integration-setup-guide"
import { adminFetch } from "../../../lib/api"

type CourierRow = {
  id: string
  courier_id: "steadfast" | "redx" | "pathao"
  enabled: boolean
  is_active: boolean
  configured: boolean
  settings: Record<string, unknown> | null
}

const COURIER_GUIDES: Record<string, IntegrationGuideConfig> = {
  steadfast: {
    integrationId: "steadfast",
    title: "Steadfast Courier",
    intro: "Popular BD courier with API-based parcel booking. Steadfast has no sandbox — credentials are live.",
    steps: [
      { title: "Create a merchant account", body: "Sign up at portal.packzy.com.", link: { label: "Open Steadfast", url: "https://portal.packzy.com" } },
      { title: "Get your API keys", body: "Go to Account → API Settings to find your API Key and Secret Key." },
      { title: "Add vars to your server environment and restart", body: "After restarting, the status badge turns green. Then use the controls below to set Steadfast as the active courier.", envCheck: ["STEADFAST_API_KEY", "STEADFAST_SECRET_KEY"] },
    ],
    externalEnvStep: {
      varsToSet: [
        { name: "STEADFAST_API_KEY",    description: "Steadfast API key",    example: "your_api_key" },
        { name: "STEADFAST_SECRET_KEY", description: "Steadfast secret key", example: "your_secret_key" },
      ],
      note: "Credentials are never stored in the admin dashboard. Set these in your server environment and restart to apply.",
    },
    test: { enabled: true, inputLabel: "Test connection", inputPlaceholder: "(no input needed — just click test)", buttonLabel: "Test Steadfast connection" },
    troubleshooting: [
      { problem: "Invalid API key or secret", fix: "Re-copy the API Key and Secret Key from portal.packzy.com → Account → API Settings." },
      { problem: "Status stays amber after adding vars", fix: "Restart the server — env vars are read at startup." },
    ],
  },
  redx: {
    integrationId: "redx",
    title: "RedX",
    intro: "Fast delivery across Bangladesh with real-time tracking. Set REDX_SANDBOX=true for testing.",
    steps: [
      { title: "Create a merchant account", body: "Sign up at redx.com.bd and request API access from your account manager.", link: { label: "Open RedX", url: "https://redx.com.bd" } },
      { title: "Get your API token", body: "Obtain your API Token from the merchant portal." },
      { title: "Add vars to your server environment and restart", body: "After restarting, the status badge turns green. Then set RedX active below.", envCheck: ["REDX_API_TOKEN"] },
    ],
    externalEnvStep: {
      varsToSet: [
        { name: "REDX_API_TOKEN", description: "RedX API token", example: "your_api_token" },
        { name: "REDX_SANDBOX",   description: '"true" to use the sandbox gateway, "false" for live', example: "false" },
      ],
      note: "Credentials are never stored in the admin dashboard. Set these in your server environment and restart to apply.",
    },
    test: { enabled: true, inputLabel: "Test connection", inputPlaceholder: "(no input needed — just click test)", buttonLabel: "Test RedX connection" },
    troubleshooting: [
      { problem: "Invalid API token", fix: "Re-copy the API Token from the RedX merchant portal." },
      { problem: "Using the wrong environment", fix: "Set REDX_SANDBOX=true for sandbox tokens, false for live tokens." },
    ],
  },
  pathao: {
    integrationId: "pathao",
    title: "Pathao",
    intro: "Tech-first courier with city-zone-area routing for BD. Set PATHAO_SANDBOX=true for testing.",
    steps: [
      { title: "Apply for Pathao Courier API access", body: "Apply at pathao.com to receive client_id, client_secret, username, and password.", link: { label: "Open Pathao", url: "https://pathao.com" } },
      { title: "Add vars to your server environment and restart", body: "After restarting, the status badge turns green. Then set Pathao active below.", envCheck: ["PATHAO_CLIENT_ID", "PATHAO_CLIENT_SECRET", "PATHAO_USERNAME", "PATHAO_PASSWORD"] },
    ],
    externalEnvStep: {
      varsToSet: [
        { name: "PATHAO_CLIENT_ID",     description: "Pathao client_id",     example: "your_client_id" },
        { name: "PATHAO_CLIENT_SECRET", description: "Pathao client_secret", example: "your_client_secret" },
        { name: "PATHAO_USERNAME",      description: "Pathao merchant email/username", example: "merchant@example.com" },
        { name: "PATHAO_PASSWORD",      description: "Pathao merchant password", example: "your_password" },
        { name: "PATHAO_STORE_ID",      description: "Pathao store_id (optional)", example: "12345" },
        { name: "PATHAO_SANDBOX",       description: '"true" for sandbox, "false" for live', example: "false" },
      ],
      note: "Credentials are never stored in the admin dashboard. Set these in your server environment and restart to apply.",
    },
    test: { enabled: true, inputLabel: "Test connection", inputPlaceholder: "(no input needed — just click test)", buttonLabel: "Test Pathao connection" },
    troubleshooting: [
      { problem: "Token grant fails", fix: "Verify client_id, client_secret, username, and password match what Pathao provided, and PATHAO_SANDBOX matches their environment." },
    ],
  },
}

const ORDER = ["steadfast", "redx", "pathao"] as const

function CourierControls({ courier, onChanged }: { courier: CourierRow; onChanged: () => void }) {
  const [pickup, setPickup] = useState<string>((courier.settings?.pickup_address as string) ?? "")
  const disabled = !courier.configured

  const activateMutation = useMutation({
    mutationFn: () => adminFetch(`/couriers/${courier.id}/activate`, { method: "POST" }),
    onSuccess: () => { toast.success("Set as active courier"); onChanged() },
    onError: (err: Error) => toast.error(err.message || "Activation failed"),
  })

  const saveMutation = useMutation({
    mutationFn: (body: Record<string, unknown>) =>
      adminFetch(`/couriers/${courier.id}`, { method: "POST", body: JSON.stringify(body) }),
    onSuccess: () => { toast.success("Saved"); onChanged() },
    onError: (err: Error) => toast.error(err.message || "Save failed"),
  })

  return (
    <div className="flex flex-col gap-y-4">
      <div className="flex items-center justify-between">
        <div>
          <Text size="small" weight="plus">Set as active courier</Text>
          <Text size="small" className="text-ui-fg-subtle">
            Only one courier can be active. New fulfillments use the active courier.
          </Text>
        </div>
        <div className="flex items-center gap-x-2">
          {courier.is_active && <Badge color="green" size="2xsmall">Active</Badge>}
          <Button
            size="small"
            variant={courier.is_active ? "secondary" : "primary"}
            disabled={disabled || courier.is_active || activateMutation.isPending}
            isLoading={activateMutation.isPending}
            onClick={() => activateMutation.mutate()}
          >
            {courier.is_active ? "Currently active" : "Set as active"}
          </Button>
        </div>
      </div>

      <div className="flex items-end gap-x-3">
        <div className="flex flex-col gap-y-1 flex-1">
          <Text size="small" weight="plus">Pickup address (optional)</Text>
          <Input value={pickup} onChange={(e) => setPickup(e.target.value)} placeholder="Warehouse / pickup point address" disabled={disabled} />
        </div>
        <Button
          size="small"
          variant="secondary"
          isLoading={saveMutation.isPending}
          disabled={disabled || saveMutation.isPending}
          onClick={() => saveMutation.mutate({ settings: { pickup_address: pickup || null } })}
        >
          Save
        </Button>
      </div>
    </div>
  )
}

export function CouriersSection() {
  const queryClient = useQueryClient()
  const { data, isLoading, error } = useQuery<{ couriers: CourierRow[] }>({
    queryKey: ["admin-couriers"],
    queryFn: () => adminFetch<{ couriers: CourierRow[] }>("/couriers"),
  })

  const refresh = () => queryClient.invalidateQueries({ queryKey: ["admin-couriers"] })

  const couriers = [...(data?.couriers ?? [])].sort(
    (a, b) => ORDER.indexOf(a.courier_id) - ORDER.indexOf(b.courier_id)
  )

  return (
    <div className="flex flex-col gap-y-3">
      <Text size="small" className="text-ui-fg-subtle">
        Configure delivery partners for Bangladesh. Credentials live in server environment variables — only one courier can be active at a time.
      </Text>

      {error && <Alert variant="error">{(error as Error).message || "Failed to load couriers"}</Alert>}
      {isLoading && <Text size="small" className="text-ui-fg-subtle">Loading couriers…</Text>}

      {couriers.map((courier) => (
        <div key={courier.id}>
          <IntegrationSetupGuide config={COURIER_GUIDES[courier.courier_id]}>
            <CourierControls courier={courier} onChanged={refresh} />
          </IntegrationSetupGuide>
        </div>
      ))}
    </div>
  )
}
