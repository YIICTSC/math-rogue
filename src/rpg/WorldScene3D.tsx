import LandscapeCompass from './LandscapeCompass';
import {audioService} from '../services/audioService';
import {LandscapeScene} from './landscapeScene';
import {WORLD_SCALE,legacyRegion,landscapeEnvironment,waterProfile,landmarkBlock} from './worldLandscape';
import {VoxelWorkshopPanel} from './VoxelWorkshopPanel';
import {createConstructionGeometry,voxelMaterial} from './voxelRendering';
import {fullCube} from './voxelCatalog';
import {furnitureImage,furnitureSize,furnishing} from './homeCatalog';
import {plotPosition} from './farm/land';
import {trans} from '../utils/textUtils';
import type {LanguageMode} from '../types';
import {energyOf} from './energy';
import {BLOCKS,voxelWater,traceVoxel,blockAt,protectedVoxel,terrainHeight,oasisCenters,playerHeight,solid,miningCost,MIN_DEPTH,MAX_HEIGHT,EYE_HEIGHT,VOXEL_COLORS,type TerrainBlock,type Block,type VoxelAction} from './voxel';
import {MATERIAL_NAMES} from './life';
import { StorybookModels, type Placement, type StorybookModel } from '../three/storybookModels';
import { configureStorybook, paintedSurface, storybookWater } from '../three/storybookStyle';
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
  const [slots,setSlots]=useState<Block[]>(()=>{try{const a=JSON.parse(localStorage.getItem('rpg-voxel-slots-v1')||'null');if(Array.isArray(a)&&a.length===4&&a.every(b=>BLOCKS.includes(b)))return a;}catch{}return ['wood','stone','dirt','plank'];}),[selectedSlot,setSelectedSlot]=useState(0),[editSlot,setEditSlot]=useState(false),[rotation,setRotation]=useState(0),[pitch,setPitch]=useState(-.18),[target,setTarget]=useState<{block:TerrainBlock;cost:number}|null>(null);
  const selected=slots[selectedSlot],building=!!props.onVoxelAction&&props.presentation!=='conversation';
  useEffect(()=>{try{localStorage.setItem('rpg-voxel-slots-v1',JSON.stringify(slots));}catch{}},[slots]);
  const buildRef=useRef({building,selected,pitch,rotation,panel:editSlot});buildRef.current={building,selected,pitch,rotation,panel:editSlot};
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
        antialias: true,
        alpha: false,
        powerPreference:
          prefs.mapQuality === "high" ? "high-performance" : "default",
      });
    } catch {
      props.onUnavailable();
      return;
    }
    const profile=configureStorybook(renderer,prefs.mapQuality);
    // Keep mobile auto detail inexpensive without lowering edge resolution to 1x.
    renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,prefs.mapQuality==='low'?1:prefs.mapQuality==='high'?2.5:2));
    renderer.domElement.dataset.antialias='true';
    renderer.domElement.dataset.pixelRatio=String(renderer.getPixelRatio());
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
    const camera = new THREE.PerspectiveCamera(72, 1, 0.06, prefs.mapQuality==="low"?360:600),
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
    const voxelGroup=new THREE.Group();scene.add(voxelGroup);
    const renderBlocks:TerrainBlock[]=[...BLOCKS,'bedrock','oasis-water','door-top'];
    const voxelMaterials=renderBlocks.map(voxelMaterial);
    for(const material of voxelMaterials)if(material.map){material.map.anisotropy=Math.min(8,renderer.capabilities.getMaxAnisotropy());material.map.needsUpdate=true;}
    const construction=createConstructionGeometry(()=>{key="";});
    const lamp=new THREE.PointLight('#ffdfa5',0,12,1.5),oasisLight=new THREE.PointLight('#6cf1d7',0,14,1.5);scene.add(lamp,oasisLight);
    const outlineMaterial=new THREE.MeshBasicMaterial({color:'#ffe292',wireframe:true,depthTest:false});
    const outline=new THREE.Mesh(voxelGeometry,outlineMaterial);outline.scale.setScalar(1.012);outline.visible=false;outline.renderOrder=10;scene.add(outline);
    const ghostMaterial=new THREE.MeshBasicMaterial({color:'#89e0ac',transparent:true,opacity:.36,depthWrite:false});
    const ghost=new THREE.Mesh<THREE.BufferGeometry>(voxelGeometry,ghostMaterial);ghost.visible=false;ghost.renderOrder=9;scene.add(ghost);
    const terrain = new THREE.Group(),
      actors = new THREE.Group();
    scene.add(terrain, actors);
    let placements:Placement[]=[];
    const models=new StorybookModels(scene,()=>{key='';});
    const landscape=new LandscapeScene(scene,prefs.mapQuality,construction,b=>voxelMaterials[renderBlocks.indexOf(b)]);
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
      geo(new THREE.SphereGeometry(1150, 24, 12)),
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
      windowMaterial = mat("#fbe6a0", 0.25, "#edb86b"),
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
      const first=parent.children.length;
      const height=3.2*tall,depth=3,width=3;
      mesh(parent,box,wall,x-width/2+.15,height/2,z,.3,height,depth);
      mesh(parent,box,wall,x+width/2-.15,height/2,z,.3,height,depth);
      mesh(parent,box,wall,x,height/2,z-depth/2,width,height,.3);
      // The entry tile lies in a 1.4m opening beneath a 2.4m lintel.
      for(const side of [-1,1])mesh(parent,box,wall,x+side*1.1,height/2,z+.35,.8,height,.3);
      mesh(parent,box,wall,x,(height+2.4)/2,z+.35,1.4,height-2.4,.3);
      const cap=mesh(parent,cone,roof,x,height+.55,z,2.25,1.25,2.25);cap.rotation.y=Math.PI/4;
      for(const side of [-1,1])mesh(parent,box,windowMaterial,x+side*1.51,1.8,z-.4,.03,.9,.8);
      if(tile)for(const child of parent.children.slice(first))child.userData.tile=tile;
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
      landscape.setDetailRegion(x,y,options.current.mapQuality === "low" ? 12 : 19);
      batches.splice(0).forEach((b) => b.dispose());
      terrain.clear();placements=[];voxelGroup.children.forEach(o=>{if(o instanceof THREE.InstancedMesh)o.dispose();});voxelGroup.clear();
      const blocks=renderBlocks.map(()=>[] as {x:number;y:number;z:number}[]),cache=new Map<string,TerrainBlock|null>();
      const vr=options.current.mapQuality==='low'?12:19;
      const editedTops=new Map<string,number>();for(const [k,b]of Object.entries(w.voxels?.edits||{})){if(!b)continue;const [ex,ey,ez]=k.split(',').map(Number),col=ex+','+ez;editedTops.set(col,Math.max(editedTops.get(col)||0,ey));}
      const get=(bx:number,by:number,bz:number)=>{const k=`${bx},${by},${bz}`;if(!cache.has(k))cache.set(k,blockAt(w,bx,by,bz));return cache.get(k)!;};
      for(let vz=Math.max(1,y-vr);vz<=Math.min(HEIGHT-2,y+vr);vz++)for(let vx=Math.max(1,x-vr);vx<=Math.min(WIDTH-2,x+vr);vx++)for(let vy=MIN_DEPTH;vy<=Math.max(terrainHeight(w,vx,vz)+4,editedTops.get(vx+','+vz)||0);vy++){
        const b=get(vx,vy,vz);if(!b)continue;
        if(landmarkBlock(vx,vy,vz)&&!Object.hasOwn(w.voxels?.edits||{},`${vx},${vy},${vz}`))continue;
        if(fullCube(b)&&[[1,0,0],[-1,0,0],[0,1,0],[0,-1,0],[0,0,1],[0,0,-1]].every(([dx,dy,dz])=>{const neighbor=get(vx+dx,vy+dy,vz+dz);return !!neighbor&&fullCube(neighbor);}))continue;
        blocks[renderBlocks.indexOf(b)].push({x:vx,y:vy,z:vz});
      }
      blocks.forEach((positions,i)=>{if(!positions.length)return;const m=new THREE.InstancedMesh(construction.get(renderBlocks[i]),voxelMaterials[i],positions.length),matrix=new THREE.Matrix4();positions.forEach((v,j)=>{matrix.makeRotationY((w.voxels?.rotations?.[`${v.x},${v.y},${v.z}`]||0)*Math.PI/2);matrix.setPosition(v.x+.5,v.y+.5,v.z+.5);if(renderBlocks[i]==='door'||renderBlocks[i]==='door-top'){const y=renderBlocks[i]==='door-top'?v.y-1:v.y;const alongX=solid(get(v.x-1,y,v.z))||solid(get(v.x+1,y,v.z));matrix.scale(new THREE.Vector3(alongX?1:.16,1,alongX?.16:1));}m.setMatrixAt(j,matrix);});m.userData.voxels=positions;m.castShadow=true;m.receiveShadow=true;voxelGroup.add(m);});
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
          tile === "water" ? (voxelWater(w,tx,ty)?.surface||0)-(voxelWater(w,tx,ty)?.depth||1)+.025 : solid(blockAt(w,tx,terrainHeight(w,tx,ty)-1,ty))?terrainHeight(w,tx,ty)-.06:-100,
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
        if (tile === "water" || voxelWater(w,tx,ty)) {
          mesh(terrain, box, water, tx + 0.5, (voxelWater(w,tx,ty)?.surface||0)-0.015, ty + 0.5, 1, 0.025, 1);
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
            (a.position3D?.x??a.x)-(w.players[latest.current.selfId].position3D?.x??w.players[latest.current.selfId].x),
            (a.position3D?.z??a.y)-(w.players[latest.current.selfId].position3D?.z??w.players[latest.current.selfId].y),
          ) > 0.5
        ) {
          const image = a.hero?.frames.idle[0] || a.profile?.image;
          if (image)
            billboard(
              actors,
              assetUrl(image),
              a.position3D?.x??a.x + 0.5,
              playerHeight(w,a)+WORLD_SCALE.playerHeight/2,
              a.position3D?.z??a.y + 0.5,
              WORLD_SCALE.playerHeight,
              a.id,
            );
          else mesh(actors, cone, gold, a.position3D?.x??a.x + 0.5, playerHeight(w,a)+.5, a.position3D?.z??a.y + 0.5, 0.2, 1, 0.2);
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
      if(buildRef.current.panel)return;
      const current=latest.current.world.players[latest.current.selfId];
      if(energyOf(current.life)<(kind==='voxel-place'?.1:.02)){latest.current.onEnergyRequest?.();return;}
      ray.setFromCamera(new THREE.Vector2(0,0),camera);
      const h=traceVoxel(latest.current.world,ray.ray.origin,ray.ray.direction);
      if(h){if(kind==='voxel-break'&&Number.isFinite(miningCost(h.block,current))&&energyOf(current.life)<miningCost(h.block,current)){latest.current.onEnergyRequest?.();return;}latest.current.onVoxelAction?.({type:kind,x:h.x+(kind==='voxel-place'?h.normal.x:0),y:h.y+(kind==='voxel-place'?h.normal.y:0),z:h.z+(kind==='voxel-place'?h.normal.z:0),block:buildRef.current.selected,rotation:buildRef.current.rotation});}

    }
    const vertical=(e:KeyboardEvent)=>{if(e.code==='Space'&&!e.repeat&&!buildRef.current.panel&&!document.activeElement?.closest('input,textarea,[role=dialog]')){e.preventDefault();latest.current.onVoxelAction?.({type:'voxel-jump'});}if(e.code==='KeyC'&&!e.repeat&&!buildRef.current.panel&&!document.activeElement?.closest('input,textarea,[role=dialog]'))latest.current.onVoxelAction?.({type:'voxel-dive'});};
    window.addEventListener('keydown',vertical);
    const physicsTimer=window.setInterval(()=>{const a=latest.current.world.players[latest.current.selfId];if(buildRef.current.building&&a?.position3D?.vy)latest.current.onVoxelAction?.({type:'voxel-move',dx:0,dy:0});},80);
    const command=(e:Event)=>performBuild((e as CustomEvent).detail);
    element.addEventListener('voxel-command',command);
    let down: { x: number; y: number } | null = null;
    let ambience:ReturnType<typeof audioService.createRpgAmbience>=null;
    const enableAmbience=()=>{ambience??=audioService.createRpgAmbience();};
    element.addEventListener('pointerdown',enableAmbience);
    const start = (e: PointerEvent) => {
      renderer.domElement.setPointerCapture(e.pointerId);
      down = { x: e.clientX, y: e.clientY };
    };
    const moveLook = (e: PointerEvent) => {
      if (!down) return;
      const dx=e.clientX-down.x, dy=e.clientY-down.y;
      down={x:e.clientX,y:e.clientY};
      latest.current.onFacing(latest.current.facing-dx*.004);
      setPitch(p=>Math.max(-1.45,Math.min(1.45,p-dy*.006)));
    };
    const end = () => { down=null; };
    const lost = (e: Event) => {
      e.preventDefault();
      latest.current.onUnavailable();
    };
    renderer.domElement.addEventListener("webglcontextlost", lost);
    renderer.domElement.addEventListener("pointerdown", start);
    renderer.domElement.addEventListener("pointerup", end);
    renderer.domElement.addEventListener("pointermove", moveLook);
    renderer.domElement.addEventListener("pointercancel", end);
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
        const nextKey = `${w.voxelRooms?.map(r=>r.revision).join(',')||''}:${w.voxels?.revision||0}:${Math.floor((a.position3D?.x??a.x) / 4)}:${Math.floor((a.position3D?.z??a.y) / 4)}:${w.city?.revision || 0}:${w.life.houses.length}:${resourceStamp}:${farmStamp}:${Math.floor(w.life.time / (Object.values(w.farm?.people||{}).some(f=>f.pets.some(p=>w.voxelRooms?.some(r=>r.id===p.homeId)))?2:8))}`;
        if (nextKey !== key) {
          key = nextKey;
          rebuild(w, Math.floor(a.position3D?.x??a.x), Math.floor(a.position3D?.z??a.y));
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
        const b = a.position3D&&!legacyRegion(a.position3D.x,a.position3D.z)?landscapeEnvironment(w.seed,a.position3D.x,a.position3D.z).biome:biomeAt(a.x,a.y).id;
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
      sun.position.set(camera.position.x - 8, camera.position.y+18, camera.position.z + 9);
      sun.target.position.set(camera.position.x, camera.position.y-1.62, camera.position.z);
      sun.target.updateMatrixWorld();
      skyDome.position.copy(camera.position);
      const phase = calendar(w).phase;
      const exterior=!legacyRegion(camera.position.x,camera.position.z),pool=voxelWater(w,camera.position.x,camera.position.z),underwater=!!pool&&camera.position.y<pool.surface;
      (scene.fog as THREE.FogExp2).density=underwater?.11:camera.position.y>170?.0035:options.current.mapQuality==='low'?.003:.0018;
      if(underwater){scene.background=new THREE.Color('#28748b');(scene.fog as THREE.FogExp2).color.set('#28748b');}
      landscape.update(w,camera.position,time/1000,phase===3,options.current.reducedMotion);
      ambience?.update(camera.position.y,underwater||!!pool,landscape.group.userData.stats.weather==='rain');
      renderer.domElement.dataset.landscape=JSON.stringify(landscape.group.userData.stats);renderer.domElement.dataset.underwater=String(underwater);
      const underground=!underwater&&camera.position.y<terrainHeight(w,Math.floor(camera.position.x),Math.floor(camera.position.z))-.5;lamp.position.copy(camera.position);lamp.intensity=underground?3:0;const nearest=oasisCenters(w).reduce((a,b)=>Math.hypot(b.x-camera.position.x,b.z-camera.position.z)<Math.hypot(a.x-camera.position.x,a.z-camera.position.z)?b:a);oasisLight.position.set(nearest.x,nearest.depth+1,nearest.z);oasisLight.intensity=underground?2.5:0;
      const brightness = underground?.1:phase === 3 ? 0.48 : phase === 2 ? 0.8 : 1;
      skyMaterial.uniforms.dark.value = brightness;
      skyMaterial.uniforms.tone.value.copy((scene.fog as THREE.FogExp2).color);
      sun.intensity = underground?.08:phase === 3 ? 0.5 : 2.1;
      camera.fov = 72 / options.current.zoom;
      camera.updateProjectionMatrix();
      models.update(Math.min(.1,(time-last)/1000||.016),options.current.reducedMotion);animatedWater.update(options.current.reducedMotion?0:time/1000);
      renderer.domElement.dataset.workshopModels=String(construction.readyShapes);renderer.domElement.dataset.eyeHeight=String(EYE_HEIGHT);renderer.domElement.dataset.pitch=String(buildRef.current.pitch);renderer.domElement.dataset.cameraY=String(camera.position.y);renderer.domElement.dataset.artStyle='storybook-fantasy';renderer.domElement.dataset.blenderModels=String(models.ready?models.group.userData.models:0);renderer.domElement.dataset.blenderAnimations=String(models.group.userData.animations||0);
      outline.visible=false;ghost.visible=false;
      if(buildRef.current.building){ray.setFromCamera(new THREE.Vector2(0,0),camera);const h=traceVoxel(w,ray.ray.origin,ray.ray.direction);let t:{block:TerrainBlock;cost:number}|null=null;
        if(h){outline.position.set(h.x+.5,h.y+.5,h.z+.5);outline.visible=true;t={block:h.block,cost:miningCost(h.block,w.players[latest.current.selfId])};
          if(!buildRef.current.panel){const x=h.x+h.normal.x,y=h.y+h.normal.y,z=h.z+h.normal.z,chosen=buildRef.current.selected;ghost.geometry=construction.get(chosen);ghost.position.set(x+.5,y+.5,z+.5);ghost.rotation.y=buildRef.current.rotation*Math.PI/2;ghost.visible=true;const valid=!blockAt(w,x,y,z)&&!protectedVoxel(w,x,z)&&y>MIN_DEPTH&&y<=MAX_HEIGHT&&(w.players[latest.current.selfId].life?.bag[chosen]||0)>0&&!Object.values(w.players).some(q=>Math.floor(q.position3D?.x??q.x+.5)===x&&Math.floor(q.position3D?.z??q.y+.5)===z&&y>=playerHeight(w,q)&&y<playerHeight(w,q)+2);ghostMaterial.color.set(valid?'#89e0ac':'#ed9079');}}
        const k=t?t.block+':'+t.cost:'';if(k!==lastTarget){lastTarget=k;setTarget(t);}}

      last = time;
      renderer.render(scene, camera);
      raf = requestAnimationFrame(draw);
    };
    raf = requestAnimationFrame(draw);
    return () => {
      disposed = true;window.removeEventListener('keydown',vertical);clearInterval(physicsTimer);
      element.removeEventListener('pointerdown',enableAmbience);ambience?.dispose();
      cancelAnimationFrame(raf);
      observer.disconnect();
      renderer.domElement.removeEventListener("webglcontextlost", lost);
      renderer.domElement.removeEventListener("pointerdown", start);
      renderer.domElement.removeEventListener("pointerup", end);
      renderer.domElement.removeEventListener("pointermove", moveLook);
      renderer.domElement.removeEventListener("pointercancel", end);
      element.removeEventListener("voxel-command",command);voxelGroup.children.forEach(o=>{if(o instanceof THREE.InstancedMesh)o.dispose();});voxelGeometry.dispose();construction.dispose();voxelMaterials.forEach(m=>{m.map?.dispose();m.dispose();});outlineMaterial.dispose();ghostMaterial.dispose();
      landscape.dispose();models.dispose();
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
  return <div className="rpg-world-3d" ref={host}>{building&&me&&me.position3D?.oxygen!==undefined&&me.position3D.oxygen<20&&<div className="rpg-oxygen-meter" aria-label="Oxygen">🫧 <meter min={0} max={20} value={me.position3D.oxygen}/><span>{Math.ceil(me.position3D.oxygen)} s</span></div>}{building&&me&&<LandscapeCompass x={me.position3D?.x??me.x} z={me.position3D?.z??me.y} languageMode={props.languageMode}/ >}{building&&<div className="rpg-voxel-dock" onPointerDown={e=>e.stopPropagation()}>

    <header><span>⚡ {(me?.life?.energy??6).toFixed(2)}/6 · Y {me?playerHeight(props.world,me).toFixed(1):0}</span><button aria-label={text('スロット設定')} aria-expanded={editSlot} onClick={()=>setEditSlot(!editSlot)}>⚙</button></header>
    <div className="rpg-voxel-slots">{slots.map((b,i)=><button key={i} aria-label={`${text('スロット')} ${i+1}: ${text(MATERIAL_NAMES[b])}`} aria-pressed={selectedSlot===i} onClick={()=>setSelectedSlot(i)}><svg viewBox="0 0 32 32" aria-hidden="true"><path fill={VOXEL_COLORS[b]} d="M16 2 30 9v15L16 31 2 24V9z"/><path fill="#ffffff40" d="m16 2 14 7-14 7L2 9z"/><path fill="#00000030" d="m16 16 14-7v15l-14 7z"/></svg><small>{text(MATERIAL_NAMES[b])}</small><b>{me?.life?.bag[b]||0}</b></button>)}</div>
    <div className="rpg-workshop-actions"><button onClick={()=>setEditSlot(true)}>{text("建築工房")}</button><button aria-label={text("建材を回転")} onClick={()=>setRotation(r=>(r+1)%4)}>↻ {rotation*90}°</button></div>
    <div className="rpg-voxel-actions"><button aria-label="Jump / Swim up" onClick={()=>props.onVoxelAction?.({type:'voxel-jump'})}>↑</button><button aria-label="Dive" onClick={()=>props.onVoxelAction?.({type:'voxel-dive'})}>↓</button><button disabled={energyOf(me?.life)>=.1&&!!target&&!Number.isFinite(target.cost)} onClick={()=>command('voxel-break')}>⛏ {text('壊す')}</button><button disabled={energyOf(me?.life)>=.1&&(me?.life?.bag[selected]||0)<1} onClick={()=>command('voxel-place')}>＋ {text('置く')}</button></div>
    <small className="rpg-voxel-target">{target?text(target.block==='bedrock'?'岩盤':target.block==='oasis-water'?'地下の水':target.block==='door-top'?'ドア':MATERIAL_NAMES[target.block]):text('照準をブロックに合わせる')} · ⚡ {target?(Number.isFinite(target.cost)?target.cost.toFixed(2):'—'):'0.10'}</small>
  </div>}{building&&editSlot&&<VoxelWorkshopPanel world={props.world} selfId={props.selfId} languageMode={props.languageMode||"JAPANESE"} send={a=>props.onVoxelAction?.(a)} onChoose={block=>setSlots(slots=>slots.map((b,i)=>i===selectedSlot?block:b))} onClose={()=>setEditSlot(false)}/>}{building&&<span className="rpg-voxel-crosshair">＋</span>}</div>;
}
