import { EnemyIntentType as Intent, type EnemyIntent } from '../types';
import { realmId, type RealmId } from './realmTerrain';

const bossPrefix='RPG_REALM_WARDEN:';
export const realmWardenType=(id:RealmId)=>bossPrefix+id;
export function realmWardenId(type:string) {
  if(!type.startsWith(bossPrefix))return;
  const id=type.slice(bossPrefix.length);
  return realmId(id)?id:undefined;
}

const tactics:Record<RealmId,readonly EnemyIntent[]>={
  embers:[{type:Intent.ATTACK_DEFEND,value:11,secondaryValue:13},{type:Intent.DEBUFF,value:0,secondaryValue:2,debuffType:'VULNERABLE'},
    {type:Intent.ATTACK,value:25},{type:Intent.DEFEND,value:16}],
  sky:[{type:Intent.ATTACK,value:15},{type:Intent.ATTACK_DEBUFF,value:10,secondaryValue:2,debuffType:'WEAK'},
    {type:Intent.PIERCE_ATTACK,value:17},{type:Intent.BUFF,value:0,secondaryValue:3}],
  geode:[{type:Intent.DEFEND,value:22},{type:Intent.BUFF,value:0,secondaryValue:4},
    {type:Intent.ATTACK_DEFEND,value:13,secondaryValue:13},{type:Intent.PIERCE_ATTACK,value:18}],
  echo:[{type:Intent.DEBUFF,value:0,secondaryValue:2,debuffType:'CONFUSED'},{type:Intent.ATTACK_DEBUFF,value:12,secondaryValue:2,debuffType:'WEAK'},
    {type:Intent.DEFEND,value:14},{type:Intent.ATTACK,value:21}],
  tidal:[{type:Intent.ATTACK_DEBUFF,value:9,secondaryValue:3,debuffType:'POISON'},{type:Intent.ATTACK_DEFEND,value:9,secondaryValue:18},
    {type:Intent.DEBUFF,value:0,secondaryValue:2,debuffType:'WEAK'},{type:Intent.ATTACK,value:19}],
};

export function realmWardenIntent(enemy:string,turn:number) {
  const id=realmWardenId(enemy);
  return id?{...tactics[id][Math.max(0,turn-1)%tactics[id].length]}:undefined;
}
