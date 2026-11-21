<p align="center">
  <img src="public/brand/fretistry-logo-dark.png#gh-dark-mode-only" alt="Fretistry" width="420">
  <img src="public/brand/fretistry-logo-light.png#gh-light-mode-only" alt="Fretistry" width="420">
</p>

# Fretistry

**Master the guitar fretboard.** Fretistry is an interactive web app for exploring guitar scales across a 24-fret neck, seeing the chords in every key, learning box shapes and CAGED positions, and understanding the music theory behind it all.

Everything runs in your browser. There are no accounts, no database and no server-side code. The internet is only needed to install the building blocks, and once to load the published site.

---

## Starting the app on your computer

The simplest way to use Fretistry is the published website. To run it on your own computer you need [Node.js](https://nodejs.org) (the LTS version). Then, in a terminal, inside this folder:

```powershell
npm install
npm run dev
```

Then open <http://localhost:3000>.

| Command | What it does |
| --- | --- |
| `npm run dev` | Start the app for local use (updates automatically when code changes) |
| `npm test` | Run the automated tests |
| `npm run typecheck` | Check the code for type errors |
| `npm run lint` | Check code style |
| `npm run build` | Create an optimised production build |
| `npm run brand` | Regenerate all icons, the logo PNGs and the link preview image from `public/brand/*.svg` |

---

## Features

**Fretboard**

- Full 24-fret neck plus open strings, with real fret spacing: frets get narrower towards the body, just like on a guitar. On screens too narrow for that (e.g. a 1280-pixel laptop), the narrowing is softened just enough for all 24 frets to fit. An even-spacing option is available too.
- If the neck still doesn't fit (small tablets), the hidden edge fades out and a "swipe sideways" hint appears.
- Inlays, string labels with octaves, and optional fret numbers.
- Colour system. Amber is reserved for roots on the neck; selected buttons use a neutral "pressed" look.
  - **amber** = root (of the scale, or of the highlighted chord)
  - **amber ring** = while a chord is highlighted, the scale's own root, so the key stays visible
  - **teal** = scale note (or chord tone)
  - **grey ring** = not in the scale
  - **small faint dot** = outside the chosen position or chord
  - **light area** = the chosen position (box)
  - **white ring** = selected note
- Labels: note names, intervals (R, ♭3, 5…), note numbers (1, 2, 3… within the scale), or none.
- Show all notes, scale notes only, or roots only. Choose a fret range: 0–24, 0–12 or 12–24. On phones these three sit behind one **Display** button, so the neck starts on the first screen.
- **Left-handed view:** the whole neck is mirrored.
- **Vertical neck on phones:** the nut is at the top and you scroll down the neck, with the string names pinned below the header.
- **Tapping a note** shows a summary right where you're looking: a strip under the neck on computers and tablets, a panel sliding up from the bottom on phones. It gives the name, role in the scale, interval, string and fret, the role in a highlighted chord, and a Play button.
- On larger screens the **Selected note** card adds the frequency and every other place on the neck with the same pitch.

**Settings** (gear button, top right)

- Everything personal in one place: language, note names, left-handed, neck direction (Auto, Across, Down), fret numbers, even fret spacing, and light/dark theme.
- Settings are remembered on this device and never included in shared links.

**Scale positions ("box shapes")**

- **Positions:** 5 box shapes per scale. Pentatonic scales give the classic 5 pentatonic boxes, and 7-note scales give the familiar 5 CAGED patterns. In standard tuning (and E♭, D or C standard) each box is labelled with its CAGED shape (E, D, C, A, G).
- **7-string guitars:** the boxes are the same shapes a 6-string player knows, extended onto the low string, so they keep their CAGED names.
- **3 per string:** the 3-notes-per-string patterns, one starting on each scale degree.
- The chosen shape is outlined on the neck, repeats 12 frets higher where it fits, and the rest of the scale is dimmed.
- Shapes are calculated from the tuning, so they are correct in Drop D, open tunings and custom tunings too.

**Chords in the key**

- Triads or 7th chords built on every scale degree, with Roman numerals (I, ii, iii, IV, V, vi, vii°; ♭III, ♭VII… for minor keys).
- Tap a chord to highlight its notes. The chord's root is amber, the other chord tones are teal, and labels switch to the chord's own intervals (R, 3, 5, ♭7). The scale's own root keeps an amber ring. Combine it with a position to see the chord inside one box.
- A one-line summary shows the chord's name, numeral and notes. The ⓘ buttons explain how it's stacked, or why pentatonic scales borrow their chords.
- Pentatonic and blues scales use the chords of their parent scale. Whole-tone and diminished scales give their symmetric chords.
- The theory panel has a **Chords** tab explaining how the chords are stacked and how to read the numerals.

**Starting point and selections**

- A fresh visit always starts on **C Major**, unless you open a shared link.
- Your preferences are remembered: tuning, labels, view options, sound, metronome settings, and whether the theory panel is folded.
- A highlighted chord belongs to one key, so it is cleared when you change the root or scale.
- Position choices (e.g. "box 2" or "3 per string") carry over to the new key.
- A clicked note keeps its place on the neck, and the inspector explains what that fret means in the new key.

**Shareable links**

- The address bar always describes what you're looking at: root, scale, tuning (including custom tunings), position and chord. For example: `?root=A&scale=dorian&tuning=drop-d&pos=boxes2&chord=4`. Older links that still say `mode=practice` simply open normally.
- The **Share** menu has two choices: **Copy link** (on phones: **Share link…**, which opens the share sheet) and **Save as image…**.
- Personal preferences (theme, labels, left-handed, sound) stay on your own device.

**Sound**

- Notes play as a plucked guitar string at the exact pitch. A new note on the same string cuts off the previous one; notes on different strings ring together.
- **Play scale** plays the scale up and down while lighting up each note, and **Play chord** strums the highlighted chord.
- The speaker icon turns note sounds on or off. The metronome has its own volume. On iPhone the sound plays even when the silent switch is on (iOS 16.4+).

**Metronome**

- The metronome icon in the header opens the panel.
- Tempo from 30 to 260 BPM, set with a slider, ± buttons, quick presets or **tap tempo**. The Italian tempo name is shown too (Andante, Allegro…).
- Beats per bar (2–7), clicks per beat (beats, 8ths, triplets, 16ths), an accent on beat one, and its own volume.
- Sample-accurate timing: clicks are scheduled on the audio clock, so they stay steady even when the computer is busy, and keep going in a background tab.
- It keeps running while you explore. The header icon's pendulum swings and a light flashes on every beat. Your metronome settings are remembered.

**Music theory panel** (collapsible — click "Music theory" to fold it away) — every sentence is generated from the scale data

- Notes, formula, intervals, the W/H step pattern, how the scale is built, and why it sounds major or minor.
- **Why these notes?** explains the spelling, e.g. "E♭ major has A♭, not G♯".
- **Chords** in the key, with Roman numerals.
- **Relationships:** modes (with a 7-mode table for the major-scale modes, and links such as "Phrygian Dominant is the 5th mode of Harmonic Minor"), relative and parallel keys, close cousins, subsets and symmetry. "Show me" buttons jump to each related scale.

**Favourite scales**

- Tap the **star** next to the scale name to save the current root + scale (e.g. "A Minor Pentatonic") as a favourite. Tap it again to remove it.
- Favourites appear as one-tap buttons under the root/scale/tuning controls. The one you're looking at is highlighted, and the × removes it.
- They are saved in this browser on this device: no account needed, private, and they work offline. Each device and browser keeps its own list, and clearing the browser's data erases it. Up to 30 favourites are kept; adding more drops the oldest.
- Names follow the chosen language and note names ("La pentatonique mineure", "H-Dur").

**Save as image**

- **Share → Save as image…** makes a picture of the fretboard exactly as it looks now: your labels, position, highlighted chord, fret range and left-handed view.
- The picture adds the scale name, its notes and formula, the tuning, and a colour key. The neck is always drawn horizontally, even when your phone shows it vertically.
- Choose a dark background, or a white one for printing. Download it as a sharp PNG (double resolution), or on phones share it straight to Photos, WhatsApp and so on.
- File names describe the picture, e.g. `fretistry-a-minor-pentatonic-drop-d.png`.
- Once the site is published (with `NEXT_PUBLIC_SITE_URL` set), the site address appears small in the corner of every picture.

**Scales and tunings**

- 12 roots and 22 scales, all with correct enharmonic spelling, in five groups:
  - **Major:** Major (Ionian), Major Pentatonic, Lydian, Mixolydian
  - **Minor:** Natural Minor (Aeolian), Harmonic Minor, Melodic Minor, Minor Pentatonic, Dorian, Phrygian, Locrian
  - **Blues:** Blues (minor), Major Blues
  - **Jazz & symmetric:** Lydian Dominant, Altered (Super Locrian), Whole Tone, Diminished (whole-half), Diminished (half-whole)
  - **World & exotic:** Phrygian Dominant (Spanish), Hungarian Minor, Double Harmonic Major, Hirajoshi
- 15 tunings in three groups, plus a custom tuning editor:
  - **Standard & drop:** Standard, E♭ Standard (half step down), D Standard, C Standard, Drop D, Drop C, Drop B
  - **Open & alternate:** Open G, Open D, Open E, Open A, Open C, DADGAD
  - **7-string:** 7-string Standard (B E A D G B E), 7-string Drop A
- **Custom tunings:** set each string by note and octave or in half steps, start from any preset, and switch between 6 and 7 strings. A new 7th string is tuned a 4th below the lowest string.

**Languages**

- English, Dutch (Nederlands), German (Deutsch), French (Français) and Spanish (Español). Everything is translated: the controls, the chord names and the full music-theory explanations.
- The app follows the browser's language on the first visit. Change it in **Settings** (the gear button in the header). Your choice is remembered.
- **Note names:** letters (C D E F G A B), the German system (where H = B and B = B♭), or do-re-mi (Do Ré Mi… as used in France and Spain). Each language picks the usual system automatically, and you can change it in Settings.
- Links can force a language with `?lang=nl`, `?lang=de`, `?lang=fr` or `?lang=es`.

**Phones and tablets (iOS and Android)**

- Responsive layout with large touch targets, no accidental zooming, and support for notches and rounded screen corners.
- **Installable as an app:** use Android "Install app" or iPhone "Share → Add to Home Screen". It opens full-screen with its own icon.
- After the first visit, the published site keeps working offline. An offline helper (a "service worker") is installed in production builds only, never during local development.

**Branding**

- Fretistry logo and wordmark, favicon (SVG + ICO), iPhone home-screen icon, Android icons (including adaptive "maskable" icons), and a 1200×630 link preview image for social media and chat apps.
- All are generated from `public/brand/*.svg` with `npm run brand`. The horizontal logos are in `public/brand/fretistry-logo-dark.png` and `fretistry-logo-light.png`.
- A small "Made by Bart Vangerven" credit sits in the page footer (translated), and the same name is set as the page's author in its metadata. Change it in `src/lib/site.ts` (`CREATOR`).

---

## Publishing it as a website

**GitHub Pages (set up):** every push to the `main` branch runs `.github/workflows/deploy.yml`. It installs everything, runs the tests, builds the static website and publishes it. If a test fails, nothing is published.

- One-time setting on GitHub: **Settings → Pages → Build and deployment → Source: GitHub Actions**.
- The address and sub-folder are detected automatically, e.g. `https://yourname.github.io/fretistry/`. This includes a custom domain if you add one later.
- Progress and history: the repository's **Actions** tab.

**Other static hosts** (Netlify, Cloudflare Pages, Vercel…) work too. Build with these settings and upload the `out` folder:

| Setting | When | Example |
| --- | --- | --- |
| `STATIC_EXPORT=1` | Always: writes the plain website to `out/` | `1` |
| `NEXT_PUBLIC_SITE_URL` | Always: makes link previews use your real address | `https://fretistry.com` |
| `NEXT_PUBLIC_BASE_PATH` | Only when the site lives in a sub-folder | `/fretistry` for `yourname.github.io/fretistry` |

To check the published version locally first, build with those settings and run `node scripts/serve-static.mjs`. It serves `out/` at <http://localhost:3200/fretistry/>.

The site description used for search engines and link previews is in `src/lib/site.ts` and `public/manifest.webmanifest`.

---

## Project structure

```
src/
  lib/theory/       Music theory engine — pure TypeScript, no React (fully unit-tested)
    notes.ts          letters, accidentals, pitch classes, MIDI ↔ pitch, octaves
    intervals.ts      interval quality/names from spelled notes
    scales.ts         correct scale spelling incl. enharmonic decisions
    fretboard.ts      pitch at every string/fret, annotated with scale info
    positions.ts      box shapes, CAGED and 3-notes-per-string patterns for any tuning
    chords.ts         chords in the key, chord identification, Roman numerals
    relationships.ts  modes, relatives, subsets, symmetry
    explain.ts        generates all explanation text from the data
    language.ts       the sentences explain.ts uses, in English (other languages implement the same interface)
    note-names.ts     letter, German (H/B) and do-re-mi note naming
  lib/i18n/         translations
    ui/               interface text: en.ts, nl.ts, de.ts, fr.ts, es.ts
    theory/           theory sentences and scale names/descriptions per language
    index.ts          language detection and the bundle each screen uses (tested)
  lib/data/         scales.ts, tunings.ts, roots.ts  ← add new scales/tunings here
  lib/audio/        shared audio context, plucked-string synth, Web Audio playback,
                    scale & chord sequences, metronome scheduler (metronome.ts, tested)
  lib/share.ts      shareable-link encoding (tested)
  lib/file-name.ts  file names for saved pictures (tested)
  lib/favourites.ts favourite scales: storing, reading, adding/removing (tested)
  lib/site.ts       site name, description and URLs
  components/
    fretboard/      SVG fretboard: orientation/handedness geometry + marker logic (tested),
                    fretboard-image.tsx draws the "Save image" picture
    explorer/       app shell, controls, settings menu, position picker, chord bar, share menu & save image
    theory/         theory panel (overview, why, chords, relationships)
    inspector/      selected-note card, plus the strip under the neck / phone panel (note-summary.tsx)
    brand/          logo mark and wordmark
    metronome/      header metronome button and panel
    i18n/           language provider (choice, detection, remembering it)
    pwa/            offline service-worker registration
  hooks/            app state (local storage + URL, tested), favourites, scale playback, metronome, media queries
public/brand/       logo sources (SVG) and generated logo PNGs
public/sw.js        offline service worker
scripts/            brand asset generator
```

### Adding a scale

Add one object to `src/lib/data/scales.ts`:

```ts
{
  id: "neapolitan-minor",
  name: "Neapolitan Minor",
  category: "world",
  intervals: [0, 1, 3, 5, 7, 8, 11],   // semitones above the root
  degrees:   [1, 2, 3, 4, 5, 6, 7],    // letter step of each note (drives spelling)
  character: "…",
  usage: "…",
}
```

That's all. The picker, fretboard, spelling, positions, chords, explanations and tests pick it up automatically.
For the other languages, add the scale's name, character and usage to each file in `src/lib/i18n/theory/`. Until you do, those languages show the English text for that scale, and a test reminds you.

### Adding a tuning

Add one line to `src/lib/data/tunings.ts`, e.g. `tuning("open-f", "Open F", "C2 F2 C3 F3 A3 C4")`, and put its id in one of the `TUNING_GROUPS` there. Then give it a name in each file in `src/lib/i18n/ui/` (`"open-f": "Open {F}"`; `{F}` becomes the note name in the chosen naming system). A test checks that every tuning has a group and a name in every language.

---

## Tests

`npm test` runs 440 automated checks, including:

- **Required cases:** C Major, A Natural Minor, A Minor Pentatonic, E Minor Pentatonic, Drop D, and custom tunings.
- **Spelling:** every root × every scale for correct pitches and spelling.
- **Tunings:** the exact pitches of all 15 presets, every preset in a menu group, and adding or removing the 7th string.
- **Positions:** the classic pentatonic boxes, the CAGED shapes, G major 3-notes-per-string, Drop D boxes, and 7-string boxes that match the 6-string shapes.
  - A sweep over every tuning × root × scale × position checks that each note is valid, in the scale and never duplicated.
- **Chords:** diatonic triads and 7ths with Roman numerals in major, minor and harmonic minor keys, and every chord identified for every root and scale.
- **Shareable links:** round-tripping every field (including 7-string tunings), rejecting invalid links, and ignoring old practice-mode links.
- **Saved pictures:** readable, safe file names in every language.
- **Favourites:** adding, removing, saving and reading back, ignoring broken or unknown entries, and the 30-item limit.
- **Fretboard geometry:** real fret spacing, the softened spacing that fits narrower screens (never softer than needed), no overlapping markers, the left-handed mirror, and the vertical layout.
- **Chord view:** the scale's root stays marked while a chord is highlighted.
- **Display logic:** filters, chord highlighting and positions.
- **Sound:** every synthesized note must be within 5 cents of its true pitch.
- **Metronome:** exact click spacing, accents and subdivisions, seamless tempo changes, tap tempo, and a clean stop.
- **Selection rules:** C Major start, a chord cleared on key change, and positions kept.
- **Languages:** every interface text exists in all five languages, every scale is translated, German H/B and do-re-mi names are correct, and a sweep over every language × note-name system × root × scale checks that no text comes out broken.

---

## Known limitations / ideas for later

- **Sound is a synthesized pluck, not a recorded guitar.** There's no volume slider yet.
- **Favourites stay on one device.** There's no way yet to copy your list to another phone or computer.
- **No practice mode for now.** It was removed to keep the app focused; a proper fretboard trainer (quizzes, score, timer) could replace it later.
- **6 or 7 strings in the custom-tuning editor.** The engine also handles 8-string tunings (and links with 4–8 strings work), but the editor only offers 6 and 7.
- **CAGED letters only in standard-type tunings** (including 7-string standard and Drop A). Other tunings show numbered positions.
- **Saved pictures use Latin-script fonts.** The ♯ and ♭ signs come from your system's font, so they can look slightly different from the rest of the text.
- **Link previews and search results stay in English.** The page title and description that WhatsApp, Facebook or Google show are written before the app knows the visitor's language.
- **Translations deserve a native speaker's read.** They were written with care and checked for correct music terms, but a native guitarist may still spot wording to polish.
