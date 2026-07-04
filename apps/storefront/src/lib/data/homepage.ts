import type { HomepageSection } from "@modules/home/types"

const BACKEND = process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL ?? "http://localhost:9000"
const PK = process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY ?? ""

// Revalidates every 60 s — admin edits appear within one minute on the storefront
export async function getHomepageSections(): Promise<HomepageSection[]> {
  try {
    const res = await fetch(`${BACKEND}/store/homepage`, {
      headers: { "x-publishable-api-key": PK },
      next: { revalidate: 0 },
    })
    if (!res.ok) return []
    const { sections } = (await res.json()) as { sections: HomepageSection[] }
    return sections ?? []
  } catch {
    return []
  }
}
