/**
 * When a key press counts as a keyboard shortcut (Space = metronome, ← → = key, …):
 * never while typing in a field or inside an open menu or dialog, and never with
 * Ctrl / ⌘ / Alt held (those belong to the browser).
 */
export function shortcutAllowed(e: KeyboardEvent): boolean {
  if (e.defaultPrevented || e.ctrlKey || e.metaKey || e.altKey) return false;
  const el = e.target;
  if (!(el instanceof HTMLElement)) return true;
  if (el.isContentEditable) return false;
  return !el.closest("input, textarea, select, [role=dialog], [role=listbox], [role=menu], [data-radix-popper-content-wrapper]");
}

/**
 * Space and the arrow keys also work buttons and button groups. When such a control has
 * keyboard focus (someone tabbed to it), the key is left to it; focus left behind by a mouse
 * click doesn't count, so Space still starts the metronome after clicking around.
 */
export function keyBelongsToFocus(e: KeyboardEvent): boolean {
  const el = e.target;
  if (!(el instanceof HTMLElement)) return false;
  const control = el.closest("button, a, [role=button], [role=radio], [role=tab], [role=switch], [role=slider], [role=checkbox], [role=combobox]");
  return control instanceof HTMLElement && control.matches(":focus-visible");
}

/** The root 5 half steps up: the next key in the cycle of 4ths (C → F → B♭ → E♭ …). */
export function nextInFourths<T>(roots: readonly T[], current: T): T {
  const i = roots.indexOf(current);
  return roots[(i + 5) % roots.length];
}

/** The root a number of half steps away (wrapping around the octave). */
export function stepRoot<T>(roots: readonly T[], current: T, halfSteps: number): T {
  const i = roots.indexOf(current);
  return roots[(((i + halfSteps) % roots.length) + roots.length) % roots.length];
}
