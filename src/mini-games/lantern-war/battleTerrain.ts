import type{Terrain}from'./types';
/** Repair authored bridge approaches without turning actual fortification gates into bridges. */
export function connectedBattleTerrain(rows:readonly(string|readonly Terrain[])[]):Terrain[][]{
 const map=rows.map(row=>typeof row==='string'?row.split('') as Terrain[]:[...row]),seen=new Set<string>();
 const steps=[[1,0],[-1,0],[0,1],[0,-1]];
 for(let y=0;y<map.length;y++)for(let x=0;x<map[y].length;x++){
 if(map[y][x]!=='b'||seen.has(x+','+y))continue;
 const component:{x:number;y:number}[]=[],queue=[{x,y}];
 while(queue.length){const p=queue.shift()!,key=p.x+','+p.y;if(seen.has(key)||map[p.y]?.[p.x]!=='b')continue;seen.add(key);component.push(p);for(const [dx,dy]of steps)queue.push({x:p.x+dx,y:p.y+dy});}
 const river=component.some(p=>steps.some(([dx,dy])=>map[p.y+dy]?.[p.x+dx]==='w'));
 if(!river){for(const p of component)map[p.y][p.x]='r';continue;}
 const xs=component.map(p=>p.x),ys=component.map(p=>p.y),wide=Math.max(...xs)-Math.min(...xs),high=Math.max(...ys)-Math.min(...ys);
 const acrossVertical=component.some(p=>map[p.y]?.[p.x-1]==='w'||map[p.y]?.[p.x+1]==='w'),acrossHorizontal=component.some(p=>map[p.y-1]?.[p.x]==='w'||map[p.y+1]?.[p.x]==='w');
 const vertical=acrossVertical&&!acrossHorizontal||acrossVertical===acrossHorizontal&&high>=wide,axis=vertical?[[0,-1],[0,1]]:[[-1,0],[1,0]];
 // Landward bridge markers are approaches, not extra raised spans sitting on grass.
 const wetBands=new Set(component.filter(p=>vertical?map[p.y]?.[p.x-1]==='w'||map[p.y]?.[p.x+1]==='w':map[p.y-1]?.[p.x]==='w'||map[p.y+1]?.[p.x]==='w').map(p=>vertical?p.y:p.x));
 for(const p of component)if(!wetBands.has(vertical?p.y:p.x))map[p.y][p.x]='r';
 for(const p of component)for(const [dx,dy]of axis){let ax=p.x+dx,ay=p.y+dy;if(map[ay]?.[ax]==='b'||map[ay]?.[ax]==='w')continue;
 // A lone straight wall on the continuation of a bridge was an incorrect approach marker.
 // Branching walls remain defensive structures; their gateways are handled as paved gaps.
 while(map[ay]?.[ax]==='#'&&map[ay+dx]?.[ax+dy]!=='#'&&map[ay-dx]?.[ax-dy]!=='#'){map[ay][ax]='r';ax+=dx;ay+=dy;}
 if(map[ay]?.[ax]==='.')map[ay][ax]='r';
 }
 }
 return map;
}
