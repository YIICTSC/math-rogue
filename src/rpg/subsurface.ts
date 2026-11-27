import type { Adventurer, Site, World } from './engine';
import { lifePlayer } from './life';
import { ridingCart } from './machinery';
import { traveling } from './transport';
import type { VoxelItem } from './voxelCatalog';
import { bodyClear, floorAt, playerHeight, terrainHeight, voxelWater, type TerrainBlock } from './voxel';
import { MAP_HEIGHT, MAP_WIDTH } from './worldDimensions';
import { landscapeHash } from './worldLandscape';

export const CAVERNS = {
  dripstone: { name:['月滴の鍾乳洞','Moondrop Cavern','つきしずくのしょうにゅうどう'],floor:-7,stone:'diorite',ore:'quartz_ore',light:'lantern',
    color:'#e1d0a1',goods:{quartz:5,clay:6},anchor:[32,19] },
  mirrorlake: { name:['鏡水の地下湖','Mirrorwater Grotto','かがみみずのちかこ'],floor:-10,stone:'andesite',ore:'lapis_ore',light:'bubbling_stone',
    color:'#8ce0df',goods:{lapis:3,air_draught:2},anchor:[92,31] },
  railvault: { name:['霜鉄の廃坑','Frostiron Mine','しもがねのはいこう'],floor:-8,stone:'stonebrick',ore:'ore',light:'torch',
    color:'#efb47e',goods:{iron_ingot:7,rail:8},anchor:[151,18] },
  ember: { name:['熾火の溶岩洞','Emberrift','おきびのようがんどう'],floor:-13,stone:'basalt',ore:'gold_ore',light:'magma_block',
    color:'#ff9962',goods:{obsidian:4,gold_ingot:3},anchor:[163,56] },
  redquarry: { name:['赤晶の鉱脈','Roselight Vein','せきしょうのこうみゃく'],floor:-14,stone:'deepslate',ore:'red_crystal_ore',light:'crystal',
    color:'#f280a5',goods:{crystal_powder:10,red_crystal_ore:2},anchor:[28,67] },
  undercity: { name:['石灯りの地下街','Lamplit Undercity','いしあかりのちかがい'],floor:-11,stone:'mossybrick',ore:'copper_ore',light:'lantern',
    color:'#f4cc8a',goods:{copper_ingot:4,brick:10},anchor:[65,62] },
  shrine: { name:['沈星の地下神殿','Shrine of the Sunken Star','ちんせいのちかしんでん'],floor:-12,stone:'polishedstone',ore:'diamond_ore',light:'crystal',
    color:'#8ad7dc',goods:{diamond:2,imprint_book:1},anchor:[118,70] },
  ruins: { name:['忘却の蒼晶遺跡','Blueglass Ruins','ぼうきゃくのそうしょういせき'],floor:-15,stone:'obsidian',ore:'crystal',light:'crystal',
    color:'#b6a4fa',goods:{crystal:4,obsidian:3},anchor:[139,40] },
} as const satisfies Record<string,{name:readonly [string,string,string];floor:number;stone:TerrainBlock;ore:TerrainBlock;
  light:TerrainBlock;color:string;goods:Partial<Record<VoxelItem,number>>;anchor:readonly [number,number]}>;

export type CavernId=keyof typeof CAVERNS;
export type Cavern={id:CavernId;x:number;z:number};
export type CavernAction={type:'voxel-cave';command:'enter'|'exit'|'recover'|'challenge';id:CavernId};
const guarded=(id:CavernId)=>id==='shrine'||id==='ruins';
const shore=(id:CavernId)=>id==='mirrorlake'||id==='ember';
export const cavernEntrance=(cave:Cavern)=>({x:cave.x,z:cave.z+6});
export const cavernCache=(cave:Cavern)=>({x:cave.x,z:cave.z-3,y:CAVERNS[cave.id].floor});
export const cavernRecord=(id:CavernId)=>`discovered-${id}`;
export const cacheRecord=(id:CavernId)=>`cache-${id}`;
export const cavernGuardianId=(id:CavernId)=>`cavern-warden-${id}`;

export function planCaverns(world:World):Cavern[] {
  const caves:Cavern[]=[];
  for (const id of Object.keys(CAVERNS) as CavernId[]) {
    const [ax,az]=CAVERNS[id].anchor;
    const x=ax+Math.floor(landscapeHash(ax,az,world.seed)*11)-5;
    const z=az+Math.floor(landscapeHash(az,ax,world.seed)*11)-5;
    const candidates=[];
    for (let dx=-14;dx<=14;dx++) for (let dz=-12;dz<=12;dz++) {
      const cx=x+dx,cz=z+dz,entry=cz+6;
      if (cx<8||cz<7||cx>=MAP_WIDTH-8||entry>=MAP_HEIGHT-4||world.tiles[entry*MAP_WIDTH+cx]==='water' ||
        caves.some(other=>Math.abs(other.x-cx)<15&&Math.abs(other.z-cz)<15) ||
        world.sites.some(site=>Math.abs(site.x-cx)+Math.abs(site.y-entry)<7 || Math.abs(site.x-cx)+Math.abs(site.y-cz)<9)) continue;
      const tile=world.tiles[entry*MAP_WIDTH+cx];
      candidates.push({id,x:cx,z:cz,r:Math.abs(dx)+Math.abs(dz)+(tile==='road'?-2:tile==='forest'?2:0)});
    }
    candidates.sort((a,b)=>a.r-b.r);
    if (candidates[0]) {
      const {id,x,z}=candidates[0];
      caves.push({id,x,z});
    }
  }
  return caves;
}

export function cavernGuardians(caves:Cavern[]):Site[] {
  return caves.filter(cave=>guarded(cave.id)).map(cave=>({
    id:cavernGuardianId(cave.id),x:cave.x,y:cave.z,kind:'enemy',subsurface:cave.id,
    name:cave.id==='ruins'?'蒼晶遺跡の番人':'沈星の石の守護者',
    hp:0,maxHp:0,cleared:false,
  }));
}

export function restoreCaverns(w:World) {
  if (w.caverns===undefined) return;
  const sites=Array.isArray(w.caverns)?w.caverns:[], accepted=new Set<CavernId>();
  w.caverns=sites.filter(cave=>{
    if (!cave||!Object.hasOwn(CAVERNS,cave.id)||accepted.has(cave.id)||![cave.x,cave.z].every(Number.isSafeInteger)||
      cave.x<8||cave.x>=MAP_WIDTH-8||cave.z<7||cave.z+6>=MAP_HEIGHT-4) return false;
    accepted.add(cave.id);
    return true;
  });
  w.sites=w.sites.filter(site=>!site.subsurface||accepted.has(site.subsurface));
}

function chamberColumn(cave:Cavern,x:number,z:number) {
  const dx=x-cave.x,dz=z-cave.z,side=Math.abs(dx);
  if (side>6||Math.abs(dz)>7) return false;
  if (side<=1&&dz>=3&&dz<=7) return true;
  switch (cave.id) {
    case 'railvault': return side<=4&&dz>=-5&&dz<=5;
    case 'undercity': return side<=5&&Math.abs(dz)<=4;
    case 'shrine': case 'ruins': return side+Math.abs(dz)<=8&&Math.abs(dz)<=5;
    default: return (dx/6)**2+(dz/5.6)**2<=1;
  }
}

function cavernAt(w:World,x:number,z:number) {
  return w.caverns?.find(cave=>chamberColumn(cave,x,z));
}

function basin(cave:Cavern,x:number,z:number) {
  return shore(cave.id)&&Math.abs(x-cave.x)>=2&&Math.abs(x-cave.x)<=4&&Math.abs(z-cave.z)<=2;
}

/** Undefined leaves the underlying terrain generator in charge of a cell. */
export function cavernBlock(w:World,x:number,y:number,z:number):TerrainBlock|null|undefined {
  if (!w.caverns?.length || y>-3 || y<-17) return undefined;
  const cave=cavernAt(w,x,z);
  if (!cave) return undefined;
  const def=CAVERNS[cave.id], f=def.floor, dx=x-cave.x,dz=z-cave.z;
  const wet=basin(cave,x,z), floor=wet?f-2:f;
  if (y===floor-1) {
    if (Math.abs(dx)>3 && (x*19+z*11)%4===0) return def.ore;
    return def.stone;
  }
  if (y<floor || y>f+4) return undefined;
  if (wet && y<f && cave.id==='ember') return 'cave-lava';
  if (y===f+4) return def.stone;
  if (absEdge(dx,dz) && y===f+3 && (x*3+z)%4===0) return def.ore;
  if (y===f && dz>=-2 && dz<=2 && Math.abs(dx)===4 && !wet) return def.light;
  if (y===f && cave.id==='railvault' && dx===0 && dz>=-2&&dz<=5) return 'rail';
  if (y===f && cave.id==='dripstone' && Math.abs(dx)===3 && dz%2===0) return 'stoneslab';
  if (y===f+3 && cave.id==='dripstone' && Math.abs(dx)===3 && dz%2===0) return 'diorite';
  if (y===f && (cave.id==='undercity'||guarded(cave.id)) && Math.abs(dx)===3&&[-3,0,3].includes(dz)) return def.stone;
  if (y>f && y<f+3 && (cave.id==='undercity'||guarded(cave.id)) && Math.abs(dx)===3&&[-3,3].includes(dz)) return def.stone;
  return null;
}

const absEdge=(dx:number,dz:number)=>Math.abs(dx)>=4||Math.abs(dz)>=4;

export function cavernWater(w:World,x:number,z:number,feet:number|undefined) {
  const cave=w.caverns?.find(cave=>cave.id==='mirrorlake');
  if (!cave || feet===undefined || feet>CAVERNS.mirrorlake.floor+.2 ||
    !basin(cave,Math.floor(x),Math.floor(z))) return null;
  return {surface:CAVERNS.mirrorlake.floor,depth:2,flowX:0,flowZ:0,kind:'lake' as const};
}

export function cavernStructure(w:World,x:number,y:number,z:number) {
  return w.caverns?.some(cave=>{
    const entry=cavernEntrance(cave), feet=CAVERNS[cave.id].floor;
    return x===entry.x&&z===entry.z&&([feet-1,feet,feet+1].includes(y));
  });
}

export function currentCavern(w:World,p:Adventurer) {
  if (!p.position3D||p.position3D.y===undefined||p.position3D.y>-3) return undefined;
  const cave=cavernAt(w,Math.floor(p.position3D.x),Math.floor(p.position3D.z));
  return cave && p.position3D.y>=CAVERNS[cave.id].floor-2.1 && p.position3D.y<CAVERNS[cave.id].floor+4?cave:undefined;
}

export function nearCavernEntrance(w:World,p:Adventurer) {
  const {x,z}=p.position3D??{x:p.x+.5,z:p.y+.5}, feet=playerHeight(w,p);
  return w.caverns?.find(cave=>{
    const entry=cavernEntrance(cave);
    return Math.abs(x-entry.x-.5)+Math.abs(z-entry.z-.5)<=2.2 && feet>=terrainHeight(w,entry.x,entry.z)-1.5;
  });
}

export function nearCavernCache(w:World,p:Adventurer,cave:Cavern) {
  const cache=cavernCache(cave), pos=p.position3D;
  return !!pos&&Math.abs(pos.x-cache.x-.5)+Math.abs(pos.z-cache.z-.5)<2.2&&Math.abs((pos.y ?? 0)-cache.y)<1.6;
}

export function cavernSiteReachable(w:World,p:Adventurer,site:Site) {
  const cave=currentCavern(w,p);
  if (site.subsurface) return cave?.id===site.subsurface && Math.abs(playerHeight(w,p)-CAVERNS[cave.id].floor)<1.6;
  return !cave;
}

function cavernReturn(w:World,cave:Cavern) {
  const entry=cavernEntrance(cave);
  const offsets=[[0,0],[0,1],[1,0],[-1,0],[0,-1],[0,2],[2,0],[-2,0]];
  for (const [dx,dz] of offsets) {
    const x=entry.x+dx,z=entry.z+dz;
    const top=floorAt(w,x,z,terrainHeight(w,x,z)+1.2);
    if (top!==null&&!voxelWater(w,x,z,top)&&bodyClear(w,x,z,top)) return {x,z,y:top};
  }
  return null;
}

export function applyCavern(w:World,p:Adventurer,action:CavernAction) {
  if (!w.started||w.ended||w.gameMode!=='COOP'||p.spectator||traveling(w,p)||ridingCart(w,p.id)||
    !Object.hasOwn(CAVERNS,action.id)) return false;
  const cave=w.caverns?.find(cave=>cave.id===action.id);
  if (!cave) return false;
  const discoveries=p.voxelDiscoveries??=[];
  const entry=cavernEntrance(cave);
  const move=(x:number,y:number,z:number)=>{
    p.position3D={x:x+.5,y,z:z+.5,surface2D:p.position3D?.surface2D??true,layered2D:true};
    p.x=x;
    p.y=z;
  };
  if (action.command==='enter') {
    if (nearCavernEntrance(w,p)?.id!==cave.id) return false;
    const feet=CAVERNS[cave.id].floor;
    if (!bodyClear(w,entry.x,entry.z,feet)||floorAt(w,entry.x,entry.z,feet+.01)!==feet) return false;
    move(entry.x,feet,entry.z);
    if (!discoveries.includes(cavernRecord(cave.id))) discoveries.push(cavernRecord(cave.id));
  } else if (action.command==='exit') {
    if (currentCavern(w,p)?.id!==cave.id || Math.abs(p.x-entry.x)+Math.abs(p.y-entry.z)>2) return false;
    const target=cavernReturn(w,cave);
    if (!target) return false;
    move(target.x,target.y,target.z);
  } else if (action.command==='recover') {
    const cache=cacheRecord(cave.id);
    if (currentCavern(w,p)?.id!==cave.id || !nearCavernCache(w,p,cave) || discoveries.includes(cache) ||
      guarded(cave.id)&&!w.sites.some(site=>site.id===cavernGuardianId(cave.id)&&site.cleared)) return false;
    const pouches=lifePlayer(p).bag;
    for (const [item,count] of Object.entries(CAVERNS[cave.id].goods)) {
      const id=item as VoxelItem;
      pouches[id]=(pouches[id]??0)+count;
    }
    discoveries.push(cache);
  } else return false;
  w.revision++;
  return true;
}
