"use client"

import { trackPageView } from "@lib/analytics"
import { usePathname } from "next/navigation"
import { useEffect } from "react"

// Fires PageView on every client-side navigation (SPA routing).
// The initial PageView on hard load is already fired by the pixel init scripts.
export default function AnalyticsPageView() {
  const pathname = usePathname()

  useEffect(() => {
    trackPageView()
  }, [pathname])

  return null
}
