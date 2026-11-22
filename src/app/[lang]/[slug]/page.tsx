import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ExplorerLoader } from "@/components/explorer/explorer-loader";
import { ScalePagePreview, describeScalePage } from "@/components/explorer/scale-page-preview";
import { JsonLd, PageLanguage, breadcrumbData } from "@/components/seo/seo-tags";
import { LOCALES, isLocale, type Locale } from "@/lib/i18n";
import { titleWithAlternative } from "@/lib/i18n/spoken";
import { allScalePages, parseScalePageSlug, scaleIndexPath, scalePagePath, scalePageSlug, type ScalePage } from "@/lib/pages";
import { BASE_PATH, SITE_NAME } from "@/lib/site";

/**
 * One page per language, key and scale (/nl/a-minor-pentatonic …), all made
 * at build time. Each has its own title, description and text, links to its
 * versions in the other languages, and opens the app on that scale.
 */

type Params = { params: Promise<{ lang: string; slug: string }> };

// Only the pages listed below exist; any other address is "not found".
export const dynamicParams = false;

export function generateStaticParams() {
  return allScalePages().map((page) => ({ lang: page.locale, slug: scalePageSlug(page.rootName, page.scaleId) }));
}

function resolve(lang: string, slug: string): ScalePage | null {
  if (!isLocale(lang)) return null;
  const page = parseScalePageSlug(slug);
  return page ? { locale: lang, ...page } : null;
}

const address = (page: ScalePage, locale: Locale = page.locale) => `${BASE_PATH}${scalePagePath({ ...page, locale })}`;

// The site's link-preview picture (app/opengraph-image.png). A page with its own preview
// settings would otherwise lose it, so it's named here again.
const PREVIEW_IMAGE = {
  url: `${BASE_PATH}/opengraph-image.png`,
  width: 1200,
  height: 630,
  type: "image/png",
  alt: "Fretistry — interactive guitar scales, chords and box shapes on a 24-fret fretboard",
};

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { lang, slug } = await params;
  const page = resolve(lang, slug);
  if (!page) return {};
  const { bundle, explanation, altTitle } = describeScalePage(page);
  const title = bundle.ui.seo.pageTitle(explanation.title, altTitle);
  const description = bundle.ui.seo.description(
    titleWithAlternative(explanation.title, altTitle),
    explanation.notes.join(" "),
    explanation.mood,
  );
  return {
    title,
    description,
    alternates: {
      canonical: address(page),
      // the same scale in every language (search engines show visitors their own language)
      languages: {
        ...Object.fromEntries(LOCALES.map((l) => [l.code, address(page, l.code)])),
        "x-default": address(page, "en"),
      },
    },
    openGraph: {
      type: "website",
      siteName: SITE_NAME,
      title: `${title} · ${SITE_NAME}`,
      description,
      url: address(page),
      locale: page.locale,
      images: [PREVIEW_IMAGE],
    },
    twitter: { card: "summary_large_image", title: `${title} · ${SITE_NAME}`, description, images: [PREVIEW_IMAGE] },
  };
}

export default async function ScalePageRoute({ params }: Params) {
  const { lang, slug } = await params;
  const page = resolve(lang, slug);
  if (!page) notFound();
  const { bundle, explanation } = describeScalePage(page);
  return (
    <>
      <PageLanguage locale={page.locale} />
      <JsonLd
        data={breadcrumbData([
          { name: SITE_NAME, path: "/" },
          { name: bundle.ui.hub.crumb, path: scaleIndexPath(page.locale) },
          { name: explanation.title, path: scalePagePath(page) },
        ])}
      />
      <ExplorerLoader placeholder={<ScalePagePreview page={page} />} />
    </>
  );
}
