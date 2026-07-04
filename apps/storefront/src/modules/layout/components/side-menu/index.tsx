"use client"

import { useEffect, useState } from "react"
import { createPortal } from "react-dom"
import { HttpTypes } from "@medusajs/types"
import { ArrowRightMini, XMark } from "@medusajs/icons"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { clx } from "@modules/common/components/ui"
import useToggleState from "@lib/hooks/use-toggle-state"
import CountrySelect from "../country-select"
import LanguageSelect from "../language-select"
import { Locale } from "@lib/data/locales"
import brand from "brand.config"

type Category = HttpTypes.StoreProductCategory
type Brand = { id: string; name: string; handle: string }

type SideMenuProps = {
  regions: HttpTypes.StoreRegion[] | null
  locales: Locale[] | null
  currentLocale: string | null
  categories?: Category[] | null
  brands?: Brand[] | null
}

const rowCls =
  "flex items-center justify-between h-12 px-4 border-b border-ui-border-base text-sm font-medium text-ui-fg-base hover:bg-ui-bg-subtle transition-colors w-full text-left"

// ─── Category accordion row ───────────────────────────────────────────────────

function CategoryRow({
  category,
  onClose,
}: {
  category: Category
  onClose: () => void
}) {
  const [expanded, setExpanded] = useState(false)
  const children = (category.category_children ?? []) as Category[]
  const hasChildren = children.length > 0

  if (!hasChildren) {
    return (
      <LocalizedClientLink
        href={`/categories/${category.handle}`}
        className={rowCls}
        onClick={onClose}
      >
        {category.name}
      </LocalizedClientLink>
    )
  }

  return (
    <>
      <button
        className={rowCls}
        aria-expanded={expanded}
        onClick={() => setExpanded((p) => !p)}
      >
        {category.name}
        <ArrowRightMini
          className={clx(
            "text-ui-fg-muted flex-shrink-0 transition-transform duration-200",
            expanded ? "rotate-90" : ""
          )}
        />
      </button>

      {expanded && (
        <ul className="bg-ui-bg-subtle border-b border-ui-border-base">
          {children.map((child) => (
            <li key={child.id}>
              <LocalizedClientLink
                href={`/categories/${child.handle}`}
                className="flex items-center h-10 pl-8 pr-4 text-sm text-ui-fg-subtle hover:text-ui-fg-base hover:bg-ui-bg-base transition-colors border-b border-ui-border-base last:border-b-0"
                onClick={onClose}
              >
                {child.name}
              </LocalizedClientLink>
            </li>
          ))}
        </ul>
      )}
    </>
  )
}

// ─── Brands accordion (collapsed by default) ──────────────────────────────────

function BrandsSection({
  brands,
  onClose,
}: {
  brands: Brand[]
  onClose: () => void
}) {
  const [expanded, setExpanded] = useState(false)

  return (
    <>
      <button
        className={rowCls}
        aria-expanded={expanded}
        onClick={() => setExpanded((p) => !p)}
      >
        Brands
        <ArrowRightMini
          className={clx(
            "text-ui-fg-muted flex-shrink-0 transition-transform duration-200",
            expanded ? "rotate-90" : ""
          )}
        />
      </button>

      {expanded && (
        <ul className="bg-ui-bg-subtle border-b border-ui-border-base">
          {brands.map((b) => (
            <li key={b.id}>
              <LocalizedClientLink
                href={`/brands/${b.handle}`}
                className="flex items-center h-10 pl-8 pr-4 text-sm text-ui-fg-subtle hover:text-ui-fg-base hover:bg-ui-bg-base transition-colors border-b border-ui-border-base last:border-b-0"
                onClick={onClose}
              >
                {b.name}
              </LocalizedClientLink>
            </li>
          ))}
        </ul>
      )}
    </>
  )
}

// ─── Side menu ────────────────────────────────────────────────────────────────

const SideMenu = ({ regions, locales, currentLocale, categories, brands }: SideMenuProps) => {
  const [isOpen, setIsOpen] = useState(false)
  const [mounted, setMounted] = useState(false)
  const countryToggle = useToggleState()
  const langToggle = useToggleState()

  // SSR-safe portal
  useEffect(() => {
    setMounted(true)
    document.addEventListener('mobile-menu-open', open)
    return () => {
      document.removeEventListener('mobile-menu-open', open)
      document.documentElement.classList.remove("mobile-menu-open")
      document.body.style.overflow = ""
    }
  }, [])

  const open = () => {
    setIsOpen(true)
    document.documentElement.classList.add("mobile-menu-open")
    document.body.style.overflow = "hidden"
  }

  const close = () => {
    setIsOpen(false)
    document.documentElement.classList.remove("mobile-menu-open")
    document.body.style.overflow = ""
    document.dispatchEvent(new CustomEvent('mobile-menu-close'))
  }

  const hasCategories = !!categories && categories.length > 0
  const hasBrands = !!brands && brands.length > 0

  return (
    <>
      {/* Animated hamburger button */}
      <button
        aria-label={isOpen ? "Close menu" : "Open menu"}
        aria-expanded={isOpen}
        onClick={isOpen ? close : open}
        className="flex flex-col justify-center items-center w-8 h-8 gap-0 focus:outline-none"
        data-testid="nav-menu-button"
      >
        <span
          className={clx(
            "block w-5 h-0.5 bg-current transition-all duration-300 origin-center",
            isOpen ? "rotate-45 translate-y-[5px]" : "mb-1"
          )}
        />
        <span
          className={clx(
            "block w-5 h-0.5 bg-current transition-all duration-300",
            isOpen ? "opacity-0 scale-x-0" : "mb-1"
          )}
        />
        <span
          className={clx(
            "block w-5 h-0.5 bg-current transition-all duration-300 origin-center",
            isOpen ? "-rotate-45 -translate-y-[5px]" : ""
          )}
        />
      </button>

      {/* Portal: backdrop + drawer */}
      {mounted &&
        createPortal(
          <>
            {/* Backdrop */}
            <div
              className="mobile-drawer-backdrop"
              onClick={close}
              aria-hidden="true"
              data-testid="side-menu-backdrop"
            />

            {/* Drawer */}
            <div
              className="mobile-menu-drawer flex flex-col"
              data-testid="nav-menu-popup"
            >
              {/* Brand header banner */}
              <div
                className="relative flex items-center justify-between p-4 flex-shrink-0"
                style={{ backgroundColor: "var(--brand-primary)" }}
              >
                <span className="text-base font-semibold text-white">
                  {brand.storeName}
                </span>
                <button
                  onClick={close}
                  aria-label="Close menu"
                  className="w-7 h-7 flex items-center justify-center rounded-full bg-white/15 hover:bg-white/25 transition-colors"
                  data-testid="close-menu-button"
                >
                  <XMark className="text-white w-4 h-4" />
                </button>
              </div>

              {/* Fixed top: primary links + Categories label */}
              <div className="flex-shrink-0">
                <LocalizedClientLink href="/" className={rowCls} onClick={close}>
                  Home
                </LocalizedClientLink>
                <LocalizedClientLink href="/store" className={rowCls} onClick={close}>
                  All Products
                </LocalizedClientLink>
                {hasCategories && (
                  <p className="text-xs uppercase tracking-widest text-ui-fg-muted font-medium px-4 pt-4 pb-1">
                    Categories
                  </p>
                )}
              </div>

              {/* Scrollable: category rows + Brands */}
              <div className="flex-1 overflow-y-auto no-scrollbar">
                {hasCategories &&
                  categories!.map((cat) => (
                    <CategoryRow key={cat.id} category={cat} onClose={close} />
                  ))}
                {hasBrands && <BrandsSection brands={brands!} onClose={close} />}
              </div>

              {/* Fixed footer: language / country (shipping) + copyright */}
              <div className="border-t border-ui-border-base px-4 py-4 flex-shrink-0 flex flex-col gap-3">
                {!!locales?.length && (
                  <LanguageSelect
                    toggleState={langToggle}
                    locales={locales}
                    currentLocale={currentLocale}
                  />
                )}
                {regions && (
                  <CountrySelect
                    toggleState={countryToggle}
                    regions={regions}
                  />
                )}
                <p className="text-xs text-ui-fg-muted">
                  &copy; {new Date().getFullYear()} {brand.storeName}
                </p>
              </div>
            </div>
          </>,
          document.body
        )}
    </>
  )
}

export default SideMenu
