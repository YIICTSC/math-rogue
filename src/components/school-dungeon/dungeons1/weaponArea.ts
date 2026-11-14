import type {WeaponKind} from './mastery';
type Point={x:number;y:number};
export const WEAPON_AREAS:Record<WeaponKind,readonly [string,string]>={
 fist:['正面1マス','One adjacent tile'],sword:['正面の横3マス','Three-tile front arc'],greatsword:['前方2列の幅3マス','Two-row broad cleave'],rapier:['正面2マス貫通','Two-tile piercing line'],axe:['正面と左右の半円','Front and side semicircle'],spear:['正面3マス貫通','Three-tile piercing line'],staff:['上下左右2マスの十字','Four cardinal rays, two tiles'],hammer:['正面の着弾点を中心に十字','Cross around the impact tile'],bow:['正面6マス・最初の敵','First foe in a six-tile ray'],whip:['前方へ広がる2段の扇','Two-step widening fan'],chakram:['周囲2マスの外周','Outer ring two tiles away']};
export function weaponArea(kind:WeaponKind,p:Point,dir:Point,map:readonly (readonly string[])[]):Point[]{
 const d={x:Math.sign(dir.x),y:Math.sign(dir.y)};if(!d.x&&!d.y)d.y=1;
 let offsets:Point[]=[];const local=(f:number,s=0)=>{const limit=Math.max(Math.abs(f),Math.abs(s));return {x:Math.max(-limit,Math.min(limit,d.x*f-d.y*s)),y:Math.max(-limit,Math.min(limit,d.y*f+d.x*s))};};
 if(kind==='fist')offsets=[local(1)];
 if(kind==='sword')offsets=[-1,0,1].map(s=>local(1,s));
 if(kind==='greatsword')offsets=[1,2].flatMap(f=>[-1,0,1].map(s=>local(f,s)));
 if(kind==='rapier'||kind==='spear'||kind==='bow')offsets=Array.from({length:kind==='bow'?6:kind==='spear'?3:2},(_,i)=>local(i+1));
 if(kind==='axe')offsets=[local(0,-1),local(1,-1),local(1),local(1,1),local(0,1)];
 if(kind==='staff')offsets=[[1,0],[-1,0],[0,1],[0,-1]].flatMap(([x,y])=>[1,2].map(n=>({x:x*n,y:y*n})));
 if(kind==='hammer')offsets=[local(1),local(2),local(1,-1),local(1,1)];
 if(kind==='whip')offsets=[local(1),...[-1,0,1].map(s=>local(2,s))];
 if(kind==='chakram')for(let y=-2;y<=2;y++)for(let x=-2;x<=2;x++)if(Math.max(Math.abs(x),Math.abs(y))===2)offsets.push({x,y});
 const clear=(q:Point)=>{const steps=Math.max(Math.abs(q.x-p.x),Math.abs(q.y-p.y));let last=p;for(let i=1;i<=steps;i++){const x=Math.round(p.x+(q.x-p.x)*i/steps),y=Math.round(p.y+(q.y-p.y)*i/steps);if(!map[y]?.[x]||['WALL','DOOR'].includes(map[y][x]))return false;if(x!==last.x&&y!==last.y&&(['WALL','DOOR'].includes(map[last.y]?.[x])||['WALL','DOOR'].includes(map[y]?.[last.x])))return false;last={x,y};}return true;};
 return offsets.map(o=>({x:p.x+o.x,y:p.y+o.y})).filter(clear).sort((a,b)=>Math.max(Math.abs(a.x-p.x),Math.abs(a.y-p.y))-Math.max(Math.abs(b.x-p.x),Math.abs(b.y-p.y)));
}
export function weaponTargets<T extends Point&{hp:number;enemyType?:string}>(kind:WeaponKind,p:Point,dir:Point,map:readonly (readonly string[])[],enemies:readonly T[]):T[]{
 const targets=weaponArea(kind,p,dir,map).flatMap(cell=>enemies.filter(e=>e.x===cell.x&&e.y===cell.y&&e.hp>0&&e.enemyType!=='SHOPKEEPER'));
 if(kind==='bow'){const first=weaponArea(kind,p,dir,map).flatMap(cell=>enemies.filter(e=>e.x===cell.x&&e.y===cell.y&&e.hp>0))[0];return first&&first.enemyType!=='SHOPKEEPER'?[first]:[];}
 return [...new Set(targets)];
}
