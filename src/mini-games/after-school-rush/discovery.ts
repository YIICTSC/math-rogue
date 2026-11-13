import { CATALOG, type Entry } from './catalog';
import type { Mode } from './engine';

export const DISCOVERY_KEY = 'learning-rogue-mini-rush-story-encounters-v1';
const keys = new Set(CATALOG.map(entry => entry.key));
const valid = (value: unknown): string[] => Array.isArray(value)
  ? [...new Set(value.filter((key): key is string => typeof key === 'string' && keys.has(key)))] : [];

export function readDiscovery(): string[] {
  try { return valid(JSON.parse(localStorage.getItem(DISCOVERY_KEY) || '[]')); }
  catch { return []; }
}

/** An encounter counts at PLAY, including a later miss; READY and other modes do not unlock it. */
export function recordEncounter(mode: Mode, entry: Entry, known: readonly string[]): string[] {
  if (mode.kind !== 'story' || mode.chapter !== entry.chapter || !keys.has(entry.key) || known.includes(entry.key)) return [...known];
  const next = valid([...readDiscovery(), ...known, entry.key]);
  try { localStorage.setItem(DISCOVERY_KEY, JSON.stringify(next)); } catch { /* Keep this session playable without storage. */ }
  return next;
}
