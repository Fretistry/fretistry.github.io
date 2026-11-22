import type { NextConfig } from "next";

/**
 * Publishing (GitHub Pages or any static host): set STATIC_EXPORT=1 and the
 * build writes a plain website to the `out` folder. NEXT_PUBLIC_BASE_PATH is
 * the sub-folder the site lives in (e.g. "/fretistry" for
 * https://yourname.github.io/fretistry); leave it empty for a domain of its own.
 * Without STATIC_EXPORT, `npm run dev` / `npm start` work as usual.
 */
const staticExport = process.env.STATIC_EXPORT === "1";
const basePath = process.env.NEXT_PUBLIC_BASE_PATH || undefined;

const nextConfig: NextConfig = {
  ...(staticExport ? { output: "export" as const } : {}),
  basePath,
  // Every page in a folder of its own (/nl/a-minor-pentatonic/index.html): the scale pages'
  // extra data lives in that same folder, and GitHub Pages serves folder addresses reliably.
  trailingSlash: true,
  // Hide the small Next.js badge in development so the app looks clean; errors are still shown.
  devIndicators: false,
  // (Server-side caching features are not used: the whole app runs in the browser, and
  // a static export does not support them. Keeping them off makes local runs match the published site.)
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
