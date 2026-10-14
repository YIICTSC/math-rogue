import { useStorybookQuality } from '../../three/StorybookQuality';
import React, { useEffect, useRef, useState } from 'react';
import { KartScene } from './scene';
import type { Race } from './engine';
export default function KartCanvas({ world, selfId, preview = false }: { world: Race; selfId: string; preview?: boolean }) {
  const quality=useStorybookQuality();
  const canvas = useRef<HTMLCanvasElement>(null), state = useRef(world); state.current = world;
  const viewId = useRef(selfId); viewId.current = selfId;
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    let scene: KartScene | null = null, frame = 0, active = true; setFailed(false);
    try {
      scene = new KartScene(canvas.current!, state.current, viewId.current, preview, () => { active = false; setFailed(true); }, quality);
      const draw = (now: number) => { if (!active || !scene) return; scene.setViewId(viewId.current); scene.setWorld(state.current); scene.draw(now); frame = requestAnimationFrame(draw); };
      frame = requestAnimationFrame(draw);
    } catch (error) { console.error('Kart renderer initialization failed', error); setFailed(true); }
    return () => { active = false; cancelAnimationFrame(frame); scene?.dispose(); };
  }, [world.course, JSON.stringify(world.customCourse), preview, quality]);
  return <><canvas ref={canvas} className="gk-canvas" aria-label="3D race course" />{failed && <div className="gk-render-error" role="alert">3D rendering unavailable. Enable WebGL and reload.<button onClick={() => location.reload()}>Reload</button></div>}</>;
}
