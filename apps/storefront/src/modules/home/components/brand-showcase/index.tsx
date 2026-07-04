import Image from "next/image"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import type { BrandShowcaseSection, SectionProps } from "@modules/home/types"

type Props = SectionProps & { variant: "grid" | "horizontal_scroll" }

export function BrandShowcase({ section, countryCode, variant }: Props) {
  const { brands, title } = section as BrandShowcaseSection

  if (!brands || brands.length === 0) return null

  const BrandCard = ({ b }: { b: (typeof brands)[0] }) => (
    <LocalizedClientLink
      href={`/brands/${b.handle}`}
      className="group flex flex-col items-center gap-y-3 p-5 rounded-2xl border border-ui-border-base hover:border-ui-border-interactive transition-colors bg-ui-bg-base flex-shrink-0"
      style={variant === "horizontal_scroll" ? { width: 160 } : undefined}
    >
      {b.logo_url ? (
        <div className="relative h-14 w-full">
          <Image
            src={b.logo_url}
            alt={b.name}
            fill
            className="object-contain"
            sizes="160px"
          />
        </div>
      ) : (
        <div
          className="h-14 w-full flex items-center justify-center rounded-xl"
          style={{ backgroundColor: "var(--brand-primary)" }}
        >
          <span className="text-xl font-bold text-white">
            {b.name.charAt(0).toUpperCase()}
          </span>
        </div>
      )}
      <span className="text-sm font-medium text-ui-fg-base group-hover:text-ui-fg-interactive text-center line-clamp-1">
        {b.name}
      </span>
    </LocalizedClientLink>
  )

  return (
    <div className="content-container py-10">
      {title && (
        <h2 className="text-2xl font-semibold text-ui-fg-base mb-6">{title}</h2>
      )}

      {variant === "horizontal_scroll" ? (
        <div className="flex gap-4 overflow-x-auto no-scrollbar pb-2">
          {brands.map((b) => <BrandCard key={b.id} b={b} />)}
        </div>
      ) : (
        <ul className="grid grid-cols-2 small:grid-cols-3 medium:grid-cols-4 gap-5">
          {brands.map((b) => (
            <li key={b.id}><BrandCard b={b} /></li>
          ))}
        </ul>
      )}
    </div>
  )
}
