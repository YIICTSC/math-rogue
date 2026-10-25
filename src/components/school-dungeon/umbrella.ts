export type UmbrellaKind='rain'|'fire'|'thunder'|'sleep'|'blow'|'warp'|'change'|'bind'|'heal';
export interface UmbrellaEffect {startX:number;startY:number;targetX:number;targetY:number;umbrellaKind:UmbrellaKind;impactValue?:string;}
export const umbrellaKind=(type:string):UmbrellaKind=>({SUPPLY_RAIN_WAND:'rain',UMB_FIRE:'fire',UMB_THUNDER:'thunder',UMB_SLEEP:'sleep',UMB_BLOW:'blow',UMB_WARP:'warp',UMB_CHANGE:'change',UMB_BIND:'bind',UMB_HEAL:'heal'} as Record<string,UmbrellaKind>)[type]||'rain';
export function traceUmbrella(map:string[][],enemies:any[],origin:{x:number;y:number},dir:{x:number;y:number},range=10){
 const dx=Math.sign(dir.x),dy=Math.sign(dir.y);let x=origin.x,y=origin.y;
 if(!dx&&!dy)return {x,y,target:null};
 for(let n=0;n<range;n++){const nx=x+dx,ny=y+dy;if(!map[ny]?.[nx]||map[ny][nx]==='WALL')break;x=nx;y=ny;const target=enemies.find(e=>e.hp>0&&e.x===x&&e.y===y);if(target)return {x,y,target:target.enemyType==='SHOPKEEPER'?null:target};}
 return {x,y,target:null};
}
export function resolveUmbrella(type:string,target:any|null,player:any,map:string[][],enemies:any[],damage:(n:number)=>number,random=Math.random){
 let updated=enemies,position:undefined|{x:number;y:number},healing=0,amount=0,hit=Boolean(target);
 const kind=umbrellaKind(type);
 if(target){let patch:any={};
  if(['rain','fire','thunder'].includes(kind)){amount=damage(kind==='thunder'?25:20);patch.hp=target.hp-amount;}
  else if(kind==='sleep')patch.status={...target.status,sleep:10};
  else if(kind==='bind')patch.status={...target.status,frozen:10};
  else if(kind==='heal')patch.hp=target.maxHp;
  else if(kind==='change'){position={x:target.x,y:target.y};patch={x:player.x,y:player.y};}
  else if(kind==='blow'){
   let x=target.x,y=target.y;const dx=Math.sign(target.x-player.x),dy=Math.sign(target.y-player.y);
   for(let n=0;n<5;n++){const nx=x+dx,ny=y+dy;if(!map[ny]?.[nx]||map[ny][nx]==='WALL'||enemies.some(e=>e.id!==target.id&&e.hp>0&&e.x===nx&&e.y===ny)||nx===player.x&&ny===player.y)break;x=nx;y=ny;}
   patch={x,y};
  }else if(kind==='warp'){
   const free:{x:number;y:number}[]=[];for(let y=0;y<map.length;y++)for(let x=0;x<map[y].length;x++)if(map[y][x]==='FLOOR'&&!(x===player.x&&y===player.y)&&!enemies.some(e=>e.hp>0&&e.x===x&&e.y===y))free.push({x,y});
   const cell=free[Math.min(free.length-1,Math.floor(Math.max(0,random())*free.length))];if(cell)patch=cell;else hit=false;
  }
  updated=enemies.map(e=>e.id===target.id?{...e,...patch}:e);
 }else if(kind==='heal'){healing=30;hit=true;}
 const defeated=updated.filter(e=>e.hp<=0&&enemies.some(old=>old.id===e.id&&old.hp>0));
 return {kind,hit,enemies:updated.filter(e=>e.hp>0),position,healing,amount,defeated};
}
