import * as T from 'three';
import { GLTFLoader, type GLTF } from 'three/addons/loaders/GLTFLoader.js';
import { assetUrl } from '../utils/assetPaths';
export type StorybookModel = 'oak'|'cherry'|'autumn'|'pine'|'snowpine'|'rock'|'flowers'|'mushrooms'|'cottage'|'clubhouse'|'snowcottage'|'tower'|'arch'|'lantern'|'bridge'|'bench'|'cactus'|'windmill'|'butterfly';
export interface Placement { model: StorybookModel; x: number; y?: number; z: number; scale?: number; yaw?: number; tile?: {x:number;y:number}; }
/** Each scene owns its parsed GLB. Repeated decoration shares geometry/material through instancing. */
export class StorybookModels {
  readonly group = new T.Group();
  ready = false; failed = false;
  private source?: GLTF;
  private placements: Placement[] = [];
  private mixers: T.AnimationMixer[] = [];
  private closed = false;
  constructor(parent: T.Object3D, private onReady?: () => void, private placementAllowed?: (placement: Placement, bounds: readonly T.Box3[]) => boolean) {
    parent.add(this.group); this.group.name = 'BlenderStorybook';
    new GLTFLoader().load(assetUrl('models/storybook/storybook-v1.glb'), gltf => {
      this.source = gltf;
      if (this.closed) { this.releaseSource(); return; }
      this.ready = true; this.rebuild(); this.onReady?.();
    }, undefined, error => { if (!this.closed) { this.failed = true; console.warn('Storybook model loading failed; using existing scene.', error); } });
  }
  set(placements: Placement[]) { this.placements = placements; if (this.ready && !this.closed) this.rebuild(); }
  private clear() {
    this.mixers.forEach(m=>{m.stopAllAction();m.uncacheRoot(m.getRoot());});this.mixers=[];
    this.group.traverse(o=>{if(o instanceof T.InstancedMesh)o.dispose();});this.group.clear();
  }
  private rebuild() {
    this.clear();const source = this.source!;
    const byName = new Map<string, Placement[]>();for(const p of this.placements){const list=byName.get(p.model)||[];list.push(p);byName.set(p.model,list);}
    let rejected=0;
    for(const [name,candidates] of byName){
      const asset=source.scene.getObjectByName(name);if(!asset)continue;asset.updateWorldMatrix(true,true);
      const inverse=asset.matrixWorld.clone().invert(),dummy=new T.Object3D(),world=new T.Matrix4();
      let items=candidates;
      if(this.placementAllowed){
        const bounds:T.Box3[]=[];
        asset.traverse(o=>{if(o instanceof T.Mesh){o.geometry.computeBoundingBox();bounds.push(o.geometry.boundingBox!.clone().applyMatrix4(new T.Matrix4().multiplyMatrices(inverse,o.matrixWorld)));}});
        // Animated blades must stay clear throughout their sweep, not just at frame zero.
        if(name==='windmill'||name==='butterfly'){
          const combined=new T.Box3();bounds.forEach(b=>combined.union(b));
          const radius=Math.max(combined.min.length(),combined.max.length())*2;
          bounds.splice(0,bounds.length,new T.Box3(new T.Vector3(-radius,-radius,-radius),new T.Vector3(radius,radius,radius)));
        }
        items=candidates.filter(p=>{dummy.position.set(p.x,p.y??0,p.z);dummy.scale.setScalar(p.scale??1);dummy.rotation.set(0,p.yaw??0,0);dummy.updateMatrix();return this.placementAllowed!(p,bounds.map(b=>b.clone().applyMatrix4(dummy.matrix)));});
        rejected+=candidates.length-items.length;
      }
      if(!items.length)continue;
      if(name==='windmill'||name==='butterfly'){
        for(const p of items){const root=new T.Group(),clone=asset.clone(true);root.add(clone);root.position.set(p.x,p.y??0,p.z);root.scale.setScalar(p.scale??1);root.rotation.y=p.yaw??0;this.group.add(root);
          clone.traverse(o=>{if(p.tile)o.userData.tile=p.tile;if(o instanceof T.Mesh){o.castShadow=true;o.receiveShadow=true;}});
          const mixer=new T.AnimationMixer(clone);
          for(const clip of source.animations){if(name==='windmill' ? clip.name.includes('Windmill') : clip.name.includes('Butterfly'))mixer.clipAction(clip).play();}
          this.mixers.push(mixer);
        }continue;
      }
      asset.traverse(o=>{if(!(o instanceof T.Mesh))return;
        const local=new T.Matrix4().multiplyMatrices(inverse,o.matrixWorld);
        const batch=new T.InstancedMesh(o.geometry,o.material,items.length);batch.castShadow=true;batch.receiveShadow=true;
        items.forEach((p,i)=>{dummy.position.set(p.x,p.y??0,p.z);dummy.scale.setScalar(p.scale??1);dummy.rotation.set(0,p.yaw??0,0);dummy.updateMatrix();world.multiplyMatrices(dummy.matrix,local);batch.setMatrixAt(i,world);});
        batch.userData.tiles=items.map(p=>p.tile);batch.computeBoundingSphere();this.group.add(batch);
      });
    }
    this.group.userData.models=this.placements.length-rejected;this.group.userData.animations=this.mixers.length;
    this.group.userData.filteredModels=rejected;
  }
  update(dt: number, reducedMotion = false) { if(!reducedMotion)for(const mixer of this.mixers)mixer.update(Math.min(.1,dt)); }
  private releaseSource(){if(!this.source)return;const geometries=new Set<T.BufferGeometry>(),materials=new Set<T.Material>();this.source.scene.traverse(o=>{if(o instanceof T.Mesh){geometries.add(o.geometry);(Array.isArray(o.material)?o.material:[o.material]).forEach(m=>materials.add(m));}});geometries.forEach(g=>g.dispose());materials.forEach(m=>m.dispose());this.source=undefined;}
  dispose(){this.closed=true;this.clear();this.group.removeFromParent();this.releaseSource();}
}
