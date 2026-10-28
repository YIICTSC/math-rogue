import type{Terrain}from'./types';
/** End pieces occur at shores, never between two connected bridge cells. */
export function bridgePlacement(map:Terrain[][],x:number,y:number){
 const at=(dx:number,dy:number)=>map[y+dy]?.[x+dx];
 const waterBeyond=(dx:number,dy:number)=>{let ax=x+dx,ay=y+dy;while(map[ay]?.[ax]==='b'){ax+=dx;ay+=dy;}return map[ay]?.[ax]==='w';};
 const riverAlongWidth=waterBeyond(-1,0)||waterBeyond(1,0);
 const vertical=riverAlongWidth||!waterBeyond(0,-1)&&!waterBeyond(0,1)&&(at(0,-1)==='b'||at(0,1)==='b');
 const horizontal=!vertical&&(at(-1,0)==='b'||at(1,0)==='b'||(at(-1,0)!=='w'&&at(1,0)!=='w'&&(at(0,-1)==='w'||at(0,1)==='w')));
 const land=(t:Terrain|undefined)=>!!t&&!['w','b','m','#'].includes(t);
 return {horizontal,start:land(horizontal?at(-1,0):at(0,-1)),end:land(horizontal?at(1,0):at(0,1))};
}
/** A wide bridge is one deck with outside rails, never one framed bridge per grid cell. */
export function bridgeRuns(map:Terrain[][]){
 const seen=new Set<string>(),runs:{x:number;y:number;width:number;height:number;horizontal:boolean;start:boolean;end:boolean}[]=[];
 for(let y=0;y<map.length;y++)for(let x=0;x<map[y].length;x++){
 if(map[y][x]!=='b'||seen.has(x+','+y))continue;const direction=bridgePlacement(map,x,y);
 const matches=(ax:number,ay:number)=>map[ay]?.[ax]==='b'&&!seen.has(ax+','+ay)&&bridgePlacement(map,ax,ay).horizontal===direction.horizontal;
 let width=1,height=1;while(matches(x+width,y))width++;while(Array.from({length:width},(_,dx)=>matches(x+dx,y+height)).every(Boolean))height++;
 for(let dy=0;dy<height;dy++)for(let dx=0;dx<width;dx++)seen.add((x+dx)+','+(y+dy));
 const last=bridgePlacement(map,x+width-1,y+height-1);runs.push({x,y,width,height,horizontal:direction.horizontal,start:direction.start,end:last.end});
 }
 return runs;
}
