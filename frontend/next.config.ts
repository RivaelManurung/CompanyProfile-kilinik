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
};

export default nextConfig;
