import type{Terrain}from'./types';
/** One neighbor rule feeds both the clipping mask and exposed-edge stroke. No internal tile seams. */
export function terrainCorners(map:Terrain[][],x:number,y:number,group:readonly Terrain[]){
 const same=(x:number,y:number)=>group.includes(map[y]?.[x]);
 return [[-1,-1],[1,-1],[-1,1],[1,1]].map(([dx,dy])=>{const h=same(x+dx,y),v=same(x,y+dy);return !h&&!v?'outer':h&&v&&!same(x+dx,y+dy)?'inner':'flat';});
}
function contourSegment(p:Path2D,ax:number,ay:number,bx:number,by:number,size:number,seed:number){const length=Math.hypot(bx-ax,by-ay)||1,bend=Math.sin(seed*1.73)*size*.085;p.quadraticCurveTo((ax+bx)/2-(by-ay)/length*bend,(ay+by)/2+(bx-ax)/length*bend,bx,by);}
export function terrainMask(map:Terrain[][],x:number,y:number,group:readonly Terrain[],size=128){
 const shape=terrainCorners(map,x,y,group),left=x*size,top=y*size,r=shape.map(c=>c==='outer'?size*.22:0),p=new Path2D();
 const same=(dx:number,dy:number)=>group.includes(map[y+dy]?.[x+dx]);
 p.moveTo(left+r[0],top);if(!same(0,-1))contourSegment(p,left+r[0],top,left+size-r[1],top,size,x*19+y*7);else p.lineTo(left+size-r[1],top);p.quadraticCurveTo(left+size,top,left+size,top+r[1]);
 if(!same(1,0))contourSegment(p,left+size,top+r[1],left+size,top+size-r[3],size,x*11+y*23);else p.lineTo(left+size,top+size-r[3]);p.quadraticCurveTo(left+size,top+size,left+size-r[3],top+size);
 if(!same(0,1))contourSegment(p,left+size-r[3],top+size,left+r[2],top+size,size,x*19+y*7+3);else p.lineTo(left+r[2],top+size);p.quadraticCurveTo(left,top+size,left,top+size-r[2]);
 if(!same(-1,0))contourSegment(p,left,top+size-r[2],left,top+r[0],size,x*11+y*23+3);else p.lineTo(left,top+r[0]);p.quadraticCurveTo(left,top,left+r[0],top);p.closePath();
 for(let i=0;i<4;i++)if(shape[i]==='inner'){const cx=left+(i%2?size:0),cy=top+(i>=2?size:0),a=[0,Math.PI/2,Math.PI*1.5,Math.PI][i],r=size*.14;p.moveTo(cx,cy);p.lineTo(cx+Math.cos(a)*r,cy+Math.sin(a)*r);p.arc(cx,cy,r,a,a+Math.PI/2);p.closePath();}return p;
}
export function terrainEdges(map:Terrain[][],x:number,y:number,group:readonly Terrain[],size=128){
 const c=terrainCorners(map,x,y,group),same=(x:number,y:number)=>group.includes(map[y]?.[x]),l=x*size,t=y*size,r=c.map(v=>v==='outer'?size*.22:0),p=new Path2D();
 if(!same(x,y-1)){p.moveTo(l+r[0],t);contourSegment(p,l+r[0],t,l+size-r[1],t,size,x*19+y*7);}if(!same(x+1,y)){p.moveTo(l+size,t+r[1]);contourSegment(p,l+size,t+r[1],l+size,t+size-r[3],size,x*11+y*23);}if(!same(x,y+1)){p.moveTo(l+size-r[3],t+size);contourSegment(p,l+size-r[3],t+size,l+r[2],t+size,size,x*19+y*7+3);}if(!same(x-1,y)){p.moveTo(l,t+size-r[2]);contourSegment(p,l,t+size-r[2],l,t+r[0],size,x*11+y*23+3);}
 for(let i=0;i<4;i++){const cx=l+(i%2?size:0),cy=t+(i>=2?size:0);if(c[i]==='outer'){const radius=size*.22,a=[Math.PI,Math.PI*1.5,Math.PI/2,0][i];p.moveTo(cx+(i%2?-radius:radius)+Math.cos(a)*radius,cy+(i>=2?-radius:radius)+Math.sin(a)*radius);p.arc(cx+(i%2?-radius:radius),cy+(i>=2?-radius:radius),radius,a,a+Math.PI/2);}else if(c[i]==='inner'){const a=[0,Math.PI/2,Math.PI*1.5,Math.PI][i],radius=size*.14;p.moveTo(cx+Math.cos(a)*radius,cy+Math.sin(a)*radius);p.arc(cx,cy,radius,a,a+Math.PI/2);}}return p;
}
