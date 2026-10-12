import React from 'react';
import type {LanguageMode} from '../types';
import type {Action,World} from './engine';
import type {PlacedFurniture} from './homeCatalog';
import {homeBattleBonus,HOME_BONUS_CAP} from './furnitureBenefits';
import {HOME_TRACKS,MUSIC_FURNITURE,homeMusic,type HomeTrackId} from './homeTracks';
export default function HomeBenefitsPanel({world,selfId,languageMode,roomId,placed,music,canControl,send,voxel=false}:{world:World;selfId:string;languageMode:LanguageMode;roomId:string;placed:PlacedFurniture[];music?:HomeTrackId;canControl:boolean;send:(a:Action)=>void;voxel?:boolean}){
 const copy=(ja:string,en:string,hi:string)=>languageMode==='ENGLISH'?en:languageMode==='HIRAGANA'?hi:ja;
 const bonus=homeBattleBonus(world,selfId),instrument=placed.find(f=>MUSIC_FURNITURE.has(f.item));
 return <section className="rpg-home-benefits" aria-label={copy('自宅の家具効果','Home furniture benefits','じたくのかぐこうか')}>
 <strong>{copy('次の戦闘で有効な家具ボーナス','Furniture bonuses for the next battle','つぎのせんとうでゆうこうなかぐぼーなす')}</strong>
 <div>{copy('筋力','Strength','きんりょく')} +{bonus.strength}/{HOME_BONUS_CAP.strength} · {copy('初期ブロック','Starting block','しょきぶろっく')} +{bonus.block}/{HOME_BONUS_CAP.block} · {copy('初期ドロー','Starting draw','しょきどろー')} +{bonus.draw}/{HOME_BONUS_CAP.draw} · HP +{bonus.heal}/{HOME_BONUS_CAP.heal}</div>
 <small>{copy('自宅に配置した家具が対象。同じ種類は1つ分、合計は上記の上限まで。戦闘中の変更は次の戦闘から反映されます。','Only placed home furniture counts. Each type counts once, up to the caps above. Changes during combat apply to the next battle.','じたくにはいちしたかぐがたいしょう。おなじしゅるいは1つぶん、ごうけいはじょうきのじょうげんまで。せんとうちゅうのへんこうはつぎのせんとうからはんえいされます。')}</small>
 {instrument&&<label>{copy('自宅BGM','Home BGM','じたくBGM')}<select disabled={!canControl||world.ended} value={homeMusic({music,placed})} onChange={e=>send(voxel?{type:'voxel-room-music',id:roomId,furnitureId:instrument.id,track:e.target.value}:{type:'life-home-music',id:instrument.id,track:e.target.value})}>{HOME_TRACKS.map(track=><option key={track.id} value={track.id}>{languageMode==='ENGLISH'?track.en:languageMode==='HIRAGANA'?track.hira:track.ja}</option>)}</select></label>}
 </section>;
}
