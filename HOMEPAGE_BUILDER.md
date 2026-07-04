# Homepage Builder

A CMS-lite feature built on top of Medusa 2.0 that lets admins compose and manage the storefront homepage from the Medusa admin dashboard — no code deploys needed for content changes.

---

## Architecture overview

```
Admin UI (Vite extension)          Backend (Medusa 2.0)           Storefront (Next.js)
─────────────────────              ──────────────────             ────────────────────
/admin/homepage/page.tsx   ──►    /admin/homepage/*  ──►  DB     /store/homepage  ──►  page.tsx
  AddSectionModal                  /store/homepage               lib/data/homepage.ts
  EditSectionDrawer                 resolves slides /            section-registry.tsx
                                    categories /                 hero-carousel/
                                    products per type            featured-categories/
                                                                 product-showcase/
```

**Data flow:**
1. Admin creates/edits sections and slides via the protected `/admin/homepage/*` routes.
2. `GET /store/homepage` resolves each enabled section's data (slides, categories, or products) server-side and returns a lean JSON payload.
3. The storefront homepage (`page.tsx`) fetches this payload with `next: { revalidate: 60 }` and maps each section through `SECTION_REGISTRY[type][layout]` to render the correct component.

---

## End-to-end test walkthrough

### Prerequisites

Both services must be running:

```bash
# Terminal 1 — backend
cd apps/backend
npx medusa develop          # http://localhost:9000

# Terminal 2 — storefront
cd apps/storefront
npm run dev                 # http://localhost:8000
```

---

### Step 1 — Log in to admin

Open `http://localhost:9000/app` and log in. You should see **Homepage** in the left sidebar under the custom section. Click it.

Expected: The "Homepage Sections" page loads. Initially empty with an "Add your first section" button.

---

### Step 2 — Create a hero_carousel section

1. Click **Add Section**.
2. Step 1: Select **Hero Carousel** → **Next**.
3. Step 2: Title = `"Main Hero"`, Layout = `full_width` → **Create Section**.
4. The section appears in the list with a blue "Hero Carousel" badge.
5. Click the **pencil (edit)** icon to open the drawer.
6. In the **Slides** tab, click **Add slide**.
7. Upload an image (any JPEG/PNG from your local machine).
8. Fill in: Heading = `"Welcome"`, Subheading = `"Shop the new collection"`, CTA = `"Shop Now"` / `/store`.
9. Click **Save slide**.
10. Close the drawer.

**Verify on storefront:**
Open `http://localhost:8000/{your-country-code}` (e.g. `/dk`). The full-width hero carousel should render with your image, heading, and CTA button. Wait up to 60 seconds if you see the old page — Next.js ISR revalidates on the next request after the 60 s window.

> **Tip for instant dev reload:** In development (`npm run dev` with turbopack), `revalidate` is treated as 0 — changes appear immediately on the next browser refresh.

---

### Step 3 — Test the boxed layout variant

1. Click the pencil icon on "Main Hero".
2. In the **Meta** tab, change Layout to `boxed` → **Save**.
3. Refresh the storefront.

Expected: The hero is now constrained with rounded corners and vertical margin rather than edge-to-edge.

---

### Step 4 — Create a featured_categories section

1. **Add Section** → **Featured Categories** → **Next**.
2. Title = `"Shop by Category"`, Layout = `grid` → **Create Section**.
3. Open the edit drawer → **Categories** tab.
4. Check any categories you want to feature (or leave empty to auto-resolve all top-level categories).
5. Click **Save settings**.

**Verify on storefront:** A 2–4 column grid of category tiles appears below the hero.

Test the other layouts by editing the section:
- `circles` — circular thumbnails with labels underneath.
- `horizontal_scroll` — a horizontally scrollable row that snaps.

---

### Step 5 — Create a product_showcase section

1. **Add Section** → **Product Showcase** → **Next**.
2. Title = `"Featured Products"`, Layout = `grid_4` → **Create Section**.
3. Open edit drawer → **Products** tab.
4. Choose Source = **Manual** → check specific products → set Limit = `8` → **Save**.
5. Refresh the storefront.

Expected: A 4-column product grid under the categories section.

**Test source switching:**
- Change Source to **Category** and pick a category → save → verify only that category's products render.
- Change Source to **Bestsellers** → save → verify it falls back to newest products (no orders exist yet in dev; see Rough Edges).

**Test other layouts:**
- `carousel` — horizontal scroll rail with prev/next arrow buttons.
- `list` — vertical list with thumbnail, title, and arrow.

---

### Step 6 — Reorder sections

On the Homepage Sections list, click the ↑ / ↓ arrows to move sections up or down. The order is saved immediately. Refresh the storefront to confirm the new render order.

---

### Step 7 — Toggle enable/disable

Click the toggle switch on any section to disable it. Refresh the storefront — the section disappears. Re-enable and confirm it returns.

This is the recommended way to temporarily hide a section without deleting it.

---

### Step 8 — Delete a section

Click the trash icon on a section and confirm the prompt. The section and all its slides are permanently deleted.

---

## Extending the Homepage Builder

Adding a new section type (e.g. `banner_strip`) or a new layout to an existing type is a four-file recipe. All changes are isolated — no existing code needs to be touched except for adding entries to the relevant maps.

---

### Recipe: add a new section TYPE

**Scenario:** Add a `"banner_strip"` type with a single layout `"full_width"` that shows a coloured banner with text.

#### 1. Backend — shared types (`apps/backend/src/modules/homepage/types.ts`)

Add the new type to the const array and add a settings shape:

```typescript
export const SECTION_TYPES = [
  "hero_carousel",
  "featured_categories",
  "product_showcase",
  "banner_strip",          // ← add here
] as const

// New layout array
export const BANNER_STRIP_LAYOUTS = ["full_width"] as const
export type BannerStripLayout = (typeof BANNER_STRIP_LAYOUTS)[number]

// Add to the central layout map
export const LAYOUT_KEYS: Record<SectionType, readonly string[]> = {
  hero_carousel:        HERO_CAROUSEL_LAYOUTS,
  featured_categories:  FEATURED_CATEGORIES_LAYOUTS,
  product_showcase:     PRODUCT_SHOWCASE_LAYOUTS,
  banner_strip:         BANNER_STRIP_LAYOUTS,   // ← add here
}

// New settings shape
export type BannerStripSettings = {
  text: string
  background_color: string
  link?: string
}
```

Adding to `SECTION_TYPES` automatically makes the DB enum accept the value via the `model.enum([...SECTION_TYPES])` call in `HomeSection`. **Run a migration** after this change:

```bash
cd apps/backend
npx medusa db:generate homepage
npx medusa db:migrate
```

#### 2. Backend — store route resolution (`apps/backend/src/api/store/homepage/route.ts`)

Add a `case` to the switch in the `GET` handler:

```typescript
case "banner_strip": {
  const settings = section.settings as BannerStripSettings
  return { ...base, banner: settings ?? null }
}
```

The new field (`banner`) appears in the storefront payload for this section type.

#### 3. Admin — add-section wizard (`apps/backend/src/admin/routes/homepage/components/add-section.tsx`)

The wizard reads `LAYOUT_KEYS` from `types.ts` for the layout dropdown — if you exported it from there you are done. You only need to add human-readable labels:

```typescript
const TYPE_INFO: Record<SectionType, { label: string; description: string }> = {
  // ... existing entries ...
  banner_strip: {
    label: "Banner Strip",
    description: "A full-width coloured strip with a message and optional link.",
  },
}
```

For any type-specific settings the admin needs to edit, add a new editor component inside `EditSectionDrawer` in `edit-section.tsx` — follow the pattern of `ShowcaseEditor` or `CategoriesEditor`.

#### 4. Storefront — section registry and component

**a) Types** (`apps/storefront/src/modules/home/types.ts`)

```typescript
export interface BannerStripSection extends SectionBase {
  type: "banner_strip"
  banner: { text: string; background_color: string; link?: string } | null
}

// Add to the discriminated union
export type HomepageSection =
  | HeroCarouselSection
  | FeaturedCategoriesSection
  | ProductShowcaseSection
  | BannerStripSection        // ← add here
```

**b) Component** (`apps/storefront/src/modules/home/components/banner-strip/index.tsx`)

```typescript
import type { BannerStripSection, SectionProps } from "@modules/home/types"
import LocalizedClientLink from "@modules/common/components/localized-client-link"

export function BannerStrip({ section, countryCode: _cc }: SectionProps) {
  const s = section as BannerStripSection
  if (!s.banner) return null

  return (
    <div
      className="w-full py-4 text-center text-sm font-medium"
      style={{ backgroundColor: s.banner.background_color, color: "#fff" }}
    >
      {s.banner.link ? (
        <LocalizedClientLink href={s.banner.link}>{s.banner.text}</LocalizedClientLink>
      ) : (
        <span>{s.banner.text}</span>
      )}
    </div>
  )
}
```

**c) Registry** (`apps/storefront/src/modules/home/section-registry.tsx`)

```typescript
import { BannerStrip } from "./components/banner-strip"

export const SECTION_REGISTRY = {
  // ... existing entries ...
  banner_strip: {
    full_width: (props) => <BannerStrip {...props} />,
  },
}
```

That is the full recipe. The storefront homepage `page.tsx` needs no changes — it looks up `SECTION_REGISTRY[section.type][section.layout]` dynamically and skips unknown entries gracefully.

---

### Recipe: add a new LAYOUT to an existing type

**Scenario:** Add a `"masonry"` layout to `featured_categories`.

1. **`types.ts` (backend):** Add `"masonry"` to `FEATURED_CATEGORIES_LAYOUTS`.
2. **Migration:** Run `npx medusa db:generate homepage && npx medusa db:migrate` — the layout field is a plain `text` column so no schema change is needed; the migration will be a no-op. You still run it to keep the snapshot in sync.
3. **Store route:** No change needed — `featured_categories` resolution is layout-agnostic.
4. **Admin wizard:** `LAYOUT_KEYS` is sourced from `types.ts` so the new layout appears in the dropdown automatically.
5. **Storefront component:** Add the rendering logic inside `featured-categories/index.tsx` and register it:

```typescript
// featured-categories/index.tsx — add another branch
{variant === "masonry" && <Masonry categories={categories} countryCode={countryCode} />}

// section-registry.tsx — add one line
featured_categories: {
  grid:              ...,
  circles:           ...,
  horizontal_scroll: ...,
  masonry: (props) => <FeaturedCategories {...props} variant="masonry" />,
},
```

---

## Rough edges and known limitations

### Bestsellers with no order history

When `source = "bestsellers"` is selected for a `product_showcase` section and no orders exist in the database (typical for a fresh dev environment), the bestseller aggregation finds zero line items and automatically falls back to **newest published products**. This is intentional — the storefront never shows an empty section — but admins setting up bestsellers for the first time will see "newest" products until real orders accumulate.

For a production store with high order volume, replace the in-memory aggregation in `resolveBestsellers()` with a raw SQL `GROUP BY` query or a pre-computed analytics table, since fetching up to 500 orders on every storefront request does not scale.

### Price is always `null`

The `products[].price` field in the `/store/homepage` response is always `null`. Medusa's pricing engine requires a region, currency, and customer context that is not available in a public, non-authenticated route without extra work. If you need prices on the homepage, options are:
- Pass `?region_id=...` as a query parameter and resolve pricing in the route using `@medusajs/framework/pricing`.
- Let the client fetch prices separately via `GET /store/products?ids=...` after the page loads.
- Use the existing `ProductPreview` component (which handles pricing) if you switch the product showcase to a full Medusa product fetch.

### Category thumbnails are `null`

Medusa's `product_category` entity does not have a built-in `thumbnail` field. The `categories[].thumbnail` key is always `null` in the current implementation. To support category images, add a custom `thumbnail_url` metadata field to each category and read it in `resolveCategories()`, or extend the module to maintain a separate category-thumbnail table.

### Image storage: local only in development

Images uploaded via the admin slide editor are stored by Medusa's File Module. In development the default provider writes files to the local filesystem and serves them at `http://localhost:9000/uploads/...`. This path is baked into `image_url` and works fine locally.

**In production you must configure an S3-compatible remote provider** (Cloudflare R2, AWS S3, etc.) before going live. Any images uploaded in dev will have localhost URLs that are unreachable from a deployed storefront. The switch is a one-line config change in `medusa-config.ts`:

```typescript
modules: [
  {
    resolve: "@medusajs/file",
    options: {
      providers: [{
        resolve: "@medusajs/file-s3",
        id: "s3",
        options: {
          file_url: process.env.S3_FILE_URL,
          access_key_id: process.env.S3_ACCESS_KEY_ID,
          secret_access_key: process.env.S3_SECRET_ACCESS_KEY,
          region: process.env.S3_REGION,
          bucket: process.env.S3_BUCKET,
        },
      }],
    },
  },
],
```

### ISR revalidation window

The storefront uses `next: { revalidate: 60 }` (60-second ISR). Admin changes appear on the storefront within one minute in production. During local `next dev`, Next.js bypasses the revalidation window and reflects changes immediately on the next browser refresh — so the 60-second window is only relevant in production builds.

To force an immediate production update, call `res.revalidatePath("/")` from a webhook or a custom admin route, or lower the revalidate interval for faster iteration.

---

## Complete file diff by layer

All files added or modified by the Homepage Builder feature:

### Module layer — `apps/backend/src/modules/homepage/`

| File | Purpose |
|---|---|
| `index.ts` | Module registration — exports `HOMEPAGE_MODULE` constant and wires `HomepageModuleService` |
| `service.ts` | `HomepageModuleService extends MedusaService({ HomeSection, HomeSlide })` — auto-generates CRUD methods |
| `types.ts` | Canonical type/layout enums and settings JSON shapes; single source of truth referenced by API routes and admin UI |
| `models/home-section.ts` | `home_section` table — id, title, type, layout, position, enabled, settings (json), hasMany slides |
| `models/home-slide.ts` | `home_slide` table — id, image_url, mobile_image_url, heading, subheading, cta_label, cta_link, position, belongsTo section |
| `migrations/Migration20260613175051.ts` | Initial DDL migration creating both tables |

### API layer — `apps/backend/src/api/`

| File | Route | Notes |
|---|---|---|
| `admin/homepage/sections/route.ts` | GET + POST `/admin/homepage/sections` | List all (+ slides), create section |
| `admin/homepage/sections/reorder/route.ts` | POST `/admin/homepage/sections/reorder` | Reorder by ordered id array |
| `admin/homepage/sections/[id]/route.ts` | GET + POST + DELETE `/admin/homepage/sections/:id` | Read, update, delete one section |
| `admin/homepage/sections/[id]/slides/route.ts` | POST `/admin/homepage/sections/:id/slides` | Add slide, auto-assigns position |
| `admin/homepage/slides/[id]/route.ts` | POST + DELETE `/admin/homepage/slides/:id` | Update or delete one slide |
| `admin/homepage/slides/reorder/route.ts` | POST `/admin/homepage/slides/reorder` | Reorder slides by ordered id array |
| `admin/homepage/upload/route.ts` | POST `/admin/homepage/upload` | Proxies to Medusa File Module, returns `{ url }` |
| `store/homepage/route.ts` | GET `/store/homepage` | Public route — resolves all enabled sections with their data (slides / categories / products) |
| `middlewares.ts` | — | Adds `cors` for `/store/homepage` |

### Admin UI layer — `apps/backend/src/admin/routes/homepage/`

| File | Purpose |
|---|---|
| `page.tsx` | Main page — section list with enable toggle, reorder arrows, edit/delete; exports shared types (`HomeSection`, `HomeSlide`, `SectionType`) and `adminFetch` helper used by sub-components |
| `components/add-section.tsx` | Two-step `FocusModal` wizard: pick type → set title + layout |
| `components/edit-section.tsx` | `Drawer` with per-type editors: `HeroEditor` (slides list + `SlideForm` with image upload), `CategoriesEditor` (checkbox list), `ShowcaseEditor` (source radio + product/category pickers + limit input); plus `MetaEditor` for title/layout |

### Storefront layer — `apps/storefront/src/`

| File | Purpose |
|---|---|
| `modules/home/types.ts` | Mirrors the store contract: `HeroSlide`, `HomepageCategory`, `HomepageProduct`, discriminated union `HomepageSection`, shared `SectionProps` |
| `lib/data/homepage.ts` | `getHomepageSections()` — server-side `fetch` with `next: { revalidate: 60 }` |
| `modules/home/section-registry.tsx` | `SECTION_REGISTRY: Record<type, Record<layout, Component>>` — single source of truth for valid type+layout pairs |
| `modules/home/components/hero-carousel/index.tsx` | `"use client"` — fade-transition carousel, 5 s autoplay (pauses on hover), prev/next arrows, dot navigation, `<picture>` for mobile images, CTA via `LocalizedClientLink` |
| `modules/home/components/featured-categories/index.tsx` | Server component — `grid` (2–4 col), `circles` (round thumbnails), `horizontal_scroll` (CSS snap scroll) |
| `modules/home/components/product-showcase/index.tsx` | Server component — `grid_4` (4-col), `list` (row with thumbnail), imports client carousel |
| `modules/home/components/product-showcase/product-carousel.tsx` | `"use client"` — `scrollBy`-based horizontal scroll with prev/next buttons |
| `app/[countryCode]/(main)/page.tsx` | **Replaced** static hero — server fetches sections, maps through registry, renders in order; shows empty state when no sections are enabled |
