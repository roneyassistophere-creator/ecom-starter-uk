# Part 5 — Local preview with live data

Run the store locally with a **copy of your live data** so you can preview changes before
deploying. This is the safe way to develop against real products, regions, and settings.

> **Golden rule: never point local `medusa develop` at the live production database.**
> `medusa develop` auto-runs migrations and writes on startup — aimed at production it would
> mutate or corrupt your live store. Always develop against a **local copy** of the data
> (Option A below). Option B (read-only tunnel) exists only for a quick look, with caveats.

---

## Option A — Snapshot production into a local DB (recommended)

You take a point-in-time dump of the production database, restore it into a local Postgres,
and run the full stack locally against that copy. Re-sync whenever you want fresh data.

```
┌─────────────┐   pg_dump    ┌────────────┐   pg_restore   ┌──────────────────┐
│ Prod Postgres│ ───────────▶ │ prod.dump  │ ─────────────▶ │ Local Postgres   │
│ (Coolify)    │              │ (file)     │                │ (docker, :5432)  │
└─────────────┘              └────────────┘                └────────┬─────────┘
                                                                    │
                                              local backend (npm run dev) ──▶ local storefront
```

### 1. Start a local Postgres

```bash
docker run -d --name store-local-db \
  -e POSTGRES_PASSWORD=postgres \
  -p 5432:5432 \
  postgres:15
```

(Or add a `postgres` service to the repo's `docker-compose.yml` alongside MinIO.)

### 2. Dump the production database

On the **VPS** (SSH in), dump from the Postgres container and copy it to the host:

```bash
# find the postgres container
docker ps | grep -i postgres

# dump (custom format) and copy out of the container
docker exec <pg-container-id> pg_dump -U postgres -Fc -d postgres -f /tmp/prod.dump
docker cp <pg-container-id>:/tmp/prod.dump /tmp/prod.dump
```

Then **download it to your local machine**:

```bash
scp <user>@<vps-ip>:/tmp/prod.dump ./prod.dump
```

> Use the actual DB name from your `DATABASE_URL` if it isn't `postgres`.

### 3. Restore into the local DB

```bash
docker cp ./prod.dump store-local-db:/tmp/prod.dump
docker exec store-local-db pg_restore -U postgres -d postgres --clean --if-exists /tmp/prod.dump
```

`--clean --if-exists` makes the restore repeatable — run steps 2–3 again anytime to refresh
local data from production.

### 4. Point the local backend at the local copy

In `apps/backend/.env`:

```bash
# Local copy of prod data — NOT the live DB
DATABASE_URL=postgres://postgres:postgres@localhost:5432/postgres

# Local secrets can be anything for dev
JWT_SECRET=devsecret
COOKIE_SECRET=devsecret

# Integration secrets (email/SMS/courier/CAPI/Google) are plain env vars — set only
# the ones you need to exercise locally, e.g. RESEND_API_KEY. There is no encryption key.

STORE_CORS=http://localhost:8000
ADMIN_CORS=http://localhost:9000
AUTH_CORS=http://localhost:9000,http://localhost:8000

# Leave S3_* UNSET locally (see "Images" below) so test uploads use local disk
# and don't pollute the production R2 bucket.
```

Then run the backend:

```bash
cd apps/backend
npm install      # first time only
npm run dev      # medusa develop — applies any pending migrations to the LOCAL copy (safe)
```

Admin is at `http://localhost:9000/app`. Your existing admin login from production works
(the user table came over in the dump). If you need a fresh one:
`npx medusa user -e you@local.test -p password`.

### 5. Point the local storefront at the local backend

In `apps/storefront/.env` (or `.env.local`):

```bash
NEXT_PUBLIC_MEDUSA_BACKEND_URL=http://localhost:9000
# The publishable key from the dump works locally too; copy it from the prod storefront env
NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY=pk_...
NEXT_PUBLIC_DEFAULT_REGION=bd
NEXT_PUBLIC_BASE_URL=http://localhost:8000
```

```bash
cd apps/storefront
npm install      # first time only
npm run dev      # next dev on :8000
```

Open `http://localhost:8000` — the storefront now renders your **real** catalog/regions
from the local copy.

### Images

Product image URLs in the dump point at your production R2 bucket
(e.g. `https://r2.<domain>/...`). Because the bucket is public, those images **load directly
in the browser locally with no extra setup** — preview just works.

Leave `S3_*` **unset** locally so that any *new* uploads you make while testing go to the
backend's local `static/` folder instead of writing into the production R2 bucket. Only set
`S3_*` locally if you specifically want to test the upload-to-R2 path.

### Re-syncing

To refresh local data after the live store changes, re-run **steps 2–3** (dump + restore).
The `--clean` restore drops and recreates the tables from the new dump.

---

## Option B — Read-only live peek via SSH tunnel (quick, risky)

For a fast look at live data **without** taking a dump, you can tunnel to the production DB
(same tunnel used for migrations in [02-deployment.md](02-deployment.md#7a-run-database-migrations--from-your-local-machine-not-the-container)):

```bash
# terminal A
ssh -L 15432:<pg-ip>:5432 <user>@<vps-ip>

# terminal B
cd apps/backend
DATABASE_URL=postgres://USER:PASS@127.0.0.1:15432/DBNAME npm run start   # start, NOT dev
```

> **Cautions:**
> - Use `npm run start` (`medusa start`), **never `npm run dev`** — `develop` would run
>   migrations against production.
> - Anything you change in the local admin while connected this way **writes to the live
>   store**. Treat it as read-only.
> - This is for a quick verification only. For any real development, use Option A.

---

## Which to use

| You want to… | Use |
|--------------|-----|
| Develop/preview changes safely against real data | **Option A** (local copy) |
| Test a schema change or new migration before deploying | **Option A** (then deploy + run migrations per [02-deployment.md](02-deployment.md) §7a) |
| Just glance at live data for a minute | Option B (read-only) |

When local previews look good, deploy as usual — and remember schema changes still require
running `medusa db:migrate` **from local against production over the tunnel**, never inside
the container (see [02-deployment.md](02-deployment.md) §7a).
