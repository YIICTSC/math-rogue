import palettes from './enemy-palettes.json';
/** Model families authored in Blender; variants keep the same appearance on the floor and in hand. */
export interface VisualItem { type: string; category: string; plus?: number; }
export type Gear = Partial<Record<'weapon'|'armor'|'ranged'|'accessory', VisualItem | null>>;
export function visualHash(value: string) {
  let h = 2166136261;
  for (const c of value) h = Math.imul(h ^ c.charCodeAt(0), 16777619);
  return h >>> 0;
}
export function itemModel(item: VisualItem): string {
  const t = item.type;
  if(/EXTINGUISHER/.test(t))return 'extinguisher';
  if(/WATCH/.test(t))return 'watch';
  if(/COMPASS/.test(t))return 'compass';
  if(/PROTRACTOR/.test(t))return 'protractor';
  if(/PICK/.test(t))return 'pickaxe';
  if(/GRASS/.test(t))return 'grass';
  if(/MEAT/.test(t))return 'meat';
  if(t==='BOMB')return 'bomb';
  if(/CHALK/.test(t))return 'chalk';
  if(/STONES|MARBLE/.test(t))return 'stone';
  if(/PLANE|CRANE/.test(t))return 'paper_plane';
  if(/LENS/.test(t))return 'magnifier';
  if(/WHISTLE/.test(t)&&item.category!=='WEAPON')return 'whistle';
  if(/FLOAT/.test(t))return 'float';
  if(/REPAIR/.test(t))return 'toolbox';
  if(/POT/.test(t))return 'pot';
  if(/SCALPEL|CUTTER|KNIFE/.test(t))return 'blade';
  if (/UMBRELLA|RAIN_WAND/.test(t) || item.category === 'STAFF') return 'umbrella';
  if (/PENCIL|PEN|INJECT|SCALPEL|POINTER|RAPIER/.test(t)) return 'pencil';
  if (/BROOM|MOP|POLISHER/.test(t)) return 'broom';
  if (/HAMMER|MACE|AXE|PICK/.test(t)) return 'hammer';
  if (/SHEARS|CUTTER|KNIFE|TONGS/.test(t)) return 'shears';
  if (/LADLE/.test(t)) return 'ladle';
  if (/TRIANGLE|PROTRACTOR|COMPASS/.test(t)) return 'triangle';
  if (/BAT|CLUB/.test(t)) return 'bat_item';
  if (item.category === 'WEAPON') return 'ruler';
  if (/RANDO|BACKPACK/.test(t)) return 'backpack';
  if (/HOOD/.test(t)) return 'hood';
  if (/HELMET|FIREFIGHTER/.test(t)) return 'helmet';
  if (/APRON|SMOCK/.test(t)) return 'apron';
  if (/COAT|CLOTHES|UNIFORM|TRACKSUIT|CARDIGAN|SUIT|VEST|HAKAMA|BREAKER/.test(t)) return 'coat';
  if (/CAPE|PONCHO|CURTAIN|TAILCOAT/.test(t)) return 'cape';
  if (/BADGE|NAME_TAG|MEDAL|CORSAGE|SASH/.test(t)) return 'badge';
  if (item.category === 'ARMOR') return 'shield';
  if (item.category === 'ACCESSORY' || /FLOAT|LENS/.test(t)) return 'ring';
  if (item.category === 'DECK_CARD' || /CARD|NOTEBOOK/.test(t)) return 'card';
  if (item.category === 'SCROLL') return 'scroll';
  if (item.category === 'FOOD' || /FOOD_|RICE|LUNCH/.test(t)) return 'rice';
  if (/GOLD|COIN/.test(t)) return 'coin';
  if (/KEY/.test(t)) return 'key';
  if (/BAG|POT|BOX|POUCH|REPAIR/.test(t)) return 'bag';
  if (/TRAP/.test(t)) return 'trap';
  if (item.category === 'RANGED') return /PAPER|PLANE/.test(t) ? 'scroll' : 'pencil';
  return 'bottle';
}
export function enemyModel(type = 'SLIME'): string {
  return ({SLIME:'slime',METAL:'metal_slime',DUST:'dust',GHOST:'ghost',FLOATING:'ghost',DRAIN:'drain',FIRE_SPIRIT:'fire',BAT:'bat',DRAGON:'dragon',MANDRAKE:'plant',GOLEM:'golem',NINJA:'ninja',THIEF:'thief',MAGE:'mage',SHOPKEEPER:'merchant',BOSS:'principal',MIMIC:'mimic',NOTEBOOK:'book_enemy',TEST_MONSTER:'test_enemy',BALL:'ball_enemy',CLOCK:'clock',SPLIT:'paper_enemy',SEAL:'seal_enemy',SWALLOW:'pencil_case_enemy',ERASE:'eraser_enemy',RICE:'rice_enemy',EVOLVE:'school_bully',MONITOR:'teacher',DETENTION:'detention_ghost',UMBRELLA:'umbrella_enemy',MUD:'mud_boot',SPROUT:'sprout'} as Record<string,string>)[type] || 'ghost';
}
export const ENEMY_RANK_COLORS = ['#438fd9','#dd5750','#9867d6','#edb94c','#38bb83','#824b49'] as const;
export function enemyPalette(base:string) {
  return (palettes as Record<string,string[]>)[base] || palettes.ghost;
}
export function enemyVisualRank(enemy:{visualTier?:number;schoolRank?:number;enemyType?:string;maxHp?:number}) {
  const baseHp:Record<string,number>={SLIME:10,BAT:8,MANDRAKE:20,GHOST:15,THIEF:20,DRAIN:30,NOTEBOOK:18,DUST:16,BALL:22,NINJA:25,MIMIC:42,GOLEM:60,FIRE_SPIRIT:30,MAGE:30,CLOCK:36,DRAGON:50,METAL:4};
  const factor=enemy.enemyType==='DRAGON'?6:enemy.enemyType==='GOLEM'?4.5:3;
  const originalHp=(enemy.maxHp||0)-Math.max(0,(enemy.schoolRank||1)-1)*12;
  const inferred=enemy.enemyType==='METAL'?1+Math.max(0,originalHp-4):1+Math.floor(Math.max(0,(originalHp-(baseHp[enemy.enemyType||'']||0))/factor-1)/5);
  if(['BOSS','SHOPKEEPER'].includes(enemy.enemyType||''))return 1;
  return Math.max(1,Math.min(4,Math.floor(enemy.visualTier||inferred)))+Math.max(0,Math.floor(enemy.schoolRank||1)-1);
}
export function gearSignature(gear: Gear = {}) {
  return ['weapon','armor','ranged','accessory'].map(slot => {
    const item = gear[slot as keyof Gear]; return item ? `${slot}:${item.type}:${item.plus || 0}` : slot;
  }).join('|');
}
