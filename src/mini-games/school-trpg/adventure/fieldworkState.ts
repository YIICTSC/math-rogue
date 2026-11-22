import { BIOMES, type Biome } from './content';
import { addressKey, type Address } from './world';

export const CIRCUIT_MODES = ['channel', 'isolate'] as const;
export type CircuitMode = (typeof CIRCUIT_MODES)[number];
export type CircuitRecord = { mode: CircuitMode | null };
export const ARCHIVE_CHOICES = ['publish', 'return'] as const;
export type ArchiveChoice = (typeof ARCHIVE_CHOICES)[number];
export type HistoryRecord = { place: Address; chapters: number; filed?: ArchiveChoice };

export type Fieldwork = {
  standing: Partial<Record<Biome, number>>;
  lastFavor: Partial<Record<Biome, number>>;
  circuits: Record<string, CircuitRecord>;
  histories: Record<string, HistoryRecord>;
};

export const newFieldwork = (): Fieldwork => ({ standing: {}, lastFavor: {}, circuits: {}, histories: {} });

const integer = (n: unknown, lo: number, hi: number) =>
  typeof n === 'number' && Number.isSafeInteger(n) && n >= lo && n <= hi;
const record = (value: unknown) => Boolean(value && typeof value === 'object' && !Array.isArray(value));

export function validFieldwork(survey: Fieldwork, day: number, validAddress: (p: Address) => boolean) {
  if (!survey || ![survey.standing, survey.lastFavor, survey.circuits, survey.histories].every(record)) return false;
  return Object.entries(survey.standing).every(([id, value]) => Object.hasOwn(BIOMES, id) && integer(value, -8, 12)) &&
    Object.entries(survey.lastFavor).every(([id, value]) => Object.hasOwn(BIOMES, id) && integer(value, 1, day)) &&
    Object.entries(survey.circuits).every(([key, value]) => key.length <= 90 && value &&
      (value.mode === null || CIRCUIT_MODES.includes(value.mode))) &&
    Object.entries(survey.histories).every(([key, value]) => value && validAddress(value.place) &&
      key === addressKey(value.place) && integer(value.chapters, 1, 7) &&
      (value.filed === undefined || (value.chapters === 7 && ARCHIVE_CHOICES.includes(value.filed))));
}
