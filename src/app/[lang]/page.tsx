import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { FretistryMark, FretistryWordmark } from "@/components/brand/fretistry-mark";
import { JsonLd, PageLanguage, breadcrumbData } from "@/components/seo/seo-tags";
import { ROOT_NAMES, rootNote } from "@/lib/data/roots";
import { SCALES, SCALE_CATEGORIES } from "@/lib/data/scales";
import { LOCALES, createBundle, defaultNamingFor, isLocale, type Locale } from "@/lib/i18n";
import { scaleIndexPath, scalePagePath } from "@/lib/pages";
import { shortMood } from "@/lib/short-mood";
import { BASE_PATH, CREATOR, SITE_NAME } from "@/lib/site";

/**
 * /en/, /nl/ …: every scale in every key on one page, grouped like the scale
 * picker. A starting point for visitors who want to browse, and for search
 * engines (it links to all 264 scale pages of the language).
 */

type Params = { params: Promise<{ lang: string }> };

export const dynamicParams = false;

export function generateStaticParams() {
  return LOCALES.map(({ code }) => ({ lang: code }));
}

const address = (locale: Locale) => `${BASE_PATH}${scaleIndexPath(locale)}`;

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { lang } = await params;
  if (!isLocale(lang)) return {};
  const { ui } = createBundle(lang, defaultNamingFor(lang));
  return {
    title: ui.hub.metaTitle,
    description: ui.hub.description,
    alternates: {
      canonical: address(lang),
      languages: { ...Object.fromEntries(LOCALES.map((l) => [l.code, address(l.code)])), "x-default": address("en") },
    },
    openGraph: {
      type: "website",
      siteName: SITE_NAME,
      title: `${ui.hub.metaTitle} · ${SITE_NAME}`,
      description: ui.hub.description,
      url: address(lang),
      locale: lang,
      images: [{ url: `${BASE_PATH}/opengraph-image.png`, width: 1200, height: 630, type: "image/png" }],
    },
  };
}

export default async function ScaleIndexPage({ params }: Params) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();
  const bundle = createBundle(lang, defaultNamingFor(lang));
  const { ui, theory } = bundle;
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <PageLanguage locale={lang} />
      <JsonLd data={breadcrumbData([{ name: SITE_NAME, path: "/" }, { name: ui.hub.crumb, path: scaleIndexPath(lang) }])} />
      <header className="border-b border-border/60 bg-background/80 pt-[env(safe-area-inset-top)]">
        <div className="mx-auto flex h-14 max-w-[1600px] items-center gap-3 px-4 sm:px-6">
          <a href={`${BASE_PATH}/`} className="flex items-center gap-2.5 text-[17px]">
            <FretistryMark className="size-8" />
            <FretistryWordmark />
          </a>
          <a
            href={`${BASE_PATH}/`}
            className="ml-auto rounded-full bg-primary px-4 py-1.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
          >
            {ui.hub.openApp}
          </a>
        </div>
      </header>

      <main className="mx-auto w-full max-w-[1600px] flex-1 space-y-6 px-4 py-6 sm:px-6">
        <div className="max-w-3xl space-y-2">
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">{ui.hub.title}</h1>
          <p className="text-muted-foreground">{ui.hub.intro}</p>
        </div>

        {SCALE_CATEGORIES.map((category) => (
          <section key={category.id} className="space-y-3 rounded-2xl border border-border/70 bg-card/60 p-4 sm:p-5">
            <h2 className="text-[11px] font-medium tracking-wider text-muted-foreground uppercase">{bundle.categoryLabel(category.id)}</h2>
            <ul className="space-y-3">
              {SCALES.filter((s) => s.category === category.id).map((scale) => (
                <li key={scale.id} className="grid gap-x-6 gap-y-1.5 lg:grid-cols-[minmax(0,18rem)_1fr] lg:items-center">
                  <div>
                    <h3 className="font-semibold">{theory.scaleName(scale)}</h3>
                    <p className="text-xs text-muted-foreground">{shortMood(theory.character(scale))}</p>
                  </div>
                  <ul className="flex flex-wrap gap-1" aria-label={theory.scaleName(scale)}>
                    {ROOT_NAMES.map((rootName) => (
                      <li key={rootName}>
                        <a
                          href={`${BASE_PATH}${scalePagePath({ locale: lang, rootName, scaleId: scale.id })}`}
                          title={theory.title(bundle.note(rootNote(rootName)), theory.scaleName(scale))}
                          className="inline-flex h-8 min-w-9 items-center justify-center rounded-lg px-2 text-sm font-semibold ring-1 ring-border hover:bg-accent"
                        >
                          {bundle.note(rootNote(rootName))}
                        </a>
                      </li>
                    ))}
                  </ul>
                </li>
              ))}
            </ul>
          </section>
        ))}

        <nav aria-label={ui.hub.otherLanguages} className="text-sm text-muted-foreground">
          {ui.hub.otherLanguages}:{" "}
          {LOCALES.filter((l) => l.code !== lang).map((l, i) => (
            <span key={l.code}>
              {i > 0 && " · "}
              <a href={address(l.code)} lang={l.code} className="underline underline-offset-2 hover:text-foreground">
                {l.nativeName}
              </a>
            </span>
          ))}
        </nav>
      </main>

      <footer className="border-t border-border/60 px-4 py-4 text-center text-xs text-muted-foreground">
        Fretistry · {ui.footer.madeBy(CREATOR)}
      </footer>
    </div>
  );
}
