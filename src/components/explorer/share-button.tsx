"use client";

import { useEffect, useRef, useState } from "react";
import { Check, ImageDown, Link2, Share2 } from "lucide-react";
import type { FretboardImageInput } from "@/components/fretboard/fretboard-image";
import { useI18n } from "@/components/i18n/i18n-provider";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { SaveImageDialog } from "./save-image-dialog";

interface ShareMenuProps {
  title: string;
  imageInput: FretboardImageInput;
  imageFileName: string;
}

function MenuItem({ icon, children, onClick }: { icon: React.ReactNode; children: React.ReactNode; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-center gap-2.5 rounded-md px-2.5 py-2 text-left text-sm transition-colors outline-none hover:bg-accent focus-visible:bg-accent [&_svg]:size-4 [&_svg]:text-muted-foreground"
    >
      {icon}
      {children}
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
  const [open, setOpen] = useState(false);
  const [imageOpen, setImageOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [nativeShare] = useState(
    () => typeof navigator.share === "function" && window.matchMedia("(pointer: coarse)").matches,
  );
  const timer = useRef<number | undefined>(undefined);

  useEffect(() => () => window.clearTimeout(timer.current), []);

  const shareLink = async () => {
    const url = window.location.href;
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
            <Share2 /> {t.share}
          </Button>
        </PopoverTrigger>
        <PopoverContent align="start" className="w-60 p-1">
          <MenuItem icon={copied ? <Check className="text-note-scale!" /> : <Link2 />} onClick={shareLink}>
            <span aria-live="polite">{copied ? t.copied : nativeShare ? t.shareLink : t.copyLink}</span>
          </MenuItem>
          <MenuItem
            icon={<ImageDown />}
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
