# Klinik Sehat Nusantara — Company Profile

Production-grade company profile for a medical clinic, built with **Next.js 16 (App Router)**, **React 19**, **TypeScript**, **Tailwind CSS v4**, and **Framer Motion**. Bahasa Indonesia, fully responsive, accessible, and animated.

> Brand name & content are placeholders (`src/lib/site.ts`, `src/lib/data.ts`) — swap them for real data before launch.

## Quick start

```bash
npm install
npm run dev      # http://localhost:3000
npm run build    # production build (all pages prerendered / SSG)
npm start        # serve the production build
```

## Pages

| Route | Description |
|-------|-------------|
| `/` | Homepage — hero carousel, services, stats, why-us, doctors, promos, locations, testimonials, articles, CTA |
| `/layanan` | Full services with feature lists |
| `/kisah-kami` | About — mission/vision, timeline, values |
| `/dokter` | Doctor directory with specialty filters |
| `/lokasi` | Clinic locations |
| `/artikel` | Articles list with client-side category filter |
| `/artikel/[slug]` | Article detail (SSG via `generateStaticParams`) |
| `/kontak` | Contact info + animated appointment form |

Also: `sitemap.xml`, `robots.txt`, custom `404`.

## Design system

- **Palette:** medical teal (`primary`) + emerald (`accent`) + `ink` neutrals — defined as Tailwind v4 `@theme` tokens in `src/app/globals.css`.
- **Fonts:** Plus Jakarta Sans (display) + Inter (body) via `next/font`.
- **Animations:** Framer Motion scroll reveals (`Reveal`, `Stagger`), animated counters, hero carousel, scroll-progress bar, floating contact dial, marquee, blobs. Respects `prefers-reduced-motion`.
- **Maps:** interactive **Leaflet + OpenStreetMap** (CARTO Positron tiles) on `/lokasi` and `/kontak` — no API key required. Custom brand markers + popups in `src/components/sections/ClinicMapInner.tsx`; loaded client-only via `next/dynamic` (`ssr: false`). Coordinates live in `src/lib/data.ts`.

## Structure

```
src/
├── app/                # routes, layout, metadata, sitemap, robots
├── components/
│   ├── layout/         # Header, Footer, FloatingActions, ScrollProgress
│   ├── sections/       # page sections (Hero, Services, …, ContactForm)
│   └── ui/             # primitives (Button, Container, Reveal, cards…)
└── lib/                # site config, content data, utils
```

## Wiring up before launch

- Replace brand/contact in `src/lib/site.ts` and content in `src/lib/data.ts`.
- Connect the contact form (`src/components/sections/ContactForm.tsx`) to your backend / email / WhatsApp API — currently it simulates submission.
- Replace the placeholder photos in `public/doctors/` and `public/hero/` with your own (Unsplash stock used as placeholders — same filenames, no code change needed). Doctor file = `public/doctors/<slug>.jpg`; hero slides set via `image` in `src/lib/data.ts`.
- Update `site.url` for correct OpenGraph / sitemap URLs.
- Update each clinic's `position` (lat/lng) in `src/lib/data.ts` so the map markers point to the real addresses.
# CompanyProfile-kilinik
