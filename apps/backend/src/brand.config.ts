/**
 * Backend brand configuration — used by email templates.
 * Edit this file once to rebrand all transactional emails for your store.
 * Keep in sync with apps/storefront/src/brand.config.ts.
 */

export type Brand = {
  storeName: string
  tagline: string
  description: string
  logoPath: string
  faviconPath: string
  colors: {
    primary: string
    secondary: string
    background: string
    text: string
  }
  fonts: {
    heading: string
    body: string
  }
  contact: {
    address: string
    phone: string
    email: string
    whatsapp: string
  }
  social: {
    facebook: string
    twitter: string
    instagram: string
  }
}

const brand: Brand = {
  storeName: "My Store",
  tagline: "Quality products, delivered fast.",
  description:
    "Your go-to destination for quality products at great prices, delivered fast to your door.",

  // Relative path — email templates combine with STORE_URL env var for absolute logo URL
  logoPath: "/images/logo.svg",
  faviconPath: "/favicon.ico",

  colors: {
    primary: "#000000",
    secondary: "#6B7280",
    background: "#FFFFFF",
    text: "#111827",
  },

  fonts: {
    heading: "Inter",
    body: "Inter",
  },

  contact: {
    address: "123 Main Street, New York, NY 10001",
    phone: "+1 (555) 123-4567",
    email: "hello@mystore.com",
    whatsapp: "",
  },

  social: {
    facebook: "",
    twitter: "",
    instagram: "",
  },
}

export default brand
