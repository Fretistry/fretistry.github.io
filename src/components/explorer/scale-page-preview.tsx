import { RichText } from "@/components/theory/rich-text";
import { ROOT_NAMES, rootNote } from "@/lib/data/roots";
import { SCALES, getScale } from "@/lib/data/scales";
import { createBundle, defaultNamingFor } from "@/lib/i18n";
import { alternativeScaleTitle } from "@/lib/i18n/spoken";
import { rootNameForNote, scaleIndexPath, scalePagePath, type ScalePage } from "@/lib/pages";
import { BASE_PATH } from "@/lib/site";
import { explainScale, scaleChords, spellScale } from "@/lib/theory";
import { cn } from "@/lib/utils";

/** The scale's explanation in the page's language (used for the page text and its title/description). */
export function describeScalePage(page: ScalePage) {
  const bundle = createBundle(page.locale, defaultNamingFor(page.locale));
  const scale = getScale(page.scaleId);
  const spelled = spellScale(rootNote(page.rootName), scale);
  const explanation = explainScale(spelled, SCALES, bundle.theory);
  return { bundle, scale, spelled, explanation, altTitle: alternativeScaleTitle(bundle, spelled) };
}

const linkClass = "inline-block rounded-md px-2 py-1 font-medium ring-1 ring-border hover:bg-accent";
const headingClass = "text-base font-semibold text-foreground";

/**
 * What a scale page shows while the app starts (a moment), and what search
 * engines read: the scale's name, mood, notes and formula, how it's built, its
 * intervals, character, the chords in the key and related scales — plus links
 * to the other scales in this key, this scale in the other keys and the
 * overview of all scales. Laid out like the app, so the switch to the live app
 * is calm.
 */
export function ScalePagePreview({ page }: { page: ScalePage }) {
  const { bundle, scale, spelled, explanation: e } = describeScalePage(page);
  const { ui, theory } = bundle;
  const href = (rootName: ScalePage["rootName"], scaleId: string) => `${BASE_PATH}${scalePagePath({ ...page, rootName, scaleId })}`;
  const chordSet = scaleChords(spelled, "triad", SCALES, theory);
  const keyName = bundle.note(rootNote(page.rootName));
  return (
    <div className="flex min-h-screen flex-col" aria-busy="true">
      <div className="h-14 border-b border-border/60" />
      <main className="mx-auto w-full max-w-[1600px] min-[1760px]:max-w-[112rem] flex-1 space-y-5 px-4 py-5 sm:px-6 sm:py-6 lg:py-4">
        {/* As tall as the app's key/scale/tuning card on each screen size, so nothing jumps when the app takes over */}
        <div className="h-[62px] animate-pulse rounded-2xl bg-muted/50 sm:h-[164px] lg:h-[84px]" />
        <section className="space-y-4 rounded-2xl border border-border/70 bg-card/60 p-3 sm:p-5 lg:space-y-3 lg:p-4">
          <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-3">
            <div className="min-w-0">
              <h1 className="flex min-h-9 items-center text-2xl font-semibold tracking-tight sm:text-[28px]">{e.title}</h1>
              {/* phones: where Play, Share and Train will be (the app shows the mood line only on larger screens) */}
              <div aria-hidden="true" className="mt-1 flex gap-3 sm:hidden">
                <span className="h-9 w-20 rounded-full bg-muted/50" />
                <span className="h-9 w-28 rounded-full bg-muted/50" />
                <span className="h-9 w-20 rounded-full bg-muted/50" />
              </div>
              <p className="mt-0.5 max-w-2xl text-sm text-muted-foreground max-sm:hidden">{e.mood}</p>
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

        <section className="grid gap-x-8 gap-y-6 rounded-2xl border border-border/70 bg-card/60 p-4 text-sm leading-relaxed text-foreground/85 sm:p-5 lg:grid-cols-2">
          <div className="space-y-3">
            <h2 className={headingClass}>{ui.theory.built}</h2>
            <p>
              {ui.theory.notes}: <strong>{e.notes.join(" ")}</strong> · {ui.theory.formula}:{" "}
              <span className="font-mono">{e.formula.join(" ")}</span>
            </p>
            {e.construction.map((paragraph) => (
              <p key={paragraph}>
                <RichText text={paragraph} />
              </p>
            ))}
            <h2 className={headingClass}>{ui.theory.notesFormula}</h2>
            <ul className="grid grid-cols-[auto_auto_1fr] gap-x-4 gap-y-0.5">
              {e.intervalRows.map((row) => (
                <li key={row.index} className="contents">
                  <strong>{row.note}</strong>
                  <span className="font-mono">{row.formulaLabel}</span>
                  <span>{row.intervalName}</span>
                </li>
              ))}
            </ul>
            <h2 className={headingClass}>{e.characterHeading}</h2>
            {e.character.map((paragraph) => (
              <p key={paragraph}>
                <RichText text={paragraph} />
              </p>
            ))}
            <p>
              {ui.theory.hearIt}
              {e.usage}
            </p>
          </div>

          <div className="space-y-3">
            <h2 className={headingClass}>{ui.seo.chordsIn(e.title)}</h2>
            <ul className="flex flex-wrap gap-1.5">
              {chordSet.chords.map((chord) => (
                <li key={chord.degreeIndex} className="rounded-md px-2 py-1 ring-1 ring-border" title={chord.name}>
                  <span className="font-mono text-xs text-muted-foreground">{chord.numeral}</span> <strong>{chord.symbol}</strong>
                </li>
              ))}
            </ul>
            {chordSet.basis !== "scale" && (
              <p>
                <RichText text={chordSet.note} />
              </p>
            )}
            {e.relationships.length > 0 && (
              <>
                <h2 className={headingClass}>{ui.seo.related}</h2>
                <ul className="space-y-2">
                  {e.relationships.map((r) => (
                    <li key={`${r.kind}|${r.title}`}>
                      {r.target ? (
                        <a href={href(rootNameForNote(r.target.root), r.target.scaleId)} className="font-semibold underline underline-offset-2 hover:text-primary">
                          {r.title}
                        </a>
                      ) : (
                        <strong>{r.title}</strong>
                      )}
                      <span className="block text-foreground/75">
                        <RichText text={r.text} />
                      </span>
                    </li>
                  ))}
                </ul>
              </>
            )}
            <nav aria-label={ui.seo.moreScales(keyName)}>
              <h2 className={cn(headingClass, "mb-1.5")}>{ui.seo.moreScales(keyName)}</h2>
              <ul className="flex flex-wrap gap-1.5">
                {SCALES.filter((s) => s.id !== scale.id).map((s) => (
                  <li key={s.id}>
                    <a href={href(page.rootName, s.id)} className={linkClass}>
                      {theory.scaleName(s)}
                    </a>
                  </li>
                ))}
              </ul>
            </nav>
            <nav aria-label={ui.seo.otherKeys(theory.scaleName(scale))}>
              <h2 className={cn(headingClass, "mb-1.5")}>{ui.seo.otherKeys(theory.scaleName(scale))}</h2>
              <ul className="flex flex-wrap gap-1.5">
                {ROOT_NAMES.filter((r) => r !== page.rootName).map((rootName) => (
                  <li key={rootName}>
                    <a href={href(rootName, page.scaleId)} className={linkClass}>
                      {bundle.note(rootNote(rootName))}
                    </a>
                  </li>
                ))}
              </ul>
            </nav>
            <p>
              <a href={`${BASE_PATH}${scaleIndexPath(page.locale)}`} className="font-semibold underline underline-offset-2 hover:text-primary">
                {ui.seo.allScales} →
              </a>
            </p>
          </div>
        </section>
      </main>
    </div>
  );
}
