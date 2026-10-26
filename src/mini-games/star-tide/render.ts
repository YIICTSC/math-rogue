import { forageNodes, campPosition, towerPosition } from './wild';
import { circuitTargets } from './circuitPuzzles';
import { traceBeam } from './beamPuzzles';
import { World, W, H, key } from './engine';
import { biomeFor, ENEMIES, heroFrame, visualHash, type HeroId } from './visuals';
import { enemyFrame } from './enemyAI';
import { sceneryFor, terrainCell } from './scenery';
import { corners, roundedPath } from './rounding';
import { weaponAction } from './combat';
import {WIND_LAUNCH, SKY_RETURN, SKY_CHEST, SKY_UPDRAFTS, skyPlatforms} from './sky';

export type Graphics = {
  heroes: Record<HeroId, HTMLImageElement>;
  vertical: Record<HeroId, HTMLImageElement>;
  walk: HTMLImageElement;
  profile: HTMLImageElement;
  combo: HTMLImageElement;
  tools: HTMLImageElement;
  flight: HTMLImageElement;
  sky: HTMLImageElement;
  enemies: HTMLImageElement[];
  terrain: HTMLImageElement;
  props: HTMLImageElement;
  bossMotion: HTMLImageElement;
  floors: HTMLImageElement;
  shoreR: HTMLImageElement;
  cliffR: HTMLImageElement;
};

function cell(ctx: CanvasRenderingContext2D, img: HTMLImageElement | undefined, columns: number, rows: number,
  col: number, row: number, x: number, y: number, width: number, height = width, flip = false) {
  if (!img?.complete || !img.naturalWidth) return false;
  const sw = img.naturalWidth / columns, sh = img.naturalHeight / rows;
  ctx.save();
  ctx.translate(Math.round(x + (flip ? width : 0)), Math.round(y));
  if (flip) ctx.scale(-1, 1);
  ctx.drawImage(img, col * sw, row * sh, sw, sh, 0, 0, width, height);
  ctx.restore();
  return true;
}

function paintSky(ctx:CanvasRenderingContext2D,w:World,graphics?:Graphics){
 const dusk=[4,6,10].includes(w.s.chapter),gradient=ctx.createLinearGradient(0,0,0,224);
 gradient.addColorStop(0,dusk?'#263d68':'#6da7bd');gradient.addColorStop(1,dusk?'#a7b7d2':'#d8ece4');ctx.fillStyle=gradient;ctx.fillRect(0,0,320,224);
 for(let i=0;i<8;i++){ctx.globalAlpha=.2+(i%3)*.1;cell(ctx,graphics?.sky,4,4,0,0,(i*67+w.time*(2+i%3))%400-60,14+i*28,60+(i%3)*20);}
 ctx.globalAlpha=1;
 for(const[left,top,right,bottom]of skyPlatforms(w.s.chapter))cell(ctx,graphics?.sky,4,4,1,0,left*16-2,top*16,(right-left+1)*16+4,(bottom-top+1)*16+28);
 for(let y=1;y<13;y++)for(let x=1;x<19;x++)if(w.map[y][x]===0){
  ctx.save();const path=roundedPath(x*16,y*16,corners(w.map,x,y,0));ctx.clip(path,'evenodd');
  ctx.fillStyle='#82a77b';ctx.fillRect(x*16,y*16,16,16);
  cell(ctx,graphics?.floors,6,4,(w.s.chapter*2)%6,Math.floor(w.s.chapter*2/6),Math.floor(x/4)*64,Math.floor(y/4)*64,64);
  ctx.restore();
 }
 const object=(index:number,x:number,y:number,size:number)=>cell(ctx,graphics?.sky,4,4,index%4,Math.floor(index/4),x*16-size/2,y*16-size*.85,size);
 object(6,SKY_RETURN.x,SKY_RETURN.y,30);object(3,17.5,3.9,40);
 object(w.s.skyTreasures.includes(w.s.chapter)?5:4,SKY_CHEST.x,SKY_CHEST.y,25);
 for(const p of SKY_UPDRAFTS){object(7,p.x,p.y,42);ctx.strokeStyle='#c0fff4aa';ctx.lineWidth=1;for(let i=0;i<3;i++){const r=7+((w.time*10+i*5)%16);ctx.beginPath();ctx.ellipse(p.x*16,p.y*16-r*.5,r,r*.35,0,0,Math.PI*2);ctx.stroke();}}
 object(11,2.5,8.5,15);object(11,12.5,11.5,15);object(12,8.5,6.5,18);
}

function paintScene(ctx: CanvasRenderingContext2D, w: World, atlas: HTMLImageElement,
  ground?: HTMLImageElement, bosses?: HTMLImageElement, wild?: HTMLImageElement, graphics?: Graphics) {
  ctx.setTransform(ctx.canvas.width / 320, 0, 0, ctx.canvas.height / 224, 0, 0);
  ctx.imageSmoothingEnabled = false;
  ctx.globalAlpha = 1;
  ctx.font = '8px monospace';
  ctx.fillStyle = '#101c2c';
  ctx.fillRect(0, 0, 320, 224);
  const sprite = (col: number, row: number, x: number, y: number, size = 16) => {
    if (!cell(ctx, atlas, 8, 8, col, row, x, y, size)) {
      ctx.fillStyle = row === 2 ? '#5b8971' : '#f3cf8c'; ctx.fillRect(x, y, size, size);
    }
  };
  const prop = (index: number, x: number, y: number, size = 20) => {
    cell(ctx, wild, 4, 4, index % 4, Math.floor(index / 4), x - size / 2, y - size / 2, size);
  };
  const shadow = (x: number, y: number, size = 8, alpha = .25) => {
    ctx.fillStyle = `rgba(8,20,27,${alpha})`;
    ctx.beginPath(); ctx.ellipse(x * 16, y * 16 + 3, size, size * .3, 0, 0, Math.PI * 2); ctx.fill();
  };
  const biome = biomeFor(w.s.chapter, w.s.room), indoor = !w.inSky && w.s.room >= 8;
  if(w.inSky)paintSky(ctx,w,graphics);
  if(!w.inSky){
  if (!graphics?.terrain.naturalWidth && ground?.naturalWidth) {
    cell(ctx, ground, 4, 3, w.s.chapter % 4, Math.floor(w.s.chapter / 4), 0, 0, 320, 224);
  }
  if (graphics?.floors.naturalWidth && !indoor) {
    const index = biome.row * 2 + biome.variant;
    for (let y = 0; y < 224; y += 64) for (let x = 0; x < 320; x += 64)
      cell(ctx, graphics.floors, 6, 4, index % 6, Math.floor(index / 6), x, y, 64);
    // Worn lanes are continuous trails rather than isolated patches at logic markers.
    if (w.s.room % 2 === 0) {
      ctx.save(); ctx.beginPath();
      ctx.rect(16, 116, 288, 7); ctx.rect(165, 16, 7, 192); ctx.clip(); ctx.globalAlpha = .5;
      for (let y = 0; y < 224; y += 64) for (let x = 0; x < 320; x += 64)
        cell(ctx, graphics.terrain, 8, 12, 3, biome.row, x, y, 64);
      ctx.restore();
    }
  } else if (graphics?.terrain.naturalWidth && indoor) {
    for (let y = 0; y < 224; y += 64) for (let x = 0; x < 320; x += 64)
      cell(ctx, graphics.terrain, 8, 12, 6, biome.row, x, y, 64);
  }
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const code = w.map[y][x], material = terrainCell(w.s.chapter, w.s.room, code, x, y);
    const shaped = [2,3,6].includes(code), shape = shaped ? corners(w.map,x,y,code) : [];
    const path = shaped ? roundedPath(x*16,y*16,shape) : null;
    ctx.save();
    if(path)ctx.clip(path,'evenodd');
    if (material < 0) {
      ctx.fillStyle = '#111225'; ctx.fillRect(x * 16, y * 16, 16, 16);
      ctx.fillStyle = '#847ba24a'; ctx.fillRect(x * 16, y * 16, 16, 2);
    } else if ((!indoor && [0,1,5].includes(code) && graphics?.floors.naturalWidth
      || !indoor && code === 3 && x > 0 && x < W-1 && y > 0 && y < H-1 && graphics?.props.naturalWidth
      || indoor && ![2,3,7].includes(code) && graphics?.terrain.naturalWidth)) {
      // Quiet floor is a coherent large patch; objects and hazards occupy their own layers.
    } else if (!cell(ctx, graphics?.terrain, 8, 12, material, biome.row,
      code===2?Math.floor(x/4)*64:x*16, code===2?Math.floor(y/4)*64:y*16, code===2?64:16)) {
      if (!ground?.naturalWidth || ![0, 1, 5].includes(code)) sprite(code, 2, x * 16, y * 16);
    }
    if (code === 2) {
      ctx.fillStyle = '#e0ffff50';
      const phase = (w.time * 5 + x * 3 + y) % 12;
      ctx.fillRect(x * 16 + 2 + phase * .5, y * 16 + 5 + phase * .3, 5, .6);
    }
    ctx.restore();
    if(shaped){
      const trim=code===2?graphics?.shoreR:code===3?graphics?.cliffR:undefined;
      // Separate convex/concave R artwork follows the actual neighboring cells.
      for(let i=0;i<4;i++)if(shape[i]!=='flat'){
        const col=i+(shape[i]==='inner'?4:0),qx=x*16+(i%2?8:0),qy=y*16+(i>=2?8:0);
        const outer=shape[i]==='outer',r=outer?6.4:3.52;
        const cx=x*16+(i%2?16:0)+(outer?(i%2?-r:r):0);
        const cy=y*16+(i>=2?16:0)+(outer?(i>=2?-r:r):0);
        const a=outer?[Math.PI,Math.PI*1.5,Math.PI/2,0][i]:[0,Math.PI/2,Math.PI*1.5,Math.PI][i];
        ctx.save();ctx.strokeStyle=code===2?w.s.chapter===5?'#e7a264':'#cee2b9':code===6?'#70967577':'#a2aca38f';
        ctx.lineWidth=1.5;ctx.beginPath();ctx.arc(cx,cy,r,a,a+Math.PI/2);ctx.stroke();
        if(trim?.naturalWidth){
          // Use the generated rocky/sandy texture only along the seam's exact arc.
          // This keeps small corner artwork from becoming detached islands or icons.
          const band=new Path2D();band.arc(cx,cy,r+.9,a,a+Math.PI/2);
          band.arc(cx,cy,Math.max(.1,r-.9),a+Math.PI/2,a,true);band.closePath();ctx.clip(band);
          cell(ctx,trim,8,12,col,biome.row,qx,qy,8);
        }
        ctx.restore();
      }
      // Straight shores meet the curved quarters without outlining internal tile seams.
      if(code===2){
        ctx.strokeStyle=w.s.chapter===5?'#f1aa62aa':'#dbedcca0';ctx.lineWidth=.8;ctx.beginPath();
        if(w.map[y-1]?.[x]!==code){ctx.moveTo(x*16+(shape[0]==='outer'?6.4:0),y*16+.4);ctx.lineTo(x*16+16-(shape[1]==='outer'?6.4:0),y*16+.4);}
        if(w.map[y+1]?.[x]!==code){ctx.moveTo(x*16+(shape[2]==='outer'?6.4:0),y*16+15.6);ctx.lineTo(x*16+16-(shape[3]==='outer'?6.4:0),y*16+15.6);}
        if(w.map[y]?.[x-1]!==code){ctx.moveTo(x*16+.4,y*16+(shape[0]==='outer'?6.4:0));ctx.lineTo(x*16+.4,y*16+16-(shape[2]==='outer'?6.4:0));}
        if(w.map[y]?.[x+1]!==code){ctx.moveTo(x*16+15.6,y*16+(shape[1]==='outer'?6.4:0));ctx.lineTo(x*16+15.6,y*16+16-(shape[3]==='outer'?6.4:0));}
        ctx.stroke();
      }
    }
    if (!indoor && code === 0 && visualHash(w.s.chapter, w.s.room, x, y) % 29 === 0) {
      cell(ctx, graphics?.props, 8, 12, 3, biome.row, x * 16 + 2, y * 16 + 4, 12);
    }
  }
  if(w.s.room===0){ctx.globalAlpha=w.gliderUnlocked?1:.5;cell(ctx,graphics?.sky,4,4,2,0,WIND_LAUNCH.x*16-18,WIND_LAUNCH.y*16-26,36);ctx.globalAlpha=1;}
  }
 if(w.circuit){circuitTargets.forEach((p,i)=>{ctx.fillStyle=w.circuit!.bits&(1<<i)?'#ffdd7b':'#234c63';ctx.fillRect(p.x*16-7,p.y*16-7,14,14);ctx.strokeStyle='#b3e8dc';ctx.strokeRect(p.x*16-7,p.y*16-7,14,14);ctx.fillStyle='#0c2832';ctx.fillText(String(i+1),p.x*16-4,p.y*16+3);});}
 if(w.ice){for(let y=0;y<9;y++)for(let x=0;x<9;x++){ctx.fillStyle=w.ice.walls.has(`${x},${y}`)?'#345779':'#a6e6ed';ctx.fillRect((x+6)*16,(y+2)*16,16,16);ctx.strokeStyle='#72a4be';ctx.strokeRect((x+6)*16,(y+2)*16,16,16);}sprite(7,3,(w.ice.goal.x+6)*16,(w.ice.goal.y+2)*16);sprite(0,5,(w.ice.x+6)*16,(w.ice.y+2)*16);sprite(4,3,64,96);}
 if(w.beam){sprite(4,3,w.beam.start.x*16,w.beam.start.y*16);const trace=traceBeam(w.beam);ctx.strokeStyle='#ffe3a2';ctx.lineWidth=2;ctx.beginPath();trace.path.forEach((p,i)=>i?ctx.lineTo(p.x*16,p.y*16):ctx.moveTo(p.x*16,p.y*16));ctx.stroke();sprite(7,3,w.beam.goal.x*16,w.beam.goal.y*16);for(const [i,m] of w.beam.mirrors.entries()){ctx.fillStyle='#ffe4a2';ctx.fillText(String(i+1),m.x*16+5,m.y*16-2);ctx.fillStyle='#243f53';ctx.fillRect(m.x*16,m.y*16,16,16);ctx.strokeStyle='#a6e9ef';ctx.beginPath();ctx.moveTo(m.x*16+3,m.y*16+(m.slash?13:3));ctx.lineTo(m.x*16+13,m.y*16+(m.slash?3:13));ctx.stroke();}}
 if(w.blocks){for(const p of w.blocks.goals){ctx.fillStyle='#ffe6a4';ctx.strokeStyle='#f5e0a6';ctx.strokeRect(p.x*16+2,p.y*16+2,12,12);}for(const p of w.blocks.boxes)sprite(3,3,p.x*16,p.y*16,16);}
 if(!w.inSky&&w.s.room<8){forageNodes.forEach((p,i)=>{if(!w.s.foraged.includes(key(w.s)+':'+i))prop([2,3,4][(w.s.chapter+w.s.room+i)%3],p.x*16,p.y*16,18);});if([0,4].includes(w.s.room)){ctx.globalAlpha=w.weather==='rain'&&w.s.room!==0?.45:1;prop(1,campPosition.x*16,campPosition.y*16,28);ctx.globalAlpha=1;}if(w.s.room===0){prop(12,towerPosition.x*16,towerPosition.y*16,32);prop(15,40,168,28);}if(w.barrel)prop(8,w.barrel.x*16,w.barrel.y*16,22);}
 for(const f of w.fires){ctx.fillStyle=w.weather==='rain'?'#559ab7':'#fcab50';ctx.beginPath();ctx.arc(f.x*16,f.y*16,5+Math.sin(w.time*13)*2,0,Math.PI*2);ctx.fill();}
 if(!w.inSky&&w.s.room>=8){ctx.fillStyle='#19273b22';ctx.fillRect(0,0,320,224);}
 const solved=w.s.solved.includes(key(w.s));(w.blocks||w.beam||w.circuit||w.ice?[]:w.targets).forEach(([x,y],i)=>{ctx.globalAlpha=w.s.room%4===3&&!solved?(Math.sin(w.time*2)>.2?1:.25):solved||i===w.switches.length?1:.4;sprite(solved?7:4,3,x*16-8,y*16-8);ctx.globalAlpha=1;ctx.fillStyle='#fff4c8';ctx.fillText(String(i+1),x*16-2,y*16-10);});
 if(!w.inSky&&!w.s.chests.includes(key(w.s)))sprite(3,3,80,144);

 if(!w.inSky&&w.s.room===23)sprite(7,3,280,96,24);
 for(const p of w.shots){ctx.fillStyle=p.friendly?'#fbd781':'#e38bb1';if(p.friendly){ctx.save();ctx.translate(p.x*16,p.y*16-18);ctx.rotate(Math.atan2(p.vy,p.vx));sprite(p.kind===1?2:p.kind===2?3:4,6,-8,-8,16);ctx.restore();}else{ctx.beginPath();ctx.arc(p.x*16,p.y*16,2,0,7);ctx.fill();}}
 if(w.hintTarget){ctx.strokeStyle='#68eeed';ctx.lineWidth=2;ctx.strokeRect(w.hintTarget.x*16-9,w.hintTarget.y*16-9,18,18);}
  const entities: { y: number; draw: () => void }[] = [];
  if (!w.inSky && graphics?.props.naturalWidth) for (const p of sceneryFor(w)) entities.push({ y: p.y, draw: () => {
    shadow(p.x, p.y - .2, p.size * .3, .14);
    // The canopy fades only when the player is immediately behind it.
    if (w.y < p.y && Math.abs(w.x - p.x) < .9 && p.y - w.y < 1.9) ctx.globalAlpha = .5;
    cell(ctx, graphics.props, 8, 12, p.cell, p.row, p.x * 16 - p.size / 2, p.y * 16 - p.size * 88 / 96, p.size);
    ctx.globalAlpha = 1;
  }});
  if (w.npc) { const npc = w.npc; entities.push({ y: npc.y, draw: () => {
    shadow(npc.x, npc.y, 7); sprite((w.s.chapter + w.s.room) % 8, 7, npc.x * 16 - 14, npc.y * 16 - 22, 28);
  }}); }
  for (const e of w.enemies) entities.push({ y: e.y, draw: () => {
    const profile = ENEMIES[e.kind] || ENEMIES[0];
    const boss = Boolean(e.boss), sz = boss ? 58 : 30;
    const bob = !boss && ['orbit', 'hop'].includes(profile.behavior)
      ? Math.max(0, Math.sin(e.phase * (profile.behavior === 'hop' ? 5 : 3))) * 3 : 0;
    shadow(e.x, e.y, boss ? 16 : 7);
    if ((e.windup || 0) > 0 || boss && e.cool < .3) {
      ctx.strokeStyle = '#ffbb70'; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.ellipse(e.x * 16, e.y * 16 + 2, boss ? 19 : 11, boss ? 6 : 4, 0, 0, Math.PI * 2); ctx.stroke();
      if (profile.behavior === 'charge' && !boss) {
        ctx.save(); ctx.translate(e.x * 16, e.y * 16); ctx.rotate(e.aim ?? 0);
        ctx.fillStyle = '#ed9a6940'; ctx.fillRect(0, -4, 48, 8); ctx.restore();
      }
    }
    if ((e.flash || 0) > 0) ctx.globalAlpha = .55 + Math.sin(e.flash! * 80) * .2;
    const frame = boss ? (e.strike || 0) > 0 ? 2 : e.cool < .35 ? 1 : Math.floor(e.phase * 2) % 2 ? 3 : 0 : enemyFrame(e);
    let drawn = false;
    if (boss) drawn = cell(ctx, graphics?.bossMotion, 8, 6, w.s.chapter % 2 * 4 + frame,
      Math.floor(w.s.chapter / 2), e.x * 16 - sz / 2, e.y * 16 - sz * 88 / 96, sz, sz, e.facing === -1);
    else drawn = cell(ctx, graphics?.enemies[profile.sheet], 6, 8, frame, profile.row,
      e.x * 16 - sz / 2, e.y * 16 - sz * 88 / 96 - bob, sz, sz, e.facing === -1);
    if (!drawn) {
      if (boss && bosses?.naturalWidth) cell(ctx, bosses, 4, 3, w.s.chapter % 4,
        Math.floor(w.s.chapter / 4), e.x * 16 - 24, e.y * 16 - 36, 48);
      else sprite(e.kind % 8, 4, e.x * 16 - 11, e.y * 16 - 18, 22);
    }
    ctx.globalAlpha = 1;
    if (w.guarded(e)) {
      ctx.strokeStyle = '#9ddde6aa'; ctx.lineWidth = 1.3;
      ctx.beginPath(); ctx.arc(e.x * 16, e.y * 16 - 14, 22, e.phase, e.phase + Math.PI * 1.5); ctx.stroke();
    }
    const barY = e.y * 16 - (boss ? 50 : 28);
    ctx.fillStyle = '#15222ccc'; ctx.fillRect(e.x * 16 - (boss ? 20 : 10), barY, boss ? 40 : 20, 2);
    ctx.fillStyle = boss ? '#f6c587' : '#f2ae80';
    ctx.fillRect(e.x * 16 - (boss ? 20 : 10), barY, (boss ? 40 : 20) * Math.max(0, e.hp / e.max), 2);
  }});
  entities.push({ y: w.y, draw: () => {
    shadow(w.x, w.y, w.gliding ? 6 : 8, w.gliding ? .14 : .28);
    const flight=w.gliding&&Boolean(graphics?.flight.naturalWidth);
    const motion = flight?{sheet:'flight',columns:6,rows:4,row:Math.abs(w.dy)>Math.abs(w.dx)?w.dy<0?1:0:w.dx<0?3:2,frame:Math.floor(w.walk*9)%6,flip:false}:heroFrame(w), base=motion.sheet==='base', size=flight?84:base?36:48;
    const sheet = base?graphics?.heroes.nagi:graphics?.[motion.sheet as 'walk'|'profile'|'combo'|'tools'|'flight'];
    if (w.hurt > 0 && !(w.attack>0&&w.activeWeapon===6) && Math.floor(w.time * 15) % 2) ctx.globalAlpha = .5;
    if (w.gliding&&!flight) prop(0, w.x * 16, w.y * 16 - 24, 43);
    if (!cell(ctx, sheet, motion.columns, motion.rows, motion.frame, motion.row,
      w.x * 16 - size / 2, w.y * 16 - size * (base?88/96:120/128) - (w.gliding ? 7 : 0), size, size, motion.flip)) {
      sprite(w.dy < -.4 ? 3 : w.dx > .4 ? 6 : 0, w.dx < -.4 ? 1 : 0, w.x * 16 - 16, w.y * 16 - 23, 32);
    }
    ctx.globalAlpha = 1;
    if (w.attack > 0) {
      const t = Math.max(0,Math.min(1,1-w.attack/w.attackDuration)), tool = w.activeWeapon;
      const angle=Math.atan2(w.dy,w.dx), finisher=w.combo===2, profile=weaponAction(tool);
      const drive=Math.sin(Math.min(1,t/.7)*Math.PI), swing=(w.combo===1?1-t:t)*2-1;
      ctx.save(); ctx.translate(w.x*16,w.y*16-18); ctx.rotate(angle);
      ctx.lineCap='round'; ctx.lineJoin='round';
      // Weapons have their own directional layer; hands and body stay reusable.
      if(tool===0) {
        if(finisher) ctx.translate(drive*12,0); else { const arc=t<.28?-.2-t/.28*1.3:t<.62?-1.5+(t-.28)/.34*2: .5-(t-.62)/.38*.7;ctx.rotate(w.combo===1?-arc:arc); }
        ctx.fillStyle='#9cc8d2';ctx.strokeStyle='#e8ffff';ctx.lineWidth=1;
        ctx.beginPath();ctx.moveTo(8,-2);ctx.lineTo(29,0);ctx.lineTo(8,2);ctx.closePath();ctx.fill();ctx.stroke();
        ctx.strokeStyle='#eac178';ctx.beginPath();ctx.moveTo(8,-4);ctx.lineTo(8,4);ctx.moveTo(3,0);ctx.lineTo(8,0);ctx.stroke();
        ctx.globalAlpha=drive*.8;ctx.strokeStyle=finisher?'#ffe6a2':'#b7fcf4';ctx.lineWidth=3;
        ctx.beginPath();if(finisher){ctx.moveTo(12,0);ctx.lineTo(36,0);}else ctx.arc(0,0,29,-.8,.8);ctx.stroke();
      } else if(tool===4) {
        const lift=t<.38?-.6-t/.38*1.2:t<.58?-1.8+(t-.38)/.2*2.25:.45-(t-.58)/.42*.7;ctx.rotate(lift);
        ctx.strokeStyle='#87583b';ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(3,0);ctx.lineTo(23,0);ctx.stroke();
        ctx.fillStyle='#8faeb7';ctx.strokeStyle='#e8d6a1';ctx.lineWidth=1;ctx.fillRect(21,-7,9,14);ctx.strokeRect(21,-7,9,14);
        if(t>.38){ctx.globalAlpha=(1-t)*.8;ctx.strokeStyle='#ffd496';ctx.beginPath();ctx.ellipse(25,0,5+t*20,3+t*8,0,0,Math.PI*2);ctx.stroke();}
      } else if(tool===6) {
        ctx.translate(drive*(finisher?9:4),0);ctx.fillStyle='#538aa9bb';ctx.strokeStyle='#d4fff6';ctx.lineWidth=2;
        ctx.beginPath();ctx.ellipse(12,0,5,13,0,0,Math.PI*2);ctx.fill();ctx.stroke();ctx.strokeStyle='#fce9a6';ctx.beginPath();ctx.arc(12,-1,6,-1.1,1.1);ctx.stroke();
      } else if(tool===7 || tool===3) {
        const extension=drive*(finisher?21:12);ctx.translate(extension,0);
        if(tool===7&&w.combo===1)ctx.rotate(swing*.9);
        ctx.strokeStyle=tool===7?'#aa7850':'#accbc8';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(-8,0);ctx.lineTo(25,0);ctx.stroke();
        ctx.fillStyle='#e6fbf7';ctx.beginPath();ctx.moveTo(33,0);ctx.lineTo(23,-4);ctx.lineTo(25,0);ctx.lineTo(23,4);ctx.closePath();ctx.fill();
        if(tool===3){ctx.strokeStyle='#aeeedd';ctx.beginPath();ctx.arc(26,1,5,-Math.PI,0);ctx.stroke();}
        ctx.globalAlpha=drive*.65;ctx.strokeStyle='#fff0b3';ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(10,0);ctx.lineTo(38,0);ctx.stroke();
      } else if(tool===5) {
        ctx.strokeStyle='#d2ab75';ctx.lineWidth=2;ctx.beginPath();ctx.arc(8,0,13,-1.35,1.35);ctx.stroke();
        ctx.strokeStyle='#ecf4dd';ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(11,-13);ctx.lineTo(11-drive*8,0);ctx.lineTo(11,13);ctx.stroke();
        if(t<.45){ctx.beginPath();ctx.moveTo(3-drive*8,0);ctx.lineTo(25-drive*8,0);ctx.stroke();}
      } else if(tool===1) {
        ctx.translate(10+drive*9,0);ctx.rotate(t*8);ctx.strokeStyle='#b9faea';ctx.lineWidth=3;ctx.beginPath();ctx.ellipse(0,0,7,4,0,0,Math.PI*2);ctx.stroke();
      } else {
        ctx.strokeStyle='#a17f58';ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(1,0);ctx.lineTo(24,0);ctx.stroke();ctx.fillStyle='#ffe8a7';ctx.beginPath();ctx.arc(25,0,4,0,Math.PI*2);ctx.fill();
        ctx.globalAlpha=drive;ctx.strokeStyle='#ffb36a';ctx.lineWidth=2;ctx.beginPath();ctx.arc(25,0,6+drive*4,0,Math.PI*2);ctx.stroke();
      }
      ctx.restore();
    }
    if (w.moving && !w.gliding && w.attack <= 0) {
      ctx.fillStyle = indoor ? '#a6c5d444' : biome.particle + '66';
      const step = w.walk * 6 % 1; ctx.fillRect(w.x * 16 - w.dx * 7 - step * 4, w.y * 16 + 2, 2 - step, 1);
    }
  }});
  entities.sort((a, b) => a.y - b.y).forEach(e => e.draw());
  for (const f of w.fx) {
    const t = 1 - f.life / f.max;
    ctx.fillStyle = f.color; ctx.globalAlpha = 1 - t;
    for (let i = 0; i < 7; i++) {
      const a = i * Math.PI * 2 / 7 + f.seed;
      ctx.fillRect(f.x * 16 + Math.cos(a) * t * 18, f.y * 16 - 5 + Math.sin(a) * t * 13 - t * 5, 2, 2);
    }
    ctx.globalAlpha = 1;
  }
  // Light tint and restrained particles retain contrast in the combat center.
  ctx.fillStyle = indoor ? '#111c3024' : biome.row === 6 || biome.row === 10 ? '#25244b20' : '#fff0c508';
  ctx.fillRect(0, 0, 320, 224);
  if (w.weather === 'rain' && !indoor) {
    ctx.strokeStyle = '#bdddec88'; ctx.lineWidth = .6;
    for (let i = 0; i < 35; i++) {
      const x = (i * 47 + w.time * 28) % 320, y = (i * 31 + w.time * 95) % 224;
      ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x - 3, y + 7); ctx.stroke();
    }
  } else {
    ctx.fillStyle = biome.particle + (indoor ? '44' : 'aa');
    const count = indoor ? 6 : 15;
    for (let i = 0; i < count; i++) {
      const n = visualHash(w.s.chapter, w.s.room, i, 29);
      const x = ((n % 320) + w.time * (w.weather === 'wind' ? 15 : 2) + Math.sin(w.time + i) * 6) % 320;
      const y = ((n % 211) + w.time * (biome.row === 4 ? 9 : biome.row === 5 ? -6 : 1) + 224) % 224;
      ctx.globalAlpha = .3 + Math.sin(w.time * 2 + i) * .2;
      ctx.fillRect(x, y, biome.row === 3 ? 2 : 1, biome.row === 4 ? 1.5 : 1);
    }
    ctx.globalAlpha = 1;
  }
  // Soft edge shade frames the room, never darkening the interactable center.
  const vignette = ctx.createRadialGradient(160, 112, 95, 160, 112, 195);
  vignette.addColorStop(0, '#07151e00'); vignette.addColorStop(1, '#07151e44');
  ctx.fillStyle = vignette; ctx.fillRect(0, 0, 320, 224);
  ctx.fillStyle = '#091422bd'; ctx.fillRect(0, 0, 320, 13);
  ctx.fillStyle = '#f6ecc9'; ctx.font = '8px monospace';
  ctx.fillText(w.inSky?`SKY   ${w.s.chapter+1} / 12`:`${w.s.chapter + 1} / 12   ${w.s.room + 1} / 24`, 6, 9);
}

const scenes = new WeakMap<HTMLCanvasElement, HTMLCanvasElement>();
/** Keep world proportions intact while a phone viewport fills its available area.
 * Wider/taller views crop the room and follow the player; simulation coordinates
 * stay unchanged, including all puzzle and touch-input positions.
 */
export function render(ctx: CanvasRenderingContext2D, w: World, atlas: HTMLImageElement,
  ground?: HTMLImageElement, bosses?: HTMLImageElement, wild?: HTMLImageElement, graphics?: Graphics) {
  let scene = scenes.get(ctx.canvas);
  if (!scene) {
    scene = document.createElement('canvas'); scene.width = 640; scene.height = 448;
    scenes.set(ctx.canvas, scene);
  }
  const sceneContext = scene.getContext('2d');
  if (!sceneContext) return;
  paintScene(sceneContext, w, atlas, ground, bosses, wild, graphics);
  const width = ctx.canvas.width, height = ctx.canvas.height;
  const scale = Math.max(width / 320, height / 224);
  const viewWidth = width / scale, viewHeight = height / scale;
  const x = Math.max(0, Math.min(320 - viewWidth, w.x * 16 - viewWidth / 2));
  const y = Math.max(0, Math.min(224 - viewHeight, w.y * 16 - 7 - viewHeight / 2));
  ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalAlpha = 1; ctx.imageSmoothingEnabled = false;
  ctx.clearRect(0, 0, width, height);
  ctx.drawImage(scene, x * 2, y * 2, viewWidth * 2, viewHeight * 2, 0, 0, width, height);
}
