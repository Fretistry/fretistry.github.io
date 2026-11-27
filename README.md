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
  - **coloured areas** = the chosen CAGED shapes or boxes (one colour each), shaded on the fret grid; a light neutral area for a 3-per-string pattern
  - **white ring** = selected note, or the note sounding in Play scale
  - **dashed white ring** = exactly the same pitch as the selected note, somewhere else on the neck
- Labels: note names, intervals (R, ♭3, 5…), note numbers (1, 2, 3… within the scale), or none. The ⓘ button next to them explains what each one means.
- Show all notes, scale notes only, or roots only.
- **Fret range:** 0–12, 0–15 (about as far as most acoustic guitars comfortably go), 0–22 (many electrics), 0–24, or the upper octave 12–24. Phones start on 0–12, larger screens on 0–24; once you pick one yourself, it's remembered.
- On phones these three sit behind one **Display** button, so the neck starts on the first screen.
- **Phone layout, top to bottom:** one row with the key (an amber button that opens the 12 notes), the scale and the tuning (just its name); the scale's title with **Play**, **Share** and **Train**; its notes; **Display ▾** and **Chords ▾**; Shapes and "Start here"; the one-row metronome bar; then the neck, which starts on the first screen. The mood line is in Music theory there.
- **Laptops and tablets:** Shapes, "Start here" and the chords share lines, so the whole neck fits on a 1366×800 laptop and a 1024×768 tablet.
- **Touch screens** get taller buttons (36 px instead of 28), easier to hit with a guitar on your lap; with a mouse they stay compact.
- **Left-handed view:** the whole neck is mirrored.
- **Vertical neck on phones:** the nut is at the top and you scroll down the neck, with the string names pinned below the header.
- **Tapping a note** plays it and rings it on the neck. On computers and tablets a strip under the neck adds the name, role in the scale, interval, string and fret, the role in a highlighted chord, and a Play button. Phones keep the neck clear: no panel slides over it.
- **Same pitch elsewhere:** every other place to play exactly that pitch gets a dashed ring on the neck itself, also outside the chosen shape. (This replaces the old "Selected note" card, so the music theory panel now uses the full width.)
- **Scale picker with moods:** each scale in the list has a short line under its name ("Bright, stable and happy", "Dark and exotic"…), so you can choose by sound.

**Settings** (gear button, top right)

- Everything personal in one place: language (a compact dropdown), note names, left-handed, neck direction (Auto, Across, Down), fret numbers, even fret spacing, and the theme: Dark, Light or **Auto** (follows the device's light or dark setting, also when it switches at sunset).
- Settings are remembered on this device and never included in shared links.

**CAGED shapes and scale positions**

- **CAGED:** the 5 shapes of each scale, in the order guitarists learn them: **C – A – G – E – D**. They're available in standard tuning (and E♭, D or C standard).
- **Stay in this area when changing key** (a switch under the shapes, while one shape is shown): a new key or scale shows the shape nearest the frets you were on, instead of the same letter somewhere else. D Dorian's C shape at fret 2 → G Dorian's shape at fret 2, so you can run one area of the neck through every key.
- **Box numbers:** for the minor pentatonic and blues, shapes also carry the box number most lessons use: box 1 is the E shape (at the 5th fret in A), then D, C, A and G are boxes 2–5. The line under the buttons reads e.g. "E shape · box 1 · from the 5th fret", and with one shape shown it adds "tap another letter to see how the shapes connect".
  - 7-note scales give the standard CAGED scale patterns, and an automated test checks all five C major shapes against the usual diagrams.
  - Pentatonic scales give the 5 pentatonic boxes, named by the same shapes (the familiar "box 1" at the 5th fret of A minor pentatonic is the E shape).
- **Shaded like a CAGED diagram:** each shown shape is shaded on the fret grid. On every string the area covers exactly the frets that string uses, with edges on the fret wires and a step where the shape shifts (e.g. at the B string). It repeats 12 frets higher where it fits, and the rest of the scale is dimmed.
- **Several shapes at once:** the C, A, G, E, D buttons switch shapes on and off, in any combination (also all off). **All** switches all five on; once they're all on, that button reads **None** and switches them all off. The buttons never move while you click them; only their colour changes.
  - Each shape has its own colour: C coral, A blue, G lime, E purple, D green.
  - Shapes that meet on the neck get nearly opposite colours, and none of them looks like the amber root or teal scale notes (a test checks this).
  - A letter badge above each shape names it, so you don't have to rely on colour alone.
  - Links remember the combination (e.g. `pos=boxes1-2-3` = C, A and G; `pos=boxes` = CAGED view with all shapes off), and saved pictures show the colours too.
- **Other tunings:** the same 5 boxes, numbered 1–5, calculated from the tuning so they are correct in Drop D, open tunings and custom tunings too.
- **7-string guitars:** the shapes are the ones a 6-string player knows, extended onto the low string, so they keep their CAGED names.
- **3 per string:** the 3-notes-per-string patterns, one starting on each scale degree.
- The ⓘ button next to **Shapes** explains what CAGED, positions and 3-per-string patterns are, and how to learn them.

**Chords in the key**

- Triads or 7th chords built on every scale degree, with Roman numerals (I, ii, iii, IV, V, vi, vii°; ♭III, ♭VII… for minor keys).
- Tap a chord to highlight its notes. The chord's root is amber, the other chord tones are teal, and labels switch to the chord's own intervals (R, 3, 5, ♭7). The scale's own root keeps an amber ring. Combine it with a position to see the chord inside one box.
- A one-line summary shows the chord's name, numeral and notes. The ⓘ buttons explain triads, 7ths and Roman numerals, how the chord is stacked, and why pentatonic scales borrow their chords.
- Pentatonic scales use the chords of their parent scale (the key they come from).
- **Blues and major blues** show the three chords of a 12-bar blues: I, IV and V (in 7ths mode the dominant 7ths, e.g. E7, A7, B7 in E), with a line on how the scale works over them. Picking one shows its notes with their own spelling, also the ones outside the scale (the G♯ of E7).
- **Whole-tone and diminished scales** give their symmetric chords, each spelled in thirds from its own root, without double sharps or flats (G♯dim = G♯ B D, Daug = D F♯ A♯; a diminished 7th keeps its textbook 𝄫7, Cdim7 = C E♭ G♭ B𝄫).
- The theory panel has a **Chords** tab explaining how the chords are stacked and how to read the numerals.
- **On phones** the chords sit behind a **Chords ▾** button next to Display (it names the chosen chord). Picking one closes the menu and brings the neck into view; the chosen chord's one-line summary (with Play and ×) stays right above the neck.

**Starting point and selections**

- A fresh visit always starts on **C Major**, unless you open a shared link.
- **Start here:** until you have favourites of your own.
  - On the **home page** a row under the controls offers popular first scales: A minor pentatonic (box 1, E shape), E minor pentatonic in open position, C major (C shape) and A blues.
  - On a **scale's own page** (often reached from a search) the scale is already chosen, so next to the Shapes picker there's one slim chip with a good first shape for that scale, e.g. "E shape · box 1 · from the 5th fret": the shape with its root on the low E string, or on the A string when that sits too high. Pentatonic and blues shapes also get their usual box number. The ⓘ explains it.
  - One tap shows the scale in that one shape instead of the whole neck.
  - On a major or natural minor page it also offers an **easier start**: "Easier start: G Major Pentatonic" (five notes instead of seven).
- **The neck comes into view:** after Start here, picking a shape, Play scale, Train or a chord's "Show", the page scrolls just far enough to show the result (on a vertical neck: the chosen shape). Nothing moves when it's already in view, and with "reduce motion" turned on it jumps instead of gliding.
- Your preferences are remembered: tuning, labels, view options, sound, metronome and drone settings (and whether their bar is shown), and whether the theory panel is folded.
- A highlighted chord belongs to one key, so it is cleared when you change the root or scale.
- Position choices (e.g. "box 2" or "3 per string") carry over to the new key.
- A clicked note keeps its place on the neck, and the note summary explains what that fret means in the new key.

**A page for every scale (findable in search engines)**

- Every scale in every key has its own address in each language: 12 keys × 22 scales × 5 languages = **1,320 pages**, e.g. `/en/a-minor-pentatonic/`, `/nl/c-sharp-dorian/`, `/de/e-flat-major/`. (Each page is a folder of its own, hence the closing slash; addresses typed without it are forwarded.)
- Each page has its own title and description in its language, with the word people search for ("scale", "toonladder", "Tonleiter", "gamme", "escala") and sharps and flats also written out the way they're typed: "E♭ Major scale (E flat Major) on guitar", "E♭-Dur (Es-Dur) – Tonleiter auf der Gitarre", "Mi♭ majeur (Mi bémol majeur) — gamme à la guitare". When a key is written as its simpler twin (C♯ Lydian → D♭ Lydian), the title names both.
- Each page links to its versions in the other languages, and opens the app on that scale.
- While the app starts (a moment), the page already shows, as real text: the scale's name, mood, notes and formula, how it's built, its intervals, character and typical use, the chords in the key and related scales. It links to the related scales, the other scales in the same key, the same scale in the other keys and the overview. That's also what search engines read.
- **Overview pages** per language (`/en/`, `/nl/`, `/de/`, `/fr/`, `/es/`) list every scale in every key, grouped like the scale picker. The home page links to them, and so does the app's footer ("All scales"). Jump links at the top lead to each group (Major, Minor, Blues, Jazz…), handy on a phone.
- **For search engines:** a canonical address for each page (the home page included), structured data (what Fretistry is, and breadcrumbs such as Fretistry › Guitar scales › A Minor Pentatonic), and each page's language marked for search engines. A `sitemap.xml` lists every page and `robots.txt` points to it. Nothing is written by hand: the pages are generated from the same data when the site is built.
- **Language:** a language you chose yourself in Settings wins; otherwise the page's language is used (on the home page: the browser's language).

**Shareable links**

- The address bar always describes what you're looking at: the page is the key and scale (in the current language), and anything else follows after the "?", e.g. `/en/a-dorian/?tuning=drop-d&pos=boxes2&chord=4`. Standard tuning and the plain view need nothing after the "?". Reloading or sharing opens exactly that view.
- A plain visit to the home page keeps its address until you change something.
- Older links (`?root=A&scale=dorian&…`, or with `mode=practice`) still open normally.
- **Lesson links:** shared while the metronome or drone plays, the link also carries the tempo and drone sound (`…?bpm=80&drone=pad5`). Opening it sets them up; nothing starts by itself (browsers only allow sound after a tap).
- The **Share & save** menu has two choices, each with a line saying what you get: **Copy link** ("Opens exactly this view"; on phones: **Share link…**, which opens the share sheet) and **Save as image…** ("A picture of the neck · dark, or white for printing").
- **Settings** also says that Fretistry works offline and can be added to a phone's home screen, and links to the overview of all scales.
- Personal preferences (theme, labels, left-handed, sound) stay on your own device.

**Sound**

- Notes play as a plucked guitar string at the exact pitch. A new note on the same string cuts off the previous one; notes on different strings ring together.
- **Play scale** plays one shape on the neck, from its lowest note to its highest and back, and lights up each spot as it sounds, so you can follow along with your fingers. It uses the shape you chose (or, with several shapes or the whole neck shown, the one nearest the nut that fits in the visible frets). It plays one note per metronome click at the metronome's tempo (on laptops the button shows it: "Play scale 80 BPM"), and when the metronome is running it starts exactly on the next beat.
- **Play chord** strums the highlighted chord.
- The speaker icon turns note sounds on or off. The metronome has its own volume. On iPhone the sound plays even when the silent switch is on (iOS 16.4+).

**Metronome**

- **Docked at the neck:** a slim bar sits right above the fretboard with the metronome (**▶ Metronome**, the tempo with ± buttons, tap tempo and big **beat lights**, so the beat stays in view while you play) and the drone (**▶ Drone · A**; on phones just **▶ Drone**). Each start button names what it starts. The **Options** button holds the rest (named differently from the app's Settings in the header).
- It's shown on every screen; its × or the metronome icon in the header hides it (and the icon brings it back). With a vertical neck it stays pinned under the header as you scroll down the neck (string names pinned just below it).
- **On phones it's one row:** ▶ Metronome, − tempo +, ▶ Drone and the Settings button. While the metronome runs, small beat lights take the place of "BPM" under the tempo. The drone's sound (Pad / Harmonium), +5th and its ⓘ, Tap tempo and the × are in Settings. Below laptop width (1280 px) Tap tempo is in Settings too, so the bar stays on one line on tablets.
- Tempo from 30 to 260 BPM, set with a slider, ± buttons, quick presets or **tap tempo**. The Italian tempo name is shown too (Andante, Allegro…).
- Beats per bar (2–7), clicks per beat (beats, 8ths, triplets, 16ths), an accent on beat one, and its own volume.
- **Type a tempo** in Settings (the number is selected when you tap it, so typing replaces it).
- **Click on 2 and 4 only:** beats 1 and 3 stay silent, like a drummer's backbeat (the jazz way to practise).
- **Silent bars:** 1, 2 or 4 bars with clicks, then as many silent bars: keep the time yourself and see if you land together. The beat lights keep going.

**Keyboard shortcuts** (for practising with the guitar in your hands; **?** or Settings shows the list)

- **Space** metronome · **D** drone · **P** play the scale · **← →** key down/up a half step · **N** next key in the cycle of 4ths · **R** random key · **1–7** a shape (in the minor pentatonic and blues, 1 is box 1) and **0** the whole neck · **+ −** tempo.
- They're off while you type in a field or a menu is open, and Space and the arrows are left to a button you tabbed to.
- **Next in 4ths** and **Random key** are also buttons next to "Root note" (on phones: in the key's pop-up).
- Sample-accurate timing: clicks are booked 0.3 s ahead on the audio clock, so they stay steady even when a slower phone is busy (say, redrawing the neck after a key change), and keep going in a background tab. Stop silences clicks that were already booked.
- Light on the phone: only the beat lights and the header icon redraw on each click, not the rest of the page.
- It keeps running while you explore. Even with the bar hidden, the header icon's pendulum swings and flashes on every beat. Your metronome settings are remembered.

**Drone** (in the same bar)

- A note that keeps sounding under your playing: the root of the current key, so you hear what every note does against it (the ♭3 sad, the 3 happy, the 7 pulling up to the root). Change key and it glides to the new root.
- Two sounds: **Pad** (a warm, slowly moving synth sound) and **Harmonium** (a steady, singing reed organ), both with a soft room around them. **+5th** adds the fifth for a fuller sound. (On phones both are in the bar's Settings.)
- The ⓘ next to it explains what a drone is and how to practise with it, using the current scale's own notes: in A minor pentatonic, "C (the ♭3) sounds sad, and G (the ♭7) sounds relaxed and bluesy".
- Its volume is in **Settings**, separate from the metronome and the note sounds. Closing the bar stops the drone. Sound, fifth and volume are remembered.

**Fretboard trainer** (the **Train** button next to Share & save)

- Asks you to **find every spot** of one note of the scale ("Find every G"). The neck turns into blank circles; tap the right spots. Found notes appear with their name, a wrong tap flashes red, and you hear every note you tap.
- The clock starts at your first tap, not when the question appears. On phones the bar is one row ("Find every G · 0/7 · 0.0 s · ⏭ · ×").
- On the whole neck, the first round suggests learning one shape at a time, with a button that switches to it ("Only E shape · box 1").
- It quizzes the visible frets only, and only the chosen CAGED shapes or boxes if any are shown, so you can learn one shape at a time.
- A bar above the neck shows progress, mistakes and a timer, plus your totals for the session. **Next note** picks another note of the scale (never the same one twice in a row); **Skip** moves on without finishing.
- Changing the key, scale, tuning, fret range or shapes starts a fresh round. While training, the chord bar, the note summary and Play scale step aside; a saved picture still shows the normal neck.

**Music theory panel** (collapsible — click "Music theory" to fold it away) — every sentence is generated from the scale data

- Notes, formula, intervals, the W/H step pattern, how the scale is built, and why it sounds major or minor.
- **Why these notes?** explains the spelling, e.g. "E♭ major has A♭, not G♯".
- **Chords** in the key, with Roman numerals.
- **Relationships:** modes (with a 7-mode table for the major-scale modes, and links such as "Phrygian Dominant is the 5th mode of Harmonic Minor"), relative and parallel keys, close cousins, subsets and symmetry. "Show me" buttons jump to each related scale. The root picker has 12 spellings (C♯ but not D♭, E♭ but not D♯), so when a related scale can't open in its own spelling the card says so ("Opens as E♭ Natural Minor: the same notes, spelled the other way") and the modes table says "View as A♭".

**Favourite scales**

- Tap the **star** next to the scale name to save the current root + scale (e.g. "A Minor Pentatonic") as a favourite. Tap it again to remove it.
- Favourites appear as one-tap buttons under the root/scale/tuning controls. The one you're looking at is highlighted, and the × removes it.
- They are saved in this browser on this device: no account needed, private, and they work offline. Each device and browser keeps its own list, and clearing the browser's data erases it. Up to 30 favourites are kept; adding more drops the oldest.
- Names follow the chosen language and note names ("La pentatonique mineure", "H-Dur").

**Save as image**

- **Share & save → Save as image…** makes a picture of the fretboard exactly as it looks now: your labels, position, highlighted chord, fret range and left-handed view.
- The picture adds the scale name, its notes and formula, the tuning, and a colour key. The neck is always drawn horizontally, even when your phone shows it vertically.
- Choose a dark background, or a white one for printing. Download it as a sharp PNG (double resolution), or on phones share it straight to Photos, WhatsApp and so on.
- **Privacy-protected browsers:** some (e.g. Firefox with anti-fingerprinting turned on) scramble the PNG step on purpose. Fretistry checks the result, and in that case saves an equally sharp **SVG** picture instead, with a short note. The preview always shows the real picture.
- File names describe the picture, e.g. `fretistry-a-minor-pentatonic-drop-d.png`.
- Once the site is published (with `NEXT_PUBLIC_SITE_URL` set), the site address appears small in the corner of every picture.

**Scales and tunings**

- 12 roots and 22 scales, all with correct enharmonic spelling, in five groups:
  - **Major:** Major (Ionian), Major Pentatonic, Lydian, Mixolydian
  - **Minor:** Natural Minor (Aeolian), Harmonic Minor, Melodic Minor, Minor Pentatonic, Dorian, Phrygian, Locrian
  - **Blues:** Blues (minor), Major Blues
  - **Jazz & symmetric:** Lydian Dominant, Altered (Super Locrian), Whole Tone, Diminished (whole-half), Diminished (half-whole). Altered and half-whole diminished also say which chord they're played over and name their notes the jazz way: "C7alt: 1 ♭9 ♯9 3 ♭5 ♯5 ♭7", "G7♭9: 1 ♭9 ♯9 3 ♯11 5 13 ♭7".
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

- Responsive layout with larger buttons on touch screens, no accidental zooming, and support for notches and rounded screen corners.
- **Accessibility:**
  - The first Tab press offers **"Skip to the fretboard"**, and the 12 root notes are one Tab stop (the arrow keys move between them, like any radio group).
  - Light mode uses darker amber and teal for text (at least 4.5:1 contrast); the fretboard keeps its colours. The keyboard focus ring is solid.
  - Headings in order: the scale's name (h1), Music theory (h2), its sections (h3). Icon-only buttons have labels.
  - One calm "pressed" look for every selected option (a chord, +5th, a pattern); amber is for root notes only. The custom-tuning button shows a pencil, so it isn't confused with the metronome's Options.
- **Quick to start:** the page shows the scale as real text at once; the app's code is listed in the page itself, so it downloads together with the rest, and the text doesn't jump when the app takes over.
- **One language at a time:** the app downloads only the visitor's language (English is always included as the fallback). That language is worked out before the app starts (link, saved choice, page address, or browser) and fetched right away; the page's text stays on screen until it's there, so the app never appears blank or in English first. Picking another language in Settings fetches it then, and the whole interface switches at once. Each new language (Portuguese, Italian…) now only costs the visitors who read it. (Pages built ahead of time, with their titles and text for search engines, still have every language at hand.)
- **Large monitors:** from about 1760 pixels wide, the whole interface grows a little and uses more of the screen (up to 2240 px wide on a 2560 monitor). The neck grows with it: taller strings, bigger notes and labels.
- **Installable as an app:** use Android "Install app" or iPhone "Share → Add to Home Screen". It opens full-screen with its own icon.
- After the first visit, the published site keeps working offline. An offline helper (a "service worker") is installed in production builds only, never during local development. Each release registers it under its own name (`sw.js?v=<commit>`), so it clears the previous release's files instead of letting them pile up.
- The neck is drawn once, after its space is measured, instead of first at a guessed width.

**Branding**

- Fretistry logo and wordmark, favicon (SVG + ICO), iPhone home-screen icon, Android icons (including adaptive "maskable" icons), and a 1200×630 link preview image for social media and chat apps.
- All are generated from `public/brand/*.svg` with `npm run brand`. The horizontal logos are in `public/brand/fretistry-logo-dark.png` and `fretistry-logo-light.png`.
- A small "Made by Bart Vangerven" credit sits in the page footer (translated), and the same name is set as the page's author in its metadata. Change it in `src/lib/site.ts` (`CREATOR`).

**Privacy**

- Fretistry has no account, cookies, analytics, trackers or ads, and sends nothing anywhere. Fonts are bundled with the site and all sounds are generated in the browser, so no other services are contacted.
- Preferences and favourites are kept only in the visitor's own browser (local storage), plus the offline copy of the app. That's storage for features the visitor uses, so no cookie banner is needed.
- The footer has a fold-out **Privacy** statement in all five languages: what stays in the browser, that GitHub Pages logs visitors' IP addresses for security (with a link to GitHub's privacy statement), and that there's nothing to request or delete under the GDPR.
- Adding donations, visitor counting or a contact address later means updating that statement (`privacy` in `src/lib/i18n/ui/*.ts`).

---

## Publishing it as a website

**GitHub Pages (set up):** every push to the `main` branch runs `.github/workflows/deploy.yml`. It installs everything, runs the tests, builds the static website and publishes it. If a test fails, nothing is published.

- One-time setting on GitHub: **Settings → Pages → Build and deployment → Source: GitHub Actions**.
- `public/google82b35d0c829c3e2b.html` proves to Google Search Console that the site is yours. Keep it: if it disappears, Search Console loses access.
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
  app/              page.tsx (home), [lang]/page.tsx (overview of all scales per language),
                    [lang]/[slug]/page.tsx (the 1,320 scale pages, made at build time), sitemap.ts, robots.ts, layout.tsx
  lib/theory/       Music theory engine — pure TypeScript, no React (fully unit-tested)
    notes.ts          letters, accidentals, pitch classes, MIDI ↔ pitch, octaves
    intervals.ts      interval quality/names from spelled notes
    scales.ts         correct scale spelling incl. enharmonic decisions
    fretboard.ts      pitch at every string/fret, annotated with scale info
    positions.ts      box shapes, CAGED and 3-notes-per-string patterns for any tuning
    play-path.ts      which shape "Play scale" plays, and in what order
    chords.ts         chords in the key, chord identification, Roman numerals
    relationships.ts  modes, relatives, subsets, symmetry
    explain.ts        generates all explanation text from the data
    language.ts       the sentences explain.ts uses, in English (other languages implement the same interface)
    note-names.ts     letter, German (H/B) and do-re-mi note naming
  lib/i18n/         translations: core.ts (languages, no texts), load.ts (one language at a time,
                    for the app), index.ts (all languages, for the pages built ahead of time),
                    ui/ and theory/ (one file per language)
    ui/               interface text: en.ts, nl.ts, de.ts, fr.ts, es.ts
    theory/           theory sentences and scale names/descriptions per language
    index.ts          language detection and the bundle each screen uses (tested)
    spoken.ts         sharps/flats written out per language for page titles: "E flat", "Es", "mi bémol" (tested)
  lib/data/         scales.ts, tunings.ts, roots.ts  ← add new scales/tunings here
  lib/audio/        shared audio context, plucked-string synth, Web Audio playback,
                    scale & chord sequences, metronome scheduler (metronome.ts, tested), drone (drone.ts, tested)
  lib/pages.ts      scale page addresses: /nl/a-minor-pentatonic ↔ language, key and scale (tested)
  lib/share.ts      shareable-link encoding (tested)
  lib/file-name.ts  file names for saved pictures (tested)
  lib/favourites.ts favourite scales: storing, reading, adding/removing (tested)
  lib/start-here.ts the "Start here" first scales (tested)
  lib/trainer.ts    fretboard trainer: quiz area, target spots, choosing the next note (tested)
  lib/site.ts       site name, description and URLs
  components/
    fretboard/      SVG fretboard: orientation/handedness geometry + marker logic (tested),
                    fretboard-image.tsx draws the "Save image" picture
    explorer/       app shell, controls, settings menu, position picker, chord bar, share menu & save image,
                    trainer bar, "Start here" row, ⓘ info buttons
    theory/         theory panel (overview, why, chords, relationships)
    inspector/      the note summary strip under the neck (note-summary.tsx)
    brand/          logo mark and wordmark
    metronome/      one shared metronome (provider), the header button, the bar at the neck and its drone controls
    i18n/           language provider (choice, detection, remembering it)
    pwa/            offline service-worker registration
  hooks/            app state (local storage + URL, tested), favourites, scale playback, metronome, drone, trainer, media queries
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

`npm test` runs 494 automated checks, including:

- **Required cases:** C Major, A Natural Minor, A Minor Pentatonic, E Minor Pentatonic, Drop D, and custom tunings.
- **Spelling:** every root × every scale for correct pitches and spelling.
- **Tunings:** the exact pitches of all 15 presets, every preset in a menu group, and adding or removing the 7th string.
- **Positions:** the classic pentatonic boxes, the five C major CAGED shapes against the standard diagrams, the C-A-G-E-D order, G major 3-notes-per-string, Drop D boxes, and 7-string boxes that match the 6-string shapes.
  - The shaded area of a shape always ends on fret wires.
  - Neighbouring shapes get near-complementary colours that differ from the root and scale-note colours.
  - Links with several shapes round-trip, and old single-shape links still open correctly.
  - A sweep over every tuning × root × scale × position checks that each note is valid, in the scale and never duplicated.
- **Chords:** diatonic triads and 7ths with Roman numerals in major, minor and harmonic minor keys, and every chord identified for every root and scale. Blues scales get I7–IV7–V7. Whole-tone and diminished chords are spelled in thirds with the right interval names, and a sweep over every root checks they never need a double sharp or flat (apart from the 𝄫7 of a diminished 7th).
- **The blue note** is called ♭5 in every key, also where it's written as A (E♭ blues) to avoid B𝄫.
- **Shareable links:** round-tripping every field (including 7-string tunings), rejecting invalid links, and ignoring old practice-mode links.
- **Scale pages:** every key × scale gets its own address that reads back to exactly that key and scale (no two alike, "c-sharp-…" never mistaken for "c"), one page per language, addresses recognised in a sub-folder too, and only the extras after the "?". Page titles carry the word for "scale" and the sharps/flats written out per language ("E flat", "Es-Dur", "mi bémol", "fa sostenido"), and name the requested key when the spelling switched.
- **Saved pictures:** readable, safe file names in every language, and picture markup that Firefox accepts (no duplicate namespace).
- **Favourites:** adding, removing, saving and reading back, ignoring broken or unknown entries, and the 30-item limit.
- **Fretboard geometry:** real fret spacing, the softened spacing that fits narrower screens (never softer than needed), no overlapping markers, the left-handed mirror, and the vertical layout.
- **Chord view:** the scale's root stays marked while a chord is highlighted.
- **Display logic:** filters, chord highlighting and positions.
- **Sound:** every synthesized note must be within 5 cents of its true pitch.
- **Metronome:** exact click spacing, accents and subdivisions, seamless tempo changes, tap tempo, a clean stop, and knowing when the next beat falls (so Play scale can start on it). Bars are counted; the backbeat silences beats 1 and 3, and silent bars come in the chosen pattern.
- **Lesson links and key steps:** the tempo and drone sound go into a shared link only when they play, and read back correctly; the cycle of 4ths visits all 12 keys; "stay in this area" finds G Mixolydian's E shape where D Dorian's C shape was; the jazz names describe exactly the scale's pitches.
- **Drone:** the root in the right register for every key, the fifth only when asked, safe reading of saved settings, and a room sound that fades to silence.
- **Fret ranges:** the five ranges in order, never past the end of the neck, 12 frets on phones by default, and older saved settings moved over correctly.
- **Play scale on the neck:** the chosen shape where it fits in the visible frets, nearest the nut, played up and back down with the top note once.
- **Fretboard trainer:** every spot of a note within the frets and shapes, answers hidden until found (also from screen readers), wrong taps flagged, and a varied, repeatable choice of notes that never repeats one straight away.
- **Start here:** every suggestion is a real scale in a real CAGED shape, in the familiar place on the neck; minor pentatonic and blues boxes are numbered the usual way (E shape = box 1).
- **Drone tip:** names the scale's own 3rd and 7th in every language, and falls back to the general text when a scale has neither.
- **Same pitch:** exact-pitch rings, also outside the chosen shape, kept apart from the same note in other octaves.
- **Selection rules:** C Major start, a chord cleared on key change, positions kept, and the metronome bar's default.
- **Languages:** every interface text exists in all five languages, every scale is translated, German H/B and do-re-mi names are correct, step patterns use local symbols (German GT/HT, since G and H are note names), and a sweep over every language × note-name system × root × scale checks that no text comes out broken. Loading one language at a time gives exactly the same texts as the pages built ahead of time, English is there from the start, and a language asked for twice is downloaded once.

---

## Known limitations / ideas for later

- **Sound is synthesized, not recorded.** The notes are a synthesized pluck and the drone a synthesized pad or harmonium. There's no volume slider for the note sounds yet.
- **Favourites stay on one device.** There's no way yet to copy your list to another phone or computer.
- **The trainer doesn't keep scores between visits.** Session totals reset when you stop it or reload the page. It asks for scale notes only.
- **Play scale doesn't follow tempo changes mid-run.** Change the tempo, then press Play scale again.
- **6 or 7 strings in the custom-tuning editor.** The engine also handles 8-string tunings (and links with 4–8 strings work), but the editor only offers 6 and 7.
- **CAGED letters only in standard-type tunings** (including 7-string standard and Drop A). Other tunings show numbered positions.
- **Saved pictures use Latin-script fonts.** The ♯ and ♭ signs come from your system's font, so they can look slightly different from the rest of the text.
- **The home page's link preview is in English.** Scale pages have their title and description in their own language, but the home page's are written before the app knows the visitor's language. (Every page shares one page shell whose language tag says English; each page corrects it with a content-language tag and a one-line script.)
- **Search engines take time.** New pages typically appear in Google after days to weeks. Submitting the sitemap in Google Search Console (free) speeds this up.
- **Translations deserve a native speaker's read.** They were written with care and checked for correct music terms, but a native guitarist may still spot wording to polish.
