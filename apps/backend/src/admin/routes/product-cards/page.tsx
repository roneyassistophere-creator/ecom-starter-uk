import { defineRouteConfig } from "@medusajs/admin-sdk"
import { SquaresPlus } from "@medusajs/icons"
import {
  Button,
  Container,
  Input,
  Switch,
  Text,
  toast,
} from "@medusajs/ui"
import { useEffect, useState } from "react"
import {
  ALL_FIELDS,
  BadgeSaleFormat,
  CARD_STYLES,
  CardActionMode,
  CardBadgeSettings,
  CardButtonLayout,
  CardFieldKey,
  CardFields,
  CardGridColumns,
  CardStyleKey,
  CardTextAlign,
  DEFAULT_ACTION_MODE,
  DEFAULT_BADGE_SETTINGS,
  DEFAULT_BUTTON_LAYOUT,
  DEFAULT_FIELDS,
  DEFAULT_GRID_COLUMNS,
  DEFAULT_STYLE,
  DEFAULT_TEXT_ALIGN,
} from "../../lib/card-styles"

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

type SettingResponse = {
  setting: {
    product_card_style: CardStyleKey | null
    product_card_fields: CardFields | null
    card_button_layout: CardButtonLayout | null
    card_action_mode: CardActionMode | null
    card_badge_settings: CardBadgeSettings | null
    card_text_align: CardTextAlign | null
    card_grid_columns: CardGridColumns | null
  }
}

type RadioOption<T extends string> = { value: T; label: string; description?: string }

function RadioGroup<T extends string>({
  options,
  value,
  onChange,
  disabled,
}: {
  options: RadioOption<T>[]
  value: T
  onChange: (v: T) => void
  disabled?: boolean
}) {
  return (
    <div className="flex flex-col gap-y-2">
      {options.map((opt) => {
        const selected = value === opt.value
        return (
          <button
            key={opt.value}
            onClick={() => onChange(opt.value)}
            disabled={disabled}
            className={[
              "flex items-start gap-x-3 rounded-xl border px-4 py-3 text-left transition-all duration-150",
              selected
                ? "border-ui-border-interactive bg-ui-bg-interactive-hover shadow-sm"
                : "border-ui-border-base hover:border-ui-border-strong hover:bg-ui-bg-subtle",
            ].join(" ")}
          >
            <div
              className={[
                "mt-0.5 h-4 w-4 shrink-0 rounded-full border-2 flex items-center justify-center",
                selected ? "border-ui-border-interactive" : "border-ui-border-strong",
              ].join(" ")}
            >
              {selected && <div className="h-2 w-2 rounded-full bg-ui-border-interactive" />}
            </div>
            <div className="flex flex-col gap-y-0.5 min-w-0">
              <Text size="small" weight="plus">{opt.label}</Text>
              {opt.description && (
                <Text size="xsmall" className="text-ui-fg-muted">{opt.description}</Text>
              )}
            </div>
          </button>
        )
      })}
    </div>
  )
}

const ProductCardsPage = () => {
  const [style, setStyle] = useState<CardStyleKey>(DEFAULT_STYLE)
  const [fields, setFields] = useState<CardFields>(DEFAULT_FIELDS)
  const [buttonLayout, setButtonLayout] = useState<CardButtonLayout>(DEFAULT_BUTTON_LAYOUT)
  const [actionMode, setActionMode] = useState<CardActionMode>(DEFAULT_ACTION_MODE)
  const [badgeSettings, setBadgeSettings] = useState<CardBadgeSettings>(DEFAULT_BADGE_SETTINGS)
  const [textAlign, setTextAlign] = useState<CardTextAlign>(DEFAULT_TEXT_ALIGN)
  const [gridColumns, setGridColumns] = useState<CardGridColumns>(DEFAULT_GRID_COLUMNS)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    adminFetch<SettingResponse>("/store-settings")
      .then(({ setting }) => {
        setStyle(setting?.product_card_style ?? DEFAULT_STYLE)
        setFields(setting?.product_card_fields ?? DEFAULT_FIELDS)
        setButtonLayout(setting?.card_button_layout ?? DEFAULT_BUTTON_LAYOUT)
        setActionMode(setting?.card_action_mode ?? DEFAULT_ACTION_MODE)
        setBadgeSettings(setting?.card_badge_settings ?? DEFAULT_BADGE_SETTINGS)
        setTextAlign(setting?.card_text_align ?? DEFAULT_TEXT_ALIGN)
        setGridColumns(setting?.card_grid_columns ?? DEFAULT_GRID_COLUMNS)
      })
      .catch(() => toast.error("Failed to load settings"))
      .finally(() => setLoading(false))
  }, [])

  const selectedStyleMeta = CARD_STYLES.find((s) => s.key === style)!

  const handleStyleChange = (newStyle: CardStyleKey) => {
    setStyle(newStyle)
    setFields((prev) => {
      const meta = CARD_STYLES.find((s) => s.key === newStyle)!
      const filtered: CardFields = {}
      for (const f of meta.supportedFields) {
        filtered[f] = prev[f] ?? false
      }
      filtered.name = filtered.name ?? true
      filtered.price = filtered.price ?? true
      return filtered
    })
  }

  const toggleField = (fieldKey: CardFieldKey, checked: boolean) => {
    setFields((prev) => ({ ...prev, [fieldKey]: checked }))
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      await adminFetch("/store-settings", {
        method: "POST",
        body: JSON.stringify({
          product_card_style: style,
          product_card_fields: fields,
          card_button_layout: buttonLayout,
          card_action_mode: actionMode,
          card_badge_settings: badgeSettings,
          card_text_align: textAlign,
          card_grid_columns: gridColumns,
        }),
      })
      toast.success("Card settings saved")
    } catch {
      toast.error("Failed to save")
    } finally {
      setSaving(false)
    }
  }

  const hasButtons =
    selectedStyleMeta.supportedFields.includes("add_to_cart") ||
    selectedStyleMeta.supportedFields.includes("buy_now")

  return (
    <div className="flex flex-col gap-y-4 p-4 max-w-3xl">
      {/* Style Selector */}
      <Container className="px-6 py-6 flex flex-col gap-y-6">
        <div>
          <Text size="large" weight="plus">Product Card Style</Text>
          <Text size="small" className="text-ui-fg-subtle mt-1">
            Choose how products appear in your store, category, collection, and search result listings.
          </Text>
        </div>

        <div className="grid grid-cols-1 gap-y-3">
          {CARD_STYLES.map((s) => {
            const isSelected = style === s.key
            return (
              <button
                key={s.key}
                onClick={() => handleStyleChange(s.key)}
                disabled={loading}
                className={[
                  "flex items-start gap-x-4 rounded-xl border px-4 py-4 text-left transition-all duration-150",
                  isSelected
                    ? "border-ui-border-interactive bg-ui-bg-interactive-hover shadow-sm"
                    : "border-ui-border-base hover:border-ui-border-strong hover:bg-ui-bg-subtle",
                ].join(" ")}
              >
                <div
                  className={[
                    "mt-0.5 h-4 w-4 shrink-0 rounded-full border-2 flex items-center justify-center",
                    isSelected ? "border-ui-border-interactive" : "border-ui-border-strong",
                  ].join(" ")}
                >
                  {isSelected && <div className="h-2 w-2 rounded-full bg-ui-border-interactive" />}
                </div>
                <div className="flex flex-col gap-y-0.5 min-w-0">
                  <Text size="small" weight="plus">{s.label}</Text>
                  <Text size="xsmall" className="text-ui-fg-muted">{s.description}</Text>
                  <Text size="xsmall" className="text-ui-fg-muted mt-1">
                    Shows:{" "}
                    {s.supportedFields
                      .map((fk) => ALL_FIELDS.find((af) => af.key === fk)?.label ?? fk)
                      .join(", ")}
                  </Text>
                </div>
              </button>
            )
          })}
        </div>
      </Container>

      {/* Field Toggles */}
      <Container className="px-6 py-6 flex flex-col gap-y-5">
        <div>
          <Text size="small" weight="plus">Visible Fields</Text>
          <Text size="xsmall" className="text-ui-fg-muted mt-1">
            Toggle which fields appear on{" "}
            <span className="font-semibold">{selectedStyleMeta.label}</span>{" "}
            cards. Fields not supported by the current style are hidden.
          </Text>
        </div>

        <div className="flex flex-col divide-y divide-ui-border-base">
          {ALL_FIELDS.filter((f) => selectedStyleMeta.supportedFields.includes(f.key)).map((f) => (
            <div key={f.key} className="flex items-center justify-between py-3">
              <Text size="small">{f.label}</Text>
              <Switch
                checked={fields[f.key] ?? false}
                onCheckedChange={(checked) => toggleField(f.key, checked)}
                disabled={loading}
              />
            </div>
          ))}
          {selectedStyleMeta.supportedFields.length === 0 && (
            <Text size="small" className="text-ui-fg-muted py-3">
              No configurable fields for this style.
            </Text>
          )}
        </div>
      </Container>

      {/* Grid Columns */}
      <Container className="px-6 py-6 flex flex-col gap-y-5">
        <div>
          <Text size="small" weight="plus">Grid Columns</Text>
          <Text size="xsmall" className="text-ui-fg-muted mt-1">
            How many product cards appear per row on each screen size.
          </Text>
        </div>

        {(
          [
            { label: "Mobile (phones)", key: "mobile" as const, options: [1, 2, 3] },
            { label: "Tablet", key: "tablet" as const, options: [2, 3, 4] },
            { label: "Desktop", key: "desktop" as const, options: [3, 4, 5, 6] },
          ] as const
        ).map(({ label, key, options }) => (
          <div key={key} className="flex items-center justify-between gap-x-4">
            <Text size="small" className="text-ui-fg-subtle w-32 shrink-0">{label}</Text>
            <div className="flex gap-x-2">
              {options.map((n) => {
                const active = gridColumns[key] === n
                return (
                  <button
                    key={n}
                    onClick={() => setGridColumns((p) => ({ ...p, [key]: n }))}
                    disabled={loading}
                    className={[
                      "w-9 h-9 rounded-lg text-sm font-semibold border transition-colors duration-150",
                      active
                        ? "bg-gray-900 text-white border-gray-900"
                        : "bg-ui-bg-subtle text-ui-fg-subtle border-ui-border-base hover:bg-ui-bg-base hover:text-ui-fg-base",
                    ].join(" ")}
                  >
                    {n}
                  </button>
                )
              })}
            </div>
          </div>
        ))}
      </Container>

      {/* Text Alignment â€” only shown for Minimal style */}
      {(style === "minimal" || style === "compact") && (
        <Container className="px-6 py-6 flex flex-col gap-y-5">
          <div>
            <Text size="small" weight="plus">Text Alignment</Text>
            <Text size="xsmall" className="text-ui-fg-muted mt-1">
              Align product name and price on Minimal and Compact cards.
            </Text>
          </div>
          <RadioGroup<CardTextAlign>
            value={textAlign}
            onChange={setTextAlign}
            disabled={loading}
            options={[
              { value: "left", label: "Left", description: "Name and price aligned to the left" },
              { value: "center", label: "Center", description: "Name and price centered (default)" },
              { value: "right", label: "Right", description: "Name and price aligned to the right" },
            ]}
          />
        </Container>
      )}

      {/* Button Layout â€” only shown when style supports buttons */}
      {hasButtons && (
        <Container className="px-6 py-6 flex flex-col gap-y-5">
          <div>
            <Text size="small" weight="plus">Button Layout</Text>
            <Text size="xsmall" className="text-ui-fg-muted mt-1">
              How to arrange buttons when both Add to Cart and Buy Now are enabled.
            </Text>
          </div>
          <RadioGroup<CardButtonLayout>
            value={buttonLayout}
            onChange={setButtonLayout}
            disabled={loading}
            options={[
              { value: "side_by_side", label: "Side by Side", description: "Buttons appear next to each other in a row" },
              { value: "stacked", label: "Stacked", description: "Buttons appear one above the other" },
            ]}
          />
        </Container>
      )}

      {/* Action Mode â€” only shown when style supports buttons */}
      {hasButtons && (
        <Container className="px-6 py-6 flex flex-col gap-y-5">
          <div>
            <Text size="small" weight="plus">Multi-Variant Action</Text>
            <Text size="xsmall" className="text-ui-fg-muted mt-1">
              What happens when a customer clicks a button on a product with multiple variants (e.g. sizes or colors).
            </Text>
          </div>
          <RadioGroup<CardActionMode>
            value={actionMode}
            onChange={setActionMode}
            disabled={loading}
            options={[
              {
                value: "navigate",
                label: "Navigate to Product Page",
                description: "Customers are taken to the full product page to choose their options",
              },
              {
                value: "modal",
                label: "Show Option Selector",
                description: "A quick option picker appears without leaving the page",
              },
            ]}
          />
        </Container>
      )}

      {/* Product Badges */}
      <Container className="px-6 py-6 flex flex-col gap-y-5">
        <div>
          <Text size="small" weight="plus">Product Badges</Text>
          <Text size="xsmall" className="text-ui-fg-muted mt-1">
            Automatically show labels on product cards â€” Sale discounts, new arrivals, or custom per-product tags.
          </Text>
        </div>

        {/* Sale Badge */}
        <div className="flex flex-col gap-y-3 border-b border-ui-border-base pb-4">
          <div className="flex items-center justify-between">
            <div>
              <Text size="small" weight="plus">Sale Badge</Text>
              <Text size="xsmall" className="text-ui-fg-muted">
                Show a badge when a product has a sale price
              </Text>
            </div>
            <Switch
              checked={badgeSettings.sale}
              onCheckedChange={(checked) => setBadgeSettings((p) => ({ ...p, sale: checked }))}
              disabled={loading}
            />
          </div>
          {badgeSettings.sale && (
            <RadioGroup<BadgeSaleFormat>
              value={badgeSettings.sale_format}
              onChange={(v) => setBadgeSettings((p) => ({ ...p, sale_format: v }))}
              disabled={loading}
              options={[
                { value: "label", label: "Sale Label", description: 'Shows "Sale" on discounted products' },
                { value: "percent", label: "Percent Off", description: 'Shows "âˆ’20%" with the actual discount amount' },
              ]}
            />
          )}
        </div>

        {/* New Arrival Badge */}
        <div className="flex flex-col gap-y-3 border-b border-ui-border-base pb-4">
          <div className="flex items-center justify-between">
            <div>
              <Text size="small" weight="plus">New Arrival Badge</Text>
              <Text size="xsmall" className="text-ui-fg-muted">
                Show a "New" badge on recently added products
              </Text>
            </div>
            <Switch
              checked={badgeSettings.new_arrival}
              onCheckedChange={(checked) => setBadgeSettings((p) => ({ ...p, new_arrival: checked }))}
              disabled={loading}
            />
          </div>
          {badgeSettings.new_arrival && (
            <div className="flex items-center gap-x-3">
              <Text size="small" className="text-ui-fg-subtle shrink-0">Show "New" for</Text>
              <Input
                type="number"
                min={1}
                max={365}
                value={badgeSettings.new_days}
                onChange={(e) =>
                  setBadgeSettings((p) => ({ ...p, new_days: Math.max(1, parseInt(e.target.value) || 1) }))
                }
                className="w-24"
                disabled={loading}
              />
              <Text size="small" className="text-ui-fg-subtle shrink-0">days after creation</Text>
            </div>
          )}
        </div>

        {/* Custom Badge */}
        <div className="flex items-center justify-between">
          <div>
            <Text size="small" weight="plus">Custom Badges</Text>
            <Text size="xsmall" className="text-ui-fg-muted">
              Show per-product custom labels. Set "Badge Label" and "Badge Color" in each product's widget below the product details.
            </Text>
          </div>
          <Switch
            checked={badgeSettings.custom}
            onCheckedChange={(checked) => setBadgeSettings((p) => ({ ...p, custom: checked }))}
            disabled={loading}
          />
        </div>
      </Container>

      {/* Save */}
      <div className="flex justify-end">
        <Button onClick={handleSave} isLoading={saving} disabled={loading || saving}>
          Save
        </Button>
      </div>
    </div>
  )
}

export const config = defineRouteConfig({
  label: "Product Cards",
  rank: 3,
  icon: SquaresPlus,
})

export default ProductCardsPage
