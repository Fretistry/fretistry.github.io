/** Light/dark theme handling. Dark is the default. */

export type Theme = "dark" | "light";

export const THEME_STORAGE_KEY = "gse-theme";

/** Inline script (runs before paint) that applies the saved theme. */
export const THEME_INIT_SCRIPT = `(function(){try{var t=localStorage.getItem("${THEME_STORAGE_KEY}");var d=document.documentElement;if(t==="light"){d.classList.remove("dark");d.style.colorScheme="light"}else{d.classList.add("dark");d.style.colorScheme="dark"}}catch(e){}})()`;

export function getCurrentTheme(): Theme {
  if (typeof document === "undefined") return "dark";
  return document.documentElement.classList.contains("dark") ? "dark" : "light";
}

export function applyTheme(theme: Theme): void {
  const root = document.documentElement;
  root.classList.toggle("dark", theme === "dark");
  root.style.colorScheme = theme;
  try {
    localStorage.setItem(THEME_STORAGE_KEY, theme);
  } catch {
    // Storage may be unavailable (private mode); the theme still applies for this visit.
  }
}
