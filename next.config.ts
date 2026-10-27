import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // ponytail: cacheComponents off — this app is auth-gated and per-user,
  // so PPR's "default to cached" model fights every page. Re-enable if we
  // grow public, cache-friendly surfaces.
  partialPrefetching: true,
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
