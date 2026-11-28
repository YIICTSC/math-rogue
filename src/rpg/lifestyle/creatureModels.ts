import * as T from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import type { World } from '../engine';
import { terrainHeight } from '../voxel';
import { assetUrl } from '../../utils/assetPaths';
import { animalPose, type AnimalMoment } from './animalMotion';
import { creatureHasArt } from './creatureArt';
import { collarColor, ranchArt, ranchPosition } from '../farm/animalLook';
import { walkingPet } from '../farm/companions';
import { visibleWildlife, WILDLIFE } from './wildlife';
import { packAnimals } from '../packAnimals';

type Animal = { id: string; kind: string; bond: number; moment?: AnimalMoment; collar?:keyof typeof collarColor };
type Placement = { id: string; animal: Animal; art: string; x: number; y: number; z: number; heading?:number };
type Instance = { model: T.Object3D; art: string; parts: Map<string, T.Object3D>; pos: T.Vector3; yaw: number; walking: number; collar?:T.Mesh };

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
  private saddlebag = new T.BoxGeometry(.19,.23,.31);
  private saddleLeather = new T.MeshStandardMaterial({color:'#754831',roughness:.93});
  private collarTag = new T.OctahedronGeometry(.043);
  private collarMaterials={teal:new T.MeshStandardMaterial({color:collarColor.teal}),amber:new T.MeshStandardMaterial({color:collarColor.amber})};

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
      const companion=w.players[owner]&&walkingPet(w,w.players[owner],farm);
      if(companion){
        const {pet,x,y,z,walk}=companion;
        put(owner,walk&&(!pet.moment||pet.moment.until<=w.life.time)?{...pet,moment:{pose:'walk',until:w.life.time+1}}:pet,x,y,z);
      }
      for (const pet of farm.pets) {
        if(companion?.pet.id===pet.id||pet.awayUntil>w.life.time)continue;
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
    for(const companion of packAnimals(w))if(Math.hypot(focus.x-companion.x,focus.z-companion.z)<(this.lowQuality?13:23)){
      const moving=companion.rider&&w.players[companion.rider]&&w.life.now-w.players[companion.rider].lastMove<900;
      const animal:Animal={...companion,bond:100,moment:{pose:moving?'walk':'greet',until:w.life.time+2}};
      list.push({id:`pack:${companion.id}`,animal,art:companion.kind,x:companion.x,y:companion.y,z:companion.z,heading:-companion.dir});
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
    if(p.heading!==undefined)for(const side of [-1,1]){
      const bag=new T.Mesh(this.saddlebag,this.saddleLeather);
      bag.position.set(side*.275,companionSaddleHeight(p.art),.11);
      bag.rotation.z=side*-.14;
      bag.castShadow=!this.lowQuality;model.add(bag);
    }
    const pos = new T.Vector3(p.x,p.y,p.z);
    const q = { model, art:p.art, parts, pos, yaw: p.heading??Math.PI*.56, walking: 0 };
    this.group.add(model);
    this.instances.set(p.id,q);
    return q;
  }

  private animate(instance: Instance, p: Placement, worldTime: number, time: number, dt: number, reduced: boolean) {
    const { model, parts, pos } = instance;
    const target = new T.Vector3(p.x,p.y,p.z);
    const offset = target.clone().sub(pos);
    const speed = offset.length();
    if(p.heading!==undefined)instance.yaw=p.heading;
    else if (speed > .05) instance.yaw = Math.atan2(-offset.x,-offset.z);
    instance.walking = Math.max(0, instance.walking - dt*4);
    if (speed > .07) instance.walking = Math.min(1, instance.walking+dt*8);
    pos.lerp(target, reduced || speed > 3 ? 1 : 1 - Math.exp(-dt*7));
    model.position.copy(pos);
    const turn = T.MathUtils.euclideanModulo(instance.yaw-model.rotation.y+Math.PI,Math.PI*2)-Math.PI;
    model.rotation.y += turn * (reduced ? 1 : 1-Math.exp(-dt*12));

    const pose = animalPose(p.animal, worldTime);
    const tick = reduced ? 0 : time + (p.animal.id.length*37 % 13)*.11;
    const sleep = pose === 'sleep';
    const seated=pose==='sit'||pose==='paw';
    const stride=pose==='run' ? 1 : pose==='walk' ? Math.max(.47,instance.walking) : instance.walking;
    const wings = p.art==='bees' || p.art==='dragon' || WILDLIFE[p.animal.kind]?.art==='flying';
    const swimming = WILDLIFE[p.animal.kind]?.art==='aquatic';
    const hover = wings && !sleep ? .18+Math.sin(tick*5)*.09 : swimming ? Math.sin(tick*4)*.035 : 0;
    const hop = !sleep && pose === 'hop' ? Math.max(0,Math.sin(tick*8))*.17 : 0;
    model.position.y += hover + (reduced ? 0 : hop);
    const jelly=p.animal.kind==='crystal-slime';
    const breathe=sleep ? .80+Math.sin(tick*2)*.026 : seated?.87:jelly ? .84+.16*Math.cos(tick*8) : 1+Math.sin(tick*2.9)*.018;
    model.scale.set(jelly?1+(1-breathe)*.42:1,breathe,jelly?1+(1-breathe)*.42:1);
    const roll=pose==='roll'?.37+Math.sin(tick*3)*.12:pose==='groom'?.12:0;
    model.position.y+=roll*.12;
    model.rotation.z+=(roll-model.rotation.z)*(reduced?1:1-Math.exp(-dt*8));
    model.rotation.x+=((pose==='bow'?.14:seated?-.11:0)-model.rotation.x)*(reduced?1:1-Math.exp(-dt*8));
    const lift = parts.get('head');
    if (lift) {
      const peck=p.animal.kind==='chicken';
      lift.rotation.x = pose==='eat' ? .41+Math.sin(tick*(peck?16:8))*(peck?.28:.08)
        : pose==='drink'||pose==='bow'?.48+Math.sin(tick*4)*.05:sleep ? .22 : .05+Math.sin(tick*3.1)*.11;
      lift.rotation.z = sleep ? 0 : Math.sin(tick*1.4)*.09 + (pose==='groom'?.27:pose==='roll'?.14:0);
      lift.rotation.y = sleep ? .16 : Math.sin(tick*1.1)*.17;
      if(p.animal.collar&&!instance.collar){
        const tag=new T.Mesh(this.collarTag,this.collarMaterials[p.animal.collar]);
        const bounds=new T.Box3().setFromObject(lift),center=lift.worldToLocal(bounds.getCenter(new T.Vector3()));
        tag.position.set(center.x,center.y-(bounds.max.y-bounds.min.y)*.46,center.z-(bounds.max.z-bounds.min.z)*.30);
        lift.add(tag);instance.collar=tag;
      }
      if(instance.collar){
        instance.collar.visible=!!p.animal.collar;
        if(p.animal.collar)instance.collar.material=this.collarMaterials[p.animal.collar];
      }
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
        if (joint) joint.rotation.x=pose==='paw'&&leg==='front'&&side==='left'?-.74+Math.sin(tick*6)*.16:
          seated&&leg==='rear'?.29:Math.sin(tick*(pose==='run'?16:10)+polarity*(leg==='front'?1:-1)*Math.PI/2)*.44*stride;
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
    this.saddlebag.dispose();
    this.saddleLeather.dispose();
    this.collarTag.dispose();
    Object.values(this.collarMaterials).forEach(material=>material.dispose());
  }
}

const companionSaddleHeight=(art:string)=>art==='camel'?1.01:art==='donkey'?.72:.82;
