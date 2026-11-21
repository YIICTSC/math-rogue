import {
  SCHOOL_ADVENTURE_SAVE_KEY as KEY,
  SCHOOL_ADVENTURE_PENDING_KEY as PENDING,
} from '../schoolTrpgSave';
import {
  AFFIXES,
  CALLINGS,
  FOES,
  GOOD_IDS,
  IDEALS,
  ORIGINS,
  RARITIES,
  STAT_IDS,
  WEAPONS,
} from './content';
import { SLOT_IDS } from './inventory';
import { ADVENTURE_VERSION, PORTRAIT_IDS, type Adventure } from './state';
import { addressKey, hash, SIDE, type Address } from './world';

export const ADVENTURE_SLOTS = 8;

type RecordBook = {
  schema: 'school-adventure';
  serial: number;
  checksum: number;
  slots: Adventure[];
};
const integer = (value: number, min = 0, max = Number.MAX_SAFE_INTEGER) =>
  Number.isSafeInteger(value) && value >= min && value <= max;
const validAddress = (address: Address) =>
  address &&
  typeof address.world === 'string' &&
  address.world.length > 0 &&
  address.world.length <= 28 &&
  Number.isSafeInteger(address.x) &&
  Number.isSafeInteger(address.y);

function validSlot(slot: Adventure) {
  const c = slot?.character;
  if (
    !slot ||
    slot.version !== ADVENTURE_VERSION ||
    typeof slot.id !== 'string' ||
    !integer(slot.revision) ||
    !validAddress(slot.location) ||
    !validAddress(slot.homeGate) ||
    !c ||
    typeof c.name !== 'string' ||
    !PORTRAIT_IDS.includes(c.portrait) ||
    !Object.hasOwn(CALLINGS, c.calling) ||
    !Object.hasOwn(ORIGINS, c.origin) ||
    !Object.hasOwn(IDEALS, c.ideal) ||
    !c.stats ||
    !STAT_IDS.every((id) => integer(c.stats[id], 1, 12))
  )
    return false;
  if (
    ![
      slot.time,
      slot.xp,
      slot.talent,
      slot.hp,
      slot.focus,
      slot.gold,
      slot.nextGear,
      slot.rng,
    ].every((v) => integer(v)) ||
    !integer(slot.level, 1) ||
    !integer(slot.inspiration, 0, 5) ||
    !integer(slot.fatigue, 0, 9) ||
    !slot.goods ||
    !GOOD_IDS.every((good) => integer(slot.goods[good])) ||
    !Array.isArray(slot.gear) ||
    !slot.gear.every(
      (gear) =>
        gear &&
        SLOT_IDS.includes(gear.slot) &&
        Object.hasOwn(RARITIES, gear.rarity) &&
        integer(gear.power, 1) &&
        (!gear.affix || Object.hasOwn(AFFIXES, gear.affix)) &&
        (gear.slot !== 'weapon' || (gear.weapon && Object.hasOwn(WEAPONS, gear.weapon))),
    )
  )
    return false;
  if (
    !slot.gates ||
    !Object.values(slot.gates).every(validAddress) ||
    !slot.knownTowns ||
    !slot.knownTowns[addressKey(slot.location)] ||
    !slot.floors ||
    !slot.workshop ||
    !slot.friends ||
    !slot.deepest ||
    !slot.equipment ||
    !slot.exploredLandmarks ||
    !slot.townTales ||
    !slot.badges ||
    !slot.townWork ||
    !slot.counters ||
    !Array.isArray(slot.followers) ||
    !Array.isArray(slot.fulfilled) ||
    !Array.isArray(slot.goals) ||
    !Array.isArray(slot.journal)
  )
    return false;
  const d = slot.delve;
  if (!d) return d === null;
  const e = d.encounter;
  return (
    integer(d.floor, 1) &&
    integer(d.direction, 0, 3) &&
    integer(d.cell, 0, SIDE * SIDE - 1) &&
    integer(d.light, 0, 18) &&
    integer(d.threat) &&
    (e === null ||
      (integer(e.turn, 1) &&
        Array.isArray(e.enemies) &&
        e.enemies.length >= 1 &&
        e.enemies.every(
          (foe) =>
            integer(foe.template, 0, FOES.length - 1) && integer(foe.hp) && integer(foe.max, 1),
        )))
  );
}

function decode(raw: string | null): RecordBook | null {
  if (!raw) return null;
  try {
    const data = JSON.parse(raw) as RecordBook;
    if (
      data.schema !== 'school-adventure' ||
      !integer(data.serial) ||
      !Array.isArray(data.slots) ||
      data.slots.length > ADVENTURE_SLOTS ||
      hash(JSON.stringify(data.slots)) !== data.checksum ||
      !data.slots.every(validSlot)
    )
      return null;
    return data;
  } catch {
    return null;
  }
}

function read(storage: Storage) {
  const saved = decode(storage.getItem(KEY));
  const pending = decode(storage.getItem(PENDING));
  return pending && (!saved || pending.serial > saved.serial) ? pending : saved;
}

export function loadAdventures(): Adventure[] {
  if (typeof window === 'undefined') return [];
  try {
    return read(window.localStorage)?.slots ?? [];
  } catch {
    return [];
  }
}

function write(storage: Storage, slots: Adventure[], serial: number) {
  const book: RecordBook = {
    schema: 'school-adventure',
    serial,
    slots,
    checksum: hash(JSON.stringify(slots)),
  };
  const raw = JSON.stringify(book);
  storage.setItem(PENDING, raw);
  try {
    storage.setItem(KEY, raw);
  } catch {
    // The complete pending copy remains recoverable if the durable write fails.
    return;
  }
  storage.removeItem(PENDING);
}

export type SaveResult = 'saved' | 'changed' | 'full' | 'unavailable';
export function saveAdventure(slot: Adventure, expectedRevision: number | null): SaveResult {
  if (typeof window === 'undefined') return 'unavailable';
  try {
    const storage = window.localStorage;
    const book = read(storage);
    const slots = book?.slots ?? [];
    const previous = slots.find((entry) => entry.id === slot.id);
    if ((previous?.revision ?? null) !== expectedRevision) return 'changed';
    if (!previous && slots.length >= ADVENTURE_SLOTS) return 'full';
    if (!validSlot(slot)) return 'unavailable';
    write(
      storage,
      [slot, ...slots.filter((entry) => entry.id !== slot.id)],
      (book?.serial ?? 0) + 1,
    );
    return 'saved';
  } catch {
    return 'unavailable';
  }
}

export function deleteAdventure(id: string) {
  try {
    const storage = window.localStorage;
    const book = read(storage);
    if (!book) return true;
    write(
      storage,
      book.slots.filter((slot) => slot.id !== id),
      book.serial + 1,
    );
    return true;
  } catch {
    return false;
  }
}
