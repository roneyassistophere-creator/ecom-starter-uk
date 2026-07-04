"use client"

import { useEffect, useRef, useState } from "react"
import { createPortal } from "react-dom"
import { MagnifyingGlass, XMark } from "@medusajs/icons"
import { usePathname, useRouter } from "next/navigation"
import LocalizedClientLink from "@modules/common/components/localized-client-link"

const BACKEND_URL =
  process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL || "http://localhost:9000"
const PUB_KEY = process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY

type SuggestedProduct = {
  id: string
  title: string
  handle: string
  thumbnail: string | null
}

async function fetchSuggestions(q: string): Promise<SuggestedProduct[]> {
  try {
    const res = await fetch(
      `${BACKEND_URL}/store/products?q=${encodeURIComponent(q)}&limit=8`,
      { headers: { "x-publishable-api-key": PUB_KEY || "" } }
    )
    if (!res.ok) return []
    const data = await res.json()
    return (data.products as SuggestedProduct[]) || []
  } catch {
    return []
  }
}

export default function MobileSearchOverlay() {
  const [mounted, setMounted] = useState(false)
  const [isOpen, setIsOpen] = useState(false)
  const [query, setQuery] = useState("")
  const [suggestions, setSuggestions] = useState<SuggestedProduct[]>([])
  const inputRef = useRef<HTMLInputElement>(null)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const router = useRouter()
  const pathname = usePathname()
  const countryCode = pathname.split("/")[1] || "us"

  useEffect(() => {
    setMounted(true)
    const openHandler = () => open()
    document.addEventListener("mobile-search-open", openHandler)
    return () => document.removeEventListener("mobile-search-open", openHandler)
  }, [])

  const open = () => {
    setIsOpen(true)
    document.body.style.overflow = "hidden"
    setTimeout(() => inputRef.current?.focus(), 80)
  }

  const close = () => {
    setIsOpen(false)
    setQuery("")
    setSuggestions([])
    document.body.style.overflow = ""
  }

  // Debounced live search
  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current)
    const trimmed = query.trim()
    if (!trimmed) {
      setSuggestions([])
      return
    }
    timerRef.current = setTimeout(async () => {
      const results = await fetchSuggestions(trimmed)
      setSuggestions(results)
    }, 280)
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [query])

  const navigate = (q: string) => {
    close()
    router.push(`/${countryCode}/store?q=${encodeURIComponent(q)}`)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const trimmed = query.trim()
    if (trimmed) navigate(trimmed)
  }

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) close()
    }
    document.addEventListener("keydown", handler)
    return () => document.removeEventListener("keydown", handler)
  }, [isOpen])

  if (!mounted) return null

  return createPortal(
    <>
      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-[60] lg:hidden"
          onClick={close}
          aria-hidden="true"
        />
      )}

      {/* Overlay panel */}
      <div
        className={[
          "fixed top-0 left-0 right-0 bg-ui-bg-base z-[61] lg:hidden",
          "transition-transform duration-300 ease-in-out",
          isOpen ? "translate-y-0" : "-translate-y-full",
        ].join(" ")}
      >
        {/* Search input row */}
        <form
          onSubmit={handleSubmit}
          className="flex items-center gap-2 px-4 py-3 border-b border-ui-border-base"
          style={{ paddingTop: "calc(0.75rem + env(safe-area-inset-top))" }}
        >
          <div className="relative flex-1">
            <MagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ui-fg-muted pointer-events-none" />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search products..."
              autoComplete="off"
              className="w-full h-10 pl-9 pr-4 text-sm rounded-full border border-ui-border-base bg-ui-bg-subtle text-ui-fg-base placeholder:text-ui-fg-muted focus:outline-none focus:border-ui-border-interactive focus:ring-1 focus:ring-ui-border-interactive transition-colors"
            />
          </div>
          <button
            type="button"
            onClick={close}
            aria-label="Close search"
            className="flex items-center justify-center w-9 h-9 rounded-full bg-ui-bg-subtle hover:bg-ui-bg-base-hover transition-colors flex-shrink-0"
          >
            <XMark className="w-4 h-4 text-ui-fg-base" />
          </button>
        </form>

        {/* Suggestions list */}
        {suggestions.length > 0 && (
          <div className="max-h-[60vh] overflow-y-auto">
            {suggestions.map((product) => (
              <LocalizedClientLink
                key={product.id}
                href={`/products/${product.handle}`}
                onClick={close}
                className="flex items-center gap-3 px-4 py-3 hover:bg-ui-bg-subtle active:bg-ui-bg-subtle transition-colors border-b border-ui-border-base last:border-b-0"
              >
                {product.thumbnail ? (
                  <img
                    src={product.thumbnail}
                    alt={product.title}
                    className="w-10 h-10 object-cover rounded flex-shrink-0"
                  />
                ) : (
                  <div className="w-10 h-10 bg-ui-bg-subtle rounded flex-shrink-0" />
                )}
                <span className="text-sm text-ui-fg-base">{product.title}</span>
              </LocalizedClientLink>
            ))}
            {query.trim() && (
              <button
                type="button"
                onClick={() => navigate(query.trim())}
                className="w-full flex items-center gap-2 px-4 py-3 text-sm font-medium border-t border-ui-border-base hover:bg-ui-bg-subtle transition-colors"
                style={{ color: "var(--brand-primary)" }}
              >
                <MagnifyingGlass className="w-4 h-4 flex-shrink-0" />
                <span>See all results for &ldquo;{query}&rdquo;</span>
              </button>
            )}
          </div>
        )}

        {/* Empty state */}
        {query.trim() && suggestions.length === 0 && (
          <div className="px-4 py-8 text-center text-sm text-ui-fg-muted">
            No products found for &ldquo;{query}&rdquo;
          </div>
        )}
      </div>
    </>,
    document.body
  )
}
