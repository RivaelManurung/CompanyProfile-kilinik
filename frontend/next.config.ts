import type { NextConfig } from "next";

/** Backend host that serves uploaded images (/uploads/**). Derived from the
 *  same env the data layer uses so next/image trusts it. */
const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api";
let backend: URL | null = null;
try {
  backend = new URL(apiUrl);
} catch {
  backend = null;
}

if (!process.env.NEXT_PUBLIC_API_URL) {
  console.warn(
    "[next.config] NEXT_PUBLIC_API_URL is not set — backend-hosted images will be blocked by next/image in production",
  );
}

const nextConfig: NextConfig = {
  images: {
    formats: ["image/avif", "image/webp"],
    remotePatterns: [
      ...(backend
        ? [
            {
              protocol: backend.protocol.replace(":", "") as "http" | "https",
              hostname: backend.hostname,
              port: backend.port || undefined,
              pathname: "/uploads/**",
            },
          ]
        : []),
    ],
  },
  experimental: {
    optimizePackageImports: ["lucide-react"],
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          // Prevent the site from being embedded in iframes (clickjacking).
          { key: "X-Frame-Options", value: "DENY" },
          // Prevent MIME-type sniffing.
          { key: "X-Content-Type-Options", value: "nosniff" },
          // Enforce HTTPS for 2 years, include subdomains.
          {
            key: "Strict-Transport-Security",
            value: "max-age=63072000; includeSubDomains; preload",
          },
          // Limit referrer information sent to third parties.
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
          // Disable access to sensitive browser APIs.
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
