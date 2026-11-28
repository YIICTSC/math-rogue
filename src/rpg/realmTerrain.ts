import type { TerrainBlock } from './voxel';
import { MAP_HEIGHT, MAP_WIDTH } from './worldDimensions';
import type { VoxelItem } from './voxelCatalog';

export const REALMS = {
  embers: {
    name:['炉火の峡谷','Ember Gorge','ろかのきょうこく'],
    guardian:['熔炉の番人','Kiln Sentinel','ようろのばんにん'],
    sentries:[['熔岩トカゲ','Magma Skink','ようがんトカゲ'],['火粉の精','Cinder Wisp','ひのこのせい']],
    sky:'#80604c',ground:'emberstone',ore:'gold_ore',landmark:'magma_block',key:'obsidian',toll:3,
    reward:{emberstone:4,gold_ingot:6},sentryTypes:['AGGRESSIVE','SWARM'],
  },
  sky: {
    name:['白帆の空庭','Cloudsail Gardens','しらほのそらにわ'],
    guardian:['風帆の守門鳥','Sailwing Keeper','ふうはんのしゅもんちょう'],
    sentries:[['雲間ワシ','Cloud Eagle','くもまワシ'],['浮き石のゴーレム','Driftstone Golem','うきいしのゴーレム']],
    sky:'#9bbdd2',ground:'skyshale',ore:'quartz_ore',landmark:'luminous_tile',key:'quartz',toll:4,
    reward:{skyshale:4,glider_boost:3},sentryTypes:['AGGRESSIVE','ELITE_FORCE'],
  },
  geode: {
    name:['紫晶の天蓋','Amethyst Canopy','ししょうのてんがい'],
    guardian:['紫晶殻の巨像','Amethyst Colossus','ししょうかくのきょぞう'],
    sentries:[['鏡晶スライム','Mirror Quartz Slime','きょうしょうスライム'],['晶洞ヤドカリ','Geode Hermit Crab','しょうどうヤドカリ']],
    sky:'#4b416a',ground:'amethyststone',ore:'red_crystal_ore',landmark:'crystal',key:'crystal_powder',toll:6,
    reward:{amethyststone:4,crystal:7},sentryTypes:['TRICKSTER','ELITE_FORCE'],
  },
  echo: {
    name:['薄暮の回廊','Twilight Gallery','はくぼのかいろう'],
    guardian:['記憶を綴る騎士','Knight of Echoes','きおくをつづるきし'],
    sentries:[['残響のランタン','Echo Lantern','ざんきょうのランタン'],['黒苔の骨兵','Mossbound Skeleton','くろごけのほねへい']],
    sky:'#413652',ground:'echostone',ore:'lapis_ore',landmark:'violetglass',key:'lapis',toll:3,
    reward:{echostone:4,imprint_book:2},sentryTypes:['GHOST','AGGRESSIVE'],
  },
  tidal: {
    name:['沈潮の珊瑚庭','Sunken Tidal Gardens','ちんちょうのさんごにわ'],
    guardian:['潮の門を守る大亀','Tidegate Tortoise','しおのもんをまもるおおがめ'],
    sentries:[['珊瑚クラゲ','Coral Jelly','さんごクラゲ'],['沈珠の番魚','Pearlwatch Fish','ちんじゅのばんぎょ']],
    sky:'#477a8f',ground:'prismstone',ore:'diamond_ore',landmark:'bubbling_stone',key:'air_draught',toll:1,
    reward:{prismstone:4,air_draught:2},sentryTypes:['SWARM','TRICKSTER'],
  },
} as const satisfies Record<string,{
  name:readonly [string,string,string];guardian:readonly [string,string,string];
  sentries:readonly [readonly [string,string,string],readonly [string,string,string]];
  sky:string;ground:TerrainBlock;ore:TerrainBlock;landmark:TerrainBlock;key:VoxelItem;toll:number;
  reward:Partial<Record<VoxelItem,number>>;sentryTypes:readonly [string,string];
}>;

export type RealmId=keyof typeof REALMS;
export const realmId=(value:unknown):value is RealmId=>typeof value==='string'&&Object.hasOwn(REALMS,value);
export const realmWardenArt=(id:RealmId)=>`sprites/rpg/realms/${id}-guardian.webp`;
export const REALM_EDGE={left:10,right:54,front:10,back:55};
export const REALM_GATE={x:32,z:48};
export const REALM_ARENA={x:32,z:23};
export const REALM_SENTRIES=[{x:26,z:34},{x:38,z:31}] as const;
export const inRealm=(x:number,z:number)=>x>=REALM_EDGE.left&&x<REALM_EDGE.right+1&&z>=REALM_EDGE.front&&z<REALM_EDGE.back+1;
const near=(x:number,z:number,point:{x:number;z:number},r:number)=>Math.abs(x-point.x)+Math.abs(z-point.z)<=r;
const boundary=(x:number,z:number)=>x===REALM_EDGE.left||x===REALM_EDGE.right||z===REALM_EDGE.front||z===REALM_EDGE.back;
const road=(x:number,z:number)=>Math.abs(x-32)<=1&&z>=19&&z<=52 ||
  Math.abs(z-34)<=1&&x>=23&&x<=32 || Math.abs(z-31)<=1&&x>=32&&x<=41;
const structure=(x:number,z:number)=>near(x,z,REALM_GATE,2)||near(x,z,REALM_ARENA,3)||REALM_SENTRIES.some(site=>near(x,z,site,2));
export const realmProtected=(x:number,z:number)=>!inRealm(x,z)||boundary(x,z)||structure(x,z);
export const realmFloorAnchor=(id:RealmId)=>id==='sky'?23:id==='tidal'?1:2;
function noise(seed:number,x:number,z:number){
  const value=Math.imul(x+101,374761393)^Math.imul(z+71,668265263)^seed;
  return (Math.imul(value^value>>>13,1274126177)>>>0)/4294967296;
}

export function realmHeight(id:RealmId,seed:number,x:number,z:number){
  if(!inRealm(x,z))return -18;
  const level=realmFloorAnchor(id);
  if(boundary(x,z))return level+5;
  if(road(x,z)||structure(x,z))return level;
  const ripple=Math.sin(x*.29+seed%19)*.65+Math.cos(z*.31+seed%23)*.7;
  if(id==='tidal')return -Math.floor(1.8+Math.abs(ripple)*2.8);
  if(id==='embers'&&Math.abs(x-42+Math.sin(z*.2)*2)<2)return 0;
  if(id==='sky')return level+Math.round(ripple*.8)+(x>40?2:0);
  return level+Math.round(ripple)+(id==='geode'&&Math.abs(x-32)>11?2:0);
}

export function realmWater(id:RealmId,seed:number,x:number,z:number){
  const floor=realmHeight(id,seed,x,z);
  return id==='tidal'&&inRealm(x,z)&&floor<0?{surface:0,depth:-floor,flowX:0,flowZ:0,kind:'river' as const}:null;
}

export function realmBlock(id:RealmId,seed:number,x:number,y:number,z:number):TerrainBlock|null {
  if(!inRealm(x,z))return null;
  if(y<=-18||boundary(x,z))return 'bedrock';
  const floor=realmHeight(id,seed,x,z), spec=REALMS[id];
  if(x===REALM_GATE.x&&z===REALM_GATE.z&&y===floor)return 'waygate';
  if(id==='embers'&&floor===0&&y===0)return 'cave-lava';
  if(y>=floor) {
    const pillar=noise(seed+940,x,z);
    if(road(x,z)||structure(x,z)){
      if(id==='echo'&&y===floor&&near(x,z,REALM_ARENA,4)&&!near(x,z,REALM_ARENA,2)&&x%2===0)return 'glowcap';
      return null;
    }
    if(id==='tidal'&&y===floor&&pillar>.95)return 'bubbling_stone';
    if(pillar>.957&&y<floor+2+(pillar>.992?1:0))return spec.landmark;
    return null;
  }
  if(id==='sky'&&y<floor-9)return null;
  if(y===floor-1&&road(x,z))return id==='sky'?'polishedstone':'stonebrick';
  const chance=noise(seed+y*571,x,z);
  if(y<floor-1&&chance>.985)return spec.ore;
  if(y===floor-1||chance>.953)return spec.ground;
  return id==='embers'?'basalt':id==='geode'?'deepslate':id==='tidal'?'sandstone':id==='echo'?'mossybrick':'diorite';
}

type RealmTile='stone'|'water'|'road';
const maps=new Map<string,RealmTile[]>();
export function realmTiles(id:RealmId,seed:number){
  const key=id+'/'+seed;
  let tiles=maps.get(key);
  if(!tiles){
    if(maps.size>=16)maps.delete(maps.keys().next().value!);
    tiles=Array.from({length:MAP_HEIGHT*MAP_WIDTH},(_,index)=>{
      const x=index%MAP_WIDTH,z=Math.floor(index/MAP_WIDTH);
      return road(x,z)?'road':realmWater(id,seed,x,z)?'water':'stone';
    });
    maps.set(key,tiles);
  }
  return tiles;
}
