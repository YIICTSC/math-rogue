import {DOJO_STAGES,dojoStart,dojoAct,type DojoAction,type DojoRun} from './dojo';
import {SCHOOL_WANDERER_ENGLISH} from './copy';
import {EXTRA_ITEM_SPRITES,EXTRA_ITEMS,EXTRA_ENEMIES,TOWN_SERVICES,journeyLayout} from './expansion';
import {drawExpansionSprite,drawScenery,drawCompanionSprite,drawSchoolSprite,loadSchoolSprites,SCHOOL_ITEM_SPRITES,SCHOOL_ACTOR_SPRITES} from './sprites';
import {trans} from '../../utils/textUtils';
import {useEffect,useRef,useState} from 'react';
import {ADVENTURE_ITEMS,companionDirection,companionStep,cloneItem,decorateFloor,equipmentHas,evolveEnemy,goalFloor,mergeEquipment,MODES,modeUnlocked,modeRequirement,newAdventure,newBase,positionKey,puzzleLayout,putInContainer, type AdventureMode,type AdventureState,type SchoolBase,type SchoolItem} from './adventure';
export interface AdventureBridge {
 game:1|2; debug?:boolean; language:string; map:string[][]; player:any; inventory:any[]; enemies:any[]; traps:any[]; floorItems:any[];floor:number;belly:number;gameOver:boolean;gameClear:boolean;
 setPlayer:(fn:any)=>void;setInventory:(fn:any)=>void;setEnemies:(fn:any)=>void;setTraps:(fn:any)=>void;setFloorItems:(fn:any)=>void;setMap:(fn:any)=>void;setGameOver:(v:boolean)=>void;setGameClear:(v:boolean)=>void;setMenuOpen:(v:boolean)=>void;setBelly:(fn:any)=>void;setIdentifiedTypes:(fn:any)=>void;
 log:(msg:string)=>void; restart:()=>void; descend:(floor:number)=>void; turn:(overrides?:{belly?:number;hp?:number})=>void;clearSave:()=>void; itemName:(item:any)=>string; catalog:Record<string,any>;cardSupplies?:any[];
}
const id=()=>`school-${Date.now()}-${Math.random()}`;
const emptyEntity=(x:number,y:number)=>({id:Date.now()+Math.random(),type:'ITEM',x,y,char:'!',hp:0,maxHp:0,baseAttack:0,baseDefense:0,attack:0,defense:0,xp:0,dir:{x:0,y:0},status:{sleep:0,confused:0,frozen:0,blind:0,speed:0,poison:0}});
function loadBase(key:string):SchoolBase {try{const data=JSON.parse(localStorage.getItem(key)||'null');if(data?.version===1&&Array.isArray(data.warehouse))return data;}catch{}return newBase();}
export function useSchoolAdventure(bridge:AdventureBridge){
 useEffect(()=>loadSchoolSprites(),[]);
 const b=useRef(bridge);b.current=bridge;
 const key=`learning-rogue:school-base:${bridge.game}`;
 const baseRef=useRef<SchoolBase|null>(null);if(!baseRef.current)baseRef.current=bridge.debug?newBase():loadBase(key);const base=baseRef as {current:SchoolBase};const state=useRef(newAdventure());
 const [revision,redraw]=useState(0);const [panel,setPanel]=useState<string|null>(bridge.debug?null:'BASE');
 const [dojoRun,setDojoRun]=useState<DojoRun|null>(null);const dojoRef=useRef<DojoRun|null>(null);
 const [container,setContainer]=useState<string|null>(null);const [message,setMessage]=useState('');
 const panelRef=useRef(panel);panelRef.current=panel;
 const pending=useRef<{mode:AdventureMode;items:SchoolItem[];gold:number;friend:AdventureState['companion']}|null>(null);
 const mutationLatch=useRef(false);const enterMutation=()=>{if(mutationLatch.current)return false;mutationLatch.current=true;requestAnimationFrame(()=>mutationLatch.current=false);return true;};
 const lastSkills=useRef<string|null>(null);
 const deathHandled=useRef(false);const blessing=useRef(false);const lastEnemies=useRef<any[]>([]);
 const text=(ja:string,en:string)=>b.current.language==='ENGLISH'?(SCHOOL_WANDERER_ENGLISH[ja]||(en===ja?trans(ja,'ENGLISH'):en)):trans(ja,b.current.language as any);
 const refresh=()=>redraw(v=>v+1);
 const persist=()=>{if(!b.current.debug)try{localStorage.setItem(key,JSON.stringify(base.current));}catch{setMessage(text('保存領域がいっぱいです。道具を減らして再保存してください。','Storage is full. Reduce stored supplies and try again.'));refresh();return false;}refresh();return true;};
 const say=(ja:string,en:string)=>{const msg=text(ja,en);base.current.diary=[...(base.current.diary||[]),msg].slice(-40);b.current.log(msg);setMessage(msg);refresh();};
 const updateInventory=(fn:any)=>{const ctx=b.current,next=typeof fn==='function'?fn(ctx.inventory):fn;ctx.inventory=next;ctx.setInventory(next);};
 const consume=(item:SchoolItem)=>updateInventory((inv:any[])=>inv.filter(i=>i.id!==item.id));
 const getPossessions=()=>[...b.current.inventory,...Object.values(b.current.player.equipment||{}).filter(Boolean)] as SchoolItem[];
 const archive=(excludeId?:string)=>{const all=cloneItem(getPossessions().filter(i=>i.id!==excludeId));const existing=new Set(base.current.warehouse.map(i=>i.id));base.current.warehouse.push(...all.filter(i=>!existing.has(i.id)));base.current.bank+=b.current.player.gold||0;};
 const returnHome=(usedItem?:SchoolItem)=>{
  if(!enterMutation())return;
  if(state.current.debt||state.current.alarm){say('購買部の未払い中は帰れません。先に精算しよう。','Settle your shop bill before returning.');return false;}
  if(state.current.mode==='RESCUE'&&!state.current.rescued){say('救助の途中では帰れません。','Finish the rescue before returning.');return false;}
  const previous=cloneItem(base.current);archive(usedItem?.id);base.current.visits++;if(!persist()){base.current=previous;return false;}state.current.returned=true;b.current.clearSave();updateInventory([]);b.current.setPlayer((p:any)=>({...p,gold:0,equipment:{weapon:null,armor:null,ranged:null,accessory:null}}));setPanel('BASE');return true;
 };
 const start=(mode:AdventureMode,selected:string[],gold:number,role:'HEAL'|'GUARD'|'FETCH'|null)=>{
  if(!enterMutation())return;
  if(!b.current.debug&&!modeUnlocked(base.current,mode)){const requirement=modeRequirement(mode);say(...requirement);return;}
  if(mode==='RESCUE'&&(!base.current.rescue||base.current.rescue.attempts>=3)){say('救助できる忘れ物がありません。','No supplies are available for rescue.');return;}
  const previous=cloneItem(base.current),runId=id();
  const carry=mode==='STORY';const items=carry?base.current.warehouse.filter(i=>selected.includes(i.id)).slice(0,16):[];
  const coins=carry?Math.floor(Math.min(Math.max(0,gold),base.current.bank)):0;
  base.current.warehouse=base.current.warehouse.filter(i=>!items.some(s=>s.id===i.id));base.current.bank-=coins;
  if(mode==='RESCUE')base.current.rescue!.attempts++;
  base.current.departure={runId,items:cloneItem(items),gold:coins};
  pending.current={mode,items:cloneItem(items),gold:coins,friend:role&&carry?{name:role==='HEAL'?'保健係あおい':role==='GUARD'?'体育係たける':'図書係ひなた',role,x:0,y:0,hp:40,level:1,xp:0,order:'FOLLOW'}:null};
  if(!persist()){base.current=previous;pending.current=null;return;}setPanel(null);b.current.restart();
 };
 const begin=()=>{const config=pending.current;if(!config&&base.current.departure){const lost=base.current.departure,existing=new Set(base.current.warehouse.map(i=>i.id));base.current.warehouse.push(...lost.items.filter(i=>!existing.has(i.id)));base.current.bank+=lost.gold;delete base.current.departure;persist();}state.current=newAdventure(config?.mode||state.current.mode);state.current.runId=config?base.current.departure?.runId:id();(state.current as any).departed=Boolean(config);state.current.companion=config?.friend||null;state.current.rescueTarget=base.current.rescue?.floor||1;deathHandled.current=false;lastEnemies.current=[];};
 const setupInventory=(items:any[])=>{
  const cfg=pending.current;pending.current=null;
  const mode=state.current.mode;
  const allowed=mode==='STORY'?items:items.filter(i=>i.id.startsWith('start-')&&(i.type==='FOOD_ONIGIRI'||(mode!=='NO_GEAR'&&i.type==='PENCIL_SWORD')));
  const extra=mode==='TRAPS'?['SUPPLY_CLEAN']:mode==='PUZZLE'?['SUPPLY_PICK']:mode==='CARDS'?['BAG_SAVE','SUPPLY_PICK']:[];
  if(cfg?.gold)b.current.setPlayer((p:any)=>({...p,gold:cfg.gold})); // floor initialization resets player: also applied by prepareFloor below.
  (state.current as any).startingGold=cfg?.gold||0;
  return [...allowed,...(cfg?.items||[]),...extra.map(type=>({...ADVENTURE_ITEMS[type],id:id()}))].slice(0,20);
 };
 const prepareFloor=(map:any[][],enemies:any[],items:any[],traps:any[],px:number,py:number,floor:number)=>{
  const s=state.current;s.town=false;s.scene=undefined;s.townUsed=[];s.weather=['CLEAR','RAIN','FOG','WIND'][Math.floor(Math.random()*4)];s.night=false;
  if(s.alarm)updateInventory((a:any[])=>a.map(i=>({...i,shopOwner:undefined})));
  if(s.mode==='PUZZLE'){
   const puzzle=puzzleLayout(map[0].length,map.length,floor-1);map.splice(0,map.length,...puzzle.map);px=puzzle.start.x;py=puzzle.start.y;enemies.splice(0);items.splice(0);traps.splice(0);
   s.puzzle=floor-1;s.puzzleTurns=0;(s as any).puzzleLimit=puzzle.limit;
   if(floor>1){const e={...emptyEntity(puzzle.enemy[0],puzzle.enemy[1]),type:'ENEMY',enemyType:floor%2?'GHOST':'SLIME',name:'居残りおばけ',schoolKind:'DETENTION',hp:10+floor,maxHp:10+floor,attack:3+floor,defense:0,xp:5};enemies.push(e);}
   if(floor>=4)traps.push({...emptyEntity(3,3),type:'TRAP',name:'居眠りわな',trapType:'SLEEP',visible:true});
   items.push({...emptyEntity(2,2),name:'作戦ノート',itemData:{...b.current.catalog['SCROLL_SLEEP'],id:id()}});
   b.current.setPlayer((p:any)=>({...p,x:px,y:py}));
  } else {
   // All non-story challenges end at a stair, rather than the story-only principal.
   if(s.mode!=='STORY'&&enemies.some(e=>e.enemyType==='BOSS')){const boss=enemies.find(e=>e.enemyType==='BOSS');map[boss.y][boss.x]='STAIRS';enemies.splice(enemies.indexOf(boss),1);}
  }
  if(s.mode==='STORY'&&floor!==20&&(floor%5===0||(floor>1&&floor%5===1)||floor===18)){
   const layout=journeyLayout(map[0].length,map.length,floor%5===0,floor===18?3:Math.floor(floor/5)-1);map.splice(0,map.length,...layout.map);px=layout.start.x;py=layout.start.y;enemies.splice(0);items.splice(0);traps.splice(0);s.town=floor%5===0;s.scene=layout.scene;
  }
  const occupied=new Set([...enemies,...items,...traps].map(e=>positionKey(e.x,e.y)));
  const cells=decorateFloor(s,map,px,py,floor,occupied);
  if(s.mode==='PUZZLE'||s.scene!==undefined){s.terrain={};s.events={};}
  if(s.town)for(const service of TOWN_SERVICES)s.events[positionKey(service.x,service.y)]={kind:service.kind,done:false};
  else if(s.scene!==undefined)s.events['7,7']={kind:'PICNIC',done:false};
  if(floor===1)b.current.setPlayer((p:any)=>({...p,gold:(s as any).startingGold||0}));
  const kinds=floor>=16?['SPLIT','SEAL','SWALLOW','ERASE','RICE','EVOLVE']:floor>=11?['SPLIT','SEAL','SWALLOW','ERASE']:floor>=7?['SPLIT','SEAL','SWALLOW']:['SPLIT'];
  enemies.forEach((e,i)=>{if(e.enemyType!=='BOSS'&&e.enemyType!=='SHOPKEEPER'&&(s.mode==='PUZZLE'||floor>=4&&i%(floor>=12?4:6)===0)){e.schoolKind=s.mode==='PUZZLE'?'DETENTION':kinds[(i+floor)%kinds.length];e.schoolRank=1;if(s.mode!=='PUZZLE')e.enemyType=({SPLIT:'SLIME',SEAL:'MAGE',SWALLOW:'THIEF',ERASE:'DRAIN',RICE:'MANDRAKE',EVOLVE:'GOLEM'} as any)[e.schoolKind];e.name=({'DETENTION':'居残りおばけ','SPLIT':'ちぎれ紙おばけ','SEAL':'封印シール小僧','SWALLOW':'ぱくぱく筆箱','ERASE':'消しゴム怪人','RICE':'おにぎり係','EVOLVE':'ガキ大将'} as any)[e.schoolKind];}});
  if(s.mode==='TRAPS')traps.forEach(t=>t.visible=true);
  for(const e of items){if(e.itemData){e.itemData=cloneItem(e.itemData);if(['WEAPON','ARMOR'].includes(e.itemData.category)){e.itemData.markSlots=4;e.itemData.cursed=Math.random()<.09;}else if(!e.itemData.shopOwner)e.itemData.blessed=Math.random()<.06;}}
  if(s.mode==='CARDS'){
   const choices=b.current.game===2?(b.current.cardSupplies||[]):['UMB_FIRE','UMB_SLEEP','SCROLL_SLEEP','SCROLL_THUNDER'].map(type=>({...b.current.catalog[type],charges:5}));
   for(const cell of cells.filter(c=>!occupied.has(positionKey(c.x,c.y))&&!s.terrain[positionKey(c.x,c.y)]&&!s.events[positionKey(c.x,c.y)]).slice(0,3)){const supply=cloneItem(choices[Math.floor(Math.random()*choices.length)]);if(supply){occupied.add(positionKey(cell.x,cell.y));items.push({...emptyEntity(cell.x,cell.y),name:supply.name,itemData:{...supply,id:id()}});}}
  }
  if(cells.length&&s.mode!=='PUZZLE'){
   const cell=cells.find(c=>!occupied.has(positionKey(c.x,c.y))&&!s.terrain[positionKey(c.x,c.y)]&&!s.events[positionKey(c.x,c.y)]);
   if(cell){occupied.add(positionKey(cell.x,cell.y));const type=Object.keys(ADVENTURE_ITEMS)[(floor-1)%Object.keys(ADVENTURE_ITEMS).length];items.push({...emptyEntity(cell.x,cell.y),name:ADVENTURE_ITEMS[type].name,itemData:{...cloneItem(ADVENTURE_ITEMS[type]),id:id()}});}
  }
  if(floor>=8&&s.scene===undefined&&s.mode!=='PUZZLE'){
   const extra=enemies.find(e=>!e.schoolKind&&e.enemyType!=='BOSS'&&e.enemyType!=='SHOPKEEPER');
   if(extra){const kind=Object.keys(EXTRA_ENEMIES)[Math.floor(floor/4)%Math.min(4,Math.floor(floor/4))],def=EXTRA_ENEMIES[kind];extra.schoolKind=kind;extra.enemyType=def.type;extra.name=def.name;}
  }
  base.current.codex=[...new Set([...(base.current.codex||[]),...enemies.map(e=>'ENEMY:'+e.name)])];
  for(const shop of enemies.filter(e=>e.enemyType==='SHOPKEEPER')){
   const stock=(shop.shopItems||[]).slice(0,3);
   for(let i=0;i<stock.length;i++){const c=cells.find(c=>Math.max(Math.abs(c.x-shop.x),Math.abs(c.y-shop.y))<=2&&!occupied.has(positionKey(c.x,c.y)));if(!c)break;occupied.add(positionKey(c.x,c.y));delete s.terrain[positionKey(c.x,c.y)];delete s.events[positionKey(c.x,c.y)];const item={...cloneItem(stock[i]),id:id(),shopOwner:shop.id,price:stock[i].price||stock[i].value||100};items.push({...emptyEntity(c.x,c.y),name:item.name,itemData:item});}
  }
  b.current.setPlayer((p:any)=>({...p,x:px,y:py,offset:{x:0,y:0}}));normalizePlacements(map,[enemies,items,traps],px,py);lastEnemies.current=cloneItem(enemies);persist();return {px,py};
 };
 const normalizePlacements=(map:string[][],groups:any[][],px:number,py:number)=>{
  const reachable=new Set<string>(),queue=[[px,py]];
  for(const [x,y] of queue){const k=positionKey(x,y);if(reachable.has(k)||!map[y]?.[x]||map[y][x]==='WALL')continue;reachable.add(k);for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]])queue.push([x+dx,y+dy]);}
  const occupied=new Set([positionKey(px,py)]),free=[...reachable].map(k=>k.split(',').map(Number)).filter(([x,y])=>map[y][x]==='FLOOR');
  for(const group of groups)for(let i=group.length-1;i>=0;i--){const e=group[i],k=positionKey(e.x,e.y);if(!reachable.has(k)||map[e.y]?.[e.x]!=='FLOOR'||occupied.has(k)){const cell=free.find(([x,y])=>!occupied.has(positionKey(x,y))&&!state.current.events[positionKey(x,y)]&&!state.current.terrain[positionKey(x,y)]);if(!cell){group.splice(i,1);continue;}[e.x,e.y]=cell;}occupied.add(positionKey(e.x,e.y));}
  for(const [k,event] of Object.entries(state.current.events)){const [x,y]=k.split(',').map(Number);if(!reachable.has(k)||map[y]?.[x]!=='FLOOR'||occupied.has(k)){const cell=free.find(([x,y])=>!occupied.has(positionKey(x,y))&&!state.current.events[positionKey(x,y)]&&!state.current.terrain[positionKey(x,y)]);delete state.current.events[k];if(cell){const key=positionKey(cell[0],cell[1]);state.current.events[key]=event;occupied.add(key);}}else occupied.add(k);}
 };
 useEffect(()=>{
  const ctx=b.current;if(!ctx.map.length||dojoRef.current)return;
  let {x:px,y:py}=ctx.player;
  if(!ctx.map[py]?.[px]||ctx.map[py][px]==='WALL'){
   const floors:{x:number;y:number}[]=[];ctx.map.forEach((row,y)=>row.forEach((tile,x)=>{if(tile==='FLOOR')floors.push({x,y});}));floors.sort((a,b)=>Math.abs(a.x-px)+Math.abs(a.y-py)-Math.abs(b.x-px)-Math.abs(b.y-py));if(!floors.length)return;
   const start=floors[0];px=start.x;py=start.y;ctx.setPlayer((p:any)=>({...p,x:px,y:py,offset:{x:0,y:0}}));
  }
  const groups=[ctx.enemies,ctx.floorItems,ctx.traps],next=cloneItem(groups),before=JSON.stringify(groups);
  normalizePlacements(ctx.map,next,px,py);
  if(JSON.stringify(next)!==before){ctx.setEnemies(next[0]);ctx.setFloorItems(next[1]);ctx.setTraps(next[2]);refresh();}
 },[bridge.map]);
 const interactNearby=()=>{const p=b.current.player,keys=[positionKey(p.x,p.y),positionKey(p.x+p.dir.x,p.y+p.dir.y)];if(state.current.terrain[keys[1]]==='SECRET'){if(b.current.inventory.some(i=>i.type==='SUPPLY_PICK'&&i.charges>0))dig();else say('模様の違う壁です。つるはしで掘ると隠しロッカーを探せます。','A marked wall. Use a pickaxe to uncover a hidden locker.');return true;}if(!keys.some(k=>state.current.events[k]&&!state.current.events[k].done))return false;interact();return true;};
 const saveCommitted=()=>{if(base.current.departure&&base.current.departure.runId===state.current.runId){delete base.current.departure;persist();}};
 const restore=(saved?:AdventureState,floor=1)=>{state.current=saved?.version===1?cloneItem(saved):newAdventure();state.current.floor=floor;state.current.runId ||= id();(state.current as any).departed=true;if(base.current.departure){if(base.current.departure.runId===state.current.runId)saveCommitted();else{const lost=base.current.departure,existing=new Set(base.current.warehouse.map(i=>i.id));base.current.warehouse.push(...lost.items.filter(i=>!existing.has(i.id)));base.current.bank+=lost.gold;delete base.current.departure;persist();}}setPanel(state.current.returned?'BASE':null);refresh();};
 const snapshot=()=>cloneItem(state.current);
 const finish=()=>{const s=state.current;if(s.rescued)return;s.rescued=true;base.current.clears[s.mode]=(base.current.clears[s.mode]||0)+1;
  if(s.mode==='RESCUE'&&base.current.rescue){base.current.warehouse.push(...cloneItem(base.current.rescue.items));base.current.rescue=null;say('忘れ物を救出！学校前の倉庫へ届けた！','Supplies rescued and delivered to the warehouse!');}
  else say('挑戦達成！帰還すると道具を倉庫へ持ち帰れます。','Challenge complete! Return to keep your supplies.');
  persist();b.current.setGameClear(true);
 };
 const canDescend=()=>{if(panelRef.current)return false;if(state.current.debt&&!state.current.alarm){say('購買部の品を持っています。精算してから階段へ。','Settle your shop bill before taking the stairs.');return false;}if(state.current.mode!=='STORY'&&b.current.floor>=goalFloor(state.current)){finish();return false;}return true;};
 const beforeMove=(dx:number,dy:number)=>{
  if(panelRef.current)return false;const ctx=b.current,s=state.current;
  if(dx===0&&dy===0)return true;const x=ctx.player.x+dx,y=ctx.player.y+dy,k=positionKey(x,y),terrain=s.terrain[k];
  if(s.town&&TOWN_SERVICES.some(v=>v.x===x&&v.y===y)){ctx.setPlayer((p:any)=>({...p,dir:{x:dx,y:dy}}));setPanel('TOWN');return false;}
  if(terrain==='WATER'&&!equipmentHas(ctx.player.equipment?.accessory,'FLOAT_MARK')){say('水路です。浮き輪バッジで渡れます。','A waterway. Wear a float badge to cross.');return false;}
  if(terrain==='HOLE'){ctx.setPlayer((p:any)=>({...p,hp:Math.max(1,p.hp-8)}));say('床の穴から次の階へ落ちた！','You fell through a hole to the next floor!');if(canDescend())ctx.descend(ctx.floor+1);return false;}
  if(terrain==='ICE')say('つるつる床！1マス先まで滑るので足元に注意。','Slippery floor! Watch the next tile as you slide.');
  return true;
 };
 const onPickup=(item:SchoolItem)=>{base.current.codex=[...new Set([...(base.current.codex||[]),item.type])];persist();if(item.shopOwner){const shop=b.current.enemies.find(e=>e.id===item.shopOwner);if(shop)(state.current as any).shopPosition={id:shop.id,x:shop.x,y:shop.y};state.current.debt+=(item.price||item.value||100);say('購買部の商品です。冒険手帳から精算できます。','Shop supply: settle the bill in your adventure notebook.');}};
 const pay=()=>{
  if(!enterMutation())return;const s=state.current;if(!s.debt)return;if((b.current.player.gold||0)<s.debt){say('おこづかいが足りません。商品を返すこともできます。','Not enough coins. You can return the supplies instead.');return;}const bill=s.debt;b.current.setPlayer((p:any)=>({...p,gold:p.gold-bill}));updateInventory((inv:any[])=>inv.map(i=>({...i,shopOwner:undefined})));s.debt=0;s.alarm=false;say('精算しました。ありがとう！','Bill settled. Thank you!');};
 const returnGoods=()=>{
  if(!enterMutation())return;const goods=b.current.inventory.filter(i=>i.shopOwner);for(const item of goods)b.current.setFloorItems((a:any[])=>[...a,{...emptyEntity(b.current.player.x,b.current.player.y),name:item.name,itemData:item}]);updateInventory((a:any[])=>a.filter(i=>!i.shopOwner));state.current.debt=Math.max(0,state.current.debt-goods.reduce((sum,i)=>sum+(i.price||i.value||100),0));if(state.current.debt===0)state.current.alarm=false;refresh();};
 const identify=(item:SchoolItem)=>b.current.setIdentifiedTypes((old:Set<string>)=>new Set([...old,item.type]));
 const canEquip=(item:SchoolItem)=>{if(panelRef.current)return false;if(state.current.mode==='NO_GEAR'&&['WEAPON','ARMOR'].includes(item.category)){say('体操服の挑戦では武器と防具は装備できません。','Weapons and armor are disabled in this challenge.');return false;}const slot=item.category==='WEAPON'?'weapon':item.category==='ARMOR'?'armor':item.category==='ACCESSORY'?'accessory':'ranged';if(b.current.player.equipment?.[slot]?.cursed){say('いたずら封印で外せません。お清め消しゴムを使おう。','The slot is sealed. Use a cleansing eraser.');return false;}return true;};
 const canUnequip=(item?:SchoolItem)=>{if(item?.cursed){say('いたずら封印で外せません。','This equipment is sealed.');return false;}return !panelRef.current;};
 const beforeUse=(item:SchoolItem)=>{
  if(panelRef.current)return true;
  if(item.wet&&item.type!=='SUPPLY_REPAIR'){say('道具が濡れています。町の宿かお手入れセットで乾かそう。','This supply is wet. Dry it at an inn or use a repair kit.');return true;}
  if(item.cursed){say('いたずら封印で使えません。','This supply is sealed.');return true;}
  if(item.shopOwner){say('商品は精算してから使おう。','Pay before using shop supplies.');return true;}
  if(blessing.current){blessing.current=false;identify(item);updateInventory((a:any[])=>a.map(i=>i.id===item.id?{...i,blessed:true}:i));say('先生の応援印がついた！','Teacher blessing applied!');b.current.turn();return true;}
  if(item.blessed&&!['WEAPON','ARMOR','ACCESSORY'].includes(item.category))b.current.setPlayer((p:any)=>({...p,hp:Math.min(p.maxHp,p.hp+20)}));
  identify(item);
  if(item.capacity){setContainer(item.id);setPanel('BAG');return true;}
  if(item.type==='SUPPLY_CLEAN'){updateInventory((a:any[])=>a.map(i=>({...i,cursed:false})));b.current.setPlayer((p:any)=>({...p,equipment:Object.fromEntries(Object.entries(p.equipment).map(([slot,e]:any)=>[slot,e?{...e,cursed:false}:null]))}));consume(item);say('いたずら封印が全部消えた！','All seals removed!');b.current.turn();return true;}
  if(item.type==='SUPPLY_BLESS'){consume(item);blessing.current=true;say('応援する道具を次に選んでください。','Select a supply to bless next.');return true;}
  if(item.type==='SUPPLY_RETURN'){returnHome(item);return true;}
  if(item.type==='SUPPLY_REVIVE'){say('持っているだけで、倒れた時に助けてくれます。','Keep this charm to revive after a defeat.');return true;}
  if(item.type==='SUPPLY_PICK'){dig(item);return true;}
  if(EXTRA_ITEMS[item.type]){
   const ctx=b.current,st=state.current;let used=true;
   if(item.type==='SUPPLY_RAIN_WAND'){
    if((item.charges||0)<=0){say('傘の魔法は使い切りました。','The umbrella has no charges left.');return true;}
    const dir=ctx.player.dir;if(!dir.x&&!dir.y){say('使う方向を向いてください。','Face the direction to use it.');return true;}
    let x=ctx.player.x+dir.x,y=ctx.player.y+dir.y,target:any;
    while(ctx.map[y]?.[x]&&ctx.map[y][x]!=='WALL'){target=ctx.enemies.find(e=>e.x===x&&e.y===y&&e.enemyType!=='SHOPKEEPER');if(target)break;x+=dir.x;y+=dir.y;}
    if(target)ctx.setEnemies((a:any[])=>a.map(e=>e.id===target.id?{...e,hp:Math.max(1,e.hp-20),status:{...e.status,frozen:2}}:e));updateInventory((a:any[])=>a.map(i=>i.id===item.id?{...i,charges:(i.charges||0)-1}:i));used=false;
   }else if(item.type==='SUPPLY_WHISTLE')ctx.setEnemies((a:any[])=>a.map(e=>e.enemyType!=='SHOPKEEPER'&&Math.max(Math.abs(e.x-ctx.player.x),Math.abs(e.y-ctx.player.y))<=2?{...e,status:{...e.status,sleep:8}}:e));
   else if(item.type==='SUPPLY_CRANE'){
    const cells:{x:number;y:number}[]=[];for(let y=1;y<ctx.map.length-1;y++)for(let x=1;x<ctx.map[y].length-1;x++)if(ctx.map[y][x]==='FLOOR'&&!st.terrain[positionKey(x,y)]&&!ctx.enemies.some(e=>Math.max(Math.abs(e.x-x),Math.abs(e.y-y))<=1)&&!ctx.traps.some(t=>t.x===x&&t.y===y))cells.push({x,y});
    const cell=cells[Math.floor(Math.random()*cells.length)];if(!cell)return true;ctx.setPlayer((p:any)=>({...p,...cell}));
   }else if(item.type==='SUPPLY_LENS')ctx.setTraps((a:any[])=>a.map(t=>({...t,visible:true})));
   else if(item.type==='SUPPLY_MAT'){if(ctx.enemies.some(e=>e.enemyType!=='SHOPKEEPER'&&Math.max(Math.abs(e.x-ctx.player.x),Math.abs(e.y-ctx.player.y))<=3)){say('敵が近くにいます。安全な場所で休もう。','Foes are nearby. Find a safe place to rest.');return true;}ctx.setPlayer((p:any)=>({...p,hp:Math.min(p.maxHp,p.hp+30)}));ctx.setBelly((v:number)=>Math.min(100,v+20));}
   else if(item.type==='SUPPLY_REPAIR'){updateInventory((a:any[])=>a.map(i=>({...i,wet:false})));ctx.setPlayer((p:any)=>({...p,equipment:Object.fromEntries(Object.entries(p.equipment).map(([slot,e]:any)=>[slot,e?{...e,wet:false,plus:(e.plus||0)+(slot==='weapon'||slot==='armor'?1:0)}:null]))}));}
   else if(item.type==='SUPPLY_MEDAL')ctx.setPlayer((p:any)=>({...p,gold:p.gold+300}));
   else return false;
   if(used)consume(item);say('探検道具を使った！','Explorer supply used!');ctx.turn(item.type==='SUPPLY_MAT'?{belly:Math.min(100,ctx.belly+20)}:undefined);refresh();return true;
  }
  return false;
 };
 const combine=(baseItem:SchoolItem,mat:SchoolItem)=>{try{return mergeEquipment(baseItem,mat);}catch(error){say(error instanceof Error?error.message:'合成できません',error instanceof Error?error.message:'Cannot combine');return null;}};
 const dig=(pick?:SchoolItem)=>{
  const ctx=b.current,item=pick||ctx.inventory.find(i=>i.type==='SUPPLY_PICK');
  if(!item||(item.charges||0)<=0){say('工作つるはしが必要です。','You need a working craft pickaxe.');return;}
  const x=ctx.player.x+ctx.player.dir.x,y=ctx.player.y+ctx.player.dir.y;
  if(x<=0||y<=0||y>=ctx.map.length-1||x>=ctx.map[0].length-1||ctx.map[y][x]!=='WALL'){say('正面に壊せる壁がありません。','No breakable wall ahead.');return;}
  ctx.setMap((a:string[][])=>a.map((row,ry)=>row.map((tile,rx)=>rx===x&&ry===y?'FLOOR':tile)));
  if(state.current.terrain[positionKey(x,y)]==='SECRET'){const found={...ADVENTURE_ITEMS.BAG_SAVE,id:id()};ctx.setFloorItems((a:any[])=>[...a,{...emptyEntity(x,y),name:found.name,itemData:found}]);say('隠しロッカーを発見！','Hidden locker discovered!');}
  delete state.current.terrain[positionKey(x,y)];updateInventory((a:any[])=>a.map(i=>i.id===item.id?{...i,charges:i.charges-1}:i));ctx.turn();refresh();
 };
 const containerPut=(targetId:string)=>{
  if(!enterMutation())return;
  const inv=b.current.inventory,bag=inv.find(i=>i.id===container),item=inv.find(i=>i.id===targetId);if(!bag||!item)return;
  try{let next=putInContainer(bag,item);if(bag.type==='BAG_CHANGE'){const choices=Object.values(b.current.catalog).filter((i:any)=>!i.capacity);const generated:any=cloneItem(choices[Math.floor(Math.random()*choices.length)]);next.contents![next.contents!.length-1]={...generated,id:id()};}
   if(bag.type==='BAG_HEAL')b.current.setPlayer((p:any)=>({...p,hp:Math.min(p.maxHp,p.hp+30)}));if(bag.type==='BAG_IDENTIFY')identify(item);
   updateInventory((a:any[])=>a.filter(i=>i.id!==item.id).map(i=>i.id===bag.id?next:i));b.current.turn();refresh();
  }catch(e){setMessage((e as Error).message);}
 };
 const containerTake=(index:number)=>{
  if(!enterMutation())return;const bag=b.current.inventory.find(i=>i.id===container);if(!bag||!['BAG_SAVE','BAG_IDENTIFY'].includes(bag.type))return;if(b.current.inventory.length>=20){say('持ち物がいっぱいです。','Your inventory is full.');return;}const item=bag.contents?.[index];if(!item)return;updateInventory((a:any[])=>[...a.map(i=>i.id===bag.id?{...i,contents:i.contents.filter((_:any,j:number)=>j!==index)}:i),item]);b.current.turn();refresh();};
 const breakContainer=()=>{
  if(!enterMutation())return;const bag=b.current.inventory.find(i=>i.id===container);if(!bag)return;consume(bag);b.current.setFloorItems((a:any[])=>[...a,...(bag.contents||[]).map((item:any)=>({...emptyEntity(b.current.player.x,b.current.player.y),name:item.name,itemData:item}))]);setPanel(null);b.current.turn();};
 const trapAction=(place=false)=>{const ctx=b.current,s=state.current,x=ctx.player.x+ctx.player.dir.x,y=ctx.player.y+ctx.player.dir.y;if(ctx.map[y]?.[x]==='WALL'||!ctx.map[y]?.[x])return;
  if(place){if(!s.pouch.length||ctx.traps.some(t=>t.x===x&&t.y===y)){say('置ける罠がありません。','No trap can be placed here.');return;}const type=s.pouch.shift()!;ctx.setTraps((a:any[])=>[...a,{...emptyEntity(x,y),type:'TRAP',trapType:type,name:'工作わな',visible:true,schoolPlaced:true}]);}
  else {const trap=ctx.traps.find(t=>t.x===x&&t.y===y&&t.visible);if(!trap){say('正面に見えている罠がありません。','No visible trap ahead.');return;}if(s.pouch.length>=8){say('罠袋は8個までです。','The trap pouch holds eight traps.');return;}s.pouch.push(trap.trapType);ctx.setTraps((a:any[])=>a.filter(t=>t.id!==trap.id));}ctx.turn();refresh();
 };
 const interact=(selectedKey?:string,spendTurn=true)=>{
  const ctx=b.current,s=state.current;const keys=[positionKey(ctx.player.x,ctx.player.y),positionKey(ctx.player.x+ctx.player.dir.x,ctx.player.y+ctx.player.dir.y)];const k=selectedKey&&s.events[selectedKey]&&!s.events[selectedKey].done?selectedKey:keys.find(key=>s.events[key]&&!s.events[key].done);
  if(!k){say('足元か正面の施設に近づこう。','Approach a facility on your tile or ahead.');return;}
  const event=s.events[k];
  if(TOWN_SERVICES.some(v=>v.kind===event.kind)){event.done=false;setPanel('TOWN');refresh();return;}
  if(event.kind==='PICNIC'){ctx.setPlayer((p:any)=>({...p,hp:p.maxHp}));ctx.setBelly(100);say('景勝地でひと休み。HPとお腹が回復した。','A scenic rest restored HP and food.');}
  if(event.kind==='REST'){if(s.companion)s.companion.hp=40+s.companion.level*5;ctx.setPlayer((p:any)=>({...p,hp:p.maxHp}));ctx.setBelly((v:number)=>Math.min(100,v+25));say('保健室で休んだ。HP全回復、お腹も少し回復！','Rested at the nurse: full HP and some food!');}
  if(event.kind==='TRADER'){if((ctx.player.gold||0)<100){say('行商のおやつは100円です。','A trader snack costs 100 coins.');return;}ctx.setPlayer((p:any)=>({...p,gold:p.gold-100}));ctx.setBelly((v:number)=>Math.min(100,v+50));say('行商のおやつを食べた！','Enjoyed a trader snack!');}
  if(event.kind==='FRIEND'){if(!s.companion)s.companion={name:'迷子の同級生',role:'FETCH',x:ctx.player.x,y:ctx.player.y,hp:40,level:1,xp:0,order:'FOLLOW'};else{s.companion.hp=40+s.companion.level*5;s.companion.xp+=5;}say('迷子の同級生と助け合う約束をした。','A lost classmate agreed to help you.');}
  if(event.kind==='STORY'){base.current.story++;const stories=[['図書委員「消しゴム怪人には、大事な装備をしまって対策しよう！」','The librarian recommends storing precious equipment before facing eraser monsters.'],['用務員「壁の模様が違うところには、隠しロッカーがあるぞ。」','The caretaker says marked walls conceal hidden lockers.'],['先生「冒険は競争だけじゃない。迷子の友達も助けてね。」','The teacher asks you to help lost classmates along the way.'],['同級生「校長先生の試練を越えたら、みんなで遠足に行こう！」','A classmate promises a field trip after the principal trial.']];const story=stories[(base.current.story-1)%stories.length];say(story[0],story[1]);persist();}
  event.done=true;if(spendTurn)ctx.turn(event.kind==='REST'?{belly:Math.min(100,ctx.belly+25)}:event.kind==='TRADER'?{belly:Math.min(100,ctx.belly+50)}:event.kind==='PICNIC'?{belly:100}:undefined);refresh();
 };
 const recoverLoot=(enemies:any[])=>{
  const live=new Set(enemies.map(e=>String(e.id))),s=state.current,ctx=b.current;
  for(const [owner,items] of Object.entries(s.swallowed))if(!live.has(owner)){const old=lastEnemies.current.find(e=>String(e.id)===owner);ctx.setFloorItems((a:any[])=>[...a,...items.map(item=>({...emptyEntity(old?.x??ctx.player.x,old?.y??ctx.player.y),name:item.name,itemData:item}))]);delete s.swallowed[owner];}
  lastEnemies.current=cloneItem(enemies);
 };
 const tick=(px:number,py:number)=>{
  const ctx=b.current,s=state.current;if(s.scene===undefined){s.floorTurns++;s.puzzleTurns++;if(s.sealedTurns>0)s.sealedTurns--;}
  recoverLoot(ctx.enemies);
  const eventKey=positionKey(px,py),event=s.events[eventKey];let recovery:{belly:number}|undefined;if(event&&!event.done){if(event.kind==='REST')recovery={belly:Math.min(100,ctx.belly+25)};else if(event.kind==='PICNIC')recovery={belly:100};else if(event.kind==='TRADER'&&ctx.player.gold>=100)recovery={belly:Math.min(100,ctx.belly+50)};interact(eventKey,false);}
  const billShop=ctx.enemies.find(e=>e.id===(s as any).shopPosition?.id)||(s as any).shopPosition;
  if(s.debt&&!s.alarm&&billShop&&Math.max(Math.abs(px-billShop.x),Math.abs(py-billShop.y))>3){s.alarm=true;say('購買部の未払い！見回り先生が追ってくる！','Unpaid supplies! Hall monitors are chasing you!');ctx.setEnemies((a:any[])=>[...a,...[[1,0],[-1,0],[0,1],[0,-1]].filter(([dx,dy])=>ctx.map[py+dy]?.[px+dx]&&ctx.map[py+dy]?.[px+dx]!=='WALL'&&!a.some(e=>e.x===px+dx&&e.y===py+dy)).map(([dx,dy])=>({...emptyEntity(px+dx,py+dy),type:'ENEMY',enemyType:'GOLEM',name:'見回り先生',schoolKind:'MONITOR',hp:100,maxHp:100,attack:25,defense:10,xp:0}))]);}
  if(s.scene===undefined&&[150,220,280].includes(s.floorTurns))say('下校チャイム！長居すると見回りが来ます。','School bell! Leave before the monitors arrive.');
  if(s.scene===undefined&&s.floorTurns===280){ctx.setEnemies((a:any[])=>[...a,...a.filter(e=>e.enemyType!=='SHOPKEEPER').slice(0,2).map(e=>({...e,id:Date.now()+Math.random(),name:'放課後の見回り',schoolKind:'MONITOR',attack:e.attack+12,hp:e.maxHp*2,maxHp:e.maxHp*2}))]);}
  if(s.scene===undefined&&s.floorTurns>=320){say('最終下校時刻！学校前へ戻されました。持ち物は忘れ物になりました。','Final bell! You were sent home and left your supplies behind.');ctx.setGameOver(true);return;}
  if(s.mode==='PUZZLE'&&s.puzzleTurns>(s as any).puzzleLimit){say('手数を使い切った。もう一度作戦を考えよう。','Turn limit reached. Try another strategy.');ctx.setGameOver(true);return;}
  if(s.scene===undefined&&s.mode!=='PUZZLE'){
   const night=Math.floor(s.floorTurns/80)%2===1;if(night!==Boolean(s.night)){s.night=night;say(night?'夜になった。傘おばけに注意！':'朝になった。見通しが戻った。',night?'Night has fallen. Watch for umbrella ghosts!':'Morning has arrived.');}
   if(s.weather==='WIND'&&s.floorTurns%12===0){const dx=Math.floor(s.floorTurns/12)%2?1:-1;ctx.setFloorItems((a:any[])=>a.map(i=>i.itemData&&!i.itemData.shopOwner&&ctx.map[i.y]?.[i.x+dx]==='FLOOR'&&!s.terrain[positionKey(i.x+dx,i.y)]&&!s.events[positionKey(i.x+dx,i.y)]&&!(i.x+dx===px&&i.y===py)&&!ctx.enemies.some(e=>e.x===i.x+dx&&e.y===i.y)&&!ctx.traps.some(t=>t.x===i.x+dx&&t.y===i.y)&&!a.some(other=>other!==i&&other.x===i.x+dx&&other.y===i.y)?{...i,x:i.x+dx}:i));say('風で床の道具が少し動いた。','Wind moved loose supplies on the floor.');}
   if(s.weather==='RAIN'&&s.floorTurns%25===0&&!equipmentHas(ctx.player.equipment?.accessory,'SUPPLY_RAINCOAT')){const paper=ctx.inventory.find(i=>!i.wet&&(i.type.startsWith('SCROLL')||i.type==='SUPPLY_MAT'));if(paper){updateInventory((a:any[])=>a.map(i=>i.id===paper.id?{...i,wet:true}:i));say('雨で紙の道具が濡れた。宿で乾かせます。','Rain soaked a paper supply. Dry it at an inn.');}}
  }
  const friend=s.companion;
  if(friend&&friend.hp>0){
   friend.moving=false;
   if(friend.order==='FOLLOW'){
    const step=companionStep(friend,px,py,ctx.map,s.terrain,ctx.enemies);
    if(step){friend.direction=companionDirection(step.x-friend.x,step.y-friend.y);friend.walkFrame=((friend.walkFrame||0)+1)%2;friend.moving=true;Object.assign(friend,step);}
    else if(px!==friend.x||py!==friend.y)friend.direction=companionDirection(px-friend.x,py-friend.y);
   }

   const near=ctx.enemies.find(e=>e.enemyType!=='SHOPKEEPER'&&Math.max(Math.abs(e.x-friend.x),Math.abs(e.y-friend.y))<=1);
   if(near){friend.attackVisualAt=Date.now();friend.direction=companionDirection(near.x-friend.x,near.y-friend.y);const damage=friend.role==='GUARD'?5+friend.level*2:2+friend.level;ctx.setEnemies((a:any[])=>a.map(e=>e.id===near.id?{...e,hp:Math.max(1,e.hp-damage)}:e));friend.hp-=Math.max(1,Math.floor(near.attack/3));friend.xp++;if(friend.xp>=friend.level*12){friend.xp=0;friend.level++;friend.hp=40+friend.level*5;say('同級生が成長した！','Your classmate leveled up!');}}
   if(friend.role==='HEAL'&&s.floorTurns%8===0&&Math.max(Math.abs(friend.x-px),Math.abs(friend.y-py))<=2)ctx.setPlayer((p:any)=>({...p,hp:Math.min(p.maxHp,p.hp+5+friend.level)}));
   if(friend.role==='FETCH'&&s.floorTurns%3===0&&ctx.inventory.length<20){const loot=ctx.floorItems.find(e=>e.itemData&&!e.itemData.shopOwner&&Math.max(Math.abs(e.x-friend.x),Math.abs(e.y-friend.y))<=1);if(loot){updateInventory((a:any[])=>[...a,loot.itemData]);ctx.setFloorItems((a:any[])=>a.filter(e=>e.id!==loot.id));say('同級生が道具を届けてくれた。','Your classmate delivered a supply.');}}
   if(friend.hp<=0)say('同級生は安全な場所へ避難した。保健室で再合流できます。','Your classmate retreated. Reunite at a facility.');
  }
  refresh();
  return recovery;
 };
 const enemySkills=()=>{
  const ctx=b.current,s=state.current,px=ctx.player.x,py=ctx.player.y;if(s.scene!==undefined)return;
  const stamp=`${s.runId}:${s.floor}:${s.floorTurns}`;
  if(lastSkills.current===stamp||s.floorTurns===0||ctx.gameOver||ctx.gameClear)return;
  lastSkills.current=stamp;
  for(const e of ctx.enemies.filter(e=>e.hp>0&&!e.status?.sleep&&!e.status?.frozen&&Math.max(Math.abs(e.x-px),Math.abs(e.y-py))<=1)){
   if(e.schoolKind==='MIMIC'&&s.floorTurns%5===0){const coin=Math.min(20,ctx.player.gold);ctx.setPlayer((p:any)=>({...p,gold:Math.max(0,p.gold-coin)}));say('びっくり宝箱がおこづかいをくわえた！','The surprise chest grabbed your coins!');}
   if(e.schoolKind==='UMBRELLA'&&s.night&&s.floorTurns%3===0)ctx.setPlayer((p:any)=>({...p,hp:Math.max(1,p.hp-3)}));
   if(e.schoolKind==='MUD'&&s.floorTurns%4===0)ctx.setPlayer((p:any)=>({...p,status:{...p.status,poison:4}}));
   if(e.schoolKind==='SPROUT'&&s.floorTurns%4===0)ctx.setEnemies((a:any[])=>a.map(v=>v.id===e.id?{...v,hp:Math.min(v.maxHp,v.hp+5)}:v));
  }
  // Enemy interactions: evolution, splitting and distinct supply attacks have visible counterplay.
  if(s.floorTurns%6===0){ctx.setEnemies((old:any[])=>{
   let next=old.map(e=>({...e}));const eater=next.find(e=>e.schoolKind==='EVOLVE'&&!e.status?.sleep&&!e.status?.frozen&&e.hp>0);if(eater){const victim=next.find(e=>e.id!==eater.id&&e.enemyType!=='BOSS'&&e.enemyType!=='SHOPKEEPER'&&Math.max(Math.abs(e.x-eater.x),Math.abs(e.y-eater.y))<=1);if(victim){next=next.filter(e=>e.id!==victim.id).map(e=>e.id===eater.id?evolveEnemy(e):e);}}
   const split=next.find(e=>e.schoolKind==='SPLIT'&&!e.status?.sleep&&!e.status?.frozen&&e.hp>0&&e.hp<e.maxHp&&(e.schoolRank||1)<3);if(split){const pos=[[1,0],[-1,0],[0,1],[0,-1]].map(([dx,dy])=>({x:split.x+dx,y:split.y+dy})).find(p=>ctx.map[p.y]?.[p.x]==='FLOOR'&&!(p.x===px&&p.y===py)&&!next.some(e=>e.x===p.x&&e.y===p.y));if(pos){split.schoolRank=3;next.push({...split,...pos,id:Date.now()+Math.random(),hp:Math.ceil(split.hp/2),schoolRank:3});}}
   return next;
  });}
  if(s.floorTurns%9===0){const enemy=ctx.enemies.find(e=>Math.max(Math.abs(e.x-px),Math.abs(e.y-py))<=1&&e.schoolKind&&!e.status?.sleep&&!e.status?.frozen&&e.hp>0);if(enemy){
   if(enemy.schoolKind==='SEAL'){const item=ctx.inventory.find(i=>!i.cursed&&!i.shopOwner);if(item){updateInventory((a:any[])=>a.map(i=>i.id===item.id?{...i,cursed:true}:i));s.sealedTurns=3;say('封印シール！道具が封印され、カードも3ターンお休み。','Seal sticker! One supply is sealed and cards rest for three turns.');}}
   if(enemy.schoolKind==='SWALLOW'){const item=ctx.inventory.find(i=>!i.capacity&&!i.shopOwner);if(item){consume(item);s.swallowed[String(enemy.id)]=[...(s.swallowed[String(enemy.id)]||[]),item];say('筆箱が道具を飲み込んだ！倒すと戻ります。','The pencil case swallowed a supply! Defeat it to recover it.');}}
   if(enemy.schoolKind==='ERASE')ctx.setPlayer((p:any)=>({...p,equipment:Object.fromEntries(Object.entries(p.equipment).map(([slot,item]:any)=>[slot,item&&['weapon','armor'].includes(slot)&&!equipmentHas(item,'STAINLESS_PEN')?{...item,plus:Math.max(-5,(item.plus||0)-1)}:item]))}));
   if(enemy.schoolKind==='RICE'){const item=ctx.inventory.find(i=>!i.capacity&&!i.shopOwner&&!['FOOD_ONIGIRI','SUPPLY_REVIVE'].includes(i.type));if(item){updateInventory((a:any[])=>a.map(i=>i.id===item.id?{...ctx.catalog.FOOD_ONIGIRI,id:i.id}:i));say('道具がおにぎりになった！大事な道具はランドセルへ。','A supply became a rice ball! Store precious items in a bag.');}}
  }}
  const placed=ctx.traps.filter(t=>t.schoolPlaced);for(const trap of placed){const enemy=ctx.enemies.find(e=>e.x===trap.x&&e.y===trap.y&&e.enemyType!=='SHOPKEEPER');if(enemy){ctx.setEnemies((a:any[])=>a.map(e=>e.id===enemy.id?{...e,hp:trap.trapType==='BOMB'?Math.max(1,e.hp-25):e.hp,status:{...e.status,...(trap.trapType==='SLEEP'?{sleep:5}:trap.trapType==='POISON'?{poison:5}:{frozen:3})}}:e));ctx.setTraps((a:any[])=>a.filter(t=>t.id!==trap.id));say('工作わなに敵がかかった！','Your crafted trap caught a foe!');}}
  refresh();
 };
 useEffect(()=>{if(!bridge.gameOver){deathHandled.current=false;return;}if(deathHandled.current||bridge.debug)return;deathHandled.current=true;
  setPanel(null);
  const charm=bridge.inventory.find(i=>i.type==='SUPPLY_REVIVE'&&!i.cursed&&!i.shopOwner);
  if(charm){consume(charm);bridge.setPlayer((p:any)=>({...p,hp:Math.ceil(p.maxHp/2),status:{...p.status,sleep:0,poison:0,frozen:0}}));bridge.setGameOver(false);say('保健室のお守りで復活！','The nurse charm revived you!');return;}
  bridge.clearSave();
  if(state.current.mode!=='RESCUE'&&state.current.mode!=='PUZZLE')base.current.rescue={floor:bridge.floor,items:cloneItem(getPossessions().filter(i=>!i.shopOwner)),attempts:0};persist();
 },[bridge.gameOver]);
 useEffect(()=>recoverLoot(bridge.enemies),[bridge.enemies]);
 useEffect(()=>enemySkills(),[bridge.enemies,revision]);
 useEffect(()=>{if(bridge.gameClear&&!state.current.rescued)finish();},[bridge.gameClear]);
 const sceneTitle=()=>text(['川辺の宿場町','風来の小学生道場','桜の滝見坂','竹林の天空橋','紅葉の鏡湖','雪山の星灯り'][state.current.scene??0],['Riverside village','School Wanderer dojo','Cherry waterfall path','Bamboo sky bridge','Autumn mirror lake','Snowy starlight'][state.current.scene??0]);
 const claimMilestone=(key:string)=>{const goals:Record<string,boolean>={DOJO10:Object.keys(base.current.dojo||{}).length>=10,DOJO50:Object.keys(base.current.dojo||{}).length>=50,DISCOVER20:(base.current.codex||[]).length>=20};if(!goals[key]||base.current.claimed?.includes(key)){say('達成すると一度だけ報酬を受け取れます。','Complete this milestone to claim its reward once.');return;}base.current.claimed=[...(base.current.claimed||[]),key];base.current.bank+=key==='DOJO50'?1000:300;persist();say('修了証の報酬を貯金箱に届けた！','Certificate reward delivered to your savings!');};
 const visibleTile=(x:number,y:number)=>state.current.scene!==undefined||(!state.current.night&&state.current.weather!=='FOG')||Math.max(Math.abs(x-b.current.player.x),Math.abs(y-b.current.player.y))<=(state.current.night?4:5);
 const dojoComplete=(stage:number,turns:number)=>{base.current.dojo={...base.current.dojo,[stage]:Math.min(base.current.dojo?.[stage]||Infinity,turns)};persist();};
 const beginDojo=(stage:number)=>{if(!DOJO_STAGES[stage-1])return;const run=dojoStart(DOJO_STAGES[stage-1]);dojoRef.current=run;setDojoRun(run);b.current.setMenuOpen(false);setPanel(null);b.current.log(text(DOJO_STAGES[stage-1].lesson,DOJO_STAGES[stage-1].english));refresh();};
 const exitDojo=()=>{dojoRef.current=null;setDojoRun(null);setPanel('DOJO');refresh();};
 const dojoStep=(action:DojoAction,fromMenu=false)=>{
  const run=dojoRef.current;if(!run)return false;if(panelRef.current&&!fromMenu)return true;if(run.won||run.failed){setPanel('DOJO_PLAY');return true;}
  if(fromMenu)setPanel(null);const next=dojoAct(run,action);dojoRef.current=next;setDojoRun(next);
  if(next.won&&!run.won){dojoComplete(next.stage,next.turns);b.current.log(text('練習クリア！学んだ作戦を冒険でも使おう。','Lesson cleared! Use this strategy in your adventure.'));setPanel('DOJO_PLAY');}
  else if(next.failed){b.current.log(text('もう一度考えてみよう。道具・位置・手数を見直そう。','Try again. Review your tools, position and turn budget.'));setPanel('DOJO_PLAY');}
  refresh();return true;
 };
 const dojoAction=()=>{const run=dojoRef.current;if(!run)return false;const target=run.enemies.some(e=>e.x===run.x+run.dir.x&&e.y===run.y+run.dir.y);return dojoStep(target?{type:'MOVE',dx:run.dir.x,dy:run.dir.y}:{type:'WAIT'});};
 const dojoMenu=()=>{if(!dojoRef.current)return false;setPanel('DOJO_PLAY');return true;};
 const dojoKey=(event:KeyboardEvent)=>{
  if(!dojoRef.current)return false;if(panelRef.current)return true;
  const moves:Record<string,[number,number]>={ArrowUp:[0,-1],ArrowDown:[0,1],ArrowLeft:[-1,0],ArrowRight:[1,0],Home:[-1,-1],PageUp:[1,-1],End:[-1,1],PageDown:[1,1],'7':[-1,-1],'9':[1,-1],'1':[-1,1],'3':[1,1],w:[0,-1],s:[0,1],a:[-1,0],d:[1,0]};
  if(moves[event.key]){event.preventDefault();dojoStep({type:'MOVE',dx:moves[event.key][0],dy:moves[event.key][1]});}
  else if(['z',' ','Enter'].includes(event.key)){event.preventDefault();dojoAction();}
  else if(event.key==='r'){event.preventDefault();dojoStep({type:'TOOL'});}
  else if(['x','c','Escape'].includes(event.key)){event.preventDefault();dojoMenu();}
  return true;
 };
 const drawDojo=(ctx:CanvasRenderingContext2D,w:number,h:number,ts:number,colors:{C0:string;C1:string;C3:string},drawHero:(player:any,x:number,y:number,size:number)=>void)=>{
  const run=dojoRef.current;if(!run)return false;const startX=run.x-Math.floor(w/ts/2),startY=run.y-Math.floor(h/ts/2);
  ctx.save();ctx.imageSmoothingEnabled=false;ctx.fillStyle=colors.C0;ctx.fillRect(0,0,w,h);
  for(let y=0;y<Math.ceil(h/ts);y++)for(let x=0;x<Math.ceil(w/ts);x++){
   const mx=startX+x,my=startY+y,tile=run.map[my]?.[mx]||'WALL',sx=x*ts,sy=y*ts;
   if(tile==='WALL'||tile==='DOOR'){ctx.fillStyle=colors.C1;ctx.fillRect(sx,sy,ts,ts);ctx.fillStyle=colors.C0;ctx.fillRect(sx+ts/4,sy+ts/4,ts/2,ts/2);}
   else{ctx.fillStyle=tile==='WATER'?'#3b97c9':colors.C3;ctx.fillRect(sx,sy,ts,ts);if(tile==='STAIRS'){ctx.fillStyle=colors.C1;for(let i=0;i<3;i++)ctx.fillRect(sx,sy+i*ts/3,ts,2);}}
   if(tile==='DOOR'){ctx.fillStyle='#dabc76';ctx.fillRect(sx+ts*.3,sy+ts*.15,ts*.4,ts*.7);}
   if(run.revealed&&run.traps.some(t=>t.x===mx&&t.y===my))drawSchoolSprite(ctx,'items',12,sx,sy,ts);
   if(DOJO_STAGES[run.stage-1].key?.x===mx&&DOJO_STAGES[run.stage-1].key?.y===my&&!run.key){ctx.fillStyle='#dbaa36';ctx.font=`bold ${ts*.6}px monospace`;ctx.fillText('⚿',sx+ts*.2,sy+ts*.7);}
   const enemy=run.enemies.find(e=>e.x===mx&&e.y===my);if(enemy){if(!drawExpansionSprite(ctx,9,sx,sy,ts)){ctx.fillStyle=colors.C0;ctx.fillRect(sx+ts*.2,sy+ts*.2,ts*.6,ts*.6);}if(enemy.sleep>0){ctx.fillStyle='#fff';ctx.font=`${ts*.25}px monospace`;ctx.fillText('Zzz',sx,sy+ts*.25);}}
   if(mx===run.x&&my===run.y)drawHero({...b.current.player,x:run.x,y:run.y,dir:run.dir},sx,sy,ts);
  }
  ctx.restore();return true;
 };
 const safelyDrawService=(ctx:CanvasRenderingContext2D,kind:string,x:number,y:number,size:number)=>{const service=TOWN_SERVICES.find(s=>s.kind===kind);return service?drawExpansionSprite(ctx,service.sprite,x,y,size):false;};
 const safeTurn=()=>state.current.scene!==undefined;
 const drawBackdrop=(ctx:CanvasRenderingContext2D,w:number,h:number)=>{if(state.current.scene!==undefined)drawScenery(ctx,state.current.scene,w,h);};
 const drawTile=(ctx:CanvasRenderingContext2D,tile:string,x:number,y:number,size:number,mx=0,my=0)=>{
  const s=state.current;if(s.scene===undefined)return false;ctx.save();ctx.imageSmoothingEnabled=false;
  const river=!s.town&&mx===5&&my>=1&&my<=9,bridge=river&&tile!=='WALL';
  const palettes=[['#568044','#314e36','#c6ae70'],['#658155','#304f3b','#c6ba87'],['#ad7644','#573e30','#d6ba80'],['#bacdd0','#445e68','#e0dcc0']];
  const palette=palettes[Math.max(0,Math.min(3,s.scene-2))];
  if(river&&!bridge){ctx.fillStyle=s.scene===5?'#406d88':'#356c86';ctx.fillRect(x,y,size,size);ctx.strokeStyle='#a8ced1';ctx.lineWidth=1;for(let i=0;i<3;i++){const yy=y+size*(.2+i*.3);ctx.beginPath();ctx.moveTo(x+size*.12,yy);ctx.lineTo(x+size*.55,yy);ctx.stroke();}}
  else if(tile==='WALL'){ctx.fillStyle=s.town?'#203b2b':palette[1];ctx.globalAlpha=.88;ctx.fillRect(x,y,size,size);ctx.globalAlpha=1;ctx.strokeStyle=s.town?'#8bac0f':palette[0];ctx.strokeRect(x+2,y+2,size-4,size-4);}
  else{ctx.fillStyle=bridge?'#98734a':s.town?'#b3ab70':palette[0];ctx.globalAlpha=bridge ? .95 : .72;ctx.fillRect(x,y,size,size);ctx.globalAlpha=1;ctx.strokeStyle=bridge?'#e2c68e':s.town?'#8f915c':palette[2];if(bridge){for(let i=0;i<5;i++){ctx.beginPath();ctx.moveTo(x,y+i*size/5);ctx.lineTo(x+size,y+i*size/5);ctx.stroke();}}else{ctx.globalAlpha=.25;ctx.strokeRect(x,y,size,size);ctx.globalAlpha=1;}}
  if(tile==='STAIRS'){ctx.fillStyle='#173426';ctx.fillRect(x+size*.15,y+size*.12,size*.7,size*.76);ctx.fillStyle='#f3d887';for(let i=0;i<4;i++)ctx.fillRect(x+size*.25,y+size*(.24+i*.14),size*(.48-i*.08),2);}
  ctx.restore();return true;
 };
 const townAction=(kind:string,type?:string)=>{
  if(!enterMutation()||!state.current.town)return;const ctx=b.current,s=state.current;const service=TOWN_SERVICES.find(v=>v.kind===kind);
  if(!service||Math.max(Math.abs(service.x-ctx.player.x),Math.abs(service.y-ctx.player.y))>1){say('町の施設の隣へ移動してから利用しよう。','Move beside the town facility first.');return;}
  const cost=kind==='INN'?80:kind==='SMITH'?150:kind==='SHOP'?(EXTRA_ITEMS[type||'']?.value||0):kind==='FESTIVAL'?50:0;
  if(ctx.player.gold<cost){say('おこづかいが足りません。','Not enough coins.');return;}
  if(kind==='SHOP'&&(!EXTRA_ITEMS[type||'']||ctx.inventory.length>=20))return;
  if(kind==='SMITH'&&s.townUsed?.includes('SMITH')){say('この町でのお手入れは済んでいます。','Your equipment was already serviced in this town.');return;}
  if(kind==='BANK'){base.current.bank+=ctx.player.gold;ctx.setPlayer((p:any)=>({...p,gold:0}));persist();say('おこづかいを学校前の貯金箱に送った。','Coins sent to your savings at school.');return;}
  if(kind==='FESTIVAL'&&s.townUsed?.includes('FESTIVAL')){say('お祭りの景品は受け取り済みです。','You already collected this festival prize.');return;}
  ctx.setPlayer((p:any)=>({...p,gold:p.gold-cost,hp:kind==='INN'?p.maxHp:p.hp,equipment:kind==='SMITH'?Object.fromEntries(Object.entries(p.equipment).map(([slot,e]:any)=>[slot,e?{...e,cursed:false,wet:false,plus:(e.plus||0)+(slot==='weapon'||slot==='armor'?1:0)}:null])):p.equipment}));
  if(kind==='INN'){ctx.setBelly(100);updateInventory((a:any[])=>a.map(i=>({...i,wet:false})));if(s.companion)s.companion.hp=40+s.companion.level*5;}
  if(kind==='SHOP')updateInventory((a:any[])=>[...a,{...cloneItem(EXTRA_ITEMS[type!]),id:id()}]);
  if(kind==='FESTIVAL'){const prize=Object.keys(EXTRA_ITEMS)[Math.floor(Math.random()*8)];const item={...cloneItem(EXTRA_ITEMS[prize]),id:id()};if(ctx.inventory.length<20)updateInventory((a:any[])=>[...a,item]);else ctx.setFloorItems((a:any[])=>[...a,{...emptyEntity(ctx.player.x,ctx.player.y),name:item.name,itemData:item}]);}
  s.townUsed=[...(s.townUsed||[]),kind];say('町で旅の準備を整えた。','Prepared for the journey in town.');refresh();
 };
 const drawTerrain=(ctx:CanvasRenderingContext2D,x:number,y:number,sx:number,sy:number,ts:number)=>{const k=positionKey(x,y),t=state.current.terrain[k],event=state.current.events[k];ctx.save();
  if(t==='SECRET'){ctx.strokeStyle=ctx.fillStyle='#9bbc0f';ctx.strokeRect(sx+ts*.3,sy+ts*.3,ts*.4,ts*.4);ctx.font=`${ts*.3}px monospace`;ctx.fillText('?',sx+ts*.4,sy+ts*.6);ctx.restore();return;}
  if(t){ctx.fillStyle=t==='WATER'?'#3b97c9':t==='ICE'?'#b2e2f1':t==='HOLE'?'#302830':'#997745';ctx.fillRect(sx+2,sy+2,ts-4,ts-4);ctx.fillStyle='#fff';ctx.font=`${Math.floor(ts*.35)}px monospace`;ctx.fillText(t==='WATER'?'≈':t==='ICE'?'◇':t==='HOLE'?'↓':'?',sx+ts*.3,sy+ts*.6);}
  if(event&&!event.done&&event.kind==='PICNIC'&&drawExpansionSprite(ctx,5,sx,sy,ts)){ctx.restore();return;}
  if(event&&safelyDrawService(ctx,event.kind,sx,sy,ts)){ctx.restore();return;}
  if(event&&!event.done&&drawSchoolSprite(ctx,event.kind==='FRIEND'?'actors':'items',event.kind==='FRIEND'?14:event.kind==='REST'?13:event.kind==='TRADER'?14:6,sx,sy,ts)){ctx.restore();return;}
  if(event&&!event.done){ctx.fillStyle='#f9e7a5';ctx.fillRect(sx+ts*.2,sy+ts*.2,ts*.6,ts*.6);ctx.fillStyle='#304a37';ctx.font=`bold ${Math.floor(ts*.4)}px monospace`;ctx.fillText(({REST:'+',TRADER:'$',FRIEND:'☺',STORY:'!'} as any)[event.kind],sx+ts*.32,sy+ts*.65);}ctx.restore();};
 const drawCompanion=(ctx:CanvasRenderingContext2D,startX:number,startY:number,ts:number,sprite?:HTMLCanvasElement)=>{const f=state.current.companion;if(!f||f.hp<=0)return;const x=(f.x-startX)*ts,y=(f.y-startY)*ts;ctx.save();if(drawCompanionSprite(ctx,f,x,y,ts)||drawSchoolSprite(ctx,'actors',(f.name==='迷子の同級生'?14:SCHOOL_ACTOR_SPRITES[f.role])+(f.order==='FOLLOW'?Math.floor(state.current.floorTurns/2)%2:0),x,y,ts)){}else if(sprite){ctx.globalAlpha=.8;ctx.drawImage(sprite,x,y,ts,ts);}else{ctx.fillStyle='#69becd';ctx.fillRect(x+ts*.3,y+ts*.25,ts*.4,ts*.65);}ctx.fillStyle='#fff';ctx.font=`bold ${Math.floor(ts*.23)}px monospace`;ctx.fillText('Lv'+f.level,x,y+ts*.18);ctx.fillStyle='#24322b';ctx.fillRect(x+3,y+ts-3,ts-6,3);ctx.fillStyle=f.hp<(40+f.level*5)/3?'#ef7468':'#8edf91';ctx.fillRect(x+3,y+ts-3,(ts-6)*Math.min(1,f.hp/(40+f.level*5)),3);ctx.restore();};
 return {state:state.current,dojoRun,beginDojo,exitDojo,dojoStep,dojoAction,dojoMenu,dojoKey,drawDojo,isDojoActive:()=>Boolean(dojoRef.current),base:base.current,revision,panel,setPanel,container,message,text,start,begin,setupInventory,prepareFloor,restore,snapshot,saveCommitted,canDescend,beforeMove,onPickup,pay,returnGoods,canEquip,canUnequip,beforeUse,combine,dig,containerPut,containerTake,breakContainer,trapAction,interact,interactNearby,modeUnlocked:(mode:AdventureMode)=>b.current.debug||modeUnlocked(base.current,mode),modeRequirement,tick,recoverLoot,returnHome,drawTerrain,drawCompanion,drawBackdrop,drawTile,safeTurn,dojoComplete,townAction,visibleTile,claimMilestone,sceneTitle,catalog:bridge.catalog,
  drawTrap:(ctx:CanvasRenderingContext2D,trap:any,x:number,y:number,size:number)=>(trap.schoolPlaced||state.current.mode==='TRAPS')&&drawSchoolSprite(ctx,'items',12,x,y,size),
  drawItem:(ctx:CanvasRenderingContext2D,item:any,x:number,y:number,size:number)=>EXTRA_ITEM_SPRITES[item?.type]!==undefined?drawExpansionSprite(ctx,EXTRA_ITEM_SPRITES[item.type],x,y,size):SCHOOL_ITEM_SPRITES[item?.type]!==undefined&&drawSchoolSprite(ctx,'items',SCHOOL_ITEM_SPRITES[item.type],x,y,size),
  drawEnemy:(ctx:CanvasRenderingContext2D,enemy:any,x:number,y:number,size:number)=>EXTRA_ENEMIES[enemy?.schoolKind]?drawExpansionSprite(ctx,EXTRA_ENEMIES[enemy.schoolKind].sprite,x,y,size):SCHOOL_ACTOR_SPRITES[enemy?.schoolKind]!==undefined&&drawSchoolSprite(ctx,'actors',SCHOOL_ACTOR_SPRITES[enemy.schoolKind],x,y,size),
  openContainer:(item:SchoolItem)=>{if(item.capacity&&!item.cursed&&!item.shopOwner){identify(item);setContainer(item.id);setPanel('BAG');}},
  resume:()=>{if(!dojoRef.current)(state.current as any).departed=true;setPanel(null);refresh();},
  slide:(x:number,y:number,dx:number,dy:number)=>{
   const ctx=b.current,s=state.current,nx=x+dx,ny=y+dy;
   if(s.terrain[positionKey(x,y)]==='ICE'&&ctx.map[ny]?.[nx]&&ctx.map[ny][nx]!=='WALL'&&!ctx.enemies.some(e=>e.x===nx&&e.y===ny)&&!['HOLE','WATER'].includes(s.terrain[positionKey(nx,ny)])&&(dx===0||dy===0||(ctx.map[y]?.[nx]!=='WALL'&&ctx.map[ny]?.[x]!=='WALL')))return {x:nx,y:ny};
   return {x,y};
  },
  enemyCanMove:(enemy:any,x:number,y:number)=>!['WATER','HOLE'].includes(state.current.terrain[positionKey(x,y)])||['GHOST','FLOATING','BAT','DRAGON'].includes(enemy.enemyType),
  takeLegacyItem:(item:SchoolItem)=>{if(base.current.rescue){base.current.rescue.items=base.current.rescue.items.filter(i=>i.id!==item.id);persist();}},
  blocksInput:()=>Boolean(panelRef.current),cardsAllowed:()=>state.current.sealedTurns<=0,
  toggleFriend:()=>{const f=state.current.companion;if(f){f.order=f.order==='FOLLOW'?'WAIT':'FOLLOW';refresh();}},
  bank:(amount:number)=>{if(!enterMutation())return;const p=b.current.player;if(amount>0){const n=Math.min(amount,p.gold||0);base.current.bank+=n;b.current.setPlayer((p:any)=>({...p,gold:p.gold-n}));}else{const n=Math.min(-amount,base.current.bank);base.current.bank-=n;b.current.setPlayer((p:any)=>({...p,gold:(p.gold||0)+n}));}persist();},
 };
}
export type SchoolAdventure=ReturnType<typeof useSchoolAdventure>;
