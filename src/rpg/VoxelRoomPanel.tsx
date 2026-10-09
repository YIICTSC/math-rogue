import HobbyGamesPanel from '../mini-games/gakuro-craft/HobbyGamesPanel';
import {homeGameWorld} from './life';
import {trans} from '../utils/textUtils';
import {MATERIAL_NAMES,type Material} from './life';
import React,{useState} from 'react';
import type {World,Action} from './engine';
import type {LanguageMode} from '../types';
import {c,copy} from './town/catalog';
import {currentVoxelRoom,nearDoor} from './voxelRooms';
import {FURNISHINGS} from './homeCatalog';
import {canAfford} from './life';
import {relativeMove} from './worldViewMath';
import FurnitureSprite from './FurnitureSprite';
import {FarmContent} from './farm/Panel';
export default function VoxelRoomPanel({world,selfId,facing,send,languageMode,active=true}:{world:World;selfId:string;facing:number;send:(a:Action)=>void;languageMode:LanguageMode;active?:boolean}){
 const p=world.players[selfId],r=currentVoxelRoom(world,p),door=nearDoor(world,p),[open,setOpen]=useState(false),[tab,setTab]=useState('furniture'),[item,setItem]=useState('chair'),[rotation,setRotation]=useState<0|1>(0);
 const L=(ja:string,en:string,hi:string)=>copy(c(ja,en,hi),languageMode);
 if(!r&&!door)return null;const usable=!!r&&(r.owner===selfId||r.shared),f=FURNISHINGS.find(v=>v.id===item)!;
 return <section className="rpg-voxel-room-panel" aria-label={L('建築した部屋','Built room','けんちくしたへや')}>
 <button onClick={()=>setOpen(!open)} aria-expanded={open}>⌂ {r?L(r.shared?'共用施設':'自宅',r.shared?'Shared facility':'Home',r.shared?'きょうようしせつ':'じたく'):L('部屋を登録','Register room','へやをとうろく')} {open?'−':'＋'}</button>
 {open&&<div className="rpg-voxel-room-content">{!r?<><p>{L('壁・屋根・床で囲った4〜256マスの空間にドアを設置します。','Add a door to a room of 4–256 cells enclosed by walls, a roof and a floor.','かべ・やね・ゆかでかこった4〜256ますのくうかんにどあをせっちします。')}</p><button onClick={()=>send({type:'voxel-room-register',...door!})}>{L('自宅として登録','Register as home','じたくとしてとうろく')}</button></>:<>
 <small>{r.cells.length} {L('マス','cells','ます')}</small>
 {r.owner===selfId&&<button onClick={()=>send({type:'voxel-room-mode',id:r.id,shared:!r.shared})}>{L(r.shared?'自宅にする':'共用施設にする',r.shared?'Make private':'Make shared',r.shared?'じたくにする':'きょうようしせつにする')}</button>}
 {!usable?<p>{L('この自宅の持ち主だけが家具を配置できます。','Only the owner can furnish this private home.','このじたくのもちぬしだけがかぐをはいちできます。')}</p>:<>
 <nav><button onClick={()=>setTab('games')}>{L('ミニゲーム','Mini-games','みにげーむ')}</button><button aria-pressed={tab==='furniture'} onClick={()=>setTab('furniture')}>{L('家具','Furniture','かぐ')}</button>{r.owner===selfId&&!r.shared&&<button aria-pressed={tab==='pets'} onClick={()=>setTab('pets')}>{L('ペット','Pets','ぺっと')}</button>}</nav>
 {tab==='games'?<div className="rpg-voxel-room-game" role="dialog" aria-modal="true"><button onClick={()=>{const game=Object.values(world.life.games||{}).find(g=>g.players.includes(selfId));if(game)send({type:'voxel-room-game',id:r.id,command:{type:'game_leave',key:game.key}});setTab('furniture');}}>{L('家具に戻る','Back to furniture','かぐにもどる')}</button><HobbyGamesPanel rpgMusic={active} world={homeGameWorld(world)} me={homeGameWorld(world).players[selfId]} home={homeGameWorld(world).players[selfId].progress.home} t={s=>trans(s,languageMode)} send={command=>send({type:'voxel-room-game',id:r.id,command})}/></div>:tab==='pets'?<FarmContent petsOnly world={world} selfId={selfId} languageMode={languageMode} send={send}/>:<>
 <select aria-label={L('作る家具','Furniture to craft','つくるかぐ')} value={item} onChange={e=>setItem(e.target.value)}>{FURNISHINGS.filter(v=>!v.id.startsWith('season')).map(v=><option key={v.id} value={v.id}>{trans(v.name,languageMode)}</option>)}</select><FurnitureSprite item={item}/>
 <small>{Object.entries(f.cost).map(([k,n])=>`${trans(MATERIAL_NAMES[k as Material],languageMode)} ${p.life?.bag[k as keyof NonNullable<typeof p.life>['bag']]||0}/${n}`).join(' · ')}</small>
 <button disabled={!canAfford(p.life?.bag||{},f.cost)} onClick={()=>send({type:'voxel-room-craft',id:r.id,item})}>{L('家具を作る','Craft furniture','かぐをつくる')}</button>
 <button onClick={()=>setRotation(rotation?0:1)}>{L('向きを変える','Rotate','むきをかえる')}</button><button disabled={!(r.stock[item]>0)} onClick={()=>{const d=relativeMove(0,-1,facing),dx=Math.abs(d.dx)>Math.abs(d.dy)?Math.sign(d.dx):0,dz=dx?0:Math.sign(d.dy);send({type:'voxel-room-place',id:r.id,item,x:Math.floor(p.position3D?.x??p.x)+dx,z:Math.floor(p.position3D?.z??p.y)+dz,rotation});}}>{L('前に置く','Place ahead','まえにおく')} ×{r.stock[item]||0}</button>
 <div>{r.furniture.map(v=><button key={v.id} onClick={()=>send({type:'voxel-room-pack',id:r.id,furnitureId:v.id})}>{L('しまう','Pack','しまう')} {trans(FURNISHINGS.find(f=>f.id===v.item)?.name||'',languageMode)}</button>)}</div>
 </>}
 </>}
 </>}</div>}
 </section>;
}
