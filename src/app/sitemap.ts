import type { MetadataRoute } from "next";
import { LOCALES } from "@/lib/i18n";
import { allScalePages, scaleIndexPath, scalePagePath } from "@/lib/pages";
import { BASE_PATH, SITE_URL } from "@/lib/site";

// Written once at build time (the published site is plain files).
export const dynamic = "force-static";

/** sitemap.xml: tells search engines about the home page and every scale page. */
export default function sitemap(): MetadataRoute.Sitemap {
  const site = `${new URL(SITE_URL).origin}${BASE_PATH}`;
  return [
    { url: `${site}/`, changeFrequency: "monthly", priority: 1 },
    // the overview of all scales in each language
    ...LOCALES.map(({ code }) => ({ url: `${site}${scaleIndexPath(code)}`, changeFrequency: "monthly" as const, priority: 0.8 })),
    ...allScalePages().map((page) => ({
      url: `${site}${scalePagePath(page)}`,
      changeFrequency: "monthly" as const,
      priority: 0.7,
    })),
  ];
}
