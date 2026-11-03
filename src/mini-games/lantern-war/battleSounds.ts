import type {AttackEffectKey,StatusEffectKey} from '../../types';
import type {CombatEvent,Weapon} from './types';
import {battleEffect,eventReaction} from './battleEffects';
/** Keep sprite impacts and their shared Learning Rogue sounds in sync. */
export function battleSound(event:CombatEvent,weapon:Weapon):{attack:AttackEffectKey}|{status:StatusEffectKey}{
 if(eventReaction(event)==='heal')return {status:'heal'};
 if(event.damage<=0)return {status:event.name.includes('防御')||event.name.includes('守護')?'block':'buff'};
 if(event.crit)return {attack:'critical'};
 return {attack:battleEffect(event,weapon)};
}
