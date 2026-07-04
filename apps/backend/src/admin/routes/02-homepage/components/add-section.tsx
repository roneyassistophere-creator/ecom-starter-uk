import {
  Button,
  FocusModal,
  Input,
  Label,
  RadioGroup,
  Select,
  Text,
  toast,
} from "@medusajs/ui"
import { useState } from "react"
import { adminFetch, HomeSection, SectionType } from "../page"

// ─── Constants ────────────────────────────────────────────────────────────────

const SECTION_TYPES: SectionType[] = [
  "hero_carousel",
  "featured_categories",
  "product_showcase",
  "brand_showcase",
]

const TYPE_INFO: Record<SectionType, { label: string; description: string }> = {
  hero_carousel: {
    label: "Hero Carousel",
    description: "Full-width image slides with headings and call-to-action buttons.",
  },
  featured_categories: {
    label: "Featured Categories",
    description: "Showcase product categories in a grid, circles, or scrollable row.",
  },
  product_showcase: {
    label: "Product Showcase",
    description: "Display products manually, by category, or as bestsellers.",
  },
  brand_showcase: {
    label: "Brands Showcase",
    description: "Display your store brands as a logo grid or horizontal scroll.",
  },
}

const LAYOUT_KEYS: Record<SectionType, string[]> = {
  hero_carousel: ["full_width", "boxed", "split"],
  featured_categories: ["grid", "circles", "horizontal_scroll"],
  product_showcase: ["grid_4", "grid_2", "carousel", "list"],
  brand_showcase: ["grid", "horizontal_scroll"],
}

// ─── Component ────────────────────────────────────────────────────────────────

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  onCreated: (section: HomeSection) => void
}

export function AddSectionModal({ open, onOpenChange, onCreated }: Props) {
  const [step, setStep] = useState<"type" | "details">("type")
  const [type, setType] = useState<SectionType>("hero_carousel")
  const [title, setTitle] = useState("")
  const [layout, setLayout] = useState(LAYOUT_KEYS["hero_carousel"][0])
  const [saving, setSaving] = useState(false)

  const reset = () => {
    setStep("type")
    setType("hero_carousel")
    setTitle("")
    setLayout(LAYOUT_KEYS["hero_carousel"][0])
  }

  const handleOpenChange = (next: boolean) => {
    if (!next) reset()
    onOpenChange(next)
  }

  const handleNext = () => {
    setLayout(LAYOUT_KEYS[type][0])
    setStep("details")
  }

  const handleCreate = async () => {
    if (!title.trim()) {
      toast.error("Please enter a title")
      return
    }
    setSaving(true)
    try {
      const data = await adminFetch<{ section: HomeSection }>(
        "/admin/homepage/sections",
        {
          method: "POST",
          body: JSON.stringify({ type, title: title.trim(), layout }),
        }
      )
      toast.success("Section created")
      onCreated(data.section)
      handleOpenChange(false)
    } catch {
      toast.error("Failed to create section")
    } finally {
      setSaving(false)
    }
  }

  return (
    <FocusModal open={open} onOpenChange={handleOpenChange}>
      <FocusModal.Content className="max-w-lg">
        <FocusModal.Header>
          <FocusModal.Title>
            {step === "type" ? "Choose section type" : "Section details"}
          </FocusModal.Title>
        </FocusModal.Header>

        <FocusModal.Body className="p-6">
          {step === "type" ? (
            <RadioGroup
              value={type}
              onValueChange={(v) => setType(v as SectionType)}
              className="flex flex-col gap-y-3"
            >
              {SECTION_TYPES.map((t) => (
                <label
                  key={t}
                  className={[
                    "flex items-start gap-x-3 rounded-lg border p-4 cursor-pointer transition-colors",
                    type === t
                      ? "border-ui-border-interactive bg-ui-bg-highlight"
                      : "border-ui-border-base hover:bg-ui-bg-subtle",
                  ].join(" ")}
                >
                  <RadioGroup.Item value={t} id={t} className="mt-0.5 shrink-0" />
                  <div>
                    <Text weight="plus" size="small">
                      {TYPE_INFO[t].label}
                    </Text>
                    <Text size="small" className="text-ui-fg-subtle mt-0.5">
                      {TYPE_INFO[t].description}
                    </Text>
                  </div>
                </label>
              ))}
            </RadioGroup>
          ) : (
            <div className="flex flex-col gap-y-4">
              <div className="flex flex-col gap-y-1.5">
                <Label htmlFor="new-title" size="small">
                  Title *
                </Label>
                <Input
                  id="new-title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder={`e.g. ${TYPE_INFO[type].label}`}
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleCreate()
                  }}
                />
              </div>

              <div className="flex flex-col gap-y-1.5">
                <Label htmlFor="new-layout" size="small">
                  Layout
                </Label>
                <Select value={layout} onValueChange={setLayout}>
                  <Select.Trigger id="new-layout">
                    <Select.Value />
                  </Select.Trigger>
                  <Select.Content>
                    {LAYOUT_KEYS[type].map((l) => (
                      <Select.Item key={l} value={l}>
                        {l.replace(/_/g, " ")}
                      </Select.Item>
                    ))}
                  </Select.Content>
                </Select>
              </div>
            </div>
          )}
        </FocusModal.Body>

        <FocusModal.Footer>
          <div className="flex w-full items-center justify-between">
            {step === "type" ? (
              <>
                <Button
                  variant="secondary"
                  size="small"
                  onClick={() => handleOpenChange(false)}
                >
                  Cancel
                </Button>
                <Button size="small" onClick={handleNext}>
                  Next
                </Button>
              </>
            ) : (
              <>
                <Button
                  variant="secondary"
                  size="small"
                  onClick={() => setStep("type")}
                >
                  Back
                </Button>
                <Button size="small" onClick={handleCreate} isLoading={saving}>
                  Create Section
                </Button>
              </>
            )}
          </div>
        </FocusModal.Footer>
      </FocusModal.Content>
    </FocusModal>
  )
}
