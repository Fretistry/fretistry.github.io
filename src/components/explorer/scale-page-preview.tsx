import { RichText } from "@/components/theory/rich-text";
import { ROOT_NAMES, rootNote } from "@/lib/data/roots";
import { SCALES, getScale } from "@/lib/data/scales";
import { createBundle, defaultNamingFor } from "@/lib/i18n";
import { scalePagePath, type ScalePage } from "@/lib/pages";
import { BASE_PATH } from "@/lib/site";
import { explainScale, spellScale } from "@/lib/theory";
import { cn } from "@/lib/utils";

/** The scale's explanation in the page's language (used for the page text and its title/description). */
export function describeScalePage(page: ScalePage) {
  const bundle = createBundle(page.locale, defaultNamingFor(page.locale));
  const scale = getScale(page.scaleId);
  const explanation = explainScale(spellScale(rootNote(page.rootName), scale), SCALES, bundle.theory);
  return { bundle, scale, explanation };
}

/**
 * What a scale page shows while the app starts (a moment), and what search
 * engines read: the scale's name, mood, notes and formula, how it's built, and
 * links to the same scale in the other keys. Laid out like the app, so the
 * switch to the live app is calm.
 */
export function ScalePagePreview({ page }: { page: ScalePage }) {
  const { bundle, scale, explanation: e } = describeScalePage(page);
  const { ui } = bundle;
  return (
    <div className="flex min-h-screen flex-col" aria-busy="true">
      <div className="h-14 border-b border-border/60" />
      <main className="mx-auto w-full max-w-[1600px] min-[1760px]:max-w-[112rem] flex-1 space-y-5 px-4 py-5 sm:px-6 sm:py-6">
        <div className="h-24 animate-pulse rounded-2xl bg-muted/50" />
        <section className="space-y-4 rounded-2xl border border-border/70 bg-card/60 p-3 sm:p-5">
          <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-3">
            <div className="min-w-0">
              <h1 className="text-2xl font-semibold tracking-tight sm:text-[28px]">{e.title}</h1>
              <p className="mt-0.5 max-w-2xl text-sm text-muted-foreground">{e.mood}</p>
            </div>
            <ol className="flex flex-wrap gap-1 sm:gap-1.5" aria-label={ui.scaleHeader.scaleNotes}>
              {e.intervalRows.map((row) => (
                <li
                  key={row.index}
                  className={cn(
                    "flex min-w-10 flex-col items-center rounded-lg px-1.5 py-1 ring-1 sm:min-w-11 sm:px-2",
                    row.index === 0 ? "bg-note-root/15 ring-note-root/50" : "bg-note-scale/10 ring-note-scale/30",
                  )}
                >
                  <span className={cn("text-base leading-tight font-semibold", row.index === 0 ? "text-note-root" : "text-foreground")}>
                    {row.note}
                  </span>
                  <span className="font-mono text-[11px] text-muted-foreground">{row.formulaLabel}</span>
                </li>
              ))}
            </ol>
          </div>
          <div className="grid h-[260px] place-items-center rounded-xl bg-muted/40 text-sm text-muted-foreground">
            <span className="animate-pulse">{ui.seo.loading}</span>
          </div>
        </section>
        <section className="space-y-3 rounded-2xl border border-border/70 bg-card/60 p-4 text-sm leading-relaxed text-foreground/85 sm:p-5">
          <h2 className="text-base font-semibold text-foreground">{ui.theory.built}</h2>
          <p>
            {ui.theory.notes}: <strong>{e.notes.join(" ")}</strong> · {ui.theory.formula}: <span className="font-mono">{e.formula.join(" ")}</span>
          </p>
          {e.construction.map((paragraph) => (
            <p key={paragraph}>
              <RichText text={paragraph} />
            </p>
          ))}
          <nav aria-label={ui.seo.otherKeys(bundle.theory.scaleName(scale))} className="pt-1">
            <h2 className="mb-1.5 text-xs font-medium tracking-wider text-muted-foreground uppercase">
              {ui.seo.otherKeys(bundle.theory.scaleName(scale))}
            </h2>
            <ul className="flex flex-wrap gap-1.5">
              {ROOT_NAMES.filter((r) => r !== page.rootName).map((rootName) => (
                <li key={rootName}>
                  <a
                    href={`${BASE_PATH}${scalePagePath({ ...page, rootName })}`}
                    className="inline-block rounded-md px-2 py-1 font-medium ring-1 ring-border hover:bg-accent"
                  >
                    {bundle.note(rootNote(rootName))}
                  </a>
                </li>
              ))}
            </ul>
          </nav>
        </section>
      </main>
    </div>
  );
}
