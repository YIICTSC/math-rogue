import type { Enemy } from '../types';
export const DEMON_NAMES=['魔王','真・魔王','スーパー魔王ハイグレードEXスペシャルエディションαオメガMAX'] as const;
export function demonName(phase=1){return DEMON_NAMES[Math.max(0,Math.min(2,phase-1))];}
export function canTransformEnemy(e:Pick<Enemy,'enemyType'|'phase'>){return e.enemyType==='THE_HEART'&&e.phase===1 || e.enemyType==='RPG_DEMON'&&(e.phase||1)<3;}
export function nextDemonPhase(e:Enemy){return e.enemyType==='RPG_DEMON'?Math.min(3,(e.phase||1)+1):2;}
