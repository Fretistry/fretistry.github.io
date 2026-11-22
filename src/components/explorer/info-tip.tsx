"use client";

import { Info } from "lucide-react";
import { RichText } from "@/components/theory/rich-text";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

/**
 * A small ⓘ button that explains a term in a sentence or two. It opens on tap
 * or click, so it works on phones and tablets too (unlike hover tooltips).
 * Each paragraph may use **bold** words.
 */
export function InfoTip({ label, paragraphs }: { label: string; paragraphs: readonly string[] }) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon-xs" aria-label={label} title={label} className="rounded-full text-muted-foreground">
          <Info />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-[min(21rem,calc(100vw-1.5rem))] space-y-2 text-sm leading-relaxed text-foreground/85">
        {paragraphs.map((p) => (
          <p key={p}>
            <RichText text={p} />
          </p>
        ))}
      </PopoverContent>
    </Popover>
  );
}
