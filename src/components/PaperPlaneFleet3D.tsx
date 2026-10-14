import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { assetUrl } from '../utils/assetPaths';

export interface PlaneVisualPart {
    type: 'CANNON' | 'ENGINE' | 'EMPTY' | 'MISSILE' | 'SHIELD' | 'AMPLIFIER';
    name: string;
    slots: { req: string; value: number | null }[];
    specialEffect?: string;
}
interface PlaneVisualState {
    airframe?: string;
    parts: PlaneVisualPart[];
    yOffset: number;
}
interface Props {
    player: PlaneVisualState;
    enemy?: PlaneVisualState;
    attacking?: boolean;
    preview?: boolean;
}

// Pure descriptors deliberately ignore instance IDs and loaded card values.
// Swapping/evolving equipment updates the model; playing a card never rebuilds it.
export function moduleVisual(part: PlaneVisualPart) {
    const kind = part.type.toLowerCase();
    let variant = 0;
    if (part.type === 'CANNON') variant = /連|ガトリング|散弾/.test(part.name) ? 2 : part.slots.length > 1 ? 1 : 0;
    if (part.type === 'MISSILE') variant = part.slots.length > 1 ? 1 : 0;
    if (part.type === 'SHIELD') variant = part.specialEffect === 'THORNS' ? 2 : /装甲|板|壁/.test(part.name) ? 1 : 0;
    if (part.type === 'ENGINE') variant = /ソーラー|帆/.test(part.name) ? 2 : part.slots.length > 1 ? 1 : 0;
    if (part.type === 'AMPLIFIER') variant = /指揮|司令|通信/.test(part.name) ? 2 : part.slots.length > 1 ? 1 : 0;
    const enhanced = /\+$/.test(part.name);
    const color = enhanced ? 0xffbf38 : part.slots.some(s => s.req === 'ORANGE') ? 0xff7535
        : part.slots.some(s => s.req === 'BLUE') ? 0x48bdff : part.type === 'SHIELD' ? 0x67efb3 : 0xb4d9ec;
    return { model: `module_${kind}_${variant}`, color, enhanced };
}

export function airframeVisual(airframe?: string, enemy = false) {
    if (!enemy) return airframe === 'SHIP_SPEED' ? 'hull_notebook' : airframe === 'SHIP_POWER' ? 'hull_card' : 'hull_flyer';
    if (/王|要塞|マザー|戦艦|司令|城/.test(airframe || '')) return 'enemy_fortress';
    if (/迎撃|カッター|彫刻|ドローン/.test(airframe || '')) return 'enemy_interceptor';
    if (/爆撃|タンク|戦車|ワゴン|ローラー/.test(airframe || '')) return 'enemy_bomber';
    return 'enemy_scout';
}

export function fleetSignature(plane: PlaneVisualState) {
    return JSON.stringify([plane.airframe, plane.parts.map(p => p.type === 'EMPTY' ? null : [p.name, moduleVisual(p)])]);
}

export function moduleSocket(slot: number, enemy = false) {
    // Battle-grid columns always run left to right on screen. Enemy hulls
    // face left, so both local horizontal axes must reverse before rotation.
    const column = enemy ? 2 - slot % 3 : slot % 3;
    const row = Math.floor(slot / 3);
    const x = -1.65 + column * .94;
    const y = row === 1 ? .74 - (x + 2.35) / 5.05 * .61 : .16;
    const z = (row - 1) * 1.05 * (enemy ? -1 : 1);
    return { x, y, z };
}

function disposeLibrary(root: THREE.Object3D) {
    const geometries = new Set<THREE.BufferGeometry>();
    const materials = new Set<THREE.Material>();
    root.traverse(o => { if (o instanceof THREE.Mesh) { geometries.add(o.geometry); (Array.isArray(o.material) ? o.material : [o.material]).forEach(m => materials.add(m)); } });
    geometries.forEach(g => g.dispose()); materials.forEach(m => m.dispose());
}

export default function PaperPlaneFleet3D(props: Props) {
    const mount = useRef<HTMLDivElement>(null);
    const current = useRef(props); current.current = props;
    const [ready, setReady] = useState(false);
    useEffect(() => {
        const host = mount.current;
        if (!host) return;
        setReady(false);
        let stopped = false, failed = false, frame = 0, library: THREE.Object3D | undefined;
        let renderer: THREE.WebGLRenderer;
        try { renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, powerPreference: 'low-power' }); }
        catch { return; }
        renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
        renderer.outputColorSpace = THREE.SRGBColorSpace;
        renderer.toneMapping = THREE.ACESFilmicToneMapping;
        renderer.toneMappingExposure = 1.1;
        renderer.setClearColor(0x000000, 0);
        renderer.domElement.style.cssText = 'width:100%;height:100%;display:block';
        host.appendChild(renderer.domElement);
        const scene = new THREE.Scene();
        const camera = new THREE.OrthographicCamera(-8, 8, 5, -5, .1, 100);
        camera.position.set(0, 7, 9); camera.lookAt(0, 0, 0);
        scene.add(new THREE.HemisphereLight(0xe5f4ff, 0x556781, 1.4));
        const key = new THREE.DirectionalLight(0xffefd5, 3); key.position.set(2, 8, 4); scene.add(key);
        const rim = new THREE.DirectionalLight(0x78c9ff, 1.3); rim.position.set(-5, 3, -5); scene.add(rim);
        const playerRoot = new THREE.Group(), enemyRoot = new THREE.Group(); scene.add(playerRoot, enemyRoot);
        const signatures = ['', ''];
        const cloneMaterials = [new Set<THREE.Material>(), new Set<THREE.Material>()];
        const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
        let width = 0, height = 0, previous = 0;
        const resize = () => {
            width = host.clientWidth; height = host.clientHeight;
            if (!width || !height) return;
            renderer.setSize(width, height, false);
            const halfWidth = props.preview ? 3.65 : 7.5;
            const halfHeight = Math.max(props.preview ? 2.5 : 3.1, halfWidth * height / width);
            const fittedWidth = halfHeight * width / height;
            camera.left = -fittedWidth; camera.right = fittedWidth; camera.top = halfHeight; camera.bottom = -halfHeight;
            camera.updateProjectionMatrix();
        };
        const observer = new ResizeObserver(resize); observer.observe(host); resize();
        const loseContext = (e: Event) => { e.preventDefault(); failed = true; setReady(false); };
        renderer.domElement.addEventListener('webglcontextlost', loseContext);
        const rebuild = (root: THREE.Group, plane: PlaneVisualState, index: number) => {
            const signature = fleetSignature(plane);
            if (!library || signatures[index] === signature) return;
            signatures[index] = signature; root.clear();
            cloneMaterials[index].forEach(m => m.dispose()); cloneMaterials[index].clear();
            const attach = (name: string, color?: number) => {
                const source = library!.getObjectByName(name);
                if (!source) throw new Error(`Missing paper-plane mesh: ${name}`);
                const copy = source.clone(true);
                copy.traverse(o => {
                    if (!(o instanceof THREE.Mesh)) return;
                    const wasArray = Array.isArray(o.material);
                    const materials = (wasArray ? o.material : [o.material]) as THREE.MeshStandardMaterial[];
                    const tinted = materials.map((mat: THREE.MeshStandardMaterial) => {
                        const result = mat.clone(); cloneMaterials[index].add(result);
                        if (color !== undefined && (mat.name === 'ModuleAccent' || mat.name === 'EnergyCore')) {
                            result.color.setHex(color);
                            if (mat.name === 'EnergyCore') result.emissive.setHex(color);
                        }
                        return result;
                    });
                    o.material = wasArray ? tinted : tinted[0];
                });
                root.add(copy); return copy;
            };
            // Enemy names keep a stable livery through save/load, independent of turn/stage.
            const hash = Array.from(plane.airframe || 'enemy').reduce((a, c) => (a * 31 + c.charCodeAt(0)) >>> 0, 0);
            const colors = [0xe65754, 0xad76e8, 0xe8a641, 0x5ebfa6, 0x658ded, 0xda70ac];
            attach(airframeVisual(plane.airframe, index === 1), index === 1 ? colors[hash % colors.length] : undefined);
            plane.parts.slice(0, 9).forEach((part, slot) => {
                if (part.type === 'EMPTY') return;
                const visual = moduleVisual(part), copy = attach(visual.model, visual.color);
                copy.name = `slot_${slot}_${part.name}`;
                const socket = moduleSocket(slot, index === 1);
                copy.position.set(socket.x, socket.y, socket.z);
                copy.scale.setScalar(visual.enhanced ? .88 : .8);
            });
            host.dataset[index ? 'enemyModel' : 'playerModel'] = airframeVisual(plane.airframe, index === 1);
            host.dataset[index ? 'enemyModules' : 'playerModules'] = String(plane.parts.filter(p => p.type !== 'EMPTY').length);
            host.dataset[index ? 'enemyEquipment' : 'playerEquipment'] = signature;
        };
        const render = (now: number) => {
            if (stopped || failed) return;
            frame = requestAnimationFrame(render);
            if (document.hidden || !width || !height || now - previous < 33) return;
            previous = now;
            const state = current.current;
            try {
                rebuild(playerRoot, state.player, 0);
                if (state.enemy) rebuild(enemyRoot, state.enemy, 1);
                enemyRoot.visible = !!state.enemy;
                const bob = reduced.matches ? 0 : Math.sin(now * .0018) * .09;
                const bank = reduced.matches ? 0 : Math.sin(now * .001) * .025;
                const offsetScale = (camera.top - camera.bottom) * .16 / (7 / Math.sqrt(130));
                playerRoot.position.set(props.preview ? 0 : -3.65, bob, props.preview ? 0 : (state.player.yOffset - 1) * offsetScale);
                enemyRoot.position.set(3.65, -bob, ((state.enemy?.yOffset ?? 1) - 1) * offsetScale);
                playerRoot.rotation.set(bank, props.preview ? -.2 : -.05, state.attacking && !reduced.matches ? -.07 : 0);
                enemyRoot.rotation.set(-bank, Math.PI + .05, 0);
                renderer.render(scene, camera);
            } catch { failed = true; setReady(false); }
        };
        new GLTFLoader().load(assetUrl('models/paper-plane/fleet.glb'), gltf => {
            if (stopped) { disposeLibrary(gltf.scene); return; }
            library = gltf.scene; setReady(true); frame = requestAnimationFrame(render);
        }, undefined, () => { if (!stopped) setReady(false); });
        return () => {
            stopped = true; cancelAnimationFrame(frame); observer.disconnect();
            renderer.domElement.removeEventListener('webglcontextlost', loseContext);
            cloneMaterials.forEach(set => set.forEach(m => m.dispose()));
            if (library) disposeLibrary(library);
            renderer.dispose(); renderer.forceContextLoss(); renderer.domElement.remove();
        };
    }, [props.preview]);
    return <div ref={mount} aria-hidden="true" data-paper-fleet={ready ? 'ready' : 'fallback'}
        className={props.preview ? 'relative w-full h-full pointer-events-none' : 'absolute inset-0 pointer-events-none z-0'}>
        {!ready && <div className="absolute inset-0 flex items-center justify-around opacity-40">
            <span className="text-cyan-300 text-8xl">➤</span>{props.enemy && <span className="text-rose-300 text-8xl rotate-180">➤</span>}
        </div>}
    </div>;
}
