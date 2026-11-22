import type { Locale } from "@/lib/i18n";
import { BASE_PATH, SITE_URL } from "@/lib/site";

/** Absolute address of a path on the published site ("https://fretistry.github.io/nl/…"). */
export function absoluteUrl(path: string): string {
  return `${new URL(SITE_URL).origin}${BASE_PATH}${path}`;
}

/**
 * Tells search engines a page's language. The shared page shell says "en", so
 * each page adds a content-language tag (read by Bing and others) and switches
 * the page's language marker before anything is shown (what Google sees).
 */
export function PageLanguage({ locale }: { locale: Locale }) {
  return (
    <>
      <meta httpEquiv="content-language" content={locale} />
      <script dangerouslySetInnerHTML={{ __html: `document.documentElement.lang=${JSON.stringify(locale)}` }} />
    </>
  );
}

/** Structured data (schema.org JSON-LD) that search engines read: what the site is, breadcrumbs… */
export function JsonLd({ data }: { data: Record<string, unknown> }) {
  // ("<" escaped so text can never close the script tag)
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, "\\u003c") }} />;
}

/** Breadcrumbs as search engines show them under a result: Fretistry › Guitar scales › A Minor Pentatonic. */
export function breadcrumbData(items: readonly { name: string; path: string }[]): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, i) => ({ "@type": "ListItem", position: i + 1, name: item.name, item: absoluteUrl(item.path) })),
  };
}
