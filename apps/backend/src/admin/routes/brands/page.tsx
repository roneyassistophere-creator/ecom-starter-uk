import { defineRouteConfig } from "@medusajs/admin-sdk"
import { Tag } from "@medusajs/icons"
import {
  Button,
  Container,
  Drawer,
  FocusModal,
  Heading,
  Input,
  Label,
  Table,
  Text,
  Textarea,
  toast,
} from "@medusajs/ui"
import { useEffect, useRef, useState } from "react"

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

type Brand = {
  id: string
  name: string
  handle: string
  logo_url: string | null
  description: string | null
  website: string | null
  position: number
}

function slugify(str: string) {
  return str
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
}

type BrandFormProps = {
  initial?: Partial<Brand>
  onSave: (data: Omit<Brand, "id">) => Promise<void>
  onClose: () => void
  saving: boolean
}

function BrandForm({ initial, onSave, onClose, saving }: BrandFormProps) {
  const [name, setName] = useState(initial?.name ?? "")
  const [handle, setHandle] = useState(initial?.handle ?? "")
  const [description, setDescription] = useState(initial?.description ?? "")
  const [website, setWebsite] = useState(initial?.website ?? "")
  const [position, setPosition] = useState(String(initial?.position ?? 0))
  const [logoUrl, setLogoUrl] = useState(initial?.logo_url ?? "")
  const [uploading, setUploading] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  const handleNameChange = (v: string) => {
    setName(v)
    if (!initial?.handle) setHandle(slugify(v))
  }

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    try {
      const token =
        localStorage.getItem("_medusa_auth_token") ||
        localStorage.getItem("medusa_auth_token") ||
        ""
      const fd = new FormData()
      fd.append("file", file)
      const res = await fetch("/admin/brands/upload", {
        method: "POST",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: fd,
      })
      if (!res.ok) throw new Error("Upload failed")
      const { url } = await res.json()
      setLogoUrl(url)
    } catch {
      toast.error("Logo upload failed")
    } finally {
      setUploading(false)
    }
  }

  const handleSubmit = async () => {
    if (!name.trim() || !handle.trim()) {
      toast.error("Name and handle are required")
      return
    }
    await onSave({
      name: name.trim(),
      handle: handle.trim(),
      logo_url: logoUrl || null,
      description: description.trim() || null,
      website: website.trim() || null,
      position: Number(position) || 0,
    })
  }

  return (
    <div className="flex flex-col gap-y-4 p-4">
      <div className="flex flex-col gap-y-1">
        <Label>Name *</Label>
        <Input value={name} onChange={(e) => handleNameChange(e.target.value)} placeholder="e.g. Nike" />
      </div>
      <div className="flex flex-col gap-y-1">
        <Label>Handle (slug) *</Label>
        <Input
          value={handle}
          onChange={(e) => setHandle(slugify(e.target.value))}
          placeholder="e.g. nike"
        />
        <Text size="xsmall" className="text-ui-fg-muted">
          URL-friendly identifier. Auto-filled from name.
        </Text>
      </div>
      <div className="flex flex-col gap-y-1">
        <Label>Description</Label>
        <Textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Short brand description"
          rows={3}
        />
      </div>
      <div className="flex flex-col gap-y-1">
        <Label>Website</Label>
        <Input value={website} onChange={(e) => setWebsite(e.target.value)} placeholder="https://brand.com" />
      </div>
      <div className="flex flex-col gap-y-1">
        <Label>Position</Label>
        <Input
          type="number"
          value={position}
          onChange={(e) => setPosition(e.target.value)}
          placeholder="0"
        />
        <Text size="xsmall" className="text-ui-fg-muted">Lower numbers appear first.</Text>
      </div>
      <div className="flex flex-col gap-y-2">
        <Label>Logo</Label>
        {logoUrl && (
          <img src={logoUrl} alt="Brand logo" className="h-16 w-auto object-contain rounded border border-ui-border-base" />
        )}
        <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleUpload} />
        <Button
          size="small"
          variant="secondary"
          onClick={() => fileRef.current?.click()}
          isLoading={uploading}
          disabled={uploading}
        >
          {logoUrl ? "Change Logo" : "Upload Logo"}
        </Button>
        {logoUrl && (
          <Button size="small" variant="transparent" onClick={() => setLogoUrl("")}>
            Remove Logo
          </Button>
        )}
      </div>
      <div className="flex justify-end gap-x-2 pt-2 border-t border-ui-border-base mt-2">
        <Button size="small" variant="secondary" onClick={onClose} disabled={saving || uploading}>
          Cancel
        </Button>
        <Button size="small" onClick={handleSubmit} isLoading={saving} disabled={saving || uploading}>
          Save
        </Button>
      </div>
    </div>
  )
}

const BrandsPage = () => {
  const [brands, setBrands] = useState<Brand[]>([])
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [editing, setEditing] = useState<Brand | null>(null)
  const [showCreate, setShowCreate] = useState(false)
  const [deleting, setDeleting] = useState<string | null>(null)

  const loadBrands = async () => {
    setLoading(true)
    try {
      const { brands } = await adminFetch<{ brands: Brand[] }>("/brands")
      setBrands(brands)
    } catch {
      toast.error("Failed to load brands")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadBrands() }, [])

  const handleCreate = async (data: Omit<Brand, "id">) => {
    setCreating(true)
    try {
      await adminFetch("/brands", {
        method: "POST",
        body: JSON.stringify(data),
      })
      toast.success("Brand created")
      setShowCreate(false)
      loadBrands()
    } catch {
      toast.error("Failed to create brand")
    } finally {
      setCreating(false)
    }
  }

  const handleEdit = async (data: Omit<Brand, "id">) => {
    if (!editing) return
    setCreating(true)
    try {
      await adminFetch(`/brands/${editing.id}`, {
        method: "POST",
        body: JSON.stringify(data),
      })
      toast.success("Brand updated")
      setEditing(null)
      loadBrands()
    } catch {
      toast.error("Failed to update brand")
    } finally {
      setCreating(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!window.confirm("Delete this brand? Products will be unlinked.")) return
    setDeleting(id)
    try {
      await adminFetch(`/brands/${id}`, { method: "DELETE" })
      toast.success("Brand deleted")
      loadBrands()
    } catch {
      toast.error("Failed to delete brand")
    } finally {
      setDeleting(null)
    }
  }

  return (
    <div className="flex flex-col gap-y-4 p-4">
      <Container className="px-6 py-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <Heading level="h1">Brands</Heading>
            <Text size="small" className="text-ui-fg-subtle mt-1">
              Manage product brands. Assign brands to products from the product detail page.
            </Text>
          </div>
          <FocusModal open={showCreate} onOpenChange={setShowCreate}>
            <FocusModal.Trigger asChild>
              <Button size="small">Add Brand</Button>
            </FocusModal.Trigger>
            <FocusModal.Content>
              <FocusModal.Header>
                <Heading>Create Brand</Heading>
              </FocusModal.Header>
              <FocusModal.Body className="overflow-y-auto">
                <BrandForm
                  onSave={handleCreate}
                  onClose={() => setShowCreate(false)}
                  saving={creating}
                />
              </FocusModal.Body>
            </FocusModal.Content>
          </FocusModal>
        </div>

        {loading ? (
          <Text size="small" className="text-ui-fg-muted">Loading...</Text>
        ) : brands.length === 0 ? (
          <div className="py-8 text-center">
            <Text size="small" className="text-ui-fg-subtle">
              No brands yet. Click "Add Brand" to create your first brand.
            </Text>
          </div>
        ) : (
          <Table>
            <Table.Header>
              <Table.Row>
                <Table.HeaderCell>Logo</Table.HeaderCell>
                <Table.HeaderCell>Name</Table.HeaderCell>
                <Table.HeaderCell>Handle</Table.HeaderCell>
                <Table.HeaderCell>Position</Table.HeaderCell>
                <Table.HeaderCell></Table.HeaderCell>
              </Table.Row>
            </Table.Header>
            <Table.Body>
              {brands.map((brand) => (
                <Table.Row key={brand.id}>
                  <Table.Cell>
                    {brand.logo_url ? (
                      <img
                        src={brand.logo_url}
                        alt={brand.name}
                        className="h-8 w-auto object-contain"
                      />
                    ) : (
                      <div className="h-8 w-8 rounded bg-ui-bg-subtle flex items-center justify-center">
                        <Text size="xsmall" className="text-ui-fg-muted">â€”</Text>
                      </div>
                    )}
                  </Table.Cell>
                  <Table.Cell>
                    <Text size="small" weight="plus">{brand.name}</Text>
                    {brand.description && (
                      <Text size="xsmall" className="text-ui-fg-muted line-clamp-1">
                        {brand.description}
                      </Text>
                    )}
                  </Table.Cell>
                  <Table.Cell>
                    <Text size="small" className="text-ui-fg-subtle font-mono">{brand.handle}</Text>
                  </Table.Cell>
                  <Table.Cell>
                    <Text size="small">{brand.position}</Text>
                  </Table.Cell>
                  <Table.Cell>
                    <div className="flex items-center gap-x-2 justify-end">
                      <Drawer open={editing?.id === brand.id} onOpenChange={(open) => !open && setEditing(null)}>
                        <Drawer.Trigger asChild>
                          <Button size="small" variant="secondary" onClick={() => setEditing(brand)}>
                            Edit
                          </Button>
                        </Drawer.Trigger>
                        <Drawer.Content>
                          <Drawer.Header>
                            <Heading>Edit Brand</Heading>
                          </Drawer.Header>
                          <Drawer.Body className="overflow-y-auto">
                            {editing?.id === brand.id && (
                              <BrandForm
                                initial={editing}
                                onSave={handleEdit}
                                onClose={() => setEditing(null)}
                                saving={creating}
                              />
                            )}
                          </Drawer.Body>
                        </Drawer.Content>
                      </Drawer>
                      <Button
                        size="small"
                        variant="danger"
                        onClick={() => handleDelete(brand.id)}
                        isLoading={deleting === brand.id}
                        disabled={deleting === brand.id}
                      >
                        Delete
                      </Button>
                    </div>
                  </Table.Cell>
                </Table.Row>
              ))}
            </Table.Body>
          </Table>
        )}
      </Container>
    </div>
  )
}

export const config = defineRouteConfig({
  label: "Brands",
  rank: 4,
  icon: Tag,
})

export default BrandsPage
