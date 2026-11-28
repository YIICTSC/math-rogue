import { DoorOpen, Gem } from 'lucide-react';
import type { LanguageMode } from '../types';
import type { Adventurer, World } from './engine';
import { sandboxText } from './MachineryInspector';
import { REALM_ARENA, REALM_GATE } from './realmTerrain';
import { realmBattleReach, realmName, realmReturnReach, type RealmAction } from './realms';

export function RealmDock({world,player,languageMode,send}:{world:World;player:Adventurer;languageMode?:LanguageMode;send:(action:RealmAction)=>void}) {
  const id=world.dimensionId;
  if(!id)return null;
  const lang=languageMode??'JAPANESE';
  const L=(ja:string,en:string,hi:string)=>sandboxText(lang,ja,en,hi);
  const returnNearby=realmReturnReach(world,player);
  const claimNearby=world.sites[0]?.cleared&&!player.voxelDiscoveries?.includes(`realm-cache-${id}`)&&
    Math.hypot(player.x-REALM_ARENA.x,player.y-REALM_ARENA.z)<=2&&realmBattleReach(world,player,world.sites[0]);
  return <div className="rpg-realm-dock" aria-label={L('異世界','Realm','いせかい')}>
    <strong>{realmName(id,lang)}</strong>
    {returnNearby ? <button onClick={()=>send({type:'voxel-dimension',command:'return'})}>
      <DoorOpen size={16}/> {L('地上へ戻る','Return to the surface','ちじょうへもどる')}</button>
      : <small>{L('帰還門','Return gate','きかんもん')} · {Math.round(Math.hypot(player.x-REALM_GATE.x,player.y-REALM_GATE.z))} m</small>}
    {claimNearby&&<button onClick={()=>send({type:'voxel-dimension',command:'reward'})}>
      <Gem size={16}/> {L('守護者の宝を受け取る','Claim the guardian cache','しゅごしゃのたからをうけとる')}</button>}
  </div>;
}
