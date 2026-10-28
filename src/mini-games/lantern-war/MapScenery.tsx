import{bridgeRuns}from'./bridges';
import{terrainMask,terrainEdges}from'./terrainContours';
import{mainSite}from'./scenes';
import React,{useEffect,useRef} from 'react';
import {assetUrl} from '../../utils/assetPaths';
import type {Terrain} from './types';
const loaded=new Map<string,Promise<HTMLImageElement>>();
function image(path:string){let promise=loaded.get(path);if(!promise){promise=new Promise((resolve,reject)=>{const img=new Image();img.onload=()=>resolve(img);img.onerror=()=>reject(Error('Map artwork unavailable: '+path));img.src=assetUrl(path);});loaded.set(path,promise);}return promise;}
export function battleBackground(chapter:number){return 'sprites/lantern-war/'+mainSite(chapter).battleBackground+'.webp';}
function road(map:Terrain[][]){const queue=[{x:2,y:8,path:[] as string[]}],seen=new Set<string>();while(queue.length){const p=queue.shift()!,k=p.x+','+p.y;if(seen.has(k))continue;seen.add(k);if(p.x===9&&p.y===0)return new Set(['2,8',...p.path]);for(const [dx,dy]of [[0,-1],[1,0],[0,1],[-1,0]]){const x=p.x+dx,y=p.y+dy,t=map[y]?.[x];if(t&&!['w','#','m'].includes(t))queue.push({x,y,path:[...p.path,x+','+y]});}}return new Set<string>();}
export function MapScenery({map,theme,chapter}:{map:Terrain[][];theme:number;chapter:number}){
 const canvas=useRef<HTMLCanvasElement>(null);
 const mapKey=map.map(row=>row.join('')).join('');
 useEffect(()=>{let cancelled=false;if(canvas.current)canvas.current.dataset.sceneReady='false';
 const scene=mainSite(chapter);theme=scene.theme;const climate=scene.climate;
 const palette=['meadow','woodland','citadel','astral'][theme]||'meadow';
 Promise.all([image('sprites/lantern-war/terrain-'+palette+'.webp'),image('sprites/lantern-war/map-props.webp'),image('sprites/lantern-war/terrain-boundaries.webp'),image('sprites/lantern-war/bridge-parts.webp'),image('sprites/lantern-war/connected-terrain.webp'),climate==='default'?Promise.resolve(null):image('sprites/lantern-war/regional-terrain.webp')]).then(([tiles,props,boundaries,bridges,connections,regional])=>{
 if(cancelled||!canvas.current)return;const ctx=canvas.current.getContext('2d');if(!ctx)return;
 const riverMap=map.map((row,y)=>row.map((t,x)=>t==='b'&&![[1,0],[-1,0],[0,1],[0,-1]].some(([dx,dy])=>map[y+dy]?.[x+dx]==='w')?'.':t));
 const cell=128,paths=road(map);for(let y=0;y<map.length;y++)for(let x=0;x<map[y].length;x++)if(map[y][x]==='r')paths.add(x+','+y);ctx.clearRect(0,0,1536,1280);ctx.imageSmoothingEnabled=true;
 // Feathered periodic overlaps remove hard edges without mirrored reflection lines.
 const connectedPattern=(column:number,row:number)=>{const patch=document.createElement('canvas');patch.width=patch.height=128;const p=patch.getContext('2d')!;p.drawImage(connections,column*connections.naturalWidth/4,row*connections.naturalHeight/2,connections.naturalWidth/4,connections.naturalHeight/2,0,0,128,128);p.globalCompositeOperation='destination-in';for(const horizontal of [true,false]){const fade=p.createLinearGradient(0,0,horizontal?128:0,horizontal?0:128);fade.addColorStop(0,'#fff0');fade.addColorStop(.25,'#fff');fade.addColorStop(.75,'#fff');fade.addColorStop(1,'#fff0');p.fillStyle=fade;p.fillRect(0,0,128,128);}const c=document.createElement('canvas');c.width=c.height=96;const q=c.getContext('2d')!;q.globalCompositeOperation='lighter';for(const y of [-96,0,96])for(const x of [-96,0,96])q.drawImage(patch,x,y);return ctx.createPattern(c,'repeat')!;};
 const paving=connectedPattern(2,0),water=connectedPattern(3,0);
 const tile=(index:number,x:number,y:number)=>{const w=tiles.naturalWidth/4,h=tiles.naturalHeight/4;ctx.drawImage(tiles,index%4*w,Math.floor(index/4)*h,w,h,x*cell,y*cell,cell,cell);};
 const prop=(index:number,x:number,y:number,width:number,height=width)=>{const w=props.naturalWidth/4,h=props.naturalHeight/4;ctx.save();if(climate==='snow')ctx.filter='saturate(.22) brightness(1.5)';if(climate==='marsh')ctx.filter='hue-rotate(220deg) saturate(.7)';ctx.drawImage(props,index%4*w,Math.floor(index/4)*h,w,h,x-width/2,y-height,width,height);ctx.restore();};
 for(let y=0;y<10;y++)for(let x=0;x<12;x++){
 const t=map[y][x],seed=(x*17+y*23+chapter*11)%19;
 let index=t==='f'?4:t==='m'?5:t==='w'?6:t==='#'?8:t==='b'?0:t==='h'?3:t==='t'?2:t==='g'?15:0;
 if(theme===2&&(t==='.'||t==='r'))index=3;
 if(theme===3&&(t==='.'||t==='r'))index=14;
 const row=({snow:0,drydock:1,canal:2,marsh:3} as Record<string,number>)[climate];
 const regionalCell=(column:number)=>{if(regional){ctx.save();ctx.translate((x+(x%2))*cell,(y+(y%2))*cell);ctx.scale(x%2?-1:1,y%2?-1:1);ctx.drawImage(regional,column*regional.naturalWidth/4,row*regional.naturalHeight/4,regional.naturalWidth/4,regional.naturalHeight/4,0,0,cell,cell);ctx.restore();}};
 const wet=riverMap[y][x]==='w'||riverMap[y][x]==='b',rock=t==='m'||t==='#';
 if(wet||rock){if(regional)regionalCell(0);else tile(theme===2?3:0,x,y);ctx.save();ctx.clip(terrainMask(wet?riverMap:map,x,y,wet?['w','b']:t==='m'?['m']:['#']), 'evenodd');}
 if(wet||rock){ctx.save();if(climate==='snow')ctx.filter='saturate(.35) brightness(1.3)';if(climate==='marsh')ctx.filter='hue-rotate(50deg) brightness(.7)';ctx.fillStyle=wet?water:paving;ctx.fillRect(x*cell,y*cell,cell,cell);ctx.restore();}else if(regional)regionalCell(0);else tile(index,x,y);
 if(wet||rock)ctx.restore();




 }
 // One continuous road stroke joins cells and corners without square tile caps.
 const route=new Path2D();for(const key of paths){const [x,y]=key.split(',').map(Number);if(['w','b','m','#'].includes(map[y]?.[x]))continue;for(const [dx,dy]of [[1,0],[-1,0],[0,1],[0,-1]])if(paths.has((x+dx)+','+(y+dy))&&!['w','m','#'].includes(map[y+dy]?.[x+dx])){const reach=map[y+dy]?.[x+dx]==='b'?.5:1;route.moveTo((x+.5)*cell,(y+.5)*cell);route.lineTo((x+dx*reach+.5)*cell,(y+dy*reach+.5)*cell);}}
 ctx.save();ctx.lineCap='round';ctx.lineJoin='round';ctx.strokeStyle='#584c3d60';ctx.lineWidth=cell*.57;ctx.stroke(route);ctx.strokeStyle=paving;ctx.lineWidth=cell*.48;ctx.stroke(route);ctx.restore();
 // Shared bank/cliff textures are stroked only on exposed edges, including concave corners.
 const bankRow=climate==='snow'?1:climate==='drydock'?2:climate==='canal'?3:climate==='marsh'?4:theme>=2?5:0;
 const pattern=(column:number)=>{const c=document.createElement('canvas');c.width=c.height=128;const p=c.getContext('2d')!;p.drawImage(boundaries,column*boundaries.naturalWidth/4,bankRow*boundaries.naturalHeight/6,boundaries.naturalWidth/4,boundaries.naturalHeight/6,0,0,128,128);return ctx.createPattern(c,'repeat')!;};
 const shore=pattern(climate==='canal'?1:0),cliff=pattern(2);
 for(let y=0;y<10;y++)for(let x=0;x<12;x++){const t=map[y][x];if(!['w','b','m','#'].includes(t))continue;const wet=riverMap[y][x]==='w'||riverMap[y][x]==='b';if(t==='b'&&!wet)continue;const path=terrainEdges(wet?riverMap:map,x,y,wet?['w','b']:t==='m'?['m']:['#']);ctx.save();ctx.lineCap='round';ctx.lineJoin='round';ctx.strokeStyle=wet?'#283e3f99':'#18272c99';ctx.lineWidth=15;ctx.stroke(path);ctx.strokeStyle=wet?shore:cliff;ctx.lineWidth=11;ctx.stroke(path);ctx.lineWidth=1.4;ctx.strokeStyle=wet&&climate!=='drydock'?'#d2e9d799':'#b0a68a77';ctx.stroke(path);ctx.restore();}
 // Bridge decks are a separate connected layer, above banks: no bank crosses the walking surface.
 const bw=bridges.naturalWidth/3,bh=bridges.naturalHeight/2;
 for(const part of bridgeRuns(map)){
 const across=(part.horizontal?part.height:part.width)*cell,along=(part.horizontal?part.width:part.height)*cell;
 ctx.save();ctx.translate((part.x+part.width/2)*cell,(part.y+part.height/2)*cell);if(part.horizontal)ctx.rotate(-Math.PI/2);
 ctx.beginPath();ctx.rect(-across*.45,-along*.5,across*.9,along);ctx.clip();
 const piece=(column:number,at:number)=>ctx.drawImage(bridges,column*bw+bw*.2,0,bw*.64,bh,-across*.45,at,across*.9,cell);
 for(let n=0;n<along/cell;n++)piece(0,-along*.5+n*cell);
 for(const [active,column,north]of [[part.start,1,true],[part.end,2,false]] as const)if(active){
 const cap=document.createElement('canvas');cap.width=cap.height=128;const p=cap.getContext('2d')!;p.drawImage(bridges,column*bw+bw*.2,0,bw*.64,bh,0,0,128,128);p.globalCompositeOperation='destination-in';const fade=p.createLinearGradient(0,0,0,128);fade.addColorStop(0,north?'#fff':'#fff0');fade.addColorStop(.3,north?'#fff':'#fff0');fade.addColorStop(.7,north?'#fff0':'#fff');fade.addColorStop(1,north?'#fff0':'#fff');p.fillStyle=fade;p.fillRect(0,0,128,128);ctx.drawImage(cap,-across*.45,north?-along*.5:along*.5-cell,across*.9,cell);
 }
 ctx.restore();}
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
 if(chapter===15){ctx.fillStyle='#071b4a77';ctx.fillRect(0,0,1536,1280);}
 const vignette=ctx.createRadialGradient(768,640,300,768,640,1000);vignette.addColorStop(0,'#031a2200');vignette.addColorStop(1,'#031a2255');ctx.fillStyle=vignette;ctx.fillRect(0,0,1536,1280);canvas.current.dataset.sceneReady='true';canvas.current.dataset.climate=climate;
 }).catch(()=>{});return()=>{cancelled=true;};
 },[mapKey,theme,chapter]);
 return <canvas ref={canvas} className="lw-map-art" width={1536} height={1280} aria-hidden="true"/>;
}
