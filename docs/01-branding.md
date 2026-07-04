# Part 1 — Branding a New Store

Do this **before** deploying. Branding is baked into the storefront build; changing
it later requires a redeploy of the storefront.

---

## Where branding lives

| What | File |
|------|------|
| All brand values (name, colors, fonts, logo path, contact, social) | `apps/storefront/src/brand.config.ts` |
| Logo image | `apps/storefront/public/images/logo.svg` |
| Favicon | `apps/storefront/public/favicon.ico` |
| Footer static link lists (Info / Support / Policy columns) | `apps/storefront/src/modules/layout/templates/footer/index.tsx` |

> **Branding vs admin content**  
> `brand.config.ts` controls the visual identity baked into the build (colors, fonts,
> store name, logo). Product listings, homepage sections, product-card style, and
> WhatsApp/order phone runtime overrides are managed later in the admin dashboard —
> see [Part 3 – Feature Configuration](./03-configuration.md).

---

## Step 1 — Edit `brand.config.ts`

Open `apps/storefront/src/brand.config.ts` and fill in every field:

```ts
const brand: Brand = {
  // ── Identity ──────────────────────────────────────────────────
  storeName: "Acme Shop",           // <title>, nav, copyright, checkout header
  tagline:   "Quality, fast.",      // <meta description>
  description:                      // footer brand column blurb
    "Your go-to destination for quality products.",

  // ── Asset paths (relative to /public) ─────────────────────────
  logoPath:    "/images/logo.svg",  // see Step 2
  faviconPath: "/favicon.ico",      // see Step 2

  // ── Colors ────────────────────────────────────────────────────
  colors: {
    primary:    "#2563EB",   // buttons, active pills, filter bar accent
    secondary:  "#6B7280",   // secondary text / muted accents
    background: "#FFFFFF",   // page background
    text:       "#111827",   // default body text
  },

  // ── Fonts (any Google Fonts family name) ──────────────────────
  fonts: {
    heading: "Poppins",   // h1–h6, product titles
    body:    "Inter",     // body copy, descriptions
  },

  // ── Contact (shown in footer) ─────────────────────────────────
  contact: {
    address:  "123 Main St, Dhaka 1000, Bangladesh",
    phone:    "+880 1700 000000",
    email:    "hello@acmeshop.com",
    whatsapp: "+8801700000000",   // leave "" to hide; admin DB overrides at runtime
  },

  // ── Social links (leave "" to hide the icon) ──────────────────
  social: {
    facebook:  "https://facebook.com/acmeshop",
    twitter:   "",
    instagram: "https://instagram.com/acmeshop",
  },
}
```

### Field reference

| Field | Where it appears | Notes |
|-------|-----------------|-------|
| `storeName` | Browser `<title>`, nav logo text, checkout header, copyright line | |
| `tagline` | `<meta name="description">` | |
| `description` | Footer brand column | |
| `logoPath` | Nav logo `<img src>`, footer logo | Path is relative to `/public` |
| `faviconPath` | `<link rel="icon">` injected in `<head>` | |
| `colors.primary` | CSS var `--brand-primary` — buttons, active states, filter accents, mobile bottom-nav active | Hex or any CSS color |
| `colors.secondary` | CSS var `--brand-secondary` | |
| `colors.background` | CSS var `--brand-bg` | |
| `colors.text` | CSS var `--brand-text` | |
| `fonts.heading` | CSS var `--brand-font-heading` — loaded via Google Fonts at weights 400/500/600/700 | Any Google Fonts name |
| `fonts.body` | CSS var `--brand-font-body` — same loader | |
| `contact.address` | Footer contact column | |
| `contact.phone` | Footer contact column | |
| `contact.email` | Footer contact column | |
| `contact.whatsapp` | Footer WhatsApp link — **overridden at runtime** by the value set in Admin → Store Settings | |
| `social.facebook/twitter/instagram` | Footer social icons — icon hidden when value is `""` | Full URL |

---

## Step 2 — Place logo and favicon assets

```
apps/storefront/public/
├── images/
│   └── logo.svg        ← your logo (matches logoPath in brand.config)
└── favicon.ico         ← your favicon (matches faviconPath in brand.config)
```

**Logo**
- Recommended: SVG (scales cleanly at any size) or PNG with transparent background
- Rendered in the **nav** at `h-10` (40 px tall) and the **footer** at `h-12`; width scales automatically
- Recommended canvas: 200 × 50 px or wider proportionally
- **Logo-or-text fallback (automatic):** if a logo file exists at `public/<logoPath>`, the nav
  and footer show the **image**; if no logo file is present, they show the **store-name text**
  instead. So a freshly cloned store (no logo yet) shows text, and dropping in `logo.svg`
  switches it to the image — no code change needed. (Set `logoPath: ""` to force text-only.)

**Favicon**
- Format: `.ico` (multi-resolution) or `.png`
- Recommended: 32 × 32 px minimum; include 192 × 192 for PWA icons if needed
- The `faviconPath` value in brand.config is wired into the storefront `<head>` automatically
  (via Next.js `metadata.icons`) — no manual `<link>` needed.

> **Admin browser tab (title + favicon).** The Medusa admin (`/app`) is a separate app, so its
> tab title/favicon are set on the **backend**, not from `brand.config`:
> - **Title:** set the backend env var `ADMIN_APP_NAME` to your store name (build-time), or edit
>   `ADMIN_TITLE_FALLBACK` in `apps/backend/scripts/brand-admin.mjs`. Default is `Medusa Admin`.
> - **Favicon:** copy your favicon to `apps/backend/scripts/admin-favicon.ico` (use the **same**
>   file as `apps/storefront/public/favicon.ico` so the admin and storefront match).
> A post-build script (`brand-admin.mjs`, run automatically by `npm run build`) applies both to
> the generated admin on every backend deploy.

---

## Step 3 — (Optional) Customize footer link columns

The three footer link columns (Info, Support, Policy) are hardcoded in:

```
apps/storefront/src/modules/layout/templates/footer/index.tsx
```

Edit the `INFO_LINKS`, `SUPPORT_LINKS`, and `POLICY_LINKS` arrays to change labels or
hrefs. The "Shop By" column is dynamic — it populates from Medusa product categories.

---

## Step 4 — Verify locally

```bash
cd apps/storefront
npm install
npm run dev          # starts at http://localhost:8000
```

Check:
- Browser tab title shows `storeName`
- Nav and footer show your logo
- Primary color appears on the Buy Now / Add to Cart buttons
- Fonts loaded (check Network tab → Google Fonts requests for your font names)
- Favicon visible in browser tab

---

## Re-brand checklist (store #N)

```
[ ] Edit storeName, tagline, description in brand.config.ts
[ ] Edit colors.primary (and secondary/bg/text if needed)
[ ] Edit fonts.heading / fonts.body
[ ] Add public/images/logo.svg (logo shows automatically; without it, store-name text shows)
[ ] Add public/favicon.ico (storefront favicon — wired automatically)
[ ] Copy the SAME favicon to apps/backend/scripts/admin-favicon.ico (admin tab icon)
[ ] Set backend env ADMIN_APP_NAME = store name (or edit brand-admin.mjs fallback) for the admin title
[ ] Edit contact.address / phone / email / whatsapp
[ ] Set social links (facebook, twitter, instagram) — leave "" to hide
[ ] (Optional) Edit footer INFO_LINKS / SUPPORT_LINKS / POLICY_LINKS
[ ] npm run dev  →  verify colors, logo, favicon, store name in browser
[ ] git commit -m "brand: Acme Shop"
[ ] Deploy (see Part 2)
```

After deploy, continue with admin content:
- Admin → Store Settings (contact buttons + integration cards: Payments, Couriers, Tracking, Auth, Notifications)
- Admin → Homepage (hero, banners, featured sections)
- Admin → Product Cards (card style, fields, grid)
