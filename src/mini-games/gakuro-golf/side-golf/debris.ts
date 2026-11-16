import {SIDE_COURSES,solidPoints,type V,type Material,type SideCourse} from './courses';
export interface Debris {id:number;source:number;x:number;y:number;angle:number;vx:number;vy:number;spin:number;points:V[];material:Material;fixed:boolean;sleeping:boolean;rest:number}
export interface SideBoard {time:number;broken:number[];frozen:number[];fragments:Debris[]}
export const DEBRIS_LIMIT=96;
export const createSideBoard=():SideBoard=>({time:0,broken:[],frozen:[],fragments:[]});
export function polygonContains(p:V,points:V[]){let yes=false;for(let i=0,j=points.length-1;i<points.length;j=i++){const a=points[i],b=points[j];if((a.y>p.y)!==(b.y>p.y)&&p.x<(b.x-a.x)*(p.y-a.y)/(b.y-a.y)+a.x)yes=!yes;}return yes;}
export function polygonContact(p:V,points:V[]){let best=Infinity,out={x:0,y:1,nx:0,ny:1,distance:Infinity};for(let i=0;i<points.length;i++){const a=points[i],b=points[(i+1)%points.length],dx=b.x-a.x,dy=b.y-a.y,length=Math.hypot(dx,dy);if(length<.00001)continue;const t=Math.max(0,Math.min(1,((p.x-a.x)*dx+(p.y-a.y)*dy)/(length*length))),x=a.x+dx*t,y=a.y+dy*t,dist=Math.hypot(p.x-x,p.y-y);if(dist<best){best=dist;out={x,y,nx:dy/length,ny:-dx/length,distance:dist};}}return {...out,inside:polygonContains(p,points)};}
export const debrisPoints=(f:Debris)=>{const c=Math.cos(f.angle),s=Math.sin(f.angle);return f.points.map(p=>({x:f.x+p.x*c-p.y*s,y:f.y+p.x*s+p.y*c}));};
function clip(points:V[],axis:'x'|'y',bound:number,sign:number){const out:V[]=[];for(let i=0;i<points.length;i++){const a=points[i],b=points[(i+1)%points.length],ina=(a[axis]-bound)*sign>=0,inb=(b[axis]-bound)*sign>=0;if(ina)out.push(a);if(ina!==inb){const t=(bound-a[axis])/(b[axis]-a[axis]);out.push({x:a.x+(b.x-a.x)*t,y:a.y+(b.y-a.y)*t});}}return out;}
function area(points:V[]){return Math.abs(points.reduce((n,p,i)=>{const q=points[(i+1)%points.length];return n+p.x*q.y-q.x*p.y;},0))*.5;}
/** Partition the actual collider, retaining all unhit cells and a stable cup foundation. */
export function fractureSolid(board:SideBoard,c:SideCourse,index:number,impact:V,velocity:V){
 if(board.broken.includes(index))return false;const solid=c.solids[index],points=solidPoints(solid,board.time),minX=Math.min(...points.map(p=>p.x)),maxX=Math.max(...points.map(p=>p.x)),minY=Math.min(...points.map(p=>p.y)),maxY=Math.max(...points.map(p=>p.y));
 const cells=Math.max(6,Math.min(28,DEBRIS_LIMIT-board.fragments.length));if(cells<6||board.fragments.length>DEBRIS_LIMIT-6)return false;
 const step=Math.max(15,Math.sqrt((maxX-minX)*(maxY-minY)/cells)),parts:Debris[]=[];
 for(let y=minY,row=0;y<maxY-.01;y+=step,row++)for(let x=minX,col=0;x<maxX-.01;x+=step,col++){
  let cell=clip(points,'x',x,1);cell=clip(cell,'x',x+step,-1);cell=clip(cell,'y',y,1);cell=clip(cell,'y',y+step,-1);if(cell.length<3||area(cell)<2)continue;
  const center={x:cell.reduce((n,p)=>n+p.x,0)/cell.length,y:cell.reduce((n,p)=>n+p.y,0)/cell.length},near=Math.hypot(center.x-impact.x,center.y-impact.y)<step*2.3;
  const fixed=center.x>c.cup.x-16&&center.x<c.cup.x+16&&center.y<c.cup.y+3&&center.y>c.cup.y-step*1.5;
  const id=index*10000+row*100+col,jitter=Math.sin(id*12.97)*.5;
  parts.push({id,source:index,...center,angle:0,vx:near&&!fixed?velocity.x*.32+jitter*45:0,vy:near&&!fixed?45+Math.abs(velocity.y)*.18+Math.abs(jitter)*38:0,spin:near&&!fixed?jitter*5:0,points:cell.map(p=>({x:p.x-center.x,y:p.y-center.y})),material:solid.material,fixed,sleeping:!near||fixed,rest:0});
 }
 if(parts.length+board.fragments.length>DEBRIS_LIMIT||!parts.length)return false;
 board.broken.push(index);board.fragments.push(...parts);return true;
}
/** Host-owned fragments use the same coordinates as their rendered landing surfaces. */
export function tickSideBoard(board:SideBoard,courseId:number,dt:number){const c=SIDE_COURSES[courseId];for(let remaining=Math.min(.1,dt);remaining>1e-7;){const step=Math.min(remaining,1/120);remaining-=step;board.time+=step;
 for(const f of board.fragments){if(f.fixed||f.sleeping)continue;const old={x:f.x,y:f.y};f.vy-=92*step;f.vx*=1-.22*step;f.spin*=1-.55*step;f.x+=f.vx*step;f.y+=f.vy*step;f.angle+=f.spin*step;
  const vertices=debrisPoints(f);let landed=false;
  for(let i=0;i<c.solids.length;i++){if(board.broken.includes(i))continue;const solid=solidPoints(c.solids[i],board.time);for(const v of vertices){const hit=polygonContact(v,solid);if(hit.inside){f.x+=hit.x-v.x+hit.nx*.05;f.y+=hit.y-v.y+hit.ny*.05;const n=f.vx*hit.nx+f.vy*hit.ny;if(n<0){f.vx-=n*hit.nx*1.15;f.vy-=n*hit.ny*1.15;}landed=true;break;}}}
  // Sleeping rubble supports later debris and golf balls; flying debris never has a hidden floor.
  const bottom=Math.min(...debrisPoints(f).map(p=>p.y));for(const other of board.fragments){if(other===f||!other.sleeping&&!other.fixed)continue;const pts=debrisPoints(other),left=Math.min(...pts.map(p=>p.x)),right=Math.max(...pts.map(p=>p.x)),top=Math.max(...pts.map(p=>p.y));if(f.x>left&&f.x<right&&bottom<top&&old.y+f.points.reduce((n,p)=>Math.min(n,p.y),0)>=top-1&&f.vy<=0){f.y+=top-bottom+.02;f.vy=Math.abs(f.vy)*.1;landed=true;break;}}
  if(landed){f.vx*=.9;f.spin*=.72;f.rest+=step;if(Math.hypot(f.vx,f.vy)<4&&Math.abs(f.spin)<.4&&f.rest>.18){f.vx=f.vy=f.spin=0;f.sleeping=true;}}else f.rest=0;
  if(f.y<-65||f.x<-65||f.x>c.width+65){f.sleeping=true;f.y=-100;}
 }
}}
