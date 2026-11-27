"use client";

import { Sparkles, Star, X } from "lucide-react";
import { useI18n } from "@/components/i18n/i18n-provider";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { rootNote } from "@/lib/data/roots";
import { getScale } from "@/lib/data/scales";
import { sameFavourite, type Favourite } from "@/lib/favourites";
import { START_HERE, type StartingPoint } from "@/lib/start-here";
import { spellScale } from "@/lib/theory";
import { cn } from "@/lib/utils";
import { InfoTip } from "./info-tip";

/** The star next to the scale name: adds the current root + scale to the favourites, or removes it. */
export function FavouriteButton({ active, onToggle }: { active: boolean; onToggle: () => void }) {
  const t = useI18n().ui.favourites;
  const label = active ? t.remove : t.add;
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant="ghost"
          size="icon-sm"
          className="rounded-full"
          aria-label={label}
          aria-pressed={active}
          onClick={onToggle}
        >
          <Star className={cn("size-5 transition-colors", active ? "fill-note-root text-note-root" : "text-muted-foreground")} />
        </Button>
      </TooltipTrigger>
      <TooltipContent>{label}</TooltipContent>
    </Tooltip>
  );
}

/**
 * "Start here": a few recognisable first scales, each in one shape, for
 * someone new to the app. Shown in place of the favourites until there are any.
 */
export function StartHereBar({
  caged,
  isCurrent,
  onSelect,
}: {
  /** The tuning has CAGED shapes (otherwise the shape part is left out). */
  caged: boolean;
  isCurrent: (point: StartingPoint) => boolean;
  onSelect: (point: StartingPoint) => void;
}) {
  const { ui, theory, note } = useI18n();
  return (
    <div className="flex flex-wrap items-center gap-x-2 gap-y-1.5">
      <p className="mr-1 flex items-center gap-1 text-[11px] font-medium tracking-wider text-muted-foreground uppercase">
        <Sparkles className="size-3.5 text-primary" aria-hidden="true" />
        {ui.startHere.title}
      </p>
      <ul className="flex flex-wrap gap-1.5" aria-label={ui.startHere.title}>
        {START_HERE.map((point) => {
          const scale = getScale(point.scaleId);
          const name = theory.title(note(spellScale(rootNote(point.rootName), scale).root), theory.scaleName(scale));
          const active = isCurrent(point);
          return (
            <li key={`${point.rootName}|${point.scaleId}|${point.shape}`}>
              <button
                type="button"
                onClick={() => onSelect(point)}
                aria-current={active ? "true" : undefined}
                className={cn(
                  "flex h-8 items-center gap-1.5 rounded-full px-3 text-sm font-medium ring-1 transition-colors outline-none focus-visible:ring-3 focus-visible:ring-ring/50 pointer-coarse:h-9",
                  active ? "bg-foreground/10 text-foreground ring-foreground/50" : "bg-card text-foreground/85 ring-border/70 hover:bg-accent",
                )}
              >
                {name}
                {caged && <span className="text-xs font-normal text-muted-foreground">· {ui.positions.shape(point.shape)}</span>}
              </button>
            </li>
          );
        })}
      </ul>
      <span className="text-xs text-muted-foreground">{ui.startHere.hint}</span>
    </div>
  );
}

/**
 * "Start here" on a scale's own page: the visitor already chose the scale (often straight from a
 * search), so instead of four other scales this offers one good first shape for *this* scale —
 * a single slim row, so the neck stays close to the top of the screen.
 */
export function StarterShapeBar({
  label,
  active,
  onSelect,
  easier,
}: {
  label: string;
  active: boolean;
  onSelect: () => void;
  /** Major / natural minor: "Easier start: G Major Pentatonic" (five notes instead of seven). */
  easier?: { label: string; onSelect: () => void } | null;
}) {
  const { ui } = useI18n();
  return (
    <div className="flex flex-wrap items-center gap-x-2 gap-y-1.5">
      <p className="mr-1 flex items-center gap-1 text-[11px] font-medium tracking-wider text-muted-foreground uppercase">
        <Sparkles className="size-3.5 text-primary" aria-hidden="true" />
        {ui.startHere.title}
      </p>
      <button
        type="button"
        onClick={onSelect}
        aria-pressed={active}
        className={cn(
          "flex h-8 items-center rounded-full px-3 text-sm font-medium ring-1 transition-colors outline-none focus-visible:ring-3 focus-visible:ring-ring/50 pointer-coarse:h-9",
          active ? "bg-foreground/10 text-foreground ring-foreground/50" : "bg-card text-foreground/85 ring-border/70 hover:bg-accent",
        )}
      >
        {label}
      </button>
      <InfoTip label={ui.startHere.title} paragraphs={ui.startHere.shapeInfo} />
      {easier && (
        <button
          type="button"
          onClick={easier.onSelect}
          className="flex h-8 items-center rounded-full bg-card px-3 text-sm text-foreground/85 ring-1 ring-border/70 transition-colors outline-none hover:bg-accent focus-visible:ring-3 focus-visible:ring-ring/50 pointer-coarse:h-9"
        >
          {easier.label}
        </button>
      )}
    </div>
  );
}

interface FavouritesBarProps {
  favourites: readonly Favourite[];
  current: Favourite;
  onSelect: (favourite: Favourite) => void;
  onRemove: (favourite: Favourite) => void;
}

/** One-tap shortcuts to the favourite scales (shown once there is at least one). */
export function FavouritesBar({ favourites, current, onSelect, onRemove }: FavouritesBarProps) {
  const { ui, theory, note } = useI18n();
  const t = ui.favourites;
  // Named like the scale title, with the same spelling choices (C♯ Lydian is shown as D♭ Lydian).
  const nameOf = (f: Favourite) => {
    const scale = getScale(f.scaleId);
    return theory.title(note(spellScale(rootNote(f.rootName), scale).root), theory.scaleName(scale));
  };

  return (
    <div className="flex flex-wrap items-center gap-x-2 gap-y-1.5">
      <p className="mr-1 flex items-center gap-1 text-[11px] font-medium tracking-wider text-muted-foreground uppercase">
        <Star className="size-3.5 fill-note-root text-note-root" aria-hidden="true" />
        {t.title}
      </p>
      <ul className="flex flex-wrap gap-1.5" aria-label={t.title}>
        {favourites.map((f) => {
          const name = nameOf(f);
          const active = sameFavourite(f, current);
          return (
            <li
              key={`${f.rootName}|${f.scaleId}`}
              className={cn(
                "flex h-8 items-center rounded-full ring-1 transition-colors pointer-coarse:h-9",
                active ? "bg-foreground/10 ring-foreground/50" : "bg-card ring-border/70 hover:bg-accent",
              )}
            >
              <button
                type="button"
                onClick={() => onSelect(f)}
                aria-current={active ? "true" : undefined}
                className={cn(
                  "h-full rounded-l-full pr-1 pl-3 text-sm font-medium outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
                  active ? "text-foreground" : "text-foreground/85",
                )}
              >
                {name}
              </button>
              <button
                type="button"
                onClick={() => onRemove(f)}
                aria-label={t.removeItem(name)}
                title={t.removeItem(name)}
                className="grid h-full w-7 place-items-center rounded-r-full text-muted-foreground outline-none hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50"
              >
                <X className="size-3.5" />
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
