"use client";

import { Star, X } from "lucide-react";
import { useI18n } from "@/components/i18n/i18n-provider";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { rootNote } from "@/lib/data/roots";
import { getScale } from "@/lib/data/scales";
import { sameFavourite, type Favourite } from "@/lib/favourites";
import { spellScale } from "@/lib/theory";
import { cn } from "@/lib/utils";

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
                "flex h-8 items-center rounded-full ring-1 transition-colors",
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
