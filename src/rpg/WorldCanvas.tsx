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
const atlas = typeof Image !== 'undefined' ? new Image() : null; if(atlas)atlas.src = assetUrl('/sprites/rpg/frontier-atlas.webp');
function prop(c:CanvasRenderingContext2D,index:number,x:number,y:number,size=27){if(atlas?.complete&&atlas.naturalWidth)c.drawImage(atlas,index%6*atlas.naturalWidth/6,Math.floor(index/6)*atlas.naturalHeight/4,atlas.naturalWidth/6,atlas.naturalHeight/4,x+8-size/2,y+17-size,size,size);}
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
  const source = p.profile?.image;
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
function landmark(c: CanvasRenderingContext2D, s: Site, time: number) {
  const x = s.x * T + 8,
    y = s.y * T + 8;
  if (s.kind === 'story') {
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
      const w: World = latest.current,
        p = w.players[selfId];
      if (!p) return;
      const sw = canvas.clientWidth,
        sh = canvas.clientHeight;
      canvas.width = Math.max(1, Math.round(sw));
      canvas.height = Math.max(1, Math.round(sh));
      const scale = overview
        ? Math.min(sw / (WIDTH * T), sh / (HEIGHT * T))
        : sw < 600
          ? 2
          : 3;
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
      for(let y=minY;y<maxY;y++)for(let x=minX;x<maxX;x++){
        const tile=y*WIDTH+x,node=natureAt(w,tile);if(!node)continue;
        if(!resourceReady(w,tile)){rect(c,x*T+5,y*T+10,7,4,node.rock?'#89968b':'#8a6946');continue;}
        const effect=Object.values(w.players).find(q=>q.life?.effect?.tile===tile&&w.life.now-q.life.effect.at<350)?.life?.effect;
        const shake=effect?Math.sin((w.life.now-effect.at)/25)*2:0;
        if(atlas?.complete&&atlas.naturalWidth)prop(c,node.sprite,x*T+shake,y*T,node.rock?23:28);else tree(c,x*T,y*T);
      }
      for(const h of w.life?.houses||[])prop(c,h.biome==='snow'?19:h.biome==='desert'?20:18,h.x*T,h.y*T,48);
      for(const q of Object.values(w.players)){
        const work=q.life?.work,effect=q.life?.effect;
        if(work?.kind==='fish'){const x=work.tile%WIDTH*T+8,y=Math.floor(work.tile/WIDTH)*T+8;c.strokeStyle='#ddd3ad';c.lineWidth=.5;c.beginPath();c.moveTo(q.x*T+8,q.y*T+4);c.lineTo(x,y);c.stroke();rect(c,x-1,y+Math.sin(time/130)*1.5,3,3,w.life.now>=work.target?'#ffcf62':'#ec826f');}
        if(effect&&w.life.now-effect.at<600){const x=effect.tile%WIDTH*T+8,y=Math.floor(effect.tile/WIDTH)*T+6,age=(w.life.now-effect.at)/600;for(let i=0;i<6;i++)rect(c,x+Math.cos(i)*age*14,y+Math.sin(i)*age*12,2,2,effect.perfect?'#ffdf7b':'#ddd7bb');}
      }
      const visibleSites = w.sites.filter(s => s.kind !== "fragment" || w.activities.secretsFound.includes(s.id) || Math.abs(s.x-p.x)+Math.abs(s.y-p.y)<=4);
      visibleSites.forEach((s) => landmark(c, s, time));
      Object.values(w.players).filter(p => !p.spectator && !p.life?.indoors)
        .sort((a, b) => a.y - b.y)
        .forEach((q) => person(c, q, time));
      c.restore();
      if (overview) {
        c.font='bold 13px sans-serif'; c.textAlign='center';
        for(const biome of BIOMES) {
          const bx=(biome.x*T-cx)*scale,by=((biome.y-12)*T-cy)*scale;
          c.fillStyle='#10202bd9';c.fillRect(bx-65,by-14,130,22);
          c.fillStyle='#fff4d6';c.fillText(trans(biome.name,languageMode),bx,by+2);
        }
      }
      if (!overview) {
        c.textAlign = "center";
        c.font = "bold 12px sans-serif";
        for(const h of w.life?.houses||[]){const x=(h.x*T+8-cx)*scale,y=(h.y*T-34-cy)*scale;if(x<0||x>sw||y<0||y>sh)continue;c.fillStyle='#10272bdd';c.fillRect(x-55,y-13,110,21);c.fillStyle='#ffdc94';c.fillText('⌂ '+h.ownerName,x,y+2);}
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
