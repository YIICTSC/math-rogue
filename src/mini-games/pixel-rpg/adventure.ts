import { CORE_CHAMBERS, ENDING, FEATURES, PROLOGUE, REGIONS, VEHICLES, type Copy, type Vehicle } from './campaign';
import type { AssignmentReviewProblem } from '../../types';
import { CARDS, GEAR, HEROES, HERO_LIST, ITEMS, JOBS, RELICS, starterDeck, type DeckCard, type Element, type EquipSlot, type ItemId, type RelicId, type Technique } from './catalog';
import type { KartQuestion } from '../gakuro-kart/learning';
import { DUNGEON_LAYOUT_VERSION, OFFSETS, Tile, WORLD_ID, add, area, areaSite, canTravel, climateAt, coordinate, distance, furnitureAt, isAir, isRoad, isShore, isWater, mapId, nearbyLandmark, noise, regionAt, same, sitePoint, tileAt, type Direction, type Landmark, type Point } from './world';

export type HeroState = {
  id: string; level: number; xp: number; hp: number; job: string; mastery: Record<string,number>; inherited?: string;
  deck: DeckCard[]; learned: string[]; equipment: Partial<Record<EquipSlot,string>>; relic?: RelicId; rear: boolean;
};
export type Settings = { encounters: 'random'|'symbol'; rate: 'normal'|'low'; answer: 'choice'|'typing'|'writing'; quizHints: 'turn'|'battle'|'off'; rateFx: 'normal'|'quick'|'instant'; reduceFx: boolean; read: boolean; avoidWeak?: boolean; language?: 'JAPANESE'|'HIRAGANA'|'ENGLISH'; modes: string[] };
type MissedQuestion = KartQuestion | AssignmentReviewProblem;
export type Adventure = {
  version: 1; leader: string; heroes: Record<string,HeroState>; party: string[];
  map: string; at: Point; direction: Direction; trail: Point[]; parent: {map:string; at:Point; vehicle:Vehicle}[];
  dungeonLayout?: typeof DUNGEON_LAYOUT_VERSION;
  vehicle: Vehicle; licenses: Vehicle[]; checkpoint: {map:string; at:Point};
  stage: number; ending: boolean; cycle: number; completed: string[]; quests: string[]; flags: string[]; open: string[];
  rocks: Record<string,Point>; visits: string[]; monsters: string[]; books: number[];
  gold: number; gear: string[]; relics: RelicId[]; partyRelic?: RelicId; items: Record<ItemId,number>; unlockedCards: string[];
  link?: number;
  steps: number; minutes: number; elapsed: number; rng: number; streak: number; repellent: number;
  learned: { correct: number; attempts: number; missed: MissedQuestion[]; units: Record<string,{correct:number;attempts:number}> };
  settings: Settings; rank: number;
};
export type Scene = { speaker: Copy; line: Copy; hero?: string; portrait?: string };
export type Encounter = { region: number; variant: number; key?: string; boss?: boolean; hidden?: boolean; rush?: number; surprise?: 'party'|'foe' };
export type Effect =
  | { type:'dialog'; scenes:Scene[] }
  | { type:'service'; service:NonNullable<Landmark['service']>; region:number }
  | { type:'battle'; encounter:Encounter }
  | { type:'study'; landmark:Landmark }
  | { type:'house-invitation'; house:string }
  | { type:'ending'; scenes:Scene[] };
export type Change = { state: Adventure; message?: Copy; effect?: Effect; sound?: 'select'|'buff'|'win'|'damage' };
export type Win = { xp:number; mastery:number; gold:number; enemyIds:string[]; hp:Record<string,number>; card?:string };
export type VictoryRewards = {
  heroes: { id:string; xp:number; mastery:number; level:number; reserve:boolean }[];
  gold: number;
  loot: { name:Copy; quantity?:number }[];
};
const defaultSettings: Settings = { encounters:'random',rate:'normal',answer:'choice',quizHints:'turn',rateFx:'normal',reduceFx:false,read:true,modes:[] };
const BOOK_SITES = [1,1,1,2,1,1,1];
const GROUPS = {
  elementary: ['小学生編','Elementary School'],
  'high-school': ['高校編','High School'],
  magic: ['マジック編','Magic Academy'],
  guest: ['異郷の旅人','Other worlds'],
} satisfies Record<string,Copy>;
export { GROUPS };
const text = (ja:string,en:string):Copy=>[ja,en];
const got = (list:string[],key:string)=>list.includes(key)?list:[...list,key];
export const inRange = (value:number,min:number,max:number)=>Math.max(min,Math.min(value,max));
export const xpNext = (level:number)=>16 + level*10;
export const progressFlag = (region:number)=>`met-${region}`;
export const questFlag = (region:number)=>`quest-${region}`;
const seedWeapon = (job:string)=>`weapon-${JOBS[job].style}-0`;
export function maxHp(hero: HeroState) {return stats(hero).hp;}
export function stats(hero: HeroState) {
  const [hp,atk,magic,ward]=JOBS[hero.job].stats;
  const values = Object.values(hero.equipment).map(id=>GEAR[id]).filter(Boolean);
  const sum = (key:'hp'|'atk'|'magic'|'ward'|'draw'|'link'|'energy')=>values.reduce((a,g)=>a+(g[key]||0),0);
  const style=JOBS[hero.job].style;
  return {
    hp:HEROES[hero.id].maxHp+hp+(hero.level-1)*5+sum('hp'),
    attack:atk+Math.floor((hero.level-1)*.78)+sum('atk'),
    magic:magic+Math.floor((hero.level-1)*.74)+sum('magic'),
    ward:ward+Math.floor((hero.level-1)*.34)+sum('ward'),
    resist:Math.floor((magic+ward+hero.level)/3),
    speed:(style==='flow'?5:style==='craft'?4:style==='guard'?1:3)+Math.floor(hero.level/3),
    luck:(HEROES[hero.id].passive==='code'?5:2)+Math.floor(hero.level/4),
    draw:sum('draw'),link:sum('link'),energy:sum('energy'), element:values.find(g=>g.slot==='weapon')?.element,
  };
}

function makeHero(id: string,level=1):HeroState{
  const h=HEROES[id],job=h.job;
  const result:HeroState={ id,level,xp:0,hp:1,job,mastery:{},learned:[],deck:starterDeck(h),equipment:{weapon:seedWeapon(job)},rear:['heart','arcana','craft'].includes(JOBS[job].style) };
  result.hp=maxHp(result);
  return result;
}
export function randomState(value: number): [seed:number,random:number] {
  let n=(value>>>0)||0x71c539d;
  n ^= n<<13;n ^= n>>>17;n ^= n<<5;
  return [n>>>0,(n>>>0)/4294967296];
}
export function newAdventure(id:string,seed:number,settings:Partial<Settings>={},plus?:Adventure):Adventure {
  const first=makeHero(id),start=area(mapId(0,0)).start;
  if(plus){
    // Carry builds and collections while restarting the story and unlocking travel again.
    const heroes=Object.fromEntries(Object.entries(plus.heroes).map(([key,h])=>[key,{...h,hp:maxHp(h)}]));
    const fresh=newAdventure(id,seed,settings);
    const party=[id,...plus.party.filter(h=>h!==id)].slice(0,4);
    return {...fresh,heroes:{...heroes,[id]:heroes[id]??first},party,cycle:plus.cycle+1,gold:plus.gold,gear:plus.gear,items:plus.items,
      relics:plus.relics,partyRelic:plus.partyRelic,unlockedCards:plus.unlockedCards,monsters:plus.monsters,learned:plus.learned,flags:plus.flags.filter(flag=>flag.startsWith('mastery:'))};
  }
  return {
    version:1,leader:id,heroes:{[id]:first},party:[id],map:mapId(0,0),at:start,direction:'up',trail:[start],parent:[],dungeonLayout:DUNGEON_LAYOUT_VERSION,vehicle:'foot',licenses:['foot'],
    checkpoint:{map:mapId(0,0),at:start},stage:0,ending:false,cycle:0,completed:[],quests:[],flags:[],open:[],rocks:{},visits:[mapId(0,0)],monsters:[],books:[],
    gold:32,gear:[seedWeapon(first.job)],relics:[],items:{tonic:3,salve:1,dew:1,oil:0},unlockedCards:['remedy','field-note','opening'],link:0,
    steps:0,minutes:8*60,elapsed:0,rng:seed>>>0,streak:0,repellent:0,settings:{...defaultSettings,...settings},
    learned:{correct:0,attempts:0,missed:[],units:{}},rank:0,
  };
}
export const introScenes=():Scene[]=>PROLOGUE.map(line=>({speaker:['序章 異世界への旅立ち','Prologue · Into another world'],line}));
export function endingScenes(s:Adventure):Scene[] {
  const reply=s.party.map(id=>({speaker:HEROES[id].name,line:HEROES[id].side,hero:id}));
  return ENDING.map<Scene>((line,index)=>({speaker:index===0?['最終章 知識を未来へ','Final chapter · Knowledge for tomorrow']:['旅の記録','Travel log'],line})).concat(reply);
}

function cloneHero(s:Adventure,id:string,update:(h:HeroState)=>HeroState){
  const h=s.heroes[id];return h?{...s,heroes:{...s.heroes,[id]:update(h)}}:s;
}
function recruits(s:Adventure, region:number, variant=1, intro=false): { state:Adventure; scenes:Scene[] } {
  const ordered: string[] = [];
  if(intro){
    const order=Object.keys(GROUPS).filter(group=>group!=='guest'&&group!==HEROES[s.leader].origin).slice(0,2);
    for(const group of order){
      const list=HERO_LIST.filter(hero=>hero.origin===group);
      const choices=group==='magic' ? list.filter(x=>x.passive==='bloom'||x.passive==='hearty') : list.filter(x=>['guard','resolve'].includes(x.passive));
      const candidate=(choices.length?choices:list).find(x=>!s.heroes[x.id]);
      if(candidate) ordered.push(candidate.id);
    }
  } else {
    const table = [
      ['elementary-librarian','high-school-librarian','magic-akari','high-school-gardener','elementary-bard','magic-ren'],
      ['high-school-mage','magic-madoka','elementary-mage','magic-riku','high-school-bard','elementary-caretaker'],
      ['magic-shizuku','magic-koharu','magic-tsubasa','magic-sera','magic-soma','high-school-caretaker'],
      ['high-school-assassin','magic-minato','elementary-chef','magic-yamato','elementary-dodgeball','high-school-chef'],
      ['magic-mirai','magic-leon','high-school-dodgeball','magic-rei','elementary-gardener','magic-sakuya'],
      ['magic-elliot','magic-sakuya','elementary-assassin','magic-rei','magic-ren','magic-sera'],
      HERO_LIST.map(h=>h.id),
    ][region];
    const remaining=table.filter(id=>!s.heroes[id]);
    if(remaining.length) ordered.push(remaining[(variant-1+remaining.length)%remaining.length]);
    if(region===6 && s.stage>=7) ordered.push(...remaining.filter(id=>!ordered.includes(id)));
  }
  let next=s;
  const scenes:Scene[]=[];
  for(const id of ordered){
    const hero=HEROES[id], unit=makeHero(id,Math.min(13,1+region*2));
    next={...next,heroes:{...next.heroes,[id]:unit},gear:got(next.gear,seedWeapon(unit.job)),party:next.party.length<4?[...next.party,id]:next.party};
    scenes.push({speaker:hero.name,line:hero.voice,hero:id});
    scenes.push({speaker:GROUPS[hero.origin],line:[`${hero.name[0]}が仲間になった。`,`${hero.name[1]} joined the party.`],hero:id});
  }
  return { state:next,scenes };
}

const asIs = (state:Adventure,message?:Copy):Change=>({state,message});
function scene(state:Adventure,scenes:Scene[],message?:Copy):Change{return {state,effect:{type:'dialog',scenes},message};}
export function currentRegion(s: Adventure) { return s.map===WORLD_ID?regionAt(s.at):area(s.map).region; }
export function climate(s:Adventure){return climateAt(area(s.map),s.at);}
export function visible(s: Adventure, landmark: Landmark) {
  if(landmark.kind==='enemy') return !s.completed.includes(landmark.id) && s.repellent===0;
  if(landmark.kind==='trial'){
    if(s.completed.includes(landmark.id))return false;
    if(landmark.variant===1)return Boolean(s.flags.includes(s.map+':mechanism') || s.open.includes(s.map+':passage'));
    if(landmark.variant===2)return s.flags.includes('guild');
    return s.stage>=7;
  }
  if(['chest','seal','recruit','boss','secret'].includes(landmark.kind)) return !s.open.includes(landmark.id) && !s.completed.includes(landmark.id);
  return true;
}
export function currentLandmark(s:Adventure) {
  const a=area(s.map);
  const ahead=add(s.at,OFFSETS[s.direction]);
  const rock=a.points.find(item=>item.kind==='rock');
  if(rock && same(ahead,s.rocks[a.id]??rock))return {...rock,...(s.rocks[a.id]??rock)};
  if(a.houseGame && furnitureAt(a,ahead)===a.houseGame.table)return a.points.find(l=>l.kind==='house-game');
  return nearbyLandmark(a,s.at,s.direction,l=>visible(s,l) && l.kind!=='rock');
}
export const houseRewardClaimed=(s:Adventure,house:string)=>s.flags.includes('house-game:'+house);
export function grantHouseReward(s:Adventure,house:string):Change {
  const reward=area(house).houseGame?.reward;
  if(!reward||s.map!==house||houseRewardClaimed(s,house))return asIs(s);
  const {gold,item,quantity}=reward;
  const received=Math.min(quantity,999-s.items[item]);
  return {
    state:{...s,gold:s.gold+gold,items:{...s.items,[item]:s.items[item]+received},flags:got(s.flags,'house-game:'+house)},
    message:[`初勝利の褒美 · ${gold} G${received? ` · ${ITEMS[item].name[0]} ×${received}`:''}`,
      `First win reward · ${gold} G${received? ` · ${ITEMS[item].name[1]} ×${received}`:''}`],
    sound:'win',
  };
}
export function activeTile(s:Adventure,p:Point):Tile {
  const a=area(s.map), tile=tileAt(a,p);
  if(a.place!=='dungeon')return tile;
  const active=s.flags.includes(a.id+':mechanism');
  const feature=a.points.find(l=>l.kind==='gate')?.feature;
  if(tile===Tile.Hidden&&s.open.includes(a.id+':passage'))return Tile.Cave;
  if(tile===Tile.Water&&active&&feature==='water')return Tile.Bridge;
  if(tile===Tile.Rotor&&active)return Tile.Cave;
  if(tile===Tile.Trap&&active)return Tile.Stone;
  if(tile===Tile.Ice&&feature==='ice'&&!active)return Tile.Stone;
  return tile;
}
function relocate(s:Adventure,map:string,at:Point,vehicle:Vehicle,parent: Adventure['parent']):Adventure {
  return {...s,map,at,vehicle,parent,trail:[at],streak:0,visits:got(s.visits,map)};
}
function enter(s:Adventure,target:string) {
  const a=area(target);
  return relocate(s,target,a.start,'foot',[...s.parent,{map:s.map,at:s.at,vehicle:s.vehicle}]);
}
function leave(s:Adventure,fallback:string) {
  const last=s.parent.at(-1);
  if(last) return relocate(s,last.map,last.at,last.vehicle,s.parent.slice(0,-1));
  if(fallback===WORLD_ID) return relocate(s,WORLD_ID,sitePoint(area(s.map).region,0),'foot',[]);
  return relocate(s,fallback,area(fallback).start,'foot',[]);
}
export function mount(s:Adventure,vehicle:Vehicle):Change {
  if(s.map!==WORLD_ID||!s.licenses.includes(vehicle)) return asIs(s,['乗り物は世界地図で使う。','Use vehicles on the world chart.']);
  const a=area(s.map), tile=tileAt(a,s.at);
  if(vehicle==='foot'&&!canTravel(tile,'foot',true)) return asIs(s,['降りるには地面の上へ。','Move over land before disembarking.']);
  if(vehicle!=='foot'&&!isAir(vehicle)&&!isWater(tile)&&!isShore(a,s.at)) return asIs(s,['船の出入りは水辺から。','Board watercraft at the shore.']);
  if(vehicle!=='foot'&&!canTravel(tile,vehicle,true)) return asIs(s,['この地点からその船には乗れない。','That vessel cannot board here.']);
  return {state:{...s,vehicle,trail:[s.at]},message:[`${VEHICLES[vehicle][0]}で移動する。`,`Travel mode: ${VEHICLES[vehicle][1]}.`],sound:'select'};
}
function rest(s:Adventure,gold:number,checkpoint:boolean){
  if(s.gold<gold) return asIs(s,['お金が足りない。','Not enough gold.']);
  const heroes=Object.fromEntries(Object.entries(s.heroes).map(([id,h])=>[id,{...h,hp:maxHp(h)}]));
  return {state:{...s,heroes,gold:s.gold-gold,minutes:(Math.floor(s.minutes/1440)+1)*1440+420,
    checkpoint:checkpoint?{map:s.map,at:s.at}:s.checkpoint},message:text('一行は体力を取り戻した。','The party recovered its strength.'),sound:'buff'} satisfies Change;
}
function pushRock(s:Adventure,rock:Point,direction:Direction):Change {
  const a=area(s.map);
  const next=add(rock,OFFSETS[direction]), plate=a.points.find(l=>l.kind==='plate');
  if(!canTravel(tileAt(a,next),'foot',false)||a.points.some(l=>same(next,l)&&!['plate','rock'].includes(l.kind))) return asIs(s,['重しはそこへ動かせない。','The weight cannot move that way.']);
  const solved=plate&&same(next,plate);
  return {state:{...s,rocks:{...s.rocks,[s.map]:next},flags:solved?got(s.flags,s.map+':mechanism'):s.flags},
    message:solved?['カチリと音がして奥の扉が開いた。','A click opens the inner gate.']:['重しを動かした。','The counterweight moved.'],sound:'select'};
}
function takeCache(s:Adventure,l:Landmark):Change {
  const region=area(s.map).region, site=areaSite(s.map)?.[1];
  const firstBook = !s.books.includes(region);
  const questBook = site===BOOK_SITES[region];
  const reward= l.variant && l.variant>=5 ? 'artifact' : region>=5 ? 'remnant' : 'camp-shield';
  const gold=14+region*9;
  const item:ItemId=region>=3?'dew':'tonic';
  const next={...s,open:got(s.open,l.id),gold:s.gold+gold,items:{...s.items,[item]:s.items[item]+1},
    books:firstBook?[...s.books,region]:s.books,flags:questBook?got(s.flags,`book-${region}`):s.flags,
    unlockedCards:got(s.unlockedCards,reward)};
  return {state:next,message:firstBook?[`「${REGIONS[region].book[0]}」と ${gold} G を見つけた。`,`Found “${REGIONS[region].book[1]}” and ${gold} G.`]:[`${gold} G と道具を見つけた。`,`Found ${gold} G and a supply.`],sound:'buff'};
}
function guidance(s:Adventure,region:number):Scene[] {
  const r=REGIONS[region];
  const name=area(s.map).name;
  const site=areaSite(s.map);
  const feature=area(s.map).points.find(l=>l.kind==='feature'||l.kind==='rock');
  if(site&&area(s.map).place==='dungeon'){
    return [{speaker:name,line:feature?.feature?FEATURES[feature.feature]:r.rumor},
      {speaker:name,line:['手前の灯で休める。壁の傷は隠し通路の目印。封印は任意で挑戦できる。','Rest at the lamp near the entrance. A cracked wall can hide a passage. Lore seals are optional.']}];
  }
  return [{speaker:name,line:s.stage>region?r.aftermath:r.rumor}];
}

export function interact(s:Adventure, landmark=currentLandmark(s)):Change {
  if(!landmark) return asIs(s,['調べるものに近づこう。','Move closer to something to inspect.']);
  const a=area(s.map), r=REGIONS[a.region], l=landmark;
  switch(l.kind){
    case 'site': {
      const [region,site]=areaSite(l.link!)!;
      if(region>s.stage) return asIs(s,['まだ核の力が届かない。旅の記録を進めよう。','The cores cannot reach this region yet. Follow the journal.']);
      const required=REGIONS[region].required;
      if(region===3&&site===4&&s.vehicle!=='submarine')return asIs(s,['海底神殿へは潜水艇で。','Reach the sunken shrine by submarine.']);
      if(region>=4&&!s.visits.includes(l.link!)&&!isAir(s.vehicle)&&s.licenses.includes(required)&&!s.visits.includes(mapId(region,0)))return asIs(s,['空から着陸して訪ねよう。','Land here from the air to visit.']);
      if(site===4&&s.stage===region&&!s.flags.includes(`book-${region}`)) return asIs(s,[`先に「${REGIONS[region].sites[BOOK_SITES[region]].name[0]}」に残された記録を探そう。`,`Find the record in ${REGIONS[region].sites[BOOK_SITES[region]].name[1]} first.`]);
      const next=enter(s,l.link!);
      if(site===4&&!s.visits.includes(l.link!)){
        const [description, reply, response]=CORE_CHAMBERS[region];
        const first=s.party.find(id=>HEROES[id].origin==='elementary')??s.party[0];
        const second=s.party.find(id=>id!==first&&HEROES[id].origin==='high-school')??s.party.find(id=>id!==first)??first;
        return scene(next,[{speaker:REGIONS[region].sites[site].name,line:description},{hero:first,speaker:HEROES[first].name,line:reply},
          {hero:second,speaker:HEROES[second].name,line:response}]);
      }
      return {state:next,sound:'select'};
    }
    case 'stairs': case 'door': return {state:enter(s,l.link!),sound:'select'};
    case 'exit': return {state:leave(s,l.link!),sound:'select'};
    case 'keeper': {
      const first=!s.flags.includes(progressFlag(a.region));
      const has=s.flags.includes(`book-${a.region}`);
      const finish=has&&!s.quests.includes(questFlag(a.region));
      let next={...s,flags:got(s.flags,progressFlag(a.region)),gold:s.gold+(finish?32+a.region*14:0),
        quests:finish?got(s.quests,questFlag(a.region)):s.quests};
      const speaker={speaker:l.label,portrait:l.portrait};
      let lines: Scene[]=[{...speaker,line:l.npc?.line??(s.stage>a.region?r.aftermath:first?r.opening:r.rumor)}];
      if(finish)lines.push({...speaker,line:r.questDone});
      if(first){
        const joining=recruits(next,a.region,1,a.region===0);
        next=joining.state; lines=lines.concat(joining.scenes,[{...speaker,line:r.quest}]);
        if(a.region===0)next={...next,flags:got(next.flags,'guild'),checkpoint:{map:s.map,at:a.start}};
      }
      return scene(next,lines);
    }
    case 'resident': {
      if(a.houseGame)return {state:s,effect:{type:'house-invitation',house:a.id}};
      const hero=s.party.find(id=>id!==s.leader)??s.leader;
      const key=`side:${hero}:${a.region}`;
      if(!l.npc)return asIs(s);
      const lines:Scene[]=[{speaker:l.npc.name,line:l.npc.line,portrait:l.npc.portrait}];
      if(a.place==='town'&&s.party.length>=2 && (s.quests.includes(questFlag(a.region))||s.stage>a.region)){
        lines.push({speaker:HEROES[hero].name,line:HEROES[hero].side,hero});
        return scene({...s,flags:got(s.flags,key),gold:s.flags.includes(key)?s.gold:s.gold+12},lines);
      }
      return scene(s,lines);
    }
    case 'house-game': return a.houseGame?{state:s,effect:{type:'house-invitation',house:a.id}}:asIs(s);
    case 'service': {
      return {state:s,effect:{type:'service',service:l.service!,region:a.region}};
    }
    case 'recruit': {
      const join=recruits(s,a.region,l.variant);
      return scene({...join.state,open:got(s.open,l.id)},join.scenes.length?join.scenes:guidance(s,a.region));
    }
    case 'camp': return rest(s,0,a.place==='town');
    case 'chest': return takeCache(s,l);
    case 'seal': return {state:s,effect:{type:'study',landmark:l}};
    case 'boss': return {state:s,effect:{type:'battle',encounter:{region:a.region,variant:0,key:l.id,boss:true}}};
    case 'enemy': return {state:s,effect:{type:'battle',encounter:{region:a.region,variant:l.variant??0,key:l.id}}};
    case 'trial': {
      if(!visible(s,l))return asIs(s);
      const encounter:Encounter=l.variant===1?{region:a.region,variant:3,hidden:true,key:l.id}:l.variant===2?{region:a.region,variant:2,key:l.id}:{region:0,variant:0,boss:true,rush:0};
      return {state:s,effect:{type:'battle',encounter}};
    }
    case 'sign': return scene(s,guidance(s,a.region));
    case 'rock': return pushRock(s,l,s.direction);
    case 'plate': return asIs(s,['重しを床の印まで押すと、仕掛けが動きそうだ。','Push the counterweight onto this floor marker.']);
    case 'gate': {
      if(s.flags.includes(a.id+':mechanism'))return asIs(s,['奥の扉は開いている。','The inner gate is open.']);
      if(l.feature==='rock'&&s.rocks[a.id]){
        const rocks={...s.rocks};delete rocks[a.id];
        return {state:{...s,rocks},message:['扉から操作すると重しを元の位置へ戻せる。','The gate resets the counterweight to its original position.']};
      }
      return asIs(s,['部屋の仕掛けとつながっている。','The gate is connected to the room’s mechanism.']);
    }
    case 'feature': {
      const key=a.id+':mechanism';
      const p=l.destination??s.at;
      return { state:{...s,at:p,trail:same(p,s.at)?s.trail:[p],flags:got(s.flags,key)},message:l.feature==='warp'?['足元に転移陣が光った。','The warp sigil shines underfoot.']:['仕掛けが動き、奥の道が開いた。','The mechanism opens a way inward.'],sound:'select' };
    }
    case 'secret': {
      const next={...s,open:got(s.open,l.id)};
      if(l.id.endsWith(':passage')) return {state:next,message:['石の継ぎ目から隠し通路が開いた。','A hidden passage opens along the seam in the stone.'],sound:'buff'};
      return takeCache(next,l);
    }
    case 'shortcut': return {state:relocate(s,a.id,a.start,'foot',s.parent),message:['入口の灯火に戻った。','Returned to the lamp at the entrance.'],sound:'select'};
  }
}

function passable(s:Adventure,p:Point) {
  const a=area(s.map),t=activeTile(s,p);
  if(!canTravel(t,s.vehicle,s.map===WORLD_ID)||furnitureAt(a,p))return false;
  if(s.map===WORLD_ID){
    const r=regionAt(p);
    if(r>s.stage&&!isWater(t)&&!isAir(s.vehicle))return false;
    if(r>=4&&r!==6&&t!==Tile.Void&&isWater(t)&&!isAir(s.vehicle)&&!isWater(tileAt(a,s.at)))return false;
  }
  const gate=a.points.find(l=>l.kind==='gate'&&same(p,l));
  return !gate||s.flags.includes(a.id+':mechanism');
}
function nearestReachableFloor(s:Adventure,map:string,point:Point):Point {
  const a=area(map);
  const local={...s,map,at:a.start,vehicle:'foot' as const};
  const rock=s.rocks[map]??a.points.find(marker=>marker.kind==='rock');
  const queue=[a.start], seen=new Set([coordinate(a.start)]);
  let nearest=a.start;
  for(let index=0;index<queue.length;index++){
    const at=queue[index];
    if(same(at,point))return point;
    if(distance(at,point)<distance(nearest,point))nearest=at;
    for(const offset of Object.values(OFFSETS)){
      const next=add(at,offset),key=coordinate(next);
      if(seen.has(key)||!passable(local,next)||activeTile(local,next)===Tile.Trap||rock&&same(next,rock))continue;
      seen.add(key);queue.push(next);
    }
  }
  return nearest;
}
export function restoreAdventure(s:Adventure):Adventure {
  const oldDungeon=s.dungeonLayout!==DUNGEON_LAYOUT_VERSION;
  let next=s;
  if(oldDungeon){
    const rocks:Adventure['rocks']={};
    for(const [map,position] of Object.entries(s.rocks)){
      const a=area(map);
      if(a.place!=='dungeon')rocks[map]=position;
      else if(s.flags.includes(map+':mechanism')){
        const plate=a.points.find(marker=>marker.kind==='plate');
        if(plate)rocks[map]={x:plate.x,y:plate.y};
      }
    }
    next={...s,rocks,dungeonLayout:DUNGEON_LAYOUT_VERSION};
  }
  const fit=(map:string,p:Point)=>{
    const {place}=area(map);
    return place==='indoors'||place==='dungeon'&&oldDungeon?nearestReachableFloor(next,map,p):p;
  };
  const at=fit(s.map,s.at), room=area(s.map).place;
  return {...next,at,trail:at!==s.at||room==='dungeon'&&oldDungeon||room==='indoors'&&s.trail.some(p=>!passable(next,p))?[at]:s.trail,
    parent:s.parent.map(p=>({...p,at:fit(p.map,p.at)})),
    checkpoint:{...s.checkpoint,at:fit(s.checkpoint.map,s.checkpoint.at)}};
}
export function step(s:Adventure,direction:Direction,dash=false):Change {
  const a=area(s.map), d=OFFSETS[direction];
  let p=add(s.at,d), tile=activeTile(s,p);
  const turn=s.direction===direction?s:{...s,direction};
  const rock=a.points.find(l=>l.kind==='rock');
  if(rock && same(p,s.rocks[a.id]??rock))return pushRock(turn,p,direction);
  if(!passable(turn,p))return asIs(turn);
  // Slip or carry the party one short segment, never through a wall or a closed gate.
  let path=[p];
  if(tile===Tile.Ice||tile===Tile.Rotor){
    const vector=tile===Tile.Rotor?{x:-d.y,y:d.x}:d;
    for(let i=0;i<5;i++){
      const next=add(p,vector);
      if(!passable(turn,next)||rock&&same(next,s.rocks[a.id]??rock))break;
      p=next;path.push(p);
      if(activeTile(s,p)!==tile)break;
    }
  }
  const steps=s.steps+path.length, repellent=Math.max(0,s.repellent-1);
  let next={...turn,at:p,steps,minutes:s.minutes+(dash?3:4)*path.length,repellent,trail:[...path.reverse(),...s.trail].slice(0,8),streak:s.streak+1};
  if(s.map===WORLD_ID&&s.vehicle!=='foot'&&!isAir(s.vehicle)&&!isWater(activeTile(s,p))){
    const landed={...next,vehicle:'foot' as const,trail:[p]};
    return {state:landed,message:isWater(tileAt(a,s.at))?['岸に上がった。','Disembarked at the shore.']:undefined};
  }
  if(tile===Tile.Trap){
    next={...next,at:a.start,trail:[a.start],heroes:Object.fromEntries(Object.entries(s.heroes).map(([id,h])=>[id,s.party.includes(id)?{...h,hp:Math.max(1,h.hp-4)}:h]))};
    return {state:next,message:['落とし穴に落ち、入口へ戻された。','A trapdoor drops the party back at the entrance.'],sound:'damage'};
  }
  const foe=a.points.find(l=>l.kind==='enemy'&&same(l,p)&&visible(s,l));
  if(foe&&s.settings.encounters==='symbol'&&!weakFoesAvoided(next,a.region))return interact(next,foe);
  const outdoor=a.place==='wild'||a.place==='dungeon'||a.place==='world';
  if(!outdoor||s.repellent>0||s.vehicle!=='foot'||isRoad(tile)||tile===Tile.Sand||regionAtOrArea(next)>s.stage) return {state:next};
  const [rng,value]=randomState(s.rng);
  next={...next,rng};
  const region=regionAtOrArea(next);
  if(weakFoesAvoided(next,region))return {state:next};
  const chance=(s.settings.rate==='low'?.075:.145)*(dash?1.15:1);
  if(s.settings.encounters==='symbol'){
    // More wilderness than landmarks: eligible symbols are stable positions, not surprise spawns.
    const symbol=a.id===WORLD_ID&&next.steps>=8&&noise(p.x,p.y,region)>.89&&!a.points.some(l=>distance(l,p)<2);
    const symbolId=`world:foe:${coordinate(p)}`;
    if(symbol&&!s.completed.includes(symbolId))return {state:next,effect:{type:'battle',encounter:{region,variant:Math.floor(value*4),key:symbolId}}};
    return {state:next};
  }
  if(next.streak>=9&&value<chance){
    const [seed, roll]=randomState(rng);
    const isNight=(s.minutes%1440)<360||(s.minutes%1440)>1140;
    const variant=roll>.94?3:isNight&&roll>.61?2:Math.floor(roll*13)%3;
    const surprise=roll<.08?'party':roll>.87&&roll<.94?'foe':undefined;
    return {state:{...next,rng:seed,streak:0},effect:{type:'battle',encounter:{region,variant,surprise}}};
  }
  return {state:next};
}
function weakFoesAvoided(s:Adventure,region:number){
  return Boolean(s.settings.avoidWeak && Math.min(...s.party.map(id=>s.heroes[id].level))>=region*3+6);
}
function regionAtOrArea(s:Adventure){return s.map===WORLD_ID?regionAt(s.at):area(s.map).region;}
export function worldSymbol(s:Adventure,p:Point) {
  return s.settings.encounters==='symbol'&&s.map===WORLD_ID&&s.steps>=8&&s.repellent===0&&regionAt(p)<=s.stage&&!weakFoesAvoided(s,regionAt(p))
    &&![Tile.Path,Tile.Sand,Tile.Bridge].includes(tileAt(area(s.map),p))&&canTravel(tileAt(area(s.map),p),'foot',true)
    &&noise(p.x,p.y,regionAt(p))>.89&&!area(s.map).points.some(l=>distance(l,p)<2)&&!s.completed.includes(`world:foe:${coordinate(p)}`);
}
export function reviewEntry(q:MissedQuestion):AssignmentReviewProblem {
  if(!('correct' in q))return q;
  return {mode:q.mode,problemId:q.problemId,problemKey:q.id,question:q.question,correctAnswer:q.options[q.correct],options:q.options,unitName:q.unitName};
}
export function applyStudy(s:Adventure,question:MissedQuestion,correct:boolean,landmark?:Landmark):Change{
  const key=(entry:MissedQuestion)=>{const q=reviewEntry(entry);return q.problemId??`${q.mode}:${q.question}:${q.correctAnswer}`;};
  const missed=s.learned.missed.filter(q=>key(q)!==key(question));
  const previous=s.learned.units[question.mode]??{correct:0,attempts:0};
  const next={...s,learned:{correct:s.learned.correct+Number(correct),attempts:s.learned.attempts+1,missed:correct?missed:[question,...missed].slice(0,48),
    units:{...s.learned.units,[question.mode]:{correct:previous.correct+Number(correct),attempts:previous.attempts+1}}}};
  if(correct&&landmark&&!s.open.includes(landmark.id)){
    const reward=takeCache(next,landmark);
    return {...reward,state:{...reward.state,unlockedCards:got(reward.state.unlockedCards,'turnpage')}};
  }
  return {state:next};
}
const earnedXp = (win:Win,active:boolean)=>Math.floor(win.xp*(active?1:.35));

export function completeBattle(s:Adventure,encounter:Encounter,win:Win):Change & { rewards:VictoryRewards } {
  const change=grantVictory(s,encounter,win);
  const next=change.state;
  const loot:VictoryRewards['loot']=[];
  for(const id of Object.keys(ITEMS) as ItemId[]){
    const quantity=next.items[id]-s.items[id];
    if(quantity>0)loot.push({name:ITEMS[id].name,quantity});
  }
  for(const id of next.gear)if(!s.gear.includes(id))loot.push({name:GEAR[id].name});
  for(const id of next.unlockedCards)if(!s.unlockedCards.includes(id))loot.push({name:CARDS[id].name});
  for(const id of next.licenses)if(!s.licenses.includes(id))loot.push({name:VEHICLES[id]});
  const roster=[...s.party,...Object.keys(s.heroes).filter(id=>!s.party.includes(id))];
  return {...change,rewards:{loot,gold:next.gold-s.gold,heroes:roster.map(id=>{
    const before=s.heroes[id], hero=next.heroes[id], active=s.party.includes(id);
    return {id,xp:earnedXp(win,active),mastery:(hero.mastery[hero.job]??0)-(before.mastery[hero.job]??0),level:hero.level-before.level,reserve:!active};
  })}};
}
function grantVictory(s:Adventure,encounter:Encounter,win:Win):Change {
  const region=encounter.region;
  const heroes=Object.fromEntries(Object.entries(s.heroes).map(([id,h])=>{
    const active=s.party.includes(id);
    let xp=h.xp+earnedXp(win,active), level=h.level;
    while(xp>=xpNext(level)&&level<60){xp-=xpNext(level);level++;}
    const mastery=active?{...h.mastery,[h.job]:(h.mastery[h.job]??0)+win.mastery}:h.mastery;
    const unit={...h,xp,level,mastery};
    const hp=win.hp[id]??h.hp;
    unit.hp=Math.min(maxHp(unit),Math.max(1,hp)+(level>h.level?Math.ceil(maxHp(unit)*.26):active&&encounter.boss?12:active?3:0));
    return [id,unit];
  }));
  let next={...s,heroes,gold:s.gold+win.gold,streak:0,
    completed:encounter.key?got(s.completed,encounter.key):s.completed,
    monsters:[...new Set([...s.monsters,...win.enemyIds])],
    unlockedCards:win.card?got(s.unlockedCards,win.card):s.unlockedCards};
  const leveled=Object.values(heroes).filter(h=>h.level>s.heroes[h.id].level).length;
  if(encounter.key?.endsWith(':job-trial')){
    const names=s.party.map(id=>JOBS[heroes[id].job].mastery.id);
    next={...next,unlockedCards:got(next.unlockedCards,'turnpage'),heroes:Object.fromEntries(Object.entries(next.heroes).map(([id,h])=>[id,
      names.includes(JOBS[h.job].mastery.id)&&s.party.includes(id)?{...h,mastery:{...h.mastery,[h.job]:Math.max(h.mastery[h.job]??0,5)}}:h]))};
  }
  if(encounter.hidden&&region>=4)next={...next,gear:got(next.gear,`charm-${region}`)};
  const msg:Copy=[`勝利！ EXP ${win.xp} · ${win.gold} G${leveled?' · レベルアップ':''}`,`Victory! EXP ${win.xp} · ${win.gold} G${leveled?' · Level up':''}`];
  if(encounter.rush!==undefined) {
    if(encounter.rush<6)return {state:next,message:msg,effect:{type:'battle',encounter:{...encounter,region:encounter.rush+1,rush:encounter.rush+1}}};
    return scene({...next,rank:Math.max(next.rank,1),gold:next.gold+240,unlockedCards:got(next.unlockedCards,'transfigure')},[{speaker:REGIONS[6].keeper,line:['すべての番人を乗り越えた。旅装変身の札を授けよう。','You overcame every guardian. The Travel Aspect card is yours.']}],msg);
  }
  if(!encounter.boss||region!==s.stage)return {state:next,message:msg,sound:'win'};
  const r=REGIONS[region];
  next={...next,stage:s.stage+1,ending:s.ending||region===5,
    licenses:r.grant&&!next.licenses.includes(r.grant)?[...next.licenses,r.grant]:next.licenses,
    items:{...next.items,tonic:Math.min(999,next.items.tonic+2),dew:Math.min(999,next.items.dew+1)},
    flags:got(next.flags,`core:${region}`),unlockedCards:got(next.unlockedCards,region>=4?'remnant':'artifact')};
  if(region===5)return {state:next,message:msg,effect:{type:'ending',scenes:endingScenes(next)},sound:'win'};
  const line:Copy=r.grant?
    [`「${r.core[0]}」が戻った。世界地図で${VEHICLES[r.grant][0]}を使える。`,`The ${r.core[1]} returns. You can use the ${VEHICLES[r.grant][1]} on the world chart.`]
    :[`「${r.core[0]}」を発見した。`,`You discovered the ${r.core[1]}.`];
  return scene(next,[{speaker:r.boss,line},{speaker:r.keeper,line:r.aftermath}],msg);
}
export function recover(s:Adventure):Adventure {
  const a=area(s.checkpoint.map);
  const base=relocate(s,a.id,s.checkpoint.at,'foot',[]);
  return {...rest(base,0,false).state,gold:Math.floor(s.gold*.9)};
}
export function escape(s:Adventure):Adventure { return {...s,streak:0,repellent:Math.max(s.repellent,7)}; }
export function canJob(s:Adventure,h:HeroState,id:string) {
  const job=JOBS[id];
  if(!job)return false;
  if(id===h.job||id===HEROES[h.id].job)return true;
  if(job.tier===0)return s.flags.includes('guild');
  if(job.tier===1)return s.stage>=2&&(h.mastery[job.mentor!]??0)>=3||s.stage>=4;
  return (s.stage>=5&&(h.mastery[job.mentor!]??0)>=5||s.stage>=6)&&(id!=='seeker'||s.ending);
}
export function availableCards(s:Adventure,h:HeroState) {
  return [...new Set([...starterDeck(HEROES[h.id]).map(c=>c.key),...s.unlockedCards,...h.learned,JOBS[h.job].signature.id,
    ...Object.entries(h.mastery).filter(([,value])=>value>=5).map(([id])=>JOBS[id].mastery.id)])].filter(key=>CARDS[key]);
}
export function resolveParts(card:DeckCard):Technique[]{
  return (card.parts?.length?card.parts:[card.key]).map(key=>CARDS[key]).filter(Boolean);
}
export function battleDeck(hero:HeroState){
  const cards=hero.deck.filter(c=>resolveParts(c).every(t=>!t.id.startsWith('job:')||t.id===JOBS[hero.job].signature.id));
  const deck=[...cards];
  if(!deck.some(c=>c.key===JOBS[hero.job].signature.id))deck.push({key:JOBS[hero.job].signature.id});
  if(hero.inherited&&CARDS[hero.inherited]&&!deck.some(c=>c.key===hero.inherited))deck.push({key:hero.inherited});
  return deck.slice(0,22);
}
export function changeJob(s:Adventure,heroId:string,id:string):Adventure {
  const h=s.heroes[heroId];if(!h||!canJob(s,h,id)||h.job===id)return s;
  return cloneHero(s,heroId,unit=>{
    const equipment={...unit.equipment};
    if(equipment.weapon&&GEAR[equipment.weapon].style!==JOBS[id].style) equipment.weapon=s.gear.includes(seedWeapon(id))?seedWeapon(id):undefined;
    const next={...unit,job:id,equipment};
    return {...next,hp:inRange(unit.hp+maxHp(next)-maxHp(unit),1,maxHp(next))};
  });
}
export function equip(s:Adventure,id:string,slot:EquipSlot,gear?:string):Adventure {
  if(gear&&(!s.gear.includes(gear)||GEAR[gear].slot!==slot))return s;
  const existing=s.heroes[id];if(!existing)return s;
  if(gear&&GEAR[gear].style&&GEAR[gear].style!==JOBS[existing.job].style)return s;
  return cloneHero(s,id,h=>{
    const next={...h,equipment:{...h.equipment,[slot]:gear}};
    return {...next,hp:inRange(h.hp+maxHp(next)-maxHp(h),1,maxHp(next))};
  });
}
export function partyCommand(s:Adventure,id:string,action:'leader'|'swap'|'row'|'substory'|'inherit',key?:string):Change {
  const hero=s.heroes[id];
  if(!hero)return {state:s};
  const index=s.party.indexOf(id);
  if(action==='leader'&&index>=0)return {state:{...s,party:[id,...s.party.filter(x=>x!==id)],trail:[s.at]}};
  if(action==='swap'){
    const other=key?s.party.indexOf(key):-1;
    if(index<0 && (other>=0||s.party.length<4)){
      const party=[...s.party];
      if(other>=0)party[other]=id;else party.push(id);
      return {state:{...s,party,trail:[s.at]}};
    }
    if(index>=0 && s.party.length>1 && !key)return {state:{...s,party:s.party.filter(x=>x!==id),trail:[s.at]}};
  }
  if(action==='row')return {state:cloneHero(s,id,h=>({...h,rear:!h.rear}))};
  if(action==='inherit'&&(!key||key.startsWith('master:')&&(hero.mastery[key.slice(7)]??0)>=5))return {state:cloneHero(s,id,h=>({...h,inherited:key}))};
  if(action==='substory'){
    const side=`bio:${id}`, awarded=s.flags.includes(side);
    return scene({...s,flags:got(s.flags,side),gold:s.gold+(awarded?0:15)},[{speaker:HEROES[id].name,line:HEROES[id].voice,hero:id},{speaker:HEROES[id].name,line:HEROES[id].side,hero:id}]);
  }
  return {state:s};
}
export function editDeck(s:Adventure,id:string,action:'add'|'remove'|'upgrade'|'infuse'|'fuse',key:string|number,extra?:number|Element):Change{
  const h=s.heroes[id];if(!h)return {state:s};
  const deck=h.deck.slice(), index=typeof key==='number'?key:-1, at=deck[index];
  let price=0;
  if(action==='add'&&typeof key==='string'&&deck.length<20&&availableCards(s,h).includes(key)&&deck.filter(c=>c.key===key).length<4&&(!key.startsWith('job:')||!deck.some(c=>c.key===key)))deck.push({key});
  else if(action==='remove'&&at&&deck.length>10)deck.splice(index,1);
  else if(action==='upgrade'&&at&&(at.rank??0)<2){price=24+(at.rank??0)*16;deck[index]={...at,rank:(at.rank??0)+1};}
  else if(action==='infuse'&&at&&typeof extra==='string'){price=20;deck[index]={...at,element:extra};}
  else if(action==='fuse'&&at&&typeof extra==='number'&&extra!==index&&deck[extra]&&deck.length>10){
    const other=deck[extra],parts=[...resolveParts(at),...resolveParts(other)];
    if(parts.length>3||parts.some(t=>t.id.startsWith('job:')||t.skill.copy||t.skill.recall||t.skill.transform)||
      parts.some(t=>t.target==='ally')&&parts.some(t=>t.target==='foe'))return asIs(s,['この組み合わせでは合成できない。','These cards cannot be fused together.']);
    price=44;
    deck[index]={key:at.key,parts:parts.map(t=>t.id),rank:Math.max(at.rank??0,other.rank??0)};
    deck.splice(extra,1);
  } else return asIs(s,['デッキは10〜20枚。同じカードは4枚まで。','Keep 10–20 cards and no more than four copies.']);
  if(s.gold<price)return asIs(s,['お金が足りない。','Not enough gold.']);
  return {state:{...cloneHero(s,id,hero=>({...hero,deck})),gold:s.gold-price},sound:'select'};
}
export function purchase(s:Adventure,kind:'gear'|'relic'|'card'|'item'|'inn',id:string,region:number):Change {
  if(kind==='inn')return rest(s,0,true);
  const item=ITEMS[id as ItemId],gear=GEAR[id],relic=RELICS[id as RelicId],card=CARDS[id];
  let price=0, next=s;
  if(kind==='gear'&&gear&&gear.place<=region&&!s.gear.includes(id)){price=gear.price;next={...s,gear:got(s.gear,id)};}
  else if(kind==='relic'&&relic&&relic.place<=region&&!s.relics.includes(id as RelicId)){price=relic.price;next={...s,relics:[...s.relics,id as RelicId]};}
  else if(kind==='item'&&item){price=item.price;next={...s,items:{...s.items,[id]:Math.min(99,s.items[id as ItemId]+1)}};}
  else if(kind==='card'&&card&&!s.unlockedCards.includes(id)&&!id.includes(':')){price=24+region*8;next={...s,unlockedCards:got(s.unlockedCards,id)};}
  else return {state:s};
  return s.gold<price?asIs(s,['お金が足りない。','Not enough gold.']):{state:{...next,gold:s.gold-price},message:['購入した。','Purchased.'],sound:'select'};
}
export function setRelic(s:Adventure,id?:RelicId,heroId?:string){
  if(id&&!s.relics.includes(id))return s;
  const without=(h:HeroState)=>h.relic===id&&id?{...h,relic:undefined}:h;
  const next={...s,heroes:Object.fromEntries(Object.entries(s.heroes).map(([key,h])=>[key,without(h)])),partyRelic:s.partyRelic===id||!heroId?id:s.partyRelic};
  if(heroId){
    if(next.partyRelic===id)next.partyRelic=undefined;
    return cloneHero(next,heroId,h=>({...h,relic:id}));
  }
  return next;
}
export function fieldItem(s:Adventure,id:ItemId,hero:string):Change {
  if(s.items[id]<1||!s.heroes[hero])return {state:s};
  if(id==='dew')return asIs(s,['夜明けの雫は戦闘中に使える。','Dawndew is used during battle.']);
  if(id==='oil')return {state:{...s,repellent:32,items:{...s.items,oil:s.items.oil-1}},message:['灯芯油を使った。32歩の間、敵を避けられる。','Wick Oil prevents encounters for 32 steps.'],sound:'buff'};
  const h=s.heroes[hero];
  if(h.hp>=maxHp(h))return asIs(s,['すでにHPは満タン。','HP is already full.']);
  return {state:{...cloneHero(s,hero,h=>({...h,hp:Math.min(maxHp(h),h.hp+(id==='tonic'?24:10))})),items:{...s.items,[id]:s.items[id]-1}},sound:'buff'};
}
