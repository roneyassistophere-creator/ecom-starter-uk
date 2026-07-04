import {
  Button,
  Drawer,
  Heading,
  IconButton,
  Input,
  Label,
  RadioGroup,
  Select,
  Text,
  toast,
  usePrompt,
} from "@medusajs/ui"
import { ArrowDown, ArrowUpMini, PencilSquare, Plus, Trash } from "@medusajs/icons"
import { useEffect, useRef, useState } from "react"
import { adminFetch, HomeSection, HomeSlide, SectionType } from "../page"

// â"€â"€â"€ Constants â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€

const LAYOUT_KEYS: Record<SectionType, string[]> = {
  hero_carousel: ["full_width", "boxed", "split"],
  featured_categories: ["grid", "circles", "horizontal_scroll"],
  product_showcase: ["grid_4", "grid_2", "carousel", "list"],
  brand_showcase: ["grid", "horizontal_scroll"],
}

// â"€â"€â"€ Section metadata (title + layout) â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€

function MetaEditor({
  section,
  onSave,
}: {
  section: HomeSection
  onSave: (update: { title?: string; layout?: string }) => Promise<void>
}) {
  const [title, setTitle] = useState(section.title)
  const [layout, setLayout] = useState(section.layout)
  const [saving, setSaving] = useState(false)

  const isDirty = title !== section.title || layout !== section.layout

  const save = async () => {
    if (!title.trim()) {
      toast.error("Title is required")
      return
    }
    setSaving(true)
    try {
      await onSave({ title: title.trim(), layout })
      toast.success("Settings saved")
    } catch {
      toast.error("Failed to save settings")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="flex flex-col gap-y-4">
      <div className="flex flex-col gap-y-1.5">
        <Label htmlFor="meta-title" size="small">
          Title
        </Label>
        <Input
          id="meta-title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
      </div>

      <div className="flex flex-col gap-y-1.5">
        <Label htmlFor="meta-layout" size="small">
          Layout
        </Label>
        <Select value={layout} onValueChange={setLayout}>
          <Select.Trigger id="meta-layout">
            <Select.Value />
          </Select.Trigger>
          <Select.Content>
            {LAYOUT_KEYS[section.type].map((l) => (
              <Select.Item key={l} value={l}>
                {l.replace(/_/g, " ")}
              </Select.Item>
            ))}
          </Select.Content>
        </Select>
      </div>

      {isDirty && (
        <Button size="small" isLoading={saving} onClick={save}>
          Save changes
        </Button>
      )}
    </div>
  )
}

// â"€â"€â"€ Slide form (add or edit a single slide) â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€

function SlideForm({
  sectionId,
  slide,
  onSaved,
  onCancel,
}: {
  sectionId: string
  slide: HomeSlide | null
  onSaved: (slide: HomeSlide) => void
  onCancel: () => void
}) {
  const [imageUrl, setImageUrl] = useState(slide?.image_url ?? "")
  const [mobileImageUrl, setMobileImageUrl] = useState(
    slide?.mobile_image_url ?? ""
  )
  const [heading, setHeading] = useState(slide?.heading ?? "")
  const [subheading, setSubheading] = useState(slide?.subheading ?? "")
  const [ctaLabel, setCtaLabel] = useState(slide?.cta_label ?? "")
  const [ctaLink, setCtaLink] = useState(slide?.cta_link ?? "")
  const [uploading, setUploading] = useState(false)
  const [saving, setSaving] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)
  const mobileFileRef = useRef<HTMLInputElement>(null)

  const uploadImage = async (file: File, target: "main" | "mobile") => {
    setUploading(true)
    try {
      const fd = new FormData()
      fd.append("file", file)
      const data = await adminFetch<{ url: string }>("/admin/homepage/upload", {
        method: "POST",
        body: fd,
      })
      if (target === "main") setImageUrl(data.url)
      else setMobileImageUrl(data.url)
    } catch {
      toast.error("Upload failed")
    } finally {
      setUploading(false)
    }
  }

  const save = async () => {
    if (!imageUrl.trim()) {
      toast.error("Main image URL is required")
      return
    }
    setSaving(true)
    const payload = {
      image_url: imageUrl.trim(),
      mobile_image_url: mobileImageUrl.trim() || null,
      heading: heading.trim() || null,
      subheading: subheading.trim() || null,
      cta_label: ctaLabel.trim() || null,
      cta_link: ctaLink.trim() || null,
    }
    try {
      let data: { slide: HomeSlide }
      if (slide) {
        data = await adminFetch<{ slide: HomeSlide }>(
          `/admin/homepage/slides/${slide.id}`,
          { method: "POST", body: JSON.stringify(payload) }
        )
      } else {
        data = await adminFetch<{ slide: HomeSlide }>(
          `/admin/homepage/sections/${sectionId}/slides`,
          { method: "POST", body: JSON.stringify(payload) }
        )
      }
      toast.success(slide ? "Slide updated" : "Slide added")
      onSaved(data.slide)
    } catch {
      toast.error("Failed to save slide")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="flex flex-col gap-y-3 rounded-lg border border-ui-border-interactive bg-ui-bg-subtle p-4">
      <Text weight="plus" size="small">
        {slide ? "Edit slide" : "New slide"}
      </Text>

      {/* Main image */}
      <div className="flex flex-col gap-y-1.5">
        <Label size="small">
          Main image *
        </Label>
        <div className="flex gap-x-2">
          <Input
            value={imageUrl}
            onChange={(e) => setImageUrl(e.target.value)}
            placeholder="https://..."
            className="flex-1"
          />
          <Button
            size="small"
            variant="secondary"
            isLoading={uploading}
            onClick={() => fileRef.current?.click()}
          >
            Upload
          </Button>
        </div>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0]
            if (f) uploadImage(f, "main")
            e.target.value = ""
          }}
        />
        {imageUrl && (
          <img
            src={imageUrl}
            alt="preview"
            className="mt-1 h-28 w-full rounded object-cover"
          />
        )}
      </div>

      {/* Mobile image */}
      <div className="flex flex-col gap-y-1.5">
        <Label size="small">Mobile image (optional)</Label>
        <div className="flex gap-x-2">
          <Input
            value={mobileImageUrl}
            onChange={(e) => setMobileImageUrl(e.target.value)}
            placeholder="https://..."
            className="flex-1"
          />
          <Button
            size="small"
            variant="secondary"
            isLoading={uploading}
            onClick={() => mobileFileRef.current?.click()}
          >
            Upload
          </Button>
        </div>
        <input
          ref={mobileFileRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0]
            if (f) uploadImage(f, "mobile")
            e.target.value = ""
          }}
        />
      </div>

      {/* Text fields */}
      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-y-1.5">
          <Label size="small">Heading</Label>
          <Input
            value={heading}
            onChange={(e) => setHeading(e.target.value)}
            placeholder="Summer Sale"
          />
        </div>
        <div className="flex flex-col gap-y-1.5">
          <Label size="small">Subheading</Label>
          <Input
            value={subheading}
            onChange={(e) => setSubheading(e.target.value)}
            placeholder="Up to 50% off"
          />
        </div>
        <div className="flex flex-col gap-y-1.5">
          <Label size="small">CTA label</Label>
          <Input
            value={ctaLabel}
            onChange={(e) => setCtaLabel(e.target.value)}
            placeholder="Shop Now"
          />
        </div>
        <div className="flex flex-col gap-y-1.5">
          <Label size="small">CTA link</Label>
          <Input
            value={ctaLink}
            onChange={(e) => setCtaLink(e.target.value)}
            placeholder="/collections/all"
          />
        </div>
      </div>

      <div className="flex justify-end gap-x-2 pt-1">
        <Button size="small" variant="secondary" onClick={onCancel}>
          Cancel
        </Button>
        <Button size="small" isLoading={saving} onClick={save}>
          {slide ? "Update slide" : "Add slide"}
        </Button>
      </div>
    </div>
  )
}

// ─── Split Panel editor (right-side static promo for "split" layout) ──────────

function SplitPanelEditor({ section }: { section: HomeSection }) {
  const cfg = (section.settings as Record<string, string | null> | null) ?? {}
  const [imageUrl, setImageUrl]     = useState<string>(cfg.split_image_url  ?? "")
  const [heading, setHeading]       = useState<string>(cfg.split_heading    ?? "")
  const [subheading, setSubheading] = useState<string>(cfg.split_subheading ?? "")
  const [ctaLabel, setCtaLabel]     = useState<string>(cfg.split_cta_label  ?? "")
  const [ctaLink, setCtaLink]       = useState<string>(cfg.split_cta_link   ?? "")
  const [uploading, setUploading]   = useState(false)
  const [saving, setSaving]         = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  const uploadImage = async (file: File) => {
    setUploading(true)
    try {
      const fd = new FormData()
      fd.append("file", file)
      const data = await adminFetch<{ url: string }>("/admin/homepage/upload", {
        method: "POST",
        body: fd,
      })
      setImageUrl(data.url)
    } catch {
      toast.error("Upload failed")
    } finally {
      setUploading(false)
    }
  }

  const save = async () => {
    if (!imageUrl.trim()) {
      toast.error("Split image URL is required")
      return
    }
    setSaving(true)
    try {
      await adminFetch(`/admin/homepage/sections/${section.id}`, {
        method: "POST",
        body: JSON.stringify({
          settings: {
            split_image_url:  imageUrl.trim(),
            split_heading:    heading.trim()    || null,
            split_subheading: subheading.trim() || null,
            split_cta_label:  ctaLabel.trim()   || null,
            split_cta_link:   ctaLink.trim()    || null,
          },
        }),
      })
      toast.success("Split panel saved")
    } catch {
      toast.error("Failed to save split panel")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="flex flex-col gap-y-3">
      <div className="flex flex-col gap-y-1.5">
        <Label size="small">Right panel image *</Label>
        <div className="flex gap-x-2">
          <Input
            value={imageUrl}
            onChange={(e) => setImageUrl(e.target.value)}
            placeholder="https://..."
            className="flex-1"
          />
          <Button size="small" variant="secondary" isLoading={uploading} onClick={() => fileRef.current?.click()}>
            Upload
          </Button>
        </div>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0]
            if (f) uploadImage(f)
            e.target.value = ""
          }}
        />
        {imageUrl && (
          <img src={imageUrl} alt="preview" className="mt-1 h-28 w-full rounded object-cover" />
        )}
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-y-1.5">
          <Label size="small">Heading</Label>
          <Input value={heading} onChange={(e) => setHeading(e.target.value)} placeholder="Promo heading" />
        </div>
        <div className="flex flex-col gap-y-1.5">
          <Label size="small">Subheading</Label>
          <Input value={subheading} onChange={(e) => setSubheading(e.target.value)} placeholder="Tagline" />
        </div>
        <div className="flex flex-col gap-y-1.5">
          <Label size="small">CTA label</Label>
          <Input value={ctaLabel} onChange={(e) => setCtaLabel(e.target.value)} placeholder="Pre-order now" />
        </div>
        <div className="flex flex-col gap-y-1.5">
          <Label size="small">CTA link</Label>
          <Input value={ctaLink} onChange={(e) => setCtaLink(e.target.value)} placeholder="/products/mango" />
        </div>
      </div>
      <Button size="small" isLoading={saving} onClick={save}>
        Save split panel
      </Button>
    </div>
  )
}

// --- Hero mobile appearance editor -------------------------------------------

type MobileAspect = "square" | "rectangle" | "wide"

const MOBILE_ASPECT_OPTIONS: Array<{ value: MobileAspect; label: string; desc: string }> = [
  { value: "rectangle", label: "Rectangle (4:3)", desc: "Classic banner ratio (default)" },
  { value: "square",    label: "Square (1:1)",    desc: "Equal width and height" },
  { value: "wide",      label: "Wide (16:9)",     desc: "Cinematic / video ratio" },
]

function HeroMobileEditor({ section }: { section: HomeSection }) {
  const cfg = (section.settings as any) ?? {}
  const [aspect, setAspect] = useState<MobileAspect>(
    (cfg.mobile_aspect as MobileAspect) ?? "rectangle"
  )
  const [saving, setSaving] = useState(false)

  const save = async () => {
    setSaving(true)
    try {
      await adminFetch(`/admin/homepage/sections/${section.id}`, {
        method: "POST",
        body: JSON.stringify({ settings: { mobile_aspect: aspect } }),
      })
      toast.success("Mobile appearance saved")
    } catch {
      toast.error("Failed to save")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="flex flex-col gap-y-3">
      <Text size="small" className="text-ui-fg-subtle">
        Controls the hero height on mobile screens.
      </Text>
      <RadioGroup
        value={aspect}
        onValueChange={(v) => setAspect(v as MobileAspect)}
        className="flex flex-col gap-y-2"
      >
        {MOBILE_ASPECT_OPTIONS.map((opt) => (
          <label
            key={opt.value}
            className="flex cursor-pointer items-start gap-x-2 rounded-lg border border-ui-border-base p-2.5 hover:bg-ui-bg-subtle"
          >
            <RadioGroup.Item value={opt.value} id={"ma-" + opt.value} className="mt-0.5" />
            <div>
              <Text size="small" weight="plus">{opt.label}</Text>
              <Text size="xsmall" className="text-ui-fg-subtle">{opt.desc}</Text>
            </div>
          </label>
        ))}
      </RadioGroup>
      <Button size="small" isLoading={saving} onClick={save}>
        Save mobile shape
      </Button>
    </div>
  )
}

// ─── Hero Carousel editor ──────────────────────────────────────────────────────

function HeroEditor({ section }: { section: HomeSection }) {
  const [slides, setSlides] = useState<HomeSlide[]>(
    [...(section.slides ?? [])].sort((a, b) => a.position - b.position)
  )
  const [addingSlide, setAddingSlide] = useState(false)
  const [editingSlide, setEditingSlide] = useState<HomeSlide | null>(null)
  const prompt = usePrompt()

  const moveSlide = async (index: number, dir: "up" | "down") => {
    const next = [...slides]
    const target = dir === "up" ? index - 1 : index + 1
    if (target < 0 || target >= next.length) return
    ;[next[index], next[target]] = [next[target], next[index]]
    setSlides(next)
    try {
      await adminFetch("/admin/homepage/slides/reorder", {
        method: "POST",
        body: JSON.stringify({ ids: next.map((s) => s.id) }),
      })
    } catch {
      toast.error("Failed to reorder slides")
    }
  }

  const deleteSlide = async (slide: HomeSlide) => {
    const confirmed = await prompt({
      title: "Delete slide?",
      description: "This cannot be undone.",
      confirmText: "Delete",
      cancelText: "Cancel",
    })
    if (!confirmed) return
    try {
      await adminFetch(`/admin/homepage/slides/${slide.id}`, {
        method: "DELETE",
      })
      setSlides((prev) => prev.filter((s) => s.id !== slide.id))
      toast.success("Slide deleted")
    } catch {
      toast.error("Failed to delete slide")
    }
  }

  return (
    <div className="flex flex-col gap-y-3">
      <div className="flex items-center justify-between">
        <Text weight="plus" size="small">
          Slides ({slides.length})
        </Text>
        {!addingSlide && !editingSlide && (
          <Button
            size="small"
            variant="secondary"
            onClick={() => setAddingSlide(true)}
          >
            <Plus className="mr-1" />
            Add slide
          </Button>
        )}
      </div>

      {slides.length === 0 && !addingSlide && (
        <Text size="small" className="text-ui-fg-subtle">
          No slides yet. Add your first slide to populate the carousel.
        </Text>
      )}

      {slides.map((slide, i) => {
        if (editingSlide?.id === slide.id) {
          return (
            <SlideForm
              key={slide.id}
              sectionId={section.id}
              slide={slide}
              onSaved={(updated) => {
                setSlides((prev) =>
                  prev.map((s) => (s.id === updated.id ? updated : s))
                )
                setEditingSlide(null)
              }}
              onCancel={() => setEditingSlide(null)}
            />
          )
        }

        return (
          <div
            key={slide.id}
            className="flex items-start gap-x-3 rounded-lg border border-ui-border-base p-3"
          >
            {slide.image_url && (
              <img
                src={slide.image_url}
                alt=""
                className="h-14 w-20 shrink-0 rounded object-cover"
              />
            )}
            <div className="flex-1 min-w-0">
              <Text weight="plus" size="small">
                {slide.heading || "(no heading)"}
              </Text>
              {slide.subheading && (
                <Text size="small" className="text-ui-fg-subtle truncate">
                  {slide.subheading}
                </Text>
              )}
              {slide.cta_label && (
                <Text size="xsmall" className="text-ui-fg-muted">
                  CTA: {slide.cta_label}
                </Text>
              )}
            </div>
            <div className="flex items-center gap-x-1 shrink-0">
              <IconButton
                size="small"
                variant="transparent"
                disabled={i === 0}
                onClick={() => moveSlide(i, "up")}
              >
                <ArrowUpMini />
              </IconButton>
              <IconButton
                size="small"
                variant="transparent"
                disabled={i === slides.length - 1}
                onClick={() => moveSlide(i, "down")}
              >
                <ArrowDown />
              </IconButton>
              <IconButton
                size="small"
                variant="transparent"
                onClick={() => setEditingSlide(slide)}
              >
                <PencilSquare />
              </IconButton>
              <IconButton
                size="small"
                variant="transparent"
                className="text-ui-fg-error hover:text-ui-fg-error"
                onClick={() => deleteSlide(slide)}
              >
                <Trash />
              </IconButton>
            </div>
          </div>
        )
      })}

      {addingSlide && (
        <SlideForm
          sectionId={section.id}
          slide={null}
          onSaved={(created) => {
            setSlides((prev) => [...prev, created])
            setAddingSlide(false)
          }}
          onCancel={() => setAddingSlide(false)}
        />
      )}
    </div>
  )
}

// â"€â"€â"€ Featured Categories editor â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€

// --- Mobile layout picker (shared by CategoriesEditor + ShowcaseEditor) ------

type MobileLayoutValue = "grid_2" | "carousel" | "strip"

const MOBILE_LAYOUT_OPTIONS: Array<{ value: MobileLayoutValue; label: string; desc: string }> = [
  { value: "grid_2",   label: "2-column grid",  desc: "Compact 2-col grid of cards" },
  { value: "carousel", label: "Carousel",        desc: "Horizontal scroll with arrows" },
  { value: "strip",    label: "Peek strip",      desc: "2-3 items visible + See all link" },
]

function MobileLayoutPicker({
  value,
  onChange,
}: {
  value: MobileLayoutValue
  onChange: (v: MobileLayoutValue) => void
}) {
  return (
    <div className="flex flex-col gap-y-2">
      <Label size="small">Mobile layout</Label>
      <RadioGroup
        value={value}
        onValueChange={(v) => onChange(v as MobileLayoutValue)}
        className="flex flex-col gap-y-2"
      >
        {MOBILE_LAYOUT_OPTIONS.map((opt) => (
          <label
            key={opt.value}
            className="flex cursor-pointer items-start gap-x-2 rounded-lg border border-ui-border-base p-2.5 hover:bg-ui-bg-subtle"
          >
            <RadioGroup.Item value={opt.value} id={"ml-" + opt.value} className="mt-0.5" />
            <div>
              <Text size="small" weight="plus">{opt.label}</Text>
              <Text size="xsmall" className="text-ui-fg-subtle">{opt.desc}</Text>
            </div>
          </label>
        ))}
      </RadioGroup>
    </div>
  )
}

interface Category {
  id: string
  name: string
  handle: string
}

function CategoriesEditor({ section }: { section: HomeSection }) {
  const [categories, setCategories] = useState<Category[]>([])
  const [selected, setSelected] = useState<string[]>(
    ((section.settings as any)?.category_ids as string[]) ?? []
  )
  const [mobileLayout, setMobileLayout] = useState<MobileLayoutValue>(
    ((section.settings as any)?.mobile_layout as MobileLayoutValue) ?? "grid_2"
  )
  const [search, setSearch] = useState("")
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    adminFetch<{ product_categories: Category[] }>(
      "/admin/product-categories?limit=200&include_descendants_tree=false"
    )
      .then((data) => setCategories(data.product_categories ?? []))
      .catch(() => toast.error("Failed to load categories"))
      .finally(() => setLoading(false))
  }, [])

  const toggle = (id: string) => {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    )
  }

  const save = async () => {
    setSaving(true)
    try {
      await adminFetch(`/admin/homepage/sections/${section.id}`, {
        method: "POST",
        body: JSON.stringify({ settings: { category_ids: selected, mobile_layout: mobileLayout } }),
      })
      toast.success("Categories saved")
    } catch {
      toast.error("Failed to save categories")
    } finally {
      setSaving(false)
    }
  }

  const filtered = categories.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="flex flex-col gap-y-3">
      <Text size="small" className="text-ui-fg-subtle">
        Choose categories to feature. Leave empty to auto-display all top-level categories.
      </Text>

      {selected.length > 0 && (
        <Text size="small">
          {selected.length} categor{selected.length === 1 ? "y" : "ies"} selected
        </Text>
      )}

      <Input
        placeholder="Search categories..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      {loading ? (
        <Text size="small" className="text-ui-fg-subtle">
          Loading categories...
        </Text>
      ) : (
        <div className="max-h-60 overflow-y-auto rounded-lg border border-ui-border-base">
          {filtered.length === 0 ? (
            <Text size="small" className="text-ui-fg-subtle px-3 py-2">
              No categories found.
            </Text>
          ) : (
            filtered.map((cat) => (
              <label
                key={cat.id}
                className="flex cursor-pointer items-center gap-x-2.5 border-b border-ui-border-base px-3 py-2 last:border-b-0 hover:bg-ui-bg-subtle"
              >
                <input
                  type="checkbox"
                  checked={selected.includes(cat.id)}
                  onChange={() => toggle(cat.id)}
                  className="h-4 w-4 rounded"
                />
                <Text size="small">{cat.name}</Text>
              </label>
            ))
          )}
        </div>
      )}

      <hr className="border-ui-border-base" />
      <MobileLayoutPicker value={mobileLayout} onChange={setMobileLayout} />

      <Button size="small" isLoading={saving} onClick={save}>
        Save categories
      </Button>
    </div>
  )
}

// â"€â"€â"€ Product Showcase editor â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€

interface Product {
  id: string
  title: string
  thumbnail: string | null
}

type ShowcaseSource = "manual" | "category" | "bestsellers"

function ShowcaseEditor({ section }: { section: HomeSection }) {
  const existing = (section.settings as any) ?? {}
  const [source, setSource] = useState<ShowcaseSource>(
    existing.source ?? "bestsellers"
  )
  const [categoryId, setCategoryId] = useState<string>(
    existing.category_id ?? ""
  )
  const [productIds, setProductIds] = useState<string[]>(
    existing.product_ids ?? []
  )
  const [limit, setLimit] = useState<number>(existing.limit ?? 8)
  const [timeWindowDays, setTimeWindowDays] = useState<number>(
    existing.time_window_days ?? 30
  )
  const [mobileLayout, setMobileLayout] = useState<MobileLayoutValue>(
    (existing.mobile_layout as MobileLayoutValue) ?? "grid_2"
  )
  const [categories, setCategories] = useState<Category[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [productSearch, setProductSearch] = useState("")
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    adminFetch<{ product_categories: Category[] }>(
      "/admin/product-categories?limit=200"
    )
      .then((d) => setCategories(d.product_categories ?? []))
      .catch(() => {})
  }, [])

  useEffect(() => {
    if (source !== "manual") return
    const q = productSearch
      ? `&q=${encodeURIComponent(productSearch)}`
      : ""
    adminFetch<{ products: Product[] }>(
      `/admin/products?limit=50${q}&fields=id,title,thumbnail`
    )
      .then((d) => setProducts(d.products ?? []))
      .catch(() => {})
  }, [source, productSearch])

  const toggleProduct = (id: string) => {
    setProductIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    )
  }

  const save = async () => {
    setSaving(true)
    const settings: Record<string, unknown> = { source, limit, mobile_layout: mobileLayout }
    if (source === "category") settings.category_id = categoryId
    if (source === "manual") settings.product_ids = productIds
    if (source === "bestsellers") settings.time_window_days = timeWindowDays
    try {
      await adminFetch(`/admin/homepage/sections/${section.id}`, {
        method: "POST",
        body: JSON.stringify({ settings }),
      })
      toast.success("Showcase settings saved")
    } catch {
      toast.error("Failed to save settings")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="flex flex-col gap-y-4">
      {/* Source */}
      <div className="flex flex-col gap-y-1.5">
        <Label size="small">
          Product source
        </Label>
        <RadioGroup
          value={source}
          onValueChange={(v) => setSource(v as ShowcaseSource)}
          className="flex flex-col gap-y-2"
        >
          {(
            [
              ["manual", "Manual selection"],
              ["category", "By category"],
              ["bestsellers", "Bestsellers"],
            ] as const
          ).map(([val, label]) => (
            <label
              key={val}
              className="flex cursor-pointer items-center gap-x-2"
            >
              <RadioGroup.Item value={val} id={`src-${val}`} />
              <Text size="small">{label}</Text>
            </label>
          ))}
        </RadioGroup>
      </div>

      {/* Category picker */}
      {source === "category" && (
        <div className="flex flex-col gap-y-1.5">
          <Label size="small">
            Category
          </Label>
          <Select value={categoryId} onValueChange={setCategoryId}>
            <Select.Trigger>
              <Select.Value placeholder="Select a category" />
            </Select.Trigger>
            <Select.Content>
              {categories.map((c) => (
                <Select.Item key={c.id} value={c.id}>
                  {c.name}
                </Select.Item>
              ))}
            </Select.Content>
          </Select>
        </div>
      )}

      {/* Manual product picker */}
      {source === "manual" && (
        <div className="flex flex-col gap-y-2">
          <Label size="small">
            Products ({productIds.length} selected)
          </Label>
          <Input
            placeholder="Search products..."
            value={productSearch}
            onChange={(e) => setProductSearch(e.target.value)}
          />
          <div className="max-h-52 overflow-y-auto rounded-lg border border-ui-border-base">
            {products.length === 0 ? (
              <Text size="small" className="text-ui-fg-subtle px-3 py-2">
                No products found.
              </Text>
            ) : (
              products.map((p) => (
                <label
                  key={p.id}
                  className="flex cursor-pointer items-center gap-x-2.5 border-b border-ui-border-base px-3 py-2 last:border-b-0 hover:bg-ui-bg-subtle"
                >
                  <input
                    type="checkbox"
                    checked={productIds.includes(p.id)}
                    onChange={() => toggleProduct(p.id)}
                    className="h-4 w-4 rounded"
                  />
                  {p.thumbnail && (
                    <img
                      src={p.thumbnail}
                      alt=""
                      className="h-8 w-8 shrink-0 rounded object-cover"
                    />
                  )}
                  <Text size="small">{p.title}</Text>
                </label>
              ))
            )}
          </div>
        </div>
      )}

      {/* Bestsellers time window */}
      {source === "bestsellers" && (
        <div className="flex flex-col gap-y-1.5">
          <Label htmlFor="tw-days" size="small">
            Time window (days)
          </Label>
          <Input
            id="tw-days"
            type="number"
            value={timeWindowDays}
            onChange={(e) => setTimeWindowDays(Number(e.target.value))}
            min={1}
            max={365}
          />
        </div>
      )}

      {/* Limit */}
      <div className="flex flex-col gap-y-1.5">
        <Label htmlFor="prod-limit" size="small">
          Product limit
        </Label>
        <Input
          id="prod-limit"
          type="number"
          value={limit}
          onChange={(e) => setLimit(Number(e.target.value))}
          min={1}
          max={24}
        />
      </div>

      <hr className="border-ui-border-base" />
      <MobileLayoutPicker value={mobileLayout} onChange={setMobileLayout} />

      <Button size="small" isLoading={saving} onClick={save}>
        Save settings
      </Button>
    </div>
  )
}

// â"€â"€â"€ Edit Drawer â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€

const TYPE_LABEL: Record<SectionType, string> = {
  hero_carousel: "Hero Carousel",
  featured_categories: "Featured Categories",
  product_showcase: "Product Showcase",
  brand_showcase: "Brands Showcase",
}

// ─── Brand Showcase Editor ────────────────────────────────────────────────────

function BrandShowcaseEditor({ section }: { section: HomeSection }) {
  const current = (section.settings as { max_brands?: number } | null) ?? {}
  const [maxBrands, setMaxBrands] = useState(current.max_brands ?? 0)
  const [saving, setSaving] = useState(false)

  const save = async () => {
    setSaving(true)
    try {
      await adminFetch(`/admin/homepage/sections/${section.id}`, {
        method: "POST",
        body: JSON.stringify({ settings: { max_brands: maxBrands } }),
      })
      toast.success("Settings saved")
    } catch {
      toast.error("Failed to save")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="flex flex-col gap-y-4">
      <div className="rounded-lg bg-ui-bg-subtle border border-ui-border-base px-4 py-3">
        <Text size="small" className="text-ui-fg-subtle">
          All brands from your Brands catalogue are displayed automatically, ordered by position.
        </Text>
      </div>
      <div className="flex flex-col gap-y-1.5">
        <Label htmlFor="brand-max" size="small">
          Max brands to show <Text as="span" size="xsmall" className="text-ui-fg-muted">(0 = all)</Text>
        </Label>
        <Input
          id="brand-max"
          type="number"
          min={0}
          value={maxBrands}
          onChange={(e) => setMaxBrands(Number(e.target.value))}
        />
      </div>
      <Button size="small" onClick={save} isLoading={saving}>
        Save
      </Button>
    </div>
  )
}

interface EditProps {
  section: HomeSection
  open: boolean
  onOpenChange: (open: boolean) => void
  onUpdated: (partial: Partial<HomeSection> & { id: string }) => void
}

export function EditSectionDrawer({
  section,
  open,
  onOpenChange,
  onUpdated,
}: EditProps) {
  const patchSection = async (update: { title?: string; layout?: string }) => {
    await adminFetch(`/admin/homepage/sections/${section.id}`, {
      method: "POST",
      body: JSON.stringify(update),
    })
    onUpdated({ id: section.id, ...update })
  }

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <Drawer.Content className="max-w-xl overflow-hidden">
        <Drawer.Header className="shrink-0">
          <Drawer.Title>{section.title}</Drawer.Title>
          <Text size="small" className="text-ui-fg-subtle">
            {TYPE_LABEL[section.type]}
          </Text>
        </Drawer.Header>

        <Drawer.Body className="flex flex-col gap-y-6 overflow-y-auto">
          {/* Metadata */}
          <div>
            <Heading
              level="h3"
              className="mb-3 text-xs font-semibold uppercase tracking-wider text-ui-fg-subtle"
            >
              Settings
            </Heading>
            <MetaEditor section={section} onSave={patchSection} />
          </div>

          <hr className="border-ui-border-base" />

          {/* Per-type content editor */}
          <div>
            <Heading
              level="h3"
              className="mb-3 text-xs font-semibold uppercase tracking-wider text-ui-fg-subtle"
            >
              Content
            </Heading>
            {section.type === "hero_carousel" && (
              <>
                <HeroEditor section={section} />
                {section.layout === "split" && (
                  <>
                    <hr className="border-ui-border-base my-4" />
                    <Text weight="plus" size="small" className="mb-3">
                      Split panel (right side)
                    </Text>
                    <SplitPanelEditor section={section} />
                  </>
                )}
                <hr className="border-ui-border-base my-4" />
                <Text weight="plus" size="small" className="mb-3">
                  Mobile appearance
                </Text>
                <HeroMobileEditor section={section} />
              </>
            )}
            {section.type === "featured_categories" && (
              <CategoriesEditor section={section} />
            )}
            {section.type === "product_showcase" && (
              <ShowcaseEditor section={section} />
            )}
            {section.type === "brand_showcase" && (
              <BrandShowcaseEditor section={section} />
            )}
          </div>
        </Drawer.Body>

        <Drawer.Footer className="shrink-0">
          <Button
            variant="secondary"
            size="small"
            onClick={() => onOpenChange(false)}
          >
            Done
          </Button>
        </Drawer.Footer>
      </Drawer.Content>
    </Drawer>
  )
}

