import { Suspense } from "react"

import { listCategories } from "@lib/data/categories"
import { listBrands } from "@lib/data/brands"
import { listLocales } from "@lib/data/locales"
import { getLocale } from "@lib/data/locale-actions"
import { listRegions } from "@lib/data/regions"
import { StoreRegion } from "@medusajs/types"
import { ShoppingBag, User } from "@medusajs/icons"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import CartButton from "@modules/layout/components/cart-button"
import CategoryBar from "@modules/layout/components/category-bar"
import SideMenu from "@modules/layout/components/side-menu"
import SearchBar from "@modules/layout/components/search-bar"
import BrandLogo from "@modules/common/components/brand-logo"

export default async function Nav() {
  const [regions, locales, currentLocale, allCategories, brands] = await Promise.all([
    listRegions().then((regions: StoreRegion[]) => regions),
    listLocales(),
    getLocale(),
    listCategories(),
    listBrands(),
  ])

  // Top-level only — same filter pattern the footer uses
  const topLevelCategories = allCategories.filter((c) => !c.parent_category)
  const menuBrands = brands.map((b) => ({ id: b.id, name: b.name, handle: b.handle }))

  return (
    <div className="sticky top-0 inset-x-0 z-50 group">
      <header className="relative h-16 mx-auto border-b duration-200 bg-white border-ui-border-base">
        <nav className="content-container txt-xsmall-plus text-ui-fg-subtle flex items-center justify-between w-full h-full text-small-regular relative">

          {/* LEFT: hamburger (all non-desktop) + brand name (desktop only) */}
          <div className="flex items-center gap-x-3 h-full flex-none">
            <div className="flex lg:hidden items-center">
              <SideMenu
                regions={regions}
                locales={locales}
                currentLocale={currentLocale}
                categories={topLevelCategories}
                brands={menuBrands}
              />
            </div>
            {/* Brand name: desktop — stays left-aligned */}
            <LocalizedClientLink
              href="/"
              className="hidden lg:block"
              data-testid="nav-store-link"
            >
              <BrandLogo
                imgClassName="h-10 w-auto"
                textClassName="txt-compact-xlarge-plus uppercase hover:text-ui-fg-base"
              />
            </LocalizedClientLink>
          </div>

          {/* Brand name: mobile + tablet — absolutely centered */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none lg:hidden">
            <LocalizedClientLink
              href="/"
              className="pointer-events-auto"
              data-testid="nav-store-link-mobile"
            >
              <BrandLogo
                imgClassName="h-10 w-auto"
                textClassName="txt-compact-xlarge-plus uppercase hover:text-ui-fg-base"
              />
            </LocalizedClientLink>
          </div>

          {/* CENTER: Search bar — desktop only */}
          <SearchBar />

          {/* RIGHT: Store · Cart · Account */}
          <div className="flex items-center gap-x-6 h-full flex-none">
            {/* Store — desktop only */}
            <div className="hidden lg:flex items-center">
              <LocalizedClientLink
                href="/store"
                className="flex flex-col items-center gap-0.5 hover:text-ui-fg-base"
                data-testid="nav-store-page-link"
              >
                <ShoppingBag className="w-5 h-5" />
                <span className="text-[10px] leading-none">Store</span>
              </LocalizedClientLink>
            </div>

            {/* Cart — always visible */}
            <Suspense
              fallback={
                <LocalizedClientLink
                  className="hover:text-ui-fg-base flex flex-col items-center gap-0.5"
                  href="/cart"
                  data-testid="nav-cart-link"
                >
                  Cart (0)
                </LocalizedClientLink>
              }
            >
              <CartButton />
            </Suspense>

            {/* Account — desktop only */}
            <div className="hidden lg:flex items-center">
              <LocalizedClientLink
                href="/account"
                className="flex flex-col items-center gap-0.5 hover:text-ui-fg-base"
                data-testid="nav-account-link"
              >
                <User className="w-5 h-5" />
                <span className="text-[10px] leading-none">Account</span>
              </LocalizedClientLink>
            </div>
          </div>
        </nav>
      </header>
      <CategoryBar categories={topLevelCategories} />
    </div>
  )
}
