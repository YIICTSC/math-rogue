import {useKartQuality} from './KartQuality';
import {kartRenderProfile,type KartQuality} from './performance';
import React, { useEffect, useRef, useState } from 'react';
import { KartScene } from './scene';
import type { Race } from './engine';
export default function KartCanvas({ world, selfId, preview = false,quality:override,onSlowFrame }: { world: Race; selfId: string; preview?: boolean;quality?:KartQuality;onSlowFrame?:()=>void }) {
  const preferred=useKartQuality(),quality=override??preferred;
  const slowFrame=useRef(onSlowFrame);slowFrame.current=onSlowFrame;
  const canvas = useRef<HTMLCanvasElement>(null), state = useRef(world); state.current = world;
  const viewId = useRef(selfId); viewId.current = selfId;
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    let scene: KartScene | null = null, frame = 0, active = true; setFailed(false);
    try {
      scene = new KartScene(canvas.current!, state.current, viewId.current, preview, () => { active = false; setFailed(true); }, quality);
      let lastDraw=0,measured=0,total=0,reported=false;
      const draw = (now: number) => {
        if (!active || !scene) return;
        if(!document.hidden&&now-lastDraw>=1000/kartRenderProfile(quality).fps-1){
          const dt=now-lastDraw;
          if(lastDraw&&dt<5000){measured++;total+=dt;if(measured>=45){if(!reported&&quality!=='minimal'&&!preview&&total/measured>45){reported=true;slowFrame.current?.();}measured=0;total=0;}}
          lastDraw=now;scene.setViewId(viewId.current); scene.setWorld(state.current); scene.draw(now);
        }
        frame = requestAnimationFrame(draw);
      };
      frame = requestAnimationFrame(draw);
    } catch (error) { console.error('Kart renderer initialization failed', error); setFailed(true); }
    return () => { active = false; cancelAnimationFrame(frame); scene?.dispose(); };
  }, [world.course, JSON.stringify(world.customCourse), preview, quality]);
  return <><canvas key={quality} ref={canvas} className="gk-canvas" aria-label="3D race course" />{failed && <div className="gk-render-error" role="alert">3D rendering unavailable. Enable WebGL and reload.<button onClick={() => location.reload()}>Reload</button></div>}</>;
}
