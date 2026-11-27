import * as T from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import type { World } from '../engine';
import { terrainHeight } from '../voxel';
import { assetUrl } from '../../utils/assetPaths';
import { animalPose, type AnimalMoment } from './animalMotion';
import { creatureHasArt } from './creatureArt';
import { ranchArt, ranchPosition } from '../farm/animalLook';
import { visibleWildlife, WILDLIFE } from './wildlife';

type Animal = { id: string; kind: string; bond: number; moment?: AnimalMoment };
type Placement = { id: string; animal: Animal; art: string; x: number; y: number; z: number };
type Instance = { model: T.Object3D; art: string; parts: Map<string, T.Object3D>; pos: T.Vector3; yaw: number; walking: number };

export class CreatureModels {
  readonly group = new T.Group();
  ready = false;
  private assets?: T.Group;
  private closed = false;
  private instances = new Map<string, Instance>();
  private revision = -1;
  private world: World | null = null;
  private cell = '';
  private layoutTime = -1;
  private placements: Placement[] = [];

  constructor(parent: T.Object3D, private lowQuality: boolean) {
    parent.add(this.group);
    this.group.name = 'RpgCreatures';
    new GLTFLoader().load(assetUrl('models/storybook/rpg-creatures.glb'), gltf => {
      this.assets = gltf.scene;
      if (this.closed) this.disposeAssets();
      else this.ready = true;
    }, undefined, () => {});
  }

  private select(w: World, focus: T.Vector3) {
    const list: Placement[] = [];
    const put = (owner: string, animal: Animal, x: number, y: number, z: number, art=animal.kind) => {
      if (creatureHasArt(art) && Math.hypot(focus.x-x, focus.z-z) <= (this.lowQuality ? 13 : 23)) {
        list.push({ id: owner + ':' + animal.id, animal, art, x, y, z });
      }
    };
    for (const [owner, farm] of Object.entries(w.farm?.people ?? {})) {
      farm.animals.forEach((animal, i) => {
        const pos=ranchPosition(w,farm,animal,i);
        if (pos) put(owner,animal,pos.x,terrainHeight(w,Math.floor(pos.x),Math.floor(pos.z)),pos.z,ranchArt(w,animal));
      });
      for (const pet of farm.pets) {
        const room = w.voxelRooms?.find(r => r.id === pet.homeId);
        if (!room?.cells.length) continue;
        const x = pet.roomPos?.x ?? room.cells[0].x;
        const z = pet.roomPos?.y ?? room.cells[0].z;
        put(owner, pet, x + .5, room.floor, z + .5);
      }
    }
    for (const animal of visibleWildlife(w,focus.x,focus.z,this.lowQuality ? 13 : 23,focus.y)) {
      put('habitat',animal,animal.x,animal.y,animal.z);
    }
    return list.sort((a,b)=>Math.hypot(a.x-focus.x,a.z-focus.z)-Math.hypot(b.x-focus.x,b.z-focus.z))
      .slice(0,this.lowQuality ? 10 : 18);
  }

  private create(p: Placement) {
    const data = this.assets?.getObjectByName(p.art);
    if (!data) return null;
    const model = data.clone(true);
    const parts = new Map<string, T.Object3D>();
    model.traverse(o=>{
      if (typeof o.userData.part === 'string') parts.set(o.userData.part, o);
      if (o instanceof T.Mesh) { o.castShadow = !this.lowQuality; o.receiveShadow = true; }
    });
    const pos = new T.Vector3(p.x,p.y,p.z);
    const q = { model, art:p.art, parts, pos, yaw: Math.PI*.56, walking: 0 };
    this.group.add(model);
    this.instances.set(p.id,q);
    return q;
  }

  private animate(instance: Instance, p: Placement, worldTime: number, time: number, dt: number, reduced: boolean) {
    const { model, parts, pos } = instance;
    const target = new T.Vector3(p.x,p.y,p.z);
    const offset = target.clone().sub(pos);
    const speed = offset.length();
    if (speed > .05) instance.yaw = Math.atan2(-offset.x,-offset.z);
    instance.walking = Math.max(0, instance.walking - dt*4);
    if (speed > .07) instance.walking = Math.min(1, instance.walking+dt*8);
    pos.lerp(target, reduced || speed > 3 ? 1 : 1 - Math.exp(-dt*7));
    model.position.copy(pos);
    const turn = T.MathUtils.euclideanModulo(instance.yaw-model.rotation.y+Math.PI,Math.PI*2)-Math.PI;
    model.rotation.y += turn * (reduced ? 1 : 1-Math.exp(-dt*12));

    const pose = animalPose(p.animal, worldTime);
    const tick = reduced ? 0 : time + (p.animal.id.length*37 % 13)*.11;
    const sleep = pose === 'sleep';
    const stride=pose==='run' ? 1 : pose==='walk' ? Math.max(.47,instance.walking) : instance.walking;
    const wings = p.art==='bees' || WILDLIFE[p.animal.kind]?.art==='flying';
    const swimming = WILDLIFE[p.animal.kind]?.art==='aquatic';
    const hover = wings && !sleep ? .18+Math.sin(tick*5)*.09 : swimming ? Math.sin(tick*4)*.035 : 0;
    const hop = !sleep && pose === 'hop' ? Math.max(0,Math.sin(tick*8))*.17 : 0;
    model.position.y += hover + (reduced ? 0 : hop);
    const jelly=p.animal.kind==='crystal-slime';
    const breathe=sleep ? .80+Math.sin(tick*2)*.026 : jelly ? .84+.16*Math.cos(tick*8) : 1+Math.sin(tick*2.9)*.018;
    model.scale.set(jelly?1+(1-breathe)*.42:1,breathe,jelly?1+(1-breathe)*.42:1);
    const lift = parts.get('head');
    if (lift) {
      lift.rotation.x = pose==='eat' ? .41+Math.sin(tick*8)*.08 : sleep ? .22 : .05+Math.sin(tick*3.1)*.11;
      lift.rotation.z = sleep ? 0 : Math.sin(tick*1.4)*.09 + (pose==='roll'?.14:0);
      lift.rotation.y = sleep ? .16 : Math.sin(tick*1.1)*.17;
    }
    const tail = parts.get('tail');
    if (tail) {
      tail.rotation.y = Math.sin(tick*(swimming ? 11 : pose==='greet' ? 10 : 4))*(sleep?.07:.36);
      tail.rotation.x = Math.cos(tick*(p.animal.kind==='dolphin'?7:3))*(p.animal.kind==='dolphin'?.32:.10);
    }
    for (const [name,joint] of parts) {
      if (!name.startsWith('tentacle_')) continue;
      const [,side,index]=name.split('_').map(Number);
      joint.rotation.y=side*Math.sin(tick*4+index*.7)*.24;
      joint.rotation.z=Math.sin(tick*5+index)*.20;
    }
    for (const side of ['left','right']) {
      const polarity = side === 'left' ? 1 : -1;
      const ear = parts.get('ear_'+side);
      if (ear) ear.rotation.z = polarity * (sleep ? .17 : Math.sin(tick*5)*.08);
      const wing = parts.get('wing_'+side);
      if (wing) wing.rotation.z = polarity * (sleep ? .4 : wings ? Math.sin(tick*26)*.74 : Math.sin(tick*7)*.21);
      for (const leg of ['front','rear']) {
        const joint = parts.get('leg_'+leg+'_'+side);
        if (joint) joint.rotation.x = Math.sin(tick*(pose==='run'?16:10)+polarity*(leg==='front'?1:-1)*Math.PI/2)*.44*stride;
      }
    }
  }

  update(w: World, focus: T.Vector3, time: number, dt: number, reduced: boolean) {
    if (!this.ready || this.closed) return;
    const cell = `${Math.floor(focus.x/4)},${Math.floor(focus.z/4)}`;
    const layoutTime=Math.floor(w.life.time*2);
    if (this.world !== w || this.revision !== w.revision || this.cell !== cell || this.layoutTime!==layoutTime) {
      this.world = w;
      this.revision = w.revision;
      this.cell = cell;
      this.layoutTime = layoutTime;
      this.placements = this.select(w,focus);
      const visible = new Map(this.placements.map(p=>[p.id,p.art]));
      for (const [id, object] of this.instances) if (visible.get(id)!==object.art) {
        object.model.removeFromParent(); this.instances.delete(id);
      }
    }
    for (const p of this.placements) {
      const instance = this.instances.get(p.id) ?? this.create(p);
      if (instance) this.animate(instance,p,w.life.time,time,dt,reduced);
    }
  }

  has(id: string) { return this.instances.has(id); }
  get count() { return this.instances.size; }

  private disposeAssets() {
    const geometries = new Set<T.BufferGeometry>(), materials = new Set<T.Material>();
    this.assets?.traverse(o=>{
      if (!(o instanceof T.Mesh)) return;
      geometries.add(o.geometry);
      (Array.isArray(o.material)?o.material:[o.material]).forEach(m=>materials.add(m));
    });
    geometries.forEach(g=>g.dispose()); materials.forEach(m=>m.dispose());
    this.assets = undefined;
  }

  dispose() {
    this.closed = true;
    this.instances.clear();
    this.group.clear();
    this.group.removeFromParent();
    this.disposeAssets();
  }
}
