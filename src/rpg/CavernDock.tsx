import { ArrowDownToLine, ArrowUpFromLine, Gem, Swords } from 'lucide-react';
import type { LanguageMode } from '../types';
import type { World } from './engine';
import { sandboxText } from './MachineryInspector';
import { CAVERNS, cacheRecord, cavernEntrance, cavernGuardianId, currentCavern, nearCavernCache, nearCavernEntrance, type CavernAction } from './subsurface';
import { traveling } from './transport';

export default function CavernDock({world,selfId,languageMode,disabled,send}:{world:World;selfId:string;languageMode?:LanguageMode;
  disabled?:boolean;send:(action:CavernAction)=>void}) {
  const player=world.players[selfId];
  if (!player||disabled||player.spectator||traveling(world,player)) return null;
  const inside=currentCavern(world,player), cave=inside??nearCavernEntrance(world,player);
  if (!cave) return null;
  const L=(ja:string,en:string,hi:string)=>sandboxText(languageMode,ja,en,hi);
  const def=CAVERNS[cave.id],name=L(def.name[0],def.name[1],def.name[2]);
  const entrance=cavernEntrance(cave);
  const withinExit=inside && Math.abs(player.x-entrance.x)+Math.abs(player.y-entrance.z)<=2;
  const guardian=world.sites.find(site=>site.id===cavernGuardianId(cave.id));
  const guarded=guardian&&!guardian.cleared;
  const battle=inside&&guarded&&Math.abs(player.x-guardian.x)+Math.abs(player.y-guardian.y)<=2;
  const treasure=inside&&!guarded&&nearCavernCache(world,player,cave)&&!player.voxelDiscoveries?.includes(cacheRecord(cave.id));
  const command=(command:CavernAction['command'])=>send({type:'voxel-cave',command,id:cave.id});
  return <section className="rpg-cavern-dock" aria-label={name} onPointerDown={e=>e.stopPropagation()}>
    <strong style={{color:def.color}}>{name}</strong>
    {inside ? <small>{L('地下','Depth','ちか')} {Math.abs(def.floor)} m</small> :
      <button onClick={()=>command('enter')}><ArrowDownToLine size={16}/> {L('地下へ降りる','Descend','ちかへおりる')}</button>}
    {withinExit && <button onClick={()=>command('exit')}><ArrowUpFromLine size={16}/> {L('地上へ戻る','Return to surface','ちじょうへもどる')}</button>}
    {battle && <button onClick={()=>command('challenge')}><Swords size={16}/> {L('守護者に挑む','Challenge the warden','しゅごしゃにいどむ')}</button>}
    {treasure && <button onClick={()=>command('recover')}><Gem size={16}/> {L('宝箱を開ける','Open the cache','たからばこをあける')}</button>}
  </section>;
}
