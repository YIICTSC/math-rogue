import { useSyncExternalStore } from "react";
export interface RpgPreferences {
  mapView:"2D"|"3D";
  mapQuality:"auto"|"high"|"low";
  control: "dpad" | "stick";
  speech: boolean;
  reducedMotion: boolean;
  contrast: boolean;
  largeText: boolean;
  largeControls: boolean;
  hand: "left" | "right";
  labels: boolean;
  tapMove: boolean;
  zoom: number;
  repeat: number;
  deadZone: number;
  twoD: boolean;
}
const KEY = "rpg-preferences-v1",
  defaults: RpgPreferences = {
    mapView:"2D",mapQuality:"auto",
    control: "stick",
    speech: true,
    reducedMotion: false,
    contrast: false,
    largeText: false,
    largeControls: false,
    hand: "left",
    labels: true,
    tapMove: true,
    zoom: 1,
    repeat: 160,
    deadZone: 0.22,
    twoD: false,
  };
let current: RpgPreferences | undefined;
const listeners = new Set<() => void>();
export function rpgPreferences() {
  if (current) return current;
  let raw: Partial<RpgPreferences> & { controlDefaultVersion?: number } = {};
  try {
    raw = JSON.parse(localStorage.getItem(KEY) || "{}") || {};
  } catch {}
  current = {
    ...defaults,
    reducedMotion:
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches,
  };
  for (const key of [
    "speech",
    "reducedMotion",
    "contrast",
    "largeText",
    "largeControls",
    "labels",
    "tapMove",
    "twoD",
  ] as const)
    if (typeof raw[key] === "boolean") current[key] = raw[key]!;
  if (["2D","3D"].includes(raw.mapView!))current.mapView=raw.mapView!;
  if (["auto","high","low"].includes(raw.mapQuality!))current.mapQuality=raw.mapQuality!;
  if (raw.controlDefaultVersion === 2 && ["dpad", "stick"].includes(raw.control!)) current.control = raw.control!;
  if (["left", "right"].includes(raw.hand!)) current.hand = raw.hand!;
  if ([1, 1.25, 1.5].includes(raw.zoom!)) current.zoom = raw.zoom!;
  if ([120, 160, 240].includes(raw.repeat!)) current.repeat = raw.repeat!;
  if ([0.15, 0.22, 0.35].includes(raw.deadZone!))
    current.deadZone = raw.deadZone!;
  try { localStorage.setItem(KEY, JSON.stringify({ ...current, controlDefaultVersion: 2 })); } catch {}
  return current;
}
export function updateRpgPreferences(patch: Partial<RpgPreferences>) {
  current = { ...rpgPreferences(), ...patch };
  try {
    localStorage.setItem(KEY, JSON.stringify({ ...current, controlDefaultVersion: 2 }));
  } catch {}
  for (const notify of listeners) notify();
}
export const useRpgPreferences = () =>
  useSyncExternalStore(
    (fn) => {
      listeners.add(fn);
      return () => listeners.delete(fn);
    },
    rpgPreferences,
    () => defaults,
  );
