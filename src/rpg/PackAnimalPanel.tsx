import { Footprints, Heart, Package, PawPrint } from 'lucide-react';
import type { LanguageMode } from '../types';
import type { Adventurer, World } from './engine';
import { sandboxItemName, sandboxText } from './MachineryInspector';
import { PACK_SPECIES, type PackAnimal, type PackAction, type packFeedCandidates } from './packAnimals';
import { WILDLIFE } from './lifestyle/wildlife';
import { copy } from './town/catalog';
import type { ReactNode } from 'react';

export function PackAnimalPanel({world,player,animal,candidates,languageMode,send,cargo,onMount}:{world:World;
  player:Adventurer;animal?:PackAnimal;candidates:ReturnType<typeof packFeedCandidates>;languageMode?:LanguageMode;
  send:(action:PackAction)=>void;cargo?:ReactNode;onMount:()=>void}) {
  const language=languageMode??'JAPANESE';
  const L=(ja:string,en:string,hi:string)=>sandboxText(language,ja,en,hi);
  const name=(kind:string)=>copy(WILDLIFE[kind].name,language);
  if(!animal&&!candidates.length)return null;
  return <section className="rpg-pack-list">
    <h3><PawPrint size={17}/> {L('旅の相棒','Travel companion','たびのあいぼう')}</h3>
    {animal ? <section className="rpg-transport-boat">
      <h4>{animal.name??(animal.kind==='horse'?L('ウマ','Horse','ウマ'):name(animal.kind))}</h4>
      <small>{Math.floor(animal.x)}, {Math.floor(animal.z)} · {animal.follow?L('同行中','Following','どうこうちゅう'):L('待機中','Waiting','たいきちゅう')}</small>
      <div className="rpg-transport-actions">
        <button onClick={()=>{
          send({type:'voxel-pack-animal',command:animal.rider?'dismount':'mount',id:animal.id});
          onMount();
        }}>{animal.rider?L('降りる','Dismount','おりる'):L('騎乗','Mount','きじょう')}</button>
        <button onClick={()=>send({type:'voxel-pack-animal',command:'follow',id:animal.id})}>
          <Footprints size={15}/> {animal.follow?L('ここで待つ','Wait here','ここでまつ'):L('ついてくる','Follow me','ついてくる')}</button>
        <button disabled={!player.life?.bag[PACK_SPECIES[animal.kind].feed] || world.life.time-animal.fedAt<3}
          onClick={()=>send({type:'voxel-pack-animal',command:'feed',id:animal.id})}>
          <Heart size={15}/> {sandboxItemName(PACK_SPECIES[animal.kind].feed,language)}</button>
      </div>
      <form className="rpg-transport-actions" onSubmit={event=>{
        event.preventDefault();send({type:'voxel-pack-animal',command:'name',id:animal.id,name:String(new FormData(event.currentTarget).get('name')??'')});
      }}><input name="name" aria-label={L('相棒の名前','Companion name','あいぼうのなまえ')} defaultValue={animal.name??''} maxLength={18}/>
        <button type="submit">{L('名札を付ける','Set name','なふだをつける')}</button></form>
      {cargo}
    </section> : <>
      <p>{L('近くの動物に餌を3回渡すと、荷物を運ぶ相棒になります。','Feed a nearby animal three times to recruit a pack companion.','ちかくのどうぶつにえさを3かいわたすと、にもつをはこぶあいぼうになります。')}</p>
      {candidates.map(wild=>{
        const species=PACK_SPECIES[wild.kind as keyof typeof PACK_SPECIES];
        return <section className="rpg-transport-boat" key={wild.id}>
          <strong><Package size={15}/> {name(wild.kind)}</strong>
          <button disabled={!player.life?.bag[species.feed]} onClick={()=>send({type:'voxel-pack-animal',command:'feed',id:wild.id})}>
            {sandboxItemName(species.feed,language)} ×1 · {player.packTraining?.id===wild.id?player.packTraining.feeds:0}/3
          </button>
        </section>;
      })}
    </>}
  </section>;
}
