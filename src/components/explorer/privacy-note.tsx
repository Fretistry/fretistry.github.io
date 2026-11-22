"use client";

import { useId, useState } from "react";
import { ChevronDown, ShieldCheck } from "lucide-react";
import { useI18n } from "@/components/i18n/i18n-provider";
import { RichText } from "@/components/theory/rich-text";
import { cn } from "@/lib/utils";

const GITHUB_PRIVACY_STATEMENT = "https://docs.github.com/en/site-policy/privacy-policies/github-general-privacy-statement";

/**
 * The footer: who made Fretistry, and a short privacy statement that folds
 * open (no account, no cookies, no tracking; what stays in your browser; the
 * GitHub Pages hosting).
 */
export function SiteFooter({ creator }: { creator: string }) {
  const { ui } = useI18n();
  const t = ui.privacy;
  const [open, setOpen] = useState(false);
  const panelId = useId();
  return (
    <footer className="border-t border-border/60 px-4 py-4 pb-[max(1rem,env(safe-area-inset-bottom))] text-center text-xs text-muted-foreground">
      <p className="flex flex-wrap items-center justify-center gap-x-1.5 gap-y-1">
        <span>Fretistry · {ui.footer.madeBy(creator)} ·</span>
        <button
          type="button"
          aria-expanded={open}
          aria-controls={panelId}
          onClick={() => setOpen((o) => !o)}
          className="inline-flex items-center gap-1 rounded-md px-1 py-0.5 underline-offset-2 outline-none hover:text-foreground hover:underline focus-visible:ring-3 focus-visible:ring-ring/50"
        >
          <ShieldCheck className="size-3.5" aria-hidden="true" />
          {t.title}
          <ChevronDown className={cn("size-3.5 transition-transform", open && "rotate-180")} aria-hidden="true" />
        </button>
      </p>
      {open && (
        <div
          id={panelId}
          className="mx-auto mt-3 max-w-2xl space-y-2 rounded-xl border border-border/60 bg-card/60 p-4 text-left text-[13px] leading-relaxed text-foreground/80"
        >
          <p>
            <RichText text={t.intro} />
          </p>
          <p>
            <RichText text={t.storage} />
          </p>
          <p>
            <RichText text={t.hosting} />{" "}
            <a
              href={GITHUB_PRIVACY_STATEMENT}
              target="_blank"
              rel="noopener noreferrer"
              className="text-foreground underline underline-offset-2 hover:text-primary"
            >
              {t.githubLink}
            </a>
          </p>
          <p>
            <RichText text={t.rights} />
          </p>
        </div>
      )}
    </footer>
  );
}
