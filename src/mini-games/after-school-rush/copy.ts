import type { LanguageMode } from '../../types';
import type { Copy, Prop } from './rules';
import readingData from './originals/readings.json';
import type { Local } from './originals/model';

const readings: Record<string, string> = readingData;
export const translate = (mode: LanguageMode, copy: Copy) => copy[mode === 'ENGLISH' ? 1 : mode === 'HIRAGANA' ? 2 : 0];

export const PROP_NAMES: Record<Prop, Copy> = {
  'drumstick': ['チキン', 'Chicken', 'チキン'],
  'ghost-cat': ['おばけ猫', 'Ghost cat', 'おばけねこ'],
  'mimic': ['ミミック', 'Mimic', 'ミミック'],
  'raspberry': ['ラズベリー', 'Raspberry', 'ラズベリー'],
  'crystal': ['結晶', 'Crystal', 'けっしょう'],
  'coin': ['コイン', 'Coin', 'コイン'],
  'egg': ['卵', 'Egg', 'たまご'],
  'slime': ['スライム', 'Slime', 'スライム'],
  'wind': ['風', 'Wind', 'かぜ'],
  'hourglass': ['砂時計', 'Hourglass', 'すなどけい'],
  'target': ['印', 'Marker', 'しるし'],
  'orange': ['オレンジ', 'Orange', 'オレンジ'],
  'books': ['本', 'Books', 'ほん'],
  'shield': ['盾', 'Shield', 'たて'],
  'gem': ['宝石', 'Gem', 'ほうせき'],
};

export function gameText(mode: LanguageMode, copy: Local) {
  return mode === 'ENGLISH' ? copy[1] : mode === 'HIRAGANA' ? copy[2] ?? readings[copy[0]] ?? copy[0] : copy[0];
}
