# Part 4 — Store Onboarding Checklist

Use this checklist when handing a finished store to a client. It covers everything
from your deploy work to what the client sets up themselves in the admin.

---

## Section A — You do (before handing over)

### Branding & code
```
[ ] brand.config.ts updated — storeName, tagline, description, colors, fonts, contact, social
[ ] Logo placed at apps/storefront/public/images/logo.svg (or matching logoPath)
[ ] Favicon placed at apps/storefront/public/favicon.ico (or matching faviconPath)
[ ] Footer links reviewed (apps/storefront/src/modules/layout/templates/footer/index.tsx)
[ ] Changes committed and pushed to the store's Git repository
```

### Deploy (Dockerfile build — Coolify shown; any Docker host works)
```
[ ] PostgreSQL 15+ created and running
[ ] S3-compatible bucket ready (R2 / B2 / MinIO / Garage / AWS S3 — any provider):
    [ ] Bucket created (e.g. medusa-store)
    [ ] Public read access enabled (provider-specific)
    [ ] Endpoint, Access Key, Secret Key, public URL noted
[ ] Backend app created — Build Pack: Dockerfile, Base Dir: apps/backend, Port: 9000
    [ ] Build timeout raised (3600) ; deploy one app at a time (avoid OOM)
[ ] Backend REQUIRED env vars set (RUNTIME — not build-time-only):
    [ ] DATABASE_URL (internal Postgres URL, not localhost)
    [ ] JWT_SECRET (openssl rand -hex 32)
    [ ] COOKIE_SECRET (openssl rand -hex 32)
    [ ] STORE_CORS = https://shop.acmeshop.com
    [ ] ADMIN_CORS = https://api.acmeshop.com
    [ ] AUTH_CORS = https://api.acmeshop.com,https://shop.acmeshop.com
    [ ] MEDUSA_ADMIN_ONBOARDING_TYPE = nextjs
[ ] S3 env vars set on backend (all six together):
    [ ] S3_ENDPOINT   (provider API endpoint)
    [ ] S3_BUCKET = medusa-store
    [ ] S3_ACCESS_KEY_ID
    [ ] S3_SECRET_ACCESS_KEY
    [ ] S3_REGION     (R2: auto / AWS: real region / others: any string)
    [ ] S3_FILE_URL   (public bucket URL)
[ ] Backend deployed and healthy (curl https://api.acmeshop.com/health → {"status":"ok"})
```

### Database & first-run
```
[ ] Migrations ran automatically on deploy — check backend logs for
    "Running migrations" → migrations applied → "Server is ready"
    (fallback if migrate stalls on your host: docs/02-deployment.md §7a tunnel method)
[ ] Admin user created: docker exec -it <backend-id> sh -c "cd /app/.medusa/server && npx medusa user -e admin@... -p ..."
[ ] Admin login verified at https://api.acmeshop.com/app  (hard-refresh if cached)
```

### Storefront
```
[ ] Admin → Settings → API Keys → publishable key created → key starts with pk_...
[ ] Storefront app created — Build Pack: Dockerfile, Base Dir: apps/storefront, Port: 8000
[ ] Storefront REQUIRED env vars set (NEXT_PUBLIC_* are baked in at build time):
    [ ] NEXT_PUBLIC_MEDUSA_BACKEND_URL = https://api.acmeshop.com
    [ ] NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY = pk_...
    [ ] NEXT_PUBLIC_DEFAULT_REGION = (e.g. us or bd)
    [ ] NEXT_PUBLIC_BASE_URL = https://shop.acmeshop.com
[ ] Storefront deployed and loading
[ ] Admin → Settings → Store → currency enabled (e.g. BDT) BEFORE creating the region
[ ] Admin → Settings → Regions → region created matching NEXT_PUBLIC_DEFAULT_REGION
[ ] Storefront shows store name, logo, and correct branding
[ ] COD (Pay on Delivery) available at checkout — no config needed
```

### Integration secrets (only the features this store uses)
```
[ ] Secrets set as backend env vars (restart backend after adding), as needed:
    [ ] Email:    RESEND_API_KEY (+ STORE_URL)
    [ ] SMS:      SMS_API_KEY (+ TWILIO_AUTH_TOKEN for Twilio)
    [ ] Payments: STRIPE_* / SSLCOMMERZ_* / BKASH_* (+ BACKEND_URL)
    [ ] Couriers: STEADFAST_* / REDX_* / PATHAO_*
    [ ] Tracking: META_CAPI_ACCESS_TOKEN
    [ ] Google:   GOOGLE_CLIENT_SECRET
[ ] Each provider verified in Admin → Store Settings (badge shows "Configured")
    Note: no encryption key is used — secrets live only in the environment.
```

---

## Section B — Accounts the client must create

Provide this list to the client. They need to create these accounts and supply you (or
enter themselves) the credentials.

| Account | Purpose | URL | What to obtain |
|---------|---------|-----|---------------|
| Resend | Transactional email | resend.com | API key + verified sending domain |
| SMS gateway | Transactional SMS | twilio.com (or local provider) | Account SID + Auth Token + From number |
| Stripe | Card / Apple Pay / Google Pay | stripe.com | API key (secret + publishable) + webhook secret |
| SSLCommerz | BD payment aggregator (cards, bKash, Nagad, Rocket) | sslcommerz.com | Store ID + Store Password |
| bKash (if direct) | bKash tokenized checkout | bKash merchant portal | App Key + Secret + Username + Password |
| Steadfast / RedX / Pathao | Courier integrations | respective portals | Per-courier API credentials |
| Google Cloud | Google OAuth login | console.cloud.google.com | OAuth Client ID + Client Secret |
| Meta Business | Meta Pixel + CAPI | business.facebook.com | Pixel ID + CAPI access token |
| Google Analytics | GA4 tracking | analytics.google.com | Measurement ID (G-XXXXXXXX) |

---

## Section C — What you set at deploy vs what the client sets in admin

| Configuration | Set by | Where |
|--------------|--------|-------|
| Store name, colors, fonts, logo | **You** | brand.config.ts + public/ assets (before deploy) |
| Footer static links | **You** | footer/index.tsx (before deploy) |
| Database, CORS, JWT/cookie secrets | **You** | Backend env vars (at deploy) |
| Payment secrets (Stripe/SSLCommerz/bKash) | **You** (client provides credentials) | Backend env vars (restart to apply) |
| Email secret (`RESEND_API_KEY`) | **You** (client provides) | Backend env var; from-name/toggles in Admin → Store Settings → Notifications |
| SMS secrets (`SMS_API_KEY`, `TWILIO_AUTH_TOKEN`) | **You** (client provides) | Backend env var; provider/toggles in Store Settings → Notifications |
| Courier secrets (`STEADFAST_*`/`REDX_*`/`PATHAO_*`) | **You** (client provides) | Backend env var; activation in Store Settings → Couriers |
| Meta Pixel ID, GA4 Measurement ID | **Client** (or you) | Store Settings → Tracking & Analytics |
| CAPI token (`META_CAPI_ACCESS_TOKEN`) | **You** (client provides) | Backend env var; enable in Store Settings → Tracking |
| Google OAuth secret (`GOOGLE_CLIENT_SECRET`) | **You** (client provides) | Backend env var; client ID/redirect in Store Settings → Authentication |
| Phone OTP settings | **Client** (or you) | Store Settings → Authentication |
| WhatsApp number, order phone | **Client** | Admin → Store Settings |
| Homepage sections (hero, banners, etc.) | **Client** | Admin → Homepage |
| Product catalog (products, categories, collections) | **Client** | Admin → Products / Categories |
| Brands | **Client** | Admin → Brands |
| Product card style | **Client** | Admin → Product Cards |
| Admin users (additional staff) | **Client** | Admin → Settings → Users |
| Regions / currencies / shipping | **Client** | Admin → Settings → Regions / Shipping |

---

## Section D — Final verification before handover

```
[ ] Storefront loads at https://shop.acmeshop.com — correct name, logo, colors
[ ] Can browse products (add some test products in admin first)
[ ] Cart works — add to cart, view cart
[ ] Checkout works — complete a COD test order
[ ] Order appears in Admin → Orders
[ ] Admin login works with the client's credentials (or reset password)

OPTIONAL — test each configured feature (all under Admin → Store Settings):
[ ] Email — Store Settings → Notifications → Email guide → "Send test email" arrives
[ ] SMS — Store Settings → Notifications → SMS guide → "Send test SMS" arrives
[ ] Stripe — place a test order with Stripe test card 4242 4242 4242 4242
[ ] SSLCommerz — place test order in sandbox mode
[ ] Courier — Store Settings → Couriers → courier guide → Test connection returns success
[ ] Meta Pixel + CAPI dedup — place a test order with the Test Event Code set; Meta
    Events Manager must show ONE deduplicated Purchase event (browser + server merged),
    NOT two separate events — double-counting is the make-or-break tracking check;
    remove Test Event Code before going live
[ ] GA4 — Realtime report shows a session when you open the storefront
[ ] Google OAuth — click "Sign in with Google" on storefront → login completes
[ ] Phone OTP — enter phone number → SMS received → code accepted
```

---

## Section E — Features active at handover

Fill this in for each store before handing over:

```
Store name:  ___________________________
Live URL:    ___________________________
Admin URL:   ___________________________
Admin login: ___________________________ (send securely)

ACTIVE FEATURES:
[ ] COD (always on)
[ ] Email notifications (Resend)
[ ] SMS notifications
[ ] Stripe payments
[ ] SSLCommerz payments
[ ] bKash direct payments
[ ] Couriers — active: [ ] Steadfast  [ ] RedX  [ ] Pathao
[ ] Meta Pixel
[ ] Meta CAPI
[ ] GA4
[ ] GTM
[ ] TikTok Pixel
[ ] Google Ads
[ ] Google OAuth login
[ ] Phone OTP login

ENCRYPTION KEY backed up: [ ] Yes  (location: ___________________)
```
