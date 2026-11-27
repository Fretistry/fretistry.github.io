"use client";

import { useState } from "react";
import { Check, Languages, Moon, RectangleHorizontal, RectangleVertical, Settings, Smartphone, Sun, Volume2, VolumeX } from "lucide-react";
import { FretistryMark, FretistryWordmark } from "@/components/brand/fretistry-mark";
import { useI18n } from "@/components/i18n/i18n-provider";
import { MetronomeHeaderButton } from "@/components/metronome/metronome-control";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import type { ExplorerSettings } from "@/hooks/use-explorer-state";
import { LOCALES, defaultNamingFor, isLocale } from "@/lib/i18n";
import { scaleIndexPath } from "@/lib/pages";
import { BASE_PATH } from "@/lib/site";
import type { NoteNaming } from "@/lib/theory";
import { applyTheme, getCurrentTheme, type Theme } from "@/lib/theme";
import { cn } from "@/lib/utils";
import { ToolbarSwitch } from "./display-toolbar";
import { SegmentedControl } from "./segmented-control";

interface AppHeaderProps {
  soundEnabled: boolean;
  onSoundChange: (enabled: boolean) => void;
  settings: ExplorerSettings;
  onSettingsChange: (patch: Partial<ExplorerSettings>) => void;
  metronomeBarVisible: boolean;
  onToggleMetronomeBar: () => void;
}

export function AppHeader({
  soundEnabled,
  onSoundChange,
  settings,
  onSettingsChange,
  metronomeBarVisible,
  onToggleMetronomeBar,
}: AppHeaderProps) {
  return (
    <header className="sticky top-0 z-30 border-b border-border/60 bg-background/80 pt-[env(safe-area-inset-top)] backdrop-blur-xl">
      <div className="mx-auto flex h-14 max-w-[1600px] min-[1760px]:max-w-[112rem] items-center gap-3 px-[max(1rem,env(safe-area-inset-left))] sm:px-6">
        <div className="flex min-w-0 items-center gap-2.5">
          <FretistryMark className="size-8 drop-shadow-[0_0_14px_rgba(247,169,59,0.35)]" />
          {/* (the page's main heading is the scale's name, not the logo) */}
          <p className="min-w-0 truncate text-[17px]">
            <FretistryWordmark />
          </p>
        </div>
        <div className="ml-auto flex items-center gap-0.5 sm:gap-2">
          <MetronomeHeaderButton barVisible={metronomeBarVisible} onToggleBar={onToggleMetronomeBar} />
          <SoundToggle enabled={soundEnabled} onChange={onSoundChange} />
          <SettingsMenu settings={settings} onChange={onSettingsChange} />
        </div>
      </div>
    </header>
  );
}

function SoundToggle({ enabled, onChange }: { enabled: boolean; onChange: (enabled: boolean) => void }) {
  const { ui } = useI18n();
  const label = enabled ? ui.header.soundOff : ui.header.soundOn;
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button variant="ghost" size="icon" aria-label={label} aria-pressed={enabled} onClick={() => onChange(!enabled)}>
          {enabled ? <Volume2 /> : <VolumeX className="text-muted-foreground" />}
        </Button>
      </TooltipTrigger>
      <TooltipContent>{label}</TooltipContent>
    </Tooltip>
  );
}

function OptionButton({
  active,
  onClick,
  children,
  title,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
  title?: string;
}) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={active}
      title={title}
      onClick={onClick}
      className={cn(
        "flex w-full items-center justify-between gap-2 rounded-md px-2.5 py-1.5 text-left text-sm transition-colors outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
        active ? "bg-accent font-medium text-foreground" : "text-foreground/80 hover:bg-accent/60",
      )}
    >
      <span className="min-w-0">{children}</span>
      {active && <Check className="size-4 shrink-0 text-primary" />}
    </button>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return <p className="mb-1.5 text-[11px] font-medium tracking-wider text-muted-foreground uppercase">{children}</p>;
}

/**
 * All personal preferences in one place: language, note names, how the neck
 * is drawn (left-handed, direction, fret numbers, spacing) and the theme.
 * They are remembered on this device and never part of shared links.
 */
function SettingsMenu({ settings, onChange }: { settings: ExplorerSettings; onChange: (patch: Partial<ExplorerSettings>) => void }) {
  const { ui, locale, setLocale, naming, setNaming } = useI18n();
  const v = ui.view;
  const [theme, setTheme] = useState<Theme>(() => getCurrentTheme());
  const namings: { value: NoteNaming; label: string; title: string }[] = [
    { value: "letters", label: ui.settings.letters, title: ui.settings.lettersTitle },
    { value: "german", label: ui.settings.german, title: ui.settings.germanTitle },
    { value: "solfege", label: ui.settings.solfege, title: ui.settings.solfegeTitle },
  ];
  const automatic = defaultNamingFor(locale);

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="sm" aria-label={ui.settings.button} className="gap-1.5 px-2.5">
          <Settings className="size-[18px]" />
          <span className="hidden md:inline">{ui.settings.button}</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align="end"
        className="grid max-h-[calc(100dvh-5rem)] w-[min(34rem,calc(100vw-1.5rem))] gap-x-6 gap-y-4 overflow-y-auto sm:grid-cols-2"
      >
        <div className="space-y-4">
        <section>
          <SectionTitle>{ui.settings.language}</SectionTitle>
          {/* one compact dropdown (room for more languages without a long list) */}
          <Select value={locale} onValueChange={(value) => isLocale(value) && setLocale(value)}>
            <SelectTrigger aria-label={ui.settings.language} className="h-9! w-full bg-card font-medium dark:bg-card">
              <Languages className="size-4 text-muted-foreground" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent position="popper">
              {LOCALES.map((l) => (
                <SelectItem key={l.code} value={l.code}>
                  <span lang={l.code}>{l.nativeName}</span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </section>
        <section>
          <SectionTitle>{ui.settings.noteNames}</SectionTitle>
          <div role="radiogroup" aria-label={ui.settings.noteNames} className="space-y-0.5">
            {namings.map((n) => (
              <OptionButton
                key={n.value}
                active={naming === n.value}
                title={n.title}
                onClick={() => setNaming(n.value === automatic ? null : n.value)}
              >
                <span className="font-mono text-[13px]">{n.label}</span>
                <span className="block text-xs font-normal text-muted-foreground">{n.title}</span>
              </OptionButton>
            ))}
          </div>
        </section>
        </div>
        <div className="space-y-4">
          <section>
            <SectionTitle>{ui.fretboard.section}</SectionTitle>
            <div className="space-y-3">
              <ToolbarSwitch
                id="toggle-left-handed"
                label={v.leftHanded}
                checked={settings.leftHanded}
                onCheckedChange={(leftHanded) => onChange({ leftHanded })}
              />
              <div>
                <p className="mb-1.5 text-sm text-foreground/85">{v.direction}</p>
                <SegmentedControl
                  ariaLabel={v.direction}
                  value={settings.orientation}
                  onChange={(orientation) => onChange({ orientation })}
                  className="w-full"
                  options={[
                    { value: "auto", label: <><Smartphone className="size-3.5" /> {v.auto}</>, title: v.autoTitle },
                    { value: "horizontal", label: <><RectangleHorizontal className="size-3.5" /> {v.across}</>, title: v.acrossTitle },
                    { value: "vertical", label: <><RectangleVertical className="size-3.5" /> {v.down}</>, title: v.downTitle },
                  ]}
                />
              </div>
              <ToolbarSwitch
                id="toggle-fret-numbers"
                label={v.fretNumbers}
                checked={settings.showFretNumbers}
                onCheckedChange={(showFretNumbers) => onChange({ showFretNumbers })}
              />
              <ToolbarSwitch
                id="toggle-even-spacing"
                label={v.evenSpacing}
                checked={settings.spacing === "even"}
                onCheckedChange={(even) => onChange({ spacing: even ? "even" : "realistic" })}
              />
            </div>
          </section>
          <section>
            <SectionTitle>{ui.settings.theme}</SectionTitle>
            <SegmentedControl
              ariaLabel={ui.settings.theme}
              value={theme}
              onChange={(next) => {
                applyTheme(next);
                setTheme(next);
              }}
              className="w-full"
              options={[
                { value: "dark", label: <><Moon className="size-3.5" /> {ui.settings.dark}</> },
                { value: "light", label: <><Sun className="size-3.5" /> {ui.settings.light}</> },
              ]}
            />
          </section>
          <div className="space-y-1.5 text-xs text-muted-foreground">
            <p>{ui.settings.note}</p>
            {/* worth knowing, but easy to miss: it works offline, and every scale in every key has its own page */}
            <p>{ui.settings.offline}</p>
            <p>
              <a href={`${BASE_PATH}${scaleIndexPath(locale)}`} className="font-medium text-foreground underline underline-offset-2 hover:text-primary">
                {ui.seo.allScales}
              </a>
            </p>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
