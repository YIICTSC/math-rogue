import type {AttackEffectKey} from '../../types';
import {PERSONAL_TECHNIQUES,SHARED_TECHNIQUES} from './techniques';
import type {CombatEvent,Weapon} from './types';

export function eventReaction(event:CombatEvent){
 if(event.damage>0)return 'hurt';
 if(event.heal||event.damage<0)return 'heal';
 return event.name.includes('行動中断')?'neutral':'buff';
}
/** Use the same four-frame strips as Learning Rogue, including its elemental arts. */
export function battleEffect(event:CombatEvent,weapon:Weapon):AttackEffectKey{
 const reaction=eventReaction(event);
 if(reaction==='heal')return 'drain';
 if(reaction==='buff')return /守|防|庇/.test(event.name)?'flash':'plant';
 if(reaction==='neutral')return 'soundwave';
 const effect=(PERSONAL_TECHNIQUES[event.actorHero]||[]).find(t=>t.name===event.name)?.effect
  ||Object.values(SHARED_TECHNIQUES).find(t=>t?.name===event.name)?.effect;
 if(effect==='burn'||/炎|火|フレア|ブレイズ/.test(event.name))return 'fire';
 if(/雷|電|ボルト/.test(event.name))return 'lightning';
 if(/風|ウィンド|ブリーズ|ガスト/.test(event.name))return 'wind';
 if(/葉|種|リーフ|ヴァイン/.test(event.name))return 'plant';
 if(effect==='drain')return 'drain';
 if(effect==='flurry')return 'multihit';
 if(effect==='stun')return 'lightning';
 if(effect==='sweep'||event.name==='横列掃討')return 'shockwave';
 if(effect==='execute')return 'finisher';
 if(effect==='pierce')return weapon==='magic'?'laser':'projectile';
 if(effect==='sunder'||effect==='assault')return 'impact';
 if(effect==='weaken')return 'poison';
 if(weapon==='magic'||weapon==='staff')return event.skill?'finisher':'flash';
 return weapon==='bow'?'projectile':weapon==='axe'||weapon==='lance'?'impact':'slash';
}
