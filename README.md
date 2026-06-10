# Klinik Sehat Nusantara — Monorepo

Company profile website + admin dashboard for a medical clinic.

```
frontend/   Next.js 16 · React 19 · TypeScript · Tailwind v4 · Framer Motion · Leaflet
            └─ public site + /admin dashboard (shadcn/ReUI components, recharts)
backend/    Go · Gin · GORM · PostgreSQL · JWT
            └─ REST API for the site + admin
```

## Run everything (3 processes)

```bash
# 1) PostgreSQL (Docker, port 5433)
docker start ksn-postgres        # or the `docker run …` in backend/README.md

# 2) Backend API → http://localhost:4000
cd backend && go run .

# 3) Frontend → http://localhost:3000
cd frontend && npm install && npm run dev
```

- Public site: <http://localhost:3000>
- Admin dashboard: <http://localhost:3000/admin>  → login `admin@sehatnusantara.id` / `Admin#12345`

## What's wired

- The public **contact form** (`/kontak`) POSTs real appointments to the API.
- The admin dashboard manages **appointments, doctors, articles, services, locations, promotions** (full CRUD) plus an **overview** (stat cards, 14-day chart, status breakdown, recent bookings).
- `/admin/*` is gated by `frontend/src/proxy.ts` (Next 16 proxy) on the auth cookie; the API authoritatively validates the JWT.

See `frontend/README.md` and `backend/README.md` for details.

## Notes
- Brand, content, doctor photos, and map coordinates are placeholders — swap before launch.
- The ReUI public registry endpoint was returning 404 for core primitives at build time, so the dashboard uses the **shadcn/ui base** (the same Radix + Tailwind + CVA foundation ReUI builds on) with a teal-aligned token theme.
