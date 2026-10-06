import { StorybookModels, type Placement, type StorybookModel } from '../three/storybookModels';
import { configureStorybook, paintedSurface, storybookAtmosphere, storybookWater } from '../three/storybookStyle';
import {storyForSite} from './stories';
import { residentsOf } from "./town/residents";
import { residentPosition } from "./town/worldResidents";
import React, { useEffect, useRef } from "react";
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
    const spriteMaterials = new Map<string, THREE.SpriteMaterial>();
    function billboard(
      parent: THREE.Group,
      src: string,
      x: number,
      y: number,
      z: number,
      size = 1.2,
      player?: string,
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
      sprite.position.set(x + 0.5, size / 2, z + 0.5);
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
      last = 0;
    const p = props.world.players[props.selfId];
    camera.position.set((p?.x || 0) + 0.5, 1.05, (p?.y || 0) + 0.5);
    function rebuild(w: World, x: number, y: number) {
      batches.splice(0).forEach((b) => b.dispose());
      terrain.clear();placements=[];
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
          tile === "water" ? -0.11 : -0.06,
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
        } else if (tile === "forest" && !removed) {
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
      for (const farm of Object.values(w.farm?.people || {}))
        if (
          farm.x !== undefined &&
          farm.y !== undefined &&
          near(farm as { x: number; y: number })
        ) {
          mesh(
            terrain,
            box,
            soil,
            farm.x + 3.5,
            -0.005,
            farm.y + 3.5,
            7,
            0.04,
            7,
          );
          for (let a = 0; a < 7; a++) {
            mesh(
              terrain,
              box,
              wood,
              farm.x + a + 0.5,
              0.22,
              farm.y,
              0.06,
              0.45,
              0.06,
            );
            mesh(
              terrain,
              box,
              wood,
              farm.x + a + 0.5,
              0.22,
              farm.y + 7,
              0.06,
              0.45,
              0.06,
            );
          }
          for (const plot of farm.plots) {
            if (plot.crop)
              billboard(
                terrain,
                assetUrl(farmImage("crop", plot.crop)),
                farm.x + (plot.slot % 6) + 0.5,
                0.3,
                farm.y + Math.floor(plot.slot / 6) + 1.5,
                plot.growth > 1 ? 0.65 : 0.38,
              );
          }
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
      mesh(terrain, box, leaf, WIDTH / 2, -0.2, HEIGHT / 2, WIDTH, 0.1, HEIGHT);
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
      placements.push({model:'butterfly',x:w.players[latest.current.selfId].x+.8,y:1.1,z:w.players[latest.current.selfId].y+1.5,scale:.7});
      models.set(placements);
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
        if (f.x !== undefined && f.y !== undefined)
          f.pets.forEach((pet, i) => {
            if (pet.awayUntil || pet.id === f.activePet) return;
            const sprite = billboard(
              actors,
              assetUrl(farmImage("pet", pet.kind)),
              f.x! + i + 0.5,
              0.3,
              f.y! + 6.5,
              0.6,
            );
            sprite.userData.animal = pet;
            sprite.userData.owner = id;
            sprite.userData.collection = "pets";
            sprite.userData.base = 0.3;
            sprite.userData.size = 0.6;
          });
        const pet = f.pets.find((p) => p.id === f.activePet && !p.awayUntil),
          owner = w.players[id];
        if (pet && owner && !owner.life?.indoors) {
          const sprite = billboard(
            actors,
            assetUrl(farmImage("pet", pet.kind)),
            owner.x + 1.5,
            0.3,
            owner.y + 0.5,
            0.6,
          );
          sprite.userData.animal = pet;
          sprite.userData.owner = id;
          sprite.userData.collection = "pets";
          sprite.userData.base = 0.3;
          sprite.userData.size = 0.6;
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
              a.x + 0.5,
              0.65,
              a.y + 0.5,
              1.3,
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
    let down: { x: number; y: number } | null = null;
    const start = (e: PointerEvent) => {
      down = { x: e.clientX, y: e.clientY };
    };
    const end = (e: PointerEvent) => {
      if (!down) return;
      const dx = e.clientX - down.x,
        dy = e.clientY - down.y;
      down = null;
      if (Math.abs(dx) > 35 && Math.abs(dx) > Math.abs(dy)) {
        latest.current.onFacing(latest.current.facing + (dx < 0 ? 1 : -1));
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
    const draw = (time: number) => {
      if (disposed) return;
      if (
        latest.current.presentation === "conversation" &&
        time - last < 1000 / 15
      ) {
        raf = requestAnimationFrame(draw);
        return;
      }
      renderer.domElement.dataset.facing = String(latest.current.facing);
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
        const nextKey = `${Math.floor(a.x / 4)}:${Math.floor(a.y / 4)}:${w.city?.revision || 0}:${w.life.houses.length}:${resourceStamp}:${farmStamp}:${Math.floor(w.life.time / 8)}`;
        if (nextKey !== key) {
          key = nextKey;
          rebuild(w, a.x, a.y);
        }
        const nextActors =
          (latest.current.hiddenActors || []).join("|") +
          Object.values(w.players)
            .map(
              (a) =>
                `${a.id}:${a.x}:${a.y}:${a.hero?.portrait.slice(-64) || a.profile?.image.slice(-64) || ""}:${a.life?.indoors || ""}`,
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
        camera.position.x += (a.x + 0.5 - camera.position.x) * smooth;
        camera.position.z += (a.y + 0.5 - camera.position.z) * smooth;
        yaw += shortestTurn(yaw, compassAngle(latest.current.facing)) * smooth;
        camera.lookAt(
          camera.position.x + Math.sin(yaw),
          1.02,
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
      const brightness = phase === 3 ? 0.48 : phase === 2 ? 0.8 : 1;
      skyMaterial.uniforms.dark.value = brightness;
      skyMaterial.uniforms.tone.value.copy((scene.fog as THREE.FogExp2).color);
      sun.intensity = phase === 3 ? 0.5 : 2.1;
      camera.fov = 72 / options.current.zoom;
      camera.updateProjectionMatrix();
      models.update(Math.min(.1,(time-last)/1000||.016),options.current.reducedMotion);atmosphere.update(time/1000,camera.position,options.current.reducedMotion);animatedWater.update(options.current.reducedMotion?0:time/1000);
      renderer.domElement.dataset.artStyle='storybook-fantasy';renderer.domElement.dataset.blenderModels=String(models.ready?models.group.userData.models:0);renderer.domElement.dataset.blenderAnimations=String(models.group.userData.animations||0);
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
  return <div className="rpg-world-3d" ref={host} />;
}
