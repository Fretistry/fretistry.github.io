"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { DronePlayer, parseDroneLink, parseDroneSettings, type DroneSettings } from "@/lib/audio/drone";

const STORAGE_KEY = "fretistry-drone";

function loadSettings(): DroneSettings {
  let saved: DroneSettings;
  try {
    saved = parseDroneSettings(JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "{}"));
  } catch {
    saved = parseDroneSettings({});
  }
  // a shared lesson link can choose the drone's sound ("?drone=pad5"); it still starts with ▶
  try {
    return { ...saved, ...parseDroneLink(new URLSearchParams(window.location.search).get("drone")) };
  } catch {
    return saved;
  }
}

/** Whether the drone plays right now and with which sound (for the Share menu's lesson link). */
export const droneStatus: { running: boolean; settings: DroneSettings } = { running: false, settings: parseDroneSettings({}) };

/**
 * Drone on/off and its settings (remembered on this device). While it plays it
 * follows the key: a new root crossfades to the new note. It stops when the
 * component using it goes away (the bar is closed).
 */
export function useDrone(rootPitchClass: number) {
  const [settings, setSettings] = useState<DroneSettings>(loadSettings);
  const [running, setRunning] = useState(false);
  const player = useRef<DronePlayer | null>(null);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    } catch {
      // Not remembered — fine.
    }
  }, [settings]);

  // Start, or follow a new root / sound / fifth while playing.
  useEffect(() => {
    if (!running) return;
    player.current ??= new DronePlayer();
    player.current.play(rootPitchClass, settings);
  }, [running, rootPitchClass, settings]);

  useEffect(() => () => player.current?.stop(), []);

  // What the drone is doing, for lesson links (read when you share, so no re-render is needed).
  useEffect(() => {
    droneStatus.running = running;
    droneStatus.settings = settings;
    return () => {
      droneStatus.running = false;
    };
  }, [running, settings]);

  const update = useCallback((patch: Partial<DroneSettings>) => setSettings((s) => ({ ...s, ...patch })), []);

  // Started right in the click (phones only allow sound to start from a tap).
  const toggle = useCallback(() => {
    if (running) {
      player.current?.stop();
      setRunning(false);
    } else {
      player.current ??= new DronePlayer();
      player.current.play(rootPitchClass, settings);
      setRunning(true);
    }
  }, [running, rootPitchClass, settings]);

  return { settings, update, running, toggle };
}
