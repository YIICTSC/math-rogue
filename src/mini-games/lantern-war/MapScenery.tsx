import React,{useEffect,useRef} from 'react';
import {assetUrl} from '../../utils/assetPaths';
import type {Terrain} from './types';
const loaded=new Map<string,Promise<HTMLImageElement>>();
function image(path:string){let promise=loaded.get(path);if(!promise){promise=new Promise((resolve,reject)=>{const img=new Image();img.onload=()=>resolve(img);img.onerror=()=>reject(Error('Map artwork unavailable: '+path));img.src=assetUrl(path);});loaded.set(path,promise);}return promise;}
export const BATTLE_BACKDROPS=['meadow','bridge','forest','harbor','library','forest','meadow','library','forest','bridge','library','bridge','forest','library','harbor','meadow','library','final'];
export function battleBackground(chapter:number){return 'sprites/lantern-war/battle-bg-'+BATTLE_BACKDROPS[Math.max(0,Math.min(17,chapter))]+'.webp';}
function road(map:Terrain[][]){const queue=[{x:2,y:8,path:[] as string[]}],seen=new Set<string>();while(queue.length){const p=queue.shift()!,k=p.x+','+p.y;if(seen.has(k))continue;seen.add(k);if(p.x===9&&p.y===0)return new Set(p.path);for(const [dx,dy]of [[0,-1],[1,0],[0,1],[-1,0]]){const x=p.x+dx,y=p.y+dy,t=map[y]?.[x];if(t&&!['w','#','m'].includes(t))queue.push({x,y,path:[...p.path,x+','+y]});}}return new Set<string>();}
export function MapScenery({map,theme,chapter}:{map:Terrain[][];theme:number;chapter:number}){
 const canvas=useRef<HTMLCanvasElement>(null);
 const mapKey=map.map(row=>row.join('')).join('');
 useEffect(()=>{let cancelled=false;
 const palette=['meadow','woodland','citadel','astral'][theme]||'meadow';
 Promise.all([image('sprites/lantern-war/terrain-'+palette+'.webp'),image('sprites/lantern-war/map-props.webp')]).then(([tiles,props])=>{
 if(cancelled||!canvas.current)return;const ctx=canvas.current.getContext('2d');if(!ctx)return;
 const cell=128,paths=road(map);ctx.clearRect(0,0,1536,1280);ctx.imageSmoothingEnabled=true;
 const tile=(index:number,x:number,y:number)=>{const w=tiles.naturalWidth/4,h=tiles.naturalHeight/4;ctx.drawImage(tiles,index%4*w,Math.floor(index/4)*h,w,h,x*cell,y*cell,cell,cell);};
 const prop=(index:number,x:number,y:number,width:number,height=width)=>{const w=props.naturalWidth/4,h=props.naturalHeight/4;ctx.drawImage(props,index%4*w,Math.floor(index/4)*h,w,h,x-width/2,y-height,width,height);};
 for(let y=0;y<10;y++)for(let x=0;x<12;x++){
 const t=map[y][x],seed=(x*17+y*23+chapter*11)%19;
 let index=t==='f'?4:t==='m'?5:t==='w'?6:t==='#'?8:t==='b'?11:t==='h'?3:t==='t'?2:t==='g'?15:paths.has(x+','+y)?9:seed%3===0?1:0;
 if(theme===2&&t==='.')index=paths.has(x+','+y)?9:3;
 if(theme===3&&t==='.')index=paths.has(x+','+y)?15:14;
 tile(index,x,y);
 const shade=ctx.createLinearGradient(x*cell,y*cell,x*cell+cell,y*cell+cell);shade.addColorStop(0,'#fff8d10a');shade.addColorStop(1,'#102b2115');ctx.fillStyle=shade;ctx.fillRect(x*cell,y*cell,cell,cell);
 if(t==='w'){
 ctx.strokeStyle='#c1e7dc66';ctx.lineWidth=4;
 for(const [dx,dy]of [[0,-1],[1,0],[0,1],[-1,0]]){if(map[y+dy]?.[x+dx]&&map[y+dy][x+dx]!=='w'&&map[y+dy][x+dx]!=='b'){ctx.beginPath();if(dx===0){const yy=(y+(dy>0?1:0))*cell;ctx.moveTo(x*cell,yy);ctx.quadraticCurveTo(x*cell+cell*.5,yy+dy*9,(x+1)*cell,yy);}else{const xx=(x+(dx>0?1:0))*cell;ctx.moveTo(xx,y*cell);ctx.quadraticCurveTo(xx+dx*9,y*cell+cell*.5,xx,(y+1)*cell);}ctx.stroke();}}
 }
 }
 // Paint objects from north to south to retain the depth of the overhead art.
 for(let y=0;y<10;y++)for(let x=0;x<12;x++){
 const t=map[y][x],seed=(x*17+y*23+chapter*11)%19,cx=(x+.5)*cell,foot=(y+.94)*cell;
 if(t==='f'){const tree=theme===3?3:theme===1?(x+y)%3:seed%2;prop(tree,cx,foot,cell*1.45,cell*1.65);}
 if(t==='m')prop(4+seed%4,cx,foot,cell*1.35,cell*1.35);
 if(t==='#'&&seed%3===0)prop(12,cx,foot,cell*1.12,cell*1.6);
 if(t==='h')prop(x===2?8:10,cx,foot,cell*1.65,cell*1.75);
 if(t==='g'){const gateFoot=y===0?foot+cell:foot;prop(9,cx,gateFoot,cell*1.8,cell*2);prop(13,cx-cell*.6,gateFoot,cell*.45,cell*.7);prop(13,cx+cell*.6,gateFoot,cell*.45,cell*.7);}
 if(t==='t')prop(11,cx,foot,cell*1.3,cell*1.25);
 if(t==='.'&&!paths.has(x+','+y)&&seed%5===0)prop(theme===3?13:14,cx,foot,cell*.65,cell*.55);
 if(t==='.'&&seed%2===0&&[[1,0],[-1,0],[0,1],[0,-1]].some(([dx,dy])=>map[y+dy]?.[x+dx]==='w'))prop(15,cx,foot,cell*.9,cell*.65);
 }
 const vignette=ctx.createRadialGradient(768,640,300,768,640,1000);vignette.addColorStop(0,'#031a2200');vignette.addColorStop(1,'#031a2255');ctx.fillStyle=vignette;ctx.fillRect(0,0,1536,1280);
 }).catch(()=>{});return()=>{cancelled=true;};
 },[mapKey,theme,chapter]);
 return <canvas ref={canvas} className="lw-map-art" width={1536} height={1280} aria-hidden="true"/>;
}
