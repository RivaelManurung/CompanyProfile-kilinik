import type { MetadataRoute } from "next";
import { site } from "@/lib/site";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        // Prevent crawlers from indexing the admin panel and API.
        disallow: ["/admin", "/api/"],
      },
    ],
    sitemap: `${site.url}/sitemap.xml`,
  };
}
