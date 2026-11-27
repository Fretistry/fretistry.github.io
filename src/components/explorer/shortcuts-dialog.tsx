"use client";

import { Fragment } from "react";
import { RotateCw, Shuffle } from "lucide-react";
import { useI18n } from "@/components/i18n/i18n-provider";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

/** The keyboard shortcuts (opened with "?" or from Settings). */
export function ShortcutsDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const t = useI18n().ui.shortcuts;
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t.title}</DialogTitle>
          <DialogDescription>{t.intro}</DialogDescription>
        </DialogHeader>
        <dl className="grid grid-cols-[auto_1fr] items-center gap-x-4 gap-y-2 text-sm">
          {t.items.map(([keys, what]) => (
            <Fragment key={keys}>
              <dt>
                <kbd className="inline-flex min-w-8 justify-center rounded-md border border-border bg-muted px-1.5 py-0.5 font-mono text-xs">{keys}</kbd>
              </dt>
              <dd className="text-muted-foreground">{what}</dd>
            </Fragment>
          ))}
        </dl>
      </DialogContent>
    </Dialog>
  );
}

/** "Next in 4ths" and "Random key": run a scale through all 12 keys without thinking about which comes next. */
export function KeySteps({ onNext, onRandom, className }: { onNext: () => void; onRandom: () => void; className?: string }) {
  const t = useI18n().ui.controls;
  return (
    <div className={cn("flex items-center gap-1", className)}>
      <Button variant="ghost" size="xs" title={t.nextKeyTitle} onClick={onNext} className="text-muted-foreground">
        <RotateCw /> {t.nextKey}
      </Button>
      <Button variant="ghost" size="xs" onClick={onRandom} className="text-muted-foreground">
        <Shuffle /> {t.randomKey}
      </Button>
    </div>
  );
}
