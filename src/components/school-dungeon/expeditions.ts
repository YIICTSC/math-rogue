import type {AdventureMode,AdventureState,SchoolBase} from './adventure';
export const EXPEDITIONS=[
 {id:'VERDANT',ja:'翠緑の迷い森',en:'Verdant Labyrinth',floors:18,biome:'forest',color:'#8cdd7a',tier:1,series:1,desc:'毒の森と豊富な食料。根に足を取られないように。',english:'Poisonous forest guardians, abundant food and tangled roots.'},
 {id:'GLACIER',ja:'氷晶の回廊',en:'Glacial Gallery',floors:24,biome:'ice',color:'#8feaff',tier:1,series:1,desc:'連なる氷床と凍てつく守護者。滑る先を読もう。',english:'Ice lanes and frozen guardians. Plan where your slide ends.'},
 {id:'TIDAL',ja:'潮騒の地下水路',en:'Tidal Waterways',floors:22,biome:'water',color:'#50bfeb',tier:1,series:1,desc:'水路を渡る近道と、遠距離の水辺の魔物。',english:'Optional water shortcuts and ranged waterside monsters.'},
 {id:'ARCHIVE',ja:'忘却図書館',en:'Forgotten Archive',floors:16,biome:'archive',color:'#e6c78e',tier:1,series:1,desc:'未識別の道具と豊富な巻物。観察と識別が鍵。',english:'Unidentified supplies and plentiful scrolls. Observe and identify.'},
 {id:'FOUNDRY',ja:'紅蓮の工作炉',en:'Crimson Foundry',floors:26,biome:'fire',color:'#ff956c',tier:2,series:1,desc:'爆弾わなと炎の守護者。罠は見えている。',english:'Visible bomb traps and fiery guardians. Watch your footing.'},
 {id:'MIRROR',ja:'月影の鏡迷宮',en:'Moonlit Mirror Maze',floors:28,biome:'mirror',color:'#c8a7fa',tier:2,series:1,desc:'霧に隠れた敵と増殖する鏡の番人。',english:'Fog-shrouded foes and multiplying mirror sentinels.'},
 {id:'CLOCKWORK',ja:'放課後の時計塔',en:'After-school Clocktower',floors:30,biome:'clock',color:'#f2d36e',tier:2,series:1,desc:'各階100手で退去。見えるわなを避けて急ごう。',english:'Only 100 turns per floor. Hurry past the visible mechanisms.'},
 {id:'STORM',ja:'雷鳴の天文台',en:'Thunder Observatory',floors:32,biome:'storm',color:'#b6b3ff',tier:2,series:1,desc:'雷の魔法使いと強風。射線と遮蔽物を使おう。',english:'Storm mages and strong winds. Use walls to break sight lines.'},
 {id:'ABYSS',ja:'深淵の学園跡',en:'Abyssal Academy',floors:40,biome:'abyss',color:'#a08aff',tier:3,series:2,desc:'強化された影の敵が守る40階。2専用の深層迷宮。',english:'Forty floors guarded by empowered shadows. Exclusive to Dungeons 2.'},
 {id:'VOID',ja:'零界の転移庭園',en:'Voidwarp Gardens',floors:45,biome:'void',color:'#b98fff',tier:3,series:2,desc:'見える転移わなと空間の裂け目。安全な通路を探そう。',english:'Visible warp traps and rifts. Find a safe route through.'},
 {id:'CHRONICLE',ja:'時忘れの保健棟',en:'Timeless Infirmary',floors:36,biome:'chronicle',color:'#f39bc4',tier:3,series:2,desc:'吸収の魔物と回復道具。回復力を保って探索しよう。',english:'Drain monsters and healing supplies. Manage your recovery.'},
 {id:'CONSTELLATION',ja:'星読の浮遊書庫',en:'Starlit Sky Archive',floors:48,biome:'stars',color:'#90dbff',tier:4,series:2,desc:'カードと巻物が多い星の迷宮。遠距離の敵に注意。',english:'Cards and scrolls abound. Beware the ranged star guardians.'},
 {id:'DRAGON',ja:'竜冠の最終試験',en:'Dragoncrest Trial',floors:60,biome:'dragon',color:'#ffc16d',tier:4,series:2,desc:'竜と精鋭が集う60階。固有技の使い所が重要。',english:'Sixty floors of dragons and elites. Time your unique abilities.'},
 {id:'INFINITE',ja:'更なる深淵・九十九門',en:'Deeper Abyss: Ninety-nine Gates',floors:99,biome:'cycle',color:'#df9cff',tier:5,series:2,desc:'各階で森林・氷・水・炎・雷へ変化する99階。',english:'Ninety-nine floors cycling through forest, ice, water, fire and storm.'},
] as const;
export type ExpeditionId=typeof EXPEDITIONS[number]['id'];
export function expedition(mode:string){return EXPEDITIONS.find(v=>v.id===mode);}
export function expeditionUnlocked(base:SchoolBase,id:string){const entry=expedition(id);if(!entry)return false;if(base.clears[entry.id])return true;const clears=EXPEDITIONS.filter(v=>base.clears[v.id]).length;return Boolean(base.clears.STORY)&&(entry.tier===1||entry.tier===2&&clears>=1||entry.tier===3&&clears>=2||entry.tier===4&&clears>=3||entry.tier===5&&Boolean(base.clears.DRAGON));}
export function availableExpeditions(series:1|2){return EXPEDITIONS.filter(v=>v.series<=series);}
export function expeditionRequirement(id:string):[string,string]{const d=expedition(id);return d?.tier===1?['放課後の大冒険を踏破','Clear After-school adventure']:d?.tier===5?['竜冠の最終試験を踏破','Clear Dragoncrest Trial']:[`追加迷宮を${Math.max(1,(d?.tier||2)-1)}種類踏破`,`Clear ${Math.max(1,(d?.tier||2)-1)} different additional labyrinths`];}
/** Decorate the existing generator, reserving a dry path to every stair. */
export function decorateExpedition(s:AdventureState,map:string[][],enemies:any[],items:any[],traps:any[],px:number,py:number,catalog:Record<string,any>,series:1|2,cards:any[]=[]) {
 const entry=expedition(s.mode);if(!entry)return;
 const biome=entry.biome==='cycle'?['forest','ice','water','fire','storm'][(s.floor-1)%5]:entry.biome;
 const key=(x:number,y:number)=>`${x},${y}`,seen=new Map<string,string|null>([[key(px,py),null]]),queue=[[px,py]],protectedCells=new Set<string>();
 for(const [x,y]of queue){for(const [dx,dy]of [[1,0],[-1,0],[0,1],[0,-1]]){const nx=x+dx,ny=y+dy,k=key(nx,ny);if(!map[ny]?.[nx]||map[ny][nx]==='WALL'||seen.has(k))continue;seen.set(k,key(x,y));queue.push([nx,ny]);}}
 map.forEach((row,y)=>row.forEach((tile,x)=>{if(tile==='STAIRS'){let at:string|null=key(x,y);while(at){protectedCells.add(at);at=seen.get(at)??null;}for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++)protectedCells.add(key(x+dx,y+dy));}}));
 for(let dy=-2;dy<=2;dy++)for(let dx=-2;dx<=2;dx++)protectedCells.add(key(px+dx,py+dy));
 const occupied=new Set([...enemies,...items,...traps].map(v=>key(v.x,v.y)));
 s.terrain={};s.events={};s.weather=['mirror','abyss'].includes(biome)?'FOG':biome==='storm'?'WIND':'CLEAR';s.night=['mirror','abyss','void','stars'].includes(biome);
 const candidates=queue.filter(([x,y])=>map[y][x]==='FLOOR'&&!protectedCells.has(key(x,y))&&!occupied.has(key(x,y)));
 for(const [x,y]of candidates){const n=(x*17+y*29+s.floor*11)%19;if(biome==='ice'&&y%3===0||biome==='water'&&x%4===0)s.terrain[key(x,y)]=biome==='ice'?'ICE':'WATER';else if(biome==='forest'&&n<3)s.terrain[key(x,y)]='CRACK';else if(biome==='void'&&n===0)s.terrain[key(x,y)]='HOLE';}
 // Never leave an old trap on the guaranteed route.
 for(let i=traps.length-1;i>=0;i--)if(protectedCells.has(key(traps[i].x,traps[i].y)))traps.splice(i,1);
 for(const [i,[x,y]]of candidates.slice(0,biome==='fire'||biome==='void'||biome==='clock'?5:2).entries()){
  if(['fire','void','clock'].includes(biome))traps.push({id:Date.now()+i,type:'TRAP',x,y,name:biome==='void'?'転移わな':'仕掛けわな',trapType:biome==='fire'?'BOMB':biome==='void'?'WARP':'SLEEP',visible:true,status:{}});
 }
 const types:Record<string,string>={forest:'MANDRAKE',ice:'GOLEM',water:'MAGE',fire:'DRAGON',mirror:'SLIME',clock:'THIEF',storm:'MAGE',abyss:'GHOST',void:'MAGE',chronicle:'DRAIN',stars:'MAGE',dragon:'DRAGON'};
 enemies.forEach((e,i)=>{if(e.enemyType==='SHOPKEEPER')return;delete e.schoolKind;if(types[biome])e.enemyType=types[biome];e.name=entry.ja+'の番人';const scale=1+Math.min(.8,entry.tier*.12);e.hp=Math.max(1,Math.round(e.hp*scale));e.maxHp=e.hp;e.attack=Math.max(1,Math.round(e.attack*(1+entry.tier*.06)));if(biome==='mirror'&&i===0)e.schoolKind='SPLIT';});
 const choice=biome==='forest'?'FOOD_ONIGIRI':biome==='chronicle'?'GRASS_HEAL':biome==='archive'||biome==='stars'?'SCROLL_THUNDER':null;
 if(choice&&catalog[choice])for(const [i,[x,y]]of candidates.filter(([x,y])=>!s.terrain[key(x,y)]).slice(6,9).entries())items.push({id:Date.now()+i+30,type:'ITEM',x,y,name:catalog[choice].name,itemData:{...catalog[choice],id:`expedition-${s.floor}-${i}-${Date.now()}`}});
 if(series===2&&biome==='stars'){s.weather='WIND';if(cards.length)for(const [i,[x,y]]of candidates.filter(([x,y])=>!s.terrain[key(x,y)]).slice(10,12).entries()){const card=cards[(s.floor+i)%cards.length];items.push({id:Date.now()+i+80,type:'ITEM',x,y,name:card.name,itemData:{...card,id:`star-card-${s.floor}-${i}-${Date.now()}`}});}}
}
