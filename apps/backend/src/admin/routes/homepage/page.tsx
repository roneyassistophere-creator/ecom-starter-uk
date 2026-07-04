import { defineRouteConfig } from "@medusajs/admin-sdk"
import {
  Badge,
  Button,
  Container,
  Heading,
  IconButton,
  Switch,
  Text,
  toast,
  usePrompt,
} from "@medusajs/ui"
import { ArrowDown, ArrowUpMini, PencilSquare, Plus, Trash } from "@medusajs/icons"
import { useCallback, useEffect, useState } from "react"
import { AddSectionModal } from "./components/add-section"
import { EditSectionDrawer } from "./components/edit-section"

// â”€â”€â”€ Shared types (re-exported for child components) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export type SectionType = "hero_carousel" | "featured_categories" | "product_showcase" | "brand_showcase"

export interface HomeSlide {
  id: string
  section_id: string
  image_url: string
  mobile_image_url: string | null
  heading: string | null
  subheading: string | null
  cta_label: string | null
  cta_link: string | null
  position: number
}

export interface HomeSection {
  id: string
  title: string
  type: SectionType
  layout: string
  position: number
  enabled: boolean
  settings: Record<string, unknown> | null
  slides?: HomeSlide[]
}

// â”€â”€â”€ API helper (exported for child components) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export async function adminFetch<T = unknown>(
  path: string,
  init?: RequestInit
): Promise<T> {
  const token =
    localStorage.getItem("_medusa_auth_token") ||
    localStorage.getItem("medusa_auth_token") ||
    ""

  const isFormData = init?.body instanceof FormData
  const defaultHeaders: Record<string, string> = {
    ...(!isFormData ? { "Content-Type": "application/json" } : {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  }

  const res = await fetch(path, {
    credentials: "include",
    ...init,
    headers: {
      ...defaultHeaders,
      ...((init?.headers as Record<string, string>) ?? {}),
    },
  })

  if (!res.ok) {
    const text = await res.text()
    throw new Error(text || `HTTP ${res.status}`)
  }

  return res.json() as Promise<T>
}

// â”€â”€â”€ Constants â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

const TYPE_BADGE_COLOR: Record<SectionType, "blue" | "green" | "orange" | "purple"> = {
  hero_carousel: "blue",
  featured_categories: "green",
  product_showcase: "orange",
  brand_showcase: "purple",
}

const TYPE_LABEL: Record<SectionType, string> = {
  hero_carousel: "Hero Carousel",
  featured_categories: "Featured Categories",
  product_showcase: "Product Showcase",
  brand_showcase: "Brands Showcase",
}

// â”€â”€â”€ Page â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

const HomepagePage = () => {
  const [sections, setSections] = useState<HomeSection[]>([])
  const [loading, setLoading] = useState(true)
  const [addOpen, setAddOpen] = useState(false)
  const [editSection, setEditSection] = useState<HomeSection | null>(null)
  const prompt = usePrompt()

  const fetchSections = useCallback(async () => {
    try {
      const data = await adminFetch<{ sections: HomeSection[] }>(
        "/admin/homepage/sections"
      )
      setSections(data.sections.sort((a, b) => a.position - b.position))
    } catch {
      toast.error("Failed to load homepage sections")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchSections()
  }, [fetchSections])

  const toggleEnabled = async (section: HomeSection) => {
    const next = !section.enabled
    setSections((prev) =>
      prev.map((s) => (s.id === section.id ? { ...s, enabled: next } : s))
    )
    try {
      await adminFetch(`/admin/homepage/sections/${section.id}`, {
        method: "POST",
        body: JSON.stringify({ enabled: next }),
      })
    } catch {
      // revert
      setSections((prev) =>
        prev.map((s) => (s.id === section.id ? { ...s, enabled: !next } : s))
      )
      toast.error("Failed to update section")
    }
  }

  const moveSection = async (index: number, dir: "up" | "down") => {
    const next = [...sections]
    const target = dir === "up" ? index - 1 : index + 1
    if (target < 0 || target >= next.length) return
    ;[next[index], next[target]] = [next[target], next[index]]
    setSections(next)
    try {
      await adminFetch("/admin/homepage/sections/reorder", {
        method: "POST",
        body: JSON.stringify({ ids: next.map((s) => s.id) }),
      })
    } catch {
      toast.error("Failed to reorder â€” refreshing")
      fetchSections()
    }
  }

  const deleteSection = async (section: HomeSection) => {
    const confirmed = await prompt({
      title: "Delete section?",
      description: `"${section.title}" and all its slides will be permanently deleted.`,
      confirmText: "Delete",
      cancelText: "Cancel",
    })
    if (!confirmed) return
    try {
      await adminFetch(`/admin/homepage/sections/${section.id}`, {
        method: "DELETE",
      })
      setSections((prev) => prev.filter((s) => s.id !== section.id))
      toast.success("Section deleted")
    } catch {
      toast.error("Failed to delete section")
    }
  }

  if (loading) {
    return (
      <Container className="flex items-center justify-center py-20">
        <Text className="text-ui-fg-subtle">Loading...</Text>
      </Container>
    )
  }

  return (
    <div className="flex flex-col gap-y-4 p-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <Heading level="h1">Homepage Sections</Heading>
          <Text size="small" className="text-ui-fg-subtle mt-1">
            Manage the content sections displayed on your storefront homepage.
          </Text>
        </div>
        <Button
          size="small"
          variant="secondary"
          onClick={() => setAddOpen(true)}
        >
          <Plus className="mr-1.5" />
          Add Section
        </Button>
      </div>

      {/* Empty state */}
      {sections.length === 0 && (
        <Container className="flex flex-col items-center gap-4 py-20">
          <Text className="text-ui-fg-subtle">No sections yet.</Text>
          <Button size="small" onClick={() => setAddOpen(true)}>
            Add your first section
          </Button>
        </Container>
      )}

      {/* Section list */}
      <div className="flex flex-col gap-y-2">
        {sections.map((section, index) => (
          <Container key={section.id} className="px-6 py-4">
            <div className="flex items-center gap-x-4">
              {/* Position */}
              <Text
                size="xsmall"
                className="text-ui-fg-muted w-5 text-center font-mono shrink-0"
              >
                {index + 1}
              </Text>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-x-2 flex-wrap gap-y-1">
                  <Text weight="plus" size="small">
                    {section.title}
                  </Text>
                  <Badge
                    size="2xsmall"
                    color={TYPE_BADGE_COLOR[section.type] ?? "grey"}
                  >
                    {TYPE_LABEL[section.type] ?? section.type}
                  </Badge>
                  <Badge size="2xsmall" color="grey">
                    {section.layout.replace(/_/g, " ")}
                  </Badge>
                </div>
              </div>

              {/* Controls */}
              <div className="flex items-center gap-x-2 shrink-0">
                <Switch
                  checked={section.enabled}
                  onCheckedChange={() => toggleEnabled(section)}
                />
                <IconButton
                  size="small"
                  variant="transparent"
                  disabled={index === 0}
                  onClick={() => moveSection(index, "up")}
                >
                  <ArrowUpMini />
                </IconButton>
                <IconButton
                  size="small"
                  variant="transparent"
                  disabled={index === sections.length - 1}
                  onClick={() => moveSection(index, "down")}
                >
                  <ArrowDown />
                </IconButton>
                <IconButton
                  size="small"
                  variant="transparent"
                  onClick={() => setEditSection(section)}
                >
                  <PencilSquare />
                </IconButton>
                <IconButton
                  size="small"
                  variant="transparent"
                  className="text-ui-fg-error hover:text-ui-fg-error"
                  onClick={() => deleteSection(section)}
                >
                  <Trash />
                </IconButton>
              </div>
            </div>
          </Container>
        ))}
      </div>

      {/* Add section modal */}
      <AddSectionModal
        open={addOpen}
        onOpenChange={setAddOpen}
        onCreated={(section) => {
          setSections((prev) => [...prev, section])
        }}
      />

      {/* Edit section drawer */}
      {editSection && (
        <EditSectionDrawer
          section={editSection}
          open
          onOpenChange={(open) => {
            if (!open) setEditSection(null)
          }}
          onUpdated={(partial) => {
            setSections((prev) =>
              prev.map((s) =>
                s.id === partial.id ? { ...s, ...partial } : s
              )
            )
          }}
        />
      )}
    </div>
  )
}

export const config = defineRouteConfig({
  label: "Homepage",
  rank: 2,
})

export default HomepagePage
