import type { MetadataRoute } from "next";
import { site } from "@/lib/site";
import { getArticles, getDoctors, getServices } from "@/lib/public/api";

/** Sitemap is regenerated at ISR revalidation intervals (every 2 min in dev,
 *  on-demand in prod). Fetching live data ensures newly created articles,
 *  doctors and services appear in search results without a redeploy. */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticRoutes = [
    "",
    "/layanan",
    "/kisah-kami",
    "/dokter",
    "/lokasi",
    "/artikel",
    "/kontak",
  ].map((path) => ({
    url: `${site.url}${path}`,
    changeFrequency: "monthly" as const,
    priority: path === "" ? 1 : 0.8,
    lastModified: new Date(),
  }));

  // Fetch live content in parallel; fall back gracefully if the backend is down.
  const [articles, doctors, services] = await Promise.all([
    getArticles().catch(() => []),
    getDoctors().catch(() => []),
    getServices().catch(() => []),
  ]);

  const articleRoutes: MetadataRoute.Sitemap = articles.map((a) => ({
    url: `${site.url}/artikel/${a.slug}`,
    changeFrequency: "weekly" as const,
    priority: 0.6,
    lastModified: a.date ? new Date(a.date) : new Date(),
  }));

  const doctorRoutes: MetadataRoute.Sitemap = doctors.map((d) => ({
    url: `${site.url}/dokter/${d.slug}`,
    changeFrequency: "monthly" as const,
    priority: 0.7,
    lastModified: new Date(),
  }));

  const serviceRoutes: MetadataRoute.Sitemap = services.map((s) => ({
    url: `${site.url}/layanan/${s.slug}`,
    changeFrequency: "monthly" as const,
    priority: 0.7,
    lastModified: new Date(),
  }));

  return [...staticRoutes, ...articleRoutes, ...doctorRoutes, ...serviceRoutes];
}
