import type { MetadataRoute } from "next";
import { BASE_PATH, SITE_URL } from "@/lib/site";

export const dynamic = "force-static";

/** robots.txt: everything may be read, and here is the list of pages. */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/" },
    sitemap: `${new URL(SITE_URL).origin}${BASE_PATH}/sitemap.xml`,
  };
}
