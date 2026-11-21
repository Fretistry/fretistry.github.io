/**
 * Generates every Fretistry icon and image from the SVG sources in public/brand.
 *
 *   npm run brand
 *
 * Outputs
 *   src/app/icon.svg                 browser tab icon (modern browsers)
 *   src/app/favicon.ico              browser tab icon (16/32/48 px, older browsers)
 *   src/app/apple-icon.png           iPhone / iPad home-screen icon (180 px)
 *   public/icons/icon-*.png          Android / installable-app icons (incl. maskable)
 *   src/app/opengraph-image.png      link preview image (1200×630)
 *   public/brand/fretistry-logo-*.png  horizontal logo for dark and light backgrounds
 */
import { copyFile, mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import React from "react";
import sharp from "sharp";
import og from "next/og.js";

const { ImageResponse } = og;
const h = React.createElement;
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const p = (...parts) => path.join(root, ...parts);

const COLORS = {
  background: "#111216",
  text: "#F4F4F6",
  muted: "#A3A6B3",
  amber: "#F7A93B",
  amberLight: "#FFCB66",
  teal: "#2FC2B2",
  ink: "#22140A",
};

// ── Raster helpers ───────────────────────────────────────────────────────────

async function svgToPng(file, size) {
  const svg = await readFile(file);
  const density = Math.max(72, Math.ceil(((size * 2) / 512) * 72));
  return sharp(svg, { density }).resize(size, size).png({ compressionLevel: 9 }).toBuffer();
}

/** An .ico file that embeds PNG images (supported by every current browser). */
function buildIco(images) {
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0);
  header.writeUInt16LE(1, 2);
  header.writeUInt16LE(images.length, 4);
  const directory = Buffer.alloc(16 * images.length);
  let offset = 6 + directory.length;
  images.forEach(({ size, data }, i) => {
    const o = i * 16;
    directory.writeUInt8(size >= 256 ? 0 : size, o);
    directory.writeUInt8(size >= 256 ? 0 : size, o + 1);
    directory.writeUInt8(0, o + 2);
    directory.writeUInt8(0, o + 3);
    directory.writeUInt16LE(1, o + 4);
    directory.writeUInt16LE(32, o + 6);
    directory.writeUInt32LE(data.length, o + 8);
    directory.writeUInt32LE(offset, o + 12);
    offset += data.length;
  });
  return Buffer.concat([header, directory, ...images.map((img) => img.data)]);
}

const dataUri = (svg) => `data:image/svg+xml;base64,${Buffer.from(svg).toString("base64")}`;

/**
 * "Fret" + "istry" in two colours. The image renderer treats the two parts as
 * separate words and inserts a word space between them, so that space
 * (≈0.167 em in Geist, plus letter spacing) is cancelled with a negative margin.
 */
function wordmark({ size, letterSpacing, color, accent }) {
  const wordSpace = size * 0.1667 + letterSpacing;
  return h(
    "div",
    { style: { display: "flex", fontSize: size, fontWeight: 600, letterSpacing, color } },
    h("span", { style: { marginRight: -wordSpace } }, "Fret"),
    h("span", { style: { color: accent } }, "istry"),
  );
}

// ── Fretboard illustration for the preview image (A minor pentatonic) ───────

function fretboardSvg(width, height) {
  const open = [40, 45, 50, 55, 59, 64]; // E2 A2 D3 G3 B3 E4
  const scale = new Set([9, 0, 2, 4, 7]); // A minor pentatonic
  const frets = 15;
  const openZone = 54;
  const pad = 14;
  const top = 18;
  const bottom = height - 18;
  const spacing = (bottom - top) / 6;
  const stringY = (s) => top + spacing / 2 + (5 - s) * spacing;
  const boardStart = openZone;
  const boardEnd = width - pad;
  const pos = (f) => 1 - 2 ** (-f / 12);
  const wireX = (f) => boardStart + (pos(f) / pos(frets)) * (boardEnd - boardStart);
  const noteX = (f) => (f === 0 ? openZone / 2 : (wireX(f - 1) + wireX(f)) / 2);
  const inBox = (s, f) => f >= 5 && f <= 8; // box 1 at the 5th fret

  const parts = [];
  parts.push(`<defs>
    <linearGradient id="w" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#3b2a1f"/><stop offset="1" stop-color="#231811"/></linearGradient>
    <linearGradient id="f" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#8d8d8d"/><stop offset=".45" stop-color="#f2f2f2"/><stop offset="1" stop-color="#9a9a9a"/></linearGradient>
  </defs>`);
  parts.push(`<rect x="0" y="0" width="${width}" height="${height}" rx="18" fill="#17110d"/>`);
  parts.push(`<rect x="${boardStart}" y="${top}" width="${boardEnd - boardStart}" height="${bottom - top}" fill="url(#w)"/>`);
  // box highlight
  const bx1 = noteX(5) - spacing * 0.62;
  const bx2 = noteX(8) + spacing * 0.62;
  parts.push(`<rect x="${bx1}" y="${top + 2}" width="${bx2 - bx1}" height="${bottom - top - 4}" rx="${spacing * 0.6}" fill="${COLORS.amber}" fill-opacity="0.16" stroke="${COLORS.amber}" stroke-opacity="0.45" stroke-width="2"/>`);
  // inlays
  for (const f of [3, 5, 7, 9, 15]) parts.push(`<circle cx="${noteX(f)}" cy="${(top + bottom) / 2}" r="6" fill="#e8dcc6" fill-opacity="0.55"/>`);
  for (const dy of [-spacing, spacing]) parts.push(`<circle cx="${noteX(12)}" cy="${(top + bottom) / 2 + dy}" r="6" fill="#e8dcc6" fill-opacity="0.55"/>`);
  // nut + frets
  parts.push(`<rect x="${boardStart - 7}" y="${top - 2}" width="8" height="${bottom - top + 4}" rx="2" fill="#efe6d4"/>`);
  for (let f = 1; f <= frets; f++) parts.push(`<rect x="${wireX(f) - 1.8}" y="${top}" width="3.6" height="${bottom - top}" fill="url(#f)"/>`);
  // strings
  open.forEach((_, s) => {
    const t = 1 + ((5 - s) / 5) * 2;
    const color = s < 3 ? "#d9c7a1" : "#e6e6e6";
    parts.push(`<rect x="4" y="${stringY(s) - t / 2}" width="${boardEnd - 4}" height="${t}" fill="${color}"/>`);
  });
  // notes
  const r = spacing * 0.36;
  open.forEach((o, s) => {
    for (let f = 0; f <= frets; f++) {
      const pc = (o + f) % 12;
      if (!scale.has(pc)) continue;
      const isRoot = pc === 9;
      const strong = inBox(s, f);
      const fill = isRoot ? COLORS.amber : COLORS.teal;
      const opacity = strong ? 1 : 0.38;
      const rr = strong ? r : r * 0.62;
      if (isRoot && strong) parts.push(`<circle cx="${noteX(f)}" cy="${stringY(s)}" r="${rr + 6}" fill="${COLORS.amber}" fill-opacity="0.28"/>`);
      parts.push(`<circle cx="${noteX(f)}" cy="${stringY(s)}" r="${rr}" fill="${fill}" fill-opacity="${opacity}"/>`);
    }
  });
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">${parts.join("")}</svg>`;
}

// ── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  await mkdir(p("public/icons"), { recursive: true });
  const mark = p("public/brand/fretistry-mark.svg");
  const simple = p("public/brand/fretistry-mark-simple.svg");
  const maskable = p("public/brand/fretistry-icon-maskable.svg");

  // Browser tab icons
  await copyFile(simple, p("src/app/icon.svg"));
  const icoImages = [];
  for (const size of [16, 32, 48]) icoImages.push({ size, data: await svgToPng(simple, size) });
  await writeFile(p("src/app/favicon.ico"), buildIco(icoImages));

  // Home-screen / installable app icons
  await writeFile(p("src/app/apple-icon.png"), await svgToPng(maskable, 180));
  await writeFile(p("public/icons/icon-192.png"), await svgToPng(mark, 192));
  await writeFile(p("public/icons/icon-512.png"), await svgToPng(mark, 512));
  await writeFile(p("public/icons/icon-maskable-192.png"), await svgToPng(maskable, 192));
  await writeFile(p("public/icons/icon-maskable-512.png"), await svgToPng(maskable, 512));

  // Fonts for the text-based images
  const fontDir = p("node_modules/geist/dist/fonts/geist-sans");
  const fonts = [
    { name: "Geist", data: await readFile(path.join(fontDir, "Geist-Regular.ttf")), weight: 400, style: "normal" },
    { name: "Geist", data: await readFile(path.join(fontDir, "Geist-Medium.ttf")), weight: 500, style: "normal" },
    { name: "Geist", data: await readFile(path.join(fontDir, "Geist-SemiBold.ttf")), weight: 600, style: "normal" },
  ];
  const markUri = dataUri(await readFile(mark, "utf8"));

  // Link preview image (Open Graph / social media)
  const ogImage = new ImageResponse(
    h(
      "div",
      {
        style: {
          width: 1200,
          height: 630,
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "56px 72px 60px",
          fontFamily: "Geist",
          color: COLORS.text,
          backgroundColor: COLORS.background,
          backgroundImage:
            "radial-gradient(circle at 12% 0%, rgba(247,169,59,0.30), rgba(247,169,59,0) 46%), radial-gradient(circle at 96% 100%, rgba(47,194,178,0.22), rgba(47,194,178,0) 44%)",
        },
      },
      h(
        "div",
        { style: { display: "flex", alignItems: "center", gap: 20 } },
        h("img", { src: markUri, width: 76, height: 76 }),
        wordmark({ size: 54, letterSpacing: -1.5, color: COLORS.text, accent: COLORS.amber }),
      ),
      h(
        "div",
        { style: { display: "flex", flexDirection: "column", gap: 14 } },
        h("div", { style: { fontSize: 60, fontWeight: 600, letterSpacing: -2, lineHeight: 1.05 } }, "Master the guitar fretboard."),
        h(
          "div",
          { style: { fontSize: 28, color: COLORS.muted, lineHeight: 1.35, maxWidth: 940 } },
          "Interactive scales, chords and box shapes across all 24 frets — with the music theory explained.",
        ),
      ),
      h("img", { src: dataUri(fretboardSvg(1056, 176)), width: 1056, height: 176 }),
    ),
    { width: 1200, height: 630, fonts },
  );
  await writeFile(p("src/app/opengraph-image.png"), Buffer.from(await ogImage.arrayBuffer()));
  await writeFile(
    p("src/app/opengraph-image.alt.txt"),
    "Fretistry — interactive guitar scales, chords and box shapes on a 24-fret fretboard",
  );

  // Horizontal logo lockups (transparent background)
  for (const [variant, textColor] of [
    ["dark", COLORS.text],
    ["light", "#15161B"],
  ]) {
    const logo = new ImageResponse(
      h(
        "div",
        { style: { width: 1040, height: 280, display: "flex", alignItems: "center", gap: 44, fontFamily: "Geist", padding: "0 24px" } },
        h("img", { src: markUri, width: 220, height: 220 }),
        wordmark({ size: 168, letterSpacing: -6, color: textColor, accent: variant === "dark" ? COLORS.amber : "#E2801F" }),
      ),
      { width: 1040, height: 280, fonts },
    );
    await writeFile(p(`public/brand/fretistry-logo-${variant}.png`), Buffer.from(await logo.arrayBuffer()));
  }

  console.log("Brand assets generated.");
}

await main();
