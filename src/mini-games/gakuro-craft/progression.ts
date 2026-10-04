import {MAP_WIDTH,MAP_TILES,CENTER_X,CENTER_Z,mapInside} from './map';
import {DEFAULT_PET,PETS,petKindOf,petNameOf,type PetKind} from './pets';
import {enterHome,roomTile,roomHome} from './homeSocial';
import type { Building, Material, Player, Reply, World } from './engine';

export type WorkStat = 'gather'|'plant'|'water'|'harvest'|'fish'|'craft'|'donate';
export const WORK_STATS:WorkStat[]=['gather','plant','water','harvest','fish','craft','donate'];
export const HOME_ITEMS = {
 rhythm:['音ゲー筐体','🎵',14,'game'],
 reversi:['リバーシ台','⚫',8,'game'],connectfour:['四目並べ台','🔴',8,'game'],memory:['神経衰弱テーブル','🃏',6,'game'],race:['すごろくテーブル','🎲',8,'game'],bowling:['ボウリングレーン','🎳',12,'game'],reaction:['反応ゲーム機','💡',10,'game'],
 plushBear:['くまのぬいぐるみ','🧸',4,'decor'],plushBunny:['うさぎのぬいぐるみ','🐰',4,'decor'],darts:['ダーツ台','🎯',8,'game'],billiards:['ビリヤード台','🎱',12,'game'],arcade:['ゲーム機','🕹',10,'game'],
 bed:['ベッド','🛏',6,'rest'],sofa:['ソファ','🛋',5,'rest'],desk:['学習机','📚',5,'study'],bookshelf:['本棚','📖',4,'study'],stove:['キッチン','🍳',6,'cook'],workbench:['作業台','🔨',5,'work'],wardrobe:['クローゼット','👕',4,'dress'],chair:['チェア','🪑',2,'rest'],table:['テーブル','☕',3,'rest'],rug:['ラグ','🟨',2,'decor'],clock:['置き時計','🕰',3,'decor'],aquarium:['水槽','🐠',5,'decor'],piano:['ピアノ','🎹',8,'music'],cushion:['クッション','🟣',2,'rest'],plant:['観葉植物','🪴',3,'decor'],painting:['絵画スタンド','🖼',4,'decor'],cabinet:['キャビネット','🗄',4,'work'],bath:['バスタブ','🛁',7,'rest'],bench:['ベンチ','🪑',3,'rest'],lamp:['ランタン','🏮',3,'decor'],flower:['花壇','🌷',2,'decor'],campfire:['たき火','🔥',4,'cook']
} as const;
export type HomeItem=keyof typeof HOME_ITEMS;
export type HomePet={kind?:PetKind;name:string;affection:number;careAt:number};
export type Home = {pet?:HomePet;tile:number;level:number;furniture:{slot:number;item:HomeItem;rotation?:number}[];stock?:Partial<Record<HomeItem,number>>;restUntil?:number;usedDay?:Partial<Record<HomeItem,number>>};
export type Progress = {stats:Record<WorkStat,number>;active:string[];claimed:string[];daily:{day:number;stats:Record<WorkStat,number>;claimed:string[]};home:Home};
export const STAGES=[{name:'キャンプ地',need:0,facility:'広場の掲示板'},{name:'小さな集落',need:40,facility:'資材のお店'},{name:'にぎやかな村',need:140,facility:'家具のお店'},{name:'学園の町',need:360,facility:'建築資材のお店'},{name:'緑の学園都市',need:800,facility:'花いっぱいのお店'}];
export const HOME_NAMES=['土地を探す','小さな家','広い家','工房つきの家'];
export const HOME_SIZES=[0,4,6,8];
export const HOME_COSTS:Partial<Record<Material,number>>[]=[{wood:6,stone:4},{plank:8,stone:8},{plank:18,stone:16}];
export const HOME_COINS=[0,12,40];
export const FURNITURE=Object.keys(HOME_ITEMS) as HomeItem[];
type Quest={id:string;resident:string;title:string;description:string;stat:WorkStat|'home'|'decor';target:number;stage:number;coins:number;reward:Partial<Record<Material,number>>};
export const QUESTS:Quest[]=[
 {id:'gather',resident:'ソラ',title:'はじめての素材集め',description:'木や石を2回採集しよう。',stat:'gather',target:2,stage:0,coins:4,reward:{seed:3}},
 {id:'craft',resident:'ソラ',title:'自分でつくってみよう',description:'材料から2回クラフトしよう。',stat:'craft',target:2,stage:0,coins:5,reward:{plank:2}},
 {id:'harvest',resident:'ミドリ',title:'畑のある暮らし',description:'畑の作物を2回収穫しよう。',stat:'harvest',target:2,stage:0,coins:8,reward:{flower:1}},
 {id:'fish',resident:'ミナト',title:'釣りびより',description:'魚を3匹釣ろう。',stat:'fish',target:3,stage:0,coins:8,reward:{lamp:1}},
 {id:'donate',resident:'ミドリ',title:'みんなの広場へ',description:'広場へ3回納品しよう。',stat:'donate',target:3,stage:0,coins:10,reward:{bench:1}},
 {id:'home',resident:'ソラ',title:'わたしの家をつくろう',description:'島に自分の家の入口を建てよう。',stat:'home',target:1,stage:0,coins:8,reward:{lamp:1,flower:1}},
 {id:'decor',resident:'ミドリ',title:'お気に入りの部屋',description:'家の中に家具を3個飾ろう。',stat:'decor',target:3,stage:1,coins:15,reward:{bench:1,plank:4}},
 {id:'expand',resident:'ソラ',title:'工房のある暮らし',description:'家を工房つきの家まで拡張しよう。',stat:'home',target:3,stage:2,coins:25,reward:{lamp:2,flower:3}},
];
const dailyDefs:Quest[]=[{id:'day_harvest',resident:'ミドリ',title:'今日の収穫のお手伝い',description:'今日、畑の作物を1回収穫しよう。',stat:'harvest',target:1,stage:0,coins:5,reward:{seed:2}},{id:'day_fish',resident:'ミナト',title:'今日の魚の便り',description:'今日、魚を2匹釣ろう。',stat:'fish',target:2,stage:0,coins:5,reward:{crop:1}},{id:'day_donate',resident:'ミドリ',title:'今日の広場のお手伝い',description:'今日、広場へ2回納品しよう。',stat:'donate',target:2,stage:0,coins:5,reward:{flower:1}}];
const counters=()=>Object.fromEntries(WORK_STATS.map(k=>[k,0])) as Record<WorkStat,number>;
export function newProgress():Progress{return {stats:counters(),active:[],claimed:[],daily:{day:0,stats:counters(),claimed:[]},home:{tile:-1,level:0,furniture:[]}};}
export function migrateProgress(raw:unknown):Progress{
 const result=newProgress();if(!raw||typeof raw!=='object')return result;const p=raw as Progress;
 for(const k of WORK_STATS)if(Number.isSafeInteger(p.stats?.[k])&&p.stats[k]>=0)result.stats[k]=p.stats[k];
 result.claimed=Array.isArray(p.claimed)?[...new Set(p.claimed.filter(id=>QUESTS.some(q=>q.id===id)))]:[];
 result.active=Array.isArray(p.active)?[...new Set(p.active.filter(id=>QUESTS.some(q=>q.id===id)))].slice(0,3):[];
 if(Number.isSafeInteger(p.daily?.day)&&p.daily.day>=0){result.daily.day=p.daily.day;for(const k of WORK_STATS)if(Number.isSafeInteger(p.daily.stats?.[k])&&p.daily.stats[k]>=0)result.daily.stats[k]=p.daily.stats[k];result.daily.claimed=Array.isArray(p.daily.claimed)?[...new Set(p.daily.claimed.filter(id=>dailyDefs.some(q=>q.id===id)))]:[];}
 if(p.home&&Number.isInteger(p.home.tile)&&p.home.tile>=0&&p.home.tile<MAP_TILES&&Number.isInteger(p.home.level)&&p.home.level>=1&&p.home.level<=3){result.home.tile=p.home.tile;result.home.level=p.home.level;const petKind=petKindOf(p.home.pet?.kind);result.home.pet={kind:petKind,name:petNameOf(p.home.pet?.name,petKind),affection:Number.isFinite(p.home.pet?.affection)?Math.max(0,Math.min(100,p.home.pet!.affection)):30,careAt:Number.isFinite(p.home.pet?.careAt)?p.home.pet!.careAt:-10};const slots=new Set<number>();result.home.furniture=Array.isArray(p.home.furniture)?p.home.furniture.filter(f=>Number.isInteger(f.slot)&&f.slot>=0&&f.slot<HOME_SIZES[p.home.level]**2&&FURNITURE.includes(f.item)&&!slots.has(f.slot)&&!!slots.add(f.slot)).map(f=>({...f,rotation:Number.isInteger(f.rotation)?(f.rotation!%4+4)%4:0})):[];result.home.stock={};for(const item of FURNITURE){const n=p.home.stock?.[item];if(Number.isSafeInteger(n)&&n!>=0)result.home.stock[item]=n;}result.home.usedDay=p.home.usedDay||{};result.home.restUntil=Number.isFinite(p.home.restUntil)?p.home.restUntil:0;}
 return result;
}
export function refreshDay(w:World,p:Player){const day=Math.floor(w.time/240);if(p.progress.daily.day!==day)p.progress.daily={day,stats:counters(),claimed:[]};}
export function village(w:World){const score=w.donated*3+w.harvested*2+(w.builtSites?.length||0)*2;const level=Math.max(w.villageLevel||0,STAGES.reduce((n,s,i)=>score>=s.need?i:n,0));return {score,level,stage:STAGES[level],next:STAGES[level+1]};}
export function recordWork(w:World,p:Player,kind:string,tile:number,amount=1){refreshDay(w,p);if(WORK_STATS.includes(kind as WorkStat)){p.progress.stats[kind as WorkStat]+=amount;p.progress.daily.stats[kind as WorkStat]+=amount;}if(kind==='build'&&!w.builtSites.includes(tile))w.builtSites.push(tile);w.villageLevel=village(w).level;}
export function questRows(w:World,p:Player){const day=Math.floor(w.time/240),daily=p.progress.daily.day===day?p.progress.daily:null;return [...QUESTS.map(q=>({...q,daily:false,value:q.stat==='home'?p.progress.home.level:q.stat==='decor'?p.progress.home.furniture.length:p.progress.stats[q.stat],claimed:p.progress.claimed.includes(q.id),accepted:p.progress.active.includes(q.id)})),...dailyDefs.map(q=>({...q,daily:true,value:daily?.stats[q.stat as WorkStat]||0,claimed:daily?.claimed.includes(q.id)||false,accepted:true}))];}
export function shopRows(w:World){const level=village(w).level;return [{material:'seed' as Material,price:2},{material:'flower' as Material,price:level>=4?3:5},...(level>=1?[{material:'plank' as Material,price:3},{material:'brick' as Material,price:3}]:[]),...(level>=2?[{material:'bench' as Material,price:6},{material:'lamp' as Material,price:5}]:[]),...(level>=3?[{material:'window' as Material,price:5},{material:'roof' as Material,price:6}]:[])];}
const notice=(text:string,cue?:string):Reply=>({type:'notice',text,cue});
export function progressCommand(w:World,p:Player,raw:unknown):Reply|undefined{
 if(!raw||typeof raw!=='object')return;const c=raw as {type:string;id?:string;slot?:number;item?:HomeItem;tile?:number;rotation?:number;target?:number;name?:string;petKind?:PetKind;petName?:string};const home=p.progress.home,size=MAP_WIDTH;refreshDay(w,p);
 if(c.type==='quest_accept'){const q=QUESTS.find(q=>q.id===c.id);if(!q||p.progress.claimed.includes(q.id)||p.progress.active.includes(q.id))return;if(village(w).level<q.stage)return notice('島が発展すると受けられる依頼です。');if(p.progress.active.length>=3)return notice('受注できる依頼は3件までです。');p.progress.active.push(q.id);return notice('依頼を受けました！','ui');}
 if(c.type==='quest_claim'){const row=questRows(w,p).find(q=>q.id===c.id);if(!row||!row.accepted||row.claimed||row.value<row.target||village(w).level<row.stage)return notice('依頼の条件を達成してから報告しましょう。');if(row.daily)p.progress.daily.claimed.push(row.id);else{p.progress.claimed.push(row.id);p.progress.active=p.progress.active.filter(id=>id!==row.id);}p.coins+=row.coins;for(const [k,n]of Object.entries(row.reward))p.bag[k as Material]+=n!;p.actionAt=w.time;return notice('依頼達成！報酬を受け取りました。','donate');}
 if(c.type==='home_claim'){
  if(c.petKind!==undefined&&(typeof c.petKind!=='string'||!Object.prototype.hasOwnProperty.call(PETS,c.petKind)))return notice('ペットを選んでください。');if(c.petName!==undefined&&typeof c.petName!=='string')return;
  if(home.level)return notice('自分の家はすでにあります。');if(!Number.isInteger(c.tile)||c.tile!<0||c.tile!>=w.tiles.length)return notice('近くの空いた草地を選びましょう。');const i=c.tile!,t=w.tiles[i],x=i%size+.5,z=Math.floor(i/size)+.5;
  if(Math.hypot(p.x-x,p.z-z)>2.9)return notice('もう少し近づいてください。');if(Math.hypot(x-CENTER_X,z-CENTER_Z)<4||t.ground!=='grass'||t.nature||t.crop!==null||t.blocks.length||t.homeOwner||t.owner||Object.values(w.players).some(q=>Math.floor(q.z)*size+Math.floor(q.x)===i))return notice('広場から離れた空き地に家を建てましょう。');
  if(Object.entries(HOME_COSTS[0]).some(([k,n])=>p.bag[k as Material]<n!))return notice('材料が足りません。');for(const [k,n]of Object.entries(HOME_COSTS[0]))p.bag[k as Material]-=n!;home.tile=i;home.level=1;const kind=petKindOf(c.petKind);home.pet={kind,name:petNameOf(c.petName,kind),affection:30,careAt:-10};t.homeOwner=p.id;t.homeName=p.name;t.homeLevel=1;t.revision=++w.revision;recordWork(w,p,'build',i);p.actionAt=w.time;return notice('自分の家ができました！入口の近くで入れます。','build');
 }
 if(c.type==='home_enter'){if(!enterHome(w,p,c.tile??home.tile))return notice('家の入口に近づいてください。');return notice('おかえりなさい！','ui');}
 if(c.type==='home_leave'){leaveHome(w,p);return;}
 if(p.indoors&&roomTile(p)!==home.tile)return notice('家具の編集は家の持ち主だけができます。');
 if(['home_upgrade','home_rotate','home_move','home_remove'].includes(c.type)&&Object.values(w.games||{}).some(g=>g.homeTile===home.tile&&(c.type==='home_upgrade'||g.slot===c.slot)&&g.phase==='playing'))return notice('対戦中の家具は変更できません。');
 if(c.type==='home_upgrade'){
  if(!home.level||home.level>=3)return notice('家は最大まで拡張されています。');if(!p.indoors)return notice('家に入ってから拡張しましょう。');if(village(w).level<home.level)return notice('島を発展させると家を拡張できます。');const cost=HOME_COSTS[home.level],coins=HOME_COINS[home.level];if(p.coins<coins||Object.entries(cost).some(([k,n])=>p.bag[k as Material]<n!))return notice('拡張に必要な材料とコインが足りません。');for(const [k,n]of Object.entries(cost))p.bag[k as Material]-=n!;p.coins-=coins;const oldSize=HOME_SIZES[home.level];home.level++;const newSize=HOME_SIZES[home.level];for(const f of home.furniture)f.slot=Math.floor(f.slot/oldSize)*newSize+f.slot%oldSize;w.tiles[home.tile].homeLevel=home.level;w.tiles[home.tile].revision=++w.revision;p.actionAt=w.time;return notice('家が広くなりました！','build');
 }
 if(c.type==='home_make'){
  if(!p.indoors||!c.item||!FURNITURE.includes(c.item))return;
  const cost=HOME_ITEMS[c.item][2];if(p.bag.wood<cost||p.coins<cost)return notice('材料が足りません。');p.bag.wood-=cost;p.coins-=cost;home.stock??={};if(['bench','lamp','flower','campfire'].includes(c.item))p.bag[c.item as Material]++;else home.stock[c.item]=(home.stock[c.item]||0)+1;return notice('家具をつくりました！','craft');
 }
 if(c.type==='home_rotate'||c.type==='home_move'||c.type==='home_use'){
  if(!p.indoors)return;const f=home.furniture.find(f=>f.slot===c.slot);if(!f)return;
  if(c.type==='home_rotate'){f.rotation=((f.rotation||0)+1)%4;return notice('家具の向きを変えました。','ui');}
  if(c.type==='home_move'){if(!Number.isInteger(c.target)||c.target!<0||c.target!>=HOME_SIZES[home.level]**2||home.furniture.some(f=>f.slot===c.target))return;f.slot=c.target!;return notice('家具を移動しました。','build');}
  const effect=HOME_ITEMS[f.item][3],day=Math.floor(w.time/240);
  if(effect==='rest'){if(w.time<(home.restUntil||0))return notice('次の休息まで少し待ちましょう。');home.restUntil=w.time+60;p.buffUntil=Math.max(p.buffUntil,w.time+45);return notice('休息して足取りが軽くなりました！','ui');}
  if(effect==='work'){if(home.usedDay?.[f.item]===day)return notice('今日はもう使いました。');home.usedDay??={};home.usedDay[f.item]=day;p.bag.plank+=2;return notice('家具から木の床を2個つくりました。','craft');}
  if(effect==='cook'){if(p.bag.crop<2||p.bag.fish<1||p.bag.fruit<1)return notice('材料が足りません。');p.bag.crop-=2;p.bag.fish--;p.bag.fruit--;p.bag.meal++;return notice('料理ができました！','craft');}
  if(effect==='music'){p.buffUntil=Math.max(p.buffUntil,w.time+20);return notice('音楽で気分が上がりました！','donate');}
  return notice('お気に入りの家具を楽しんでいます。','ui');
 }
 if(c.type==='home_place'||c.type==='home_remove'){
  if(!p.indoors||!Number.isInteger(c.slot)||c.slot!<0||c.slot!>=HOME_SIZES[home.level]**2)return notice('家の中のマスを選んでください。');const f=home.furniture.find(f=>f.slot===c.slot);
  if(c.type==='home_remove'){if(!f)return;if(['bench','lamp','flower','campfire'].includes(f.item))p.bag[f.item as Material]++;else{home.stock??={};home.stock[f.item]=(home.stock[f.item]||0)+1;}home.furniture=home.furniture.filter(f=>f!==f);p.actionAt=w.time;return notice('家具を持ち物に戻しました。','remove');}
  if(!c.item||!FURNITURE.includes(c.item)||f)return notice('家具を置ける空いたマスを選びましょう。');const legacy=['bench','lamp','flower','campfire'].includes(c.item),count=legacy?p.bag[c.item as Material]:home.stock?.[c.item]||0;if(!count)return notice('材料が足りません。');if(legacy)p.bag[c.item as Material]--;else home.stock![c.item]!--;home.furniture.push({slot:c.slot!,item:c.item,rotation:Number.isInteger(c.rotation)?(c.rotation!%4+4)%4:0});p.actionAt=w.time;return notice('家具を飾りました！','build');
 }
}

export function leaveHome(w:World,p:Player){p.indoors=false;p.dx=p.dz=0;const i=roomTile(p);p.homeTile=undefined;const x=i%MAP_WIDTH,z=Math.floor(i/MAP_WIDTH);for(const [dx,dz]of [[0,1],[1,0],[0,-1],[-1,0]]){const t=w.tiles[(z+dz)*MAP_WIDTH+x+dx];if(mapInside(x+dx,z+dz)&&t&&!t.nature&&!t.homeOwner&&t.ground!=='water'&&t.blocks.length<2){p.x=x+dx+.5;p.z=z+dz+.5;return;}}}

export function petCommand(w:World,p:Player,c:{type:string;name?:string}){if(!['pet_name','pet_care'].includes(c.type))return;const home=roomHome(w,p);if(!p.indoors||!home)return;home.pet??={kind:DEFAULT_PET,name:'ミケ',affection:30,careAt:-10};if(c.type==='pet_name'){if(roomTile(p)!==p.progress.home.tile||typeof c.name!=='string')return;const name=c.name.trim().slice(0,16);if(name)home.pet.name=name;return notice('ペットの名前を変えました。','ui');}if(w.time-home.pet.careAt<10)return notice('ペットは今ごきげんです。少し待ちましょう。');home.pet.careAt=w.time;home.pet.affection=Math.min(100,home.pet.affection+5);return notice('ペットをなでました！','ui');}
