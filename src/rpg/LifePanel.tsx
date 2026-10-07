import {assetUrl} from '../utils/assetPaths';
import {useRpgMusic} from './music';
import {FishingFrame} from './FishSprite';
import FishBook from './FishBook';
import {Zap} from 'lucide-react';
import {energyOf,GATHER_ENERGY_MAX} from './energy';
import {nearbyResources} from './nearbyResources';
import {audioService} from '../services/audioService';
import LifeSprite from './LifeSprite';
import FurnitureSprite from './FurnitureSprite';
import React,{useEffect,useState} from 'react';
import {distance,type World,type Action} from './engine';
import {MATERIAL_NAMES,RECIPES,HOUSE_COST,canAfford,natureAt,resourceReady,homeGameWorld,type Bag,type Material} from './life';
import HobbyGamesPanel from '../mini-games/gakuro-craft/HobbyGamesPanel';
import {trans} from '../utils/textUtils';
import type {LanguageMode} from '../types';
import './life.css';
export default function LifePanel({world,selfId,target,languageMode,send,onClose,onTrack,onEnergyRequest,initialTab,onCity,musicActive=true}:{musicActive?:boolean;world:World;selfId:string;target:number|null;languageMode:LanguageMode;send:(a:Action)=>void;onClose:()=>void;onTrack:(x:number,y:number)=>void;onEnergyRequest?:()=>void;initialTab?:string;onCity?:()=>void}){
 const me=world.players[selfId],life=me.life!,house=world.life.houses.find(h=>h.id===life.indoors),[tab,setTab]=useState(initialTab||(house?'homes':'gather')),[clock,setClock]=useState(world.life.now);
 useEffect(()=>{const start=performance.now(),base=world.life.now;const timer=setInterval(()=>setClock(base+performance.now()-start),40);return()=>clearInterval(timer);},[world.life.now]);
 const t=(s:string)=>trans(s,languageMode),cost=(bag:Bag)=>Object.entries(bag).map(([k,n])=>`${t(MATERIAL_NAMES[k as Material])} ${life.bag[k as Material]||0}/${n}`).join(' · ');
 const nearby=nearbyResources(world,me);
 if(target!==null&&nearby.includes(target))nearby.sort((a,b)=>a===target?-1:b===target?1:0);
 const work=life.work,progress=work?Math.min(100,Math.max(0,(clock-work.started)/(work.expires-work.started)*100)):0;
 useRpgMusic(musicActive?(work?(work.kind==='fish'?'fishing':'gather'):tab==='fishbook'?'journal':tab==='homes'?'home':tab==='craft'?'craft':'gather'):null,20);
 const act=(a:Action)=>{if(a.type==='life-cast')void audioService.preloadRpgFishingSounds();if(a.type==='life-hit'&&work)audioService.playRpgLifeSound(natureAt(world,work.tile)?.rock?'mine':'gather');if(a.type==='life-reel')audioService.playRpgFishingSound(work?.fishing?.phase==='bite'?'hook':'reel');if(a.type==='life-craft'||a.type==='life-build')audioService.playRpgLifeSound('craft');send(a);};
 const adapter=house?homeGameWorld(world):null;
 return <div className="rpg-life-backdrop"><section className="rpg-life" role="dialog" aria-modal="true" aria-label={t('採取・クラフト')}>
 <header><div><small>FRONTIER LIFE</small><h2>{t(tab==='fishbook'?'釣り図鑑':house?'仲間の集まる家':'採取・クラフト')}</h2></div><button onClick={()=>{if(work)send({type:'life-cancel'});onClose();}} aria-label={t('閉じる')}>✕</button></header>
 <nav>{[['gather','採取・釣り'],['craft','クラフト'],['homes','家とミニゲーム'],['fishbook','釣り図鑑']].map(([id,label])=><button key={id} aria-pressed={tab===id} onClick={()=>setTab(id)}>{t(label)}</button>)}</nav>
 <div className="rpg-life-content">
 <div className="rpg-life-energy"><Zap size={16}/><strong>{t('採取エネルギー')} {energyOf(life)}/{GATHER_ENERGY_MAX}</strong><button disabled={!!work||!onEnergyRequest} onClick={onEnergyRequest}>{t('問題で回復')}</button><small>{t('採取1回で1消費、1問正解で2回復。時間では回復しません。')}</small></div>
 <p className="rpg-voxel-energy-help">{t('3Dの基本採掘・設置は0.1消費。硬い鉱石は道具で軽減。')}</p><div className="rpg-life-bag">{Object.entries(MATERIAL_NAMES).map(([key,name])=><span key={key}>{t(name)} <b>{life.bag[key as Material]||0}</b></span>)}</div>
 {tab==='fishbook'&&<FishBook records={life.fishRecords} languageMode={languageMode}/>}
 {tab==='gather'&&<><p>{t('木・岩・川の近くへ移動して、素材を集めよう。光るタイミングで押すと大成功！')}</p>{house?<p>{t('採取するときは家から外へ出ましょう。')}</p>:work?<div className="rpg-life-work"><LifeSprite index={work.kind==='fish'?21:natureAt(world,work.tile)?.sprite||0}/><h3>{t(work.kind==='fish'?'浮きが沈んだら引き上げよう！':'光るタイミングで道具を振ろう！')}</h3><div className="rpg-life-gauge"><i style={{left:`${(work.target-work.started)/(work.expires-work.started)*100}%`}}/><b style={{left:`${progress}%`}}/></div><button className="rpg-life-primary" onClick={()=>act(work.kind==='fish'?{type:'life-reel',phaseTarget:work.target}:{type:'life-hit'})}>{t(work.kind==='fish'?(clock>=work.target?'今！引き上げる':'引き上げる'):'道具を振る')}</button><button onClick={()=>send({type:'life-cancel'})}>{t('中断')}</button></div>:<div className="rpg-life-grid">{nearby.map(tile=>{const node=natureAt(world,tile),fish=world.tiles[tile]==='water';return <button key={tile} className="rpg-life-resource" onClick={()=>{if(energyOf(life)<1){onEnergyRequest?.();return;}act({type:fish?'life-cast':'life-work',tile});}}>{fish?<FishingFrame index={0}/>:<LifeSprite index={node!.sprite}/>}<strong>{t(fish?'川釣り':node!.name)}</strong><span>{t(energyOf(life)<1?'問題を解いて回復':fish?'釣り糸を投げる':node!.rock?'採掘する':'採取する')}</span>{node&&<small>{world.life.nodes[tile]?.hits||0}/{node.hardness} · {t(MATERIAL_NAMES[node.material])} ×{node.amount}</small>}</button>;})}{!nearby.length&&<p>{t('近くに資源がありません。マップで木・岩・川を選ぶと近くまで移動します。')}</p>}</div>}</>}
 {tab==='craft'&&world.city&&<button onClick={onCity}>{t('都市運営')}</button>}
 {tab==='craft'&&<div className="rpg-life-grid">{RECIPES.filter(r=>house||r.kind!=='furniture').map(r=>{const done=life.crafted.includes(r.id)||(r.id==='housekit'&&(!!life.homeId||(life.bag.housekit||0)>0));return <article key={r.id}>{r.kind==='furniture'?<FurnitureSprite item={r.id}/>:r.kind==='tool'||r.id==='door'?<img className="rpg-pickaxe-image" src={assetUrl(`sprites/rpg/tools/${r.id}.svg`)} alt={t(r.name)}/>:<LifeSprite atlas="craft" index={r.sprite}/>}<h3>{t(r.name)}</h3><p>{t(r.description)}</p><small>{cost(r.cost)}</small><button disabled={!!work||!!done||!canAfford(life.bag,r.cost)||r.kind==='furniture'&&house?.owner!==selfId} onClick={()=>act({type:'life-craft',recipe:r.id})}>{t(done?'作成済み':'作る')}</button></article>;})}</div>}
 {tab==='homes'&&<>{house?<><div className="rpg-life-home"><LifeSprite index={house.biome==='snow'?19:house.biome==='desert'?20:18}/><h3>{house.ownerName}</h3><p>{Object.values(world.players).filter(p=>p.life?.indoors===house.id).map(p=>p.name).join(' · ')}</p><button onClick={()=>send({type:'life-leave'})}>{t('外へ出る')}</button>{house.owner===selfId&&<button onClick={()=>send({type:'life-invite'})}>{t('みんなを招待')}</button>}</div><p>{t('クラフトでゲーム家具を作ると、ここで仲間と対戦できます。')}</p><HobbyGamesPanel rpgMusic={musicActive} world={adapter!} me={adapter!.players[selfId]} home={house.home} t={t} send={command=>send({type:'life-game',command})}/></>:<><article><LifeSprite atlas="craft" index={7}/><h3>{t('自分の家を建てる')}</h3><p>{t('道・水辺・施設から離れた草地に建てましょう。')}</p><small>{cost(HOUSE_COST)}</small><button disabled={!canAfford(life.bag,HOUSE_COST)||!!life.homeId||!!work} onClick={()=>act({type:'life-build'})}>{t('ここに家を建てる')}</button></article><div className="rpg-life-grid">{world.life.houses.map(h=><article key={h.id}><LifeSprite index={h.biome==='snow'?19:h.biome==='desert'?20:18}/><h3>{h.ownerName}</h3>{h.invitedAt>0&&<p>{t('仲間を募集中！')}</p>}<p>{t('家の中の人数')}：{Object.values(world.players).filter(p=>p.life?.indoors===h.id).length}</p><button onClick={()=>{if(distance(me,h)<=2)send({type:'life-enter',houseId:h.id});else onTrack(h.x,h.y);}}>{t(distance(me,h)<=2?'家に入る':'家へ向かう')}</button>{h.owner===selfId&&<button onClick={()=>send({type:'life-invite'})}>{t('みんなを招待')}</button>}</article>)}</div></>}</>}
 </div><footer aria-live="polite">{t(me.message)}<small>{t('素材と家は、この部屋の冒険中に共有・保存されます。')}</small></footer>
 </section></div>;
}
