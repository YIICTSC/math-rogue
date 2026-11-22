import {
  AFFIXES,
  MASTERWORKS,
  RARITIES,
  SLOT_NAMES,
  WEAPONS,
  type Affix,
  type Masterwork,
  type Rarity,
  type Slot,
  type Text,
  type Weapon,
} from './content';
import { gearLabel, maxFocus, maxHp, nextRandom, note, type Adventure, type Gear } from './state';
import { dayAt } from './world';

export const SLOT_IDS: readonly Slot[] = ['weapon', 'coat', 'charm'];
const RARITY_IDS: Rarity[] = ['common', 'fine', 'rare', 'relic'];
const AFFIX_IDS = Object.keys(AFFIXES) as Affix[];
const WEAPON_IDS = Object.keys(WEAPONS) as Weapon[];

export function gearName(gear: Gear): Text {
  if (gear.masterwork) return MASTERWORKS[gear.masterwork].name;
  const base: Text =
    gear.slot === 'weapon' && gear.weapon
      ? WEAPONS[gear.weapon].name
      : gear.slot === 'coat'
        ? ['旅装の外套', 'Traveler’s Coat']
        : ['旅路の護符', 'Traveler’s Charm'];
  return gearLabel(gear, base, gear.affix ? AFFIXES[gear.affix].name : undefined);
}
export function gearType(gear: Gear): Text {
  const slot = SLOT_NAMES[gear.slot],
    rarity = RARITIES[gear.rarity];
  return [slot[0] + ' · ' + rarity[0], slot[1] + ' · ' + rarity[1]];
}
export function gearValue(gear: Gear) {
  return 5 + gear.power * 3 + RARITY_IDS.indexOf(gear.rarity) * 5;
}
export function forgeGear(
  s: Adventure,
  depth: number,
  minimum: number,
  forcedSlot?: Slot,
  specification?: { weapon?: Weapon; affix?: Affix; masterwork?: Masterwork },
) {
  const roll = nextRandom(s, 100);
  const rarity = Math.max(minimum, roll < 3 ? 3 : roll < 14 ? 2 : roll < 43 ? 1 : 0);
  const slot = forcedSlot ?? SLOT_IDS[nextRandom(s, SLOT_IDS.length)];
  const tier = Math.floor(Math.sqrt(Math.max(1, depth)) / 2);
  const gear: Gear = {
    id: 'gear-' + s.nextGear++,
    slot,
    rarity: RARITY_IDS[rarity],
    power: (slot === 'weapon' ? 2 : 1) + rarity + tier,
    found: dayAt(s.time),
    ...(slot === 'weapon' ? { weapon: specification?.weapon ?? WEAPON_IDS[nextRandom(s, WEAPON_IDS.length)] } : {}),
    ...(rarity > 0 ? { affix: specification?.affix ?? AFFIX_IDS[nextRandom(s, AFFIX_IDS.length)] } : {}),
    ...(specification?.masterwork ? { masterwork: specification.masterwork } : {}),
  };
  if (s.gear.length >= 120) {
    s.goods.ore += 1 + rarity;
    note(
      s,
      [
        '装備袋が満杯のため、新しい装備を鉱石に戻した。',
        'Your gear bag is full. The new item was salvaged into ore.',
      ],
      'risk',
    );
    return;
  }
  s.gear.unshift(gear);
  const name = gearName(gear);
  note(s, [`「${name[0]}」を手に入れた。`, `Found ${name[1]}.`], 'good');
}
export function adjustGearCaps(s: Adventure) {
  s.hp = Math.min(s.hp, maxHp(s));
  s.focus = Math.min(s.focus, maxFocus(s));
}
