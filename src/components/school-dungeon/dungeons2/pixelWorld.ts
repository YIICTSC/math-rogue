import {drawMapMaterial,drawMapGroundFeature,type MaterialContext} from './mapMaterials';
import {assetUrl} from '../../../utils/assetPaths';
export const D2_MONSTERS=['SLIME','BAT','GHOST','DRAIN','DRAGON','METAL','THIEF','MANDRAKE','GOLEM','NINJA','MAGE','SHOPKEEPER','BOSS','FLOATING','SPLIT','SEAL','SWALLOW','ERASE','RICE','EVOLVE','DETENTION','MONITOR','MIMIC','UMBRELLA','MUD','SPROUT'] as const;
export const D2_DIRECTIONS=[{x:0,y:1},{x:-1,y:1},{x:-1,y:0},{x:-1,y:-1},{x:0,y:-1},{x:1,y:-1},{x:1,y:0},{x:1,y:1}] as const;
export const D2_BUILDINGS:Record<string,number>={INN:0,SHOP:1,TRADER:1,SMITH:2,BANK:3,WAREHOUSE:4,DOJO:5,GATE:6,FESTIVAL:7};
export const d2ArtPath=(name:string)=>assetUrl(`sprites/dungeons2/world/${name}.webp`);
export function d2MonsterKey(enemy:{enemyType?:string;schoolKind?:string}){return D2_MONSTERS.includes(enemy.schoolKind as typeof D2_MONSTERS[number])?enemy.schoolKind!:D2_MONSTERS.includes(enemy.enemyType as typeof D2_MONSTERS[number])?enemy.enemyType!:'SLIME';}
export function d2Direction(dir?:{x:number;y:number}){return Math.max(0,D2_DIRECTIONS.findIndex(v=>v.x===Math.sign(dir?.x||0)&&v.y===Math.sign(dir?.y||0)));}
const images=new Map<string,HTMLImageElement>();
function image(name:string){if(typeof Image==='undefined')return undefined;let img=images.get(name);if(!img){img=new Image();img.src=d2ArtPath(name);images.set(name,img);}return img.complete&&img.naturalWidth?img:undefined;}
export function loadD2WorldArt(){for(const name of ['materials','walls','buildings','props','features','town-backdrop',...D2_MONSTERS.map(key=>'monsters/'+key.toLowerCase())])image(name);}
function tile(ctx:CanvasRenderingContext2D,img:HTMLImageElement,index:number,x:number,y:number,size:number,columns=4,cell=32){ctx.drawImage(img,index%columns*cell,Math.floor(index/columns)*cell,cell,cell,x,y,size,size);}
export interface D2WorldContext{floor?:number;mode?:string;scene?:number;town?:boolean;biome?:string;}
export function d2FloorIndex(s:D2WorldContext){
 if(s.scene!==undefined)return s.town?8:s.scene===5?12:s.scene===4?14:8;
 const biome=s.biome&&({forest:1,ice:12,water:1,fire:13,archive:2,abyss:10,void:10,stars:10,dragon:13,mirror:12,clock:0,storm:3,chronicle:11}as Record<string,number>)[s.biome];
 if(typeof biome==='number')return biome;
 return (s.floor||1)>=16?10:(s.floor||1)>=9?1:(s.floor||1)>=5?0:2;
}
/** Each quarter selects its own edge/convex/concave art from real neighboring walls. */
export function d2WallQuarters(map:readonly (readonly string[])[],x:number,y:number){
 const wall=(dx:number,dy:number)=>map[y+dy]?.[x+dx]===undefined||map[y+dy][x+dx]==='WALL';
 return [[-1,-1,1,4,5,9],[1,-1,1,2,6,10],[1,1,3,2,7,11],[-1,1,3,4,8,12]].map(([dx,dy,horizontal,vertical,outer,inner])=>{
  const h=wall(0,dy),v=wall(dx,0);return !h&&!v?outer:!h?horizontal:!v?vertical:!wall(dx,dy)?inner:0;
 });
}
export function drawD2Tile(ctx:CanvasRenderingContext2D,map:readonly (readonly string[])[],kind:string,x:number,y:number,size:number,mx:number,my:number,s:D2WorldContext):boolean{
 if(drawMapMaterial(ctx,map,kind,x,y,size,mx,my,s,kind==='WALL'?d2WallQuarters(map,mx,my):[]))return true;
 const materials=image('materials'),walls=image('walls');if(!materials||!walls)return false;
 ctx.save();ctx.imageSmoothingEnabled=false;
 const river=s.scene!==undefined&&!s.town&&mx===5&&my>=1&&my<=9,bridge=river&&kind!=='WALL';
 const road=s.town&&(my===4||my===6||my===8||mx===5);
 tile(ctx,materials,river&&kind==='WALL'?6:bridge?2:road?3:d2FloorIndex(s),x,y,size);
 if(kind!=='WALL'&&!river&&!s.town&&s.scene===undefined){ctx.fillStyle='#111522';ctx.globalAlpha=.18;ctx.fillRect(x,y,size,size);ctx.globalAlpha=1;
  if(map[my-1]?.[mx]==='WALL'){ctx.globalAlpha=.24;ctx.fillRect(x,y,size,size*.1);ctx.globalAlpha=1;}
 }
 if(kind==='WALL'&&!river){const half=size/2,quarters=d2WallQuarters(map,mx,my);for(let q=0;q<4;q++){
  const index=quarters[q],qx=q===1||q===2?1:0,qy=q>=2?1:0;
  ctx.drawImage(walls,index%4*32+qx*16,Math.floor(index/4)*32+qy*16,16,16,x+qx*half,y+qy*half,half,half);
 }}
 const torch=kind==='WALL'&&!river&&['FLOOR','STAIRS'].includes(map[my+1]?.[mx])&&(mx+my*3)%9===0?image('props'):undefined;
 if(torch)ctx.drawImage(torch,0,0,64,64,x+size*.15,y+size*.2,size*.7,size*.7);
 if(kind==='STAIRS')tile(ctx,materials,7,x,y,size);
 ctx.restore();return true;
}
export function drawD2GroundFeature(ctx:CanvasRenderingContext2D,kind:string,x:number,y:number,size:number,s:MaterialContext={},mx=0,my=0){
 if(drawMapGroundFeature(ctx,kind,x,y,size,s,mx,my))return true;
 const feature=({CRACK:0,TRAP:1,SPIKES:2,HOLE:3}as Record<string,number>)[kind];
 const index=({WATER:6,ICE:12}as Record<string,number>)[kind],img=image(feature===undefined?'materials':'features');
 if(!img||(feature===undefined&&index===undefined))return false;
 ctx.save();ctx.imageSmoothingEnabled=false;tile(ctx,img,feature??index,x,y,size,feature===undefined?4:2);ctx.restore();return true;
}
export function drawD2Monster(ctx:CanvasRenderingContext2D,enemy:{enemyType?:string;schoolKind?:string;dir?:{x:number;y:number};status?:{sleep?:number}},x:number,y:number,size:number){
 const key=d2MonsterKey(enemy),img=image('monsters/'+key.toLowerCase());if(!img)return false;
 ctx.save();ctx.imageSmoothingEnabled=false;ctx.globalAlpha*=enemy.status?.sleep ? .6 : 1;
 ctx.drawImage(img,d2Direction(enemy.dir)*64,0,64,64,x,y,size,size);ctx.restore();return true;
}
export function drawD2Building(ctx:CanvasRenderingContext2D,kind:string,x:number,y:number,size:number){const i=D2_BUILDINGS[kind],img=image('buildings');if(i===undefined||!img)return false;ctx.save();ctx.imageSmoothingEnabled=false;tile(ctx,img,i,x,y,size,4,128);ctx.restore();return true;}
