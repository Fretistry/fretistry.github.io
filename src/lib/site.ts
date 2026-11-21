/** Site-wide constants used by metadata, the web-app manifest and sharing. */

export const SITE_NAME = "Fretistry";

export const SITE_TITLE = "Fretistry — guitar scales, chords & positions";

export const SITE_DESCRIPTION =
  "Explore guitar scales across all 24 frets, see the chords in every key, learn box shapes and CAGED positions — with the theory explained. Free in your browser.";

/**
 * Public address of the site, used to build absolute links for social-media
 * previews. Set NEXT_PUBLIC_SITE_URL when deploying (e.g. https://fretistry.com).
 */
export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

/** Sub-path when hosted below a domain root (e.g. "/fretistry" on GitHub Pages). */
export const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

export const THEME_COLOR = "#121318";

/** Creator credit (footer, page metadata). */
export const CREATOR = "Bart Vangerven";
