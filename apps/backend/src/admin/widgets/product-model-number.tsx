import { defineWidgetConfig } from "@medusajs/admin-sdk"
import { Button, Container, Input, Label, Text, toast } from "@medusajs/ui"
import { useState } from "react"

async function adminFetch<T = unknown>(path: string, init?: RequestInit): Promise<T> {
  const token =
    localStorage.getItem("_medusa_auth_token") ||
    localStorage.getItem("medusa_auth_token") ||
    ""

  const res = await fetch(`/admin${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(init?.headers as Record<string, string> | undefined),
    },
  })

  if (!res.ok) throw new Error(`Request failed: ${res.status}`)
  return res.json() as Promise<T>
}

type Product = {
  id: string
  metadata?: Record<string, unknown> | null
}

const BADGE_COLORS = [
  { value: "orange", label: "Orange (Default)" },
  { value: "red", label: "Red" },
  { value: "green", label: "Green" },
  { value: "blue", label: "Blue" },
  { value: "purple", label: "Purple" },
]

const ProductModelNumberWidget = ({ data: product }: { data: Product }) => {
  const [modelNumber, setModelNumber] = useState(
    (product.metadata?.model_number as string) ?? ""
  )
  const [badgeLabel, setBadgeLabel] = useState(
    (product.metadata?.badge_label as string) ?? ""
  )
  const [badgeColor, setBadgeColor] = useState(
    (product.metadata?.badge_color as string) ?? "orange"
  )
  const [saving, setSaving] = useState(false)

  const handleSave = async () => {
    setSaving(true)
    try {
      await adminFetch(`/products/${product.id}`, {
        method: "POST",
        body: JSON.stringify({
          metadata: {
            ...(product.metadata ?? {}),
            model_number: modelNumber.trim() || null,
            badge_label: badgeLabel.trim() || null,
            badge_color: badgeLabel.trim() ? badgeColor : null,
          },
        }),
      })
      toast.success("Product details saved")
    } catch {
      toast.error("Failed to save")
    } finally {
      setSaving(false)
    }
  }

  return (
    <Container className="px-6 py-6 flex flex-col gap-y-5">
      {/* Model Number */}
      <div className="flex flex-col gap-y-3">
        <div>
          <Text size="small" weight="plus">Model Number</Text>
          <Text size="xsmall" className="text-ui-fg-muted mt-1">
            Displayed on the product page and in product specifications.
          </Text>
        </div>
        <div className="flex flex-col gap-y-1">
          <Label>Model / Part Number</Label>
          <Input
            value={modelNumber}
            onChange={(e) => setModelNumber(e.target.value)}
            placeholder="e.g. SKU-1234 or Model XYZ"
          />
        </div>
      </div>

      {/* Badge */}
      <div className="flex flex-col gap-y-3 border-t border-ui-border-base pt-4">
        <div>
          <Text size="small" weight="plus">Custom Badge</Text>
          <Text size="xsmall" className="text-ui-fg-muted mt-1">
            Show a custom label pill on this product's card. Leave blank to disable. Requires "Custom Badges" to be enabled in Product Cards settings.
          </Text>
        </div>
        <div className="flex flex-col gap-y-1">
          <Label>Badge Label</Label>
          <Input
            value={badgeLabel}
            onChange={(e) => setBadgeLabel(e.target.value)}
            placeholder='e.g. Hot Deal, Limited, Staff Pick'
          />
        </div>
        {badgeLabel.trim() && (
          <div className="flex flex-col gap-y-1">
            <Label>Badge Color</Label>
            <select
              value={badgeColor}
              onChange={(e) => setBadgeColor(e.target.value)}
              className="h-8 w-full rounded-md border border-ui-border-base bg-ui-bg-field px-2 text-sm text-ui-fg-base focus:outline-none focus:ring-1 focus:ring-ui-border-interactive"
            >
              {BADGE_COLORS.map((c) => (
                <option key={c.value} value={c.value}>{c.label}</option>
              ))}
            </select>
          </div>
        )}
      </div>

      <div className="flex justify-end">
        <Button size="small" onClick={handleSave} isLoading={saving} disabled={saving}>
          Save
        </Button>
      </div>
    </Container>
  )
}

export const config = defineWidgetConfig({
  zone: "product.details.after",
})

export default ProductModelNumberWidget
