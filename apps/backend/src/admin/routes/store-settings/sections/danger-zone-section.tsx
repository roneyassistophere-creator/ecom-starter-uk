import { useState } from "react"
import {
  Badge,
  Button,
  Container,
  Input,
  Label,
  Prompt,
  RadioGroup,
  Switch,
  Text,
  toast,
} from "@medusajs/ui"
import { adminFetch } from "../../../lib/api"

const CONFIRM_PHRASE = "store reset"

export function DangerZoneSection() {
  const [invEnabled, setInvEnabled] = useState(false)
  const [invValue, setInvValue] = useState<"0" | "1">("0")
  const [ordersEnabled, setOrdersEnabled] = useState(false)
  const [custEnabled, setCustEnabled] = useState(false)
  const [custMode, setCustMode] = useState<"accounts" | "identities">("accounts")
  const [confirmText, setConfirmText] = useState("")
  const [busy, setBusy] = useState(false)
  const [promptOpen, setPromptOpen] = useState(false)

  const anySelected = invEnabled || ordersEnabled || custEnabled
  const confirmOk = confirmText.trim() === CONFIRM_PHRASE
  const canRun = anySelected && confirmOk && !busy

  const run = async () => {
    setBusy(true)
    try {
      const result = await adminFetch<{ success: boolean; summary: Record<string, any>; errors: Record<string, string> }>(
        "/store-reset",
        {
          method: "POST",
          body: JSON.stringify({
            confirm: CONFIRM_PHRASE,
            inventory: invEnabled ? { enabled: true, value: Number(invValue) } : undefined,
            orders: ordersEnabled,
            customers: custEnabled ? { enabled: true, identities: custMode === "identities" } : undefined,
          }),
        }
      )
      const parts: string[] = []
      if (result.summary?.inventory) parts.push(`inventory → ${result.summary.inventory.set_to} (${result.summary.inventory.levels_updated} levels)`)
      if (result.summary?.orders) parts.push(`${result.summary.orders.orders} orders, ${result.summary.orders.carts} carts`)
      if (result.summary?.customers) parts.push(`${result.summary.customers.customers} customers`)
      if (result.success) {
        toast.success(`Store reset complete — ${parts.join("; ") || "nothing to reset"}`)
      } else {
        toast.warning(`Reset ran with some errors: ${Object.entries(result.errors).map(([k, v]) => `${k}: ${v}`).join("; ")}`)
      }
      setConfirmText("")
    } catch (err: any) {
      toast.error(err.message || "Reset failed")
    } finally {
      setBusy(false)
      setPromptOpen(false)
    }
  }

  return (
    <Container className="p-0 overflow-hidden border border-ui-tag-red-border">
      <div className="px-6 py-4 bg-ui-tag-red-bg flex items-center gap-x-2">
        <Badge color="red" size="xsmall">Danger</Badge>
        <Text size="small" weight="plus" className="text-ui-tag-red-text">
          Hard reset — permanently clears the selected data
        </Text>
      </div>

      <div className="px-6 py-5 flex flex-col gap-y-6">
        <Text size="small" className="text-ui-fg-subtle">
          This wipes the data you select below so the store starts fresh. Products, categories,
          prices, and settings are kept. Deleted records are hidden everywhere (including sales
          insights) and cannot be restored from the admin. There is no undo — use with care.
        </Text>

        {/* Inventory */}
        <div className="flex flex-col gap-y-3 border-t border-ui-border-base pt-4">
          <div className="flex items-center justify-between">
            <div>
              <Text size="small" weight="plus">Reset inventory quantity</Text>
              <Text size="xsmall" className="text-ui-fg-muted">Set every stock level to a fixed value.</Text>
            </div>
            <Switch checked={invEnabled} onCheckedChange={setInvEnabled} disabled={busy} />
          </div>
          {invEnabled && (
            <RadioGroup value={invValue} onValueChange={(v) => setInvValue(v as "0" | "1")} className="flex flex-row gap-x-6">
              <div className="flex items-center gap-x-2">
                <RadioGroup.Item value="0" id="inv-0" />
                <Label htmlFor="inv-0" weight="plus">Set all to 0</Label>
              </div>
              <div className="flex items-center gap-x-2">
                <RadioGroup.Item value="1" id="inv-1" />
                <Label htmlFor="inv-1" weight="plus">Set all to 1</Label>
              </div>
            </RadioGroup>
          )}
        </div>

        {/* Orders & sales */}
        <div className="flex items-center justify-between border-t border-ui-border-base pt-4">
          <div>
            <Text size="small" weight="plus">Reset orders & sales data</Text>
            <Text size="xsmall" className="text-ui-fg-muted">Deletes orders, draft orders, carts, and returns/exchanges. Sales insights reset to zero.</Text>
          </div>
          <Switch checked={ordersEnabled} onCheckedChange={setOrdersEnabled} disabled={busy} />
        </div>

        {/* Customers */}
        <div className="flex flex-col gap-y-3 border-t border-ui-border-base pt-4">
          <div className="flex items-center justify-between">
            <div>
              <Text size="small" weight="plus">Reset customer data <span className="text-ui-fg-muted">(optional)</span></Text>
              <Text size="xsmall" className="text-ui-fg-muted">Deletes customer accounts and their addresses.</Text>
            </div>
            <Switch checked={custEnabled} onCheckedChange={setCustEnabled} disabled={busy} />
          </div>
          {custEnabled && (
            <RadioGroup value={custMode} onValueChange={(v) => setCustMode(v as "accounts" | "identities")} className="flex flex-col gap-y-2">
              <div className="flex items-center gap-x-2">
                <RadioGroup.Item value="accounts" id="cust-a" />
                <Label htmlFor="cust-a">Accounts &amp; addresses only</Label>
              </div>
              <div className="flex items-center gap-x-2">
                <RadioGroup.Item value="identities" id="cust-i" />
                <Label htmlFor="cust-i">Accounts, addresses &amp; login identities (frees emails/phones to re-register)</Label>
              </div>
            </RadioGroup>
          )}
        </div>

        {/* Confirm */}
        <div className="flex flex-col gap-y-2 border-t border-ui-border-base pt-4">
          <Label htmlFor="reset-confirm">
            Type <span className="font-mono text-ui-fg-base">store reset</span> to enable the button
          </Label>
          <Input
            id="reset-confirm"
            value={confirmText}
            onChange={(e) => setConfirmText(e.target.value)}
            placeholder="store reset"
            autoComplete="off"
            disabled={busy}
          />
        </div>

        <div className="flex justify-end">
          <Button variant="danger" disabled={!canRun} isLoading={busy} onClick={() => setPromptOpen(true)}>
            Hard reset store
          </Button>
        </div>
      </div>

      <Prompt open={promptOpen} onOpenChange={setPromptOpen} variant="danger">
        <Prompt.Content>
          <Prompt.Header>
            <Prompt.Title>Reset the store?</Prompt.Title>
            <Prompt.Description>
              This permanently clears the selected data
              {invEnabled ? ` · inventory → ${invValue}` : ""}
              {ordersEnabled ? " · orders & sales" : ""}
              {custEnabled ? ` · customers${custMode === "identities" ? " + logins" : ""}` : ""}
              . This cannot be undone from the admin.
            </Prompt.Description>
          </Prompt.Header>
          <Prompt.Footer>
            <Prompt.Cancel disabled={busy}>Cancel</Prompt.Cancel>
            <Prompt.Action onClick={run}>Yes, reset now</Prompt.Action>
          </Prompt.Footer>
        </Prompt.Content>
      </Prompt>
    </Container>
  )
}
