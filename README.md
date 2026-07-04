# Medusa E-commerce Template

A production-ready [Medusa 2.0](https://medusajs.com) storefront template. Clone → brand → deploy.
Each store is its own deployment; re-skin by editing a single config file.

---

## What's included

- **Medusa backend** — API + admin dashboard (`/app`) on port 9000
- **Next.js storefront** — SSR product pages, cart, checkout on port 8000
- **Payments** — COD built-in; Stripe, SSLCommerz, bKash via env vars (all optional)
- **Notifications** — Transactional email (Resend) and SMS (Twilio / generic HTTP)
- **Couriers** — Steadfast, RedX, Pathao with admin credential management
- **File storage** — MinIO / S3 in production; local disk fallback in dev (zero config)
- **Analytics** — Meta Pixel + CAPI, GA4, GTM, TikTok Pixel, Google Ads
- **Authentication** — Email/password, Google OAuth, Phone OTP
- **Homepage builder** — Hero, banners, featured sections managed in admin
- **Product cards** — Configurable style, fields, grid from admin

---

## Documentation

| Doc | Contents |
|-----|---------|
| [Part 1 — Branding](docs/01-branding.md) | Edit `brand.config.ts`, swap logo/favicon |
| [Part 2 — Deployment](docs/02-deployment.md) | Coolify setup, env vars, MinIO, first-run steps |
| [Part 3 — Feature Configuration](docs/03-configuration.md) | Payments, email, SMS, couriers, analytics, auth |
| [Part 4 — Onboarding Checklist](docs/04-onboarding-checklist.md) | End-to-end handover checklist |

**Start here:** [docs/01-branding.md](docs/01-branding.md)

---

## Prerequisites

| Tool | Notes |
|------|-------|
| Node.js | v20–v24 LTS — v25+ breaks Next.js; use `nvm use 24` if needed |
| PostgreSQL | v15+ running locally |
| Docker | For MinIO local file storage (`docker compose up -d`) |

---

## Local development

```bash
# 1. Install dependencies
npm install

# 2. Configure backend
cp apps/backend/.env.example apps/backend/.env
# Edit .env — set DATABASE_URL, and JWT_SECRET / COOKIE_SECRET:
#   openssl rand -hex 32
# Integration secrets (email, SMS, couriers, etc.) are optional env vars — see .env.example.

# 3. Configure storefront
cp apps/storefront/.env.example apps/storefront/.env.local
# Edit .env.local — set NEXT_PUBLIC_MEDUSA_BACKEND_URL, NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY, etc.

# 4. Start MinIO (S3-compatible file storage — required for uploads)
docker compose up -d
# API: http://localhost:9100  |  Console: http://localhost:9101 (minioadmin / minioadmin)

# 5. Run database migrations
cd apps/backend
npx medusa db:migrate
npx medusa db:sync-links

# 6. Create admin user
npx medusa user -e admin@example.com -p YourPassword123

# 7. Start backend (separate terminals)
npm run dev       # http://localhost:9000 — admin at /app

# 8. Start storefront
cd apps/storefront
npm run dev       # http://localhost:8000
```

After the backend is running, go to Admin → Settings → API Keys, create a publishable key,
and set it as `NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY` in `apps/storefront/.env.local`.

---

## Spinning up a new brand

1. Clone or fork this repository
2. Apply branding — [docs/01-branding.md](docs/01-branding.md)
3. Deploy to Coolify — [docs/02-deployment.md](docs/02-deployment.md)
4. Configure features in admin — [docs/03-configuration.md](docs/03-configuration.md)

Each brand is a separate repository clone with its own Coolify deployment and database.
Stores do not share data.

---

## Environment variables

All env vars are documented with inline comments in the example files:

- **Backend:** [apps/backend/.env.example](apps/backend/.env.example)
- **Storefront:** [apps/storefront/.env.example](apps/storefront/.env.example)

Neither `.env` nor `.env.local` are committed — they are in `.gitignore`.
