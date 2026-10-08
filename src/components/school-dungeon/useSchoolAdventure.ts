import {drawSchoolSprite,loadSchoolSprites,SCHOOL_ITEM_SPRITES,SCHOOL_ACTOR_SPRITES} from './sprites';
import {trans} from '../../utils/textUtils';
import {useEffect,useRef,useState} from 'react';
import {ADVENTURE_ITEMS,cloneItem,decorateFloor,equipmentHas,evolveEnemy,goalFloor,mergeEquipment,MODES,newAdventure,newBase,positionKey,puzzleLayout,putInContainer, type AdventureMode,type AdventureState,type SchoolBase,type SchoolItem} from './adventure';
export interface AdventureBridge {
 game:1|2; debug?:boolean; language:string; map:string[][]; player:any; inventory:any[]; enemies:any[]; traps:any[]; floorItems:any[];floor:number;gameOver:boolean;gameClear:boolean;
 setPlayer:(fn:any)=>void;setInventory:(fn:any)=>void;setEnemies:(fn:any)=>void;setTraps:(fn:any)=>void;setFloorItems:(fn:any)=>void;setMap:(fn:any)=>void;setGameOver:(v:boolean)=>void;setGameClear:(v:boolean)=>void;setMenuOpen:(v:boolean)=>void;setBelly:(fn:any)=>void;setIdentifiedTypes:(fn:any)=>void;
 log:(msg:string)=>void; restart:()=>void; descend:(floor:number)=>void; turn:()=>void;clearSave:()=>void; itemName:(item:any)=>string; catalog:Record<string,any>;cardSupplies?:any[];
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
 const [container,setContainer]=useState<string|null>(null);const [message,setMessage]=useState('');
 const panelRef=useRef(panel);panelRef.current=panel;
 const pending=useRef<{mode:AdventureMode;items:SchoolItem[];gold:number;friend:AdventureState['companion']}|null>(null);
 const mutationLatch=useRef(false);const enterMutation=()=>{if(mutationLatch.current)return false;mutationLatch.current=true;requestAnimationFrame(()=>mutationLatch.current=false);return true;};
 const lastSkills=useRef<string|null>(null);
 const deathHandled=useRef(false);const blessing=useRef(false);const lastEnemies=useRef<any[]>([]);
 const text=(ja:string,en:string)=>b.current.language==='ENGLISH'?en:trans(ja,b.current.language as any);
 const refresh=()=>redraw(v=>v+1);
 const persist=()=>{if(!b.current.debug)try{localStorage.setItem(key,JSON.stringify(base.current));}catch{setMessage(text('保存領域がいっぱいです。道具を減らして再保存してください。','Storage is full. Reduce stored supplies and try again.'));refresh();return false;}refresh();return true;};
 const say=(ja:string,en:string)=>{const msg=text(ja,en);b.current.log(msg);setMessage(msg);refresh();};
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
  const s=state.current;
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
  const occupied=new Set([...enemies,...items,...traps].map(e=>positionKey(e.x,e.y)));
  const cells=decorateFloor(s,map,px,py,floor,occupied);
  if(s.mode==='PUZZLE'){s.terrain={};s.events={};}
  if(floor===1)b.current.setPlayer((p:any)=>({...p,gold:(s as any).startingGold||0}));
  const kinds=['SPLIT','SEAL','SWALLOW','ERASE','RICE','EVOLVE'];
  enemies.forEach((e,i)=>{if(e.enemyType!=='BOSS'&&e.enemyType!=='SHOPKEEPER'&&(s.mode==='PUZZLE'||i%3===0)){e.schoolKind=s.mode==='PUZZLE'?'DETENTION':kinds[(i+floor)%kinds.length];e.schoolRank=1;if(s.mode!=='PUZZLE')e.enemyType=({SPLIT:'SLIME',SEAL:'MAGE',SWALLOW:'THIEF',ERASE:'DRAIN',RICE:'MANDRAKE',EVOLVE:'GOLEM'} as any)[e.schoolKind];e.name=({'DETENTION':'居残りおばけ','SPLIT':'ちぎれ紙おばけ','SEAL':'封印シール小僧','SWALLOW':'ぱくぱく筆箱','ERASE':'消しゴム怪人','RICE':'おにぎり係','EVOLVE':'ガキ大将'} as any)[e.schoolKind];}});
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
  for(const shop of enemies.filter(e=>e.enemyType==='SHOPKEEPER')){
   const stock=(shop.shopItems||[]).slice(0,3);
   for(let i=0;i<stock.length;i++){const c=cells.find(c=>Math.max(Math.abs(c.x-shop.x),Math.abs(c.y-shop.y))<=2&&!occupied.has(positionKey(c.x,c.y)));if(!c)break;occupied.add(positionKey(c.x,c.y));delete s.terrain[positionKey(c.x,c.y)];delete s.events[positionKey(c.x,c.y)];const item={...cloneItem(stock[i]),id:id(),shopOwner:shop.id,price:stock[i].price||stock[i].value||100};items.push({...emptyEntity(c.x,c.y),name:item.name,itemData:item});}
  }
  lastEnemies.current=cloneItem(enemies);refresh();return {px,py};
 };
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
  if(terrain==='WATER'&&!equipmentHas(ctx.player.equipment?.accessory,'FLOAT_MARK')){say('水路です。浮き輪バッジで渡れます。','A waterway. Wear a float badge to cross.');return false;}
  if(terrain==='HOLE'){ctx.setPlayer((p:any)=>({...p,hp:Math.max(1,p.hp-8)}));say('床の穴から次の階へ落ちた！','You fell through a hole to the next floor!');if(canDescend())ctx.descend(ctx.floor+1);return false;}
  if(terrain==='ICE')say('つるつる床！1マス先まで滑るので足元に注意。','Slippery floor! Watch the next tile as you slide.');
  return true;
 };
 const onPickup=(item:SchoolItem)=>{if(item.shopOwner){const shop=b.current.enemies.find(e=>e.id===item.shopOwner);if(shop)(state.current as any).shopPosition={id:shop.id,x:shop.x,y:shop.y};state.current.debt+=(item.price||item.value||100);say('購買部の商品です。冒険手帳から精算できます。','Shop supply: settle the bill in your adventure notebook.');}};
 const pay=()=>{
  if(!enterMutation())return;const s=state.current;if(!s.debt)return;if((b.current.player.gold||0)<s.debt){say('おこづかいが足りません。商品を返すこともできます。','Not enough coins. You can return the supplies instead.');return;}const bill=s.debt;b.current.setPlayer((p:any)=>({...p,gold:p.gold-bill}));updateInventory((inv:any[])=>inv.map(i=>({...i,shopOwner:undefined})));s.debt=0;s.alarm=false;say('精算しました。ありがとう！','Bill settled. Thank you!');};
 const returnGoods=()=>{
  if(!enterMutation())return;const goods=b.current.inventory.filter(i=>i.shopOwner);for(const item of goods)b.current.setFloorItems((a:any[])=>[...a,{...emptyEntity(b.current.player.x,b.current.player.y),name:item.name,itemData:item}]);updateInventory((a:any[])=>a.filter(i=>!i.shopOwner));state.current.debt=Math.max(0,state.current.debt-goods.reduce((sum,i)=>sum+(i.price||i.value||100),0));if(state.current.debt===0)state.current.alarm=false;refresh();};
 const identify=(item:SchoolItem)=>b.current.setIdentifiedTypes((old:Set<string>)=>new Set([...old,item.type]));
 const canEquip=(item:SchoolItem)=>{if(panelRef.current)return false;if(state.current.mode==='NO_GEAR'&&['WEAPON','ARMOR'].includes(item.category)){say('体操服の挑戦では武器と防具は装備できません。','Weapons and armor are disabled in this challenge.');return false;}const slot=item.category==='WEAPON'?'weapon':item.category==='ARMOR'?'armor':item.category==='ACCESSORY'?'accessory':'ranged';if(b.current.player.equipment?.[slot]?.cursed){say('いたずら封印で外せません。お清め消しゴムを使おう。','The slot is sealed. Use a cleansing eraser.');return false;}return true;};
 const canUnequip=(item?:SchoolItem)=>{if(item?.cursed){say('いたずら封印で外せません。','This equipment is sealed.');return false;}return !panelRef.current;};
 const beforeUse=(item:SchoolItem)=>{
  if(panelRef.current)return true;
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
 const interact=()=>{
  const ctx=b.current,s=state.current;const keys=[positionKey(ctx.player.x,ctx.player.y),positionKey(ctx.player.x+ctx.player.dir.x,ctx.player.y+ctx.player.dir.y)];const k=keys.find(key=>s.events[key]&&!s.events[key].done);
  if(!k){say('足元か正面の施設に近づこう。','Approach a facility on your tile or ahead.');return;}
  const event=s.events[k];
  if(event.kind==='REST'){if(s.companion)s.companion.hp=40+s.companion.level*5;ctx.setPlayer((p:any)=>({...p,hp:p.maxHp}));ctx.setBelly((v:number)=>Math.min(100,v+25));say('保健室で休んだ。HP全回復、お腹も少し回復！','Rested at the nurse: full HP and some food!');}
  if(event.kind==='TRADER'){if((ctx.player.gold||0)<100){say('行商のおやつは100円です。','A trader snack costs 100 coins.');return;}ctx.setPlayer((p:any)=>({...p,gold:p.gold-100}));ctx.setBelly((v:number)=>Math.min(100,v+50));say('行商のおやつを食べた！','Enjoyed a trader snack!');}
  if(event.kind==='FRIEND'){if(!s.companion)s.companion={name:'迷子の同級生',role:'FETCH',x:ctx.player.x,y:ctx.player.y,hp:40,level:1,xp:0,order:'FOLLOW'};else{s.companion.hp=40+s.companion.level*5;s.companion.xp+=5;}say('迷子の同級生と助け合う約束をした。','A lost classmate agreed to help you.');}
  if(event.kind==='STORY'){base.current.story++;const stories=[['図書委員「消しゴム怪人には、大事な装備をしまって対策しよう！」','The librarian recommends storing precious equipment before facing eraser monsters.'],['用務員「壁の模様が違うところには、隠しロッカーがあるぞ。」','The caretaker says marked walls conceal hidden lockers.'],['先生「冒険は競争だけじゃない。迷子の友達も助けてね。」','The teacher asks you to help lost classmates along the way.'],['同級生「校長先生の試練を越えたら、みんなで遠足に行こう！」','A classmate promises a field trip after the principal trial.']];const story=stories[(base.current.story-1)%stories.length];say(story[0],story[1]);persist();}
  event.done=true;ctx.turn();refresh();
 };
 const recoverLoot=(enemies:any[])=>{
  const live=new Set(enemies.map(e=>String(e.id))),s=state.current,ctx=b.current;
  for(const [owner,items] of Object.entries(s.swallowed))if(!live.has(owner)){const old=lastEnemies.current.find(e=>String(e.id)===owner);ctx.setFloorItems((a:any[])=>[...a,...items.map(item=>({...emptyEntity(old?.x??ctx.player.x,old?.y??ctx.player.y),name:item.name,itemData:item}))]);delete s.swallowed[owner];}
  lastEnemies.current=cloneItem(enemies);
 };
 const tick=(px:number,py:number)=>{
  const ctx=b.current,s=state.current;s.floorTurns++;s.puzzleTurns++;if(s.sealedTurns>0)s.sealedTurns--;
  recoverLoot(ctx.enemies);
  const billShop=ctx.enemies.find(e=>e.id===(s as any).shopPosition?.id)||(s as any).shopPosition;
  if(s.debt&&!s.alarm&&billShop&&Math.max(Math.abs(px-billShop.x),Math.abs(py-billShop.y))>3){s.alarm=true;say('購買部の未払い！見回り先生が追ってくる！','Unpaid supplies! Hall monitors are chasing you!');ctx.setEnemies((a:any[])=>[...a,...[[1,0],[-1,0],[0,1],[0,-1]].filter(([dx,dy])=>ctx.map[py+dy]?.[px+dx]&&ctx.map[py+dy]?.[px+dx]!=='WALL'&&!a.some(e=>e.x===px+dx&&e.y===py+dy)).map(([dx,dy])=>({...emptyEntity(px+dx,py+dy),type:'ENEMY',enemyType:'GOLEM',name:'見回り先生',schoolKind:'MONITOR',hp:100,maxHp:100,attack:25,defense:10,xp:0}))]);}
  if([150,220,280].includes(s.floorTurns))say('下校チャイム！長居すると見回りが来ます。','School bell! Leave before the monitors arrive.');
  if(s.floorTurns===280){ctx.setEnemies((a:any[])=>[...a,...a.filter(e=>e.enemyType!=='SHOPKEEPER').slice(0,2).map(e=>({...e,id:Date.now()+Math.random(),name:'放課後の見回り',schoolKind:'MONITOR',attack:e.attack+12,hp:e.maxHp*2,maxHp:e.maxHp*2}))]);}
  if(s.floorTurns>=320){say('最終下校時刻！学校前へ戻されました。持ち物は忘れ物になりました。','Final bell! You were sent home and left your supplies behind.');ctx.setGameOver(true);return;}
  if(s.mode==='PUZZLE'&&s.puzzleTurns>(s as any).puzzleLimit){say('手数を使い切った。もう一度作戦を考えよう。','Turn limit reached. Try another strategy.');ctx.setGameOver(true);return;}
  const friend=s.companion;
  if(friend&&friend.hp>0){
   if(friend.order==='FOLLOW'){const options=[[0,-1],[0,1],[-1,0],[1,0]].map(([dx,dy])=>({x:friend.x+dx,y:friend.y+dy})).filter(p=>ctx.map[p.y]?.[p.x]&&ctx.map[p.y][p.x]!=='WALL'&&s.terrain[positionKey(p.x,p.y)]!=='WATER'&&!ctx.enemies.some(e=>e.x===p.x&&e.y===p.y));options.sort((a,b)=>Math.abs(a.x-px)+Math.abs(a.y-py)-Math.abs(b.x-px)-Math.abs(b.y-py));if(options[0]&&Math.abs(friend.x-px)+Math.abs(friend.y-py)>1)Object.assign(friend,options[0]);}
   const near=ctx.enemies.find(e=>e.enemyType!=='SHOPKEEPER'&&Math.max(Math.abs(e.x-friend.x),Math.abs(e.y-friend.y))<=1);
   if(near){const damage=friend.role==='GUARD'?5+friend.level*2:2+friend.level;ctx.setEnemies((a:any[])=>a.map(e=>e.id===near.id?{...e,hp:Math.max(1,e.hp-damage)}:e));friend.hp-=Math.max(1,Math.floor(near.attack/3));friend.xp++;if(friend.xp>=friend.level*12){friend.xp=0;friend.level++;friend.hp=40+friend.level*5;say('同級生が成長した！','Your classmate leveled up!');}}
   if(friend.role==='HEAL'&&s.floorTurns%8===0&&Math.max(Math.abs(friend.x-px),Math.abs(friend.y-py))<=2)ctx.setPlayer((p:any)=>({...p,hp:Math.min(p.maxHp,p.hp+5+friend.level)}));
   if(friend.role==='FETCH'&&s.floorTurns%3===0&&ctx.inventory.length<20){const loot=ctx.floorItems.find(e=>e.itemData&&!e.itemData.shopOwner&&Math.max(Math.abs(e.x-friend.x),Math.abs(e.y-friend.y))<=1);if(loot){updateInventory((a:any[])=>[...a,loot.itemData]);ctx.setFloorItems((a:any[])=>a.filter(e=>e.id!==loot.id));say('同級生が道具を届けてくれた。','Your classmate delivered a supply.');}}
   if(friend.hp<=0)say('同級生は安全な場所へ避難した。保健室で再合流できます。','Your classmate retreated. Reunite at a facility.');
  }
  refresh();
 };
 const enemySkills=()=>{
  const ctx=b.current,s=state.current,px=ctx.player.x,py=ctx.player.y;
  const stamp=`${s.runId}:${s.floor}:${s.floorTurns}`;
  if(lastSkills.current===stamp||s.floorTurns===0||ctx.gameOver||ctx.gameClear)return;
  lastSkills.current=stamp;
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
 const drawTerrain=(ctx:CanvasRenderingContext2D,x:number,y:number,sx:number,sy:number,ts:number)=>{const k=positionKey(x,y),t=state.current.terrain[k],event=state.current.events[k];ctx.save();
  if(t==='SECRET'&&drawSchoolSprite(ctx,'items',15,sx,sy,ts)){ctx.restore();return;}
  if(t){ctx.fillStyle=t==='WATER'?'#3b97c9':t==='ICE'?'#b2e2f1':t==='HOLE'?'#302830':'#997745';ctx.fillRect(sx+2,sy+2,ts-4,ts-4);ctx.fillStyle='#fff';ctx.font=`${Math.floor(ts*.35)}px monospace`;ctx.fillText(t==='WATER'?'≈':t==='ICE'?'◇':t==='HOLE'?'↓':'?',sx+ts*.3,sy+ts*.6);}
  if(event&&!event.done&&drawSchoolSprite(ctx,event.kind==='FRIEND'?'actors':'items',event.kind==='FRIEND'?14:event.kind==='REST'?13:event.kind==='TRADER'?14:6,sx,sy,ts)){ctx.restore();return;}
  if(event&&!event.done){ctx.fillStyle='#f9e7a5';ctx.fillRect(sx+ts*.2,sy+ts*.2,ts*.6,ts*.6);ctx.fillStyle='#304a37';ctx.font=`bold ${Math.floor(ts*.4)}px monospace`;ctx.fillText(({REST:'+',TRADER:'$',FRIEND:'☺',STORY:'!'} as any)[event.kind],sx+ts*.32,sy+ts*.65);}ctx.restore();};
 const drawCompanion=(ctx:CanvasRenderingContext2D,startX:number,startY:number,ts:number,sprite?:HTMLCanvasElement)=>{const f=state.current.companion;if(!f||f.hp<=0)return;const x=(f.x-startX)*ts,y=(f.y-startY)*ts;ctx.save();if(drawSchoolSprite(ctx,'actors',(f.name==='迷子の同級生'?14:SCHOOL_ACTOR_SPRITES[f.role])+(f.order==='FOLLOW'?Math.floor(state.current.floorTurns/2)%2:0),x,y,ts)){}else if(sprite){ctx.globalAlpha=.8;ctx.drawImage(sprite,x,y,ts,ts);}else{ctx.fillStyle='#69becd';ctx.fillRect(x+ts*.3,y+ts*.25,ts*.4,ts*.65);}ctx.fillStyle='#fff';ctx.font=`bold ${Math.floor(ts*.23)}px monospace`;ctx.fillText('Lv'+f.level,x,y+ts*.18);ctx.restore();};
 return {state:state.current,base:base.current,revision,panel,setPanel,container,message,text,start,begin,setupInventory,prepareFloor,restore,snapshot,saveCommitted,canDescend,beforeMove,onPickup,pay,returnGoods,canEquip,canUnequip,beforeUse,combine,dig,containerPut,containerTake,breakContainer,trapAction,interact,tick,recoverLoot,returnHome,drawTerrain,drawCompanion,
  drawTrap:(ctx:CanvasRenderingContext2D,trap:any,x:number,y:number,size:number)=>(trap.schoolPlaced||state.current.mode==='TRAPS')&&drawSchoolSprite(ctx,'items',12,x,y,size),
  drawItem:(ctx:CanvasRenderingContext2D,item:any,x:number,y:number,size:number)=>SCHOOL_ITEM_SPRITES[item?.type]!==undefined&&drawSchoolSprite(ctx,'items',SCHOOL_ITEM_SPRITES[item.type],x,y,size),
  drawEnemy:(ctx:CanvasRenderingContext2D,enemy:any,x:number,y:number,size:number)=>SCHOOL_ACTOR_SPRITES[enemy?.schoolKind]!==undefined&&drawSchoolSprite(ctx,'actors',SCHOOL_ACTOR_SPRITES[enemy.schoolKind],x,y,size),
  openContainer:(item:SchoolItem)=>{if(item.capacity&&!item.cursed&&!item.shopOwner){identify(item);setContainer(item.id);setPanel('BAG');}},
  resume:()=>{(state.current as any).departed=true;setPanel(null);refresh();},
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
