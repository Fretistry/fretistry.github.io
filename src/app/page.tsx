import type { Metadata } from "next";
import { ExplorerLoader } from "@/components/explorer/explorer-loader";
import { JsonLd, absoluteUrl } from "@/components/seo/seo-tags";
import { rootNote } from "@/lib/data/roots";
import { getScale } from "@/lib/data/scales";
import { LOCALES, createBundle } from "@/lib/i18n";
import { scaleIndexPath, scalePagePath } from "@/lib/pages";
import { BASE_PATH, CREATOR, SITE_DESCRIPTION, SITE_NAME, SITE_TITLE } from "@/lib/site";
import { START_HERE } from "@/lib/start-here";

// The home page is the main address for itself (also when old links add ?root=…&scale=…).
export const metadata: Metadata = {
  alternates: { canonical: `${BASE_PATH}/` },
};

/** What the site is, for search engines: a free web app for guitar scales, in five languages. */
const SITE_DATA = {
  "@context": "https://schema.org",
  "@graph": [
    { "@type": "WebSite", name: SITE_NAME, url: absoluteUrl("/"), inLanguage: LOCALES.map((l) => l.code) },
    {
      "@type": "WebApplication",
      name: SITE_NAME,
      url: absoluteUrl("/"),
      description: SITE_DESCRIPTION,
      applicationCategory: "EducationalApplication",
      operatingSystem: "Any (web browser)",
      browserRequirements: "Requires JavaScript",
      inLanguage: LOCALES.map((l) => l.code),
      isAccessibleForFree: true,
      offers: { "@type": "Offer", price: "0", priceCurrency: "EUR" },
      author: { "@type": "Person", name: CREATOR },
    },
  ],
};

/**
 * Shown while the app starts (and read by search engines): what Fretistry is,
 * a few popular first scales, and the overview of all scales in each language.
 */
function HomePreview() {
  const en = createBundle("en", "letters");
  return (
    <div className="flex min-h-screen flex-col" aria-busy="true">
      <div className="h-14 border-b border-border/60" />
      <main className="mx-auto w-full max-w-[1600px] min-[1760px]:max-w-[112rem] space-y-5 px-4 py-6 sm:px-6">
        <div className="h-24 animate-pulse rounded-2xl bg-muted/50" />
        <section className="space-y-3 rounded-2xl border border-border/70 bg-card/60 p-4 text-sm sm:p-5">
          <h1 className="text-2xl font-semibold tracking-tight">{SITE_TITLE}</h1>
          <p className="max-w-3xl text-muted-foreground">{SITE_DESCRIPTION}</p>
          <ul className="flex flex-wrap gap-1.5">
            {START_HERE.map((point) => {
              const scale = getScale(point.scaleId);
              return (
                <li key={`${point.rootName}|${point.scaleId}`}>
                  <a
                    href={`${BASE_PATH}${scalePagePath({ locale: "en", rootName: point.rootName, scaleId: point.scaleId })}`}
                    className="inline-block rounded-full px-3 py-1 font-medium ring-1 ring-border hover:bg-accent"
                  >
                    {en.theory.title(en.note(rootNote(point.rootName)), en.theory.scaleName(scale))}
                  </a>
                </li>
              );
            })}
          </ul>
          <p className="text-muted-foreground">
            {LOCALES.map((l, i) => (
              <span key={l.code}>
                {i > 0 && " · "}
                <a href={`${BASE_PATH}${scaleIndexPath(l.code)}`} lang={l.code} className="underline underline-offset-2 hover:text-foreground">
                  {createBundle(l.code, l.defaultNaming).ui.hub.title}
                </a>
              </span>
            ))}
          </p>
        </section>
        <div className="h-[380px] animate-pulse rounded-2xl bg-muted/40" />
      </main>
    </div>
  );
}

export default function Home() {
  return (
    <>
      <JsonLd data={SITE_DATA} />
      <ExplorerLoader placeholder={<HomePreview />} />
    </>
  );
}
