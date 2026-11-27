import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import type { LanguageMode } from '../../types';
import { assetUrl } from '../../utils/assetPaths';
import { creaturePortrait } from './creatureArt';
import { sandboxText } from '../MachineryInspector';

export default function CreaturePreview({kind,languageMode}:{kind:string;languageMode:LanguageMode}) {
  const host=useRef<HTMLDivElement>(null);
  const updateAngle=useRef<(angle:number)=>void>(null);
  const [turn,setTurn]=useState(30);
  const [status,setStatus]=useState<'loading'|'ready'|'image'>('loading');
  useEffect(()=>{
    const root=host.current!;
    const scene=new THREE.Scene(), holder=new THREE.Group();
    const camera=new THREE.PerspectiveCamera(35,1.32,.05,20);
    scene.add(holder,new THREE.HemisphereLight('#edf7ff','#78634c',2.2));
    const sun=new THREE.DirectionalLight('#fff1cc',2.1);
    sun.position.set(-1.3,3,2);
    scene.add(sun);
    let renderer:THREE.WebGLRenderer;
    try {
      renderer=new THREE.WebGLRenderer({antialias:true,alpha:true});
    } catch {
      setStatus('image');
      return;
    }
    let cancelled=false, assets:THREE.Object3D|undefined;
    const dispose=(group:THREE.Object3D)=>{
      const geometries=new Set<THREE.BufferGeometry>(), materials=new Set<THREE.Material>();
      group.traverse(o=>{
        if (!(o instanceof THREE.Mesh)) return;
        geometries.add(o.geometry);
        for (const m of Array.isArray(o.material)?o.material:[o.material]) materials.add(m);
      });
      for(const geometry of geometries) geometry.dispose();
      for(const material of materials) material.dispose();
    };
    renderer.setSize(264,200);
    renderer.setPixelRatio(Math.min(1.5,window.devicePixelRatio||1));
    root.append(renderer.domElement);
    updateAngle.current=(degrees)=>{
      holder.rotation.y=degrees*Math.PI/180;
      renderer.render(scene,camera);
    };
    new GLTFLoader().load(assetUrl('models/storybook/rpg-creatures.glb'),gltf=>{
      if (cancelled) { dispose(gltf.scene); return; }
      assets=gltf.scene;
      const model=gltf.scene.getObjectByName(kind)?.clone(true);
      if (!model) {setStatus('image');return;}
      const bounds=new THREE.Box3().setFromObject(model);
      const center=bounds.getCenter(new THREE.Vector3()),size=bounds.getSize(new THREE.Vector3());
      holder.add(model);
      model.position.sub(center);
      const radius=Math.max(size.x,size.y,size.z)*1.96;
      camera.position.set(0,radius*.35,-radius);
      camera.lookAt(0,.03,0);
      updateAngle.current?.(30);
      setStatus('ready');
    },undefined,()=>{if(!cancelled)setStatus('image');});
    return ()=>{
      cancelled=true;
      updateAngle.current=null;
      if(assets)dispose(assets);
      renderer.dispose();
      renderer.domElement.remove();
    };
  },[kind]);
  const L=(ja:string,en:string,hi:string)=>sandboxText(languageMode,ja,en,hi);
  return <div className="rpg-creature-preview">
    <div ref={host} hidden={status!=='ready'} />
    {status==='image' && <img src={assetUrl(creaturePortrait(kind))} alt="" />}
    {status==='loading' && <p role="status">{L('読み込み中','Loading','よみこみちゅう')}</p>}
    {status==='ready' && <label>
      {L('回転','Rotate','かいてん')}
      <input type="range" min={-180} max={180} value={turn} onChange={e=>{const angle=Number(e.target.value);setTurn(angle);updateAngle.current?.(angle);}} />
    </label>}
  </div>;
}
