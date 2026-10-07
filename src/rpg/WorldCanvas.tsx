import {furnitureImage} from './homeCatalog';
import {drawFarmSprite} from './farm/draw';
import {VOXEL_COLORS,type TerrainBlock} from './voxel';
import {storyForSite} from './stories';
import {residentsOf} from './town/residents';
import {residentPosition} from './town/worldResidents';
import {getRoamingNpcEvent} from './roamingNpcs';
import {drawFarms} from './farm/draw';
import {occupiedFarmTile} from './farm/model';
import {CITY_SPRITES} from './city/spriteRects';
import {occupiedCityTile} from './city/model';
import {rpgPreferences} from './preferences';
import {cityBuilding} from './city/catalog';
import {calendar,flowerAt} from './town/model';
import {FLOWERS as FLOWERS_FOR_GARDEN,flowerAtlas} from './town/catalog';
import {heroFrame} from './customHero';
import {assetUrl} from '../utils/assetPaths';
import {natureAt,resourceReady} from './life';
import { BIOMES, biomeSurface } from "./biomes";
import { trans } from "../utils/textUtils";
import type { LanguageMode } from "../types";
import type { VisualThemeId } from "../data/visualThemes";
import { getRpgSiteDisplayName } from "./enemyNames";
import React, { useEffect, useRef } from "react";
import {
  HEIGHT,
  WIDTH,
  type World,
  type Site,
  type Adventurer,
} from "./engine";

const T = 16,
  colors = ["#e6b74d", "#7ed6dd", "#c0a0ec", "#ef8a80", "#8ee0a5", "#e7a4cb"];
const atlas = typeof Image !== 'undefined' ? new Image() : null; if(atlas)atlas.src = assetUrl('sprites/rpg/frontier-atlas.webp');
const craftAtlas = typeof Image !== 'undefined' ? new Image() : null; if(craftAtlas)craftAtlas.src=assetUrl('sprites/rpg/craft-items.webp');
function prop(c:CanvasRenderingContext2D,index:number,x:number,y:number,size=27,source=atlas,columns=6,rows=4){if(source?.complete&&source.naturalWidth)c.drawImage(source,index%columns*source.naturalWidth/columns,Math.floor(index/columns)*source.naturalHeight/rows,source.naturalWidth/columns,source.naturalHeight/rows,x+8-size/2,y+17-size,size,size);}
const cityAtlas=typeof Image!=='undefined'?new Image():null;if(cityAtlas)cityAtlas.src=assetUrl('sprites/rpg/city/buildings.webp');
const flowerAtlases=Array.from({length:4},(_,i)=>{if(typeof Image==='undefined')return null;const image=new Image();image.src=assetUrl(flowerAtlas(i));return image;});
const characterImages = new Map<string, HTMLImageElement>();
function rect(
  c: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  color: string,
) {
  c.fillStyle = color;
  c.fillRect(Math.round(x), Math.round(y), w, h);
}
function tree(c: CanvasRenderingContext2D, x: number, y: number) {
  rect(c, x + 2, y + 13, 14, 4, "#375b40");
  rect(c, x + 7, y + 8, 4, 10, "#584a36");
  rect(c, x + 7, y + 12, 1, 5, "#9d8050");
  rect(c, x + 4, y - 4, 8, 3, "#315b3c");
  rect(c, x + 1, y - 1, 14, 4, "#315b3c");
  rect(c, x - 1, y + 3, 18, 6, "#234c3a");
  rect(c, x + 1, y + 9, 14, 4, "#1b4036");
  rect(c, x + 3, y + 12, 10, 2, "#183930");
  rect(c, x + 4, y - 3, 7, 3, "#739454");
  rect(c, x + 1, y + 1, 9, 3, "#5b8048");
  rect(c, x + 6, y + 2, 8, 4, "#416c41");
  rect(c, x + 1, y + 6, 5, 3, "#456f43");
  rect(c, x + 9, y + 7, 5, 3, "#30583c");
  rect(c, x + 3, y + 2, 2, 1, "#89a45e");
  rect(c, x + 8, y - 2, 2, 1, "#9cb773");
}
function building(
  c: CanvasRenderingContext2D,
  x: number,
  y: number,
  boss = false,
) {
  rect(c, x - 15, y - 14, 32, 29, boss ? "#828391" : "#d8c394");
  rect(c, x - 18, y - 17, 38, 7, boss ? "#45475f" : "#aa6452");
  rect(c, x - 13, y - 24, 28, 7, boss ? "#565b75" : "#bc7860");
  rect(c, x - 8, y - 29, 18, 5, boss ? "#8c91a1" : "#d6996c");
  rect(c, x - 12, y - 7, 7, 7, "#304a54");
  rect(c, x + 7, y - 7, 7, 7, "#304a54");
  rect(c, x - 2, y + 3, 7, 12, "#4e4140");
  rect(c, x - 12, y - 7, 5, 2, "#e6c96f");
  rect(c, x + 7, y - 7, 5, 2, "#e6c96f");
  rect(c, x - 16, y + 14, 34, 3, "#585443");
  // Roof shingles, timber framing, window panes and stone doorstep.
  for (let row = 0; row < 3; row++) {
    for (let col = 0; col < 5 - row; col++)
      rect(
        c,
        x - 15 + row * 3 + col * 6,
        y - 14 - row * 5,
        4,
        1,
        boss ? "#777d94" : "#dda075",
      );
  }
  rect(c, x - 14, y - 9, 2, 22, "#897352");
  rect(c, x + 14, y - 9, 2, 22, "#897352");
  rect(c, x - 14, y + 1, 29, 2, "#a18c61");
  rect(c, x - 10, y - 7, 1, 7, "#c9b880");
  rect(c, x + 9, y - 7, 1, 7, "#c9b880");
  rect(c, x - 4, y + 14, 12, 2, "#baae87");
  rect(c, x - 5, y + 16, 14, 2, "#8f9276");
  if (!boss) {
    rect(c, x + 9, y - 30, 4, 12, "#86735e");
    rect(c, x + 8, y - 31, 6, 2, "#b7aa83");
    rect(c, x - 15, y + 8, 10, 5, "#58764b");
    for (let i = 0; i < 3; i++)
      rect(c, x - 14 + i * 3, y + 7 + (i % 2), 2, 2, "#eac795");
    rect(c, x + 20, y + 2, 2, 15, "#897249");
    rect(c, x + 17, y + 2, 9, 7, "#3b6962");
    rect(c, x + 20, y + 3, 2, 4, "#e1d399");
  }
  if (boss) {
    rect(c, x - 5, y - 21, 12, 10, "#d6cfaf");
    rect(c, x, y - 20, 2, 6, "#44495a");
    rect(c, x, y - 15, 5, 2, "#44495a");
    rect(c, x - 18, y - 32, 5, 16, "#686f87");
    rect(c, x + 15, y - 32, 5, 16, "#686f87");
  }
}
function person(
  c: CanvasRenderingContext2D,
  p: Adventurer,
  time: number,
) {
  const x = p.x * T,
    y = p.y * T,
    coat = colors[p.color],
    bob = Math.sin(time / 350 + p.color) > 0.8 ? 1 : 0;
  rect(c, x + 3, y + 13, 11, 3, "#203b35");
  const action=p.life?.work?(p.life.work.kind==='fish'?'skill':'attack'):p.hp/p.maxHp<=.25?'low-hp':p.memory?.autoTalk&&time%10000<2200?'idle-special':'idle';
  const source = p.hero?heroFrame(p.hero,action,time):p.profile?.image;
  if (source && !characterImages.has(source)) {
    const image = new Image();
    image.src = source;
    characterImages.set(source, image);
  }
  const sprite = source ? characterImages.get(source) : undefined;
  if (sprite?.complete && sprite.naturalWidth > 0) {
    const scale = Math.min(24 / sprite.naturalWidth, 28 / sprite.naturalHeight);
    const width = sprite.naturalWidth * scale,
      height = sprite.naturalHeight * scale;
    c.drawImage(
      sprite,
      x + 8 - width / 2,
      y + 15 - height + bob,
      width,
      height,
    );
  } else {
    rect(c, x + 5, y + 11, 3, 4, "#303345");
    rect(c, x + 10, y + 11, 3, 4, "#303345");
    rect(c, x + 4, y + 5 + bob, 10, 7, coat);
    rect(c, x + 5, y + bob, 8, 6, "#f1cc97");
    rect(c, x + 4, y - 2 + bob, 10, 4, "#624431");
    rect(c, x + 11, y + 2 + bob, 1, 2, "#2f343a");
    rect(c, x + 3, y + 7 + bob, 2, 4, "#f1cc97");
  }
  if (p.team) {
    c.strokeStyle = coat;
    c.strokeRect(x + 1, y + 12, 15, 5);
  }
}
function landmarkPortrait(c:CanvasRenderingContext2D,path:string,x:number,y:number){let image=characterImages.get(path);if(!image){image=new Image();image.src=assetUrl(path);characterImages.set(path,image);}if(!image.complete||!image.naturalWidth)return false;const height=28,width=Math.min(24,height*image.naturalWidth/image.naturalHeight);c.drawImage(image,x-width/2,y+10-height,width,height);return true;}
export function landmark(c: CanvasRenderingContext2D, s: Site, time: number) {
  const x = s.x * T + 8,
    y = s.y * T + 8;
  if (s.kind === 'story') {
    if(s.storyRole==='npc'){const path=storyForSite(s)?.portrait;if(path&&landmarkPortrait(c,path,x,y))return;}
    rect(c,x-5,y-10,10,15,s.storyRole==='npc'?'#e6c47a':'#bdaddc');
    rect(c,x-3,y-17,6,6,'#ffefbb');
    c.font='bold 15px sans-serif';c.fillStyle='#fff4bc';c.textAlign='center';c.fillText(s.storyRole==='npc'?'!':'?',x,y-22);
  } else if (s.kind === "dungeon" || s.kind === "secret") {
    rect(c,x-10,y-12,21,25,s.kind === "dungeon" ? "#777080" : "#b49a62");
    rect(c,x-5,y-7,11,20,"#16242b");
    rect(c,x-12,y+12,25,3,"#ccbe88");
  } else if (s.kind === "fragment" || s.kind === "seal") {
    rect(c,x-5,y-7,11,15,s.kind === "fragment" ? "#e8dba9" : "#a889cb");
    rect(c,x-2,y-3,5,7,"#786990");
  } else if (s.kind === "town" || s.kind === "boss")
    building(c, x, y, s.kind === "boss");
  else if (s.kind === "rest") {
    rect(c, x - 7, y + 2, 15, 4, "#684939");
    rect(c, x - 4, y - 5, 9, 9, "#e9a54d");
    rect(c, x - 1, y - 8 + (Math.floor(time / 300) % 2) * 2, 3, 10, "#ffe1a0");
  } else if (s.kind === "treasure") {
    rect(c, x - 6, y - 4, 13, 10, "#88613c");
    rect(c, x - 6, y - 5, 13, 3, "#e3b967");
    rect(c, x - 1, y - 1, 3, 4, "#fae1a0");
  } else if (s.kind === "npc") {
    const path=getRoamingNpcEvent(s.npcEventId)?.portrait;
    if(path){let image=characterImages.get(path);if(!image){image=new Image();image.src=assetUrl(path);characterImages.set(path,image);}if(image.complete&&image.naturalWidth){const height=28,width=Math.min(24,height*image.naturalWidth/image.naturalHeight);c.drawImage(image,x-width/2,y+10-height,width,height);return;}}
    const coats = ["#ad6d46", "#547b67", "#587e9c", "#a58b4e", "#886b9d", "#6d8790"];
    const coat = coats[(s.npcEventId?.split("").reduce((n,ch)=>n+ch.charCodeAt(0),0)||0)%coats.length];
    rect(c,x-6,y+5,13,3,"#324c40");
    rect(c,x-4,y-2,9,8,coat);
    rect(c,x-3,y-9,7,7,"#eac69a");
    rect(c,x-4,y-10,9,3,"#453b38");
    rect(c,x-2,y+5,2,5,"#413a3b");
    rect(c,x+2,y+5,2,5,"#413a3b");
    rect(c,x+5,y-1,3,4,"#f1d67d");
    c.fillStyle = "#fff0b5";
    c.font = "bold 11px sans-serif";
    c.textAlign = "center";
    c.fillText("!",x,y-13);
  } else if (s.kind === "event") {
    rect(c, x - 4, y - 9, 9, 16, "#929d87");
    rect(c, x - 2, y - 6, 5, 2, "#d8dfb0");
    rect(c, x - 2, y - 2, 5, 2, "#d8dfb0");
    c.fillStyle = "#ffedaa";
    c.font = "bold 12px monospace";
    c.textAlign = "center";
    c.fillText("?", x, y - 12);
  } else {
    const guard = s.kind === "guardian";
    rect(c, x - 7, y + 3, 15, 4, "#264940");
    rect(
      c,
      x - 6,
      y - 3,
      13,
      8,
      s.cleared ? "#627361" : guard ? "#947bba" : "#83b393",
    );
    rect(
      c,
      x - 3,
      y - 7,
      8,
      7,
      s.cleared ? "#627361" : guard ? "#b3a0d1" : "#a3cfaa",
    );
    rect(c, x - 3, y - 2, 2, 2, "#28383c");
    rect(c, x + 3, y - 2, 2, 2, "#28383c");
    if (guard && !s.cleared) rect(c, x - 4, y - 11, 9, 3, "#ecd185");
  }
}
export default function WorldCanvas({
  world,
  selfId,
  onTile,
  onPlayer,
  overview = false,
  languageMode = "JAPANESE",
  visualTheme = world.setup?.visualTheme || "elementary",
}: {
  world: World;
  selfId: string;
  onTile: (x: number, y: number) => void;
  onPlayer?: (id: string) => void;
  overview?: boolean;
  languageMode?: LanguageMode;
  visualTheme?: VisualThemeId;
}) {
  const ref = useRef<HTMLCanvasElement>(null),
    camera = useRef({ x: 0, y: 0, scale: 1 }),
    latest = useRef(world);
  latest.current = world;
  useEffect(() => {
    const canvas = ref.current!;
    const c = canvas.getContext("2d")!;
    let frame = 0;
    const paint = (time: number) => {
      const prefs=rpgPreferences();
      const w: World = latest.current,
        p = w.players[selfId];
      if (!p) return;
      const sw = canvas.clientWidth,
        sh = canvas.clientHeight;
      canvas.width = Math.max(1, Math.round(sw));
      canvas.height = Math.max(1, Math.round(sh));
      const scale = overview
        ? Math.min(sw / (WIDTH * T), sh / (HEIGHT * T))
        : sw < 600 || sh < 350
          ? 2*prefs.zoom
          : 3*prefs.zoom;
      const cx = overview
        ? (WIDTH * T - sw / scale) / 2
        : Math.max(
            0,
            Math.min(WIDTH * T - sw / scale, p.x * T - sw / scale / 2),
          );
      const cy = overview
        ? (HEIGHT * T - sh / scale) / 2
        : Math.max(
            0,
            Math.min(HEIGHT * T - sh / scale, p.y * T - sh / scale / 2),
          );
      camera.current = { x: cx, y: cy, scale };
      c.imageSmoothingEnabled = false;
      c.fillStyle = "#101f24";
      c.fillRect(0, 0, sw, sh);
      c.save();
      c.scale(scale, scale);
      c.translate(-cx, -cy);
      const minX = Math.max(0, Math.floor(cx / T) - 2), maxX = Math.min(WIDTH, Math.ceil((cx + sw / scale) / T) + 2);
      const minY = Math.max(0, Math.floor(cy / T) - 3), maxY = Math.min(HEIGHT, Math.ceil((cy + sh / scale) / T) + 2);
      const season=calendar(w);
      for (let y = minY; y < maxY; y++)
        for (let x = minX; x < maxX; x++) {
          const biome = biomeSurface(x,y);
          const tile = w.tiles[y * WIDTH + x],
            hash = (x * 173 + y * 31 + w.seed) % 19,
            px = x * T,
            py = y * T;
          rect(
            c,
            px,
            py,
            T,
            T,
            tile === "water"
              ? "#376d79"
              : tile === "road"
                ? "#ae9c6c"
                : tile === "stone"
                  ? "#727c79"
                  : hash < 8
                    ? biome.shade
                    : biome.color,
          );
          if((tile==='grass'||tile==='forest')){c.fillStyle=['#adc89922','#72b77b16','#dcab5744','#d5e5e755'][season.season];c.fillRect(px,py,T,T);}
          if (tile === "water") {
            rect(
              c,
              px + ((Math.floor(time / 650) + x) % 3) * 3,
              py + 5,
              7,
              1,
              "#669f9e",
            );
            rect(c, px + 3, py + 12, 5, 1, "#4b8790");
          } else if (tile === "road") {
            rect(c, px + (hash % 10), py + (hash % 11), 3, 1, "#8e825d");
            rect(c, px + 1, py + 14, 3, 1, "#c8b881");
          } else {
            rect(c, px + (hash % 12), py + 3, 1, 3, "#4b704b");
            if (hash === 4) {
              rect(c, px + 8, py + 8, 2, 2, "#e6cd9a");
              rect(c, px + 10, py + 11, 2, 2, "#b4bfc9");
            }
          }
        }
      if(w.city){const roads=new Set(w.city.roads);for(const tile of w.city.roads){const x=tile%WIDTH,y=Math.floor(tile/WIDTH);if(x<minX||x>=maxX||y<minY||y>=maxY)continue;rect(c,x*T,y*T,T,T,'#bbbaa1');rect(c,x*T+3,y*T+3,10,10,'#596166');for(const [dx,dy]of [[0,-1],[1,0],[0,1],[-1,0]])if(roads.has((y+dy)*WIDTH+x+dx)||w.tiles[(y+dy)*WIDTH+x+dx]==='road')rect(c,x*T+(dx<0?0:dx>0?8:3),y*T+(dy<0?0:dy>0?8:3),dx?8:10,dy?8:10,'#596166');rect(c,x*T+7,y*T+7,2,2,'#decfa0');}}
      for(let y=minY;y<maxY;y++)for(let x=minX;x<maxX;x++){
        const tile=y*WIDTH+x;if(occupiedCityTile(w,tile)||occupiedFarmTile(w,tile))continue;const node=natureAt(w,tile);if(!node){if(w.tiles[tile]==='forest')tree(c,x*T,y*T);continue;}
        if(!resourceReady(w,tile)){rect(c,x*T+5,y*T+10,7,4,node.rock?'#89968b':'#8a6946');continue;}
        const effect=Object.values(w.players).find(q=>q.life?.effect?.tile===tile&&w.life.now-q.life.effect.at<350)?.life?.effect;
        const shake=effect?Math.sin((w.life.now-effect.at)/25)*2:0;
        if(atlas?.complete&&atlas.naturalWidth)prop(c,node.sprite,x*T+shake,y*T,node.rock?23:28);else tree(c,x*T,y*T);
      }
      for(let y=minY;y<maxY;y++)for(let x=minX;x<maxX;x++){const f=flowerAt(w,y*WIDTH+x);if(f)prop(c,f.index,x*T,y*T,18,flowerAtlases[f.season],4,3);}
      for(const plot of w.town?.garden||[]){const h=w.life.houses.find(h=>h.owner===plot.owner);if(!h)continue;const f=FLOWERS_FOR_GARDEN.find(f=>f.id===plot.flower);if(!f)continue;const x=h.x-2+plot.slot%3,y=h.y+2+Math.floor(plot.slot/3);rect(c,x*T+2,y*T+9,12,6,'#796744');prop(c,f.index,x*T,y*T,w.town!.day-plot.plantedDay>=2?19:11,flowerAtlases[f.season],4,3);}
      const built=new Map<string,{x:number;z:number;height:number;block:string}>();
      for(const [key,block] of Object.entries(w.voxels?.edits||{})){if(!block)continue;const [x,y,z]=key.split(',').map(Number);const k=`${x},${z}`,old=built.get(k);if(!old||old.height<y)built.set(k,{x,z,height:y,block});}
      for(const b of built.values()){if(b.x<minX||b.x>=maxX||b.z<minY||b.z>=maxY)continue;rect(c,b.x*T+1,b.z*T-3,14,18,VOXEL_COLORS[b.block as TerrainBlock]);rect(c,b.x*T+2,b.z*T-2,12,4,'#ffffff44');rect(c,b.x*T+2,b.z*T+12,12,2,'#00000044');}
      for(const room of w.voxelRooms||[]){for(const f of room.furniture){const path=assetUrl(furnitureImage(f.item));let img=characterImages.get(path);if(!img){img=new Image();img.src=path;characterImages.set(path,img);}if(img?.complete&&img.naturalWidth)c.drawImage(img,f.x*T,f.y*T-12,24,24);}for(const farm of Object.values(w.farm?.people||{}))for(const pet of farm.pets)if(pet.homeId===room.id&&pet.roomPos)drawFarmSprite(c,'pet',pet.kind,pet.roomPos.x*T+8,pet.roomPos.y*T+15,22);}
      drawFarms(c,w,time,!prefs.reducedMotion,{minX,maxX,minY,maxY});
      for(const h of w.life?.houses||[]){if(h.biome==='snow'||h.biome==='desert')prop(c,h.biome==='snow'?19:20,h.x*T,h.y*T,48);else prop(c,7,h.x*T,h.y*T,48,craftAtlas,4,3);rect(c,h.x*T+5,h.y*T+13,6,3,'#f5d28d');}
      for(const lot of w.city?.lots||[]){if(lot.x<minX||lot.x>=maxX||lot.y<minY||lot.y>=maxY)continue;const b=cityBuilding(lot.kind);if(b&&cityAtlas?.complete&&cityAtlas.naturalWidth){const r=CITY_SPRITES[b.index],size=24,ratio=r[2]/r[3];c.drawImage(cityAtlas,r[0],r[1],r[2],r[3],lot.x*T+8-size*ratio/2,lot.y*T+16-size,size*ratio,size);}if(lot.damage)rect(c,lot.x*T+4,lot.y*T,8,8,'#e66d43');}
      for(const resident of residentsOf(w)){const pos=residentPosition(w,resident.id);if(pos.siteId)continue;if(pos.x<minX||pos.x>=maxX||pos.y<minY||pos.y>=maxY)continue;const custom=w.town?.customResidents?.find(r=>r.id===resident.id),path=custom?.hero?.frames.idle[(prefs.reducedMotion?0:Math.floor(time/240))%Math.max(1,custom.hero.frames.idle.length)]||resident.portrait;let image=characterImages.get(path);if(!image){image=new Image();image.src=assetUrl(path);characterImages.set(path,image);}if(image.complete&&image.naturalWidth){const height=28,width=Math.min(24,height*image.naturalWidth/image.naturalHeight);c.drawImage(image,pos.x*T+8-width/2,pos.y*T+16-height,width,height);}if(prefs.labels&&Math.abs(pos.x-p.x)+Math.abs(pos.y-p.y)<=4){c.fillStyle='#fff0c1';c.font='bold 9px sans-serif';c.textAlign='center';c.fillText(resident.name[languageMode==='ENGLISH'?'en':languageMode==='HIRAGANA'?'hi':'ja'],pos.x*T+8,pos.y*T-15);}}

      for(const q of Object.values(w.players)){
        const work=q.life?.work,effect=q.life?.effect;
        if(work?.kind==='fish'){const x=work.tile%WIDTH*T+8,y=Math.floor(work.tile/WIDTH)*T+8;c.strokeStyle='#ddd3ad';c.lineWidth=.5;c.beginPath();c.moveTo(q.x*T+8,q.y*T+4);c.lineTo(x,y);c.stroke();rect(c,x-1,y+Math.sin(time/130)*1.5,3,3,w.life.now>=work.target?'#ffcf62':'#ec826f');}
        if(effect&&w.life.now-effect.at<600){const x=effect.tile%WIDTH*T+8,y=Math.floor(effect.tile/WIDTH)*T+6,age=(w.life.now-effect.at)/600;for(let i=0;i<6;i++)rect(c,x+Math.cos(i)*age*14,y+Math.sin(i)*age*12,2,2,effect.perfect?'#ffdf7b':'#ddd7bb');}
      }
      const visibleSites = w.sites.filter(s => s.kind !== "fragment" || w.activities.secretsFound.includes(s.id) || Math.abs(s.x-p.x)+Math.abs(s.y-p.y)<=4);
      visibleSites.forEach((s) => landmark(c, s, time));
      Object.values(w.players).filter(p => !p.spectator && !p.life?.indoors)
        .sort((a, b) => a.y - b.y)
        .forEach((q) => person(c, q, prefs.reducedMotion?0:time));
      c.restore();
      if(!overview&&!prefs.reducedMotion){c.save();const weather=season.weather;c.globalAlpha=.55;for(let i=0;i<20;i++){const x=(i*89+time/(season.season===3?55:30))%sw,y=(i*61+time/(weather===2?8:75))%sh;if(weather===2){c.strokeStyle='#afd5e3';c.beginPath();c.moveTo(x,y);c.lineTo(x-3,y+10);c.stroke();}else if(season.season===3&&weather===4){c.fillStyle='#f3f8ed';c.beginPath();c.arc(x,y,2,0,Math.PI*2);c.fill();}else if(season.season===0&&weather===1){c.fillStyle='#edb9c5';c.fillRect(x,y,3,2);}else if(season.season===2&&weather===1){c.fillStyle='#d4aa59';c.fillRect(x,y,3,2);}}if(season.phase===3){c.globalAlpha=.1;c.fillStyle='#152140';c.fillRect(0,0,sw,sh);}c.restore();}
      if (overview&&prefs.labels) {
        c.font='bold 13px sans-serif'; c.textAlign='center';
        for(const biome of BIOMES) {
          const bx=(biome.x*T-cx)*scale,by=((biome.y-12)*T-cy)*scale;
          c.fillStyle='#10202bd9';c.fillRect(bx-65,by-14,130,22);
          c.fillStyle='#fff4d6';c.fillText(trans(biome.name,languageMode),bx,by+2);
        }
      }
      if (!overview && prefs.labels) {
        c.textAlign = "center";
        c.font = "bold 12px sans-serif";
        for(let y=minY;y<maxY;y++)for(let x=minX;x<maxX;x++){const f=flowerAt(w,y*WIDTH+x);if(f)prop(c,f.index,x*T,y*T,18,flowerAtlases[f.season],4,3);}
      for(const plot of w.town?.garden||[]){const h=w.life.houses.find(h=>h.owner===plot.owner);if(!h)continue;const f=FLOWERS_FOR_GARDEN.find(f=>f.id===plot.flower);if(!f)continue;const x=h.x-2+plot.slot%3,y=h.y+2+Math.floor(plot.slot/3);rect(c,x*T+2,y*T+9,12,6,'#796744');prop(c,f.index,x*T,y*T,w.town!.day-plot.plantedDay>=2?19:11,flowerAtlases[f.season],4,3);}
      for(const h of (prefs.labels?w.life?.houses:[])||[]){const x=(h.x*T+8-cx)*scale,y=(h.y*T-34-cy)*scale;if(x<0||x>sw||y<0||y>sh)continue;c.fillStyle='#10272bdd';c.fillRect(x-55,y-13,110,21);c.fillStyle='#ffdc94';c.fillText('⌂ '+h.ownerName,x,y+2);}
        for(const r of w.town?.customResidents||[]){if(w.town?.bonds.some(b=>b.people.includes(r.id)&&(b.houseId||b.visitHouse?.day===w.town?.day)))continue;const x=(r.x*T+8-cx)*scale,y=(r.y*T+25-cy)*scale;if(x<0||x>sw||y<0||y>sh)continue;const width=c.measureText(r.name).width+12;c.fillStyle='#112526d9';c.fillRect(x-width/2,y-12,width,18);c.fillStyle='#e5dcba';c.fillText(r.name,x,y);}
        visibleSites.forEach((s) => {
          const x = (s.x * T + 8 - cx) * scale,
            y = (s.y * T - 33 - cy) * scale;
          if (x < 0 || x > sw || y < 0 || y > sh) return;
          c.fillStyle = "#112526dc";
          const label = trans(getRpgSiteDisplayName(s, visualTheme), languageMode);
          const tw = c.measureText(label).width;
          c.fillRect(x - tw / 2 - 7, y - 12, tw + 14, 20);
          c.fillStyle = s.cleared
            ? "#9db6a1"
            : s.kind === "boss"
              ? "#f1c6a6"
              : "#eee6c5";
          c.fillText(label, x, y + 2);
        });
        Object.values(w.players).filter(q => !q.spectator && !q.life?.indoors).forEach((q) => {
          const x = (q.x * T + 8 - cx) * scale,
            y = (q.y * T + 25 - cy) * scale;
          c.fillStyle = "#112526d9";
          c.fillRect(x - 35, y - 12, 70, 18);
          c.fillStyle = q.id === selfId ? "#ffe3a5" : "#fff";
          c.fillText(q.name, x, y);
        });
      }
      frame = requestAnimationFrame(paint);
    };
    frame = requestAnimationFrame(paint);
    return () => cancelAnimationFrame(frame);
  }, [selfId, overview, languageMode, visualTheme]);
  return (
    <canvas
      ref={ref}
      className="rpg-canvas"
      aria-label={trans(
        "探索マップ。矢印キーまたはWASDで移動し、Eキーで調べます。",
        languageMode,
      )}
      onClick={(e) => {
        const r = e.currentTarget.getBoundingClientRect(),
          v = camera.current;
        const tx = Math.floor((e.clientX-r.left)/v.scale/16+v.x/16);
        const ty = Math.floor((e.clientY-r.top)/v.scale/16+v.y/16);
        const target = Object.values((latest.current as World).players).find(p => p.id !== selfId && p.x === tx && p.y === ty);
        if (target && onPlayer) onPlayer(target.id);
        onTile(
          Math.floor((e.clientX - r.left) / v.scale / 16 + v.x / 16),
          Math.floor((e.clientY - r.top) / v.scale / 16 + v.y / 16),
        );
      }}
    />
  );
}
