# Sehat Nusantara — Backend API (Go + Gin)

REST API for the clinic company profile and its admin dashboard. **Go + Gin + GORM + PostgreSQL + JWT**.

## Run

```bash
# 1. Postgres (dev) runs in Docker on port 5433:
docker start ksn-postgres   # (created once; see below)

# 2. Configure + run
cp .env.example .env         # adjust if needed
go run .                     # serves http://localhost:4000
go run . -seed               # seed admin + content, then exit (idempotent)
```

First boot of the Docker DB (if not created yet):

```bash
docker run -d --name ksn-postgres \
  -e POSTGRES_USER=ksn_admin -e POSTGRES_PASSWORD=ksn_secret_dev \
  -e POSTGRES_DB=sehat_nusantara -p 5433:5432 postgres:18-alpine
```

The server auto-migrates and seeds (admin + base content) on every boot — seeding is idempotent.

**Seed admin:** `admin@sehatnusantara.id` / `Admin#12345` (change via `.env`).

## Architecture

```
main.go                      # wiring + -seed flag
internal/
  config/      env loading
  database/    gorm connect + auto-migrate
  models/      Admin, Appointment, Doctor, Article, Service, Location, Promotion
  auth/        bcrypt, JWT (HS256), httpOnly cookie, gin middleware
  handlers/    auth, appointments, stats, CRUD per resource, public reads
  router/      gin routes + CORS
  seed/        admin + content seed (idempotent, upsert by slug)
```

## Endpoints

| Method | Path | Auth | Purpose |
|--------|------|------|---------|
| GET | `/api/health` | — | Liveness + DB ping |
| POST | `/api/auth/login` | — | Login → sets `ksn_token` httpOnly cookie |
| POST | `/api/auth/logout` | — | Clear cookie |
| GET | `/api/auth/me` | ✓ | Current admin |
| POST | `/api/appointments` | — | **Public** — contact form submission |
| GET | `/api/public/{doctors,services,locations,promotions,articles}` | — | Public site data |
| GET | `/api/public/articles/:slug` | — | Single article |
| GET | `/api/admin/stats` | ✓ | Dashboard metrics (totals, by-status, 14-day series, recent) |
| GET/PATCH/DELETE | `/api/admin/appointments[/:id]` | ✓ | Manage appointments |
| GET/POST/PUT/DELETE | `/api/admin/{doctors,articles,services,locations,promotions}[/:id]` | ✓ | Full CRUD |

Responses use `{ "data": ... }` / lists add `{ "meta": {total,page,limit} }`; errors use `{ "error": {code,message,details} }`.

## Auth model

Stateless JWT (HS256). Login sets a **httpOnly, SameSite=Lax** cookie named `ksn_token`. Because cookies ignore ports, the same cookie is read by the Next.js frontend (`:3000`) for route-gating and sent back to this API (`:4000`) for validation. The middleware also accepts `Authorization: Bearer <token>`.

## Security notes (senior-backend)

- Passwords hashed with **bcrypt**; never returned in JSON (`json:"-"`).
- All inputs validated via gin binding tags (length, email, enum).
- CORS restricted to configured origins with credentials.
- For production: set a strong `JWT_SECRET`, `APP_ENV=production` (enables `Secure` cookies), put TLS in front, and add rate limiting on `/auth/login`.
