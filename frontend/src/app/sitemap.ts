import type { MetadataRoute } from "next";
import { site } from "@/lib/site";
import { articles } from "@/lib/data";

export default function sitemap(): MetadataRoute.Sitemap {
  const routes = ["", "/layanan", "/kisah-kami", "/dokter", "/lokasi", "/artikel", "/kontak"].map(
    (path) => ({
      url: `${site.url}${path}`,
      changeFrequency: "monthly" as const,
      priority: path === "" ? 1 : 0.8,
    }),
  );

  const articleRoutes = articles.map((a) => ({
    url: `${site.url}/artikel/${a.slug}`,
    changeFrequency: "monthly" as const,
    priority: 0.6,
  }));

  return [...routes, ...articleRoutes];
}
