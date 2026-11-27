import type { World } from '../engine';
import { DAY_SECONDS } from '../town/catalog';
import { animalById } from './catalog';
import type { FarmAnimal, FarmPlayer } from './model';

export type GrowthStage = 'young' | 'growing' | 'adult';
export const RARE_COATS = ['cow','sheep','pig'] as const;
export const hasRareCoat = (kind:string) => RARE_COATS.some(species=>species===kind);

export function ranchStage(w:World, animal:FarmAnimal):GrowthStage {
  const maturity=animalById(animal.kind)?.days ?? 0;
  const day=w.town?.day ?? 0;
  if (day-animal.born>=maturity) return 'adult';
  const birth=animal.bornAt ?? animal.born*DAY_SECONDS;
  const age=Math.max(0,(w.town?.elapsed ?? day*DAY_SECONDS)-birth);
  const duration=Math.max(1,(animal.born+maturity)*DAY_SECONDS-birth);
  return age>=duration*.52 ? 'growing' : 'young';
}

export function animalArtId(kind:string, stage:GrowthStage='adult', variant?:'rare') {
  const growth=stage==='adult' ? '' : `-${stage}`;
  return `${kind}${growth}${variant==='rare'&&hasRareCoat(kind)?'-rare':''}`;
}

export function ranchArt(w:World, animal:FarmAnimal) {
  return animalArtId(animal.kind,ranchStage(w,animal),animal.variant);
}

export function ranchPosition(w:World, farm:FarmPlayer, animal:FarmAnimal, index:number) {
  if (farm.x===undefined || farm.y===undefined) return null;
  const stage=ranchStage(w,animal);
  const adult=stage==='adult';
  const parent=animal.parentId && !adult ? farm.animals.findIndex(other=>other.id===animal.parentId) : -1;
  const slot=parent>=0?parent:index;
  const phase=w.life.time*.51+slot*2.1;
  const drift=.17*Math.sin(phase);
  const side=slot%6===5?-1:1;
  return {
    x:farm.x+slot%6+.5+drift+(parent>=0?side*.46:0),
    z:farm.y+(slot<6?0:5)+.5+.10*Math.cos(phase)+(parent>=0?.24:0),
    size:adult?20:stage==='growing'?17:13,
    facing:Math.cos(phase)>0 ? 'right' as const : 'left' as const,
  };
}
