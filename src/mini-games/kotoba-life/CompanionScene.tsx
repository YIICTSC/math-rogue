import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import type { LanguageMode } from '../../types';
import { animateCompanion, COMPANION_PALETTES, createCompanion, type CompanionId } from './companionModels';

export interface CompanionSceneProps {
  characterId: CompanionId;
  reaction: string;
  reactionKey?: number;
  town?: boolean;
  reducedMotion?: boolean;
  onPet?: () => void;
  speaking?: boolean;
  languageMode?: LanguageMode;
}

/** A live, transparent 3D companion over the photographic room or street. */
export default function CompanionScene(props: CompanionSceneProps) {
  const host = useRef<HTMLDivElement>(null);
  const latest = useRef(props); latest.current = props;
  const [fallback, setFallback] = useState(false);
  const [contextRevision, setContextRevision] = useState(0);

  useEffect(() => {
    const element = host.current;
    if (!element) return;
    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, powerPreference: 'low-power' });
    } catch {
      setFallback(true);
      return;
    }
    setFallback(false);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75));
    renderer.setClearColor(0x000000, 0);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.12;
    const canvas = renderer.domElement;
    canvas.setAttribute('aria-hidden', 'true');
    Object.assign(canvas.style, { width: '100%', height: '100%', display: 'block', touchAction: 'manipulation' });
    element.prepend(canvas);
    const scene = new THREE.Scene();
    scene.add(new THREE.HemisphereLight('#fff5e5', '#8d8092', 2.3));
    const key = new THREE.DirectionalLight('#fff1dc', 3.0); key.position.set(-3, 5, 4); scene.add(key);
    const fill = new THREE.DirectionalLight('#d6edff', 1.3); fill.position.set(4, 2, 1); scene.add(fill);
    const rim = new THREE.DirectionalLight('#fff6e9', 2.0); rim.position.set(1, 4, -3); scene.add(rim);
    const camera = new THREE.OrthographicCamera(-2, 2, 1.75, -1.75, .1, 30);
    camera.position.set(0, 1.68, 6); camera.lookAt(0, 1.25, 0);
    const model = createCompanion(props.characterId);
    scene.add(model.root);
    const shadowCanvas = document.createElement('canvas'); shadowCanvas.width = shadowCanvas.height = 128;
    const ctx = shadowCanvas.getContext('2d');
    if (ctx) {
      const gradient = ctx.createRadialGradient(64, 64, 5, 64, 64, 64);
      gradient.addColorStop(0, 'rgba(43,35,31,.30)'); gradient.addColorStop(.4, 'rgba(43,35,31,.18)'); gradient.addColorStop(1, 'rgba(43,35,31,0)');
      ctx.fillStyle = gradient; ctx.fillRect(0, 0, 128, 128);
    }
    const shadowTexture = new THREE.CanvasTexture(shadowCanvas);
    const shadowMaterial = new THREE.MeshBasicMaterial({ map: shadowTexture, transparent: true, depthWrite: false });
    const shadowGeometry = new THREE.PlaneGeometry(2.0, 1.18);
    const shadow = new THREE.Mesh(shadowGeometry, shadowMaterial);
    shadow.rotation.x = -Math.PI / 2; shadow.position.y = -.015; scene.add(shadow);
    let visible = true, lost = false, disposed = false, frame = 0;
    let lastTime = performance.now(), animationTime = 0, reactionStart = 0, previousReaction = '', previousKey: number | undefined;
    let lastTown: boolean | undefined;
    const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    let prefersReducedMotion = motionQuery.matches;
    const motionChange = () => { prefersReducedMotion = motionQuery.matches; };
    motionQuery.addEventListener('change', motionChange);
    const sizeScene = () => {
      const { width, height } = element.getBoundingClientRect();
      if (width < 1 || height < 1) return;
      renderer.setSize(width, height, false);
      const aspect = width / height;
      const sceneHeight = aspect < .55 ? 3.85 : 3.5;
      camera.left = -sceneHeight * aspect / 2; camera.right = -camera.left;
      camera.top = sceneHeight / 2; camera.bottom = -camera.top; camera.updateProjectionMatrix();
      const town = !!latest.current.town;
      const characterScale = props.characterId === 'momo' ? .84 : 1;
      model.root.scale.setScalar(characterScale * (town ? .82 : 1));
      model.root.position.x = town ? -sceneHeight * aspect * .23 : 0;
      shadow.position.x = model.root.position.x; shadow.scale.setScalar(town ? .80 : 1);
      lastTown = town;
    };
    const resizeObserver = new ResizeObserver(sizeScene); resizeObserver.observe(element); sizeScene();
    const visibilityObserver = typeof IntersectionObserver === 'undefined' ? null : new IntersectionObserver(entries => {
      visible = entries[0]?.isIntersecting ?? true;
      if (visible) start(); else { cancelAnimationFrame(frame); frame = 0; }
    });
    visibilityObserver?.observe(element);
    const render = (now: number) => {
      frame = 0;
      if (disposed || lost || !visible || document.hidden) return;
      animationTime += Math.min((now - lastTime) / 1000, .05); lastTime = now;
      const p = latest.current;
      if (p.reaction !== previousReaction || p.reactionKey !== previousKey) {
        previousReaction = p.reaction; previousKey = p.reactionKey; reactionStart = animationTime;
      }
      if (!!p.town !== lastTown) sizeScene();
      animateCompanion(model, animationTime, p.reaction, animationTime - reactionStart, p.reducedMotion ?? prefersReducedMotion);
      model.mouth.scale.y = p.speaking ? .65 + Math.abs(Math.sin(animationTime * 18)) * 1.35 : 1;
      renderer.render(scene, camera);
      frame = requestAnimationFrame(render);
    };
    function start() {
      if (!frame && !disposed && !lost && visible && !document.hidden) { lastTime = performance.now(); frame = requestAnimationFrame(render); }
    }
    const visibilityChange = () => {
      if (document.hidden) { cancelAnimationFrame(frame); frame = 0; } else start();
    };
    const onLost = (event: Event) => { event.preventDefault(); lost = true; cancelAnimationFrame(frame); frame = 0; setFallback(true); };
    const onRestored = () => { if (!disposed) setContextRevision(value => value + 1); };
    canvas.addEventListener('webglcontextlost', onLost); canvas.addEventListener('webglcontextrestored', onRestored);
    document.addEventListener('visibilitychange', visibilityChange);
    const pointerStart = { x: 0, y: 0 };
    const raycaster = new THREE.Raycaster(), point = new THREE.Vector2();
    const onPointerDown = (event: PointerEvent) => { pointerStart.x = event.clientX; pointerStart.y = event.clientY; };
    const onPointerUp = (event: PointerEvent) => {
      if (Math.hypot(event.clientX - pointerStart.x, event.clientY - pointerStart.y) > 12) return;
      const rect = canvas.getBoundingClientRect();
      point.set(((event.clientX - rect.left) / rect.width) * 2 - 1, -((event.clientY - rect.top) / rect.height) * 2 + 1);
      raycaster.setFromCamera(point, camera);
      if (raycaster.intersectObject(model.body, true).length) latest.current.onPet?.();
    };
    canvas.addEventListener('pointerdown', onPointerDown); canvas.addEventListener('pointerup', onPointerUp);
    start();
    return () => {
      disposed = true; cancelAnimationFrame(frame); resizeObserver.disconnect(); visibilityObserver?.disconnect();
      motionQuery.removeEventListener('change', motionChange); document.removeEventListener('visibilitychange', visibilityChange);
      canvas.removeEventListener('webglcontextlost', onLost); canvas.removeEventListener('webglcontextrestored', onRestored);
      canvas.removeEventListener('pointerdown', onPointerDown); canvas.removeEventListener('pointerup', onPointerUp);
      model.dispose(); shadowTexture.dispose(); shadowMaterial.dispose(); shadowGeometry.dispose(); renderer.dispose(); renderer.forceContextLoss(); canvas.remove();
    };
  }, [props.characterId, contextRevision]);

  const english = props.languageMode === 'ENGLISH';
  const petLabel = english ? 'Pet your friend' : 'なでる';
  return <div ref={host} className="kotoba-companion-scene" data-character={props.characterId} data-renderer={fallback ? 'fallback' : 'webgl'} style={{ position: 'absolute', inset: 0 }}>
    {fallback && <div style={{ position: 'absolute', left: props.town ? '26%' : '50%', bottom: '13%', width: props.town ? 'min(37%, 260px)' : 'min(64%, 340px)', height: '68%', transform: 'translateX(-50%)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
      <FallbackCompanion characterId={props.characterId} reaction={props.reaction} onPet={props.onPet} label={petLabel} />
    </div>}
    {props.onPet && !fallback && <button type="button" className="kotoba-pet-keyboard" aria-label={petLabel} onClick={props.onPet}
      style={{ position: 'absolute', left: props.town ? '26%' : '50%', bottom: '10%', transform: 'translateX(-50%)', width: 48, height: 32, opacity: 0, border: 'none', borderRadius: 16, pointerEvents: 'none' }}
      onFocus={event => { event.currentTarget.style.opacity = '1'; event.currentTarget.style.pointerEvents = 'auto'; }}
      onBlur={event => { event.currentTarget.style.opacity = '0'; event.currentTarget.style.pointerEvents = 'none'; }}>
      {petLabel}
    </button>}
  </div>;
}

function FallbackCompanion({ characterId, reaction, onPet, label }: { characterId: CompanionId; reaction: string; onPet?: () => void; label: string }) {
  const p = COMPANION_PALETTES[characterId];
  const rabbit = characterId === 'momo', fox = characterId === 'kohaku', penguin = characterId === 'pico';
  return <button type="button" aria-label={label} onClick={onPet} style={{ border: 0, background: 'transparent', padding: 0, width: '100%', maxHeight: '100%', cursor: 'pointer' }}>
    <svg viewBox="0 0 240 320" role="img" aria-label={label} style={{ width: '100%', maxHeight: '100%', filter: 'drop-shadow(0 8px 12px #3a24142a)' }}>
      <ellipse cx="120" cy="298" rx="70" ry="11" fill="#584837" opacity=".16" />
      <ellipse cx="120" cy="226" rx="62" ry="67" fill={p.fur} />
      <ellipse cx="120" cy="233" rx="44" ry="48" fill={p.cream} />
      <ellipse cx="78" cy="283" rx="25" ry="16" fill={penguin ? p.ear : p.fur} /><ellipse cx="162" cy="283" rx="25" ry="16" fill={penguin ? p.ear : p.fur} />
      <ellipse cx="58" cy="216" rx="17" ry="38" fill={p.fur} transform="rotate(14 58 216)" /><ellipse cx="182" cy="216" rx="17" ry="38" fill={p.fur} transform={`rotate(${reaction === 'wave' ? -65 : -14} 182 216)`} />
      {!penguin && (fox ? <><path d="M59 112 L58 45 L99 91Z" fill={p.fur}/><path d="M141 91 L182 45 L181 112Z" fill={p.fur}/></> : <><ellipse cx="77" cy={rabbit ? 58 : 92} rx={rabbit ? 18 : 22} ry={rabbit ? 52 : 23} fill={p.fur} transform="rotate(-10 77 75)" /><ellipse cx="163" cy={rabbit ? 58 : 92} rx={rabbit ? 18 : 22} ry={rabbit ? 52 : 23} fill={p.fur} transform="rotate(10 163 75)" /></>)}
      <ellipse cx="120" cy="140" rx="74" ry="64" fill={p.fur} />
      <ellipse cx="120" cy="162" rx="51" ry="30" fill={p.cream} />
      {[91, 149].map(x => <g key={x}><ellipse cx={x} cy="135" rx="7" ry={reaction === 'sleep' ? 2 : 10} fill="#43362e"/><circle cx={x - 2} cy="132" r="2" fill="#fff" /></g>)}
      <ellipse cx="120" cy="155" rx={penguin ? 15 : 8} ry="6" fill={penguin ? p.ear : '#806151'} />
      <path d="M109 170 Q120 181 131 170" fill="none" stroke="#806151" strokeWidth="3" strokeLinecap="round" />
      <ellipse cx="74" cy="157" rx="11" ry="5" fill="#eab7aa" /><ellipse cx="166" cy="157" rx="11" ry="5" fill="#eab7aa" />
      <path d="M83 195 Q120 210 157 195 L151 208 Q120 220 87 208Z" fill={p.accent} /><path d="M147 201 L162 234 L142 235Z" fill={p.accent} />
    </svg>
  </button>;
}
