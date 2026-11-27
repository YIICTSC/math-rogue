import * as T from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { assetUrl } from '../utils/assetPaths';
import type { World } from './engine';
import { watercraft } from './transport';
import { WATERCRAFT, WATERCRAFT_LIMIT } from './transportCatalog';

type Placement = { id: string; model: string; x: number; y: number; z: number; angle: number };

export class TransportModels {
  private readonly material=new T.MeshStandardMaterial({vertexColors:true,roughness:.69,metalness:.06});
  private readonly wingMaterial=new T.MeshStandardMaterial({vertexColors:true,roughness:.88,side:T.DoubleSide});
  private readonly models=new Map<string,T.InstancedMesh>();
  private readonly smoothed=new Map<string,T.Vector3>();
  private readonly transform=new T.Object3D();
  private disposed=false;
  private requested=false;

  constructor(private readonly scene:T.Object3D,private readonly ready:(models:number)=>void) {}

  private load() {
    this.requested=true;
    new GLTFLoader().load(assetUrl('models/storybook/rpg-watercraft.glb'),({scene})=>{
      scene.updateMatrixWorld(true);
      if (!this.disposed) for (const root of scene.children) {
        if (!Object.hasOwn(WATERCRAFT,root.name) && root.name!=='glider_wing') continue;
        const parts:T.BufferGeometry[]=[];
        root.traverse(part=>{
          if (!(part instanceof T.Mesh) || !(part.material instanceof T.MeshStandardMaterial)) return;
          const geom=(part.geometry.index?part.geometry.toNonIndexed():part.geometry.clone()).applyMatrix4(part.matrixWorld);
          for (const name of Object.keys(geom.attributes)) if (name!=='position'&&name!=='normal') geom.deleteAttribute(name);
          if (!geom.hasAttribute('normal')) geom.computeVertexNormals();
          const colors=new Float32Array(geom.attributes.position.count*3);
          for (let i=0;i<colors.length;i+=3) part.material.color.toArray(colors,i);
          geom.setAttribute('color',new T.BufferAttribute(colors,3));
          parts.push(geom);
        });
        const geometry=parts.length?mergeGeometries(parts):null;
        parts.forEach(geom=>geom.dispose());
        if (!geometry) continue;
        const material=root.name==='glider_wing'?this.wingMaterial:this.material;
        const mesh=new T.InstancedMesh(geometry,material,WATERCRAFT_LIMIT);
        mesh.frustumCulled=false;
        mesh.castShadow=true;
        mesh.receiveShadow=true;
        mesh.count=0;
        this.scene.add(mesh);
        this.models.set(root.name,mesh);
      }
      scene.traverse(part=>{
        if (!(part instanceof T.Mesh)) return;
        part.geometry.dispose();
        (Array.isArray(part.material)?part.material:[part.material]).forEach(material=>material.dispose());
      });
      if (!this.disposed) this.ready(this.models.size);
    },undefined,()=>{if (!this.disposed) this.ready(0);});
  }

  update(world:World,focus:T.Vector3,time:number,dt:number,reduced:boolean,hiddenPilot?:string) {
    const objects:Placement[]=watercraft(world).map(boat=>({...boat,model:boat.item,angle:boat.heading}));
    for (const p of Object.values(world.players)) if (!p.spectator&&p.gliding&&p.position3D?.y!==undefined&&p.id!==hiddenPilot) {
      objects.push({id:`wing-${p.id}`,model:'glider_wing',x:p.position3D.x,y:p.position3D.y,z:p.position3D.z,
        angle:Math.atan2(p.gliding.dx,-p.gliding.dz)});
    }
    if (!this.requested && objects.length) this.load();
    if (!this.models.size) return;
    for (const mesh of this.models.values()) mesh.count=0;
    const visible=new Set<string>();
    const smoothing=reduced?1:1-Math.exp(-dt*13);
    for (const target of objects) {
      const mesh=this.models.get(target.model);
      if (!mesh || Math.hypot(target.x-focus.x,target.z-focus.z)>43) continue;
      visible.add(target.id);
      let position=this.smoothed.get(target.id);
      if (!position) this.smoothed.set(target.id,position=new T.Vector3(target.x,target.y,target.z));
      this.transform.position.set(target.x,target.y,target.z);
      position.lerp(this.transform.position,smoothing);
      this.transform.position.copy(position);
      this.transform.rotation.set(0,-target.angle,0);
      if (target.model!=='glider_wing'&&!reduced) {
        this.transform.position.y+=Math.sin(time*2.5+target.x)*.023;
        this.transform.rotation.z=Math.sin(time*1.6+target.z)*.027;
      }
      this.transform.updateMatrix();
      mesh.setMatrixAt(mesh.count++,this.transform.matrix);
    }
    for (const id of this.smoothed.keys()) if (!visible.has(id)) this.smoothed.delete(id);
    for (const mesh of this.models.values()) mesh.instanceMatrix.needsUpdate=true;
  }

  dispose() {
    this.disposed=true;
    for (const mesh of this.models.values()) {
      mesh.removeFromParent();
      mesh.geometry.dispose();
      mesh.dispose();
    }
    this.material.dispose();
    this.wingMaterial.dispose();
  }
}
