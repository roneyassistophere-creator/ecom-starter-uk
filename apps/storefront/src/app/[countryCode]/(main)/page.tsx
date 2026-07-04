import { Metadata } from "next"
import brand from "brand.config"
import { getHomepageSections } from "@lib/data/homepage"
import { SECTION_REGISTRY } from "@modules/home/section-registry"

export const metadata: Metadata = {
  title: brand.storeName,
  description: brand.tagline,
}

// Next.js ISR: page re-renders at most every 60 s when a request comes in
export const revalidate = 60

export default async function Home(props: {
  params: Promise<{ countryCode: string }>
}) {
  const { countryCode } = await props.params
  const sections = await getHomepageSections()

  if (sections.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-40 gap-3 text-center">
        <h1
          className="text-3xl font-semibold tracking-tight"
          style={{ color: "var(--brand-primary)" }}
        >
          Coming Soon
        </h1>
        <p className="text-sm max-w-md" style={{ color: "var(--brand-secondary)" }}>
          We&apos;re putting the finishing touches on our store. Please check back shortly.
        </p>
      </div>
    )
  }

  return (
    <div style={{ backgroundColor: "var(--brand-bg)", color: "var(--brand-text)" }}>
      {sections.map((section, index) => {
        const Component = SECTION_REGISTRY[section.type]?.[section.layout]
        if (!Component) return null
        const prev = sections[index - 1]
        const showDivider =
          index > 0 &&
          prev?.type !== "hero_carousel" &&
          section.type !== "hero_carousel"
        const visClass =
          section.visibility === "desktop"
            ? "hidden lg:block"
            : section.visibility === "mobile"
            ? "lg:hidden"
            : ""
        return (
          <div key={section.id} className={visClass}>
            {showDivider && (
              <div className="relative flex items-center justify-center py-3 overflow-hidden content-container">
                <div
                  className="absolute inset-x-0 h-px"
                  style={{
                    background:
                      "linear-gradient(to right, transparent, var(--brand-primary, #d1d5db) 20%, var(--brand-primary, #d1d5db) 80%, transparent)",
                    opacity: 0.35,
                  }}
                />
                <div
                  className="relative z-10 w-2 h-2 rounded-full"
                  style={{
                    backgroundColor: "var(--brand-primary, #6b7280)",
                    boxShadow: "0 0 0 3px var(--brand-bg, white), 0 0 0 4px var(--brand-primary, #6b7280)",
                    opacity: 0.6,
                  }}
                />
              </div>
            )}
            <Component section={section} countryCode={countryCode} />
          </div>
        )
      })}
    </div>
  )
}
