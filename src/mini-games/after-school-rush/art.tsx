import type { Prop } from './rules';

const ART = import.meta.glob<string>('./art/*.png', { eager: true, query: '?url', import: 'default' });
export const CHOICE_KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0', 'Q', 'W'];
export type Localize = (ja: string, en: string, hira: string) => string;

type SetArt = 'bell' | 'glider' | 'toast' | 'satchel' | 'sneaker' | 'cylinder' | 'notebook' | 'umbrella'
  | 'mic' | 'cone' | 'lantern' | 'key' | 'pan' | 'plate' | 'bookcase' | 'door' | 'rope' | 'volleyball'
  | 'podium' | 'kiosk' | 'dial' | 'board' | 'hoop' | 'windsock' | 'hook' | 'desk' | 'table' | 'mirror'
  | 'train' | 'rug' | 'splash' | 'vase' | 'truck' | 'jug' | 'stairs' | 'bread' | 'sign' | 'flask' | 'pin'
  | 'mask' | 'alembic' | 'pipette' | 'box' | 'block' | 'ship-lantern';
export type ArtName = Prop | SetArt;

export function spriteUrl(name: ArtName) {
  return ART[`./art/${name}.png`];
}

export function Sprite({ name, className = '' }: { name: ArtName; className?: string }) {
  return <img className={`asr-sprite ${className}`} src={spriteUrl(name)} alt="" draggable={false} />;
}
