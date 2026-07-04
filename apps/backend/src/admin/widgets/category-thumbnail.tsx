import { defineWidgetConfig } from "@medusajs/admin-sdk"
import { DetailWidgetProps } from "@medusajs/framework/types"
import { HttpTypes } from "@medusajs/types"
import { Button, Container, Input, Text, toast } from "@medusajs/ui"
import { useRef, useState } from "react"

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

const CategoryThumbnailWidget = ({
  data: category,
}: DetailWidgetProps<HttpTypes.AdminProductCategory>) => {
  const [thumbnailUrl, setThumbnailUrl] = useState<string>(
    (category.metadata?.thumbnail_url as string) || ""
  )
  const [isUploading, setIsUploading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setIsUploading(true)
    try {
      const token =
        localStorage.getItem("_medusa_auth_token") ||
        localStorage.getItem("medusa_auth_token") ||
        ""
      const form = new FormData()
      form.append("file", file)
      const res = await fetch("/admin/homepage/upload", {
        method: "POST",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: form,
      })
      if (!res.ok) throw new Error("Upload failed")
      const { url } = await res.json()
      setThumbnailUrl(url)
      toast.success("Image uploaded")
    } catch {
      toast.error("Failed to upload image")
    } finally {
      setIsUploading(false)
    }
  }

  const handleSave = async () => {
    setIsSaving(true)
    try {
      await adminFetch(`/product-categories/${category.id}`, {
        method: "POST",
        body: JSON.stringify({
          metadata: {
            ...(category.metadata as object | null ?? {}),
            thumbnail_url: thumbnailUrl || null,
          },
        }),
      })
      toast.success("Category thumbnail saved")
    } catch {
      toast.error("Failed to save thumbnail")
    } finally {
      setIsSaving(false)
    }
  }

  const handleRemove = async () => {
    setThumbnailUrl("")
    setIsSaving(true)
    try {
      const meta = { ...(category.metadata as object | null ?? {}) } as Record<string, unknown>
      delete meta.thumbnail_url
      await adminFetch(`/product-categories/${category.id}`, {
        method: "POST",
        body: JSON.stringify({ metadata: meta }),
      })
      toast.success("Thumbnail removed")
    } catch {
      toast.error("Failed to remove thumbnail")
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <Container className="divide-y p-0">
      <div className="flex items-center justify-between px-6 py-4">
        <Text size="small" leading="compact" weight="plus">
          Category Thumbnail
        </Text>
      </div>

      <div className="flex flex-col gap-4 px-6 py-4">
        {thumbnailUrl && (
          <div className="relative w-32 h-24 rounded-md overflow-hidden border border-ui-border-base bg-ui-bg-subtle">
            <img
              src={thumbnailUrl}
              alt="Category thumbnail"
              className="w-full h-full object-cover"
            />
          </div>
        )}

        <div className="flex flex-col gap-2">
          <Text size="small" leading="compact" className="text-ui-fg-subtle">
            Upload an image or paste a URL
          </Text>
          <div className="flex gap-2">
            <Input
              size="small"
              placeholder="https://..."
              value={thumbnailUrl}
              onChange={(e) => setThumbnailUrl(e.target.value)}
              className="flex-1"
            />
            <Button
              size="small"
              variant="secondary"
              onClick={() => fileInputRef.current?.click()}
              isLoading={isUploading}
            >
              Upload
            </Button>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFileUpload}
          />
        </div>

        <div className="flex gap-2">
          <Button
            size="small"
            onClick={handleSave}
            isLoading={isSaving}
            disabled={isUploading}
          >
            Save thumbnail
          </Button>
          {thumbnailUrl && (
            <Button
              size="small"
              variant="secondary"
              onClick={handleRemove}
              disabled={isSaving || isUploading}
            >
              Remove
            </Button>
          )}
        </div>
      </div>
    </Container>
  )
}

export const config = defineWidgetConfig({
  zone: "product_category.details.after",
})

export default CategoryThumbnailWidget
