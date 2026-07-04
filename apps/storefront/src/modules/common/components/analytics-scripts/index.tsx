// Server component — renders pixel/analytics script tags.
// Meta Pixel + GA4 are loaded from admin settings (runtime, no rebuild needed).
// GTM, TikTok, Google Ads remain env-var-based (unchanged).
export default async function AnalyticsScripts() {
  const gtmId = process.env.NEXT_PUBLIC_GTM_ID
  const tiktokPixelId = process.env.NEXT_PUBLIC_TIKTOK_PIXEL_ID
  const gadsId = process.env.NEXT_PUBLIC_GADS_ID

  // Runtime-fetch from admin settings — no rebuild needed when IDs change
  let metaPixelId: string | null = process.env.NEXT_PUBLIC_META_PIXEL_ID || null
  let ga4Id: string | null = null
  try {
    const backendUrl = process.env.BACKEND_URL || "http://localhost:9000"
    const res = await fetch(`${backendUrl}/store/tracking-public`, {
      cache: "no-store",
    })
    if (res.ok) {
      const data = (await res.json()) as { meta_pixel_id?: string | null; ga4_measurement_id?: string | null }
      if (data.meta_pixel_id) metaPixelId = data.meta_pixel_id
      if (data.ga4_measurement_id) ga4Id = data.ga4_measurement_id
    }
  } catch {
    // Backend unreachable — fall back to env vars only (already set above for metaPixelId)
  }

  if (!gtmId && !metaPixelId && !tiktokPixelId && !gadsId && !ga4Id) return null

  return (
    <>
      {gtmId && (
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src='https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);})(window,document,'script','dataLayer','${gtmId}');`,
          }}
        />
      )}

      {metaPixelId && (
        <script
          dangerouslySetInnerHTML={{
            __html: `!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');fbq('init','${metaPixelId}');fbq('track','PageView');`,
          }}
        />
      )}

      {tiktokPixelId && (
        <script
          dangerouslySetInnerHTML={{
            __html: `!function(w,d,t){w.TiktokAnalyticsObject=t;var ttq=w[t]=w[t]||[];ttq.methods=["page","track","identify","instances","debug","on","off","once","ready","alias","group","enableCookie","disableCookie","holdConsent","revokeConsent","grantConsent"],ttq.setAndDefer=function(t,e){t[e]=function(){t.push([e].concat(Array.prototype.slice.call(arguments,0)))}};for(var i=0;i<ttq.methods.length;i++)ttq.setAndDefer(ttq,ttq.methods[i]);ttq.instance=function(t){for(var e=ttq._i[t]||[],n=0;n<ttq.methods.length;n++)ttq.setAndDefer(e,ttq.methods[n]);return e},ttq.load=function(e,n){var r="https://analytics.tiktok.com/i18n/pixel/events.js",o=n&&n.partner;ttq._i=ttq._i||{},ttq._i[e]=[],ttq._i[e]._u=r,ttq._t=ttq._t||{},ttq._t[e]=+new Date,ttq._o=ttq._o||{},ttq._o[e]=n||{};n=document.createElement("script");n.type="text/javascript",n.async=!0,n.src=r+"?sdkid="+e+"&lib="+t;e=document.getElementsByTagName("script")[0];e.parentNode.insertBefore(n,e)};ttq.load('${tiktokPixelId}');ttq.page();}(window,document,'ttq');`,
          }}
        />
      )}

      {gadsId && (
        <>
          <script async src={`https://www.googletagmanager.com/gtag/js?id=${gadsId}`} />
          <script
            dangerouslySetInnerHTML={{
              __html: `window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments)}gtag('js',new Date());gtag('config','${gadsId}');`,
            }}
          />
        </>
      )}

      {ga4Id && (
        <>
          <script async src={`https://www.googletagmanager.com/gtag/js?id=${ga4Id}`} />
          <script
            dangerouslySetInnerHTML={{
              __html: `window.dataLayer=window.dataLayer||[];function gtag(){if(typeof dataLayer!=='undefined')dataLayer.push(arguments)}gtag('js',new Date());gtag('config','${ga4Id}');`,
            }}
          />
        </>
      )}
    </>
  )
}
