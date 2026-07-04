import brand from "brand.config"

// Server component — injects CSS variables + Google Fonts into <head>.
// Swap brand.config.ts to fully re-skin the site.
export default function BrandStyles() {
  const { heading, body } = brand.fonts
  const families = Array.from(new Set([heading, body]))
  const googleFontsUrl =
    "https://fonts.googleapis.com/css2?" +
    families
      .map((f) => `family=${encodeURIComponent(f)}:wght@400;500;600;700`)
      .join("&") +
    "&display=swap"

  const css = `
    :root {
      --brand-primary: ${brand.colors.primary};
      --brand-secondary: ${brand.colors.secondary};
      --brand-bg: ${brand.colors.background};
      --brand-text: ${brand.colors.text};
      --brand-font-heading: '${heading}', Inter, sans-serif;
      --brand-font-body: '${body}', Inter, sans-serif;
    }
    body {
      font-family: var(--brand-font-body);
      background-color: var(--brand-bg);
      color: var(--brand-text);
    }
    h1, h2, h3, h4, h5, h6 {
      font-family: var(--brand-font-heading);
    }
  `

  return (
    <>
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      <link rel="stylesheet" href={googleFontsUrl} />
      <link rel="icon" href={brand.faviconPath} />
      {/* eslint-disable-next-line react/no-danger */}
      <style dangerouslySetInnerHTML={{ __html: css }} />
    </>
  )
}
