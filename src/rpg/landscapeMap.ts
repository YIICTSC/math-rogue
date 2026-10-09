import type {World,Adventurer} from './engine';
import {landscapeEnvironment,landscapeColor,landscapeTree,landscapeRegion,legacyRegion,STRUCTURES} from './worldLandscape';
import {blockAt,solid,VOXEL_COLORS} from './voxel';
export const mapPosition=(p:Adventurer)=>({x:p.position3D?.x??p.x+.5,z:p.position3D?.z??p.y+.5});
/** Gateways join the old tile map without changing its save-array dimensions. */
export const landscapeGate=(_x:number,_z:number)=>false;
export const landscapePalette={forest:'#49734d',meadow:'#82a55d',wetland:'#628b73',alpine:'#83906a',rock:'#89888b',snow:'#e5edf1'};
export function drawLandscapeTile(c:CanvasRenderingContext2D,w:World,x:number,z:number,t:number,time:number){
 if(!landscapeRegion(x,z))return;
 const e=landscapeEnvironment(w.seed,x,z),px=x*t,pz=z*t;
 c.fillStyle=e.road||e.trail?'#b8a77e':e.water?'#377f95':landscapeColor(w.seed,x,z);c.fillRect(px,pz,t,t);
 c.fillStyle=`rgba(15,26,31,${(e.height%8)*.012})`;c.fillRect(px,pz,t,t);
 if(e.water){c.fillStyle='#a8d7da66';c.fillRect(px+(Math.floor(time/450)+x)%3*3,pz+t/2,t/2,1);if(e.road){c.fillStyle='#a9926e';c.fillRect(px,pz,t,t);c.fillStyle='#e0d0a2';c.fillRect(px,pz,t,2);}}

}
/** Draw props after every ground tile so adjoining cells cannot clip the canopy. */
export function drawLandscapeVegetation(c:CanvasRenderingContext2D,w:World,x:number,z:number,t:number){
 if(!landscapeRegion(x,z))return;const tree=landscapeTree(w.seed,x,z);if(!tree||blockAt(w,x,tree.base,z)!=='wood')return;
 const px=x*t,pz=z*t;c.fillStyle='#243e3644';c.beginPath();c.ellipse(px+t*.5,pz+t*.7,t*1.5,t*.65,0,0,Math.PI*2);c.fill();
 c.fillStyle='#74553e';c.fillRect(px+t*.4,pz+t*.2,t*.2,t*.7);
 if(blockAt(w,x,tree.base+tree.height,z)!=='leaves')return;
 c.fillStyle=tree.pine?'#315b46':'#477c48';c.beginPath();
 if(tree.pine){c.moveTo(px+t*.5,pz-t*1.8);c.lineTo(px+t*1.8,pz+t*.5);c.lineTo(px-t*.8,pz+t*.5);c.closePath();}else c.ellipse(px+t*.5,pz-t*.1,t*1.6,t*1.2,0,0,Math.PI*2);c.fill();
 c.fillStyle='#ffffff14';c.beginPath();c.ellipse(px+t*.1,pz-t*.5,t*.6,t*.4,-.2,0,Math.PI*2);c.fill();
}
export function drawLandscapeBuildings(c:CanvasRenderingContext2D,w:World,p:Adventurer,t:number,bounds:{minX:number;maxX:number;minY:number;maxY:number},label:(s:string)=>string=(s)=>s){
 const pos=mapPosition(p);
 for(const l of STRUCTURES){const x=l.x-l.width/2,z=l.z-l.depth/2;if(x>bounds.maxX||x+l.width<bounds.minX||z>bounds.maxY||z+l.depth<bounds.minY)continue;
 const inside=Math.abs(pos.x-l.x)<l.width/2&&Math.abs(pos.z-l.z)<l.depth/2;
 c.fillStyle=inside?'#b9a17c':l.kind==='castle'?'#657c98':l.kind==='temple'?'#538575':'#a76c56';c.fillRect(x*t,z*t,l.width*t,l.depth*t);
 c.strokeStyle='#d8ccb0';c.lineWidth=t*.7;c.strokeRect((x+.5)*t,(z+.5)*t,(l.width-1)*t,(l.depth-1)*t);
 c.fillStyle='#b8a77e';c.fillRect((l.x-2)*t,(z+l.depth-1)*t,4*t,2*t);
 if(inside){c.fillStyle='#877454';for(let i=0;i<6;i++)c.fillRect((x+l.width-4)*t,(z+l.depth-i-2)*t,3*t,t*.15);}
 c.fillStyle='#fff0c8';c.font=`${Math.max(6,t*.7)}px sans-serif`;c.textAlign='center';c.fillText(label(l.label),l.x*t,(z+2)*t);
 }
 // Show construction footprints, including excavated shafts; no alias into legacy tile indices.
 for(const [key,b] of Object.entries(w.voxels?.edits||{})){const [x,y,z]=key.split(',').map(Number);if(legacyRegion(x,z)||!landscapeRegion(x,z)||x<bounds.minX||x>bounds.maxX||z<bounds.minY||z>bounds.maxY)continue;const surface=landscapeEnvironment(w.seed,x,z).height;if(y<surface-1)continue;if(b&&solid(b)){c.fillStyle=VOXEL_COLORS[b];c.fillRect(x*t+1,z*t+1,t-2,t-2);}else if(!b&&y===surface-1){c.fillStyle='#37463c';c.fillRect(x*t+2,z*t+2,t-4,t-4);}}
}
