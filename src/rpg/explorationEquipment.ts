import type { Adventurer, World } from './engine';
import { TOOL_RANK, type ToolKind, type ToolTier } from './voxelCatalog';

export const POTIONS={
  air_draught:{seconds:90,copy:['水中で息が減らなくなる','Stops breath loss underwater','すいちゅうでいきがへらなくなる']},
  stride_draught:{seconds:75,copy:['探索中の移動が速くなる','Increases travel speed','たんさくちゅうのいどうがはやくなる']},
  miner_draught:{seconds:90,copy:['採掘エネルギーの消費を抑える','Reduces mining energy cost','さいくつエネルギーをせつやくする']},
} as const;
export type ExplorationPotion=keyof typeof POTIONS;
export const IMPRINTS={
  sharpness:['切れ味','Sharp edge','きれあじ'],
  endurance:['長持ち','Long life','ながもち'],
  fortune:['幸運','Fortune','こううん'],
  tide:['水中作業','Underwater work','すいちゅうさぎょう'],
} as const;
export type ToolImprint=keyof typeof IMPRINTS;
export const WORKSHOP_TOOLS=['pickaxe','axe','shovel'] as const;

export function potionSeconds(w:World,p:Adventurer,item:ExplorationPotion) {
  if (w.gameMode!=='COOP') return 0;
  return Math.max(0,(p.life?.potionUntil?.[item]??0)-w.life.time);
}

export function toolLimit(p:Adventurer,tool:ToolKind,tier:ToolTier) {
  const max=[48,72,105,144][TOOL_RANK.indexOf(tier)] ?? 0;
  return p.life?.toolImprints?.[tool]==='endurance' ? Math.round(max*1.5) : max;
}

export function wearTool(p:Adventurer,tool:ToolKind,tier:ToolTier|undefined) {
  if (!p.life || !tier) return;
  const wear=p.life.toolWear??={};
  wear[tool]=Math.min(toolLimit(p,tool,tier),(wear[tool]??0)+1);
}

export function restoreEquipment(w:World,p:Adventurer) {
  const life=p.life;
  if (!life) return;
  if (life.toolImprints) life.toolImprints=Object.fromEntries(Object.entries(life.toolImprints).filter(([tool,id])=>
    WORKSHOP_TOOLS.some(kind=>kind===tool)&&Object.hasOwn(IMPRINTS,id)));
  if (life.toolWear) life.toolWear=Object.fromEntries(Object.entries(life.toolWear).filter(([tool,count])=>
    WORKSHOP_TOOLS.some(kind=>kind===tool)&&Number.isSafeInteger(count)&&count>=0&&count<=216));
  if (life.potionUntil) life.potionUntil=Object.fromEntries(Object.entries(life.potionUntil).filter(([id,until])=>
    Object.hasOwn(POTIONS,id)&&Number.isFinite(until)&&until>w.life.time&&until<=w.life.time+90));
  if (life.imprintStudy && (!Number.isSafeInteger(life.imprintStudy)||life.imprintStudy<0)) life.imprintStudy=0;
}
