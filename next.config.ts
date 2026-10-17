import type { NextConfig } from "next";

const fonts = ["./assets/fonts/**/*"];

const nextConfig: NextConfig = {
  cacheComponents: true,
  partialPrefetching: true,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
  // The share card reads its fonts from disk, so ship them with those functions.
  outputFileTracingIncludes: {
    "/opengraph-image": fonts,
    "/twitter-image": fonts,
  },
};

export default nextConfig;
