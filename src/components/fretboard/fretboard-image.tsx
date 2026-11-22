"use client";

import { flushSync } from "react-dom";
import { createRoot } from "react-dom/client";
import { FretistryMark } from "@/components/brand/fretistry-mark";
import { SVG_NS, withSingleSvgNamespace } from "@/lib/svg-markup";
import type { FretboardNote, PositionNote, Tuning } from "@/lib/theory";
import { FretboardArt, LABEL_SIZE, POSITION_TINT, StringName } from "./fretboard";
import { computeGeometry, fretRangeBounds, minimumLength, type SpacingMode } from "./geometry";
import type { MarkerModel, MarkerVariant } from "./marker-model";
import { MarkerSwatch, NoteMarker } from "./note-marker";

/**
 * "Save image": draws the fretboard as it currently looks (labels, position,
 * chord, left-handed…) into a PNG with a title, the tuning and a colour key.
 *
 * The picture is rendered with the same React components as the live neck,
 * off-screen, so it always matches what the user sees. The resolved colours
 * and fonts are then written into the SVG itself, which is drawn onto a
 * canvas at double resolution.
 */

export type ImageBackground = "dark" | "light";

export interface LegendEntry {
  variant: MarkerVariant | "position" | "home";
  dimmed?: boolean;
  label: string;
}

export interface FretboardImageInput {
  notes: FretboardNote[][];
  markers: ReadonlyMap<string, MarkerModel>;
  tuning: Tuning;
  /** Open-string names in the chosen note naming, lowest string first. */
  stringNames: readonly string[];
  spacing: SpacingMode;
  fretRange: "all" | "low" | "high";
  showFretNumbers: boolean;
  leftHanded: boolean;
  positionOccurrences: PositionNote[][] | null;
  title: string;
  /** Smaller lines under the title (notes, tuning, position, chord). */
  lines: readonly string[];
  legend: readonly LegendEntry[];
  /** Site address shown under the wordmark, if the site is published. */
  siteLabel?: string | null;
}

const PALETTE = {
  dark: { background: "#101115", text: "#f3efe7", muted: "#a59f94", amber: "#F7A93B" },
  light: { background: "#ffffff", text: "#1c1917", muted: "#6b645a", amber: "#D9781A" },
} as const;

const PAD = 36;
const SCALE = 2;
const LINE_GAP = 22;

let measureContext: CanvasRenderingContext2D | null = null;
function textWidth(text: string, font: string): number {
  measureContext ??= document.createElement("canvas").getContext("2d");
  if (!measureContext) return text.length * 8;
  measureContext.font = font;
  return measureContext.measureText(text).width;
}

/** Overall picture layout (pixel sizes before the ×2 export scale). */
export function pictureLayout(input: Pick<FretboardImageInput, "notes" | "tuning" | "spacing" | "fretRange" | "showFretNumbers" | "leftHanded" | "lines">) {
  const fretCount = input.notes[0]?.length ? input.notes[0].length - 1 : 24;
  const [firstFret, lastFret] = fretRangeBounds(input.fretRange, fretCount);
  const geometry = computeGeometry({
    length: Math.max(input.fretRange === "all" ? 1480 : 1000, minimumLength(firstFret, lastFret, input.spacing, 26)),
    stringCount: input.tuning.strings.length,
    firstFret,
    lastFret,
    spacing: input.spacing,
    showFretNumbers: input.showFretNumbers,
    stringSpacing: 36,
    orientation: "horizontal",
    leftHanded: input.leftHanded,
  });
  const width = PAD * 2 + LABEL_SIZE + geometry.width;
  const titleY = PAD + 28;
  const firstLineY = titleY + 30;
  const neckY = firstLineY + Math.max(0, input.lines.length - 1) * LINE_GAP + 26;
  const legendY = neckY + geometry.height + 32;
  const height = legendY + 10 + PAD;
  return { geometry, firstFret, lastFret, width, height, titleY, firstLineY, neckY, legendY };
}

function FretboardPicture({ input, background, fontFamily }: { input: FretboardImageInput; background: ImageBackground; fontFamily: string }) {
  const colors = PALETTE[background];
  const { geometry: g, firstFret, lastFret, width, height, titleY, firstLineY, neckY, legendY } = pictureLayout(input);
  const labelX = input.leftHanded ? PAD + g.width : PAD;
  const boardX = input.leftHanded ? PAD : PAD + LABEL_SIZE;

  // Wordmark in the top-right corner: logo + "Fretistry" (+ site address).
  const wordmarkFont = `650 20px ${fontFamily}`;
  const wordmarkWidth = textWidth("Fretistry", wordmarkFont);
  const markSize = 28;
  const wordmarkRight = width - PAD;
  const markX = wordmarkRight - wordmarkWidth - 8 - markSize;

  // Colour key along the bottom.
  const legendFont = `500 13px ${fontFamily}`;
  const legendWidths = input.legend.map((entry) => 26 + textWidth(entry.label, legendFont) + 22);
  const legend = input.legend.map((entry, i) => ({
    ...entry,
    x: PAD + legendWidths.slice(0, i).reduce((sum, w) => sum + w, 0),
  }));

  return (
    // No xmlns attribute here: the serializer adds it, and Firefox would otherwise write it twice (invalid SVG).
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} fontFamily={fontFamily}>
      <rect width={width} height={height} fill={colors.background} />

      {/* Title and details */}
      <text x={PAD} y={titleY} fontSize={28} fontWeight={650} fill={colors.text} letterSpacing={-0.4}>
        {input.title}
      </text>
      {input.lines.map((line, i) => (
        <text key={i} x={PAD} y={firstLineY + i * LINE_GAP} fontSize={14} fontWeight={450} fill={colors.muted}>
          {line}
        </text>
      ))}

      {/* Wordmark */}
      <FretistryMark svgProps={{ x: markX, y: PAD + 2, width: markSize, height: markSize }} />
      <text x={wordmarkRight} y={PAD + 23} textAnchor="end" fontSize={20} fontWeight={650} fill={colors.text} letterSpacing={-0.3}>
        Fret<tspan fill={colors.amber}>istry</tspan>
      </text>
      {input.siteLabel && (
        <text x={wordmarkRight} y={PAD + 46} textAnchor="end" fontSize={12} fill={colors.muted}>
          {input.siteLabel}
        </text>
      )}

      {/* Neck with its string names */}
      <clipPath id="picture-neck">
        <rect x={PAD} y={neckY} width={LABEL_SIZE + g.width} height={g.height} rx={12} />
      </clipPath>
      <g clipPath="url(#picture-neck)">
        <rect x={PAD} y={neckY} width={LABEL_SIZE + g.width} height={g.height} fill="#17110d" />
        <rect x={labelX} y={neckY} width={LABEL_SIZE} height={g.height} fill="#120d0a" />
        <rect x={input.leftHanded ? labelX : labelX + LABEL_SIZE - 1} y={neckY} width={1} height={g.height} fill="#ffffff" fillOpacity={0.05} />
      </g>
      {input.tuning.strings.map((pitch, i) => (
        <StringName key={i} x={labelX + LABEL_SIZE / 2 - 3} y={neckY + g.stringC(i)} name={input.stringNames[i] ?? ""} octave={pitch.octave} />
      ))}
      <svg x={boardX} y={neckY} width={g.width} height={g.height} overflow="visible">
        <FretboardArt g={g} tuning={input.tuning} showFretNumbers={input.showFretNumbers} positionOccurrences={input.positionOccurrences} />
        {input.notes.flat().map((note) => {
          if (note.fret < firstFret || note.fret > lastFret) return null;
          const model = input.markers.get(note.key);
          if (!model?.visible) return null;
          const { x, y } = g.noteXY(note.stringIndex, note.fret);
          return <NoteMarker key={note.key} note={note} model={model} cx={x} cy={y} radius={g.markerRadius(note.fret)} />;
        })}
      </svg>

      {/* Colour key */}
      {legend.map((entry, i) => (
        <g key={i}>
          {entry.variant === "position" ? (
            <rect x={entry.x} y={legendY - 7} width={20} height={14} rx={7} fill="#5b4434" stroke={POSITION_TINT} strokeOpacity={0.6} />
          ) : (
            <MarkerSwatch cx={entry.x + 9} cy={legendY} r={8} variant={entry.variant} dimmed={entry.dimmed} />
          )}
          <text x={entry.x + 26} y={legendY} dy="0.35em" fontSize={13} fontWeight={500} fill={colors.muted}>
            {entry.label}
          </text>
        </g>
      ))}
    </svg>
  );
}

const STYLED_ELEMENTS = "circle,rect,polygon,path,line,ellipse,text,tspan";

/** Writes the colours that CSS classes resolve to into the SVG, so it renders the same on its own. */
function inlineComputedStyles(svg: SVGSVGElement): Set<string> {
  const families = new Set<string>();
  for (const el of Array.from(svg.querySelectorAll<SVGElement>(STYLED_ELEMENTS))) {
    const style = getComputedStyle(el);
    if (el.hasAttribute("class")) {
      for (const prop of ["fill", "stroke", "opacity"]) {
        const value = style.getPropertyValue(prop);
        if (value && !value.startsWith("url(")) el.style.setProperty(prop, value);
      }
    }
    if (el.tagName === "text" || el.tagName === "tspan") {
      el.style.setProperty("font-family", style.fontFamily);
      const first = style.fontFamily.split(",")[0]?.replace(/["']/g, "").trim();
      if (first) families.add(first);
    }
  }
  for (const el of Array.from(svg.querySelectorAll("[class]"))) el.removeAttribute("class");
  return families;
}

async function toDataUrl(url: string): Promise<string> {
  const blob = await (await fetch(url)).blob();
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(blob);
  });
}

const fontCssCache = new Map<string, Promise<string>>();

/**
 * The page's web fonts (Geist) as embedded @font-face rules — an SVG drawn as
 * an image cannot load fonts from the page. Only the Latin subset is
 * embedded; other characters (♯, ♭) fall back to system fonts.
 */
function embeddedFontCss(families: Set<string>): Promise<string> {
  const key = [...families].sort().join("|");
  let cached = fontCssCache.get(key);
  if (!cached) {
    cached = (async () => {
      const rules: string[] = [];
      for (const sheet of Array.from(document.styleSheets)) {
        let cssRules: CSSRuleList;
        try {
          cssRules = sheet.cssRules;
        } catch {
          continue; // a stylesheet from another origin
        }
        for (const rule of Array.from(cssRules)) {
          if (!(rule instanceof CSSFontFaceRule)) continue;
          const family = rule.style.getPropertyValue("font-family").replace(/["']/g, "").trim();
          if (!families.has(family)) continue;
          const range = rule.style.getPropertyValue("unicode-range");
          if (range && !/U\+0+-0*FF\b/i.test(range)) continue;
          const src = /url\(["']?([^"')]+)["']?\)/.exec(rule.style.getPropertyValue("src"));
          if (!src) continue;
          try {
            const data = await toDataUrl(new URL(src[1], sheet.href ?? window.location.href).href);
            const weight = rule.style.getPropertyValue("font-weight") || "normal";
            const fontStyle = rule.style.getPropertyValue("font-style") || "normal";
            rules.push(
              `@font-face{font-family:"${family}";src:url(${data});font-weight:${weight};font-style:${fontStyle};${range ? `unicode-range:${range};` : ""}}`,
            );
          } catch {
            // Font couldn't be loaded: the picture uses a system font instead.
          }
        }
      }
      return rules.join("\n");
    })();
    fontCssCache.set(key, cached);
  }
  return cached;
}

function loadImage(url: string, width: number, height: number): Promise<HTMLImageElement> {
  // onload/onerror instead of image.decode(): decode() is unreliable for SVG images in Firefox.
  return new Promise((resolve, reject) => {
    const image = new Image(width, height);
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("The picture could not be loaded"));
    image.src = url;
  });
}

async function rasterize(markup: string, width: number, height: number): Promise<Blob> {
  const url = URL.createObjectURL(new Blob([markup], { type: "image/svg+xml;charset=utf-8" }));
  try {
    const image = await loadImage(url, width, height);
    // Give embedded fonts a moment to be applied (needed by some Safari versions).
    await new Promise((resolve) => setTimeout(resolve, 60));
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(width * SCALE);
    canvas.height = Math.round(height * SCALE);
    const context = canvas.getContext("2d");
    if (!context) throw new Error("Canvas is not available");
    context.drawImage(image, 0, 0, canvas.width, canvas.height);
    return await new Promise<Blob>((resolve, reject) =>
      canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error("PNG export failed"))), "image/png"),
    );
  } finally {
    URL.revokeObjectURL(url);
  }
}

/** Renders the picture and returns it as a PNG. */
export async function renderFretboardImage(input: FretboardImageInput, background: ImageBackground): Promise<Blob> {
  // Start from a fresh task, so the synchronous render below never runs inside a React update.
  await new Promise((resolve) => setTimeout(resolve, 0));
  const container = document.createElement("div");
  container.setAttribute("aria-hidden", "true");
  container.style.cssText = "position:fixed;left:-100000px;top:0;pointer-events:none;";
  document.body.appendChild(container);
  const root = createRoot(container);
  try {
    const fontFamily = getComputedStyle(document.body).fontFamily;
    flushSync(() => root.render(<FretboardPicture input={input} background={background} fontFamily={fontFamily} />));
    const svg = container.querySelector("svg");
    if (!svg) throw new Error("Picture did not render");
    const families = inlineComputedStyles(svg);
    const width = Number(svg.getAttribute("width"));
    const height = Number(svg.getAttribute("height"));
    const serialize = () => withSingleSvgNamespace(new XMLSerializer().serializeToString(svg));
    const plainMarkup = serialize();
    const fontCss = await embeddedFontCss(families).catch(() => "");
    if (fontCss) {
      const style = document.createElementNS(SVG_NS, "style");
      style.textContent = fontCss;
      svg.insertBefore(style, svg.firstChild);
      try {
        return await rasterize(serialize(), width, height);
      } catch (error) {
        // Some browsers refuse embedded fonts in pictures: fall back to the system font.
        console.warn("Fretboard image: retrying without the embedded font", error);
      }
    }
    return await rasterize(plainMarkup, width, height);
  } finally {
    root.unmount();
    container.remove();
  }
}
