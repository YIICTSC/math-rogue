import { battleActionForActor, drawBattleActor } from './battleActionArt';
import generatedArt from './generatedHeroArt.json';
import { drawJobPixels, jobPixelColors } from './jobPixelArt';
import { drawGuestSprite } from './guestArt';
import { drawStudentSprite } from '../../components/school-dungeon/student/sprites';
import { assetUrl } from '../../utils/assetPaths';
import { HEROES, JOBS, ELEMENT_COLOR, type Hero, type Job } from './catalog';
import { type Climate } from './campaign';
import { TOWN_SHOPS } from './towns';
import { activeTile, visible, worldSymbol, type Adventure } from './adventure';
import { OFFSETS, Tile, WORLD_ID, area, climateAt, noise, same, tileAt, type Direction, type Landmark, type Point } from './world';
import type { ActionCue, Battle, Enemy, Pulse } from './battle';

type Canvas = CanvasRenderingContext2D;
type Palette={grass:string; vegetation:string; shade:string; highlight:string; water:string; foam:string; path:string; stone:string; wall:string; roof:string; sky:string};
const palettes:Record<Climate,Palette>={
  meadow:{grass:'#527f57',vegetation:'#649d60',shade:'#304d45',highlight:'#a7be71',water:'#327584',foam:'#88c7c4',path:'#ad9264',stone:'#838080',wall:'#444f52',roof:'#925454',sky:'#7fa69f'},
  machine:{grass:'#7b8251',vegetation:'#8f9b64',shade:'#455744',highlight:'#c8bd76',water:'#397477',foam:'#a5d6c3',path:'#aa8963',stone:'#989381',wall:'#505653',roof:'#667684',sky:'#c4b18a'},
  crystal:{grass:'#52786d',vegetation:'#6b9790',shade:'#394258',highlight:'#89bdad',water:'#516e9b',foam:'#b3d7ea',path:'#a69c88',stone:'#7d79a6',wall:'#494b77',roof:'#7f609e',sky:'#9796cc'},
  tide:{grass:'#6f986a',vegetation:'#73af86',shade:'#37645d',highlight:'#adcb8e',water:'#267a8e',foam:'#b0e3d5',path:'#bf9f6e',stone:'#72968f',wall:'#37636f',roof:'#9d5d55',sky:'#72bcc4'},
  sky:{grass:'#8ab7ab',vegetation:'#a1c3a8',shade:'#52799c',highlight:'#e2d9a1',water:'#6c9fc0',foam:'#d6eff6',path:'#cbc5a4',stone:'#a5b0ce',wall:'#526c8d',roof:'#627baf',sky:'#97c5e8'},
  ruin:{grass:'#77746c',vegetation:'#938279',shade:'#4c4958',highlight:'#b5a192',water:'#535673',foam:'#a697c6',path:'#b39579',stone:'#797087',wall:'#453b56',roof:'#736079',sky:'#968191'},
  night:{grass:'#516277',vegetation:'#627998',shade:'#333a60',highlight:'#a6a1cb',water:'#42578b',foam:'#9ba5e5',path:'#877d9f',stone:'#6c71aa',wall:'#383a68',roof:'#695685',sky:'#575d9c'},
};
const screen=(w:number,h:number)=>{
  const canvas=document.createElement('canvas');canvas.width=w;canvas.height=h;
  const ctx=canvas.getContext('2d')!;ctx.imageSmoothingEnabled=false;
  return ctx;
};
const box=(c:Canvas,color:string,x:number,y:number,w:number,h:number)=>{c.fillStyle=color;c.fillRect(Math.round(x),Math.round(y),w,h);};
function polygon(c:Canvas,color:string,vertices:number[]){
  // Scan conversion keeps every edge on the native pixel grid.
  let min=Infinity,max=-Infinity;
  for(let i=1;i<vertices.length;i+=2){min=Math.min(min,vertices[i]);max=Math.max(max,vertices[i]);}
  for(let y=Math.floor(min);y<max;y++){
    const edges:number[]=[];
    for(let i=0;i<vertices.length;i+=2){
      const j=(i+2)%vertices.length,y1=vertices[i+1],y2=vertices[j+1];
      if((y1>y+.5)!==(y2>y+.5))edges.push(vertices[i]+(y+.5-y1)*(vertices[j]-vertices[i])/(y2-y1));
    }
    edges.sort((a,b)=>a-b);
    for(let i=0;i+1<edges.length;i+=2)box(c,color,Math.floor(edges[i]),y,Math.max(1,Math.ceil(edges[i+1])-Math.floor(edges[i])),1);
  }
}
const ellipse=(c:Canvas,color:string,x:number,y:number,rx:number,ry:number)=>{
  for(let dy=-ry;dy<=ry;dy++){
    const dx=Math.round(Math.sqrt(Math.max(0,1-(dy/ry)**2))*rx);
    box(c,color,x-dx,y+dy,2*dx+1,1);
  }
};
const mix=(a:string,b:string,t:number)=>{
  const number=(s:string,n:number)=>parseInt(s.slice(n,n+2),16);
  return '#' + [1,3,5].map(n=>Math.round(number(a,n)+(number(b,n)-number(a,n))*t).toString(16).padStart(2,'0')).join('');
};
const INK='#232438';
const tiles=new Map<string,HTMLCanvasElement>();
function texture(tile:Tile,b:Climate,variant:number,mask:number){
  const k=`${tile}:${b}:${variant}:${mask}`;
  const cached=tiles.get(k);if(cached)return cached;
  const c=screen(16,16),p=palettes[b];
  const grass=[Tile.Grass,Tile.Flowers,Tile.Forest,Tile.Hill,Tile.Rock].includes(tile);
  const water=[Tile.Water,Tile.Shallow,Tile.Sea,Tile.Deep,Tile.Waterfall].includes(tile);
  let base=grass?p.grass:water?mix(p.water,'#16274b',tile===Tile.Deep?.42:tile===Tile.Sea?.15:0):
    tile===Tile.Sand?mix(p.path,'#dfcfa0',.5):tile===Tile.Path?p.path:tile===Tile.Wood||tile===Tile.Bridge?'#866b51':
      tile===Tile.Carpet?p.roof:tile===Tile.Ice?mix(p.water,'#daeef3',.47):tile===Tile.Void?'#132132':p.stone;
  if(tile===Tile.Cave||tile===Tile.Wall||tile===Tile.Hidden||tile===Tile.Trap)base=mix(p.stone,p.wall,tile===Tile.Cave?.49:.86);
  box(c,base,0,0,16,16);
  for(let i=0;i<(water?5:23);i++){
    const x=Math.floor(noise(i,variant,12)*16), y=Math.floor(noise(i,variant,31)*16);
    const n=noise(i,variant,7);
    const shade=mix(base,n>.51?(grass?p.highlight:water?p.foam:'#f1dcb0'):(grass?p.shade:'#1f263a'),n>.86?.29:.13);
    box(c,shade,x,y,n>.6?Math.min(water?5:3,16-x):1,1);
  }
  if(grass){
    for(let i=0;i<3;i++){
      const x=3+Math.floor(noise(i,variant,81)*10),y=3+Math.floor(noise(i,variant,96)*11);
      box(c,p.vegetation,x,y-1,1,2);box(c,mix(base,p.shade,.22),x+1,y,2,1);
      if(tile===Tile.Flowers){box(c,variant%2?'#efb3aa':'#e0cf8a',x,y-2,2,1);box(c,'#f1dcb0',x+1,y-3,1,1);}
    }
  }
  if(tile===Tile.Path || tile===Tile.Sand){
    // Small irregular banks connect paths and coastlines to adjacent ground.
    for(let side=0;side<4;side++)if(!(mask&(1<<side))){
      for(let i=0;i<16;i++){
        const n=noise(i,variant,side+24);
        const swatch=mix(base,tile===Tile.Path?p.grass:p.water,.4+n*.4);
        if(side===0)box(c,swatch,i,0,1,1+Math.floor(n*2));
        if(side===1)box(c,swatch,15-Math.floor(n*2),i,1+Math.floor(n*2),1);
        if(side===2)box(c,swatch,i,15-Math.floor(n*2),1,1+Math.floor(n*2));
        if(side===3)box(c,swatch,0,i,1+Math.floor(n*2),1);
      }
    }
  }
  if(tile===Tile.Wood||tile===Tile.Bridge){
    for(let y=0;y<16;y+=4){box(c,'#554534',0,y,16,1);box(c,'#a68b66',0,y+1,16,1);box(c,'#6e5741',(y*3+variant)%16,y,1,4);}
    if(tile===Tile.Bridge){box(c,'#513e34',0,0,2,16);box(c,'#a78c65',14,0,2,16);}
  }
  if(tile===Tile.Carpet){box(c,mix(base,'#f6d197',.45),1,1,14,1);box(c,mix(base,'#211e2e',.34),1,14,14,1);}
  if(tile===Tile.Stone||tile===Tile.Wall||tile===Tile.Hidden){
    for(let y=0;y<16;y+=5){
      box(c,mix(base,'#211e29',.48),0,y,16,1);
      box(c,mix(base,'#b9b3ab',.24),0,y+1,16,1);
      box(c,mix(base,'#252d3a',.43),(2+y*3)%15,y,1,5);
    }
    if((mask&4)===0&&tile!==Tile.Stone){box(c,mix(base,'#182436',.53),0,11,16,5);box(c,mix(base,'#b7bfaa',.19),0,11,16,1);}
  }
  if(tile===Tile.Ice){
    polygon(c,'#b7dfea',[1,6,7,4,10,2,8,5,5,7,2,10]);box(c,'#e0edf1',12,10,3,1);
  }
  if(tile===Tile.Rotor){
    ellipse(c,'#544b61',8,8,7,6);ellipse(c,'#ac8f77',8,7,5,4);
    polygon(c,'#433e58',[6,5,13,6,11,8,5,9,7,7]);
  }
  if(tile===Tile.Trap){ellipse(c,'#2b202e',8,8,5,3);box(c,'#987351',3,6,10,1);}
  tiles.set(k,c.canvas);
  return c.canvas;
}
function tree(c:Canvas,x:number,y:number,p:Palette,seed:number,wind=0){
  const dx=wind, crown=mix(p.shade,p.grass,.25);
  ellipse(c,'#263c3a',x+7,y+9,8,2);
  box(c,'#453b35',x+6,y-1,3,11);box(c,'#957856',x+6,y-1,1,9);
  polygon(c,INK,[x+3+dx,y-18,x+12+dx,y-15,x+16+dx,y-9,x+17+dx,y-3,x+13+dx,y+2,x+2+dx,y+2,x-3+dx,y-3,x-3+dx,y-10]);
  ellipse(c,crown,x+7+dx,y-7,9,7);
  ellipse(c,p.vegetation,x+5+dx,y-10,6,6);
  ellipse(c,mix(p.vegetation,p.highlight,.36),x+4+dx,y-13,5,3);
  for(let i=0;i<8;i++){
    const xx=x-1+dx+Math.floor(noise(seed,i,3)*13),yy=y-13+Math.floor(noise(seed,i,7)*11);
    box(c,i%3?mix(p.grass,p.vegetation,.47):p.highlight,xx,yy,2,1);
  }
}
function crag(c:Canvas,x:number,y:number,p:Palette,small=false){
  const height=small?8:15;
  polygon(c,INK,[x-2,y+13,x+1,y+7,x+5,y+12-height,x+12,y+9-height,x+17,y+10,x+15,y+14]);
  polygon(c,p.stone,[x-1,y+12,x+2,y+7,x+6,y+13-height,x+11,y+9-height,x+15,y+10,x+13,y+13]);
  polygon(c,mix(p.stone,p.wall,.55),[x+6,y+13-height,x+9,y+6,x+8,y+13,x+14,y+12,x+15,y+10,x+11,y+9-height]);
  box(c,mix(p.stone,'#f1e5c9',.32),x+3,y+9,3,1);
}
function building(c:Canvas,x:number,y:number,p:Palette,small=false,kind=0){
  const w=small?22:75,h=small?18:45,left=Math.round(x-w/2),top=y-h;
  const roof=kind===1||kind===4?mix(p.roof,p.wall,.3):p.roof;
  ellipse(c,mix(p.wall,p.shade,.55),x,y,w/2+3,3);
  box(c,'#293142',left,top+4,w,h-2);
  box(c,mix(p.path,'#f2d7aa',.28),left+2,top+6,w-4,h-6);
  const plaster=mix(p.stone,'#ead5a4',.35);
  for(let i=5;i<w-6;i+=small?6:10){box(c,plaster,left+i,top+h-7,4,1);box(c,plaster,left+i-2,top+h-3,3,1);}
  polygon(c,INK,[left-3,top+5,x-2,top-12,x+4,top-12,left+w+3,top+5,left+w+2,top+8,left-2,top+8]);
  polygon(c,roof,[left-1,top+4,x-1,top-10,x+3,top-10,left+w+1,top+4,left+w,top+6,left,top+6]);
  for(let i=0;i<5;i++){const y2=top-6+i*3,w2=(i+1)*(small?4:11);box(c,mix(roof,p.path,.15),x-w2/2,y2,w2,1);}
  const door=small?5:11;
  box(c,'#373944',x-door/2,top+h-9,door,10);
  box(c,'#9f7452',x-door/2+1,top+h-8,door-2,9);
  box(c,'#fad994',x+1,top+h-5,1,1);
  for(const dir of [-1,1]){
    const around=Math.round(x+dir*w*.29-(small?2:4));
    box(c,'#383943',around,top+10,small?4:8,small?4:9);
    box(c,'#cbbc80',around+1,top+11,small?2:6,small?2:6);
    if(!small){box(c,'#70654b',around+4,top+11,1,7);box(c,'#70654b',around+1,top+13,6,1);}
  }
  if(!small){box(c,'#64646c',left+w-15,top-9,6,12);box(c,'#b4968d',left+w-16,top-10,8,2);}
}
let shopSignAtlas:HTMLImageElement|undefined;
function prop(c:Canvas,l:Landmark,x:number,y:number,p:Palette,t:number){
  if(l.kind==='site'){
    if(l.variant===0||l.variant===3)building(c,x,y+5,p,true,l.variant);
    else if(l.variant===4){crag(c,x-7,y-7,p);polygon(c,INK,[x-6,y+6,x-4,y,x,y-4,x+4,y,x+6,y+6]);box(c,'#f2c985',x-1,y+3,2,1);}
    else if(l.variant===1)tree(c,x-7,y-5,p,Math.floor(x),0);
    else {box(c,p.stone,x-7,y-7,14,13);box(c,p.highlight,x-5,y-9,10,2);box(c,p.shade,x-3,y-4,6,10);}
    return;
  }
  if(l.kind==='door'){
    building(c,x,y+7,p,false,l.variant);
    if(l.service){
      const sign=TOWN_SHOPS.indexOf(l.service);
      if(!shopSignAtlas){shopSignAtlas=new Image();shopSignAtlas.src=assetUrl('sprites/pixel-rpg/town/signs.webp');}
      if(shopSignAtlas.complete&&shopSignAtlas.naturalWidth){
        const w=shopSignAtlas.naturalWidth/5,h=shopSignAtlas.naturalHeight/2;
        c.drawImage(shopSignAtlas,sign%5*w,Math.floor(sign/5)*h,w,h,x+8,y-26,21,21);
      }
    }
    return;
  }
  if(l.kind==='rock'){crag(c,x-8,y-8,p,true);return;}
  if(l.kind==='chest'||l.kind==='seal'||l.kind==='secret'){
    if(l.kind==='secret'&&l.id.endsWith(':passage')){
      polygon(c,'#baa39b',[x-2,y-7,x,y-4,x-1,y-2,x+2,y+1,x+1,y+3,x+4,y+6,x+1,y+5,x-2,y]);
      return;
    }
    const locked=l.kind==='seal',wood=locked?'#68689f':'#9d5944';
    box(c,INK,x-6,y-5,12,10);box(c,wood,x-5,y-4,10,7);
    box(c,mix(wood,'#ffe8af',.43),x-6,y-3,12,2);box(c,'#edc67c',x-1,y-1,3,3);
    if(locked&&(Math.floor(t/180)%4===0)){box(c,'#fdf3aa',x+6,y-9,1,5);box(c,'#fdf3aa',x+4,y-7,5,1);}
    return;
  }
  if(l.kind==='camp'){box(c,INK,x-2,y-3,4,11);ellipse(c,'#de9653',x,y-5,3,4);box(c,'#fff2b9',x-1,y-8,2,4);return;}
  if(l.kind==='sign'){box(c,'#503d34',x-1,y-2,2,10);box(c,'#805a40',x-6,y-6,12,7);box(c,'#cfaf7e',x-5,y-5,9,1);box(c,'#bf9661',x-4,y-2,7,1);return;}
  if(l.kind==='exit'||l.kind==='stairs'||l.kind==='shortcut'||l.kind==='gate'){
    const shade=l.kind==='gate'?p.roof:l.kind==='shortcut'?'#958eca':p.stone;
    if(l.kind==='gate') {box(c,INK,x-6,y-13,12,20);box(c,shade,x-5,y-12,10,18);box(c,'#c79d69',x+2,y-2,2,2);return;}
    for(let i=0;i<4;i++){box(c,mix(shade,INK,.10+i*.11),x-5-i,y-4+i*3,10+i*2,3);box(c,mix(shade,'#f3e4b2',.34),x-5-i,y-4+i*3,10+i*2,1);}
    return;
  }
  if(l.kind==='feature'||l.kind==='plate'||l.kind==='trial'){
    ellipse(c,p.shade,x,y+3,6,4);ellipse(c,p.highlight,x,y+1,5,3);ellipse(c,p.wall,x,y,4,2);
    box(c,l.kind==='plate'?p.shade:'#e0d392',x-1,y-2,3,4);return;
  }
  if(l.kind==='enemy'||l.kind==='boss'){
    const bob=Math.floor(Math.sin(t*.005+l.x)*1.9);
    ellipse(c,'#59334e',x,y+6,5,2);ellipse(c,'#40334c',x,y+bob,6,6);ellipse(c,'#a06177',x-1,y-2+bob,4,4);
    box(c,'#ffd095',x-2,y-1+bob,2,2);box(c,'#ffd095',x+2,y-1+bob,2,2);
    return;
  }
  const coatColors=['#82a6a6','#bd9e76','#a79bb9','#82996a','#bd887e','#8fa1cc'];
  const coat=l.npc?coatColors[l.npc.name[1].charCodeAt(0)%coatColors.length]:l.kind==='keeper'?'#ae8a62':l.kind==='service'?'#7b9fa0':'#a38eaa';
  const bob=Math.floor(t/650)%2;
  ellipse(c,'#353b44',x,y+7,6,2);
  polygon(c,INK,[x-4,y-4,x+4,y-4,x+6,y+1,x+5,y+7,x-5,y+7,x-6,y+1]);
  box(c,coat,x-4,y-2,8,8);
  ellipse(c,INK,x,y-8+bob,5,5);ellipse(c,'#c9a180',x,y-7+bob,4,4);
  box(c,'#615359',x-4,y-11+bob,8,3);box(c,'#ede0ae',x-4,y-11+bob,7,1);
  box(c,INK,x-2,y-7+bob,1,1);box(c,INK,x+2,y-7+bob,1,1);
}

export type Pose='idle'|'walk'|'dash'|'attack'|'card'|'cast'|'guard'|'hit'|'weak'|'fallen'|'heal'|'limit'|'win'|'joy'|'surprise'|'sad';
const spriteCache=new Map<string,HTMLCanvasElement>();
function pixelHero(hero:Hero,job:Job,dir:Direction,pose:Pose,frame:number){
  const key=`${hero.id}:${job.id}:${dir}:${pose}:${frame}`;
  const old=spriteCache.get(key);if(old)return old;
  const c=screen(38,48),[coat,gold]=jobPixelColors(job.id);
  const hair=hero.hairColor,lights=mix(hair,'#e2c7a7',.23),darker=mix(hair,INK,.38);
  const skin=hero.origin==='elementary'?'#ebbf96':'#e8bca3',shadow='#b38377';
  const left=dir==='left',side=left||dir==='right',back=dir==='up',right=dir==='right';
  if(left){c.translate(38,0);c.scale(-1,1);}
  const swinging=pose==='walk'||pose==='dash';
  const forward=pose==='attack'||pose==='card'||pose==='limit';
  const high=pose==='cast'||pose==='heal'||pose==='joy'||pose==='win'||pose==='surprise';
  const lowered=pose==='weak'||pose==='sad'||pose==='guard';
  const step=swinging?[0,3,0,-3][frame]:0;
  if(pose==='fallen'){c.translate(34,42);c.rotate(-Math.PI/2);c.translate(-18,-33);}
  if(pose==='hit') c.translate(frame%2?1:-1,0);
  const bob=lowered?3:swinging&&frame%2===1?-1:high&&frame%2===1?-2:0;
  const child=hero.origin==='elementary'?1:0;
  const y=bob+child+(pose==='dash'?1:0),ox=forward?frame:0;
  const shirt=mix(coat,hero.color,.12),bright=mix(shirt,gold,.36),dark=mix(shirt,INK,.4);
  const pants=job.outfit==='robe'||hero.hair==='wave'?dark:'#343047';
  for(let leg=0;leg<2;leg++){
    const x=12+leg*8+(side?leg*step:0),e=leg?step:-step;
    polygon(c,INK,[x-1,30+y,x+5,30+y,x+6,39+e+y,x+6,44+e+y,x-2,44+e+y,x-2,40+e+y]);
    box(c,pants,x,35+e+y,5,5);box(c,'#6f6070',x,40+e+y,5,1);box(c,'#473a42',x-1,42+e+y,7,2);
  }
  const center=18+ox;
  if(job.outfit==='robe'||job.outfit==='cloak'||hero.hair==='long'||hero.hair==='braid'||hero.hair==='pony'){
    polygon(c,INK,[center-6,12+y,center+5,12+y,center+10,29+y,center+10,38+y,center-10,39+y,center-9,29+y]);
    polygon(c,job.outfit==='robe'?shirt:dark,[center-5,14+y,center+5,14+y,center+8,31+y,center+8,37+y,center-8,37+y,center-7,27+y]);
    box(c,bright,center-6,32+y,2,4);
  }
  const cut=job.outfit==='armor'?1:0;
  polygon(c,INK,[center-7-cut,18+y,center+6+cut,18+y,center+9,25+y,center+7,36+y,center-7,36+y,center-10,25+y]);
  polygon(c,shirt,[center-7-cut,20+y,center+6+cut,20+y,center+7,25+y,center+6,34+y,center-6,34+y,center-8,24+y]);
  box(c,bright,center-5,22+y,4,9);box(c,gold,center-6,32+y,12,2);box(c,'#f3c98c',center,31+y,2,3);
  if(job.outfit==='armor'){box(c,gold,center-8,20+y,4,5);box(c,gold,center+4,20+y,4,5);box(c,bright,center-4,24+y,9,2);}
  if(job.outfit==='vest'){box(c,dark,center-4,22+y,8,9);box(c,gold,center+3,24+y,1,6);}
  if(job.outfit==='scarf'||hero.token==='scarf'){box(c,hero.color,center-7,18+y,13,3);box(c,hero.color,center-7,20+y,3,8);}
  if(job.outfit==='tunic'||job.outfit==='cloak'){box(c,gold,center-1,22+y,2,5);box(c,dark,center+3,26+y,2,5);}
  if(!back&&hero.token==='crest'){box(c,'#dcaf6c',center+3,23+y,3,3);box(c,'#fff2b7',center+4,23+y,1,2);}
  for(const sideArm of [-1,1]){
    const gesture=high?-4+frame:forward&&sideArm===1?-5:lowered?1:0;
    const xa=center+sideArm*(side&&sideArm<0?5:8)+(forward&&sideArm>0?3+frame:0);
    const ya=24+y+gesture+(swinging?sideArm*step:0);
    box(c,INK,xa-2,ya,4,8);box(c,bright,xa-1,ya,2,5);box(c,skin,xa-1,ya+5,2,2);
  }
  drawJobPixels(c,job.id,27+ox,y,center,back,forward||pose==='cast'||pose==='guard');
  const hx=center+(side?1:0);
  if(['long','braid','pony','wave'].includes(hero.hair)){
    const width=hero.hair==='pony'?4:5;
    polygon(c,INK,[hx-9,8+y,hx-3,7+y,hx+8,9+y,hx+9,20+y,hx+6,27+y,hx-7,25+y,hx-11,18+y]);
    box(c,darker,hx-9,12+y,width,10);box(c,hair,hx-8,12+y,2,11);
    if(hero.hair==='braid'||hero.hair==='pony'){box(c,INK,hx-11,9+y,5,13);box(c,lights,hx-10,10+y,3,9);box(c,hero.color,hx-9,9+y,2,2);}
  }
  polygon(c,INK,[hx-6,2+y,hx+3,1+y,hx+8,6+y,hx+8,14+y,hx+4,20+y,hx-4,20+y,hx-8,15+y,hx-8,7+y]);
  ellipse(c,back?hair:skin,hx+(side?1:0),12+y,7,7);
  if(!back){box(c,shadow,hx-3,17+y,7,2);box(c,'#f4caa4',hx-4,12+y,6,4);}
  const cap=hero.hair==='spike'?[hx-8,5+y,hx-5,y,hx,3+y,hx+3,y,hx+5,3+y,hx+8,6+y,hx+8,11+y,hx+1,9+y,hx-3,13+y,hx-8,13+y]
    :[hx-7,4+y,hx-3,1+y,hx+4,1+y,hx+8,5+y,hx+8,11+y,hx+1,9+y,hx-2,11+y,hx-8,13+y];
  polygon(c,darker,cap);
  polygon(c,hair,[hx-7,5+y,hx-4,3+y,hx+2,2+y,hx+6,5+y,hx+7,8+y,hx+3,7+y,hx-1,10+y,hx-7,12+y]);
  box(c,lights,hx-5,5+y,6,1);box(c,lights,hx-6,6+y,3,1);
  if(back){
    polygon(c,darker,[hx-8,8+y,hx+7,8+y,hx+7,15+y,hx+3,19+y,hx-5,18+y,hx-8,14+y]);
    box(c,hair,hx-5,8+y,9,6);box(c,lights,hx-4,9+y,4,1);
  }else{
    const sleepy=pose==='sad'||pose==='weak'||pose==='win'&&frame%2===1;
    const eye=pose==='surprise'?3:sleepy?1:2;
    box(c,'#fff5db',hx+(side?2:-5),12+y,3,2);
    box(c,INK,hx+(side?4:-3),12+y,1,eye);
    if(!side){box(c,'#fff5db',hx+1,12+y,3,2);box(c,INK,hx+2,12+y,1,eye);}
    box(c,pose==='surprise'?'#846079':'#9f7069',hx+(side?4:0),16+y,2,1);
  }
  drawJobPixels(c,job.id,0,y,hx,back,false,true);
  if(hero.hair==='buns'){
    ellipse(c,INK,hx-8,5+y,3,3);ellipse(c,INK,hx+8,5+y,3,3);
    ellipse(c,lights,hx-8,4+y,2,2);ellipse(c,lights,hx+8,4+y,2,2);
  }
  if(hero.token==='glasses'&&!back){box(c,'#41415a',hx-6+(side?7:0),11+y,side?6:12,1);box(c,'#baccca',hx+4,12+y,1,2);}
  if(hero.token==='band'||hero.token==='wrap'){box(c,hero.color,hx-8,8+y,15,2);box(c,'#e1c49b',hx-6,8+y,6,1);}
  if(hero.token==='star'||hero.token==='flower'||hero.token==='leaf'||hero.token==='ribbon'){
    const tint=hero.token==='star'?'#ffe08e':hero.token==='flower'?'#ffbad0':hero.token==='leaf'?'#a7e69a':hero.color;
    box(c,INK,hx-7,6+y,5,4);box(c,tint,hx-7,7+y,5,2);box(c,tint,hx-5,5+y,1,5);
  }
  if(hero.token==='headphones'){box(c,'#282a3f',hx-8,6+y,2,7);box(c,hero.color,hx-9,11+y,3,4);}
  if(hero.token==='cap'){box(c,hero.color,hx-7,3+y,14,3);box(c,mix(hero.color,'#f1d6ae',.45),hx-5,2+y,9,1);}
  if(forward||pose==='cast'){
    const x=26+(frame%3),wy=18+y-(frame%2);
    if(pose==='card'){box(c,INK,x,wy-6,7,10);box(c,'#ffe8ad',x+1,wy-5,5,8);box(c,hero.color,x+2,wy-3,3,3);}
    else if(job.outfit==='robe'||job.outfit==='cloak'||pose==='cast'){
      box(c,'#784f41',x+2,wy-7,2,18);ellipse(c,gold,x+3,wy-8,3,3);box(c,'#fff0be',x+2,wy-10,2,2);
    }else{
      polygon(c,INK,[x-1,wy+7,x+8,wy-8,x+9,wy-4,x+3,wy+8]);
      polygon(c,'#d7dddc',[x+1,wy+3,x+8,wy-7,x+8,wy-4,x+4,wy+4]);box(c,gold,x,wy+7,5,2);
    }
  }
  if(pose==='guard'){ellipse(c,INK,28,29+y,6,8);ellipse(c,'#688cb7',28,28+y,5,6);box(c,gold,27,25+y,2,6);box(c,gold,25,27+y,6,2);}
  if(spriteCache.size>1100)spriteCache.clear();
  spriteCache.set(key,c.canvas);return c.canvas;
}
export function heroSprite(c:Canvas,id:string,job:string,x:number,y:number,direction:Direction,pose:Pose,time:number,scale=1){
  const hero=HEROES[id], j=JOBS[job];
  if(!hero||!j)return;
  const frame=Math.max(0,Math.floor(pose==='idle'?time/430:pose==='dash'?time/68:time/105))%4;
  const image=pixelHero(hero,j,direction,pose,frame);
  c.drawImage(image,Math.round(x-19*scale),Math.round(y-45*scale),Math.ceil(38*scale),Math.ceil(48*scale));
}
const thumbnails=new Map<string,string>();
const generatedBaseArt=new Map(Object.entries(generatedArt.base));
const generatedJobFolders=new Map(Object.entries(generatedArt.jobs));
const jobArtIndex=new Map(generatedArt.jobOrder.map((id,index)=>[id,index]));

export function heroSelectionIllustration(id:string){
  const index=generatedBaseArt.get(id);
  return index!==undefined
    ? assetUrl(`sprites/pixel-rpg/heroes/base/${index}.webp`)
    : proceduralIllustration(id,HEROES[id].job,'joy');
}
export function illustration(id:string,job:string,pose:Pose='idle'){
  if(pose==='idle'||pose==='joy'||pose==='limit'){
    const jobIndex=jobArtIndex.get(job),heroFolder=generatedJobFolders.get(id);
    if(jobIndex!==undefined&&heroFolder!==undefined)return assetUrl(`sprites/pixel-rpg/heroes/jobs/${heroFolder}/${jobIndex}.webp`);
    if(generatedBaseArt.has(id)&&HEROES[id].job===job)return heroSelectionIllustration(id);
  }
  return proceduralIllustration(id,job,pose);
}

export function proceduralIllustration(id:string,job:string,pose:Pose='idle'){
  const key=`${id}:${job}:${pose}`, cached=thumbnails.get(key);
  if(cached)return cached;
  const image=pixelHero(HEROES[id],JOBS[job],'down',pose,1).toDataURL();
  if(thumbnails.size>1000)thumbnails.clear();
  thumbnails.set(key,image);return image;
}
function vessel(c:Canvas,x:number,y:number,v:Adventure['vehicle'],t:number,p:Palette){
  const air=v==='airship'||v==='skyship';
  const bob=Math.floor(Math.sin(t*.008)*1.6), width=v==='canoe'?14:v==='ship'?21:26;
  const yy=y+bob-(air?11:1);
  ellipse(c,air?'#45516e':mix(p.water,p.shade,.3),x,y+5,width*.55|0,3);
  polygon(c,INK,[x-width/2-1,yy-1,x+width/2+1,yy-1,x+width/2-4,yy+6,x-width/2+3,yy+6]);
  polygon(c,v==='submarine'?'#6e91a6':'#a46f4f',[x-width/2+1,yy,x+width/2-1,yy,x+width/2-4,yy+4,x-width/2+3,yy+4]);
  if(air){ellipse(c,'#907b74',x,yy-11,width/2|0,8);ellipse(c,'#d1b08a',x-1,yy-12,width/2-2|0,6);box(c,'#e6cba9',x-7,yy-15,11,1);}
  if(v==='ship'){box(c,'#59483e',x-1,yy-16,2,17);polygon(c,'#ebd8ad',[x+1,yy-15,x+9,yy-3,x+1,yy-4]);}
  if(v==='submarine'){box(c,'#567080',x-3,yy-6,8,6);box(c,'#94c9d8',x-2,yy-3,3,2);box(c,'#e3cd91',x+3,yy-6,2,5);}
  if(v==='canoe'){box(c,'#dec788',x+2,yy-4,1,9);box(c,'#6f4a3a',x-4,yy-2,5,2);}
}

type Follow={lead:Point; at:number; speed:number; prev:Point[]; next:Point[]; faces:Direction[]; map:string};
const follower = (s:Adventure,index:number)=>s.trail[Math.min(s.trail.length-1,index*2)]??s.at;
export function fieldFrame(c:Canvas,s:Adventure,width:number,height:number,now:number,motion:Follow|undefined,dash:boolean){
  const a=area(s.map),world=a.id===WORLD_ID,dungeon=a.place==='dungeon',inside=a.place==='indoors';
  const progress=motion&&motion.map===s.map?Math.min(1,(now-motion.at)/motion.speed):1;
  const start=motion?.prev[0]??s.at;
  const mid=motion&&progress<1?{x:start.x+(s.at.x-start.x)*progress,y:start.y+(s.at.y-start.y)*progress}:s.at;
  const camera=(size:number,tiles:number,focus:number)=>{
    const extent=tiles*16;
    return Math.round(size>=extent?(size-extent)/2:Math.max(size-extent,Math.min(0,size/2-(focus*16+8))));
  };
  const centerX=camera(width,a.width,mid.x),centerY=camera(height,a.height,mid.y);
  const edgeX=Math.max(0,-Math.floor(centerX/16)-2),edgeY=Math.max(0,-Math.floor(centerY/16)-2);
  const endX=Math.min(a.width-1,Math.ceil((width-centerX)/16)+2),endY=Math.min(a.height-1,Math.ceil((height-centerY)/16)+2);
  const front:{y:number;draw:()=>void}[]=[];
  const p=palettes[climateAt(a,s.at)], light=(s.minutes%1440)/60;
  box(c,dungeon||inside?'#172234':mix(p.water,INK,.6),0,0,width,height);
  for(let y=edgeY;y<=endY;y++)for(let x=edgeX;x<=endX;x++){
    const pos={x,y},u=x*16+centerX,v=y*16+centerY;
    const tile=activeTile(s,pos),cl=world?climateAt(a,pos):a.climate,pal=palettes[cl];
    const variant=Math.floor(noise(x,y,a.region)*8);
    const edge=[{x,y:y-1},{x:x+1,y},{x,y:y+1},{x:x-1,y}].reduce((sum,p,i)=>sum+(tileAt(a,p)===tile?1<<i:0),0);
    c.drawImage(texture(tile,cl,variant,[Tile.Path,Tile.Sand,Tile.Wall,Tile.Stone].includes(tile)?edge:15),u,v);
    if([Tile.Sea,Tile.Shallow,Tile.Deep,Tile.Water,Tile.Waterfall].includes(tile)){
      const drift=(Math.floor(now/182)+variant*5+x*3)%17;
      c.globalAlpha=tile===Tile.Deep?.17:.5;
      box(c,pal.foam,u+drift%12,v+4+variant,3+variant%3,1);
      if(tile===Tile.Water)box(c,pal.foam,u+6,v+drift%12,3,1);
      if(tile===Tile.Waterfall){
        for(let i=0;i<5;i++)box(c,i%2?'#e3f4d9':pal.foam,u+2+i*3,v+(drift*2+i*7)%10,2,6);
        ellipse(c,'#d8f0e3',u+8,v+14,7,1);
      }
      c.globalAlpha=1;
    }
    if(tile===Tile.Forest)front.push({y:v+12,draw:()=>tree(c,u,v+4,pal,variant,Math.floor(now/450+y)%3-1)});
    if(tile===Tile.Rock||tile===Tile.Hill)front.push({y:v+14,draw:()=>crag(c,u,v,pal,tile===Tile.Rock)});
    if(worldSymbol(s,pos))front.push({y:v+14,draw:()=>prop(c,{...pos,id:'symbol',label:['',''],kind:'enemy'},u+8,v+8,pal,now)});
  }
  for(const l of a.points){
    if(!visible(s,l)||l.kind==='gate'&&s.flags.includes(a.id+':mechanism'))continue;
    const rock=l.kind==='rock'?s.rocks[a.id]??l:l;
    if(rock.x<edgeX||rock.x>endX||rock.y<edgeY||rock.y>endY)continue;
    const x=centerX+rock.x*16+8,y=centerY+rock.y*16+8;
    front.push({y:y+7,draw:()=>prop(c,l,x,y,p,now)});
    if((l.kind==='door'||l.kind==='camp')&&!s.settings.reduceFx){
      for(let i=0;i<3;i++){
        const drift=(Math.floor(now/140)+i*5)%16;
        c.globalAlpha=(1-drift/16)*.48;
        ellipse(c,'#d9c2a3',x+(l.kind==='door'?22:1)+drift*.3,y-(l.kind==='door'?49:12)-drift,2+i,1+i%2);
      }
      c.globalAlpha=1;
    }
    if ((l.kind==='keeper'&&!s.flags.includes(`met-${a.region}`))||l.kind==='recruit'){
      const dy=s.settings.reduceFx?0:Math.floor(Math.sin(now*.005)*2);
      front.push({y:y+9,draw:()=>{box(c,'#392b34',x-2,y-22+dy,5,7);box(c,'#ffe2a3',x,y-22+dy,1,4);box(c,'#ffe2a3',x,y-17+dy,1,1);}});
    }
  }
  const party=s.vehicle==='foot'?s.party.slice(0,Math.min(s.party.length,Math.ceil(s.trail.length/2))):s.party.slice(0,1);
  party.forEach((id,i)=>{
    const dest=follower(s,i),old=motion?.prev[i]??dest;
    if(i>0&&party.slice(0,i).some((_,j)=>same(dest,follower(s,j))))return;
    const t=motion&&motion.map===s.map?progress:1;
    const x=(old.x+(dest.x-old.x)*t)*16+centerX+8,y=(old.y+(dest.y-old.y)*t)*16+centerY+14;
    const dir=i===0?s.direction:motion?.faces[i]??s.direction;
    front.push({y:y+2,draw:()=>{
      if(s.vehicle!=='foot'){vessel(c,x,y-5,s.vehicle,now,p);return;}
      ellipse(c,'#303942',Math.round(x),Math.round(y),6,2);
      const spriteSize=32;
      const left=Math.round(x-spriteSize/2),top=Math.round(y-spriteSize*.95);
      const walking=t<1&&!same(old,dest);
      c.save();c.imageSmoothingEnabled=true;
      if(!drawStudentSprite(c,id,OFFSETS[dir],left,top,spriteSize,false,true)&&!drawGuestSprite(c,id,dir,left,top,spriteSize,walking?t:undefined)){
        heroSprite(c,id,s.heroes[id].job,x,y,dir,walking?(dash?'dash':'walk'):'idle',now,.67);
      }
      c.restore();
    }});
  });
  front.sort((x,y)=>x.y-y.y).forEach(t=>t.draw());
  if(!inside&&!dungeon){
    c.globalAlpha=light<5||light>=20?.29:light<7||light>=17?.17:0;
    box(c,light<5||light>=20?'#243467':'#c16b54',0,0,width,height);
    c.globalAlpha=1;
    if(!s.settings.reduceFx){
      const weather=a.climate==='sky'||a.climate==='night'?1:Math.floor(s.minutes/470)%5;
      for(let i=0;i<(weather===3?26:12);i++){
        const x=(noise(i,8,3)*width+now*(weather===3?.025:.008)+width)%width;
        const y=(noise(i,19,5)*height+(weather===3?now*.08:weather===1?now*.011:0))%height;
        c.globalAlpha=weather===3?.35:weather===1?.48:.16;
        if(weather===3)polygon(c,'#e4f7ec',[x,y,x+1,y,x-2,y+6,x-3,y+5]);
        else if(weather===1)box(c,'#e6edf5',x,y,1,1);
        else if(weather===2)ellipse(c,'#dce1e1',x,y,14+i%4*4,1);
        else box(c,p.highlight,x,y,1,1);
      }
      c.globalAlpha=1;
      if(light>=6&&light<19&&(weather===0||weather===4)){
        const wave=Math.floor(now/190)%3-1;
        for(let bird=0;bird<3;bird++){
          const bx=(Math.floor(now*.044)+bird*11)%(width+30)-16,by=31+bird*6;
          box(c,'#24353d',bx-2,by+wave,2,1);box(c,'#253943',bx,by,2,1);box(c,'#253943',bx+2,by+wave,2,1);
        }
      }
    }
  }else{
    const g=c.createRadialGradient(width/2,height/2,height*.16,width/2,height/2,Math.max(width,height)*.65);
    g.addColorStop(0,'#111a3000');g.addColorStop(1,'#111a309d');c.fillStyle=g;c.fillRect(0,0,width,height);
  }
}

const enemyCache=new Map<string,HTMLCanvasElement>();
function creature(enemy:Enemy,phase:number,frame:number){
  const key=`${enemy.id}:${phase}:${frame%4}`, existing=enemyCache.get(key);if(existing)return existing;
  const c=screen(90,78),dark=mix(enemy.color,INK,.5),main=phase===2?mix(enemy.color,'#ae678f',.42):enemy.color,light=mix(main,'#fff4c6',.55);
  const dy=frame%2;
  c.translate(0,dy);
  if(enemy.art==='moth'||enemy.art==='roc'||enemy.art==='drake'||enemy.art==='ray'){
    const top=enemy.art==='roc'?4:13,w=enemy.art==='ray'?2:8;
    polygon(c,INK,[43,34,w,top,12,39,25,57,43,49,56,55,83,30,85,9,59,24]);
    polygon(c,dark,[42,36,w+4,top+4,16,39,28,54,42,47,56,50,78,28,81,13,59,28]);
    polygon(c,main,[41,38,16,19,21,35,31,46,40,44,56,45,75,21,65,26,55,34]);
    polygon(c,light,[29,40,15,22,19,39,30,50,34,48]);
    if(enemy.art==='drake'){polygon(c,INK,[44,39,55,47,51,63,28,72,14,67,32,65,42,56]);box(c,main,30,64,14,3);}
    ellipse(c,INK,48,38,12,13);ellipse(c,main,48,37,10,10);ellipse(c,light,46,33,6,5);
    box(c,'#f6d5a3',50,36,4,3);box(c,'#533849',51,36,2,3);
    polygon(c,dark,[49,44,55,46,61,41,65,41,58,48,49,48]);
  }else if(enemy.art==='slime'||enemy.art==='wisp'){
    const rise=enemy.art==='wisp'?12:0;
    polygon(c,INK,[10,60-rise,13,47-rise,21,44-rise,31,30-rise,49,25-rise,63,33-rise,71,51-rise,80,56-rise,77,66-rise,55,69-rise,23,68-rise]);
    ellipse(c,dark,44,55-rise,31,12);ellipse(c,main,44,48-rise,26,16);ellipse(c,light,37,39-rise,14,6);
    box(c,'#fdebb5',32,46-rise,4,5);box(c,INK,34,47-rise,2,3);box(c,'#fdebb5',53,45-rise,4,5);box(c,INK,55,46-rise,2,3);
    box(c,dark,44,55-rise,7,2);
    if(enemy.art==='wisp')for(let i=0;i<7;i++){box(c,i%2?light:main,22+i*7,18+(i%3)*5,3,3);}
  }else if(enemy.art==='squid'){
    for(let i=0;i<6;i++){
      const x=16+i*11,y=55+i%2*6;
      polygon(c,INK,[x,41,x+7,44,x+4,y,x+11,y+10,x+6,y+13,x-3,y+4]);
      polygon(c,i%2?dark:main,[x+1,43,x+5,45,x+2,y,x+9,y+10,x+6,y+11,x-1,y+4]);
    }
    polygon(c,INK,[18,39,25,24,42,7,61,24,74,42,60,55,31,54]);
    ellipse(c,main,46,37,23,13);ellipse(c,light,40,32,14,7);box(c,dark,30,44,35,4);
    for(const x of [36,53]){box(c,'#efce8f',x,40,5,4);box(c,INK,x+1,41,2,2);}
  }else if(enemy.art==='hound'){
    polygon(c,INK,[11,51,15,39,30,36,32,24,43,26,49,32,61,31,75,42,74,54,81,60,77,69,67,68,62,56,54,58,49,67,40,68,39,56,32,55,24,63,17,62]);
    polygon(c,dark,[13,51,17,41,31,39,34,28,42,28,50,34,60,33,72,42,72,54,78,60,76,67,68,66,63,54,53,55,46,65,42,65,41,54,30,53,24,60,18,60]);
    ellipse(c,main,31,43,15,7);ellipse(c,main,55,44,16,8);box(c,light,20,41,7,1);box(c,'#f9ca81',20,47,3,3);
  }else if(enemy.art==='book'){
    const middle=phase===2?46:43;
    polygon(c,INK,[8,27,27,17,middle,27,66,17,85,27,82,58,62,60,middle,69,21,61,8,54]);
    polygon(c,dark,[10,29,27,20,middle,30,66,21,82,30,80,55,62,57,middle,65,22,57,11,52]);
    polygon(c,light,[14,26,29,22,middle,32,65,23,78,28,76,49,62,51,middle,60,23,52,14,48]);
    polygon(c,main,[middle,34,middle+4,35,middle+5,58,middle,62,middle-4,58,middle-3,35]);
    for(let i=0;i<5;i++){box(c,main,20,30+i*4,11,1);box(c,main,56,32+i*4,13,1);}
    ellipse(c,INK,middle,44,6,4);ellipse(c,'#f9c583',middle,44,3,2);
  }else{
    for(const x of [15,67]){box(c,INK,x-1,33,14,25);box(c,dark,x+1,35,10,20);box(c,light,x+2,36,7,2);}
    for(const x of [27,53]){box(c,INK,x,51,12,18);box(c,main,x+2,53,8,14);box(c,dark,x+1,64,11,4);}
    polygon(c,INK,[21,48,25,18,43,9,56,14,69,28,67,53,56,58,31,58]);
    polygon(c,dark,[23,47,27,21,43,12,55,16,66,29,64,51,55,56,31,55]);
    polygon(c,main,[28,43,30,24,43,16,55,20,60,30,58,46,44,52]);
    box(c,light,35,22,14,2);box(c,INK,31,29,25,12);
    if(enemy.art==='lantern'){ellipse(c,'#ed9559',43,37,8,9);ellipse(c,'#ffe9a2',42,36,4,5);box(c,'#8d6a51',39,43,9,2);}
    else {box(c,'#f3d98e',36,32,5,3);box(c,'#f3d98e',48,32,5,3);box(c,light,38,47,10,2);}
  }
  if(phase===2){
    for(const [x,y] of [[14,18],[74,20],[49,6],[84,47],[11,53]])box(c,light,x,y,2,2);
  }
  enemyCache.set(key,c.canvas);return c.canvas;
}

export function arenaPosition(side:'party'|'enemy', index:number, compact=false):Point {
  const row=Math.floor(index/2), column=index%2;
  const x=compact
    ? (side==='party'?(row?.719:.62)+column*.185:(row?.192:.103)+column*.189)
    : (side==='party'?.68+column*.19:.12+column*.19);
  return {x,y:.5+row*.3};
}
export type Animation={pulses:Pulse[]; at:number; actors:string[]; duration:number; cue?:ActionCue; defeated?:string[]; enemyOrder?:string[]};
const backdrops=new Map<Climate,HTMLImageElement>();
function battleBackdrop(climate:Climate){
  const key=climate==='night'?'ruin':climate;
  const cached=backdrops.get(key);
  if(cached)return cached;
  const image=new Image();
  image.src=assetUrl(`sprites/pixel-rpg/battle-${key}.webp`);
  backdrops.set(key,image);
  return image;
}
function fx(c:Canvas,p:Pulse,pos:Point,from:Point|undefined,t:number){
  if(p.art==='gesture')return;
  const color=ELEMENT_COLOR[p.element],white=mix(color,'#ffffff',.72),a=1-t;
  const size= Math.floor((1+Math.sin(Math.PI*t))*10);
  c.globalAlpha=Math.max(.1,a);
  if(from&&(p.art==='cast'||p.art==='summon')){
    const x=from.x+(pos.x-from.x)*Math.min(1,t*2.7),y=from.y+(pos.y-from.y)*Math.min(1,t*2.7);
    ellipse(c,color,x,y,5,3);box(c,white,x-2,y-1,4,2);
  }
  if(p.art==='blade'||p.art==='critical'||p.art==='hit'){
    const xx=pos.x+Math.round((t-.35)*14),yy=pos.y;
    polygon(c,color,[xx-18,yy+8,xx-7,yy+2,xx+14,yy-16,xx+22,yy-21,xx+15,yy-9,xx-1,yy+4,xx-16,yy+13]);
    polygon(c,white,[xx-10,yy+6,xx+7,yy-7,xx+18,yy-17,xx+15,yy-10,xx-2,yy+5]);
    const rays=p.art==='critical'?14:8;
    for(let i=0;i<rays;i++){
      const angle=i/rays*Math.PI*2,reach=(5+noise(i,p.id,7)*15)*(1+t*2.2);
      box(c,i%3?color:white,xx+Math.cos(angle)*reach,yy+Math.sin(angle)*reach,2+(i%2),1+(i%2));
    }
  }else if(p.art==='block'||p.art==='phase'||p.art==='transform'||p.art==='heal'){
    for(let i=0;i<22;i++){
      const angle=i/22*Math.PI*2+t*.7;
      box(c,i%3?color:white,pos.x+Math.cos(angle)*(size+5),pos.y+Math.sin(angle)*size*.9,i%2?2:3,2);
    }
    if(p.art==='heal') {box(c,white,pos.x-1,pos.y-9,3,17);box(c,white,pos.x-8,pos.y-2,17,3);}
  }else if(p.element==='storm'){
    polygon(c,color,[pos.x-5,pos.y-35,pos.x+3,pos.y-35,pos.x-3,pos.y-20,pos.x+10,pos.y-23,pos.x-6,pos.y+11,pos.x-2,pos.y-14,pos.x-11,pos.y-12]);
  }else if(p.element==='ice'){
    for(let n=-1;n<=1;n++)polygon(c,n===0?white:color,[pos.x+n*9-4,pos.y+8,pos.x+n*8-2,pos.y-14-6*(1-Math.abs(n)),pos.x+n*9+5,pos.y-3,pos.x+n*9+3,pos.y+6]);
  }else {
    for(let i=0;i<15;i++){
      const angle=i/15*Math.PI*2,speed=10+noise(i,4,2)*size;
      box(c,i%3?color:white,pos.x+Math.cos(angle)*speed*t,pos.y+Math.sin(angle)*speed*t,3-i%2,3-i%2);
    }
  }
  if(p.value!==undefined){
    const mark=(p.art==='heal'?'+':'')+p.value;
    const x=pos.x+(p.id%3-1)*9,y=pos.y-14-t*17;
    c.font=`bold ${p.art==='critical'?16:12}px monospace`;c.textAlign='center';c.lineWidth=2.8;
    c.strokeStyle=INK;c.strokeText(mark,x,y);c.fillStyle=white;c.fillText(mark,x,y);
  }
  c.globalAlpha=1;
}

function defeatBurst(c:Canvas,pos:Point,t:number,boss:boolean){
  const progress=Math.max(0,(t-.13)/.87),radius=(boss?56:37)*Math.sqrt(progress);
  c.save();
  c.globalAlpha=(1-progress)*.86;
  c.strokeStyle=boss?'#ffd98e':'#ffeac7';c.lineWidth=2.2*(1-progress)+.5;
  c.beginPath();c.ellipse(pos.x,pos.y+5,5+radius,3+radius*.65,0,0,Math.PI*2);c.stroke();
  for(let i=0;i<(boss?24:15);i++){
    const angle=i*2.39996,reach=radius*(.36+noise(i,11,2));
    const x=pos.x+Math.cos(angle)*reach,y=pos.y+Math.sin(angle)*reach*.72+progress*progress*13;
    polygon(c,i%3===0?'#fff7d8':boss?'#ffc66b':'#ef998c',[x,y-3,x+2,y-1,x+1,y+3,x-2,y]);
  }
  c.restore();
}
export function battleFrame(c:Canvas,b:Battle,width:number,height:number,now:number,anim?:Animation,reduced=false,compact=false){
  const climate=(['meadow','machine','crystal','tide','sky','ruin','night'] as const)[b.encounter.region];
  const p=palettes[climate],horizon=Math.round(height*.47),wave=Math.floor(now/250)%4;
  const backdrop=battleBackdrop(climate);
  if(backdrop.complete&&backdrop.naturalWidth){
    const aspect=backdrop.naturalWidth/backdrop.naturalHeight;
    // Allow a small amount of stretching on wide phones while keeping the floor in view.
    const targetWidth=Math.max(width,height*aspect*.9);
    const targetHeight=Math.max(height,targetWidth/aspect*.77);
    c.drawImage(backdrop,Math.round((width-targetWidth)/2),Math.round((height-targetHeight)*.72),Math.ceil(targetWidth),Math.ceil(targetHeight));
    if(climate==='night'){c.fillStyle='#33315863';c.fillRect(0,0,width,height);}
    c.fillStyle='#0c1d2733';c.fillRect(0,0,width,height);
  }else{
    const top=c.createLinearGradient(0,0,0,horizon*1.4);top.addColorStop(0,mix(p.sky,'#282542',.63));top.addColorStop(1,p.sky);
    c.fillStyle=top;c.fillRect(0,0,width,height);
    for(let i=0;i<24;i++){
      const x=Math.round(i*width/22), y=horizon-17-Math.round(noise(i,b.encounter.region,12)*height*.18);
      polygon(c,mix(p.sky,p.wall,.56),[x-26,horizon+4,x,y,x+24,horizon+5]);
      if(i%2===0)polygon(c,mix(p.sky,p.wall,.32),[x-7,y+3,x,y,x+9,y+10,x-3,y+7]);
    }
    for(let i=0;i<18;i++){const x=Math.round(i*width/17);if(climate==='machine'||climate==='ruin'){
      box(c,p.wall,x,horizon-11-(i%4)*5,8,horizon*.32);box(c,p.stone,x+2,horizon-13-(i%4)*5,2,11);
    }else if(climate==='sky'||climate==='tide'){ellipse(c,mix(p.foam,p.sky,.43),x+(wave-i%2),horizon-5-(i%3)*7,15,3);}
    else tree(c,x,horizon-3,p,i,0);}
    box(c,mix(p.grass,p.wall,.38),0,horizon,width,height-horizon);
    for(let y=horizon;y<height;y+=3){
      const alpha=(y-horizon)/(height-horizon);
      for(let i=0;i<width/12;i++){
        const x=(12*i+noise(i,y,2)*13)%width;
        box(c,mix(p.grass,i%4?p.wall:p.highlight,alpha*.4+.14),x,y,3+i%5,1);
      }
    }
  }
  const centers:Record<string,Point>={};
  const time=anim?Math.max(0,(now-anim.at)/anim.duration):1;
  const livePulse=time<1?anim?.pulses??[]:[];
  const defeated=time<1?anim?.defeated??[]:[];
  const size=Math.max(.43,Math.min(.95,height/175,width/390));
  const surviving=b.enemies.filter(e=>e.hp>0);
  b.enemies.filter(e=>e.hp>0||defeated.includes(e.id)||livePulse.some(a=>a.to===e.id)).slice(-4).forEach((e,i)=>{
    const liveIndex=anim?.enemyOrder?.indexOf(e.id)??surviving.indexOf(e);
    const p0=arenaPosition('enemy',liveIndex===-1?i:liveIndex,compact);
    const x=p0.x*width,y=p0.y*height-5;
    centers[e.id]={x,y:y-23*size};
    const lunge=livePulse.some(a=>a.from===e.id&&a.to!==e.id&&a.art==='hit')&&!reduced?Math.sin(time*Math.PI)*12:0;
    const image=creature(e.spec,e.phase,Math.floor(now/285));
    const mag=size*(e.spec.boss?1.21:b.encounter.hidden&&e.spec.id.endsWith('foe3')?1.12:.81);
    const falling=defeated.includes(e.id);
    const shook=!reduced&&livePulse.some(a=>a.to===e.id&&(a.value??0)>0&&a.art!=='heal');
    const recoil=shook?Math.sin(time*22)*5*Math.max(0,1-time*1.7):0;
    const fade=falling?Math.max(0,1-Math.max(0,time-.25)/.66):e.hp<=0?Math.max(0,1-time):1;
    c.save();c.globalAlpha=fade;
    ellipse(c,'#303244',Math.round(x),Math.round(y),Math.round(24*mag),Math.max(1,Math.round(3*mag)));
    if(!reduced&&falling){c.translate(x,y+time*time*7);c.rotate(-time*.24);c.translate(-x,-y);}
    if(shook&&time<.19)c.filter=`brightness(${falling?2.4:1.65})`;
    c.drawImage(image,Math.round(x-45*mag+lunge+recoil),Math.round(y-69*mag),Math.round(90*mag),Math.round(78*mag));
    c.restore();
    if(falling&&!reduced&&time>.13)defeatBurst(c,centers[e.id],time,e.spec.boss===true);
  });
  c.save();
  c.imageSmoothingEnabled=true;
  c.imageSmoothingQuality='high';
  b.party.forEach((unit,i)=>{
    const p0=arenaPosition('party',i,compact), x=p0.x*width,y=p0.y*height-5;
    const acting=livePulse.find(a=>a.from===unit.id), hit=livePulse.find(a=>a.to===unit.id);
    const cut=anim?.actors.includes(unit.id)&&time<1;
    const action=battleActionForActor(livePulse,unit.id,cut);
    const pose:Pose=!unit.hp?'fallen':b.outcome==='win'?'win':cut?'limit':acting?.art==='blade'?'attack':acting?.art==='block'?'guard':acting?.art==='heal'?'heal':acting?.art==='cast'||acting?.art==='summon'?'cast':acting?'card':hit?.art==='hit'?'hit':unit.hp<unit.max*.27?'weak':'idle';
    const lunge=acting&&acting.to!==unit.id&&(pose==='attack'||pose==='limit')&&!reduced?-Math.sin(time*Math.PI)*17:0;
    centers[unit.id]={x,y:y-23*size};
    ellipse(c,'#323944',Math.round(x),Math.round(y),Math.round(10*size),Math.max(1,Math.round(3*size)));
    if(unit.transformed){c.globalAlpha=.37;ellipse(c,'#f9cc91',Math.round(x),Math.round(y),Math.round(13*size),3);c.globalAlpha=1;}
    if((unit.hp>0||action==='damage')&&drawBattleActor(c,unit.id,unit.hero.job,illustration(unit.id,unit.hero.job),x,y,size*.94,action,Math.min(1,time),reduced))return;
    heroSprite(c,unit.id,unit.hero.job,x+lunge,y,'left',pose,acting?time*410:now,size*.94);
  });
  c.restore();
  if(!reduced&&time<1){
    livePulse.forEach((pulse,i)=>{
      const dest=centers[pulse.to],source=pulse.from?centers[pulse.from]:undefined;
      if(!dest)return;
      const t=Math.min(1,(time-i*.02)*1.13);
      if(t>=0&&t<1)fx(c,pulse,dest,source,t);
    });
  }else if(time<1) {
    for(const pulse of livePulse)if(pulse.value!==undefined&&centers[pulse.to])fx(c,{...pulse,art:'victory'},centers[pulse.to],undefined,time);
  }
}
