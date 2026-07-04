# Part 2 — Deployment Guide

---

## 0. Local development setup

Before deploying, run the stack locally to verify branding and configuration.

### Local file storage (dev only)

In local development you can skip object storage entirely — the backend writes uploads
to `apps/backend/static/` and serves them at `/static/...` automatically when no
`S3_*` vars are set. Files persist between dev server restarts (but not between
container rebuilds, so use real object storage in production).

If you prefer to test with a real S3-compatible service locally, a `docker-compose.yml`
at the repo root starts MinIO:

```bash
docker compose up -d
```

| Service | URL | Notes |
|---------|-----|-------|
| MinIO S3 API | http://localhost:9100 | Used by the backend for uploads |
| MinIO Console | http://localhost:9101 | Web UI — login: `minioadmin` / `minioadmin` |

The `medusa-store` bucket is created automatically with public-read access.
The backend `.env.example` includes matching `S3_*` vars for local MinIO — copy and
adjust for your chosen provider when deploying.

### Required env vars for local development

Copy `.env.example` to `.env` in `apps/backend/` and fill in:

```bash
# Generate unique secrets — run once each and paste the output
openssl rand -hex 32    # → JWT_SECRET
openssl rand -hex 32    # → COOKIE_SECRET
```

All integration secrets (email, SMS, couriers, CAPI, Google, payments) are plain
environment variables — there is **no encryption key** to generate or back up.

---

## 1. Architecture

```
┌─────────────────────────────────────────────────────┐
│  Your server (any Docker host)                      │
│                                                     │
│  ┌──────────────────┐     ┌──────────────────────┐  │
│  │  Next.js         │────▶│  Medusa Backend      │  │
│  │  Storefront      │     │  (API + Admin /app)  │  │
│  │  :8000 (→ 443)   │     │  :9000 (→ 443)       │  │
│  └──────────────────┘     └──────────┬───────────┘  │
│                                      │              │
│                           ┌──────────▼───────────┐  │
│                           │  PostgreSQL           │  │
│                           └──────────────────────┘  │
└─────────────────────────────────────────────────────┘
```

**One store = one deployment:**
- 1 PostgreSQL database
- 1 Medusa backend app (serves the API and the admin UI at `/app`)
- 1 Next.js storefront app
- 1 S3-compatible bucket for uploads (any provider — see Section 4d)

Each store is a **separate deployment** of this template. Stores do not share databases
or backends.

> **Deployment platform.** Both apps are standard **Dockerized** services (each ships a
> `Dockerfile`), so they run on any host that can build/run Docker images: a managed PaaS
> (Coolify, Dokploy, Railway, Render, Fly.io), or a plain VPS with Docker Compose. The
> step-by-step below uses **Coolify** as the worked example because it bundles Postgres and
> TLS, but the only things any platform needs are: build the Dockerfile, expose the port,
> set the env vars, and point a domain at it. Section 7 (migrations, first-run) is
> platform-independent.

Redis is **optional** — the backend uses an in-memory fallback automatically when
`REDIS_URL` is not set. For most small-to-medium single-instance stores the in-memory
fallback is sufficient. However, in-memory events are not persisted across restarts and
do not support running more than one backend instance — add Redis before scaling
horizontally or if you need event durability across deployments.

---

## 2. Prerequisites

| Requirement | Notes |
|-------------|-------|
| Git host | GitHub, GitLab, or Gitea — most deploy platforms can pull from any of these |
| A Docker host | Any server/PaaS that builds and runs Docker images (Coolify, Dokploy, Railway, Render, Fly.io, or a VPS with Docker Compose). 2 vCPU / 4 GB RAM minimum recommended |
| PostgreSQL 15+ | Managed by your platform, or a separate managed/self-hosted instance |
| S3-compatible storage | Any provider (AWS S3, Cloudflare R2, Backblaze B2, MinIO, Garage…) — Section 4d |
| Domain + DNS | Two subdomains per store: e.g. `api.acmeshop.com` (backend) and `shop.acmeshop.com` (storefront) |
| Node.js ≥ 20 | Recommended locally for branding (Part 1) and customization. Not needed just to deploy — the container builds and migrates itself. |

> **Builds use the committed Dockerfiles.** This template ships
> `apps/backend/Dockerfile` and `apps/storefront/Dockerfile` — these define the entire build.
> Configure your platform to build **from the Dockerfile**, not an auto-detected buildpack.
> (On Coolify/Dokploy, set **Build Pack = Dockerfile** — Nixpacks/auto-detect is unreliable for
> this stack: it intermittently fails the nix setup and corrupts the Next.js build cache.) See
> Section 4b/4c.

> **Migrations run automatically on deploy.** The backend Dockerfile's start command runs
> `medusa db:migrate` and then `medusa start`, so a normal deploy applies schema changes itself —
> no local migration step. (Fallback: on the rare host where in-container migrate stalls, run it
> from your local machine over an SSH tunnel — see Section 7a.)

---

## 3. Git repository

### First store (from scratch)

```bash
# Clone or copy the template
git clone <template-url> acme-shop
cd acme-shop

# Apply branding (see Part 1) then commit
git add -A
git commit -m "brand: Acme Shop"

# Push to your Git host
git remote set-url origin git@github.com:you/acme-shop.git
git push -u origin main
```

### Subsequent stores

Each store should be its own repository (keeps environments and deployments isolated):

```bash
# Option A — duplicate repo on GitHub/GitLab (cleanest)
# Use the "Use this template" button, or mirror:
git clone --bare <template-url> acme-shop2.git
cd acme-shop2.git && git push --mirror git@github.com:you/acme-shop2.git

# Option B — branch per store in a monorepo (more complex, not recommended)
```

Apply branding (Part 1) on the new repo before the first deploy.

---

## 4. Deploy the apps

For each store you need **three things**, in this order: a PostgreSQL database, the backend
app, and the storefront app — plus an S3-compatible bucket for uploads. The steps below show
the **Coolify** workflow as a concrete example; on another platform the equivalent is "create
a Postgres, deploy each Dockerfile, set its env vars and domain."

### 4a. PostgreSQL database

1. Coolify → **New Resource → Database → PostgreSQL**
2. Name it (e.g. `acmeshop-db`), choose a version (PostgreSQL 15+ recommended)
3. Coolify generates a connection string — copy it; you'll use it as `DATABASE_URL`
   Format: `postgres://user:password@host:5432/dbname`
4. Deploy the database resource

### 4b. Medusa backend app

1. Coolify → **New Resource → Application** → connect your Git repo, select branch `main`
2. **Build Pack:** **Dockerfile** (not Nixpacks). **Dockerfile Location:** `Dockerfile`.
   **Base Directory:** `apps/backend`.
3. Leave Build/Install/Start commands **empty** — the Dockerfile defines them. (The container
   runs `medusa db:migrate` then `medusa start` on startup — migrations apply automatically.)
4. **Port / Ports Exposes:** `9000` (required — Traefik returns `502 Bad Gateway` without it)
5. **Domain:** assign e.g. `https://app.acmeshop.com` (include `https://`) — enable SSL
6. **Build timeout:** raise to `3600` (the first `npm install` of Medusa is large)
7. Set **all required environment variables** (Section 5) before first deploy. Make sure each
   var is a **runtime** variable — in Coolify, leave **"Is Build Time" unchecked** (if checked,
   `DATABASE_URL` etc. won't exist at runtime and the app can't reach the DB).
8. Deploy. **Deploy the backend and storefront one at a time** — two simultaneous Docker
   builds can OOM the VPS.

The admin UI is served automatically at `https://app.acmeshop.com/app`.

> **The backend Dockerfile** (`apps/backend/Dockerfile`) is deliberately structured:
> base image `node:20` (Debian — **not** alpine; musl breaks some Medusa native deps), build
> in `/app`, then a second `npm install` inside `/app/.medusa/server` (the build output is a
> self-contained app with its own `package.json`), `ENV NODE_ENV=production`, and
> `CMD ["sh", "-c", "npx medusa db:migrate && exec npx medusa start"]` — it migrates then starts
> from inside `.medusa/server`. Schema migrations fail fast (bad schema → the container
> crash-loops with the error in logs); the demo-data seed is best-effort and never blocks boot.

### 4c. Next.js storefront app

1. Coolify → **New Resource → Application** → same or separate Git repo
2. **Build Pack:** **Dockerfile**. **Dockerfile Location:** `Dockerfile`. **Base Directory:**
   `apps/storefront`. Leave Build/Install/Start commands empty.
3. **Port / Ports Exposes:** `8000`
4. **Domain:** assign e.g. `https://shop.acmeshop.com` — enable SSL
5. **Build timeout:** `3600`
6. Set storefront env vars (Section 5). **`NEXT_PUBLIC_*` vars must exist at build time** —
   Next.js bakes them into the static bundle. The storefront Dockerfile declares them as
   `ARG`s so Coolify passes them as `--build-arg` automatically; just set them in Coolify as
   normal env vars before building. Changing a `NEXT_PUBLIC_*` value requires a **rebuild**,
   not just a restart.
7. Deploy **after** the backend is running, and **not at the same time as the backend build**
   (the storefront build fetches regions/config from the backend, and concurrent builds can
   OOM the VPS).

### 4d. S3-compatible file storage — strongly recommended for production

Without object storage, uploaded product images and other files are written to the
container's local disk. They are **lost on every redeploy**. Use any S3-compatible
provider to make uploads persistent.

The backend supports any S3-compatible provider via the same six env vars. Two
recommended options for Coolify deployments:

---

#### Option A — Cloudflare R2 (easiest, generous free tier)

1. Cloudflare dashboard → **R2** → **Create bucket** (e.g. `medusa-store`)
2. Bucket → **Settings → Public Access → Allow Access** — copy the public URL
   (format: `https://pub-<hash>.r2.dev` or add your own custom domain)
3. **Manage R2 API Tokens** → Create token with **Object Read & Write** on this bucket
   — copy the **Access Key ID** and **Secret Access Key**
4. Your **Account ID** is shown on the R2 overview page
5. Set these env vars on the **backend** app in Coolify:

   | Variable | Value |
   |----------|-------|
   | `S3_ENDPOINT` | `https://<account_id>.r2.cloudflarestorage.com` |
   | `S3_BUCKET` | Your bucket name, e.g. `medusa-store` |
   | `S3_ACCESS_KEY_ID` | R2 token Access Key ID |
   | `S3_SECRET_ACCESS_KEY` | R2 token Secret Access Key |
   | `S3_REGION` | `auto` |
   | `S3_FILE_URL` | Public bucket URL, e.g. `https://pub-<hash>.r2.dev` or `https://cdn.acmeshop.com` |

6. Redeploy the backend

> **Note:** R2 public access is bucket-level (enabled in the Cloudflare dashboard), not
> per-object ACL. `S3_FILE_URL` must point to the public domain, not the API endpoint.

---

#### Option B — Garage (self-hosted, runs on your Coolify VPS)

[Garage](https://garagehq.deuxfleurs.fr/) is a lightweight self-hosted S3-compatible
server. Run it as a Coolify Docker resource or a separate container.

1. Deploy Garage (Docker image: `dxflrs/garage`) — configure at minimum one node and
   one zone in `garage.toml`
2. Via `garage` CLI or the web UI, create a bucket (e.g. `medusa-store`) and make it
   public: `garage bucket allow --read medusa-store`
3. Create an API key: `garage key create medusa-backend` — copy Access Key and Secret Key
4. Set these env vars on the **backend** app in Coolify:

   | Variable | Value |
   |----------|-------|
   | `S3_ENDPOINT` | Your Garage S3 API URL, e.g. `https://garage.acmeshop.com` |
   | `S3_BUCKET` | Your bucket name, e.g. `medusa-store` |
   | `S3_ACCESS_KEY_ID` | Garage Access Key |
   | `S3_SECRET_ACCESS_KEY` | Garage Secret Key |
   | `S3_REGION` | `garage` (any string — Garage ignores it) |
   | `S3_FILE_URL` | `{S3_ENDPOINT}/{S3_BUCKET}`, e.g. `https://garage.acmeshop.com/medusa-store` |

5. Redeploy the backend

---

> **All six vars must be set together.** If any is missing, the backend falls back to
> local disk storage automatically (no errors, but files are lost on redeploy).

### Redis (optional)

If you want Redis, add a **Redis** database resource in Coolify and set `REDIS_URL`
on the backend. If `REDIS_URL` is absent, the backend uses an in-memory event bus
(safe for single-process deployments).

---

## 5. Environment variables

### 5a. Backend — REQUIRED (store will not start without these)

> **Two domains, many vars** — all URL/origin vars below resolve to just two addresses.
> Set them consistently and you won't have CORS or callback errors:
>
> | Var | Value for `api.acmeshop.com` / `shop.acmeshop.com` |
> |-----|---------------------------------------------------|
> | `STORE_CORS` | `https://shop.acmeshop.com` |
> | `ADMIN_CORS` | `https://api.acmeshop.com` |
> | `AUTH_CORS` | `https://api.acmeshop.com,https://shop.acmeshop.com` |
> | `BACKEND_URL` | `https://api.acmeshop.com` (payment callbacks) |
> | `STORE_URL` | `https://shop.acmeshop.com` (email template links) |
> | `NEXT_PUBLIC_MEDUSA_BACKEND_URL` *(storefront)* | `https://api.acmeshop.com` |
> | `NEXT_PUBLIC_BASE_URL` *(storefront)* | `https://shop.acmeshop.com` |

Set these in Coolify → your backend app → Environment Variables.

| Variable | What it is | How to generate / where to get |
|----------|-----------|-------------------------------|
| `DATABASE_URL` | Postgres connection string | Copy from your Coolify PostgreSQL resource |
| `JWT_SECRET` | Signs admin and customer JWTs | `openssl rand -hex 32` |
| `COOKIE_SECRET` | Signs session cookies | `openssl rand -hex 32` |
| `STORE_CORS` | Allowed origins for storefront requests | Your storefront URL, e.g. `https://shop.acmeshop.com` |
| `ADMIN_CORS` | Allowed origins for admin UI requests | Your backend URL, e.g. `https://api.acmeshop.com` |
| `AUTH_CORS` | Allowed origins for auth requests | Both URLs comma-separated: `https://api.acmeshop.com,https://shop.acmeshop.com` |

> **No encryption key.** Integration secrets are plain env vars (Section 5b) — there is
> no `APP_SECRETS_ENCRYPTION_KEY` to set. If an old deployment still has one, it is unused
> and can be removed.

### 5b. Backend — OPTIONAL feature vars

The store runs as a fully functional cash-on-delivery storefront without any of these.
Add them only when you are ready to enable that feature.

| Variable | Enables | Notes |
|----------|---------|-------|
| `STRIPE_API_KEY` | Stripe payments | Both `STRIPE_API_KEY` **and** `STRIPE_WEBHOOK_SECRET` must be set together |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhook verification | Register webhook at `{BACKEND_URL}/hooks/payment/stripe_stripe` |
| `SSLCOMMERZ_STORE_ID` | SSLCommerz (cards, bKash, Nagad, Rocket, EMI) | Both ID **and** PASSWORD must be set together |
| `SSLCOMMERZ_STORE_PASSWORD` | SSLCommerz | |
| `SSLCOMMERZ_SANDBOX` | SSLCommerz sandbox mode | Default `true`; set to `false` for live |
| `BKASH_APP_KEY` | bKash direct tokenized checkout | All four bKash vars must be set together |
| `BKASH_APP_SECRET` | bKash | |
| `BKASH_USERNAME` | bKash | |
| `BKASH_PASSWORD` | bKash | |
| `BKASH_SANDBOX` | bKash sandbox mode | Default `true`; set to `false` for live |
| `BACKEND_URL` | Builds payment callback URLs for SSLCommerz/bKash | e.g. `https://api.acmeshop.com` — required when using those providers |
| `RESEND_API_KEY` | Transactional email (Resend) | With Sending access; from-email/name via `RESEND_FROM_EMAIL`/`RESEND_FROM_NAME` or Store Settings |
| `STORE_URL` | Used in email templates (logo URL, account links) | e.g. `https://shop.acmeshop.com` — only needed when email is configured |
| `SMS_API_KEY` | Transactional SMS | Twilio Account SID or gateway key; Twilio also needs `TWILIO_AUTH_TOKEN` |
| `TWILIO_AUTH_TOKEN` | SMS via Twilio | Twilio only; `SMS_PROVIDER`/`SMS_SENDER_ID`/`SMS_API_URL` also settable in Store Settings |
| `META_CAPI_ACCESS_TOKEN` | Meta Conversions API (server-side Purchase events) | From Events Manager → Conversions API. Pixel/GA IDs are set in Store Settings |
| `GOOGLE_CLIENT_SECRET` | Google Sign-In | The secret only; Client ID + redirect URI are set in Store Settings → Authentication |
| `STEADFAST_API_KEY`, `STEADFAST_SECRET_KEY` | Steadfast courier | No sandbox |
| `REDX_API_TOKEN` | RedX courier | `REDX_SANDBOX=true` for the sandbox gateway |
| `PATHAO_CLIENT_ID`, `PATHAO_CLIENT_SECRET`, `PATHAO_USERNAME`, `PATHAO_PASSWORD` | Pathao courier | `PATHAO_STORE_ID` optional; `PATHAO_SANDBOX=true` for sandbox |
| `S3_FILE_URL` | Public URL prefix for uploaded files | e.g. R2: `https://pub-<hash>.r2.dev`, Garage: `https://garage.acmeshop.com/medusa-store` — all six `S3_*` vars must be set together to activate; local disk used otherwise |
| `S3_BUCKET` | Bucket name | e.g. `medusa-store` |
| `S3_ACCESS_KEY_ID` | Access key / token key | From R2 API token or Garage key |
| `S3_SECRET_ACCESS_KEY` | Secret key | From R2 API token or Garage key |
| `S3_ENDPOINT` | S3-compatible API endpoint | R2: `https://<account_id>.r2.cloudflarestorage.com`, Garage: `https://garage.acmeshop.com` — omit for AWS S3 |
| `S3_REGION` | Region string | R2: `auto`, Garage: any string, AWS: real region. Defaults to `us-east-1` when absent |
| `REDIS_URL` | Redis for event bus / job queue | e.g. `redis://localhost:6379` — in-memory fallback used when absent |
| `MEDUSA_ADMIN_ONBOARDING_TYPE` | Suppresses admin onboarding wizard | Set to `nextjs` (already in `.env.example`) |

### 5c. Storefront — REQUIRED

| Variable | What it is | Notes |
|----------|-----------|-------|
| `NEXT_PUBLIC_MEDUSA_BACKEND_URL` | Backend API URL | e.g. `https://api.acmeshop.com` |
| `NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY` | Publishable API key for store requests | Obtain from Admin → Settings → API Keys after first run (Step 7) |
| `NEXT_PUBLIC_DEFAULT_REGION` | Default country/region code | e.g. `us`, `bd`, `gb` — must match a region created in Medusa admin |
| `NEXT_PUBLIC_BASE_URL` | Storefront's own public URL | e.g. `https://shop.acmeshop.com` |

### 5d. Storefront — OPTIONAL

| Variable | Enables | Notes |
|----------|---------|-------|
| `NEXT_PUBLIC_STRIPE_KEY` | Stripe payment UI in checkout | Stripe publishable key (`pk_live_...` or `pk_test_...`) |
| `NEXT_PUBLIC_GTM_ID` | Google Tag Manager | e.g. `GTM-XXXXXXX` — fires all tags incl. PageView |
| `NEXT_PUBLIC_META_PIXEL_ID` | Meta Pixel (env-based fallback) | Meta Pixel can also be set in Admin → Store Settings → Tracking & Analytics at runtime without redeploy |
| `NEXT_PUBLIC_TIKTOK_PIXEL_ID` | TikTok Pixel | e.g. `ABCDEFGHIJ` |
| `NEXT_PUBLIC_GADS_ID` | Google Ads conversion tracking | e.g. `AW-123456789` |

---

## 6. Env vars behavior note

> All environment variables are managed in **your hosting platform's dashboard** (Coolify,
> Railway, etc.) — never edit `.env` files in the deployed container. After changing any env
> var, trigger a **Redeploy** of the affected app for the change to take effect. (Changing a
> `NEXT_PUBLIC_*` storefront var requires a full rebuild, since those are baked in at build
> time.)
>
> Every feature protected by an env var degrades gracefully when the var is absent:
> payment providers don't appear at checkout, notification providers skip sends with a
> log entry, courier credentials remain unconfigured. A store with only the REQUIRED
> vars is a fully functional cash-on-delivery storefront.

---

## 7. First-run sequence

After the backend app is deployed and healthy:

### 7a. Database migrations — automatic on deploy

**Nothing to do.** The backend container runs `medusa db:migrate` and then `medusa start` on
startup, so every deploy applies schema migrations, syncs module links, and runs migration
scripts before the server accepts traffic. Watch the deploy logs for `Running migrations…` →
migrations applied → `Server is ready`. Migrations are idempotent — repeat deploys are safe.

> **Single instance:** migrate-on-start assumes one backend instance boots at a time. If you run
> multiple replicas, scale to 1 for the migrating deploy (or run migrations out-of-band) to avoid
> a race.

---

#### Fallback — migrate from your LOCAL machine over an SSH tunnel

Only needed if in-container migrate **stalls** on your host (observed once on a specific Coolify
VPS: `db:migrate` hung after creating the `mikro_orm_migrations` table — OS/memory/network/lock
contention all ruled out; the identical command ran fine from local). If that happens, make the
Dockerfile start command `medusa start` only and run migrations from local instead:

**One-time prep:** find the Postgres container's IP on the Docker network (SSH into the VPS):
```bash
# get the postgres container id
docker ps | grep -i postgres
# its IP on the coolify network (e.g. 172.16.1.7)
docker inspect <pg-container-id> -f '{{range .NetworkSettings.Networks}}{{.IPAddress}}{{end}}'
```

**Terminal A (local) — open the tunnel and leave it running:**
```bash
ssh -L 15432:<pg-ip>:5432 <user>@<vps-ip>
```
This forwards local port `15432` to the managed Postgres.

**Terminal B (local) — run migrations from the repo source** (the path that works; same as
`npm run dev`):
```bash
cd apps/backend
# point at the tunnel; use the SAME db password as DATABASE_URL on the server
#   PowerShell:  $env:DATABASE_URL = "postgres://USER:PASS@127.0.0.1:15432/DBNAME"
#   bash:        export DATABASE_URL="postgres://USER:PASS@127.0.0.1:15432/DBNAME"
npx medusa db:migrate
```

This runs schema migrations, syncs module links, and runs migration scripts. It is
idempotent — safe to re-run. If a migration trips on `ECONNRESET` over the tunnel, just run it
again; completed migrations are skipped. Re-run it after any update that adds modules or model
fields. (`db:sync-links` is included automatically by `db:migrate`.)

> **Note on the seed:** on a fresh DB the bundled `initial-data-seed.ts` migration script seeds a
> demo store (Europe/EUR region, a warehouse, and sample products). It is wrapped so a failure is
> **logged but never blocks boot** — if it doesn't complete, create the region / sales channel /
> stock location in the admin (Section 7d). On an already-seeded store it is skipped.

### 7b. Create the first admin user

Run against the deployed container (adjust the container name for your platform):

```bash
docker exec -it <backend-container> sh -c "cd /app/.medusa/server && npx medusa user -e admin@acmeshop.com -p YourSecurePassword123"
```

Then log in at `https://api.acmeshop.com/app`.

### 7c. Create a publishable API key

1. Admin → Settings → API Keys → **Create API Key**
2. Type: **Publishable**, Name: e.g. `storefront`
3. Copy the key (starts with `pk_...`)
4. Set it as `NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY` in the **storefront** app's env vars in Coolify
5. Redeploy the storefront

### 7d. Create a region

**First enable the currency on the store:** a currency only appears in the region form after
it's added to the store. Admin → **Settings → Store → Currencies** → add your currency
(e.g. **BDT** for Bangladesh) and set the default. Countries (e.g. Bangladesh) are built-in and
selectable directly.

Then Admin → Settings → Regions → **Add Region**
- Select the currency (now listed) and countries
- Add a payment provider (the system/manual provider is available by default; Stripe/SSLCommerz
  appear only once their env keys are set)
- The region code (e.g. `us`, `bd`) should match `NEXT_PUBLIC_DEFAULT_REGION`

### 7e. Verify

```bash
# Backend health
curl https://api.acmeshop.com/health          # → {"status":"ok"}

# Storefront
open https://shop.acmeshop.com                # should load the store
```

---

## 8. Spinning up a new store — condensed flow

```
1.  BRAND first  (see docs/01-branding.md)
    → Edit brand.config.ts, swap logo/favicon, commit

2.  Coolify: create PostgreSQL resource  → note the DATABASE_URL

3.  Set up S3-compatible file storage  (see Section 4d)
    → Cloudflare R2 (recommended) or self-hosted Garage
    → Create bucket, enable public access, note endpoint + access key + secret key

4.  Coolify/Dokploy: create Backend app
    → Build Pack: Dockerfile   Base Dir: apps/backend   Port: 9000   Build timeout: 3600
    → Set REQUIRED env vars (table 5a): DATABASE_URL, JWT_SECRET, COOKIE_SECRET, CORS
    → Env vars must be RUNTIME (uncheck "Is Build Time")
    → Set CORS vars to the new store's domains
    → Set all six S3_* vars (table 5b)
    → Deploy (one app at a time — don't build backend + storefront together)
    → The container migrates on start; watch logs for "Running migrations" → "Server is ready"
      (fallback if migrate stalls on your host: Section 7a tunnel method)

5.  Create the admin user (against the running container):
                 docker exec -it <backend-id> sh -c "cd /app/.medusa/server && npx medusa user -e admin@... -p ..."

6.  Admin → Settings → API Keys → create publishable key  → copy pk_...

7.  Coolify: create Storefront app
    → Build Pack: Dockerfile   Base Dir: apps/storefront   Port: 8000   Build timeout: 3600
    → Set NEXT_PUBLIC_MEDUSA_BACKEND_URL, NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY,
      NEXT_PUBLIC_DEFAULT_REGION, NEXT_PUBLIC_BASE_URL  (baked in at build time)
    → Deploy (after backend is up; not concurrently with the backend build)

8.  Admin → Settings → Store → add currency (e.g. BDT); then Regions → add region
    matching NEXT_PUBLIC_DEFAULT_REGION

9.  Verify: curl /health  →  open storefront/app  (hard-refresh /app if cached from earlier)

10. Configure features in admin (see docs/03-configuration.md)
```

---

## 9. Troubleshooting

| Symptom | Likely cause | Fix |
|---------|-------------|-----|
| Backend crashes on start with `relation "X" does not exist` | Migrations never ran | Run migrations from local (Section 7a) — they hang inside the container |
| `medusa db:migrate` hangs at `Running migrations...` (in the container) | Known issue in this deployed env | Run migrations from your **local** machine over an SSH tunnel (Section 7a). Don't put `db:migrate` in the container CMD. |
| Backend deploy succeeds then exits "10x restarts" | App crashed on start (usually missing tables) | Check **runtime** logs (not build logs); run migrations (Section 7a) |
| Build fails: `npm error ERESOLVE ... peer @medusajs/framework` | A `^`-ranged `@medusajs/*` dep resolved to a newer minor than `framework` | Pin `@medusajs/file-s3` and `@medusajs/payment-stripe` to the exact framework version (e.g. `2.15.5`) in `apps/backend/package.json` |
| Build fails at `npm install` with exit 255 (no error text) | Build host OOM — backend + storefront building at once | Deploy one app at a time; raise build timeout to 3600 |
| Backend crashes on start | `DATABASE_URL` wrong or DB not yet ready | Check connection string; ensure PG resource is deployed before backend. Inside containers `DATABASE_URL` must use the DB's **internal** Docker hostname, not `localhost` |
| Domain shows `502 Bad Gateway` | Port not set in Coolify | Set **Ports Exposes** = `9000` (backend) / `8000` (storefront); domain must include `https://` |
| `/app` shows `Cannot GET /app` in browser but `curl localhost:9000/app` returns 200 | Stale browser cache from earlier failed deploys | Hard-refresh (Ctrl+Shift+R) or open incognito; clear site cache |
| Env var (e.g. `DATABASE_URL`) missing inside the running container | Var set as **build-time only** in Coolify | Uncheck "Is Build Time" so it's a runtime var; redeploy |
| Currency (e.g. BDT) not selectable when creating a region | Currency not enabled on the store | Admin → Settings → Store → Currencies → add it first |
| A provider card shows "Not configured" after setting its env vars | Backend not restarted, or a required var missing | Env vars are read at startup — restart the backend; confirm all of that provider's required vars are set |
| Storefront shows `Failed to fetch` or blank page | `NEXT_PUBLIC_MEDUSA_BACKEND_URL` points to wrong host, or CORS blocked | Verify `STORE_CORS` on backend matches storefront URL exactly; check `NEXT_PUBLIC_MEDUSA_BACKEND_URL` on storefront |
| `Publishable key is invalid` | Key not set or key belongs to a different backend | Re-copy from Admin → Settings → API Keys; set on storefront; redeploy storefront |
| Admin UI at /app redirects to login loop | `ADMIN_CORS` missing backend's own URL | Add backend URL to `ADMIN_CORS` |
| Payments don't appear in checkout | Payment env vars not set, or storefront missing `NEXT_PUBLIC_STRIPE_KEY` | Check backend payment env vars; check `NEXT_PUBLIC_STRIPE_KEY` for Stripe |
| Product images lost after redeploy | Object storage not configured — files were on local disk | Set all six `S3_*` vars (Section 4d) and redeploy |
| Image upload succeeds but URL 403/404 | Bucket not public | R2: dashboard → bucket → Public Access → Allow. Garage: `garage bucket allow --read <bucket>` |
| `Cannot find module` build error | Node < 20 | The Dockerfiles pin `node:20`; if you customized them, keep Node ≥ 20 (`package.json` requires it) |
| Storefront build fails — `backend unreachable` | Storefront deployed before backend is ready | Deploy backend first, run migrations, then deploy storefront |
