import { setAuthToken } from "@lib/data/cookies"
import { transferCart } from "@lib/data/customer"
import { redirect } from "next/navigation"

const BACKEND_URL =
  process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL || "http://localhost:9000"
const PUBLISHABLE_KEY = process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY || ""

export default async function GoogleCallbackPage({
  params,
  searchParams,
}: {
  params: Promise<{ countryCode: string }>
  searchParams: Promise<{ code?: string; state?: string; error?: string }>
}) {
  const { countryCode } = await params
  const { code, state, error } = await searchParams

  const failUrl = `/${countryCode}/account?auth_error=google_failed`

  if (error || !code || !state) {
    redirect(failUrl)
  }

  try {
    const res = await fetch(`${BACKEND_URL}/store/auth/google/callback`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-publishable-api-key": PUBLISHABLE_KEY,
      },
      body: JSON.stringify({ code, state }),
      cache: "no-store",
    })

    if (!res.ok) {
      redirect(failUrl)
    }

    const data = await res.json()
    if (!data.token) {
      redirect(failUrl)
    }

    await setAuthToken(data.token)
    await transferCart()
  } catch {
    redirect(failUrl)
  }

  redirect(`/${countryCode}/account`)
}
