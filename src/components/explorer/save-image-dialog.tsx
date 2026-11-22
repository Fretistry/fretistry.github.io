"use client";

import { useEffect, useRef, useState } from "react";
import { Download, Info, LoaderCircle, Moon, Share, Sun } from "lucide-react";
import {
  pictureToPng,
  renderFretboardPicture,
  type FretboardImageInput,
  type ImageBackground,
  type RenderedPicture,
} from "@/components/fretboard/fretboard-image";
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
  | { input: FretboardImageInput; background: ImageBackground; picture: RenderedPicture }
  | { input: FretboardImageInput; background: ImageBackground; failed: true };

function loadBackground(): ImageBackground {
  try {
    return localStorage.getItem(BACKGROUND_KEY) === "light" ? "light" : "dark";
  } catch {
    return "dark";
  }
}

function saveFile(blob: Blob, name: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = name;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 10_000);
}

/**
 * "Save as image" (from the Share menu): a preview of the fretboard picture,
 * downloaded as a PNG — or, when the browser's privacy protection scrambles
 * PNG creation (Firefox anti-fingerprinting), as an equally sharp SVG file.
 * On phones it can also be shared to Photos, WhatsApp and so on.
 */
export function SaveImageDialog({ open, onOpenChange, input, fileName }: SaveImageDialogProps) {
  const t = useI18n().ui.image;
  const [background, setBackground] = useState<ImageBackground>(loadBackground);
  const [rendered, setRendered] = useState<Rendered | null>(null);
  const [canShare, setCanShare] = useState(false);
  const [savedAsSvg, setSavedAsSvg] = useState(false);
  const lastUrl = useRef<string | null>(null);

  // Render whenever the dialog is open and the picture is out of date.
  useEffect(() => {
    if (!open) return;
    if (rendered && rendered.input === input && rendered.background === background) return;
    let cancelled = false;
    renderFretboardPicture(input, background).then(
      (picture) => {
        if (cancelled) {
          URL.revokeObjectURL(picture.svgUrl);
          return;
        }
        if (lastUrl.current) URL.revokeObjectURL(lastUrl.current);
        lastUrl.current = picture.svgUrl;
        setRendered({ input, background, picture });
        setSavedAsSvg(false);
        const file = picture.png ? new File([picture.png], fileName, { type: "image/png" }) : null;
        setCanShare(
          Boolean(file) &&
            window.matchMedia("(pointer: coarse)").matches &&
            typeof navigator.canShare === "function" &&
            navigator.canShare({ files: [file!] }),
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
  const picture = current && "picture" in current ? current.picture : null;
  const failed = Boolean(current && "failed" in current);

  const chooseBackground = (next: ImageBackground) => {
    setBackground(next);
    try {
      localStorage.setItem(BACKGROUND_KEY, next);
    } catch {
      // Not remembered — fine.
    }
  };

  const download = async () => {
    if (!picture) return;
    // Made right here, inside the click, when it wasn't possible earlier (Firefox only allows it on a click).
    const png = picture.png ?? (await pictureToPng(picture));
    if (png) {
      saveFile(png, fileName);
    } else {
      saveFile(picture.svg, fileName.replace(/\.png$/, ".svg"));
      setSavedAsSvg(true);
    }
  };

  const share = async () => {
    if (!picture?.png) return;
    try {
      await navigator.share({ files: [new File([picture.png], fileName, { type: "image/png" })], title: input.title });
    } catch (error) {
      if ((error as DOMException)?.name !== "AbortError") void download();
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
          {picture ? (
            // The preview shows the SVG picture itself: it never depends on canvas read-back.
            // eslint-disable-next-line @next/next/no-img-element -- a local blob: URL, not an optimisable asset
            <img src={picture.svgUrl} alt={t.previewAlt(input.title)} className="block h-auto max-h-[55vh] w-full object-contain" />
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

        {savedAsSvg && (
          <p className="flex gap-2 rounded-lg border border-border/70 bg-muted/50 px-3 py-2 text-sm text-foreground/85" role="status">
            <Info className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
            {t.savedAsSvg}
          </p>
        )}

        <DialogFooter>
          {canShare && (
            <Button variant="outline" onClick={share} disabled={!picture}>
              <Share /> {t.share}
            </Button>
          )}
          <Button onClick={download} disabled={!picture}>
            <Download /> {t.download}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
