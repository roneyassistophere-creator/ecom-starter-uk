import { getBaseURL } from "@lib/util/env"
import AnalyticsPageView from "@modules/common/components/analytics-page-view"
import AnalyticsScripts from "@modules/common/components/analytics-scripts"
import BrandStyles from "@modules/common/components/brand-styles"
import brand from "brand.config"
import { Metadata } from "next"
import "styles/globals.css"

export const metadata: Metadata = {
  metadataBase: new URL(getBaseURL()),
  title: { default: brand.storeName, template: `%s | ${brand.storeName}` },
  description: brand.tagline,
  applicationName: brand.storeName,
  openGraph: {
    title: brand.storeName,
    description: brand.tagline,
    siteName: brand.storeName,
    type: "website",
    url: getBaseURL(),
  },
  twitter: {
    card: "summary_large_image",
    title: brand.storeName,
    description: brand.tagline,
  },
}

export default function RootLayout(props: { children: React.ReactNode }) {
  const gtmId = process.env.NEXT_PUBLIC_GTM_ID

  return (
    <html lang="en" data-mode="light">
      <head>
        <BrandStyles />
        <AnalyticsScripts />
      </head>
      <body suppressHydrationWarning>
        {gtmId && (
          <noscript>
            <iframe
              src={`https://www.googletagmanager.com/ns.html?id=${gtmId}`}
              height="0"
              width="0"
              style={{ display: "none", visibility: "hidden" }}
            />
          </noscript>
        )}
        <main className="relative">{props.children}</main>
        <AnalyticsPageView />
      </body>
    </html>
  )
}
