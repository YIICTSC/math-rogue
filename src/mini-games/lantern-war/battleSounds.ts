import type {AttackEffectKey,StatusEffectKey} from '../../types';
import type {CombatEvent,Weapon} from './types';
/** Match the existing canvas slash, impact and magic-ring effects. */
export function battleSound(event:CombatEvent,weapon:Weapon):{attack:AttackEffectKey}|{status:StatusEffectKey}{
 if(event.heal)return {status:'heal'};
 if(event.damage<=0)return {status:event.name.includes('防御')||event.name.includes('守護')?'block':'buff'};
 if(event.crit)return {attack:'critical'};
 return {attack:weapon==='magic'||weapon==='staff'?'flash':weapon==='axe'||weapon==='lance'?'impact':weapon==='bow'?'projectile':'slash'};
}
