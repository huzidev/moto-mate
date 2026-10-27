import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // ponytail: cacheComponents (and its partialPrefetching companion) off —
  // this app is auth-gated and per-user, so PPR's "default to cached" model
  // fights every page. Re-enable both if we grow public, cache-friendly surfaces.
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
