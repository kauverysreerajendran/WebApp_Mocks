import type { NextConfig } from "next";

/** Where /api/v1/* is proxied to when the app calls the API same-origin (e.g. behind an ngrok tunnel). */
const API_PROXY_TARGET = (process.env.API_PROXY_TARGET ?? "http://localhost:8100").replace(/\/$/, "");

const nextConfig: NextConfig = {
  cacheComponents: true,
  // Let the dev server answer through ngrok tunnels (HMR and dev assets are blocked cross-origin otherwise).
  allowedDevOrigins: ["*.ngrok-free.app", "*.ngrok-free.dev", "*.ngrok.app", "*.ngrok.io"],
  async rewrites() {
    return [{ source: "/api/v1/:path*", destination: `${API_PROXY_TARGET}/api/v1/:path*` }];
  },
  partialPrefetching: true,
  images: {
    // Placeholder editorial photography (Unsplash licence). Swap for brand photography in config/media.ts.
    remotePatterns: [{ protocol: "https", hostname: "images.unsplash.com", pathname: "/**" }],
  },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
