export type Brand = {
  storeName: string
  tagline: string
  /** Short company blurb shown in the footer brand column */
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
  /** Set any social URL to "" to hide that icon in the footer */
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

  // Place logo at /public/images/logo.svg and favicon at /public/favicon.ico
  logoPath: "/images/logo.svg",
  faviconPath: "/favicon.ico",

  colors: {
    primary: "#000000",
    secondary: "#6B7280",
    background: "#FFFFFF",
    text: "#111827",
  },

  // Any Google Fonts family name works here
  fonts: {
    heading: "Inter",
    body: "Inter",
  },

  contact: {
    address: "123 Main Street, New York, NY 10001",
    phone: "+1 (555) 123-4567",
    email: "hello@mystore.com",
    whatsapp: "", // e.g. "+15551234567" — admin DB value takes precedence at runtime
  },

  social: {
    facebook: "", // e.g. "https://facebook.com/mystore"
    twitter: "",  // e.g. "https://twitter.com/mystore"
    instagram: "", // e.g. "https://instagram.com/mystore"
  },
}

export default brand
