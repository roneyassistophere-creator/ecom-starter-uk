import { defineWidgetConfig } from "@medusajs/admin-sdk"
import { DetailWidgetProps, HttpTypes } from "@medusajs/framework/types"
import { Button, Container, Select, Text, toast } from "@medusajs/ui"
import { useEffect, useState } from "react"

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
}

type ProductWithBrand = HttpTypes.AdminProduct & {
  brand?: Brand
}

const ProductBrandWidget = ({ data: product }: DetailWidgetProps<ProductWithBrand>) => {
  const [currentBrand, setCurrentBrand] = useState<Brand | null>(null)
  const [allBrands, setAllBrands] = useState<Brand[]>([])
  const [selectedBrandId, setSelectedBrandId] = useState<string>("")
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [loadingDisplay, setLoadingDisplay] = useState(true)
  const [loadingBrands, setLoadingBrands] = useState(false)

  // Display query — loads on mount, no conditional enabled
  useEffect(() => {
    adminFetch<{ brand: Brand | null }>(`/brands/by-product/${product.id}`)
      .then(({ brand }) => {
        setCurrentBrand(brand)
        setSelectedBrandId(brand?.id ?? "__none__")
      })
      .catch(() => toast.error("Failed to load brand"))
      .finally(() => setLoadingDisplay(false))
  }, [product.id])

  const openEditor = () => {
    setEditing(true)
    setLoadingBrands(true)
    adminFetch<{ brands: Brand[] }>("/brands")
      .then(({ brands }) => setAllBrands(brands))
      .catch(() => toast.error("Failed to load brands"))
      .finally(() => setLoadingBrands(false))
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const removing = selectedBrandId === "__none__"
      if (!removing && selectedBrandId) {
        await adminFetch(`/brands/${selectedBrandId}/products`, {
          method: "POST",
          body: JSON.stringify({ product_id: product.id }),
        })
        const updated = allBrands.find((b) => b.id === selectedBrandId) ?? null
        setCurrentBrand(updated)
        toast.success(updated ? `Brand set to ${updated.name}` : "Brand removed")
      } else if (currentBrand) {
        await adminFetch(`/brands/${currentBrand.id}/products/${product.id}`, {
          method: "DELETE",
        })
        setCurrentBrand(null)
        toast.success("Brand removed")
      }
      setEditing(false)
    } catch {
      toast.error("Failed to save brand")
    } finally {
      setSaving(false)
    }
  }

  return (
    <Container className="px-6 py-6 flex flex-col gap-y-4">
      <div className="flex items-center justify-between">
        <Text size="small" weight="plus">Brand</Text>
        {!editing && (
          <Button size="small" variant="secondary" onClick={openEditor}>
            {currentBrand ? "Change" : "Assign Brand"}
          </Button>
        )}
      </div>

      {loadingDisplay ? (
        <Text size="small" className="text-ui-fg-muted">Loading...</Text>
      ) : !editing ? (
        currentBrand ? (
          <div className="flex items-center gap-x-3">
            {currentBrand.logo_url && (
              <img
                src={currentBrand.logo_url}
                alt={currentBrand.name}
                className="h-8 w-auto object-contain"
              />
            )}
            <div>
              <Text size="small" weight="plus">{currentBrand.name}</Text>
              <Text size="xsmall" className="text-ui-fg-muted font-mono">/{currentBrand.handle}</Text>
            </div>
          </div>
        ) : (
          <Text size="small" className="text-ui-fg-subtle">No brand assigned</Text>
        )
      ) : (
        <div className="flex flex-col gap-y-3">
          {loadingBrands ? (
            <Text size="small" className="text-ui-fg-muted">Loading brands...</Text>
          ) : (
            <Select
              value={selectedBrandId}
              onValueChange={setSelectedBrandId}
            >
              <Select.Trigger>
                <Select.Value placeholder="Select a brand…" />
              </Select.Trigger>
              <Select.Content>
                <Select.Item value="__none__">No brand</Select.Item>
                {allBrands.map((b) => (
                  <Select.Item key={b.id} value={b.id}>
                    {b.name}
                  </Select.Item>
                ))}
              </Select.Content>
            </Select>
          )}
          <div className="flex gap-x-2 justify-end">
            <Button
              size="small"
              variant="secondary"
              onClick={() => { setEditing(false); setSelectedBrandId(currentBrand?.id ?? "__none__") }}
              disabled={saving}
            >
              Cancel
            </Button>
            <Button size="small" onClick={handleSave} isLoading={saving} disabled={saving || loadingBrands}>
              Save
            </Button>
          </div>
        </div>
      )}
    </Container>
  )
}

export const config = defineWidgetConfig({
  zone: "product.details.before",
})

export default ProductBrandWidget
