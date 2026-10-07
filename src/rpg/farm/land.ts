import type {FarmPlayer,FarmPlot} from './model';
export function plotPosition(f:FarmPlayer,p:FarmPlot):{x:number;y:number}|undefined{
 if(p.x!==undefined&&p.y!==undefined)return {x:p.x,y:p.y};
 if(f.spatialVersion!==2&&f.x!==undefined&&f.y!==undefined)return {x:f.x+p.slot%6,y:f.y+1+Math.floor(p.slot/6)};
}
export function migrateLand(f:FarmPlayer){if(f.spatialVersion===2)return;for(const p of f.plots){const xy=plotPosition(f,p);if(xy)Object.assign(p,xy);}f.spatialVersion=2;}
