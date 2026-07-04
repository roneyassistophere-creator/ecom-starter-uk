"use client"

import { usePathname, useRouter } from "next/navigation"
import { useState, useEffect, useRef, useCallback } from "react"
import { MagnifyingGlass } from "@medusajs/icons"
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
      `${BACKEND_URL}/store/products?q=${encodeURIComponent(q)}&limit=6`,
      { headers: { "x-publishable-api-key": PUB_KEY || "" } }
    )
    if (!res.ok) return []
    const data = await res.json()
    return (data.products as SuggestedProduct[]) || []
  } catch {
    return []
  }
}

const SearchBar = () => {
  const [query, setQuery] = useState("")
  const [suggestions, setSuggestions] = useState<SuggestedProduct[]>([])
  const [isOpen, setIsOpen] = useState(false)
  const router = useRouter()
  const pathname = usePathname()
  const countryCode = pathname.split("/")[1] || "us"
  const wrapperRef = useRef<HTMLDivElement>(null)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener("mousedown", handler)
    return () => document.removeEventListener("mousedown", handler)
  }, [])

  // Debounced live search
  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current)
    const trimmed = query.trim()
    if (!trimmed) {
      setSuggestions([])
      setIsOpen(false)
      return
    }
    timerRef.current = setTimeout(async () => {
      const results = await fetchSuggestions(trimmed)
      setSuggestions(results)
      setIsOpen(results.length > 0)
    }, 280)
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [query])

  const navigate = useCallback(
    (q: string) => {
      setIsOpen(false)
      setQuery("")
      router.push(`/${countryCode}/store?q=${encodeURIComponent(q)}`)
    },
    [countryCode, router]
  )

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const trimmed = query.trim()
    if (trimmed) navigate(trimmed)
  }

  return (
    <div ref={wrapperRef} className="flex-1 max-w-sm mx-6 hidden lg:block relative">
      <form onSubmit={handleSubmit}>
        <div className="relative">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => suggestions.length > 0 && setIsOpen(true)}
            placeholder="Search products..."
            autoComplete="off"
            className="w-full h-9 pl-4 pr-10 text-sm rounded-full border border-ui-border-base bg-ui-bg-subtle text-ui-fg-base placeholder:text-ui-fg-muted focus:outline-none focus:border-ui-border-interactive focus:ring-1 focus:ring-ui-border-interactive transition-colors"
          />
          <button
            type="submit"
            aria-label="Search"
            className="absolute right-3 top-1/2 -translate-y-1/2 text-ui-fg-muted hover:text-ui-fg-base transition-colors"
          >
            <MagnifyingGlass className="w-4 h-4" />
          </button>
        </div>
      </form>

      {isOpen && suggestions.length > 0 && (
        <div className="absolute top-full mt-1.5 left-0 right-0 bg-ui-bg-base border border-ui-border-base rounded-xl shadow-lg z-50 overflow-hidden">
          {suggestions.map((product) => (
            <LocalizedClientLink
              key={product.id}
              href={`/products/${product.handle}`}
              onClick={() => { setIsOpen(false); setQuery("") }}
              className="flex items-center gap-3 px-4 py-2.5 hover:bg-ui-bg-subtle transition-colors border-b border-ui-border-base last:border-b-0"
            >
              {product.thumbnail ? (
                <img
                  src={product.thumbnail}
                  alt={product.title}
                  className="w-8 h-8 object-cover rounded flex-shrink-0"
                />
              ) : (
                <div className="w-8 h-8 bg-ui-bg-subtle rounded flex-shrink-0" />
              )}
              <span className="text-sm text-ui-fg-base truncate">{product.title}</span>
            </LocalizedClientLink>
          ))}
          <button
            type="button"
            onClick={() => navigate(query.trim())}
            className="w-full flex items-center gap-2 px-4 py-2.5 text-sm font-medium hover:bg-ui-bg-subtle transition-colors"
            style={{ color: "var(--brand-primary)" }}
          >
            <MagnifyingGlass className="w-3.5 h-3.5 flex-shrink-0" />
            <span>See all results for &ldquo;{query}&rdquo;</span>
          </button>
        </div>
      )}
    </div>
  )
}

export default SearchBar
