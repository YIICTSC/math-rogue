import {furnitureImage,furnitureSize,furnishing} from './homeCatalog';
import {plotPosition} from './farm/land';
import VoxelLookStick from './VoxelLookStick';
import {trans} from '../utils/textUtils';
import type {LanguageMode} from '../types';
import {energyOf} from './energy';
import {BLOCKS,blockAt,protectedVoxel,terrainHeight,oasisCenters,playerHeight,solid,miningCost,MIN_DEPTH,MAX_HEIGHT,EYE_HEIGHT,VOXEL_COLORS,type TerrainBlock,type Block,type VoxelAction} from './voxel';
import {MATERIAL_NAMES} from './life';
import {GLTFLoader} from 'three/examples/jsm/loaders/GLTFLoader.js';
import { StorybookModels, type Placement, type StorybookModel } from '../three/storybookModels';
import { configureStorybook, paintedSurface, storybookAtmosphere, storybookWater } from '../three/storybookStyle';
import {storyForSite} from './stories';
import { residentsOf } from "./town/residents";
import { residentPosition } from "./town/worldResidents";
import React, { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import type { World } from "./engine";
import { WIDTH, HEIGHT } from "./engine";
import { biomeAt, biomeSurface } from "./biomes";
import { natureAt } from "./life";
import { occupiedCityTile } from "./city/model";
import { occupiedFarmTile } from "./farm/model";
import { animalPose } from "./lifestyle/animalMotion";
import { getRoamingNpcEvent } from "./roamingNpcs";
import { landmark } from "./WorldCanvas";
import { flowerAtlas } from "./town/catalog";
import { calendar, flowerAt } from "./town/model";
import { farmImage } from "./farm/Sprite";
import { assetUrl } from "../utils/assetPaths";
import { compassAngle, shortestTurn } from "./worldViewMath";
import { useRpgPreferences } from "./preferences";
import "./world3d.css";
export interface SceneProps {
  languageMode?:LanguageMode;
  onVoxelAction?:(a:VoxelAction)=>void;
  onEnergyRequest?:()=>void;
  hiddenActors?: string[];
  presentation?: "conversation";
  world: World;
  selfId: string;
  onTile: (x: number, y: number) => void;
  onPlayer?: (id: string) => void;
  facing: number;
  onFacing: (n: number) => void;
  onUnavailable: () => void;
}
/** First-person presentation of the authoritative grid; never maintains a second simulation. */
export default function WorldScene3D(props: SceneProps) {
  const [slots,setSlots]=useState<Block[]>(()=>{try{const a=JSON.parse(localStorage.getItem('rpg-voxel-slots-v1')||'null');if(Array.isArray(a)&&a.length===4&&a.every(b=>BLOCKS.includes(b)))return a;}catch{}return ['wood','stone','dirt','plank'];}),[selectedSlot,setSelectedSlot]=useState(0),[editSlot,setEditSlot]=useState(false),[pitch,setPitch]=useState(-.18),[target,setTarget]=useState<{block:TerrainBlock;cost:number}|null>(null);
  const selected=slots[selectedSlot],building=!!props.onVoxelAction&&props.presentation!=='conversation';
  useEffect(()=>{try{localStorage.setItem('rpg-voxel-slots-v1',JSON.stringify(slots));}catch{}},[slots]);
  const buildRef=useRef({building,selected,pitch});buildRef.current={building,selected,pitch};
  const host = useRef<HTMLDivElement>(null),
    latest = useRef(props),
    prefs = useRpgPreferences(),
    options = useRef(prefs);
  latest.current = props;
  options.current = prefs;
  useEffect(() => {
    const element = host.current!;
    let disposed = false,
      raf = 0,
      renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({
        antialias: prefs.mapQuality !== "low",
        alpha: false,
        powerPreference:
          prefs.mapQuality === "high" ? "high-performance" : "default",
      });
    } catch {
      props.onUnavailable();
      return;
    }
    renderer.setPixelRatio(
      Math.min(devicePixelRatio, prefs.mapQuality === "low" ? 1 : 1.5),
    );
    const profile=configureStorybook(renderer,prefs.mapQuality);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.08;
    renderer.shadowMap.enabled = profile.shadows;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.domElement.dataset.testid = "rpg-world-3d";
    renderer.domElement.setAttribute("aria-label", "3D");
    element.appendChild(renderer.domElement);
    const scene = new THREE.Scene();
    scene.background = new THREE.Color("#9acbd6");
    scene.fog = new THREE.FogExp2("#9acbd6", 0.038);
    const camera = new THREE.PerspectiveCamera(72, 1, 0.06, 100),
      sun = new THREE.DirectionalLight("#fff1cc", 2.1);
    sun.position.set(-8, 18, 9);
    sun.castShadow = profile.shadows;
    sun.shadow.mapSize.set(1024, 1024);
    sun.shadow.camera.left = -18;
    sun.shadow.camera.right = 18;
    sun.shadow.camera.top = 18;
    sun.shadow.camera.bottom = -18;
    sun.shadow.bias = -0.002;
    scene.add(sun, new THREE.HemisphereLight("#cdeaff", "#4d624d", 2));
    const voxelGeometry=new THREE.BoxGeometry(1,1,1);
    new GLTFLoader().load(assetUrl("models/storybook/voxel-block.glb"),g=>{if(!disposed){g.scene.traverse(o=>{if(o instanceof THREE.Mesh){voxelGeometry.dispose();voxelGeometry.copy(o.geometry);}});}g.scene.traverse(o=>{if(o instanceof THREE.Mesh){o.geometry.dispose();(Array.isArray(o.material)?o.material:[o.material]).forEach(m=>m.dispose());}});},undefined,()=>{});
    const voxelGroup=new THREE.Group();scene.add(voxelGroup);
    const renderBlocks:TerrainBlock[]=[...BLOCKS,'bedrock','oasis-water','door-top'];
    const voxelMaterials=renderBlocks.map(b=>new THREE.MeshStandardMaterial({color:b==='fruit'?'#ffffff':VOXEL_COLORS[b],roughness:b==='crystal'||b==='oasis-water'?.25:.85,transparent:b==='oasis-water',opacity:b==='oasis-water'?.65:1,emissive:b==='crystal'?'#7955bd':b==='oasis-water'?'#149b8e':'#000000',emissiveIntensity:.3}));
    const lamp=new THREE.PointLight('#ffdfa5',0,12,1.5),oasisLight=new THREE.PointLight('#6cf1d7',0,14,1.5);scene.add(lamp,oasisLight);
    voxelMaterials.forEach((material,i)=>{const c=document.createElement('canvas');c.width=c.height=16;const ctx=c.getContext('2d')!;ctx.fillStyle='#ffffff';ctx.fillRect(0,0,16,16);for(let y=0;y<16;y++)for(let x=0;x<16;x++){const hash=(x*31+y*17+i*11)%19;ctx.fillStyle=`rgba(30,20,10,${hash*.009})`;ctx.fillRect(x,y,1,1);}ctx.fillStyle='#47332044';if(i===0||i===2||i===4){for(let x=3;x<16;x+=5)ctx.fillRect(x,0,1,16);}else if(i===3){ctx.fillRect(0,7,16,1);ctx.fillRect(0,15,16,1);ctx.fillRect(7,0,1,7);ctx.fillRect(3,8,1,7);}const block=renderBlocks[i];if(['leaves','frostleaves','bush','herb'].includes(block)){for(let k=0;k<20;k++){ctx.fillStyle=k%2?'#ffffff55':'#12341555';ctx.fillRect((k*7)%16,(k*11)%16,3,2);}}else if(block==='fruit'){ctx.fillStyle='#416b2c';ctx.fillRect(0,0,16,16);for(const [x,y] of [[3,4],[11,3],[7,11]]){ctx.fillStyle='#ef6040';ctx.fillRect(x-2,y-1,4,4);ctx.fillStyle='#ffbb7044';ctx.fillRect(x-1,y,1,2);ctx.fillStyle='#734c29';ctx.fillRect(x,y-2,1,1);}}else if(block==='door'||block==='door-top'){ctx.fillStyle='#66422288';ctx.strokeStyle='#54371c';ctx.lineWidth=1;ctx.strokeRect(2,2,12,12);ctx.fillRect(7,0,1,16);if(block==='door'){ctx.fillStyle='#ffde82';ctx.fillRect(12,3,2,2);}}else if(block==='reed'||block==='cactus'){ctx.fillStyle='#19482a77';for(let x=2;x<16;x+=4)ctx.fillRect(x,0,1,16);if(block==='cactus'){ctx.fillStyle='#e2e5b5';for(let k=0;k<9;k++)ctx.fillRect(k*7%16,k*5%16,1,2);}}const texture=new THREE.CanvasTexture(c);texture.colorSpace=THREE.SRGBColorSpace;texture.magFilter=THREE.NearestFilter;material.map=texture;});
    const outlineMaterial=new THREE.MeshBasicMaterial({color:'#ffe292',wireframe:true,depthTest:false});
    const outline=new THREE.Mesh(voxelGeometry,outlineMaterial);outline.scale.setScalar(1.012);outline.visible=false;outline.renderOrder=10;scene.add(outline);
    const terrain = new THREE.Group(),
      actors = new THREE.Group();
    scene.add(terrain, actors);
    let placements:Placement[]=[];
    const models=new StorybookModels(scene,()=>{key='';});
    const atmosphere=storybookAtmosphere(scene,1,prefs.mapQuality);
    const animatedWater=storybookWater();
    const geometries: THREE.BufferGeometry[] = [],
      materials: THREE.Material[] = [],
      textures: THREE.Texture[] = [];
    const geo = <T extends THREE.BufferGeometry>(g: T) => {
      geometries.push(g);
      return g;
    };
    const mat = (color: string, roughness = 0.85, emissive?: string) => {
      const m = new THREE.MeshStandardMaterial({
        color,
        roughness,
        emissive: emissive || "#000000",
        emissiveIntensity: 0.65,
      });
      materials.push(m);
      return m;
    };
    const skyMaterial = new THREE.ShaderMaterial({
      side: THREE.BackSide,
      depthWrite: false,
      uniforms: {
        tone: { value: new THREE.Color("#9acbd6") },
        dark: { value: 1 },
      },
      vertexShader:
        "varying vec3 v;void main(){v=position;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}",
      fragmentShader:
        "varying vec3 v;uniform vec3 tone;uniform float dark;void main(){float h=clamp(normalize(v).y*.7+.3,0.,1.);vec3 c=mix(tone+vec3(.12,.10,.07),tone*vec3(.65,.85,1.05),h);gl_FragColor=vec4(c*dark,1.);}",
    });
    materials.push(skyMaterial);
    const skyDome = new THREE.Mesh(
      geo(new THREE.SphereGeometry(70, 24, 12)),
      skyMaterial,
    );
    scene.add(skyDome);
    const box = geo(new THREE.BoxGeometry(1, 1, 1)),
      sphere = geo(new THREE.IcosahedronGeometry(1, 1)),
      foliage = geo(new THREE.SphereGeometry(1, 12, 9)),
      cone = geo(new THREE.ConeGeometry(1, 1, 6)),
      trunk = geo(new THREE.CylinderGeometry(0.065, 0.1, 1, 6));
    const cloud = mat("#eff3ed"),
      stone = mat("#777c87"),
      wood = mat("#75513c"),
      leaf = mat("#315c44"),
      snow = mat("#d5e9ed"),
      roof = mat("#8e5145"),
      wall = mat("#dbcea8"),
      window = mat("#fbe6a0", 0.25, "#edb86b"),
      door = mat("#3a3431"),
      soil = mat("#694830"),
      water = animatedWater.material,
      gold = mat("#d7b667", 0.3, "#816120");
    materials.push(animatedWater.material);
    const textureLoader = new THREE.TextureLoader(),
      textureCache = new Map<string, THREE.Texture>();
    const texture = (src: string) => {
      let t = textureCache.get(src);
      if (!t) {
        t = textureLoader.load(src, (loaded) => {
          for (const map of textures)
            if (map.source === loaded.source) map.needsUpdate = true;
        });
        t.colorSpace = THREE.SRGBColorSpace;
        textures.push(t);
        textureCache.set(src, t);
      }
      return t;
    };
    const floorFurnitureGeometry=geo(new THREE.PlaneGeometry(1,1)),floorFurnitureMaterials=new Map<string,THREE.MeshBasicMaterial>();
    const spriteMaterials = new Map<string, THREE.SpriteMaterial>();
    function billboard(
      parent: THREE.Group,
      src: string,
      x: number,
      y: number,
      z: number,
      size = 1.2,
      player?: string,
      absolute=false,
    ) {
      let m = spriteMaterials.get(src);
      if (!m) {
        m = new THREE.SpriteMaterial({
          map: texture(src),
          transparent: true,
          alphaTest: 0.08,
        });
        materials.push(m);
        spriteMaterials.set(src, m);
      }
      const s = new THREE.Sprite(m);
      if(!absolute)y+=player?playerHeight(latest.current.world,latest.current.world.players[player]):terrainHeight(latest.current.world,Math.floor(x),Math.floor(z));
      s.position.set(x, y, z);
      s.scale.set(size, size, 1);
      s.userData.displaySize = size;
      s.userData.baseY = y;
      if (player) s.userData.player = player;
      parent.add(s);
      return s;
    }
    const atlasMaterials = new Map<string, THREE.SpriteMaterial>();
    function atlasBillboard(
      src: string,
      index: number,
      columns: number,
      rows: number,
      x: number,
      z: number,
      size: number,
    ) {
      const key = `${src}:${index}`;
      let material = atlasMaterials.get(key);
      if (!material) {
        const map = texture(assetUrl(src)).clone();
        map.repeat.set(1 / columns, 1 / rows);
        map.offset.set(
          (index % columns) / columns,
          1 - (Math.floor(index / columns) + 1) / rows,
        );
        map.magFilter = THREE.NearestFilter;
        textures.push(map);
        material = new THREE.SpriteMaterial({
          map,
          transparent: true,
          alphaTest: 0.08,
        });
        materials.push(material);
        atlasMaterials.set(key, material);
      }
      const sprite = new THREE.Sprite(material);
      sprite.position.set(x + 0.5, terrainHeight(latest.current.world,x,z)+size / 2, z + 0.5);
      sprite.scale.set(size, size, 1);
      sprite.userData.tile = { x, y: z };
      terrain.add(sprite);
    }
    const siteImages = new Map<string, string>();
    function siteBillboard(s: World["sites"][number], parent = terrain) {
      const portrait =
        s.kind === "npc"
          ? getRoamingNpcEvent(s.npcEventId)?.portrait
          : s.kind==="story"&&s.storyRole==="npc"?storyForSite(s)?.portrait:undefined;
      let src = portrait
        ? assetUrl(portrait)
        : siteImages.get(s.id + ":" + s.cleared);
      if (!src) {
        const canvas = document.createElement("canvas");
        canvas.width = canvas.height = 64;
        const ctx = canvas.getContext("2d")!;
        ctx.translate(24, 30);
        landmark(ctx, { ...s, x: 0, y: 0 }, 0);
        const pixels = ctx.getImageData(0, 0, 64, 64).data;
        let left = 64,
          top = 64,
          right = 0,
          bottom = 0;
        for (let y = 0; y < 64; y++)
          for (let x = 0; x < 64; x++)
            if (pixels[(y * 64 + x) * 4 + 3]) {
              left = Math.min(left, x);
              top = Math.min(top, y);
              right = Math.max(right, x);
              bottom = Math.max(bottom, y);
            }
        const cropped = document.createElement("canvas");
        cropped.width = right - left + 3;
        cropped.height = bottom - top + 3;
        cropped
          .getContext("2d")!
          .drawImage(
            canvas,
            left,
            top,
            right - left + 1,
            bottom - top + 1,
            1,
            1,
            right - left + 1,
            bottom - top + 1,
          );
        src = cropped.toDataURL();
        siteImages.set(s.id + ":" + s.cleared, src);
      }
      const size =
        s.kind === "npc" || s.kind === "story" || s.kind === "guardian"
          ? 1.5
          : s.kind === "treasure"
            ? 0.8
            : 1.1;
      const sprite = billboard(
        parent,
        src,
        s.x + 0.5,
        size / 2,
        s.y + 0.5,
        size,
      );
      sprite.userData.tile = { x: s.x, y: s.y };
    }
    function mesh(
      parent: THREE.Group,
      g: THREE.BufferGeometry,
      m: THREE.Material,
      x: number,
      y: number,
      z: number,
      sx = 1,
      sy = sx,
      sz = sx,
    ) {
      const o = new THREE.Mesh(g, m);
      o.position.set(x, y, z);
      o.scale.set(sx, sy, sz);
      parent.add(o);
      return o;
    }
    function house(
      parent: THREE.Group,
      x: number,
      z: number,
      tall = 1,
      tile?: { x: number; y: number },
    ) {
      if(parent===terrain){placements.push({model:biomeAt(Math.floor(x),Math.floor(z)).id==='snow'?'snowcottage':'cottage',x,y:0,z,scale:tall*.55,tile});if(models.ready)return;}
      const first = parent.children.length;
      mesh(parent, box, wall, x, 0.65 * tall, z, 0.85, 1.3 * tall, 0.85);
      const r = mesh(
        parent,
        cone,
        roof,
        x,
        1.3 * tall + 0.22,
        z,
        0.72,
        0.5,
        0.72,
      );
      r.rotation.y = Math.PI / 4;
      mesh(parent, box, door, x, 0.3, z + 0.431, 0.22, 0.6, 0.02);
      for (const d of [-0.26, 0.26])
        mesh(parent, box, window, x + d, 0.85, z + 0.44, 0.16, 0.22, 0.025);
      mesh(parent, box, wood, x, 0.02, z, 1.02, 0.06, 1.02);
      if (tile)
        for (const child of parent.children.slice(first))
          child.userData.tile = tile;
    }
    function tree(x: number, z: number, biome: string) {
      const season=calendar(latest.current.world).season;
      const model:StorybookModel=biome==='snow'?'snowpine':biome==='desert'?'cactus':biome==='ruins'?'arch':season===2?'autumn':biome==='forest'?'pine':'oak';
      placements.push({model,x,z,scale:biome==='ruins'?.7:1,yaw:(x*17+z*13)%6});
      if(models.ready)return;
      mesh(terrain, trunk, wood, x, 0.6, z, 1, 1.2, 1);
      if (biome === "snow") {
        for (let i = 0; i < 3; i++)
          mesh(
            terrain,
            cone,
            i === 1 ? leaf : snow,
            x,
            1 + i * 0.4,
            z,
            0.7 - i * 0.12,
            0.9,
            0.7 - i * 0.12,
          );
      } else if (biome === "ruins") {
        mesh(terrain, box, stone, x, 0.9, z, 0.5, 1.8, 0.5);
        mesh(terrain, box, stone, x, 1.8, z, 0.7, 0.15, 0.7);
      } else if (biome === "desert") {
        mesh(terrain, box, leaf, x, 0.8, z, 0.18, 1.6, 0.2);
        mesh(terrain, box, leaf, x + 0.23, 0.8, z, 0.5, 0.15, 0.15);
      } else {
        mesh(terrain, foliage, leaf, x, 1.55, z, 0.72, 0.9, 0.72);
        mesh(terrain, foliage, leaf, x - 0.3, 1.3, z + 0.1, 0.52, 0.6, 0.52);
        mesh(terrain, foliage, leaf, x + 0.32, 1.65, z + 0.1, 0.46, 0.53, 0.45);
        mesh(terrain, foliage, leaf, x + 0.1, 1.25, z - 0.25, 0.5, 0.65, 0.46);
      }
    }
    let lastWorld: World | undefined,
      lastRevision = -1,
      lastTime = -1,
      resourceStamp = "",
      farmStamp = "";
    let groundMaterial: THREE.Material | undefined;
    const batches: THREE.InstancedMesh[] = [];
    let key = "",
      actorKey = "",
      yaw = compassAngle(props.facing),
      viewPitch = buildRef.current.pitch,
      last = 0;
    const p = props.world.players[props.selfId];
    camera.position.set(p?.position3D?.x??(p?.x || 0) + 0.5, (p?playerHeight(props.world,p):0)+EYE_HEIGHT, p?.position3D?.z??(p?.y || 0) + 0.5);
    function rebuild(w: World, x: number, y: number) {
      batches.splice(0).forEach((b) => b.dispose());
      terrain.clear();placements=[];voxelGroup.children.forEach(o=>{if(o instanceof THREE.InstancedMesh)o.dispose();});voxelGroup.clear();
      const blocks=renderBlocks.map(()=>[] as {x:number;y:number;z:number}[]),cache=new Map<string,TerrainBlock|null>();
      const vr=options.current.mapQuality==='low'?12:19;
      const get=(bx:number,by:number,bz:number)=>{const k=`${bx},${by},${bz}`;if(!cache.has(k))cache.set(k,blockAt(w,bx,by,bz));return cache.get(k)!;};
      for(let vz=Math.max(1,y-vr);vz<=Math.min(HEIGHT-2,y+vr);vz++)for(let vx=Math.max(1,x-vr);vx<=Math.min(WIDTH-2,x+vr);vx++)for(let vy=MIN_DEPTH;vy<=MAX_HEIGHT;vy++){
        const b=get(vx,vy,vz);if(!b)continue;
        if(solid(b)&&[[1,0,0],[-1,0,0],[0,1,0],[0,-1,0],[0,0,1],[0,0,-1]].every(([dx,dy,dz])=>solid(get(vx+dx,vy+dy,vz+dz))))continue;
        blocks[renderBlocks.indexOf(b)].push({x:vx,y:vy,z:vz});
      }
      blocks.forEach((positions,i)=>{if(!positions.length)return;const m=new THREE.InstancedMesh(voxelGeometry,voxelMaterials[i],positions.length),matrix=new THREE.Matrix4();positions.forEach((v,j)=>{matrix.makeTranslation(v.x+.5,v.y+.5,v.z+.5);if(renderBlocks[i]==='door'||renderBlocks[i]==='door-top'){const y=renderBlocks[i]==='door-top'?v.y-1:v.y;const alongX=solid(get(v.x-1,y,v.z))||solid(get(v.x+1,y,v.z));matrix.scale(new THREE.Vector3(alongX?1:.16,1,alongX?.16:1));}m.setMatrixAt(j,matrix);});m.userData.voxels=positions;m.castShadow=true;m.receiveShadow=true;voxelGroup.add(m);});
      groundMaterial?.dispose();
      const radius = options.current.mapQuality === "low" ? 12 : 19,
        cells: { x: number; y: number; tile: string }[] = [];
      for (
        let ty = Math.max(0, y - radius);
        ty <= Math.min(HEIGHT - 1, y + radius);
        ty++
      )
        for (
          let tx = Math.max(0, x - radius);
          tx <= Math.min(WIDTH - 1, x + radius);
          tx++
        )
          cells.push({ x: tx, y: ty, tile: w.tiles[ty * WIDTH + tx] });
      const ground = new THREE.InstancedMesh(
        box,
        paintedSurface(new THREE.MeshStandardMaterial({ roughness: 1 })),
        cells.length,
      );
      groundMaterial = ground.material as THREE.Material;
      ground.receiveShadow = true;
      terrain.add(ground);
      const dummy = new THREE.Object3D(),
        color = new THREE.Color();
      cells.forEach(({ x: tx, y: ty, tile }, i) => {
        dummy.position.set(
          tx + 0.5,
          tile === "water" ? -0.11 : solid(blockAt(w,tx,terrainHeight(w,tx,ty)-1,ty))?terrainHeight(w,tx,ty)-.06:-100,
          ty + 0.5,
        );
        dummy.scale.set(1, 0.1, 1);
        dummy.updateMatrix();
        ground.setMatrixAt(i, dummy.matrix);
        color.set(
          w.city?.roads.includes(ty * WIDTH + tx)
            ? "#c6b18a"
            : tile === "water"
              ? "#287a92"
              : tile === "road"
                ? "#c6b18a"
                : tile === "stone"
                  ? "#8d8c91"
                  : biomeSurface(tx, ty).color,
        );
        color.multiplyScalar(1.04);
        ground.setColorAt(i, color);
        if (
          occupiedCityTile(w, ty * WIDTH + tx) ||
          occupiedFarmTile(w, ty * WIDTH + tx)
        )
          return;
        const b = biomeAt(tx, ty).id,
          node = natureAt(w, ty * WIDTH + tx),
          removed =
            (w.life.nodes[ty * WIDTH + tx]?.regrowAt || 0) > w.life.time;
        if (tile === "water") {
          mesh(terrain, box, water, tx + 0.5, -0.015, ty + 0.5, 1, 0.025, 1);
        } else if (tile === "forest" && !removed && (!natureAt(w,ty*WIDTH+tx) || protectedVoxel(w,tx,ty))) {
          if (node?.rock) {
            placements.push({model:'rock',x:tx+.5,z:ty+.5,scale:.8,tile:{x:tx,y:ty}});if(models.ready)return;
            mesh(
              terrain,
              sphere,
              b === "snow" ? snow : stone,
              tx + 0.5,
              0.35,
              ty + 0.5,
              0.45,
              0.48,
              0.45,
            );
          } else tree(tx + 0.5, ty + 0.5, b);
        } else if (node && !removed && tile === "grass") {
          if(node.material!=='reed')placements.push({model:node.rock?'rock':node.material==='frostwood'?'snowpine':node.material==='herb'?'flowers':'oak',x:tx+.5,z:ty+.5,scale:node.rock?.6:node.material==='herb'?1:.8,tile:{x:tx,y:ty}});
          if(!models.ready||node.material==='reed')atlasBillboard(
            "sprites/rpg/frontier-atlas.webp",
            node.sprite,
            6,
            4,
            tx,
            ty,
            node.rock ? 0.65 : 0.8,
          );
        }
        const flower = flowerAt(w, ty * WIDTH + tx);
        if (flower)
          atlasBillboard(
            flowerAtlas(flower.season),
            flower.index,
            4,
            3,
            tx,
            ty,
            0.45,
          );
      });
      const near = (o: { x: number; y: number }) =>
        Math.abs(o.x - x) < radius && Math.abs(o.y - y) < radius;
      for(let i=0;i<cells.length;i+=53){const c=cells[i];if(c.tile==='grass'&&!occupiedFarmTile(w,c.y*WIDTH+c.x)&&!occupiedCityTile(w,c.y*WIDTH+c.x))placements.push({model:'flowers',x:c.x+.3,z:c.y+.3,scale:.7});}
      for (const s of w.sites.filter(
        (s) =>
          near(s) &&
          (s.kind !== "fragment" ||
            w.activities.secretsFound.includes(s.id) ||
            Math.abs(s.x - x) + Math.abs(s.y - y) <= 4),
      )) {
        if (["town", "boss", "dungeon"].includes(s.kind)) {
          if(s.kind==='boss'){placements.push({model:'tower',x:s.x+.5,z:s.y+.5,scale:1.2,tile:s});if(!models.ready)house(terrain,s.x+.5,s.y-.4,2,s);}
          else house(terrain, s.x + 0.5, s.y - 0.4, 1, s);
          placements.push({model:'lantern',x:s.x-.1,z:s.y+1.1,scale:.65});
          if (s.kind === "dungeon" || s.kind === "guardian") {
            for (const d of [-0.8, 0.8])
              mesh(
                terrain,
                box,
                stone,
                s.x + 0.5 + d,
                1,
                s.y + 0.5,
                0.25,
                2,
                0.3,
              );
            mesh(terrain, box, stone, s.x + 0.5, 2, s.y + 0.5, 1.9, 0.25, 0.4);
          }
        } else {
          if (s.kind !== "npc") siteBillboard(s);
        }
      }
      for (const h of w.life.houses.filter(near))
        house(terrain, h.x + 0.5, h.y + 0.5, 1, h);
      for (const lot of w.city?.lots || [])
        if (near(lot)) {
          const tx = lot.x + 0.5,
            tz = lot.y + 0.5;
          if (["park", "farm", "sports", "festival"].includes(lot.kind)) {
            mesh(terrain, box, leaf, tx, 0.02, tz, 0.85, 0.08, 0.85);
            if (lot.kind === "park") tree(tx, tz, "meadow");
            else
              for (let i = 0; i < 3; i++)
                mesh(
                  terrain,
                  cone,
                  gold,
                  tx - 0.3 + i * 0.3,
                  0.35,
                  tz,
                  0.08,
                  0.65,
                  0.08,
                );
          } else if (["wind", "solar", "water", "sewage"].includes(lot.kind)) {
            mesh(terrain, box, stone, tx, 0.5, tz, 0.35, 1, 0.35);
            mesh(terrain, box, water, tx, 1.1, tz, 0.95, 0.08, 0.5);
            if (lot.kind === "wind") {
              placements.push({model:"windmill",x:tx,z:tz,scale:.65});
              if(models.ready)continue;
              mesh(terrain, box, wall, tx, 1.4, tz, 0.06, 1.4, 0.08);
              mesh(terrain, box, wall, tx, 1.4, tz, 1.4, 0.06, 0.08);
            }
          } else
            house(
              terrain,
              tx,
              tz,
              lot.kind === "apartments" ? 2 : lot.kind === "hall" ? 1.5 : 1,
            );
        }
      for (const project of w.city?.living?.projects || [])
        if (project.complete && w.city) {
          const i = [
              "garden",
              "market",
              "fountain",
              "festival",
              "petpark",
              "library",
            ].indexOf(project.id),
            tx = w.city.origin.x + 2 + i,
            tz = w.city.origin.y + 2;
          if (Math.abs(tx - x) < radius && Math.abs(tz - y) < radius) {
            mesh(terrain, box, stone, tx, 0.06, tz, 0.8, 0.12, 0.8);
            if (project.id === "fountain") {
              mesh(terrain, cone, water, tx, 0.4, tz, 0.35, 0.6, 0.35);
              mesh(terrain, sphere, water, tx, 0.9, tz, 0.12, 0.3, 0.12);
            } else mesh(terrain, cone, gold, tx, 0.5, tz, 0.25, 0.8, 0.25);
          }
        }
      for(const farm of Object.values(w.farm?.people||{}))for(const plot of farm.plots){
        const xy=plotPosition(farm,plot);if(!xy||!near(xy))continue;const h=terrainHeight(w,xy.x,xy.y);
        mesh(terrain,box,soil,xy.x+.5,h+.01,xy.y+.5,1,.04,1);
        if(plot.crop)billboard(terrain,assetUrl(farmImage('crop',plot.crop)),xy.x+.5,.35,xy.y+.5,plot.growth>1?.7:.4);
      }
      for(const room of w.voxelRooms||[]){
        for(const f of room.furniture){const size=furnitureSize(f);if(!near({x:f.x,y:f.y}))continue;if(furnishing(f.item)?.floor){let material=floorFurnitureMaterials.get(f.item);if(!material){material=new THREE.MeshBasicMaterial({map:texture(assetUrl(furnitureImage(f.item))),transparent:true,alphaTest:.08,side:THREE.DoubleSide});floorFurnitureMaterials.set(f.item,material);materials.push(material);}const rug=new THREE.Mesh(floorFurnitureGeometry,material);rug.rotation.x=-Math.PI/2;rug.position.set(f.x+size.width/2,room.floor+.03,f.y+size.height/2);rug.scale.set(size.width,size.height,1);terrain.add(rug);}else billboard(terrain,assetUrl(furnitureImage(f.item)),f.x+size.width/2,room.floor+.55,f.y+size.height/2,Math.max(size.width,size.height)*.85,undefined,true);}
        for(const farm of Object.values(w.farm?.people||{}))for(const pet of farm.pets)if(pet.homeId===room.id){const pos=pet.roomPos||room.cells[0];billboard(terrain,assetUrl(farmImage('pet',pet.kind)),pos.x+.5,room.floor+.35,('y' in pos?pos.y:pos.z)+.5,.7,undefined,true);}
      }
      for (let i = 0; i < 5; i++) {
        const cx = x + Math.sin(i * 1.7) * 23,
          cz = y + Math.cos(i * 1.7) * 23;
        for (let k = 0; k < 3; k++)
          mesh(
            terrain,
            foliage,
            cloud,
            cx + k * 1.9,
            9 + (i % 2),
            cz,
            2.6,
            1.1,
            1.5,
          );
      }
      // The actual voxel soil is the floor; a world-sized plane would cover excavations.
      // Silhouettes at the fog line establish scale without disconnected collision geometry.
      for (let i = 0; i < 12; i++)
        mesh(
          terrain,
          cone,
          stone,
          x + Math.sin((i / 12) * Math.PI * 2) * 35,
          -2,
          y + Math.cos((i / 12) * Math.PI * 2) * 35,
          8,
          10 + (i % 3) * 2,
          8,
        );

      for(const c of oasisCenters(w))if(Math.abs(c.x-x)<radius&&Math.abs(c.z-y)<radius){for(const [dx,dz] of [[4,0],[-4,0],[0,4],[0,-4]])if(!protectedVoxel(w,c.x+dx,c.z+dz))placements.push({model:'mushrooms',x:c.x+dx+.5,z:c.z+dz+.5,y:c.depth-1,scale:.55});}
      models.set(placements.map(v=>({...v,y:v.y!==undefined&&v.y<0?v.y:(v.y||0)+terrainHeight(w,Math.floor(v.x),Math.floor(v.z))})));
      const groups = new Map<string, THREE.Mesh[]>();
      for (const o of [...terrain.children])
        if (o instanceof THREE.Mesh && !(o instanceof THREE.InstancedMesh)) {
          const k = o.geometry.uuid + (o.material as THREE.Material).uuid;
          const list = groups.get(k) || [];
          list.push(o);
          groups.set(k, list);
        }
      for (const list of groups.values()) {
        const batch = new THREE.InstancedMesh(
          list[0].geometry,
          list[0].material,
          list.length,
        );
        list.forEach((o, i) => {
          o.updateMatrix();
          batch.setMatrixAt(i, o.matrix);
          terrain.remove(o);
        });
        batch.userData.tiles = list.map((o) => o.userData.tile);
        batch.castShadow = list[0].material !== water;
        batch.receiveShadow = true;
        batch.computeBoundingSphere();
        batches.push(batch);
        terrain.add(batch);
      }
    }
    function updateActors(w: World) {
      const radius = options.current.mapQuality === "low" ? 12 : 19;
      actors.clear();
      for (const site of w.sites)
        if (
          site.kind === "npc" &&
          !latest.current.hiddenActors?.includes(site.id) &&
          Math.abs(site.x - w.players[latest.current.selfId].x) < radius &&
          Math.abs(site.y - w.players[latest.current.selfId].y) < radius
        )
          siteBillboard(site, actors);
      for (const r of residentsOf(w)) {
        const pos = residentPosition(w, r.id);
        if (pos.siteId || latest.current.hiddenActors?.includes(r.id)) continue;
        const custom = w.town?.customResidents?.find((v) => v.id === r.id);
        billboard(
          actors,
          assetUrl(custom?.hero?.frames.idle[0] || r.portrait),
          pos.x + 0.5,
          0.75,
          pos.y + 0.5,
          1.5,
        );
      }
      for (const [id, f] of Object.entries(w.farm?.people || {})) {
        if (f.x !== undefined && f.y !== undefined) {
          for (const [i, a] of f.animals.entries()) {
            const sprite = billboard(
              actors,
              assetUrl(farmImage("animal", a.kind)),
              f.x + (i % 6) + 0.5,
              0.35,
              f.y + (i < 6 ? 0 : 5) + 0.5,
              0.7,
            );
            sprite.userData.animal = a;
            sprite.userData.owner = id;
            sprite.userData.collection = "animals";
            sprite.userData.base = 0.35;
            sprite.userData.size = 0.7;
          }
        }
      }
      for (const a of Object.values(w.players))
        if (
          a.id !== latest.current.selfId &&
          !a.spectator &&
          !a.life?.indoors &&
          Math.hypot(
            a.x - w.players[latest.current.selfId].x,
            a.y - w.players[latest.current.selfId].y,
          ) > 0.5
        ) {
          const image = a.hero?.frames.idle[0] || a.profile?.image;
          if (image)
            billboard(
              actors,
              assetUrl(image),
              a.position3D?.x??a.x + 0.5,
              .9,
              a.position3D?.z??a.y + 0.5,
              1.8,
              a.id,
            );
          else mesh(actors, cone, gold, a.x + 0.5, 0.5, a.y + 0.5, 0.2, 1, 0.2);
        }
    }
    const resize = () => {
      const r = element.getBoundingClientRect();
      renderer.setSize(Math.max(1, r.width), Math.max(1, r.height));
      camera.aspect = r.width / Math.max(1, r.height);
      camera.updateProjectionMatrix();
    };
    const observer = new ResizeObserver(resize);
    observer.observe(element);
    resize();
    const ray = new THREE.Raycaster(),
      pointer = new THREE.Vector2(),
      plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0),
      hit = new THREE.Vector3();
    function performBuild(kind:'voxel-break'|'voxel-place'='voxel-break') {
      const current=latest.current.world.players[latest.current.selfId];
      if(energyOf(current.life)<.1){latest.current.onEnergyRequest?.();return;}
      ray.setFromCamera(new THREE.Vector2(0,0),camera);
      const h=ray.intersectObjects(voxelGroup.children)[0];
      if(h&&h.distance<4.5){const v=h.object.userData.voxels[h.instanceId!],b=blockAt(latest.current.world,v.x,v.y,v.z);if(kind==='voxel-break'&&b&&Number.isFinite(miningCost(b,current))&&energyOf(current.life)<miningCost(b,current)){latest.current.onEnergyRequest?.();return;}const n=h.face!.normal;latest.current.onVoxelAction?.({type:kind,x:v.x+(kind==='voxel-place'?Math.round(n.x):0),y:v.y+(kind==='voxel-place'?Math.round(n.y):0),z:v.z+(kind==='voxel-place'?Math.round(n.z):0),block:buildRef.current.selected});}

    }
    const command=(e:Event)=>performBuild((e as CustomEvent).detail);
    element.addEventListener('voxel-command',command);
    let down: { x: number; y: number } | null = null;
    const start = (e: PointerEvent) => {
      down = { x: e.clientX, y: e.clientY };
    };
    const end = (e: PointerEvent) => {
      if (!down) return;
      const dx = e.clientX - down.x,
        dy = e.clientY - down.y;
      down = null;
      if(buildRef.current.building&&Math.hypot(dx,dy)>12){setPitch(p=>Math.max(-1.1,Math.min(.7,p-dy*.006)));if(Math.abs(dx)>35)latest.current.onFacing(latest.current.facing-dx/180);return;}
      if (Math.abs(dx) > 35 && Math.abs(dx) > Math.abs(dy)) {
        latest.current.onFacing(latest.current.facing-dx/180);
        return;
      }
      if (Math.hypot(dx, dy) > 12) return;
      const r = renderer.domElement.getBoundingClientRect();
      pointer.set(
        ((e.clientX - r.left) / r.width) * 2 - 1,
        (-(e.clientY - r.top) / r.height) * 2 + 1,
      );
      ray.setFromCamera(pointer, camera);
      const person = ray
        .intersectObjects(actors.children)
        .find((v) => v.object.userData.player);
      if (person) {
        latest.current.onPlayer?.(person.object.userData.player);
        return;
      }
      const objectHit = ray
        .intersectObjects([...terrain.children,...models.group.children],true)
        .find(
          (h) =>
            h.distance < 24 &&
            (h.object.userData.tile ||
              h.object.userData.tiles?.[h.instanceId ?? -1]),
        );
      if (objectHit) {
        const tile =
          objectHit.object.userData.tile ||
          objectHit.object.userData.tiles[objectHit.instanceId!];
        latest.current.onTile(tile.x, tile.y);
        return;
      }
      if (
        ray.ray.intersectPlane(plane, hit) &&
        hit.distanceTo(camera.position) < 24
      )
        latest.current.onTile(Math.floor(hit.x), Math.floor(hit.z));
    };
    const lost = (e: Event) => {
      e.preventDefault();
      latest.current.onUnavailable();
    };
    renderer.domElement.addEventListener("webglcontextlost", lost);
    renderer.domElement.addEventListener("pointerdown", start);
    renderer.domElement.addEventListener("pointerup", end);
    let lastTarget="";
    const draw = (time: number) => {
      if (disposed) return;
      if (
        latest.current.presentation === "conversation" &&
        time - last < 1000 / 15
      ) {
        raf = requestAnimationFrame(draw);
        return;
      }
      renderer.domElement.dataset.facing = String(latest.current.facing);renderer.domElement.dataset.voxelBlocks=String(voxelGroup.children.reduce((n,o)=>n+(o instanceof THREE.InstancedMesh?o.count:0),0));
      const w: World = latest.current.world,
        a = w.players[latest.current.selfId];
      if (a) {
        if (
          w !== lastWorld ||
          w.revision !== lastRevision ||
          w.life.time !== lastTime
        ) {
          lastWorld = w;
          lastRevision = w.revision;
          lastTime = w.life.time;
          resourceStamp = Object.entries(w.life.nodes)
            .filter(
              ([tile, n]) =>
                n.regrowAt > w.life.time &&
                Math.abs((Number(tile) % WIDTH) - a.x) < 24 &&
                Math.abs(Math.floor(Number(tile) / WIDTH) - a.y) < 24,
            )
            .map(([tile, n]) => tile + ":" + n.regrowAt)
            .join("|");
          farmStamp = Object.values(w.farm?.people || {})
            .map(
              (f) =>
                `${f.x}:${f.y}:${f.plots.map((p) => p.crop + ":" + p.growth).join(",")}`,
            )
            .join("|");
        }
        const nextKey = `${w.voxelRooms?.map(r=>r.revision).join(',')||''}:${w.voxels?.revision||0}:${Math.floor(a.x / 4)}:${Math.floor(a.y / 4)}:${w.city?.revision || 0}:${w.life.houses.length}:${resourceStamp}:${farmStamp}:${Math.floor(w.life.time / (Object.values(w.farm?.people||{}).some(f=>f.pets.some(p=>w.voxelRooms?.some(r=>r.id===p.homeId)))?2:8))}`;
        if (nextKey !== key) {
          key = nextKey;
          rebuild(w, a.x, a.y);
        }
        const nextActors =
          (latest.current.hiddenActors || []).join("|") +
          Object.values(w.players)
            .map(
              (a) =>
                `${a.id}:${a.position3D?.y??0}:${a.position3D?.x??a.x}:${a.position3D?.z??a.y}:${a.hero?.portrait.slice(-64) || a.profile?.image.slice(-64) || ""}:${a.life?.indoors || ""}`,
            )
            .join("|") +
          Object.values(w.farm?.people || {})
            .map(
              (f) =>
                `${f.x}:${f.y}:${f.animals.length}:${f.activePet}:${f.pets.map((p) => p.awayUntil).join(",")}`,
            )
            .join("|") +
          String(w.town?.customResidents?.length || 0) +
          Object.entries(w.town?.walkers || {})
            .map(([id, p]) => `${id}:${p.x}:${p.y}`)
            .join("|") +
          w.sites
            .filter((s) => s.kind === "npc")
            .map((s) => `${s.id}:${s.x}:${s.y}`)
            .join("|");
        if (nextActors !== actorKey) {
          actorKey = nextActors;
          updateActors(w);
        }
        const dt = Math.min(0.1, (time - last) / 1000 || 0.016),
          smooth = options.current.reducedMotion ? 1 : 1 - Math.exp(-dt * 12);
        camera.position.x += ((a.position3D?.x??a.x + 0.5) - camera.position.x) * smooth;
        camera.position.y += (playerHeight(w,a)+EYE_HEIGHT-camera.position.y)*smooth;
        camera.position.z += ((a.position3D?.z??a.y + 0.5) - camera.position.z) * smooth;
        yaw += shortestTurn(yaw, compassAngle(latest.current.facing)) * smooth;
        viewPitch+=(buildRef.current.pitch-viewPitch)*smooth;
        camera.lookAt(
          camera.position.x + Math.sin(yaw),
          camera.position.y+Math.tan(viewPitch),
          camera.position.z - Math.cos(yaw),
        );
        const b = biomeAt(a.x, a.y).id;
        const sky =
          b === "ruins"
            ? "#a4a3bd"
            : b === "snow"
              ? "#c9e0ed"
              : b === "desert"
                ? "#e8ccb0"
                : "#9acbd6";
        scene.background = new THREE.Color(sky);
        (scene.fog as THREE.FogExp2).color.set(sky);
      }
      // Sprites face the camera automatically; preserve the source proportions after loading.
      for (const group of [terrain, actors])
        for (const object of group.children) {
          if (!(object instanceof THREE.Sprite) || !object.userData.displaySize)
            continue;
          const image = object.material.map?.image as
            | { width?: number; height?: number }
            | undefined;
          if (!image?.width || !image?.height) continue;
          const size = object.userData.displaySize,
            ratio = image.width / image.height;
          const height = Math.min(size, (size * 1.25) / ratio);
          object.scale.set(height * ratio, height, 1);
          if (!object.userData.animal)
            object.position.y = object.userData.baseY - size / 2 + height / 2;
        }
      for (const actor of actors.children)
        if (actor.userData.animal) {
          const animal =
            w.farm?.people[actor.userData.owner]?.[
              actor.userData.collection as "animals" | "pets"
            ].find((a) => a.id === actor.userData.animal.id) ||
            actor.userData.animal;
          const pose = animalPose(animal, w.life.time),
            size = actor.userData.size;
          actor.position.y =
            actor.userData.base +
            (!options.current.reducedMotion && pose === "hop"
              ? Math.max(0, Math.sin(time / 180)) * 0.13
              : 0);
          actor.scale.y *= pose === "sleep" ? 0.88 : 1;
        }
      sun.position.set(camera.position.x - 8, 18, camera.position.z + 9);
      sun.target.position.set(camera.position.x, 0, camera.position.z);
      sun.target.updateMatrixWorld();
      skyDome.position.copy(camera.position);
      const phase = calendar(w).phase;
      const underground=camera.position.y<-.5;lamp.position.copy(camera.position);lamp.intensity=underground?3:0;const nearest=oasisCenters(w).reduce((a,b)=>Math.hypot(b.x-camera.position.x,b.z-camera.position.z)<Math.hypot(a.x-camera.position.x,a.z-camera.position.z)?b:a);oasisLight.position.set(nearest.x,nearest.depth+1,nearest.z);oasisLight.intensity=underground?2.5:0;
      const brightness = underground?.1:phase === 3 ? 0.48 : phase === 2 ? 0.8 : 1;
      skyMaterial.uniforms.dark.value = brightness;
      skyMaterial.uniforms.tone.value.copy((scene.fog as THREE.FogExp2).color);
      sun.intensity = underground?.08:phase === 3 ? 0.5 : 2.1;
      camera.fov = 72 / options.current.zoom;
      camera.updateProjectionMatrix();
      models.update(Math.min(.1,(time-last)/1000||.016),options.current.reducedMotion);atmosphere.update(time/1000,camera.position,options.current.reducedMotion);animatedWater.update(options.current.reducedMotion?0:time/1000);
      renderer.domElement.dataset.eyeHeight=String(EYE_HEIGHT);renderer.domElement.dataset.pitch=String(buildRef.current.pitch);renderer.domElement.dataset.cameraY=String(camera.position.y);renderer.domElement.dataset.artStyle='storybook-fantasy';renderer.domElement.dataset.blenderModels=String(models.ready?models.group.userData.models:0);renderer.domElement.dataset.blenderAnimations=String(models.group.userData.animations||0);
      outline.visible=false;
      if(buildRef.current.building){ray.setFromCamera(new THREE.Vector2(0,0),camera);const h=ray.intersectObjects(voxelGroup.children)[0];let t:{block:TerrainBlock;cost:number}|null=null;if(h&&h.distance<4.5){const v=h.object.userData.voxels[h.instanceId!];outline.position.set(v.x+.5,v.y+.5,v.z+.5);outline.visible=true;const b=blockAt(w,v.x,v.y,v.z);if(b)t={block:b,cost:miningCost(b,w.players[latest.current.selfId])};}const k=t?t.block+':'+t.cost:'';if(k!==lastTarget){lastTarget=k;setTarget(t);}}
      last = time;
      renderer.render(scene, camera);
      raf = requestAnimationFrame(draw);
    };
    raf = requestAnimationFrame(draw);
    return () => {
      disposed = true;
      cancelAnimationFrame(raf);
      observer.disconnect();
      renderer.domElement.removeEventListener("webglcontextlost", lost);
      renderer.domElement.removeEventListener("pointerdown", start);
      renderer.domElement.removeEventListener("pointerup", end);
      element.removeEventListener("voxel-command",command);voxelGroup.children.forEach(o=>{if(o instanceof THREE.InstancedMesh)o.dispose();});voxelGeometry.dispose();voxelMaterials.forEach(m=>{m.map?.dispose();m.dispose();});outlineMaterial.dispose();
      models.dispose();atmosphere.dispose();
      batches.forEach((b) => b.dispose());
      groundMaterial?.dispose();
      geometries.forEach((g) => g.dispose());
      materials.forEach((m) => m.dispose());
      textures.forEach((t) => t.dispose());
      renderer.dispose();
      renderer.domElement.remove();
    };
  }, [prefs.mapQuality]);
  const text=(s:string)=>trans(s,props.languageMode||"JAPANESE");
  const command=(type:string)=>host.current?.dispatchEvent(new CustomEvent('voxel-command',{detail:type}));
  const me=props.world.players[props.selfId];
  return <div className="rpg-world-3d" ref={host}>{building&&<div className="rpg-voxel-dock" onPointerDown={e=>e.stopPropagation()}>
    <VoxelLookStick languageMode={props.languageMode||'JAPANESE'} onLook={(dx,dy)=>{props.onFacing(props.facing+dx);setPitch(p=>Math.max(-1.35,Math.min(1.2,p-dy)));}}/>
    <header><span>⚡ {(me?.life?.energy??6).toFixed(2)}/6 · Y {me?playerHeight(props.world,me):0}</span><button aria-label={text('スロット設定')} aria-expanded={editSlot} onClick={()=>setEditSlot(!editSlot)}>⚙</button></header>
    {editSlot&&<select aria-label={text('選択スロットの素材')} value={selected} onChange={e=>setSlots(a=>a.map((b,i)=>i===selectedSlot?e.target.value as Block:b))}>{BLOCKS.map(b=><option key={b} value={b}>{text(MATERIAL_NAMES[b])}</option>)}</select>}
    <div className="rpg-voxel-slots">{slots.map((b,i)=><button key={i} aria-label={`${text('スロット')} ${i+1}: ${text(MATERIAL_NAMES[b])}`} aria-pressed={selectedSlot===i} onClick={()=>setSelectedSlot(i)}><svg viewBox="0 0 32 32" aria-hidden="true"><path fill={VOXEL_COLORS[b]} d="M16 2 30 9v15L16 31 2 24V9z"/><path fill="#ffffff40" d="m16 2 14 7-14 7L2 9z"/><path fill="#00000030" d="m16 16 14-7v15l-14 7z"/></svg><small>{text(MATERIAL_NAMES[b])}</small><b>{me?.life?.bag[b]||0}</b></button>)}</div>
    <div className="rpg-voxel-actions"><button disabled={energyOf(me?.life)>=.1&&!!target&&!Number.isFinite(target.cost)} onClick={()=>command('voxel-break')}>⛏ {text('壊す')}</button><button disabled={energyOf(me?.life)>=.1&&(me?.life?.bag[selected]||0)<1} onClick={()=>command('voxel-place')}>＋ {text('置く')}</button></div>
    <small className="rpg-voxel-target">{target?text(target.block==='bedrock'?'岩盤':target.block==='oasis-water'?'地下の水':target.block==='door-top'?'ドア':MATERIAL_NAMES[target.block]):text('照準をブロックに合わせる')} · ⚡ {target?(Number.isFinite(target.cost)?target.cost.toFixed(2):'—'):'0.10'}</small>
  </div>}{building&&<span className="rpg-voxel-crosshair">＋</span>}</div>;
}
