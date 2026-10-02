import { BIOMES, biomeAt, biomeWeights, type BiomeId } from './biomes';
import { WIDTH, HEIGHT, distance, type World, type Adventurer } from './engine';
import { grant, pendingMutation } from './activities';
import { CARDS_LIBRARY } from '../constants';
import type { Relic } from '../types';
import { RECIPES as CRAFT_RECIPES } from '../mini-games/gakuro-craft/materials';
import { gameCommand, tickGames, type GameCommand, type HomeGame, type HomeGameWorld } from '../mini-games/gakuro-craft/homeGames';
import type { Home } from '../mini-games/gakuro-craft/progression';

export const MATERIAL_NAMES = {wood:'木材',stone:'石材',ore:'鉄鉱石',crystal:'魔晶石',herb:'薬草',fish:'魚',frostwood:'霜木',reed:'葦',plank:'木の板',brick:'レンガ'} as const;
export type Material = keyof typeof MATERIAL_NAMES;
export type Bag = Partial<Record<Material,number>>;
export const NATURE = [
 ['樫の木','wood',3,3],['白樺','wood',3,3],['針葉樹','wood',4,4],['キノコ','herb',2,2],['柳','wood',3,3],['葦の茂み','reed',2,3],
 ['サボテン','herb',2,3],['枯れ木','wood',2,2],['砂岩','stone',3,4],['雪積もる針葉樹','frostwood',4,3],['雪の白樺','frostwood',3,3],['氷の岩','stone',4,4],
 ['苔むした石柱','stone',4,4],['魔晶石の鉱脈','crystal',4,2],['鉄鉱脈','ore',4,3],['銅色の鉱脈','ore',3,2],['野草','herb',2,3],['果樹','wood',3,3],
] as const;
const vegetation:Record<BiomeId,readonly number[]>={meadow:[0,1,16,17,14],forest:[0,1,2,3,17,14],wetland:[4,5,5,3,16,14],desert:[6,7,8,8,15],snow:[9,10,11,11,14],ruins:[7,12,12,13,14,15]};
export function isResourceTile(w:World,tile:number){if(!Number.isInteger(tile)||tile<0||tile>=w.tiles.length)return false;const x=tile%WIDTH,y=Math.floor(tile/WIDTH);return x>0&&y>0&&x<WIDTH-1&&y<HEIGHT-1;}
type NatureNode={sprite:number;name:string;material:Material;hardness:number;amount:number;rock:boolean};
const natureCache=new Map<string,NatureNode>();
export function natureAt(w:World,tile:number):NatureNode|null {
 if(!isResourceTile(w,tile)||w.tiles[tile]!=='forest')return null;
 const key=`${w.seed}:${tile}`,cached=natureCache.get(key);if(cached)return cached;
 const x=tile%WIDTH,y=Math.floor(tile/WIDTH);
 const hash=(Math.imul(tile+1,374761393)^w.seed)>>>0;
 let roll=((hash>>>8)%10000)/10000,region=biomeAt(x,y).id;
 for(const [i,weight] of biomeWeights(x,y).entries()){roll-=weight;if(roll<=0){region=BIOMES[i].id;break;}}
 const choices=vegetation[region];
 const sprite=choices[hash%choices.length];
 const result: NatureNode = {sprite,name:NATURE[sprite][0],material:NATURE[sprite][1],hardness:NATURE[sprite][2],amount:NATURE[sprite][3],rock:[8,11,12,13,14,15].includes(sprite)};
 if(natureCache.size>25000)natureCache.clear();natureCache.set(key,result);return result;
}
export interface Work {tile:number;kind:'gather'|'fish';started:number;target:number;expires:number}
export interface LifePlayer {bag:Bag;homeId?:string;indoors?:string;work?:Work;lastAction:number;crafted:string[];effect?:{tile:number;at:number;kind:string;perfect:boolean}}
export interface House {id:string;owner:string;ownerName:string;x:number;y:number;biome:BiomeId;home:Home;invitedAt:number}
export interface LifeWorld {nodes:Record<number,{hits:number;regrowAt:number}>;houses:House[];games:Record<string,HomeGame>;now:number;time:number;lastTick:number}
export type LifeAction = {type:'life-work'|'life-cast';tile:number}|{type:'life-hit'|'life-reel'|'life-cancel'|'life-leave'|'life-build'|'life-invite'}|{type:'life-craft';recipe:string}|{type:'life-enter';houseId:string}|{type:'life-game';command:GameCommand};
export const createLife=(now:number):LifeWorld=>({nodes:{},houses:[],games:{},now,time:0,lastTick:now});
export const lifePlayer=(p:Adventurer):LifePlayer=>p.life??={bag:{wood:4,stone:2},lastAction:0,crafted:[]};
export const resourceReady=(w:World,tile:number)=>!(w.life?.nodes[tile]?.regrowAt);
export function lifeWalkable(w:World,x:number,y:number){const tile=y*WIDTH+x;return x>0&&y>0&&x<WIDTH-1&&y<HEIGHT-1&&w.tiles[tile]!=='water'&&(w.tiles[tile]!=='forest'||!!w.life?.nodes[tile]?.regrowAt);}
export const RECIPES = [
 {id:'plank',name:'木の板',cost:CRAFT_RECIPES.plank as Bag,kind:'material',description:'家や家具の材料。',sprite:22},
 {id:'brick',name:'レンガ',cost:CRAFT_RECIPES.brick as Bag,kind:'material',description:'家や家具の材料。',sprite:8},
 {id:'sword',name:'鉄の剣',cost:{plank:2,ore:3} as Bag,kind:'weapon',description:'専用カード：14ダメージ、びくびく2。',sprite:14},
 {id:'frostbow',name:'霜木の弓',cost:{frostwood:4,reed:3,ore:1} as Bag,kind:'weapon',description:'専用カード：10ダメージ、ブロック8。',sprite:9},
 {id:'charm',name:'森の護符',cost:{herb:4,crystal:2,wood:2} as Bag,kind:'relic',description:'戦闘開始時、ブロック4・HP回復2。',sprite:23},
 {id:'crystal',name:'星晶のレリック',cost:{crystal:5,ore:3} as Bag,kind:'relic',description:'戦闘開始時、筋力1・追加ドロー1。',sprite:13},
 {id:'meal',name:'川魚のスープ',cost:{fish:2,herb:1} as Bag,kind:'meal',description:'HPを20回復。',sprite:21},
 {id:'darts',name:'ダーツ台',cost:{plank:3,ore:1} as Bag,kind:'furniture',description:'家で最大4人のダーツ対戦。',sprite:22},
 {id:'billiards',name:'ビリヤード台',cost:{plank:4,stone:4} as Bag,kind:'furniture',description:'家で最大4人の8ボール対戦。',sprite:22},
 {id:'arcade',name:'ゲーム機',cost:{plank:3,crystal:2} as Bag,kind:'furniture',description:'家で最大4人のブロック崩し対戦。',sprite:23},
] as const;
export const HOUSE_COST:Bag={plank:6,brick:2};
export function canAfford(bag:Bag,cost:Bag){return Object.entries(cost).every(([key,n])=>(bag[key as Material]||0)>=n!);}
function spend(bag:Bag,cost:Bag){for(const [key,n]of Object.entries(cost))bag[key as Material]=(bag[key as Material]||0)-n!;}
export function homeGameWorld(w:World):HomeGameWorld {
 const life=w.life!,tiles:Array<{homeOwner?:string}>=Array(WIDTH*HEIGHT),homeViews:Record<number,Home>={};
 for(const h of life.houses){tiles[h.home.tile]={homeOwner:h.owner};homeViews[h.home.tile]=h.home;}
 const players=Object.fromEntries(Object.values(w.players).filter(p=>!p.spectator).map(p=>{const house=life.houses.find(h=>h.id===p.life?.indoors);return [p.id,{id:p.id,name:p.name,indoors:!!house,homeTile:house?.home.tile,progress:{home:house?.home||{tile:-1,level:0,furniture:[]}}}];}));
 return {tiles,homeViews,players,games:life.games,time:life.time,paused:w.ended||!w.started};
}
export function applyLifeAction(w:World,p:Adventurer,a:LifeAction,now:number):boolean {
 const life=w.life??=createLife(now),lp=lifePlayer(p);
 const tell=(text:string)=>{p.message=text;w.revision++;return true;};
 if(a.type==='life-cancel'){lp.work=undefined;return tell('作業を中断しました。');}
 if(a.type==='life-leave'){lp.indoors=undefined;lp.work=undefined;tickGames(homeGameWorld(w),0);return tell('家から外へ出ました。');}
 if(w.ended||!w.started||p.spectator||p.nativeScene||p.duelId||p.dungeonId||p.arcadePending||pendingMutation(p)||w.activities.trades.some(t=>t.from===p.id||t.to===p.id))return false;
 if(a.type==='life-game'){
  if(!lp.indoors||!a.command||typeof a.command.type!=='string'||!['game_join','game_leave','game_start','game_dart','game_shot','game_cue','game_paddle'].includes(a.command.type))return false;
  const host=homeGameWorld(w),reply=gameCommand(host,host.players[p.id],a.command);life.games=host.games;if(reply?.type==='notice')p.message=reply.text;w.revision++;return true;
 }
 if(a.type==='life-enter'){
  const h=life.houses.find(h=>h.id===a.houseId);if(!h||distance(p,h)>2||lp.work||lp.indoors)return false;
  lp.indoors=h.id;return tell('家へようこそ！家具からゲームに参加できます。');
 }
 if(a.type==='life-invite'){
  const h=life.houses.find(h=>h.owner===p.id);if(!h||now-h.invitedAt<5000)return false;
  h.invitedAt=now;w.logs=['仲間を募集中！',...w.logs].slice(0,8);return tell('家の場所をみんなに知らせました。');
 }
 if(a.type==='life-craft'){
  if(lp.work)return false;
  const r=RECIPES.find(r=>r.id===a.recipe);if(!r||!canAfford(lp.bag,r.cost))return tell('材料が足りません。');
  if((r.kind==='weapon'||r.kind==='relic')&&lp.crafted.includes(r.id))return tell('この装備は作成済みです。');
  const house=life.houses.find(h=>h.owner===p.id);
  if(r.kind==='furniture'&&(!house||lp.indoors!==house.id))return tell('自分の家の中で家具を作れます。');
  if(r.kind==='furniture'&&house!.home.furniture.some(f=>f.item===r.id))return tell('この家具は設置済みです。');
  if(r.kind==='meal'&&p.hp>=p.maxHp)return tell('HPは満タンです。');
  spend(lp.bag,r.cost);
  if(r.kind==='material')lp.bag[r.id as Material]=(lp.bag[r.id as Material]||0)+1;
  if(r.kind==='weapon'){
   const frost=r.id==='frostbow';const card={...CARDS_LIBRARY[frost?'IRON_WAVE':'BASH'],id:`rpg-crafted-${p.id}-${r.id}`,name:r.name,damage:frost?10:14,...(frost?{block:8}:{}),description:frost?'10ダメージ。ブロック8を得る。':'14ダメージ。対象にびくびく2を与える。'};
   grant(p,{remove:[],cards:[card],gold:0,heal:0});lp.crafted.push(r.id);
  }
  if(r.kind==='relic'){
   const relic:Relic={id:`RPG_CRAFT:${r.id}`,name:r.name,description:r.description,rarity:'UNCOMMON',effectType:'START_BATTLE',rpgInnate:r.id==='charm'?{strength:0,block:4,draw:0,heal:2}:{strength:1,block:0,draw:1,heal:0}};
   grant(p,{remove:[],cards:[],gold:0,heal:0,relics:[relic]});lp.crafted.push(r.id);
  }
  if(r.kind==='meal')grant(p,{remove:[],cards:[],gold:0,heal:20});
  if(r.kind==='furniture')house!.home.furniture.push({slot:house!.home.furniture.length,item:r.id as 'darts'|'billiards'|'arcade'});
  lp.effect={tile:p.y*WIDTH+p.x,at:now,kind:'craft',perfect:true};return tell('クラフトしました！');
 }
 if(a.type==='life-build'){
  if(lp.indoors||lp.work||life.houses.some(h=>h.owner===p.id))return false;
  if(!canAfford(lp.bag,HOUSE_COST))return tell('材料が足りません。');
  if(w.tiles[p.y*WIDTH+p.x]!=='grass'||[1,-1,WIDTH,-WIDTH].some(d=>w.tiles[p.y*WIDTH+p.x+d]==='water')||w.sites.some(s=>distance(s,p)<4)||life.houses.some(h=>distance(h,p)<5))return tell('道・水辺・施設から離れた草地に建てましょう。');
  spend(lp.bag,HOUSE_COST);const id=`home-${p.id}`,tile=p.y*WIDTH+p.x;
  life.houses.push({id,owner:p.id,ownerName:p.name,x:p.x,y:p.y,biome:biomeAt(p.x,p.y).id,home:{tile,level:1,furniture:[{slot:0,item:'workbench'},{slot:1,item:'table'}]},invitedAt:0});lp.homeId=id;return tell('家を建てました！家具を作って仲間を招きましょう。');
 }
 if(lp.indoors)return false;
 if(a.type==='life-work'||a.type==='life-cast'){
  if(lp.work||now-lp.lastAction<350||!Number.isInteger(a.tile)||a.tile<0||a.tile>=w.tiles.length)return false;
  const x=a.tile%WIDTH,y=Math.floor(a.tile/WIDTH);if(x<1||y<1||x>=WIDTH-1||y>=HEIGHT-1||distance(p,{x,y})>2)return false;
  if(a.type==='life-work'&&(!natureAt(w,a.tile)||!resourceReady(w,a.tile)))return tell('この資源は再生を待っています。');
  if(a.type==='life-cast'&&w.tiles[a.tile]!=='water')return false;
  const fish=a.type==='life-cast',target=now+(fish?1700+((w.seed+a.tile+w.revision)%1300):900);
  lp.work={tile:a.tile,kind:fish?'fish':'gather',started:now,target,expires:target+(fish?1800:1400)};lp.lastAction=now;return tell(fish?'浮きが沈んだら引き上げよう！':'光るタイミングで道具を振ろう！');
 }
 if(a.type==='life-hit'||a.type==='life-reel'){
  const work=lp.work;if(!work||(a.type==='life-hit')!==(work.kind==='gather'))return false;
  lp.work=undefined;lp.lastAction=now;
  if(distance(p,{x:work.tile%WIDTH,y:Math.floor(work.tile/WIDTH)})>2)return false;
  const perfect=Math.abs(now-work.target)<450;
  lp.effect={tile:work.tile,at:now,kind:work.kind,perfect};
  if(work.kind==='fish'){
   if(now<work.target||now>work.expires)return tell('魚が逃げました。浮きが沈んでから引き上げましょう。');
   lp.bag.fish=(lp.bag.fish||0)+(perfect?2:1);return tell(perfect?'大成功！魚を2匹釣りました！':'魚が釣れました！');
  }
  if(now<work.started+350||now>work.expires)return tell('タイミングを合わせてもう一度！');
  const node=natureAt(w,work.tile);if(!node||!resourceReady(w,work.tile))return tell('この資源は再生を待っています。');
  const state=life.nodes[work.tile]??={hits:0,regrowAt:0};state.hits+=perfect?2:1;
  if(state.hits>=node.hardness){state.hits=0;state.regrowAt=now+180000;lp.bag[node.material]=(lp.bag[node.material]||0)+node.amount;p.interactionCount++;return tell('採取成功！素材をバッグに入れました。');}
  return tell(perfect?'大成功！大きく削れました！':'手応えあり！続けて採取しよう。');
 }
 return false;
}
export function advanceLife(w:World,now:number){
 const life=w.life;if(!life)return;
 const elapsed=Math.max(0,Math.min(1,(now-life.lastTick)/1000));life.lastTick=now;life.now=now;life.time+=elapsed;
 if(w.ended){for(const p of Object.values(w.players))if(p.life)p.life.work=undefined;return;}
 let changed=false;
 for(const [tile,node]of Object.entries(life.nodes))if(node.regrowAt&&now>=node.regrowAt&&!Object.values(w.players).some(p=>p.x===Number(tile)%WIDTH&&p.y===Math.floor(Number(tile)/WIDTH))){delete life.nodes[Number(tile)];changed=true;}
 for(const p of Object.values(w.players))if(p.life?.effect){changed=true;if(now-p.life.effect.at>700)p.life.effect=undefined;}
 for(const p of Object.values(w.players))if(p.life?.work){changed=true;if(now>p.life.work.expires){p.life.work=undefined;p.message='タイミングを合わせてもう一度！';}}
 if(Object.keys(life.games).length){const host=homeGameWorld(w);for(let remaining=elapsed;remaining>0;remaining-=.05)tickGames(host,Math.min(.05,remaining));life.games=host.games;changed=true;}
 if(changed)w.revision++;
}
