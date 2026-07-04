import { Metadata } from "next"
import { notFound } from "next/navigation"
import Image from "next/image"
import { listBrands } from "@lib/data/brands"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import brand from "brand.config"

export const metadata: Metadata = {
  title: `Brands | ${brand.storeName}`,
  description: "Browse all brands available in our store.",
}

export const revalidate = 3600

export default async function BrandsPage({
  params,
}: {
  params: Promise<{ countryCode: string }>
}) {
  const brands = await listBrands()

  return (
    <div className="content-container py-12">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-ui-fg-base">Brands</h1>
        <p className="text-ui-fg-subtle mt-2">
          Explore products by brand
        </p>
      </div>

      {brands.length === 0 ? (
        <div className="py-16 text-center">
          <p className="text-ui-fg-subtle">No brands available yet.</p>
        </div>
      ) : (
        <ul className="grid grid-cols-2 small:grid-cols-3 medium:grid-cols-4 gap-6">
          {brands.map((b) => (
            <li key={b.id}>
              <LocalizedClientLink
                href={`/brands/${b.handle}`}
                className="group flex flex-col items-center gap-y-3 p-6 rounded-2xl border border-ui-border-base hover:border-ui-border-interactive transition-colors bg-ui-bg-base"
              >
                {b.logo_url ? (
                  <div className="relative h-16 w-full">
                    <Image
                      src={b.logo_url}
                      alt={b.name}
                      fill
                      className="object-contain"
                      sizes="(max-width: 768px) 50vw, 25vw"
                    />
                  </div>
                ) : (
                  <div className="h-16 w-full flex items-center justify-center rounded-lg bg-ui-bg-subtle">
                    <span className="text-2xl font-bold text-ui-fg-muted">
                      {b.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                )}
                <span className="text-sm font-medium text-ui-fg-base group-hover:text-ui-fg-interactive text-center">
                  {b.name}
                </span>
              </LocalizedClientLink>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
