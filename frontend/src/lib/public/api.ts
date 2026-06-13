/**
 * Public data layer — the bridge between the admin dashboard and the
 * public website. Each section of the landing page reads live content
 * managed in `/admin` through these fetchers (`GET /api/public/*`).
 *
 * Resilience: every call has a short timeout and gracefully falls back
 * to the bundled static content (`@/lib/data`) when the backend is
 * unreachable or not yet seeded — so the site is never blank.
 */
import {
  services as staticServices,
  doctors as staticDoctors,
  locations as staticLocations,
  promotions as staticPromotions,
  articles as staticArticles,
} from "@/lib/data";

const BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api";
const ASSET_BASE = BASE.replace(/\/api\/?$/, "");
const TIMEOUT_MS = 4000;
const REVALIDATE = 120; // ISR: refresh dashboard edits every 2 minutes

/** Resolve a stored image path to an absolute URL.
 *  - Absolute URLs are returned as-is.
 *  - Backend uploads (`/uploads/..`) are prefixed with the API host.
 *  - Bundled assets (`/doctors/..`) stay relative to the frontend. */
export function assetUrl(path?: string | null): string {
  if (!path) return "";
  if (/^https?:\/\//.test(path)) return path;
  if (path.startsWith("/uploads/")) return `${ASSET_BASE}${path}`;
  return path;
}

async function getList<T>(path: string, fallback: T[]): Promise<T[]> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(`${BASE}${path}`, {
      signal: controller.signal,
      next: { revalidate: REVALIDATE },
    });
    if (!res.ok) return fallback;
    const json = (await res.json()) as { data?: T[] };
    const data = json?.data;
    return Array.isArray(data) && data.length > 0 ? data : fallback;
  } catch {
    return fallback;
  } finally {
    clearTimeout(timer);
  }
}

/* ---- Initials from a doctor name, skipping titles ("dr.", "Sp.PD") ---- */
function initialsFrom(name: string): string {
  const words = name
    .replace(/dr\.?|drg\.?|Sp\.?[A-Z]*|,/gi, " ")
    .split(/\s+/)
    .filter((w) => w.length > 1 && /^[A-Za-z]/.test(w));
  const letters = words.slice(0, 2).map((w) => w[0]?.toUpperCase() ?? "");
  return letters.join("") || name.slice(0, 2).toUpperCase();
}

/* ============================== View models ============================== */

export interface ServiceVM {
  slug: string;
  title: string;
  short: string;
  description: string;
  icon: string;
  points: string[];
}

export interface DoctorVM {
  id: number;
  slug: string;
  name: string;
  specialty: string;
  experience: string;
  image: string;
  initials: string;
}

export interface LocationVM {
  slug: string;
  name: string;
  area: string;
  address: string;
  hours: string;
  phone: string;
  lat: number;
  lng: number;
}

export interface PromotionVM {
  slug: string;
  title: string;
  tag: string;
  price: string;
  oldPrice?: string;
  desc: string;
  featured: boolean;
}

export interface ArticleVM {
  slug: string;
  title: string;
  excerpt: string;
  category: string;
  date: string;
  readMins: number;
  cover?: string;
}

/* ---- Raw API shapes (camelCase, from backend models) ---- */
interface RawService {
  slug: string;
  title: string;
  short: string;
  description: string;
  icon: string;
  points?: string[];
}
interface RawDoctor {
  id: number;
  slug: string;
  name: string;
  specialty: string;
  experience: string;
  imageUrl: string;
}
interface RawLocation {
  slug: string;
  name: string;
  area: string;
  address: string;
  hours: string;
  phone: string;
  lat: number;
  lng: number;
}
interface RawPromotion {
  slug: string;
  title: string;
  tag: string;
  price: string;
  oldPrice?: string;
  desc: string;
  featured?: boolean;
}
interface RawArticle {
  slug: string;
  title: string;
  excerpt: string;
  category: string;
  readMins: number;
  publishedAt?: string;
  coverImage?: string;
}

/* ---------------------------- Static fallbacks --------------------------- */
const SERVICE_ICON_FALLBACK = [
  "Stethoscope",
  "Syringe",
  "Pill",
  "ClipboardCheck",
  "Scissors",
  "Activity",
];

const servicesFallback: ServiceVM[] = staticServices.map((s, i) => ({
  slug: s.slug,
  title: s.title,
  short: s.short,
  description: s.description,
  icon: SERVICE_ICON_FALLBACK[i % SERVICE_ICON_FALLBACK.length],
  points: s.points,
}));

const doctorsFallback: DoctorVM[] = staticDoctors.map((d, i) => ({
  id: i + 1,
  slug: d.slug,
  name: d.name,
  specialty: d.specialty,
  experience: d.experience,
  image: d.image,
  initials: d.initials,
}));

const locationsFallback: LocationVM[] = staticLocations.map((l) => ({
  slug: l.slug,
  name: l.name,
  area: l.area,
  address: l.address,
  hours: l.hours,
  phone: l.phone,
  lat: l.position.lat,
  lng: l.position.lng,
}));

const promotionsFallback: PromotionVM[] = staticPromotions.map((p, i) => ({
  slug: p.slug,
  title: p.title,
  tag: p.tag,
  price: p.price,
  oldPrice: p.oldPrice,
  desc: p.desc,
  featured: i === 0,
}));

const articlesFallback: ArticleVM[] = staticArticles.map((a) => ({
  slug: a.slug,
  title: a.title,
  excerpt: a.excerpt,
  category: a.category,
  date: a.date,
  readMins: a.readMins,
}));

/* =============================== Fetchers =============================== */

export async function getServices(): Promise<ServiceVM[]> {
  const rows = await getList<RawService>("/public/services", []);
  if (rows.length === 0) return servicesFallback;
  return rows.map((s) => ({
    slug: s.slug,
    title: s.title,
    short: s.short,
    description: s.description,
    icon: s.icon,
    points: s.points ?? [],
  }));
}

export async function getDoctors(): Promise<DoctorVM[]> {
  const rows = await getList<RawDoctor>("/public/doctors", []);
  if (rows.length === 0) return doctorsFallback;
  return rows.map((d) => ({
    id: d.id,
    slug: d.slug,
    name: d.name,
    specialty: d.specialty,
    experience: d.experience,
    image: assetUrl(d.imageUrl),
    initials: initialsFrom(d.name),
  }));
}

export async function getLocations(): Promise<LocationVM[]> {
  const rows = await getList<RawLocation>("/public/locations", []);
  if (rows.length === 0) return locationsFallback;
  return rows.map((l) => ({
    slug: l.slug,
    name: l.name,
    area: l.area,
    address: l.address,
    hours: l.hours,
    phone: l.phone,
    lat: l.lat,
    lng: l.lng,
  }));
}

export async function getPromotions(): Promise<PromotionVM[]> {
  const rows = await getList<RawPromotion>("/public/promotions", []);
  if (rows.length === 0) return promotionsFallback;
  return rows.map((p) => ({
    slug: p.slug,
    title: p.title,
    tag: p.tag,
    price: p.price,
    oldPrice: p.oldPrice || undefined,
    desc: p.desc,
    featured: Boolean(p.featured),
  }));
}

export async function getArticles(): Promise<ArticleVM[]> {
  const rows = await getList<RawArticle>("/public/articles", []);
  if (rows.length === 0) return articlesFallback;
  return rows.map((a) => ({
    slug: a.slug,
    title: a.title,
    excerpt: a.excerpt,
    category: a.category,
    date: a.publishedAt || "",
    readMins: a.readMins,
    cover: a.coverImage ? assetUrl(a.coverImage) : undefined,
  }));
}

export interface ArticleDetailVM {
  slug: string;
  title: string;
  excerpt: string;
  category: string;
  content: string; // HTML
  readMins: number;
  date: string;
  cover?: string;
  author?: string;
  tags: string[];
  seoTitle?: string;
  seoDescription?: string;
}

interface RawArticleDetail extends RawArticle {
  content?: string;
  author?: string;
  tags?: string[];
  seoTitle?: string;
  seoDescription?: string;
}

/** Fetch a single published article by slug from the backend, with a graceful
 *  fallback to bundled content. Returns null when the article does not exist. */
export async function getArticleBySlug(slug: string): Promise<ArticleDetailVM | null> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(`${BASE}/public/articles/${encodeURIComponent(slug)}`, {
      signal: controller.signal,
      next: { revalidate: REVALIDATE },
    });
    if (res.ok) {
      const json = (await res.json()) as { data?: RawArticleDetail };
      const a = json?.data;
      if (a?.slug) {
        return {
          slug: a.slug,
          title: a.title,
          excerpt: a.excerpt,
          category: a.category,
          content: a.content || `<p>${a.excerpt}</p>`,
          readMins: a.readMins,
          date: a.publishedAt || "",
          cover: a.coverImage ? assetUrl(a.coverImage) : undefined,
          author: a.author || undefined,
          tags: a.tags ?? [],
          seoTitle: a.seoTitle || undefined,
          seoDescription: a.seoDescription || undefined,
        };
      }
    }
  } catch {
    /* fall through to static */
  } finally {
    clearTimeout(timer);
  }

  const s = staticArticles.find((x) => x.slug === slug);
  if (!s) return null;
  return {
    slug: s.slug,
    title: s.title,
    excerpt: s.excerpt,
    category: s.category,
    content: `<p>${s.excerpt}</p>`,
    readMins: s.readMins,
    date: s.date,
    tags: [],
  };
}
