# Part 3 — Feature Configuration Guide

Every feature in this template is **optional and off by default**. A store with only
the required env vars is a working cash-on-delivery storefront. Enable features one at
a time as the client is ready.

---

## How secrets are stored

**All integration secrets are environment variables.** Nothing sensitive is stored in
the admin dashboard or the database — there is no encryption key to manage.

| Kind | Where set | Changed by |
|------|-----------|-----------|
| **Secrets** (API keys, tokens, passwords) | Your hosting platform's environment variables | Edit the env var → restart the backend |
| **Non-secret settings + on/off toggles** | Admin → **Store Settings** (saved in the DB) | Edit in the admin, takes effect immediately |

Each provider appears as a card in **Admin → Store Settings**. The card shows a
**Configured / Not configured** badge (derived from whether its env vars are set),
an enable **toggle**, non-secret fields (e.g. sender name, pixel ID), and a **Guide**
popup. If a provider's env vars aren't set, its toggle is disabled and the card says so.

> **No `APP_SECRETS_ENCRYPTION_KEY`.** Earlier versions encrypted admin-entered
> credentials with this key. Secrets now live only in the environment, so the key —
> and the old admin credential forms — have been removed.

---

## Cash-on-Delivery (COD) — built-in, no setup

Medusa includes a manual payment provider ("Pay on Delivery") enabled automatically.
No env vars or admin configuration required. Customers can place orders and pay on
delivery from day one.

Draft orders are also available out of the box — Admin → Orders → Create Draft Order,
or the **New Order** admin page for a quick manual order.

---

## Store Settings (Admin → Store Settings)

Store Settings is the single hub for store configuration. It holds the storefront
contact buttons plus a collapsible card per integration category (Payments, Couriers,
Tracking & Analytics, Authentication, Notifications), and utility sections (Storage
Cleanup, Error Log, Danger Zone).

| Setting | Effect |
|---------|--------|
| WhatsApp number | WhatsApp chat button on product pages (overrides `contact.whatsapp` in brand.config) |
| Order phone | "Call for Order" button + shown in order confirmation |

---

## Homepage Builder (Admin → Homepage)

The homepage consists of configurable sections managed entirely in the admin:
- Hero banner with title, subtitle, CTA button, and background image
- Featured categories grid
- Promotional banners
- Featured product collections

No env vars or code changes needed. Sections appear on the storefront immediately on
save (next page load; revalidation is set to 60 seconds).

---

## Product Cards (Admin → Product Cards)

Controls how product cards render across the storefront:

| Setting | Options |
|---------|---------|
| Card style | minimal, classic, detailed, overlay, compact |
| Visible fields | Name, price, Add to Cart button, Buy Now button, badges |
| Button layout | side by side / stacked |
| Action mode | navigate to PDP / add to cart directly |
| Badge settings | Sale label, New Arrival (days threshold), custom badge |
| Text alignment | left / center |
| Grid columns | mobile / tablet / desktop column count |

No env vars. Changes apply on next storefront page load.

---

## Brands (Admin → Brands)

Create brand records and assign products to them. Brands appear as:
- A "Shop by Brand" filter in the store filter drawer (only shown when at least one
  brand has products assigned)
- A `/brands` listing page and individual `/brands/[handle]` pages

**Steps:**
1. Admin → Brands → Create Brand (name, handle, logo URL, description, website, position)
2. Go to any product → Brand widget (top of product detail page) → Assign Brand
3. The brand filter appears automatically in the storefront once a brand has products

---

## Email — Transactional (Store Settings → Notifications)

**What it does:** Sends order confirmation, shipping update, cancellation, and
password-reset emails via [Resend](https://resend.com).

**Triggers automatically:** order placed, order shipped, order canceled, password reset

**External account needed:** Resend (free tier available — check resend.com for current limits)

**Setup:**

1. Create a Resend account at [resend.com](https://resend.com)
2. Resend → Domains → **Add Domain** → add the SPF/DKIM DNS records → wait for verification
3. Resend → API Keys → **Create API Key** (Sending access) → copy it
4. Set the backend env vars and restart:
   ```
   RESEND_API_KEY=re_...                       # required — enables email
   RESEND_FROM_EMAIL=orders@yourdomain.com     # optional here; also editable in Store Settings
   RESEND_FROM_NAME=Acme Shop                  # optional; also editable in Store Settings
   STORE_URL=https://shop.acmeshop.com         # used inside templates for logo/links
   ```
5. Admin → Store Settings → **Notifications**: the Email card turns **Configured**.
   Edit From Email/Name, toggle per-type emails, and use the **Send test email** button.

**Without this configured:** email sends are silently skipped. No crashes.

---

## SMS — Transactional (Store Settings → Notifications)

**What it does:** Sends order confirmation, shipping update, and cancellation SMS.

**Supported providers:** **Twilio** (global) or **Generic HTTP** (any gateway with a
simple HTTP API, e.g. Bangladeshi providers).

**Setup:**

1. Get credentials — Twilio: Account SID + Auth Token + a From number. Generic HTTP:
   API key, sender ID, and gateway URL.
2. Set the backend env vars and restart:
   ```
   SMS_API_KEY=ACxxxx              # Twilio Account SID, or gateway API key (required)
   TWILIO_AUTH_TOKEN=your_token    # Twilio only
   SMS_PROVIDER=twilio             # or "generic_http" (also editable in Store Settings)
   SMS_SENDER_ID=+15005550006      # from-number / sender ID
   SMS_API_URL=https://gateway/api/send   # generic_http only
   ```
3. Admin → Store Settings → **Notifications**: the SMS card turns **Configured**. SMS
   per-type toggles default **OFF** (each message costs money) — enable what you need
   and use **Send test SMS**.

**Without this configured:** SMS sends are silently skipped.

> **Note:** Phone OTP authentication (below) requires SMS to be configured.

---

## Payments — Stripe (Environment variables)

**What it enables:** International card payments, Apple Pay, Google Pay via Stripe.

**Env vars (backend — both required together):**

```
STRIPE_API_KEY=sk_live_...          # or sk_test_... for testing
STRIPE_WEBHOOK_SECRET=whsec_...
```

**Storefront env var:** `NEXT_PUBLIC_STRIPE_KEY=pk_live_...`

**Webhook setup:** Stripe → Developers → Webhooks → Add endpoint →
`https://api.acmeshop.com/hooks/payment/stripe_stripe`; events `payment_intent.succeeded`,
`payment_intent.payment_failed` → copy the signing secret into `STRIPE_WEBHOOK_SECRET`.

Then enable it: turn the Stripe toggle on in Store Settings → Payments, **and** enable
`pp_stripe_stripe` per region in Settings → Regions → Payment Providers.

**Without this:** Stripe doesn't appear at checkout. COD still works.

---

## Payments — SSLCommerz (Environment variables)

**What it enables:** BD aggregator — cards, bKash, Nagad, Rocket, EMI, internet banking.

```
SSLCOMMERZ_STORE_ID=your_store_id
SSLCOMMERZ_STORE_PASSWORD=your_store_password
SSLCOMMERZ_SANDBOX=true             # set to false for live
BACKEND_URL=https://api.acmeshop.com
```

`BACKEND_URL` is required — it builds the `success_url` / `fail_url` / `cancel_url` /
`ipn_url` callbacks. Enable per region in Settings → Regions → Payment Providers.

**Without this:** SSLCommerz doesn't appear at checkout.

---

## Payments — bKash Direct (Environment variables)

**What it enables:** Direct bKash tokenized checkout (PGW). Most merchants use
SSLCommerz instead (it already includes bKash) — use this only for bKash-only.

```
BKASH_APP_KEY=your_app_key
BKASH_APP_SECRET=your_app_secret
BKASH_USERNAME=your_username
BKASH_PASSWORD=your_password
BKASH_SANDBOX=true                  # set to false for live
BACKEND_URL=https://api.acmeshop.com
```

**Without this:** bKash doesn't appear at checkout.

---

## Couriers (Store Settings → Couriers)

**What it does:** Books shipments for orders via the active courier's API. Only one
courier can be active at a time. When a courier reports a parcel **Returned**, the
order's items are automatically restocked (a native return is created; no refund).

**Supported couriers:** Steadfast, RedX, Pathao.

**Env vars (set the courier(s) you use, then restart):**

```
# Steadfast (no sandbox)
STEADFAST_API_KEY=your_api_key
STEADFAST_SECRET_KEY=your_secret_key

# RedX
REDX_API_TOKEN=your_api_token
REDX_SANDBOX=false                  # "true" for the sandbox gateway

# Pathao
PATHAO_CLIENT_ID=your_client_id
PATHAO_CLIENT_SECRET=your_client_secret
PATHAO_USERNAME=merchant@example.com
PATHAO_PASSWORD=your_password
PATHAO_STORE_ID=12345               # optional
PATHAO_SANDBOX=false                # "true" for the sandbox gateway
```

**Then:** Admin → Store Settings → **Couriers** → the courier card turns **Configured**
→ use **Test connection** in the Guide → click **Set as active**. Set an optional pickup
address on the card.

**Where to get credentials:**
- **Steadfast:** portal.packzy.com → Account → API Settings
- **RedX:** RedX account manager for API access; token in the merchant portal
- **Pathao:** Apply for Courier API at pathao.com

**Without this configured:** no active fulfillment provider; orders can still be
fulfilled manually. No crashes.

---

## Tracking & Analytics (Store Settings → Tracking & Analytics)

### Meta Pixel (runtime, no redeploy)

1. Meta Events Manager → select/create a Pixel → copy the **Pixel ID** (15–16 digits)
2. Admin → Store Settings → Tracking & Analytics → **Pixel ID** → Save

Not a secret — stored plainly. Loads on the storefront at runtime (no redeploy).
`NEXT_PUBLIC_META_PIXEL_ID` (storefront) is a fallback; the admin value takes precedence.

### GA4 (runtime, no redeploy)

Copy the **Measurement ID** (`G-XXXXXXXX`) from Google Analytics → Data Streams → Web →
paste into Admin → Store Settings → Tracking & Analytics → **GA4 Measurement ID** → Save.

### Meta Conversions API / CAPI (server-side events)

**What it does:** Sends `Purchase` events to Meta server-side (survives ad blockers).

**Env var:** `META_CAPI_ACCESS_TOKEN=EAAB...` (from Events Manager → your Pixel →
Conversions API). No encryption key needed.

**Setup:**
1. Set `META_CAPI_ACCESS_TOKEN` in the backend env and restart.
2. Admin → Store Settings → Tracking & Analytics → the CAPI card turns **Configured** →
   toggle **Enable CAPI** + **Send Purchase events** on.

#### Deduplication — critical

With CAPI on, every purchase fires **two** Purchase events (browser Pixel + server CAPI).
Meta deduplicates them by a shared `event_id`, handled automatically here: both the
storefront Pixel and the `order.placed` subscriber use `order.id` as the event id.

Verify before going live with a **Test Event Code** (a field on the CAPI card): place a
test order and confirm Events Manager shows **one** deduplicated event, not two. Clear
the code afterward.

**Without this:** only the browser Pixel fires.

### Google Tag Manager / TikTok / Google Ads (storefront env vars)

```
NEXT_PUBLIC_GTM_ID=GTM-XXXXXXX
NEXT_PUBLIC_TIKTOK_PIXEL_ID=ABCDEFGHIJ
NEXT_PUBLIC_GADS_ID=AW-123456789
```

Set in the storefront's env vars; changing them requires a storefront rebuild.

---

## Authentication (Store Settings → Authentication)

### Google Sign-In

**What it does:** "Sign in with Google" on the storefront account/login page.

**Env var:** `GOOGLE_CLIENT_SECRET=GOCSPX-...` (the secret only). The **Client ID** and
**Redirect URI** are non-secret and entered on the Authentication card.

**Setup:**
1. [console.cloud.google.com](https://console.cloud.google.com) → APIs & Services →
   Credentials → **Create OAuth client ID** → Web application.
2. Authorized redirect URIs: one **per country code** the storefront serves, e.g.
   `https://shop.acmeshop.com/en/account/google-callback`,
   `https://shop.acmeshop.com/bd/account/google-callback`.
3. Set `GOOGLE_CLIENT_SECRET` in the backend env and restart.
4. Admin → Store Settings → **Authentication** → Google card: enter **Client ID** and the
   **Redirect URI** (exact match), toggle **Enable Google Sign-In** on. The card turns
   **Configured** once the client ID is set and the env secret is present.

> **`redirect_uri_mismatch`:** the Redirect URI on the card must exactly match what's
> registered in Google Cloud Console — including the country-code prefix.

**Without this:** the Google button is hidden. Email/password login still works.

### Phone OTP

> **Prerequisite:** SMS must be configured (env `SMS_API_KEY`, see Notifications) before
> enabling Phone OTP.

**What it does:** Customers sign in with a phone number; a one-time SMS code authenticates.

**Setup:** Admin → Store Settings → **Authentication** → Phone OTP card → toggle on and
adjust OTP length / expiry / max attempts / resend cooldown.

**Without SMS configured:** the toggle is disabled and the card warns that SMS is required.

---

## Guides in the admin

Each provider card in Store Settings has a **Guide** button that opens a popup with
step-by-step instructions, links, the exact env vars to set, a live connection test, and
troubleshooting. The guides are the canonical reference; this document is the overview.

---

## Summary — what is configured where

| Feature | Secret env var(s) | Non-secret / toggle in Store Settings |
|---------|-------------------|---------------------------------------|
| COD / draft orders | — | — |
| Contact buttons (WhatsApp, phone) | — | Store Settings |
| Homepage / Product cards / Brands | — | Their own admin pages |
| Email (Resend) | `RESEND_API_KEY` (+ `STORE_URL`) | From email/name, per-type toggles |
| SMS | `SMS_API_KEY`, `TWILIO_AUTH_TOKEN` | Provider, sender ID, per-type toggles |
| Stripe | `STRIPE_API_KEY`, `STRIPE_WEBHOOK_SECRET`, `NEXT_PUBLIC_STRIPE_KEY` | Enable toggle (+ region) |
| SSLCommerz | `SSLCOMMERZ_STORE_ID`, `SSLCOMMERZ_STORE_PASSWORD`, `BACKEND_URL` | Enable toggle (+ region) |
| bKash direct | `BKASH_*` × 4, `BACKEND_URL` | Enable toggle (+ region) |
| Couriers | `STEADFAST_*` / `REDX_*` / `PATHAO_*` | Active courier, pickup address |
| Meta Pixel / GA4 | — | Pixel ID, GA4 ID |
| Meta CAPI | `META_CAPI_ACCESS_TOKEN` | Enable + Purchase toggles, test code |
| GTM / TikTok / Google Ads | `NEXT_PUBLIC_GTM_ID` / `NEXT_PUBLIC_TIKTOK_PIXEL_ID` / `NEXT_PUBLIC_GADS_ID` | — |
| Google Sign-In | `GOOGLE_CLIENT_SECRET` | Client ID, redirect URI, enable toggle |
| Phone OTP | Requires SMS | Enable + OTP params |
