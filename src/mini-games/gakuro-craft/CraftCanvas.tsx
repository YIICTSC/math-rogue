import React, { useEffect, useRef } from 'react';
import { SIZE, mature, type World } from './engine';
export const COLORS = ['#ef996b', '#74b9cb', '#b89de0', '#e6c96c', '#91bb79', '#e894ae'];
export default function CraftCanvas({ world, selfId, selected, zoom, onSelect }: { world: World; selfId: string; selected: number; zoom: number; onSelect: (index: number) => void }) {
  const canvas = useRef<HTMLCanvasElement>(null), state = useRef({ world, selfId, selected, zoom });
  const transform = useRef({ ox: 0, oy: 0, tw: 52, th: 26 });
  state.current = { world, selfId, selected, zoom };
  useEffect(() => {
    const c = canvas.current!, ctx = c.getContext('2d')!; let frame = 0, running = true, cx = NaN, cz = NaN, previous = 0;
    const positions = new Map<string, { x: number; z: number }>();
    const poly = (points: number[][], fill: string, stroke?: string) => { ctx.beginPath(); points.forEach(([x,y], i) => i ? ctx.lineTo(x,y) : ctx.moveTo(x,y)); ctx.closePath(); ctx.fillStyle=fill; ctx.fill(); if(stroke){ctx.strokeStyle=stroke;ctx.lineWidth=1;ctx.stroke();} };
    const render = (now: number) => {
      if (!running) return;
      const { world:w, selfId:id, selected:sel, zoom:z } = state.current as {world:World;selfId:string;selected:number;zoom:number}, me=w.players[id];
      const width=c.clientWidth, height=c.clientHeight, dpr=Math.min(devicePixelRatio || 1,2);
      if(c.width!==Math.round(width*dpr)||c.height!==Math.round(height*dpr)){c.width=Math.round(width*dpr);c.height=Math.round(height*dpr);}
      ctx.setTransform(dpr,0,0,dpr,0,0);
      const dt=Math.min(.05,(now-previous)/1000 || .016);previous=now;
      const tw=58*z, th=29*z, night=(1-Math.cos(w.time/120*Math.PI))/2;
      const sky=ctx.createLinearGradient(0,0,0,height);sky.addColorStop(0,night>.7?'#233e64':'#93cad0');sky.addColorStop(1,night>.7?'#3f7883':'#d8edda');ctx.fillStyle=sky;ctx.fillRect(0,0,width,height);
      if(!me){frame=requestAnimationFrame(render);return;}
      for(const p of Object.values(w.players)){const v=positions.get(p.id)||{x:p.x,z:p.z};v.x+=(p.x-v.x)*Math.min(1,dt*16);v.z+=(p.z-v.z)*Math.min(1,dt*16);positions.set(p.id,v);}
      for(const id of positions.keys()) if(!w.players[id])positions.delete(id);
      const mine=positions.get(id)!;if(!Number.isFinite(cx)){cx=mine.x;cz=mine.z;}cx+=(mine.x-cx)*Math.min(1,dt*9);cz+=(mine.z-cz)*Math.min(1,dt*9);
      const ox=width/2-(cx-cz)*tw/2,oy=height*.49-(cx+cz)*th/2;
      transform.current={ox,oy,tw,th};
      const project=(x:number,z:number,h=0)=>[ox+(x-z)*tw/2,oy+(x+z)*th/2-h];
      const diamond=(sx:number,sy:number,a:number,b:number,color:string,stroke?:string)=>poly([[sx,sy-b],[sx+a,sy],[sx,sy+b],[sx-a,sy]],color,stroke);
      const cube=(sx:number,sy:number,a:number,b:number,h:number,top:string,left:string,right:string)=>{
        poly([[sx-a,sy],[sx,sy+b],[sx,sy+b-h],[sx-a,sy-h]],left);poly([[sx,sy+b],[sx+a,sy],[sx+a,sy-h],[sx,sy+b-h]],right);diamond(sx,sy-h,a,b,top);
      };
      const objects:{depth:number;draw:()=>void}[]=[];
      for(let sum=0;sum<SIZE*2;sum++)for(let x=Math.max(0,sum-SIZE+1);x<=Math.min(SIZE-1,sum);x++){
        const zz=sum-x,i=zz*SIZE+x,t=w.tiles[i],[sx,sy]=project(x+.5,zz+.5);
        if(sx < -tw*2||sx>width+tw*2||sy< -90*z||sy>height+150*z)continue;
        const water=t.ground==='water',grass=t.ground==='grass', variation=(x*13+zz*7)%5;
        const top=water?`hsl(184 39% ${49+variation+Math.sin(now/900+x+zz)*2}%)`:grass?`hsl(${99+variation*2} 32% ${56+variation}%)`:'#ddce9a';
        cube(sx,sy,tw/2+.4,th/2+.2,water?3*z:11*z,top,water?'#529fa1':'#987e55',water?'#3c8c99':'#756b48');
        if(water && (x+zz)%3===0){ctx.strokeStyle='#b9e3d077';ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(sx-9*z,sy-6*z);ctx.lineTo(sx+9*z,sy-6*z);ctx.stroke();}
        if(!water&&Math.hypot(x-19.5,zz-19.5)<2.8)diamond(sx,sy-11*z,tw*.43,th*.43,'#c9c498');
        if(grass&&!t.nature&&!t.blocks.length&&t.crop===null&&(i%7===0)){ctx.fillStyle='#eef5c499';ctx.fillRect(sx-5*z,sy-14*z,2*z,3*z);ctx.fillRect(sx+4*z,sy-12*z,2*z,2*z);}
        if(sel===i){ctx.save();ctx.shadowColor='#fffac2';ctx.shadowBlur=12;diamond(sx,sy-12*z,tw*.47,th*.47,'#fff6a655','#fff5be');ctx.restore();}
        if(t.nature||t.blocks.length||t.crop!==null)objects.push({depth:x+zz+1,draw:()=>{
          const base=sy-11*z;ctx.fillStyle='#294d3733';ctx.beginPath();ctx.ellipse(sx+8*z,base+3*z,tw*.34,th*.3,0,0,Math.PI*2);ctx.fill();
          if(t.nature==='tree'){
            cube(sx,base,4*z,3*z,25*z,'#a37e4d','#806042','#594d39');
            cube(sx,base-21*z,21*z,11*z,16*z,'#8cba66','#5d985a','#448066');
            cube(sx-2*z,base-35*z,16*z,9*z,12*z,'#b0d17b','#72aa63','#569067');
            if(i%4===0){ctx.fillStyle='#f8b877';ctx.fillRect(sx+9*z,base-33*z,4*z,4*z);}
          } else if(t.nature==='rock'){cube(sx,base,14*z,9*z,15*z,'#bcc8bd','#879e99','#6f8787');cube(sx-5*z,base-12*z,8*z,5*z,5*z,'#d6ddd0','#a4b4a8','#819693');}
          if(t.crop!==null){diamond(sx,base,tw*.4,th*.4,t.watered?'#6f6950':'#a08760');const grown=mature(w,t),growth=Math.min(1,(w.time-t.crop)/(t.watered?45:90));
            for(const off of [-9,0,9]){ctx.strokeStyle='#496d40';ctx.lineWidth=2*z;ctx.beginPath();ctx.moveTo(sx+off*z,base);ctx.lineTo(sx+off*z,base-(6+growth*13)*z);ctx.stroke();cube(sx+off*z,base-(4+growth*10)*z,4*z,2*z,4*z,grown?'#f5cc6b':'#a5c765','#769647','#5d874d');}
          }
          let h=0;for(const b of t.blocks){
            if(b==='plank'||b==='brick'){cube(sx,base-h,tw*.45,th*.45,13*z,b==='plank'?'#d8b383':'#c2bdab',b==='plank'?'#ad835c':'#929b95',b==='plank'?'#926a48':'#798d8c');ctx.strokeStyle='#ffffff22';ctx.beginPath();ctx.moveTo(sx-tw*.3,base-h-13*z);ctx.lineTo(sx+tw*.1,base-h-7*z);ctx.stroke();h+=13*z;}
            if(b==='flower'){cube(sx,base-h,10*z,6*z,7*z,'#bc8065','#a26c57','#83584b');for(const k of [-6,3,8]){ctx.fillStyle=k===3?'#fff1a5':'#ed9da0';ctx.beginPath();ctx.arc(sx+k*z,base-h-15*z,5*z,0,Math.PI*2);ctx.fill();}}
            if(b==='bench'){cube(sx,base-h,17*z,7*z,11*z,'#d8ae78','#a8835c','#967348');cube(sx-6*z,base-h-9*z,14*z,3*z,10*z,'#e9c990','#b89564','#a47b53');}
            if(b==='lamp'){cube(sx,base-h,3*z,2*z,28*z,'#74745d','#6c6e5c','#555d53');ctx.save();ctx.shadowColor='#ffdd8f';ctx.shadowBlur=18+night*24;cube(sx,base-h-27*z,7*z,4*z,10*z,'#ffefbd','#efc67d','#e0ab68');ctx.restore();}
          }
        }});
      }
      // Shared village square: a permanent parcel stand and warm beacon.
      const [bx,by]=project(20,20,11*z);objects.push({depth:40,draw:()=>{cube(bx,by,15*z,8*z,15*z,'#e6c286','#ae8359','#8b7252');cube(bx,by-15*z,17*z,9*z,4*z,'#8aa7a0','#648b84','#557e79');ctx.fillStyle='#fff5c2';ctx.font=`bold ${12*z}px sans-serif`;ctx.textAlign='center';ctx.fillText('★',bx,by-20*z);}});
      for(const p of Object.values(w.players)){
        const pos=positions.get(p.id)!,tile=w.tiles[Math.floor(pos.z)*SIZE+Math.floor(pos.x)],h=(tile?.blocks.length||0)*13*z;
        const [sx,sy]=project(pos.x,pos.z,11*z+h);if(sx< -80||sx>width+80||sy< -80||sy>height+80)continue;
        objects.push({depth:pos.x+pos.z+.08,draw:()=>{
          const color=COLORS[p.color]||COLORS[0],moving=Math.hypot(p.x-pos.x,p.z-pos.z)>.02,bob=moving?Math.sin(now/75)*1.5*z:Math.sin(now/700+p.color)*.5*z;
          ctx.fillStyle='#253f403b';ctx.beginPath();ctx.ellipse(sx,sy,11*z,5*z,0,0,Math.PI*2);ctx.fill();
          if(p.id===id)diamond(sx,sy,14*z,7*z,'#fff7c744','#fff4b1');
          cube(sx-4*z,sy-bob,3*z,2*z,8*z,'#557b80','#385762','#29434d');cube(sx+4*z,sy+bob,3*z,2*z,8*z,'#557b80','#385762','#29434d');
          cube(sx,sy-7*z,8*z,4*z,13*z,color,color,'#667b77');cube(sx,sy-20*z,7*z,4*z,11*z,'#ffdcad','#edbe8e','#dca87e');cube(sx,sy-30*z,9*z,5*z,4*z,color,color,'#827969');
          ctx.fillStyle='#40515a';ctx.fillRect(sx+2*z,sy-26*z,2*z,2*z);
          ctx.font=`600 ${Math.max(10,11*z)}px sans-serif`;ctx.textAlign='center';ctx.lineWidth=3;ctx.strokeStyle='#f7fbef';ctx.strokeText(p.name,sx,sy-44*z);ctx.fillStyle='#294d4a';ctx.fillText(p.name,sx,sy-44*z);
        }});
      }
      objects.sort((a,b)=>a.depth-b.depth).forEach(o=>o.draw());
      ctx.fillStyle=`rgba(25,39,76,${night*.19})`;ctx.fillRect(0,0,width,height);
      // Soft edge shade keeps the play area readable without obscuring tiles.
      const vignette=ctx.createRadialGradient(width/2,height/2,Math.min(width,height)*.2,width/2,height/2,Math.max(width,height)*.7);vignette.addColorStop(0,'#123d4000');vignette.addColorStop(1,'#123d4044');ctx.fillStyle=vignette;ctx.fillRect(0,0,width,height);
      frame=requestAnimationFrame(render);
    };frame=requestAnimationFrame(render);return()=>{running=false;cancelAnimationFrame(frame);};
  },[]);
  return <canvas ref={canvas} className="gc-canvas" aria-label="Craft island" onPointerDown={e=>{if(e.button!==0)return;const r=e.currentTarget.getBoundingClientRect(),{ox,oy,tw,th}=transform.current,sx=e.clientX-r.left-ox,sy=e.clientY-r.top-oy+11*state.current.zoom,x=Math.floor(sx/tw+sy/th),z=Math.floor(sy/th-sx/tw);if(x>=0&&z>=0&&x<SIZE&&z<SIZE)onSelect(z*SIZE+x);}} />;
}
