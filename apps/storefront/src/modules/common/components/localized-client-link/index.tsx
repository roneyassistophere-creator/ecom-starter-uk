"use client"

import Link from "next/link"
import { useParams } from "next/navigation"
import React from "react"

/**
 * Next.js `<Link />` that keeps the current country code in the URL without
 * passing it explicitly.
 *
 * Resilient to admin/CMS-entered links (e.g. hero CTA links):
 * - leaves external links and anchors untouched (http(s)://, //, mailto:, tel:, #)
 * - adds a missing leading slash ("products/x" → "/products/x")
 * - never double-prefixes when the href already starts with the country code
 *   (e.g. a pasted "/bd/products/x" stays "/bd/products/x", not "/bd/bd/...")
 */
const LocalizedClientLink = ({
  children,
  href,
  ...props
}: {
  children?: React.ReactNode
  href: string
  className?: string
  onClick?: () => void
  passHref?: true
  [x: string]: unknown
}) => {
  const params = useParams()
  const countryCode = Array.isArray(params?.countryCode)
    ? params.countryCode[0]
    : (params?.countryCode as string | undefined)

  const buildHref = (): string => {
    const raw = href ?? ""

    // External links / anchors / protocols — leave exactly as entered
    if (/^([a-z]+:)?\/\//i.test(raw) || /^(mailto:|tel:|#)/i.test(raw)) {
      return raw
    }

    const path = raw.startsWith("/") ? raw : `/${raw}`

    if (!countryCode) {
      return path
    }

    // Already country-prefixed (e.g. user pasted a full "/bd/..." URL) — don't repeat it
    if (path === `/${countryCode}` || path.startsWith(`/${countryCode}/`)) {
      return path
    }

    return `/${countryCode}${path}`
  }

  return (
    <Link href={buildHref()} {...props}>
      {children}
    </Link>
  )
}

export default LocalizedClientLink
