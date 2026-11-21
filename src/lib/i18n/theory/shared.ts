import type { ScaleDefinition } from "@/lib/theory";

/** Localized names and descriptions of one scale. Missing entries fall back to English. */
export interface ScaleText {
  name: string;
  fullName?: string;
  modeName?: string;
  character: string;
  usage: string;
}

export type ScaleTexts = Partial<Record<string, ScaleText>>;

export function scaleTexts(map: ScaleTexts) {
  return {
    name: (s: ScaleDefinition) => map[s.id]?.name ?? s.name,
    fullName: (s: ScaleDefinition) => map[s.id]?.fullName ?? map[s.id]?.name ?? s.fullName ?? s.name,
    modeName: (s: ScaleDefinition | undefined, fallback: string) =>
      (s && (map[s.id]?.modeName ?? map[s.id]?.name)) ?? fallback,
    character: (s: ScaleDefinition) => map[s.id]?.character ?? s.character,
    usage: (s: ScaleDefinition) => map[s.id]?.usage ?? s.usage,
  };
}

export const lowerFirst = (text: string) => text.charAt(0).toLowerCase() + text.slice(1);
export const upperFirst = (text: string) => text.charAt(0).toUpperCase() + text.slice(1);
