import {useRpgMusic} from './music';
import {FarmContent} from './farm/Panel';
import {houseGuests} from './town/HouseGuests';
import TownPanel from './town/Panel';
import SocialPanel from './SocialPanel';
import {resident,type SocialMemory} from './social';
import React,{useEffect,useRef,useState} from 'react';
import {audioService} from '../services/audioService';
import {trans} from '../utils/textUtils';
import type {LanguageMode} from '../types';
import type {World,Action} from './engine';
import {MATERIAL_NAMES,canAfford,homeGameWorld,interiorOf,type Material} from './life';
import {FURNISHINGS,ROOM_DOOR,ROOM_SPAWN,roomRoute,furnishing,furnitureDistance,covers,placementFits,type PlacedFurniture} from './homeCatalog';
import {gameOf,gameKind} from '../mini-games/gakuro-craft/homeGames';
import HobbyGamesPanel from '../mini-games/gakuro-craft/HobbyGamesPanel';
import FurnitureSprite from './FurnitureSprite';
import HomeCanvas from './HomeCanvas';
import './life.css';
export default function HomeRoom({world,selfId,languageMode,send,onBuilder,onMemory,musicActive=true}:{musicActive?:boolean;world:World;selfId:string;languageMode:LanguageMode;send:(a:Action)=>void;onBuilder:()=>void;onMemory:(m:SocialMemory)=>void}){
 const me=world.players[selfId],house=world.life.houses.find(h=>h.id===me.life?.indoors)!,room=interiorOf(house),owner=resident(world,house.id,selfId),people=Object.values(world.players).filter(p=>p.life?.indoors===house.id),pos=me.life?.roomPos||ROOM_SPAWN;
 const t=(s:string)=>trans(s,languageMode),[tab,setTab]=useState('room'),[filter,setFilter]=useState('all'),[selected,setSelected]=useState<string>(),[placing,setPlacing]=useState<string>(),[rotation,setRotation]=useState<0|1>(0),[hover,setHover]=useState({x:4,y:4});
 useRpgMusic(musicActive?(tab==='games'?'games':tab==='craft'?'craft':tab==='farm'?'farm':tab==='town'||tab==='social'?'social':'home'):null,20,'home');
 const exitRequested=useRef(false);
 const route=useRef<Array<{x:number;y:number}>>([]),held=useRef<{dx:number;dy:number}|null>(null),pending=useRef<{x:number;y:number;at:number}|null>(null),latest=useRef({world,tab,send});latest.current={world,tab,send};
 const move=(dx:number,dy:number)=>{route.current=[];pending.current=null;send({type:'life-room-move',dx,dy});};
 useEffect(()=>{const key=(e:KeyboardEvent)=>{if(latest.current.tab!=='room'||(e.target as HTMLElement).closest('input,textarea,select,[contenteditable=true]'))return;const direction:Record<string,[number,number]>={arrowup:[0,-1],w:[0,-1],arrowdown:[0,1],s:[0,1],arrowleft:[-1,0],a:[-1,0],arrowright:[1,0],d:[1,0]};const d=direction[e.key.toLowerCase()];if(d){e.preventDefault();route.current=[];pending.current=null;held.current={dx:d[0],dy:d[1]};if(!e.repeat)latest.current.send({type:'life-room-move',dx:d[0],dy:d[1]});}};const up=()=>{held.current=null;};window.addEventListener('keydown',key);window.addEventListener('keyup',up);window.addEventListener('blur',up);
 const timer=setInterval(()=>{const v=latest.current,p=v.world.players[selfId];if(v.tab!=='room'||!p?.life?.indoors)return;const h=v.world.life.houses.find(h=>h.id===p.life?.indoors);if(!h)return;const current=p.life.roomPos||ROOM_SPAWN;if(held.current){v.send({type:'life-room-move',...held.current});return;}if(pending.current){if(current.x===pending.current.x&&current.y===pending.current.y&&Date.now()-pending.current.at<800)return;pending.current=null;}while(route.current[0]?.x===current.x&&route.current[0]?.y===current.y)route.current.shift();const next=route.current[0];if(!next)return;if(Math.abs(next.x-current.x)+Math.abs(next.y-current.y)!==1){route.current=[];return;}pending.current={...current,at:Date.now()};v.send({type:'life-room-move',dx:next.x-current.x,dy:next.y-current.y});},125);
 return()=>{clearInterval(timer);window.removeEventListener('keydown',key);window.removeEventListener('keyup',up);window.removeEventListener('blur',up);};},[selfId]);
 useEffect(()=>{held.current=null;route.current=[];pending.current=null;if(tab==='room'&&exitRequested.current){const p=latest.current.world.players[selfId],h=latest.current.world.life.houses.find(h=>h.id===p.life?.indoors);if(h)route.current=roomRoute(interiorOf(h),p.life?.roomPos||ROOM_SPAWN,ROOM_DOOR);exitRequested.current=false;}},[tab,selfId]);
 const walk=(x:number,y:number)=>{route.current=roomRoute(room,pos,{x,y});pending.current=null;};
 const exit=()=>{setPlacing(undefined);pending.current=null;if(tab==='room')route.current=roomRoute(room,pos,ROOM_DOOR);else{exitRequested.current=true;setTab('room');}};
 const picked=room.placed.find(p=>p.id===selected),pickDef=picked&&furnishing(picked.item),adapter=homeGameWorld(world),active=gameOf(adapter,selfId);
 const preview:PlacedFurniture|undefined=placing?{id:'preview',item:placing,...hover,rotation}:undefined;
 const occupants=people.map(p=>p.life?.roomPos||ROOM_SPAWN),stock=Object.entries(room.stock).filter(([,n])=>n>0),cost=(f:typeof FURNISHINGS[number])=>Object.entries(f.cost).map(([k,n])=>`${t(MATERIAL_NAMES[k as Material])} ${me.life?.bag[k as Material]||0}/${n}`).join(' · ');
 const nearGames=house.home.furniture.filter(f=>gameKind(f.item)&&room.placed.some(p=>p.slot===f.slot&&furnitureDistance(pos,p)<=2));
 const craft=(item:string)=>{audioService.playRpgLifeSound('craft');if(item.startsWith('season')){setTab('town');return;}send({type:'life-furniture-craft',item});};
 return <div className="rpg-life-backdrop"><section className="rpg-life rpg-home-room" role="dialog" aria-modal="true" aria-label={t('家の中のマップ')}>
 <header><div><small>HOME · {people.length}</small><h2>{house.ownerName} · {t('仲間の集まる家')}</h2></div><button onClick={exit}>{t('入口へ向かう')} ↓</button></header>
 <nav>{[['room','室内を歩く'],['craft','家具を作る'],['stock','持ち物と配置'],['games','ミニゲーム'],['social','交流'],['town','暮らし'],['farm','農園・牧場']].map(([id,label])=><button key={id} aria-pressed={tab===id} onClick={()=>{setPlacing(undefined);setTab(id);}}>{t(label)}</button>)}</nav>
 <div className="rpg-room-guests">{world.social?.requests.some(r=>r.to===selfId)&&<button onClick={()=>setTab('social')}>{t('主人公と交流')} !</button>}{people.map(p=><span key={p.id}>{p.name}</span>)}{houseGuests(world,house.id,languageMode).map(p=><span key={p.id}>{p.name}</span>)}{owner&&<button onClick={()=>send({type:'life-invite'})}>{t('みんなを招待')}</button>}</div>
 <div className="rpg-life-content">
 {tab==='room'&&<><HomeCanvas pets={Object.entries(world.farm?.people||{}).flatMap(([id,f])=>world.players[id]?.life?.indoors===house.id?f.pets.filter(p=>!p.awayUntil):[])} room={room} players={people} guests={houseGuests(world,house.id,languageMode)} selfId={selfId} selected={selected} preview={preview} label={t('家の中のマップ')} onHover={(x,y)=>{if(placing)setHover(p=>p.x===x&&p.y===y?p:{x,y});}} onTile={(x,y)=>{if(placing){const p:PlacedFurniture={id:'preview',item:placing,x,y,rotation};send({type:'life-place',item:placing,x,y,rotation});if(placementFits(room,p,occupants)){audioService.playRpgLifeSound('craft');setPlacing(undefined);}return;}const f=room.placed.find(p=>covers(p,x,y)&&!furnishing(p.item)?.floor)||room.placed.find(p=>covers(p,x,y));setSelected(f?.id);walk(x,y);}}/>
 <div className="rpg-room-controls"><div className="rpg-room-pad">{[[0,-1,'↑'],[-1,0,'←'],[0,1,'↓'],[1,0,'→']].map(([dx,dy,label])=><button key={String(label)} aria-label={t('室内の移動')+' '+label} onPointerDown={e=>{e.preventDefault();e.currentTarget.setPointerCapture(e.pointerId);move(Number(dx),Number(dy));held.current={dx:Number(dx),dy:Number(dy)};}} onPointerUp={()=>{held.current=null;}} onPointerCancel={()=>{held.current=null;}} onLostPointerCapture={()=>{held.current=null;}} onClick={e=>{if(e.detail===0)move(Number(dx),Number(dy));}}>{label}</button>)}</div><p>{t(placing?'飾る場所をマップで選んでください。':'マップをタップ、または矢印キー・WASDで移動。下の入口に重なると外へ出ます。')}</p></div>
 {placing&&<div className="rpg-room-selection"><FurnitureSprite item={placing}/><strong>{t(furnishing(placing)!.name)}</strong><button onClick={()=>setRotation(rotation?0:1)}>{t('向きを変える')}</button><button onClick={()=>setPlacing(undefined)}>{t('配置をやめる')}</button></div>}
 {picked&&pickDef&&!placing&&<div className="rpg-room-selection"><FurnitureSprite item={picked.item}/><strong>{t(pickDef.name)}</strong>{pickDef.game&&<button onClick={()=>{if(furnitureDistance(pos,picked)<=2){send({type:'life-game',command:{type:'game_join',slot:picked.slot!}});setTab('games');}else walk(picked.x,picked.y);}}>{t(furnitureDistance(pos,picked)<=2?'ここで遊ぶ':'家具へ向かう')}</button>}{owner&&<><button onClick={()=>send({type:'life-rotate',id:picked.id})}>{t('回転する')}</button><button onClick={()=>{send({type:'life-pack',id:picked.id});setSelected(undefined);}}>{t('持ち物に戻す')}</button></>}</div>}
 </>}
 {tab==='craft'&&<><p>{t(owner?'家具を作ると持ち物に入ります。場所を選んで飾りましょう。':'家具の作成・配置は家の持ち主が行います。')}</p><div className="rpg-life-bag">{Object.entries(me.life!.bag).map(([k,n])=><span key={k}>{t(MATERIAL_NAMES[k as Material])} <b>{n}</b></span>)}</div><div className="rpg-room-filters">{[['all','すべて'],['decor','家具とインテリア'],['plush','ぬいぐるみ'],['game','ゲーム家具']].map(([id,label])=><button key={id} aria-pressed={filter===id} onClick={()=>setFilter(id)}>{t(label)}</button>)}</div><div className="rpg-life-grid">{FURNISHINGS.filter(f=>filter==='all'||filter==='game'&&f.game||filter==='plush'&&f.id.startsWith('plush')||filter==='decor'&&!f.game&&!f.id.startsWith('plush')).map(f=><article key={f.id}><FurnitureSprite item={f.id}/><h3>{t(f.name)}</h3><small>{cost(f)}</small><small>{f.width}×{f.height}</small><button disabled={!owner||!canAfford(me.life!.bag,f.cost)||world.ended} onClick={()=>craft(f.id)}>{t('作る')}</button></article>)}</div></>}
 {tab==='stock'&&<><p>{t('作った家具を選び、室内マップの好きな場所に配置できます。')}</p><div className="rpg-life-grid">{stock.map(([item,n])=>{const f=furnishing(item);return f&&<article key={item}><FurnitureSprite item={f.id}/><h3>{t(f.name)} ×{n}</h3><button disabled={!owner||world.ended} onClick={()=>{setTab('room');setPlacing(item);setRotation(0);setSelected(undefined);}}>{t('飾る')}</button></article>;})}</div>{!stock.length&&<p>{t('持ち物に家具がありません。家具を作るか、配置済みの家具を持ち物に戻しましょう。')}</p>}</>}
 {tab==='farm'&&<FarmContent world={world} selfId={selfId} languageMode={languageMode} send={send}/>}
 {tab==='town'&&<TownPanel world={world} selfId={selfId} languageMode={languageMode} send={send}/>}
 {tab==='social'&&<SocialPanel languageMode={languageMode} world={world} selfId={selfId} send={send} onBuilder={onBuilder} onMemory={onMemory}/>}
 {tab==='games'&&<>{!active&&<p>{t('ゲーム家具の近くで参加できます。家具は室内マップで選べます。')}</p>}{nearGames.length||active?<HobbyGamesPanel rpgMusic={musicActive} world={adapter} me={adapter.players[selfId]} home={{...house.home,furniture:active?house.home.furniture.filter(f=>f.slot===active.slot):nearGames}} t={t} send={command=>send({type:'life-game',command})}/>:<button onClick={()=>setTab('room')}>{t('室内へ戻る')}</button>}</>}
 </div><footer aria-live="polite">{t(me.message)}</footer>
 </section></div>;
}
