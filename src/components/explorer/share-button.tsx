"use client";

import { useEffect, useRef, useState } from "react";
import { Check, ImageDown, Link2, Share2 } from "lucide-react";
import type { FretboardImageInput } from "@/components/fretboard/fretboard-image";
import { useI18n } from "@/components/i18n/i18n-provider";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useSharedMetronome } from "@/components/metronome/metronome-provider";
import { droneStatus } from "@/hooks/use-drone";
import { droneLinkValue } from "@/lib/audio/drone";
import { withPractice } from "@/lib/share";
import { SaveImageDialog } from "./save-image-dialog";

interface ShareMenuProps {
  title: string;
  imageInput: FretboardImageInput;
  imageFileName: string;
}

function MenuItem({
  icon,
  children,
  hint,
  onClick,
}: {
  icon: React.ReactNode;
  children: React.ReactNode;
  /** A short line under the choice saying what it gives you (so "Save" isn't missed). */
  hint?: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-start gap-2.5 rounded-md px-2.5 py-2 text-left text-sm transition-colors outline-none hover:bg-accent focus-visible:bg-accent [&_svg]:mt-0.5 [&_svg]:size-4 [&_svg]:text-muted-foreground"
    >
      {icon}
      <span className="min-w-0">
        <span className="block">{children}</span>
        {hint && <span className="block text-xs text-muted-foreground">{hint}</span>}
      </span>
    </button>
  );
}

/**
 * One "Share" button with two choices: share the link to the current view
 * (the phone's share sheet, or copy it on a computer), or save a picture of
 * the fretboard.
 */
export function ShareMenu({ title, imageInput, imageFileName }: ShareMenuProps) {
  const { ui } = useI18n();
  const t = ui.share;
  const metronome = useSharedMetronome();
  const [open, setOpen] = useState(false);
  const [imageOpen, setImageOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [nativeShare] = useState(
    () => typeof navigator.share === "function" && window.matchMedia("(pointer: coarse)").matches,
  );
  const timer = useRef<number | undefined>(undefined);

  useEffect(() => () => window.clearTimeout(timer.current), []);

  const shareLink = async () => {
    // Shared while practising? The link also carries the tempo and drone sound that are playing.
    const url = withPractice(window.location.href, {
      bpm: metronome.running ? metronome.settings.bpm : null,
      drone: droneStatus.running ? droneLinkValue(droneStatus.settings) : null,
    });
    if (nativeShare) {
      setOpen(false);
      try {
        await navigator.share({ title: `${title} · Fretistry`, text: t.text(title), url });
        return;
      } catch (error) {
        if ((error as DOMException)?.name === "AbortError") return; // closed the share sheet
      }
    }
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      window.clearTimeout(timer.current);
      timer.current = window.setTimeout(() => {
        setCopied(false);
        setOpen(false);
      }, 1400);
    } catch {
      setOpen(false);
      window.prompt(t.prompt, url);
    }
  };

  return (
    <>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button variant="outline" size="sm" className="rounded-full">
            <Share2 />
            <span className="sm:hidden">{t.shareShort}</span>
            <span className="max-sm:hidden">{t.share}</span>
          </Button>
        </PopoverTrigger>
        <PopoverContent align="start" collisionPadding={12} className="w-72 p-1">
          <MenuItem icon={copied ? <Check className="text-note-scale!" /> : <Link2 />} hint={t.linkHint} onClick={shareLink}>
            <span aria-live="polite">{copied ? t.copied : nativeShare ? t.shareLink : t.copyLink}</span>
          </MenuItem>
          <MenuItem
            icon={<ImageDown />}
            hint={t.imageHint}
            onClick={() => {
              setOpen(false);
              setImageOpen(true);
            }}
          >
            {ui.image.title}…
          </MenuItem>
        </PopoverContent>
      </Popover>
      <SaveImageDialog open={imageOpen} onOpenChange={setImageOpen} input={imageInput} fileName={imageFileName} />
    </>
  );
}
