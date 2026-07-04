const BACKEND = process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL ?? "http://localhost:9000"
const PK = process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY ?? ""

const HEADERS = { "x-publishable-api-key": PK }

export type StoreBrand = {
  id: string
  name: string
  handle: string
  logo_url: string | null
  description: string | null
  website: string | null
  position: number
}

export type StoreBrandWithProducts = StoreBrand & {
  products: {
    id: string
    title: string
    handle: string | null
    thumbnail: string | null
    variants: { id: string }[]
  }[]
}

export async function listBrands(): Promise<StoreBrand[]> {
  try {
    const res = await fetch(`${BACKEND}/store/brands`, {
      headers: HEADERS,
      next: { revalidate: 0 },
    })
    if (!res.ok) return []
    const data = await res.json()
    return data.brands ?? []
  } catch {
    return []
  }
}

export async function getBrand(handle: string): Promise<StoreBrandWithProducts | null> {
  try {
    const res = await fetch(`${BACKEND}/store/brands/${handle}`, {
      headers: HEADERS,
      next: { revalidate: 0 },
    })
    if (!res.ok) return null
    const data = await res.json()
    return data.brand ?? null
  } catch {
    return null
  }
}

export async function getBrandByProductId(productId: string): Promise<StoreBrand | null> {
  try {
    const res = await fetch(`${BACKEND}/store/brands/by-product/${productId}`, {
      headers: HEADERS,
      next: { revalidate: 0 },
    })
    if (!res.ok) return null
    const data = await res.json()
    return data.brand ?? null
  } catch {
    return null
  }
}
