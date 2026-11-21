"use client";

import { useEffect, useRef, useState } from "react";
import { Download, LoaderCircle, Moon, Share, Sun } from "lucide-react";
import { renderFretboardImage, type FretboardImageInput, type ImageBackground } from "@/components/fretboard/fretboard-image";
import { useI18n } from "@/components/i18n/i18n-provider";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { SegmentedControl } from "./segmented-control";

const BACKGROUND_KEY = "fretistry-image-background";

interface SaveImageDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  input: FretboardImageInput;
  fileName: string;
}

type Rendered =
  | { input: FretboardImageInput; background: ImageBackground; blob: Blob; url: string }
  | { input: FretboardImageInput; background: ImageBackground; failed: true };

function loadBackground(): ImageBackground {
  try {
    return localStorage.getItem(BACKGROUND_KEY) === "light" ? "light" : "dark";
  } catch {
    return "dark";
  }
}

/**
 * "Save as image" (from the Share menu): shows a preview of the fretboard
 * picture and lets you download it (or share it to Photos/WhatsApp on phones).
 */
export function SaveImageDialog({ open, onOpenChange, input, fileName }: SaveImageDialogProps) {
  const t = useI18n().ui.image;
  const [background, setBackground] = useState<ImageBackground>(loadBackground);
  const [rendered, setRendered] = useState<Rendered | null>(null);
  const [canShare, setCanShare] = useState(false);
  const lastUrl = useRef<string | null>(null);

  // Render whenever the dialog is open and the picture is out of date.
  useEffect(() => {
    if (!open) return;
    if (rendered && rendered.input === input && rendered.background === background) return;
    let cancelled = false;
    renderFretboardImage(input, background).then(
      (blob) => {
        if (cancelled) return;
        if (lastUrl.current) URL.revokeObjectURL(lastUrl.current);
        const url = URL.createObjectURL(blob);
        lastUrl.current = url;
        setRendered({ input, background, blob, url });
        const file = new File([blob], fileName, { type: "image/png" });
        setCanShare(
          window.matchMedia("(pointer: coarse)").matches &&
            typeof navigator.canShare === "function" &&
            navigator.canShare({ files: [file] }),
        );
      },
      (error: unknown) => {
        console.error("Fretboard image failed", error);
        if (!cancelled) setRendered({ input, background, failed: true });
      },
    );
    return () => {
      cancelled = true;
    };
  }, [open, input, background, rendered, fileName]);

  useEffect(() => () => {
    if (lastUrl.current) URL.revokeObjectURL(lastUrl.current);
  }, []);

  const current = rendered && rendered.input === input && rendered.background === background ? rendered : null;
  const image = current && "url" in current ? current : null;
  const failed = Boolean(current && "failed" in current);

  const chooseBackground = (next: ImageBackground) => {
    setBackground(next);
    try {
      localStorage.setItem(BACKGROUND_KEY, next);
    } catch {
      // Not remembered — fine.
    }
  };

  const download = () => {
    if (!image) return;
    const link = document.createElement("a");
    link.href = image.url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  const share = async () => {
    if (!image) return;
    try {
      await navigator.share({ files: [new File([image.blob], fileName, { type: "image/png" })], title: input.title });
    } catch (error) {
      if ((error as DOMException)?.name !== "AbortError") download();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[calc(100dvh-2rem)] overflow-y-auto sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>{t.title}</DialogTitle>
          <DialogDescription>{t.description}</DialogDescription>
        </DialogHeader>

        <div className="grid min-h-40 place-items-center overflow-hidden rounded-lg border border-border/70 bg-muted/40">
          {image ? (
            // eslint-disable-next-line @next/next/no-img-element -- a local blob: URL, not an optimisable asset
            <img src={image.url} alt={t.previewAlt(input.title)} className="block h-auto max-h-[55vh] w-full object-contain" />
          ) : failed ? (
            <p className="px-4 py-10 text-center text-sm text-muted-foreground">{t.failed}</p>
          ) : (
            <p className="flex items-center gap-2 py-10 text-sm text-muted-foreground" role="status">
              <LoaderCircle className="size-4 animate-spin" /> {t.preparing}
            </p>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-medium text-muted-foreground">{t.background}</span>
          <SegmentedControl
            ariaLabel={t.background}
            value={background}
            onChange={chooseBackground}
            options={[
              { value: "dark", label: <><Moon className="size-3.5" /> {t.dark}</> },
              { value: "light", label: <><Sun className="size-3.5" /> {t.light}</>, title: t.lightHint },
            ]}
          />
          <span className="text-xs text-muted-foreground">{background === "light" ? `(${t.lightHint})` : ""}</span>
        </div>

        <DialogFooter>
          {canShare && (
            <Button variant="outline" onClick={share} disabled={!image}>
              <Share /> {t.share}
            </Button>
          )}
          <Button onClick={download} disabled={!image}>
            <Download /> {t.download}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
