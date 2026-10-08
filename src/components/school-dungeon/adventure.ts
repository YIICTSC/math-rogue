import {EXTRA_ITEMS} from './expansion';
/** Shared, serializable rules for both offline School Wanderer adventures. */
export type AdventureMode = 'STORY'|'BARE'|'MYSTERY'|'TRAPS'|'NO_GEAR'|'CARDS'|'RESCUE'|'PUZZLE';
export type Terrain = 'WATER'|'ICE'|'HOLE'|'CRACK'|'SECRET';
export interface SchoolItem {
 id: string; type: string; category: string; name: string; desc: string; value?:number; power?:number; plus?:number; charges?:number;
 marks?:string[]; markSlots?:number; cursed?:boolean; blessed?:boolean; capacity?:number; contents?:SchoolItem[]; shopOwner?:number; price?:number;wet?:boolean;
}
export interface Companion {name:string;role:'HEAL'|'GUARD'|'FETCH';x:number;y:number;hp:number;level:number;xp:number;order:'FOLLOW'|'WAIT';direction?:number;walkFrame?:number;moving?:boolean;}
export interface AdventureState {
 version:1; runId?:string; mode:AdventureMode; floor:number; floorTurns:number; terrain:Record<string,Terrain>; debt:number; alarm:boolean;
 companion:Companion|null; pouch:string[]; events:Record<string,{kind:string;done:boolean}>; swallowed:Record<string,SchoolItem[]>;
 rescueTarget:number; puzzle:number; puzzleTurns:number; rescued:boolean; sealedTurns:number; returned:boolean;scene?:number;town?:boolean;weather?:string;night?:boolean;townUsed?:string[];festivalSeed?:number;
}
export interface SchoolBase {version:1;departure?:{runId:string;items:SchoolItem[];gold:number};warehouse:SchoolItem[];bank:number;visits:number;clears:Partial<Record<AdventureMode,number>>;rescue:{floor:number;items:SchoolItem[];attempts:number}|null;story:number;dojo?:Record<number,number>;codex?:string[];diary?:string[];claimed?:string[];}
export const MODES: {id:AdventureMode;ja:string;en:string;desc:string;english:string;floors:number}[] = [
 {id:'STORY',ja:'放課後の大冒険',en:'After-school adventure',desc:'道具持ち込み可。20階の校長先生へ。',english:'Bring equipment and challenge the principal on floor 20.',floors:20},
 {id:'BARE',ja:'手ぶらの99階',en:'Empty-handed 99 floors',desc:'倉庫の道具なし。拾った道具と知恵で99階へ。',english:'No warehouse items. Survive 99 floors with what you find.',floors:99},
 {id:'MYSTERY',ja:'なぞなぞ校舎',en:'Mystery school',desc:'道具が未識別。使い方と値段で正体を考える30階。',english:'Identify mystery supplies through use and prices. 30 floors.',floors:30},
 {id:'TRAPS',ja:'いたずら工作室',en:'Trap workshop',desc:'罠を回収・設置して攻略する20階。罠が最初から見える。',english:'Visible traps, collection and placement. 20 floors.',floors:20},
 {id:'NO_GEAR',ja:'体操服の挑戦',en:'Gym-clothes challenge',desc:'武器・防具を装備できない20階。道具と位置取りが頼り。',english:'No weapons or armor. Use supplies and positioning. 20 floors.',floors:20},
 {id:'CARDS',ja:'作戦ノートの30階',en:'Strategy notebook',desc:'2ではカード中心。1では傘とノート中心の道具戦。',english:'Cards in game 2, umbrellas and notebooks in game 1. 30 floors.',floors:30},
 {id:'RESCUE',ja:'忘れ物レスキュー',en:'Lost-supply rescue',desc:'倒れた階へ別の冒険で向かい、道具を倉庫に救出。3回まで。',english:'Reach the lost floor to recover supplies. Three attempts.',floors:99},
 {id:'PUZZLE',ja:'放課後の一手',en:'One clever move',desc:'固定配置の8問。限られた手数で階段へ。',english:'Eight fixed layouts. Reach the stairs within the turn limit.',floors:8},
];
export function modeUnlocked(base:SchoolBase,mode:AdventureMode){
 if(mode==='RESCUE')return Boolean(base.rescue&&base.rescue.attempts<3);
 if(mode==='STORY'||base.clears[mode])return true;
 const lessons=Object.keys(base.dojo||{}).length;
 if(mode==='PUZZLE')return lessons>=5||Boolean(base.clears.STORY);
 if(mode==='TRAPS')return lessons>=15||Boolean(base.clears.STORY);
 if(mode==='MYSTERY'||mode==='CARDS')return Boolean(base.clears.STORY);
 if(mode==='NO_GEAR')return Boolean(base.clears.MYSTERY||base.clears.CARDS);
 return Boolean(base.clears.NO_GEAR);
}
export function modeRequirement(mode:AdventureMode):[string,string]{
 if(mode==='PUZZLE')return ['道場5問修了 または 大冒険クリア','Clear 5 dojo lessons or the story'];
 if(mode==='TRAPS')return ['道場15問修了 または 大冒険クリア','Clear 15 dojo lessons or the story'];
 if(mode==='MYSTERY'||mode==='CARDS')return ['放課後の大冒険クリア','Clear the after-school adventure'];
 if(mode==='NO_GEAR')return ['なぞなぞ校舎 または 作戦ノートクリア','Clear Mystery school or Strategy notebook'];
 if(mode==='BARE')return ['体操服の挑戦クリア','Clear the gym-clothes challenge'];
 return ['倒れた冒険の救助依頼','A rescue request from a defeated adventure'];
}
export const MARKS:Record<string,{ja:string;en:string}>={
 OFUDA_RULER:{ja:'おばけ退治',en:'Ghost slayer'},VITAMIN_INJECT:{ja:'吸血対策',en:'Drain slayer'},RICH_WATCH:{ja:'おこづかい攻撃',en:'Coin attack'},LADLE:{ja:'食料づくり',en:'Food drops'},PROTRACTOR_EDGE:{ja:'広い攻撃',en:'Wide attack'},DISASTER_HOOD:{ja:'爆風対策',en:'Blast guard'},RING_SIGHT:{ja:'透視',en:'Far sight'},
 STAINLESS_PEN:{ja:'さび防止',en:'Rustproof'},NAME_TAG:{ja:'盗難防止',en:'Theft guard'},FIREFIGHTER:{ja:'防火',en:'Fire guard'},GYM_CLOTHES:{ja:'身かわし',en:'Dodge'},HEAL_SWORD:{ja:'回復',en:'Healing'},DRAGON_KILLER:{ja:'竜退治',en:'Dragon slayer'},RING_HUNGER:{ja:'腹もち',en:'Slow hunger'},RING_TRAP:{ja:'罠見え',en:'Trap sight'},RING_HEAL:{ja:'早い回復',en:'Fast recovery'},RANDO_SERU:{ja:'頑丈',en:'Sturdy'},FLOAT_MARK:{ja:'水わたり',en:'Water walking'},
};
const supply=(type:string,name:string,desc:string,value:number,extra:Partial<SchoolItem>={}):Omit<SchoolItem,'id'>=>({type,name,desc,value,category:'CONSUMABLE',...extra});
export const ADVENTURE_ITEMS:Record<string,Omit<SchoolItem,'id'>>={
 ...EXTRA_ITEMS,
 BAG_SAVE:supply('BAG_SAVE','保存のランドセル','道具を6個収納。中身は出し入れできる。',600,{capacity:6,contents:[]}),
 BAG_HEAL:supply('BAG_HEAL','保健の箱','道具を入れるとHP30回復。中身は取り出せず、割ると戻る。',700,{capacity:4,contents:[]}),
 BAG_IDENTIFY:supply('BAG_IDENTIFY','調べる筆箱','入れた道具を識別。4個収納、自由に取り出せる。',650,{capacity:4,contents:[]}),
 BAG_CHANGE:supply('BAG_CHANGE','工作の箱','入れた道具が別の道具へ変化。割って取り出す。',450,{capacity:4,contents:[]}),
 SUPPLY_CLEAN:supply('SUPPLY_CLEAN','お清め消しゴム','全ての装備と持ち物のいたずら封印を解除。',400),
 SUPPLY_BLESS:supply('SUPPLY_BLESS','先生の応援シール','次に選んだ道具を祝福。使用時にHPを20回復。',500),
 SUPPLY_RETURN:supply('SUPPLY_RETURN','帰りの連絡帳','道具とお金を持って学校前へ帰る。救助中には使えない。',800),
 SUPPLY_REVIVE:supply('SUPPLY_REVIVE','保健室のお守り','倒れた時に1個消費しHPを半分回復。',900),
 SUPPLY_PICK:supply('SUPPLY_PICK','工作つるはし','正面の壁を壊せる。8回使用可能。',550,{charges:8}),
 NURSE_PENCIL:supply('NURSE_PENCIL','保健係のえんぴつ','攻撃+4。攻撃するとHP3回復。校章として合成可能。',600,{category:'WEAPON',power:4,marks:['HEAL_SWORD']}),
 DRAGON_RULER:supply('DRAGON_RULER','竜退治の定規','攻撃+5。竜への攻撃2倍。校章として合成可能。',700,{category:'WEAPON',power:5,marks:['DRAGON_KILLER']}),
 SUPPLY_FLOAT:supply('SUPPLY_FLOAT','浮き輪バッジ','水路を渡れる腕輪。',650,{category:'ACCESSORY',marks:['FLOAT_MARK']}),
};
export function newAdventure(mode:AdventureMode='STORY'):AdventureState {return {version:1,mode,floor:0,floorTurns:0,terrain:{},debt:0,alarm:false,companion:null,pouch:[],events:{},swallowed:{},rescueTarget:1,puzzle:0,puzzleTurns:0,rescued:false,sealedTurns:0,returned:false};}
export function newBase():SchoolBase{return {version:1,warehouse:[],bank:0,visits:0,clears:{},rescue:null,story:0};}
export function cloneItem<T>(item:T):T{return JSON.parse(JSON.stringify(item));}
export function equipmentHas(item:SchoolItem|null|undefined,trait:string):boolean{return Boolean(item&&(item.type===trait||item.marks?.includes(trait)));}
export function mergeEquipment(base:SchoolItem,material:SchoolItem):SchoolItem {
 if(base.category!==material.category||!['WEAPON','ARMOR'].includes(base.category))throw Error('Different equipment categories');
 if(base.cursed||material.cursed)throw Error('Remove seals before combining');
 const slots=base.markSlots??4,marks=[...new Set([...(base.marks||[]),...(MARKS[base.type]?[base.type]:[]),...(material.marks||[]),...(MARKS[material.type]?[material.type]:[])])];
 if(marks.length>slots)throw Error('Not enough emblem slots');
 const plus=(base.plus||0)+(material.plus||0)+1;
 return {...base,plus,markSlots:slots,marks,name:base.name.replace(/\+\d+$/,'')+'+'+plus};
}
export function putInContainer(bag:SchoolItem,item:SchoolItem):SchoolItem {
 if(!bag.capacity||item.capacity||bag.id===item.id)throw Error('Containers cannot contain containers');
 if((bag.contents?.length||0)>=bag.capacity)throw Error('Container full');
 if(item.shopOwner)throw Error('Pay for supplies before storing them');
 return {...bag,contents:[...(bag.contents||[]),cloneItem(item)]};
}
export function goalFloor(state:AdventureState){return state.mode==='RESCUE'?state.rescueTarget:MODES.find(m=>m.id===state.mode)!.floors;}
export const positionKey=(x:number,y:number)=>`${x},${y}`;
/** Reserve exits and their neighboring tiles so decorations never block the only route. */
export function decorateFloor(state:AdventureState,map:string[][],px:number,py:number,floor:number,occupied:Set<string>,random= Math.random){
 state.floor=floor;state.floorTurns=0;state.terrain={};state.events={};state.debt=0;state.alarm=false;
 const cells:{x:number;y:number}[]=[];
 for(let y=1;y<map.length-1;y++)for(let x=1;x<map[y].length-1;x++){
  if(map[y][x]!=='FLOOR'||occupied.has(positionKey(x,y))||Math.abs(px-x)+Math.abs(py-y)<4)continue;
  if(map.slice(Math.max(0,y-1),y+2).some(row=>row.slice(Math.max(0,x-1),x+2).includes('STAIRS')))continue;
  // Only decorate wide rooms. Keep their perimeter and center paths clear.
  if([-1,0,1].every(dy=>[-1,0,1].every(dx=>map[y+dy]?.[x+dx]==='FLOOR')))cells.push({x,y});
 }
 for(const c of cells.filter(()=>random()<0.04).slice(0,12))state.terrain[positionKey(c.x,c.y)]=(['WATER','ICE','HOLE'] as Terrain[])[Math.floor(random()*3)];
 const exits: string[]=[];for(let y=0;y<map.length;y++)for(let x=0;x<map[y].length;x++)if(map[y][x]==='STAIRS')exits.push(positionKey(x,y));
 const exitsReachable=()=>{const todo=[[px,py]],seen=new Set([positionKey(px,py)]);for(const [x,y] of todo)for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]]){const nx=x+dx,ny=y+dy,key=positionKey(nx,ny);if(map[ny]?.[nx]&&map[ny][nx]!=='WALL'&&!['WATER','HOLE'].includes(state.terrain[key])&&!seen.has(key)){seen.add(key);todo.push([nx,ny]);}}return exits.every(key=>seen.has(key));};
 for(const [key,terrain] of Object.entries(state.terrain)){if(exitsReachable())break;if(terrain==='WATER'||terrain==='HOLE')delete state.terrain[key];}
 const eventKinds=['REST','TRADER','FRIEND','STORY'];
 cells.filter(c=>!state.terrain[positionKey(c.x,c.y)]).slice(0,4).forEach((c,i)=>state.events[positionKey(c.x,c.y)]={kind:eventKinds[(i+floor)%4],done:false});
 // A wall beside a reachable cell can conceal a cache without altering the connected floor.
 for(const c of cells){const wall=[[1,0],[-1,0],[0,1],[0,-1]].map(([dx,dy])=>({x:c.x+dx*2,y:c.y+dy*2})).find(p=>map[p.y]?.[p.x]==='WALL');if(wall){state.terrain[positionKey(wall.x,wall.y)]='SECRET';break;}}
 if(state.companion){const start=[[0,1],[0,-1],[-1,0],[1,0]].map(([dx,dy])=>({x:px+dx,y:py+dy})).find(p=>map[p.y]?.[p.x]==='FLOOR'&&!occupied.has(positionKey(p.x,p.y)));Object.assign(state.companion,start||{x:px,y:py});state.companion.direction=0;state.companion.moving=false;}
 return cells;
}
export function puzzleLayout(width:number,height:number,index:number){
 const map=Array.from({length:height},()=>Array(width).fill('WALL'));
 const paths=[
 [[2,2],[3,2],[4,2],[5,2],[6,2]],
 [[2,2],[3,2],[3,3],[3,4],[4,4],[5,4]],
 [[2,2],[2,3],[2,4],[3,4],[4,4],[4,3],[4,2]],
 [[2,2],[3,2],[4,2],[4,3],[4,4],[5,4],[6,4]],
 [[2,2],[2,3],[3,3],[4,3],[4,4],[4,5],[5,5],[6,5]],
 [[2,2],[3,2],[3,3],[3,4],[4,4],[5,4],[5,3],[5,2],[6,2]],
 [[2,2],[2,3],[2,4],[2,5],[3,5],[4,5],[5,5],[5,4],[5,3],[6,3]],
 [[2,2],[3,2],[4,2],[4,3],[4,4],[3,4],[3,5],[4,5],[5,5],[6,5],[6,4],[6,3]]
 ];
 const path=paths[index%paths.length];for(const [x,y] of path)map[y][x]='FLOOR';
 // Extra lanes progressively introduce line-of-sight and corner decisions.
 if(index>=3){map[2][2]='FLOOR';map[3][2]='FLOOR';}
 const [sx,sy]=path[path.length-1];map[sy][sx]='STAIRS';
 return {map,start:{x:2,y:2},goal:{x:sx,y:sy},limit:path.length+4+Math.floor(index/3),enemy:path[Math.min(2,path.length-2)]};
}
export function evolveEnemy(enemy:any){const rank=(enemy.schoolRank||1)+1;return {...enemy,schoolRank:rank,name:enemy.name.replace(/ ★\d+$/,'')+' ★'+rank,hp:enemy.maxHp+12,maxHp:enemy.maxHp+12,attack:enemy.attack+3,defense:enemy.defense+1,xp:enemy.xp+8};}

/** Eight-way direction order matches the companion atlas columns. */
export function companionDirection(dx:number,dy:number):number {
 const x=Math.sign(dx),y=Math.sign(dy);
 return y>0?(x<0?1:x>0?7:0):y<0?(x<0?3:x>0?5:4):x<0?2:6;
}
/** Shortest safe route to an adjacent cell, without cutting wall corners. */
export function companionStep(friend:Companion,px:number,py:number,map:string[][],terrain:Record<string,Terrain>,enemies:{x:number;y:number}[]):{x:number;y:number}|null {
 const near=(x:number,y:number)=>Math.max(Math.abs(x-px),Math.abs(y-py))<=1;
 if(near(friend.x,friend.y))return null;
 const pass=(x:number,y:number)=>Boolean(map[y]?.[x]&&map[y][x]!=='WALL'&&!['WATER','HOLE'].includes(terrain[positionKey(x,y)])&&!enemies.some(e=>e.x===x&&e.y===y));
 const queue=[{x:friend.x,y:friend.y,first:null as {x:number;y:number}|null}],seen=new Set([positionKey(friend.x,friend.y)]);
 for(let i=0;i<queue.length;i++){
  const p=queue[i];
  if(p.first&&near(p.x,p.y))return p.first;
  for(const [dx,dy] of [[0,1],[-1,1],[-1,0],[-1,-1],[0,-1],[1,-1],[1,0],[1,1]]){
   const x=p.x+dx,y=p.y+dy,key=positionKey(x,y);
   if(seen.has(key)||!pass(x,y)||(dx&&dy&&(!pass(p.x+dx,p.y)||!pass(p.x,p.y+dy))))continue;
   seen.add(key);queue.push({x,y,first:p.first||{x,y}});
  }
 }
 return null;
}

/** Recognizable school equipment pairings add permanent bonuses while both are worn. */
export function equipmentResonance(equipment:{weapon?:SchoolItem|null;armor?:SchoolItem|null;accessory?:SchoolItem|null}){
 const {weapon,armor,accessory}=equipment;const bonuses={attack:0,defense:0,names:[] as string[]};
 if(equipmentHas(weapon,'HEAL_SWORD')&&equipmentHas(accessory,'RING_HEAL')){bonuses.attack+=2;bonuses.defense+=2;bonuses.names.push('保健係セット');}
 if(equipmentHas(weapon,'DRAGON_KILLER')&&(equipmentHas(armor,'FIREFIGHTER')||equipmentHas(armor,'DISASTER_HOOD'))){bonuses.attack+=4;bonuses.defense+=3;bonuses.names.push('防災探検セット');}
 if(equipmentHas(weapon,'STAINLESS_PEN')&&equipmentHas(armor,'NAME_TAG')){bonuses.attack+=2;bonuses.defense+=2;bonuses.names.push('ものを大切にセット');}
 return bonuses;
}
