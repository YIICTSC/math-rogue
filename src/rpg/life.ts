import {landmarkBlock,landscapeHeight} from './worldLandscape';
import {currentVoxelRoom} from './voxelRooms';
import {ALL_MATERIAL_NAMES,TOOL_RANK,type ToolKind,type ToolTier} from './voxelCatalog';
import {occupiedFarmTile} from './farm/model';
import {occupiedCityTile} from './city/model';
import {resident} from './social';
import {chooseFish,reelWindow,fishSize,recordFish,type FishingRun,type FishRecords,type FishCatch} from './fishing';
import {energyOf,GATHER_ENERGY_COST,GATHER_ENERGY_MAX} from './energy';
import {ROOM_DOOR,ROOM_SPAWN,newInterior,furnishing,furnitureDistance,placementFits,roomWalkable,type Interior,type PlacedFurniture} from './homeCatalog';
import { BIOMES, biomeAt, biomeWeights, type BiomeId } from './biomes';
import { WIDTH, HEIGHT, distance, type World, type Adventurer } from './engine';
import { grant, pendingMutation } from './activities';
import { CARDS_LIBRARY } from '../constants';
import type { Relic } from '../types';
import { RECIPES as CRAFT_RECIPES } from '../mini-games/gakuro-craft/materials';
import { gameCommand, tickGames, type GameCommand, type HomeGame, type HomeGameWorld } from '../mini-games/gakuro-craft/homeGames';
import type { Home } from '../mini-games/gakuro-craft/progression';

export const MATERIAL_NAMES = ALL_MATERIAL_NAMES;
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
 if(occupiedCityTile(w,tile)||occupiedFarmTile(w,tile))return null;
 if(!isResourceTile(w,tile)||w.tiles[tile]!=='forest')return null;
 const season=Math.floor((w.town?.day||0)/7)%4;const key=`${w.seed}:${tile}:${season}`,cached=natureCache.get(key);if(cached)return cached;
 const x=tile%WIDTH,y=Math.floor(tile/WIDTH);
 const hash=(Math.imul(tile+1,374761393)^w.seed)>>>0;
 let roll=((hash>>>8)%10000)/10000,region=biomeAt(x,y).id;
 for(const [i,weight] of biomeWeights(x,y).entries()){roll-=weight;if(roll<=0){region=BIOMES[i].id;break;}}
 const choices=vegetation[region];
 const baseSprite=choices[hash%choices.length],snowy=season===3&&[0,1,2,4,17].includes(baseSprite);const sprite=snowy?(baseSprite===1?10:9):baseSprite;
 const result: NatureNode = {sprite,name:snowy?'雪化粧の木':NATURE[sprite][0],material:NATURE[baseSprite][1],hardness:NATURE[baseSprite][2],amount:NATURE[baseSprite][3],rock:[8,11,12,13,14,15].includes(sprite)};
 if(natureCache.size>25000)natureCache.clear();natureCache.set(key,result);return result;
}
export interface Work {tile:number;kind:'gather'|'fish';started:number;target:number;expires:number;fishing?:FishingRun}
export interface LifePlayer {tools?:Partial<Record<ToolKind,ToolTier>>;workshopAt?:number;hoe?:boolean;pickaxe?:ToolTier;fishRecords?:FishRecords;fishCastCount?:number;lastCatch?:FishCatch;energy?:number;bag:Bag;homeId?:string;indoors?:string;roomPos?:{x:number;y:number};roomMoveAt?:number;work?:Work;lastAction:number;crafted:string[];effect?:{tile:number;at:number;kind:string;perfect:boolean}}
export interface House {id:string;owner:string;ownerName:string;x:number;y:number;biome:BiomeId;home:Home;interior?:Interior;invitedAt:number}
export interface LifeWorld {nodes:Record<number,{hits:number;regrowAt:number}>;houses:House[];games:Record<string,HomeGame>;now:number;time:number;lastTick:number}
export type LifeAction = {type:'life-work'|'life-cast';tile:number}|{type:'life-reel';phaseTarget?:number}|{type:'life-hit'|'life-cancel'|'life-leave'|'life-build'|'life-invite'}|{type:'life-craft';recipe:string}|{type:'life-enter';houseId:string}|{type:'life-game';command:GameCommand}|{type:'life-room-move';dx:number;dy:number}|{type:'life-furniture-craft';item:string}|{type:'life-place';item:string;x:number;y:number;rotation:0|1|2|3;flipped?:boolean}|{type:'life-pack';id:string}|{type:'life-rotate';id:string;direction?:1|-1;flip?:boolean};
export const createLife=(now:number):LifeWorld=>({nodes:{},houses:[],games:{},now,time:0,lastTick:now});
export const lifePlayer=(p:Adventurer):LifePlayer=>p.life??={energy:GATHER_ENERGY_MAX,bag:{wood:4,stone:2},lastAction:0,crafted:[]};
export const resourceReady=(w:World,tile:number)=>!(w.life?.nodes[tile]?.regrowAt);
export function lifeWalkable(w:World,x:number,y:number){const tile=y*WIDTH+x;return x>0&&y>0&&x<WIDTH-1&&y<HEIGHT-1&&!landmarkBlock(x,landscapeHeight(w.seed,x,y)+1,y)&&w.tiles[tile]!=='water'&&!([0,1].some(h=>!!w.voxels?.edits[`${x},${h},${y}`]&&w.voxels?.edits[`${x},${h},${y}`]!=='door'))&&(w.tiles[tile]!=='forest'||occupiedCityTile(w,tile)||occupiedFarmTile(w,tile)||!!w.life?.nodes[tile]?.regrowAt);}
export const RECIPES = [
 {id:'door',name:'ドア',cost:{plank:3,ore:1} as Bag,kind:'material',description:'囲った空間を自宅や共用施設にする入口。',sprite:0},
 {id:'hoe',name:'クワ',cost:{wood:2,ore:2} as Bag,kind:'tool',description:'前の1マスを耕して農地にする道具。',sprite:2},
 {id:'pickaxe-stone',name:'石のツルハシ',cost:{wood:2,stone:3} as Bag,kind:'tool',description:'硬いブロックの採掘エネルギーを25%軽減。',sprite:2},
 {id:'pickaxe-iron',name:'鉄のツルハシ',cost:{plank:2,ore:3} as Bag,kind:'tool',description:'硬いブロックの採掘エネルギーを50%軽減。',sprite:2},
 {id:'pickaxe-steel',name:'鋼のツルハシ',cost:{plank:3,steel:3,crystal:1} as Bag,kind:'tool',description:'硬いブロックの採掘エネルギーを70%軽減。',sprite:2},
 {id:'plank',name:'木の板',cost:CRAFT_RECIPES.plank as Bag,kind:'material',description:'家や家具の材料。',sprite:0},
 {id:'brick',name:'レンガ',cost:CRAFT_RECIPES.brick as Bag,kind:'material',description:'家や家具の材料。',sprite:1},
 {id:'sword',name:'鉄の剣',cost:{plank:2,ore:3} as Bag,kind:'weapon',description:'専用カード：14ダメージ、びくびく2。',sprite:2},
 {id:'frostbow',name:'霜木の弓',cost:{frostwood:4,reed:3,ore:1} as Bag,kind:'weapon',description:'専用カード：10ダメージ、ブロック8。',sprite:3},
 {id:'charm',name:'森の護符',cost:{herb:4,crystal:2,wood:2} as Bag,kind:'relic',description:'戦闘開始時、ブロック4・HP回復2。',sprite:4},
 {id:'crystal',name:'星晶のレリック',cost:{crystal:5,ore:3} as Bag,kind:'relic',description:'戦闘開始時、筋力1・追加ドロー1。',sprite:5},
 {id:'meal',name:'川魚のスープ',cost:{fish:2,herb:1} as Bag,kind:'meal',description:'HPを20回復。',sprite:6},
 {id:'housekit',name:'家の建築キット',cost:{plank:6,brick:2} as Bag,kind:'material',description:'草地に自分の家を建てるキット。',sprite:7},
 {id:'darts',name:'ダーツ台',cost:{plank:3,ore:1} as Bag,kind:'furniture',description:'家で最大4人のダーツ対戦。',sprite:8},
 {id:'billiards',name:'ビリヤード台',cost:{plank:4,stone:4} as Bag,kind:'furniture',description:'家で最大4人の8ボール対戦。',sprite:9},
 {id:'arcade',name:'ゲーム機',cost:{plank:3,crystal:2} as Bag,kind:'furniture',description:'家で最大4人のブロック崩し対戦。',sprite:10},
] as const;
export const HOUSE_COST:Bag={housekit:1};
export function canAfford(bag:Bag,cost:Bag){return Object.entries(cost).every(([key,n])=>(bag[key as Material]||0)>=n!);}
function spend(bag:Bag,cost:Bag){for(const [key,n]of Object.entries(cost))bag[key as Material]=(bag[key as Material]||0)-n!;}
export function homeGameWorld(w:World):HomeGameWorld {
 const life=w.life!,tiles:Array<{homeOwner?:string}>=Array(WIDTH*HEIGHT),homeViews:Record<number,Home>={};
 for(const h of life.houses){tiles[h.home.tile]={homeOwner:h.owner};homeViews[h.home.tile]=h.home;}
 for(const [i,r] of (w.voxelRooms||[]).entries()){const tile=WIDTH*HEIGHT+i+1;tiles[tile]={homeOwner:r.owner};homeViews[tile]={tile,level:1,furniture:r.furniture.filter(f=>furnishing(f.item)?.game).map((f,index)=>({slot:f.slot??index,item:f.item}))};}
 const players=Object.fromEntries(Object.values(w.players).filter(p=>!p.spectator).map(p=>{const house=life.houses.find(h=>h.id===p.life?.indoors),room=currentVoxelRoom(w,p),voxelHome=room&&(room.owner===p.id||room.shared)?homeViews[WIDTH*HEIGHT+(w.voxelRooms?.indexOf(room)||0)+1]:undefined;return [p.id,{id:p.id,name:p.name,indoors:!!house||!!voxelHome,homeTile:house?.home.tile??voxelHome?.tile,progress:{home:house?.home||voxelHome||{tile:-1,level:0,furniture:[]}}}];}));
 return {tiles,homeViews,players,games:life.games,time:life.time,paused:w.ended||!w.started};
}
export function interiorOf(h:House):Interior {
 if(h.interior)return h.interior;
 const room=newInterior(),positions=[{x:5,y:3},{x:10,y:7},{x:3,y:7}];
 h.home.furniture.filter(f=>['darts','billiards','arcade'].includes(f.item)).forEach((f,i)=>room.placed.push({id:`legacy-${f.slot}`,item:f.item,...positions[i%3],rotation:0,slot:f.slot}));return room;
}
function enterHouse(w:World,p:Adventurer,h:House){delete p.position3D;const lp=lifePlayer(p);h.interior??=interiorOf(h);lp.indoors=h.id;lp.roomPos={...ROOM_SPAWN};lp.work=undefined;}
function leaveHouse(w:World,p:Adventurer,now:number){delete p.position3D;const lp=lifePlayer(p),h=w.life.houses.find(h=>h.id===lp.indoors);if(h){const exit=[{x:h.x,y:h.y+1},{x:h.x+1,y:h.y},{x:h.x-1,y:h.y},{x:h.x,y:h.y-1}].find(q=>lifeWalkable(w,q.x,q.y)&&!w.life.houses.some(home=>home.x===q.x&&home.y===q.y));if(exit){p.x=exit.x;p.y=exit.y;}}lp.indoors=undefined;lp.roomPos=undefined;lp.work=undefined;tickGames(homeGameWorld(w),0);}
export function applyLifeAction(w:World,p:Adventurer,a:LifeAction,now:number):boolean {
 const life=w.life??=createLife(now),lp=lifePlayer(p);
 const tell=(text:string)=>{p.message=text;w.revision++;return true;};
 if(a.type==='life-cancel'){lp.work=undefined;return tell('作業を中断しました。');}
 if(a.type==='life-leave'){leaveHouse(w,p,now);return tell('家から外へ出ました。');}
 if(a.type==='life-room-move'){
  const h=life.houses.find(h=>h.id===lp.indoors);if(!h||!Number.isInteger(a.dx)||!Number.isInteger(a.dy)||Math.abs(a.dx)+Math.abs(a.dy)!==1||now-(lp.roomMoveAt||0)<110)return false;
  h.interior??=interiorOf(h);const pos=lp.roomPos||ROOM_SPAWN,x=pos.x+a.dx,y=pos.y+a.dy;if(!roomWalkable(h.interior,x,y))return false;
  lp.roomPos={x,y};lp.roomMoveAt=now;if(x===ROOM_DOOR.x&&y===ROOM_DOOR.y){leaveHouse(w,p,now);return tell('家から外へ出ました。');}w.revision++;return true;
 }
 if(w.ended||!w.started||p.spectator||p.nativeScene||p.duelId||p.dungeonId||p.arcadePending||pendingMutation(p)||w.activities.trades.some(t=>t.from===p.id||t.to===p.id))return false;
 if(a.type==='life-game'){
  if(!lp.indoors||!a.command||typeof a.command.type!=='string'||!['game_rules','game_expedition','game_relic','game_join','game_leave','game_start','game_dart','game_shot','game_cue','game_paddle','game_board','game_roll','game_bowl','game_react','game_rhythm_select','game_rhythm_ready','game_rhythm_pause','game_rhythm_hit'].includes(a.command.type))return false;
  if(a.command.type==='game_join'){const slot=a.command.slot;const h=life.houses.find(h=>h.id===lp.indoors),f=h&&interiorOf(h).placed.find(f=>f.slot===slot);if(!f||furnitureDistance(lp.roomPos||ROOM_SPAWN,f)>2)return tell('ゲーム家具の近くへ移動してください。');}
  const host=homeGameWorld(w),reply=gameCommand(host,host.players[p.id],a.command);life.games=host.games;if(reply?.type==='notice')p.message=reply.text;w.revision++;return true;
 }
 if(a.type==='life-enter'){
  const h=life.houses.find(h=>h.id===a.houseId);if(!h||distance(p,h)>2||lp.work||lp.indoors)return false;
  enterHouse(w,p,h);return tell('家へようこそ！家具からゲームに参加できます。');
 }
 if(a.type==='life-invite'){
  const h=life.houses.find(h=>h.id===(lp.indoors||lp.homeId)&&resident(w,h.id,p.id))||life.houses.find(h=>h.owner===p.id);if(!h||now-h.invitedAt<5000)return false;
  h.invitedAt=now;w.logs=['仲間を募集中！',...w.logs].slice(0,8);return tell('家の場所をみんなに知らせました。');
 }
 if(['life-furniture-craft','life-place','life-pack','life-rotate'].includes(a.type)){
  const h=life.houses.find(h=>h.id===lp.indoors);if(!h||!resident(w,h.id,p.id)||lp.work)return tell('家具の作成・配置は自分の家の中で行えます。');
  const room=h.interior??=interiorOf(h),occupants=Object.values(w.players).filter(q=>q.life?.indoors===h.id).map(q=>q.life?.roomPos||ROOM_SPAWN);
  if(a.type==='life-furniture-craft'){
   if(a.item?.startsWith('season'))return tell('花と記念品の家具は暮らしの画面で作れます。');
   const f=furnishing(a.item);if(!f||!canAfford(lp.bag,f.cost))return tell('材料が足りません。');if(Object.values(room.stock).reduce((a,b)=>a+b,0)>=40)return tell('家具の持ち物がいっぱいです。');
   spend(lp.bag,f.cost);room.stock[f.id]=(room.stock[f.id]||0)+1;return tell('家具を作りました。持ち物から場所を選んで飾れます。');
  }
  if(a.type==='life-place'){
   const f=furnishing(a.item);if(!f||!Number.isInteger(a.rotation)||![0,1,2,3].includes(a.rotation)||(a.flipped!==undefined&&typeof a.flipped!=='boolean')||!(room.stock[f.id]>0)||room.placed.length>=48)return false;
   const placed:PlacedFurniture={id:`decor-${w.revision}`,item:f.id,x:a.x,y:a.y,rotation:a.rotation,flipped:a.flipped??false};if(!placementFits(room,placed,occupants))return tell('家具や入口・通路に重ならない場所を選んでください。');
   if(f.game){let slot=2;while(h.home.furniture.some(f=>f.slot===slot))slot++;placed.slot=slot;h.home.furniture.push({slot,item:f.game});}
   room.stock[f.id]--;room.placed.push(placed);return tell('家具を飾りました！');
  }
  if(a.type==='life-pack'||a.type==='life-rotate'){
   const placed=room.placed.find(f=>f.id===a.id);if(!placed)return false;
   if(placed.slot!==undefined&&Object.values(life.games).some(g=>g.homeTile===h.home.tile&&g.slot===placed.slot&&g.phase==='playing'))return tell('対戦中の家具は変更できません。');
   if(a.type==='life-rotate'){if((a.direction!==undefined&&a.direction!==1&&a.direction!==-1)||(a.flip!==undefined&&typeof a.flip!=='boolean'))return false;const next={...placed,rotation:(a.flip?placed.rotation:(placed.rotation+(a.direction??1)+4)%4) as 0|1|2|3,flipped:a.flip?!placed.flipped:placed.flipped};if(!placementFits(room,next,occupants))return tell('家具や入口・通路に重ならない場所を選んでください。');placed.rotation=next.rotation;placed.flipped=next.flipped;return tell('家具を回転しました。');}
   if(Object.values(room.stock).reduce((a,b)=>a+b,0)>=40)return tell('家具の持ち物がいっぱいです。');
   room.placed=room.placed.filter(f=>f.id!==placed.id);room.stock[placed.item]=(room.stock[placed.item]||0)+1;
   if(placed.slot!==undefined){h.home.furniture=h.home.furniture.filter(f=>f.slot!==placed.slot);delete life.games[`${h.home.tile}:${placed.slot}`];}
   return tell('家具を持ち物に戻しました。');
  }
 }
 if(a.type==='life-craft'){
  if(lp.work)return false;
  const r=RECIPES.find(r=>r.id===a.recipe);if(!r||!canAfford(lp.bag,r.cost))return tell('材料が足りません。');
  if((r.kind==='weapon'||r.kind==='relic'||r.kind==='tool')&&lp.crafted.includes(r.id))return tell('この装備は作成済みです。');
  const house=life.houses.find(h=>h.owner===p.id);
  if(r.kind==='furniture'&&(!house||lp.indoors!==house.id))return tell('自分の家の中で家具を作れます。');
  if(r.id==='housekit'&&(house||(lp.bag.housekit||0)>0))return tell('建築キットか家をすでに持っています。');
  if(r.kind==='furniture'&&Object.values((house!.interior??=interiorOf(house!)).stock).reduce((a,b)=>a+b,0)>=40)return tell('家具の持ち物がいっぱいです。');
  if(r.kind==='meal'&&p.hp>=p.maxHp)return tell('HPは満タンです。');
  spend(lp.bag,r.cost);
  if(r.kind==='tool'&&r.id==='hoe'){lp.hoe=true;lp.crafted.push(r.id);}
  if(r.kind==='tool'&&r.id.startsWith('pickaxe-')){const rank=TOOL_RANK,tool=r.id.slice(8) as ToolTier;if(rank.indexOf(tool)>rank.indexOf(lp.pickaxe!))lp.pickaxe=tool;lp.crafted.push(r.id);}
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
  if(r.kind==='furniture'){const room=house!.interior??=interiorOf(house!);room.stock[r.id]=(room.stock[r.id]||0)+1;}
  lp.effect={tile:p.y*WIDTH+p.x,at:now,kind:'craft',perfect:true};return tell('クラフトしました！');
 }
 if(a.type==='life-build'){
  if(lp.indoors||lp.work||life.houses.some(h=>h.owner===p.id))return false;
  if(!canAfford(lp.bag,HOUSE_COST))return tell('材料が足りません。');
  if(occupiedCityTile(w,p.y*WIDTH+p.x)||occupiedFarmTile(w,p.y*WIDTH+p.x)||w.tiles[p.y*WIDTH+p.x]!=='grass'||[1,-1,WIDTH,-WIDTH].some(d=>w.tiles[p.y*WIDTH+p.x+d]==='water')||w.sites.some(s=>distance(s,p)<4)||life.houses.some(h=>distance(h,p)<5))return tell('道・水辺・施設から離れた草地に建てましょう。');
  spend(lp.bag,HOUSE_COST);const id=`home-${p.id}`,tile=p.y*WIDTH+p.x;
  life.houses.push({id,owner:p.id,ownerName:p.name,x:p.x,y:p.y,biome:biomeAt(p.x,p.y).id,home:{tile,level:1,furniture:[{slot:0,item:'workbench'},{slot:1,item:'table'}]},interior:newInterior(),invitedAt:0});lp.homeId=id;enterHouse(w,p,life.houses[life.houses.length-1]);return tell('家を建てました！家具を作って仲間を招きましょう。');
 }
 if(lp.indoors)return false;
 if(a.type==='life-work'||a.type==='life-cast'){
  if(lp.work||now-lp.lastAction<350||!Number.isInteger(a.tile)||a.tile<0||a.tile>=w.tiles.length)return false;
  const x=a.tile%WIDTH,y=Math.floor(a.tile/WIDTH);if(x<1||y<1||x>=WIDTH-1||y>=HEIGHT-1||distance(p,{x,y})>2)return false;
  if(a.type==='life-work'&&(!natureAt(w,a.tile)||!resourceReady(w,a.tile)))return tell('この資源は再生を待っています。');
  if(a.type==='life-cast'&&w.tiles[a.tile]!=='water')return false;
  if(energyOf(lp)<GATHER_ENERGY_COST)return tell('エネルギーが足りません。問題に正解して回復しましょう。');
  lp.energy=energyOf(lp)-GATHER_ENERGY_COST;
  life.now=now;const fish=a.type==='life-cast',target=now+(fish?1700+((w.seed+a.tile+w.revision)%1300):900);
  const nonce=lp.fishCastCount||0;if(fish)lp.fishCastCount=nonce+1;const species=fish?chooseFish(w.seed,a.tile,nonce):undefined;
  lp.work={tile:a.tile,kind:fish?'fish':'gather',started:now,target,expires:target+(fish?Math.max(900,reelWindow(species!.id)*2):1400),...(fish?{fishing:{id:species!.id,phase:'bite' as const,beat:0,hits:0,perfect:0,nonce}}:{})};lp.lastAction=now;return tell(fish?'浮きが沈んだら引き上げよう！':'光るタイミングで道具を振ろう！');
 }
 if(a.type==='life-hit'||a.type==='life-reel'){
  const work=lp.work;if(!work||(a.type==='life-hit')!==(work.kind==='gather'))return false;
  if(work.kind==='fish'&&work.fishing){
   const run=work.fishing,window=reelWindow(run.id);if(a.type==='life-reel'&&a.phaseTarget!==work.target)return false;lp.lastAction=now;
   if(distance(p,{x:work.tile%WIDTH,y:Math.floor(work.tile/WIDTH)})>2){lp.work=undefined;return false;}
   if(run.phase==='bite'){
    if(now<work.target||now>work.expires){lp.work=undefined;return tell('魚が逃げました。浮きが沈んでから引き上げましょう。');}
    run.phase='reel';run.perfect=now-work.target<window/2?1:0;
   }else{
    if(Math.abs(now-work.target)<=window){run.hits++;if(Math.abs(now-work.target)<window/2)run.perfect++;}
    run.beat++;
    if(run.beat>=3){
     lp.work=undefined;if(run.hits<2)return tell('糸が切れました。光る範囲で巻きましょう。');
     const size=fishSize(run.id,w.seed,work.tile,run.nonce,run.perfect),perfect=run.perfect>=3,records=lp.fishRecords??={};
     lp.lastCatch={id:run.id,size,perfect,record:recordFish(records,{id:run.id,size,perfect}),at:now};lp.bag.fish=(lp.bag.fish||0)+(perfect?2:1);p.interactionCount++;lp.effect={tile:work.tile,at:now,kind:'fish',perfect};
     return tell(lp.lastCatch.record?'釣れました！サイズ記録を更新！':'釣れました！図鑑に記録しました。');
    }
    if(run.beat-run.hits>=2){lp.work=undefined;return tell('糸が切れました。光る範囲で巻きましょう。');}
   }
   life.now=now;work.started=now;work.target=now+1050+((w.seed+run.beat*271+work.tile)%450);work.expires=work.target+window+450;return tell('光る範囲で巻いて、魚を引き寄せよう！');
  }
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
 for(const p of Object.values(w.players))if(p.life?.work){changed=true;if(now>p.life.work.expires){const fish=p.life.work.kind==='fish';p.life.work=undefined;p.message=fish?'魚が逃げました。浮きが沈んでから引き上げましょう。':'タイミングを合わせてもう一度！';}}
 if(Object.keys(life.games).length){const host=homeGameWorld(w);for(let remaining=elapsed;remaining>0;remaining-=.05)tickGames(host,Math.min(.05,remaining));life.games=host.games;changed=true;}
 if(changed)w.revision++;
}
