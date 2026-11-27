/** Light/dark theme handling. Dark is the default; "auto" follows the device's light or dark setting. */

export type Theme = "dark" | "light" | "auto";

export const THEME_STORAGE_KEY = "gse-theme";

const LIGHT_QUERY = "(prefers-color-scheme: light)";

/** Inline script (runs before paint) that applies the saved theme. */
export const THEME_INIT_SCRIPT = `(function(){try{var t=localStorage.getItem("${THEME_STORAGE_KEY}");var d=document.documentElement;var l=t==="light"||(t==="auto"&&matchMedia("${LIGHT_QUERY}").matches);d.classList.toggle("dark",!l);d.style.colorScheme=l?"light":"dark"}catch(e){}})()`;

/** The theme chosen in Settings (not saved yet = dark). */
export function getThemeChoice(): Theme {
  try {
    const saved = localStorage.getItem(THEME_STORAGE_KEY);
    return saved === "light" || saved === "auto" ? saved : "dark";
  } catch {
    return "dark";
  }
}

function resolve(theme: Theme): "dark" | "light" {
  if (theme !== "auto") return theme;
  return window.matchMedia(LIGHT_QUERY).matches ? "light" : "dark";
}

export function applyTheme(theme: Theme): void {
  const root = document.documentElement;
  const shown = resolve(theme);
  root.classList.toggle("dark", shown === "dark");
  root.style.colorScheme = shown;
  try {
    localStorage.setItem(THEME_STORAGE_KEY, theme);
  } catch {
    // Storage may be unavailable (private mode); the theme still applies for this visit.
  }
}

/** While "auto" is chosen, switch along when the device switches between light and dark. Returns the clean-up. */
export function followDeviceTheme(): () => void {
  const query = window.matchMedia(LIGHT_QUERY);
  const onChange = () => {
    if (getThemeChoice() === "auto") applyTheme("auto");
  };
  query.addEventListener("change", onChange);
  return () => query.removeEventListener("change", onChange);
}
