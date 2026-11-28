import { FEATURES, REGIONS, SERVICES, type Climate, type Copy, type Feature, type Service, type Vehicle } from './campaign';
import { DUNGEON_HEIGHT, DUNGEON_LAYOUTS, DUNGEON_WIDTH } from './dungeonLayouts';
import { HOUSE_INTERIORS, SHOP_INTERIORS, type FurniturePiece, type HouseGame } from './interiors';
import { TOWN_SHOPS, townProfile, type TownNpc } from './towns';

export type Point = { x: number; y: number };
export type Direction = 'up' | 'down' | 'left' | 'right';
export const OFFSETS: Record<Direction, Point> = { up:{x:0,y:-1},down:{x:0,y:1},left:{x:-1,y:0},right:{x:1,y:0} };
export const add = (a: Point, b: Point) => ({ x: a.x+b.x, y: a.y+b.y });
export const distance = (a: Point, b: Point) => Math.abs(a.x-b.x)+Math.abs(a.y-b.y);
export const same = (a: Point, b: Point) => a.x===b.x && a.y===b.y;
export const coordinate = (p: Point) => `${p.x},${p.y}`;
export function noise(x: number,y: number,seed = 0) {
  let n = Math.imul(x+51,0x45d9f3b) ^ Math.imul(y+93,0x119de1f3) ^ Math.imul(seed+1,0x27d4eb2d);
  n = Math.imul(n ^ (n >>> 16), 0x45d9f3b);
  return ((n ^ (n >>> 16)) >>> 0) / 4294967296;
}

export const enum Tile { Deep, Sea, Shallow, Sand, Grass, Flowers, Forest, Rock, Hill, Path, Wood, Stone, Wall, Cave, Bridge, Ice, Water, Trap, Void, Hidden, Carpet, Rotor, Waterfall }
export type Kind = 'site' | 'door' | 'exit' | 'keeper' | 'resident' | 'recruit' | 'service' | 'chest' | 'seal' | 'feature' | 'gate' | 'stairs' | 'enemy' | 'boss' | 'shortcut' | 'rock' | 'plate' | 'secret' | 'trial' | 'camp' | 'sign' | 'house-game';
export type Landmark = Point & { id: string; label: Copy; kind: Kind; link?: string; destination?: Point; feature?: Feature; service?: Service; variant?: number; npc?: TownNpc; portrait?: string };
export type Area = {
  id: string; region: number; name: Copy; climate: Climate; place: 'world'|'town'|'indoors'|'wild'|'dungeon';
  width: number; height: number; tiles: Uint8Array; start: Point; points: Landmark[];
  furniture?: readonly FurniturePiece[];
  houseGame?: HouseGame;
};
const EXIT: Copy = ['外へ出る','Leave'];
const CAMP: Copy = ['道中の灯火','Wayfarer’s Lamp'];
export const mapId = (region: number, site: number, floor=0) => `r${region}-s${site}-f${floor}`;
export const floors = (region: number, site: number) => site===4 && region !== 2 ? (region>=5?3:2) : 1;
export const WORLD_ID = 'world';
export const DUNGEON_LAYOUT_VERSION = 2;
const PALETTES: Climate[] = REGIONS.map(r=>r.climate);
const SITE_OFFSETS: Point[] = [{x:-4,y:2},{x:0,y:5},{x:-4,y:-5},{x:4,y:1},{x:3,y:-5}];
export function regionAt(p: Point): number {
  let region=0, best=Infinity;
  for (const [index, r] of REGIONS.entries()) {
    const d = Math.hypot(r.place[0]-p.x,r.place[1]-p.y);
    if(d<best) {region=index;best=d;}
  }
  return region;
}
export function sitePoint(region: number, site: number): Point {
  const [x,y] = REGIONS[region].place;
  if(region===3 && site===4) return {x:x-12,y:y+5};
  return add({x,y},SITE_OFFSETS[site]);
}
export const climateAt = (area: Area, p: Point) => area.id===WORLD_ID ? PALETTES[regionAt(p)] : area.climate;

function createArea(id: string, region: number, name: Copy, place: Area['place'], width: number, height: number, initial: Tile, start: Point): Area {
  return { id,region,name,place,climate:REGIONS[region]?.climate??'meadow',width,height,tiles:new Uint8Array(width*height).fill(initial),start,points:[] };
}
export const tileAt = (a: Area, p: Point): Tile => p.x>=0&&p.y>=0&&p.x<a.width&&p.y<a.height ? a.tiles[p.y*a.width+p.x] : Tile.Void;
export function furnitureAt(a: Area, p: Point) {
  return a.furniture?.find(([,x,y,width=1,height=1])=>p.x>=x&&p.x<x+width&&p.y>=y&&p.y<y+height);
}
function stamp(area: Area, p: Point,tile:Tile) { if (p.x>=0 && p.y>=0 && p.x<area.width && p.y<area.height) area.tiles[p.y*area.width+p.x]=tile; }
function rectangle(area: Area,left: number,top: number,width: number,height: number,tile: Tile) {
  for(let y=top;y<top+height;y++) for(let x=left;x<left+width;x++) stamp(area,{x,y},tile);
}
function route(area: Area,a: Point,b: Point,tile: Tile,width=1) {
  for(let x=Math.min(a.x,b.x);x<=Math.max(a.x,b.x);x++) rectangle(area,x,a.y,width,width,tile);
  for(let y=Math.min(a.y,b.y);y<=Math.max(a.y,b.y);y++) rectangle(area,b.x,y,width,width,tile);
}
function thing(area:Area,key:string,kind:Kind,x:number,y:number,label:Copy,extra:Partial<Landmark> = {}) {
  area.points.push({id:`${area.id}:${key}`,kind,x,y,label,...extra});
}

function makeWorld(): Area {
  const a=createArea(WORLD_ID,0,['旅人の世界地図','Travelers’ World Chart'],'world',125,82,Tile.Sea,sitePoint(0,0));
  for(let y=0;y<a.height;y++) for(let x=0;x<a.width;x++){
    const r=regionAt({x,y}), [cx,cy]=REGIONS[r].place;
    const d=Math.hypot((x-cx)*.9,y-cy) + 1.65*Math.sin(x*.43+y*.31)+.9*Math.sin(y+cx);
    const texture=noise(x,y,r*3);
    let t=Tile.Deep;
    if(d<17) t=Tile.Sea;
    if(d<14.7 || (r<2 && x>21 && x<37 && y>=12 && y<=21)) t=Tile.Shallow;
    if(d<11.1) t=Tile.Sand;
    if(d<9.8) t=texture<.14?Tile.Forest:texture>.9?Tile.Flowers:Tile.Grass;
    if(d<7 && texture>.79) t=Tile.Hill;
    if(d<5 && texture<.11) t=Tile.Rock;
    if(r===0 && Math.abs(x-(18+Math.sin(y*.29)*2))<.8 && y>11&&y<25 && t>=Tile.Sand) t=y===14?Tile.Waterfall:Tile.Water;
    if(r>=2 && r!==3 && Math.abs(y-(cy+Math.sin(x*.3)*2.1))<.64 && x>cx-6 && x<cx+7 && t>=Tile.Grass) t=Tile.Water;
    stamp(a,{x,y},t);
  }
  REGIONS.forEach((region,r) => {
    const center={x:region.place[0],y:region.place[1]};
    if (r!==3) for(const [s,site] of region.sites.entries()){
      const p=sitePoint(r,s);
      route(a,p,center,Tile.Path);
      stamp(a,p,Tile.Path);
      thing(a,`site-${r}-${s}`,'site',p.x,p.y,site.name,{link:mapId(r,s),variant:s});
    } else {
      for(const [s,site] of region.sites.entries()){
        const p=sitePoint(r,s);
        if(s===4) stamp(a,p,Tile.Deep);
        else { route(a,p,center,Tile.Path); stamp(a,p,Tile.Path); }
        thing(a,`site-${r}-${s}`,'site',p.x,p.y,site.name,{link:mapId(r,s),variant:s});
      }
    }
  });
  // A natural shoal at the first channel is the skiff route; ocean vessels can sail around it.
  for(let y=14;y<=20;y++) for(let x=24;x<=35;x++) {
    if(tileAt(a,{x,y})<=Tile.Shallow) stamp(a,{x,y},Tile.Shallow);
  }
  // Waterways that intersect an established trail get a timber crossing.
  for(const [x,y] of [[17,12],[19,17],[19,18],[17,22],[42,16],[75,16],[77,59],[39,58]]) {
    if(tileAt(a,{x,y})===Tile.Path && (tileAt(a,{x:x-1,y})===Tile.Water||tileAt(a,{x:x+1,y})===Tile.Water)) stamp(a,{x,y},Tile.Bridge);
  }
  return a;
}

function makeTown(region: number,site: number,id: string,name:Copy) {
  const start={x:17,y:21};
  const a=createArea(id,region,name,'town',35,25,Tile.Grass,start);
  for(let y=0;y<a.height;y++) for(let x=0;x<a.width;x++){
    const n=noise(x,y,region);
    if(x<2||x>32||y<2) stamp(a,{x,y},n>.77?Tile.Hill:Tile.Forest);
    else if(n<.17) stamp(a,{x,y},Tile.Flowers);
  }
  rectangle(a,16,3,3,21,Tile.Path);
  for(const y of [8,15,22]) rectangle(a,2,y,31,2,Tile.Path);
  if (region===1 || region===4 || site===3) rectangle(a,13,10,9,4,Tile.Stone);
  if (region===3) rectangle(a,2,21,7,2,Tile.Bridge);
  TOWN_SHOPS.forEach((service,index)=>{
    const cols=[5,11,23,29], row=Math.floor(index/4), cx=cols[index%4], cy=5+row*7;
    rectangle(a,cx-2,cy-2,5,4,Tile.Wall);
    stamp(a,{x:cx,y:cy+1},Tile.Wood);
    stamp(a,{x:cx,y:cy+2},Tile.Path);
    const label=service==='home'?HOUSE_INTERIORS[`${region}:${site}`].name:SERVICES[service];
    thing(a,service,'door',cx,cy+1,label,{link:`${id}/${service}`,service,variant:index});
  });
  const r=REGIONS[region];
  const locals=townProfile(region,site);
  thing(a,'keeper','keeper',17,17,locals.keeper?.name??r.keeper,{npc:locals.keeper,portrait:locals.keeperPortrait});
  thing(a,'resident','resident',19,21,locals.square.name,{npc:locals.square});
  thing(a,'camp','camp',15,16,CAMP);
  thing(a,'exit','exit',17,23,EXIT,{link:WORLD_ID});
  thing(a,'sign','sign',19,18,['街道の案内板','Road sign']);
  if(region===6) thing(a,'rush','trial',19,10,['番人の記憶試練','Trial of the Guardians']);
  return a;
}

function makeInterior(region: number,site: number,id: string, service: Service): Area {
  const house=service==='home'?HOUSE_INTERIORS[`${region}:${site}`]:undefined;
  const shop=service==='home'?undefined:SHOP_INTERIORS[service];
  const plan=house??shop!;
  const a=createArea(id,region,house?.name??SERVICES[service],'indoors',17,12,Tile.Wall,{x:8,y:9});
  a.furniture=house?[...plan.furniture,house.game.table]:plan.furniture;
  a.houseGame=house?.game;
  rectangle(a,2,2,13,8,plan.floor==='stone'?Tile.Stone:Tile.Wood);
  for(const patch of plan.rugs??[])rectangle(a,...patch,Tile.Carpet);
  for(const patch of plan.walls??[])rectangle(a,...patch,Tile.Wall);
  if(shop)thing(a,service,'service',...shop.counter,SERVICES[service],{service});
  const originalResident=townProfile(region,site).rooms[service];
  const resident=house?{...originalResident,portrait:house.portrait}:originalResident;
  thing(a,'resident','resident',...plan.resident,resident.name,{npc:resident});
  thing(a,'exit','exit',8,10,EXIT,{link:mapId(region,site)});
  stamp(a,{x:8,y:10},Tile.Wood);
  if(shop?.trial)thing(a,'job-trial','trial',...shop.trial,['奥の演習場','Guild training ground'],{variant:2});
  if(house){
    thing(a,'cupboard','secret',...house.keepsake,['家の小箱','Household keepsake']);
    const [,x,y,,height=1]=house.game.table;
    thing(a,'game','house-game',x,y+height-1,house.game.name);
  }
  return a;
}

function makeWild(region: number,site: number,id: string,name: Copy,feature?:Feature) {
  const a=createArea(id,region,name,'wild',33,23,Tile.Grass,{x:16,y:20});
  for(let y=0;y<a.height;y++) for(let x=0;x<a.width;x++){
    const n=noise(x,y,region*9+site);
    if(x<2||x>a.width-3||y<2||y>=a.height-1) stamp(a,{x,y},Tile.Forest);
    else if(n<.15) stamp(a,{x,y},Tile.Flowers);
    else if(n>.80) stamp(a,{x,y},Tile.Forest);
    if(region===2 && x>21 && y>4&&y<15 && Math.abs(x-(26+Math.sin(y*.5)*2))<1.1) stamp(a,{x,y},y===9?Tile.Waterfall:Tile.Water);
    if(region===4 && x<11 && y<9 && n>.4) stamp(a,{x,y},Tile.Ice);
  }
  for(const end of [{x:5,y:14},{x:25,y:13},{x:24,y:5},{x:8,y:6}]) route(a,{x:16,y:19},end,Tile.Path,2);
  route(a,{x:8,y:6},{x:25,y:13},Tile.Path,1);
  route(a,{x:16,y:19},{x:16,y:9},Tile.Path);
  route(a,{x:16,y:13},{x:25,y:13},Tile.Path);
  route(a,{x:8,y:8},{x:13,y:8},Tile.Path);
  rectangle(a,14,17,6,4,Tile.Path);
  thing(a,'exit','exit',16,21,EXIT,{link:WORLD_ID});
  thing(a,'sign','sign',15,18,['石の道しるべ','Stone milestone']);
  thing(a,'chest','chest',8,6,REGIONS[region].book,{variant:site});
  thing(a,'lesson','seal',24,5,['知識の宝箱','Lore chest']);
  thing(a,'secret','secret',5,14,['草に隠れた小径','Grass-hidden trail']);
  thing(a,'foe-0','enemy',23,13,['徘徊する魔物','Roaming creature'],{variant:0});
  thing(a,'foe-1','enemy',13,8,['徘徊する魔物','Roaming creature'],{variant:1});
  thing(a,'travelers','recruit',16,11,['道を探す旅人','Travelers seeking a road'],{variant:site});
  rectangle(a,15,9,3,4,Tile.Grass);
  if(feature) placeWildFeature(a,feature);
  return a;
}

function placeWildFeature(a:Area,feature:Feature) {
  if(feature==='rock'){
    rectangle(a,11,14,6,3,Tile.Path);
    thing(a,'rock','rock',13,15,FEATURES.rock,{feature});
    thing(a,'plate','plate',15,15,['重しを載せる床','Counterweight plate'],{feature});
  }else {
    const p=feature==='warp'?{x:25,y:16}:{x:17,y:16};
    stamp(a,p,Tile.Path);
    thing(a,'feature','feature',p.x,p.y,FEATURES[feature],{feature});
  }
}

function makeDungeon(region: number,site: number,floor: number,id: string,name: Copy,feature: Feature): Area {
  const plan=DUNGEON_LAYOUTS[feature];
  const orientation=(region+site+floor)%4;
  const a=createArea(id,region,floor?[name[0]+` 地下${floor+1}層`,name[1]+` · B${floor+1}`]:name,'dungeon',DUNGEON_WIDTH,DUNGEON_HEIGHT,Tile.Wall,{x:0,y:0});
  const fill=region===1||region===5?Tile.Stone:Tile.Cave;
  const specialTiles: Record<string,Tile> = {
    ':':Tile.Stone,'=':Tile.Bridge,'~':Tile.Water,w:feature==='warp'?Tile.Void:Tile.Deep,
    i:Tile.Ice,r:Tile.Rotor,'^':Tile.Trap,'+':Tile.Hidden,u:Tile.Hidden,
  };
  const markers: Record<string,Point> = {};
  plan.forEach((row,y)=>Array.from(row).forEach((symbol,x)=>{
    if(symbol==='#')return;
    const point={x:orientation%2?DUNGEON_WIDTH-1-x:x,y:orientation>=2?DUNGEON_HEIGHT-1-y:y};
    stamp(a,point,specialTiles[symbol]??fill);
    if(symbol==='a')a.start=point;
    markers[symbol]=point;
  }));
  const mark=(symbol:string,key:string,kind:Kind,label:Copy,extra?:Partial<Landmark>)=>{
    const point=markers[symbol];
    if(point)thing(a,key,kind,point.x,point.y,label,extra);
  };
  mark('v','exit','exit',floor?['上の層へ戻る','Stairs up']:EXIT,{link:floor?mapId(region,site,floor-1):WORLD_ID});
  mark('g','gate','gate',['奥の間への扉','Inner gate'],{feature});
  mark('u','passage','secret',['傷のある壁','Cracked wall']);
  mark('c','camp','camp',CAMP);
  mark('t','sign','sign',['探索の石碑','Exploration tablet']);
  mark('b','cache','chest',REGIONS[region].book,{variant:site+floor});
  mark('k','seal','seal',['知識の封印','Seal of Lore']);
  mark('1','minor','enemy',['番犬の影','A guardian’s shadow'],{variant:(floor+1)%3});
  mark('2','minor2','enemy',['巣を守る魔物','Nest guardian'],{variant:(floor+2)%3});
  mark('s','shortcut','shortcut',['帰還の転移石','Returnstone']);
  mark('h','north-cache','chest',['奥の隠し宝箱','Hidden inner chest'],{variant:5+floor});
  if(site===2||site===3)mark('e','hidden-foe','trial',['裏道の強敵','Guardian of the side passage'],{variant:1});
  if(site!==4)mark('x','recruit','recruit',['閉じ込められた旅人','Trapped traveler'],{variant:site});
  else if(floor+1<floors(region,site))mark('x','down','stairs',['深層へ進む','Stairs down'],{link:mapId(region,site,floor+1)});
  else mark('x','boss','boss',REGIONS[region].boss);

  if(feature==='rock'){
    mark('f','rock','rock',FEATURES[feature],{feature});
    mark('p','plate','plate',['重しを載せる床','Counterweight plate'],{feature});
  }else{
    mark('f','feature','feature',FEATURES[feature],{feature,destination:markers.z});
    mark('z','warp-return','feature',FEATURES[feature],{feature,destination:markers.f,variant:1});
  }
  return a;
}

const CACHE=new Map<string,Area>();
export function area(id: string): Area {
  const saved=CACHE.get(id); if(saved) return saved;
  if(id===WORLD_ID) { const a=makeWorld();CACHE.set(id,a);return a; }
  const found=/^r(\d)-s(\d)-f(\d)(?:\/([a-z]+))?$/.exec(id);
  if(!found) return area(WORLD_ID);
  const [,r,s,f,room]=found, region=Number(r),site=Number(s),floor=Number(f);
  const location=REGIONS[region]?.sites[site];
  if(!location || floor>=floors(region,site) || room&&(!(room in SERVICES)||location.type!=='town')) return area(WORLD_ID);
  const a=room?makeInterior(region,site,id,room as Service):location.type==='town'?makeTown(region,site,id,location.name)
    :location.type==='wild'?makeWild(region,site,id,location.name,location.feature)
    :makeDungeon(region,site,floor,id,location.name,floor===2?'mirror':floor===1?(region>=5?'rock':region%2===0?'rotor':'pit'):location.feature??'lever');
  CACHE.set(id,a);
  return a;
}

export const isAir = (v:Vehicle)=>v==='airship'||v==='skyship';
export const isWater = (t:Tile)=>t===Tile.Deep||t===Tile.Sea||t===Tile.Shallow||t===Tile.Water||t===Tile.Waterfall;
export const isSolid = (t:Tile)=>t===Tile.Void||t===Tile.Wall||t===Tile.Forest||t===Tile.Rock||t===Tile.Hidden;
export function canTravel(tile: Tile, vehicle: Vehicle, onWorld: boolean) {
  if(!onWorld) return !isSolid(tile) && !isWater(tile);
  if(isAir(vehicle)) return tile!==Tile.Void;
  if(!isWater(tile)) return !isSolid(tile);
  if(vehicle==='foot') return false;
  if(vehicle==='canoe') return tile===Tile.Shallow||tile===Tile.Water;
  return vehicle==='ship'||vehicle==='submarine';
}
export function isShore(a: Area,p:Point) {
  return !isWater(tileAt(a,p))&&Object.values(OFFSETS).some(o=>isWater(tileAt(a,add(p,o))));
}
export function areaSite(id:string) {const m=/^r(\d)-s(\d)-f(\d)/.exec(id);return m?[Number(m[1]),Number(m[2]),Number(m[3])] as const:null;}
export function nearbyLandmark(a:Area,at:Point,facing:Direction, visible:(l:Landmark)=>boolean) {
  const ahead=add(at,OFFSETS[facing]);
  const priority=(type:Kind)=>type==='enemy'||type==='boss'||type==='site'||type==='door'||type==='stairs'?0:1;
  return a.points.filter(l=>visible(l)&&(same(at,l)||same(ahead,l)||distance(at,l)===1&&!['site','door','exit','gate','rock','enemy','boss'].includes(l.kind)))
    .sort((x,y)=>distance(at,x)-distance(at,y)||priority(x.kind)-priority(y.kind))[0];
}
export function headline(a:Area,p:Point) {
  return a.id===WORLD_ID?REGIONS[regionAt(p)].name:a.name;
}
export function isRoad(tile:Tile) { return tile===Tile.Path||tile===Tile.Bridge; }
