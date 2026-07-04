import { listCategories } from "@lib/data/categories"
import brand from "brand.config"
import { Text } from "@modules/common/components/ui"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import BrandLogo from "@modules/common/components/brand-logo"
import { MapPin, Phone, Mail } from "lucide-react"
import { Facebook } from "@medusajs/icons"

// Inline SVGs for social icons not available in installed icon packages
function TwitterIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.746l7.73-8.835L1.254 2.25H8.08l4.258 5.63 5.906-5.63zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  )
}

function InstagramIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.5" cy="6.5" r="0.5" fill="currentColor" stroke="none" />
    </svg>
  )
}

// ─── Static link columns ──────────────────────────────────────────────────────

const INFO_LINKS = [
  { label: "About Us", href: "/about-us" },
  { label: "Contact Us", href: "/contact" },
  { label: "Company Information", href: "/company-information" },
  { label: "Blog", href: "/blog" },
  { label: "Terms & Conditions", href: "/terms" },
  { label: "Privacy Policy", href: "/privacy" },
  { label: "Careers", href: "/careers" },
]

const SUPPORT_LINKS = [
  { label: "Support Center", href: "/support" },
  { label: "How to Order", href: "/how-to-order" },
  { label: "Order Tracking", href: "/order-tracking" },
  { label: "Payment", href: "/payment" },
  { label: "Shipping", href: "/shipping" },
  { label: "FAQ", href: "/faq" },
]

const POLICY_LINKS = [
  { label: "Happy Return", href: "/returns" },
  { label: "Refund Policy", href: "/refund-policy" },
  { label: "Exchange", href: "/exchange" },
  { label: "Cancellation", href: "/cancellation" },
  { label: "Pre-Order", href: "/pre-order" },
  { label: "Extra Discount", href: "/offers" },
]

// ─── Link column ──────────────────────────────────────────────────────────────

function LinkColumn({
  title,
  links,
  ariaLabel,
}: {
  title: string
  links: { label: string; href: string }[]
  ariaLabel: string
}) {
  return (
    <nav aria-label={ariaLabel}>
      <h3 className="text-sm font-semibold text-ui-fg-base mb-4 uppercase tracking-wide">
        {title}
      </h3>
      <ul className="flex flex-col gap-2.5">
        {links.map((link) => (
          <li key={link.href}>
            <LocalizedClientLink
              href={link.href}
              className="text-sm text-ui-fg-subtle transition-colors hover:text-[var(--brand-primary)]"
            >
              {link.label}
            </LocalizedClientLink>
          </li>
        ))}
      </ul>
    </nav>
  )
}

// ─── Footer ───────────────────────────────────────────────────────────────────

export default async function Footer() {
  const productCategories = await listCategories()
  const topLevelCategories = productCategories.filter((c) => !c.parent_category)

  const hasSocial =
    brand.social.facebook || brand.social.twitter || brand.social.instagram

  return (
    <footer
      className="bg-gray-50 border-t border-ui-border-base w-full"
      aria-label="Site footer"
    >
      <div className="content-container py-16">
        {/* Main grid: brand column + 4 link columns */}
        <div className="grid grid-cols-1 lg:grid-cols-[300px_1fr] gap-12 lg:gap-16">

          {/* ── Brand column ── */}
          <div className="flex flex-col gap-6">
            <LocalizedClientLink href="/" className="self-start">
              <BrandLogo
                imgClassName="h-12 w-auto"
                textClassName="txt-compact-xlarge-plus uppercase hover:text-ui-fg-base"
              />
            </LocalizedClientLink>

            <p className="text-sm text-ui-fg-subtle leading-relaxed max-w-xs">
              {brand.description}
            </p>

            {/* Contact info */}
            <address className="not-italic flex flex-col gap-3 text-sm text-ui-fg-subtle">
              <div className="flex items-start gap-2.5">
                <MapPin className="w-4 h-4 mt-0.5 shrink-0 text-ui-fg-muted" />
                <span>{brand.contact.address}</span>
              </div>
              <a
                href={`tel:${brand.contact.phone}`}
                className="flex items-center gap-2.5 hover:text-[var(--brand-primary)] transition-colors"
              >
                <Phone className="w-4 h-4 shrink-0 text-ui-fg-muted" />
                <span>{brand.contact.phone}</span>
              </a>
              <a
                href={`mailto:${brand.contact.email}`}
                className="flex items-center gap-2.5 hover:text-[var(--brand-primary)] transition-colors"
              >
                <Mail className="w-4 h-4 shrink-0 text-ui-fg-muted" />
                <span>{brand.contact.email}</span>
              </a>
            </address>

            {/* Social icons — only rendered when URLs are set */}
            {hasSocial && (
              <div className="flex gap-3" aria-label="Social media links">
                {brand.social.facebook && (
                  <a
                    href={brand.social.facebook}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="Follow us on Facebook"
                    className="w-9 h-9 rounded-full border border-ui-border-base flex items-center justify-center text-ui-fg-subtle hover:bg-[var(--brand-primary)] hover:text-white hover:border-transparent transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--brand-primary)]"
                  >
                    <Facebook className="w-4 h-4" />
                  </a>
                )}
                {brand.social.twitter && (
                  <a
                    href={brand.social.twitter}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="Follow us on Twitter / X"
                    className="w-9 h-9 rounded-full border border-ui-border-base flex items-center justify-center text-ui-fg-subtle hover:bg-[var(--brand-primary)] hover:text-white hover:border-transparent transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--brand-primary)]"
                  >
                    <TwitterIcon className="w-4 h-4" />
                  </a>
                )}
                {brand.social.instagram && (
                  <a
                    href={brand.social.instagram}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="Follow us on Instagram"
                    className="w-9 h-9 rounded-full border border-ui-border-base flex items-center justify-center text-ui-fg-subtle hover:bg-[var(--brand-primary)] hover:text-white hover:border-transparent transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--brand-primary)]"
                  >
                    <InstagramIcon className="w-4 h-4" />
                  </a>
                )}
              </div>
            )}
          </div>

          {/* ── Four link columns ── */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <LinkColumn
              title="Information"
              links={INFO_LINKS}
              ariaLabel="Information links"
            />

            {/* Shop By — dynamic from Medusa categories */}
            <nav aria-label="Shop by category">
              <h3 className="text-sm font-semibold text-ui-fg-base mb-4 uppercase tracking-wide">
                Shop By
              </h3>
              <ul className="flex flex-col gap-2.5" data-testid="footer-categories">
                {topLevelCategories.length > 0 ? (
                  topLevelCategories.map((cat) => (
                    <li key={cat.id}>
                      <LocalizedClientLink
                        href={`/categories/${cat.handle}`}
                        className="text-sm text-ui-fg-subtle transition-colors hover:text-[var(--brand-primary)]"
                        data-testid="category-link"
                      >
                        {cat.name}
                      </LocalizedClientLink>
                    </li>
                  ))
                ) : (
                  <li>
                    <LocalizedClientLink
                      href="/store"
                      className="text-sm text-ui-fg-subtle transition-colors hover:text-[var(--brand-primary)]"
                    >
                      All Products
                    </LocalizedClientLink>
                  </li>
                )}
              </ul>
            </nav>

            <LinkColumn
              title="Support"
              links={SUPPORT_LINKS}
              ariaLabel="Support links"
            />

            <LinkColumn
              title="Consumer Policy"
              links={POLICY_LINKS}
              ariaLabel="Consumer policy links"
            />
          </div>
        </div>

        {/* Bottom bar */}
        <div className="border-t border-ui-border-base mt-12 pt-6 flex flex-col sm:flex-row items-center justify-between gap-3">
          <Text className="txt-compact-small text-ui-fg-muted">
            © {new Date().getFullYear()} {brand.storeName}. All rights reserved.
          </Text>
          <Text className="txt-compact-small text-ui-fg-muted">
            {brand.tagline}
          </Text>
        </div>
      </div>
    </footer>
  )
}
