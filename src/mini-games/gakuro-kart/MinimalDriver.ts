import * as T from 'three';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';
import {ProtagonistModel} from '../../three/protagonistModel';
import {prepareStorybookCharacters} from '../../three/storybookCharacters';
import {createAvatarParts,type AvatarPart} from './avatarModels';
import {AVATAR_COLORS,BODY_COLORS,HAIR_COLORS,EYE_COLORS,type KartAvatar} from './avatar';
export const driverAppearanceKey=(a:KartAvatar)=>a.protagonist||(a.customBase?JSON.stringify([a.customBase,a.customHair,a.body,a.hair,a.outfit,a.bottom,a.wardrobe]):undefined)||[a.species,a.body,a.outfit,a.hair,a.accessory,a.hairStyle,a.expression,a.faceShape??0,a.faceStyle??0,a.eyeStyle??0,a.eyeColor??0].join(',');

// Bake the selected character once, not its animation/skeleton every frame.
// Geometry is shared by matching racers and owned by this race scene only.
export class MinimalDriverLibrary {
 private cache=new Map<string,Promise<T.BufferGeometry>>();
 private geometries=new Set<T.BufferGeometry>();
 private avatarParts?:AvatarPart[];
 private disposed=false;
 readonly material=new T.MeshBasicMaterial({vertexColors:true,side:T.DoubleSide});
 get(avatar:KartAvatar){
  const key=driverAppearanceKey(avatar);
  let pending=this.cache.get(key);
  if(!pending){pending=this.bake({...avatar}).then(geometry=>{if(this.disposed){geometry.dispose();throw Error('Driver scene closed');}this.geometries.add(geometry);return geometry;});this.cache.set(key,pending);pending.catch(()=>{if(this.cache.get(key)===pending)this.cache.delete(key);});}
  return pending;
 }
 private colored(source:T.BufferGeometry,matrix:T.Matrix4,color:T.Color,vertexColors=false){
  const position=source.getAttribute('position'),original=vertexColors?source.getAttribute('color'):undefined,count=source.index?.count??position.count,positions=new Float32Array(count*3),colors=new Float32Array(count*3),point=new T.Vector3();
  // Quantized GLB coordinates are normalized Int16. Writing a seated/world
  // pose back into that attribute would clamp/wrap it; bake into floats.
  for(let i=0;i<count;i++){const vertex=source.index?.getX(i)??i;point.fromBufferAttribute(position,vertex).applyMatrix4(matrix);positions[i*3]=point.x;positions[i*3+1]=point.y;positions[i*3+2]=point.z;colors[i*3]=color.r*(original?.getX(vertex)??1);colors[i*3+1]=color.g*(original?.getY(vertex)??1);colors[i*3+2]=color.b*(original?.getZ(vertex)??1);}
  return new T.BufferGeometry().setAttribute('position',new T.BufferAttribute(positions,3)).setAttribute('color',new T.BufferAttribute(colors,3));
 }
 private merge(parts:T.BufferGeometry[]){
  const merged=mergeGeometries(parts,false);parts.forEach(g=>g.dispose());
  if(!merged)throw Error('Driver geometry could not merge');merged.computeBoundingBox();merged.computeBoundingSphere();return merged;
 }
 private async bake(avatar:KartAvatar):Promise<T.BufferGeometry>{
  if(avatar.protagonist||avatar.customBase){
   const driver=new ProtagonistModel(true);
   try{
   await driver.setAvatar(avatar);if(this.disposed||!driver.ready)throw Error('Driver unavailable');
   driver.update(0,'Idle',true);const model=driver.root;model.updateMatrixWorld(true);
   const parts:T.BufferGeometry[]=[],point=new T.Vector3();
   model.traverse(object=>{
    if(!(object instanceof T.Mesh))return;
    const geometry=object.geometry.clone();
    if(object instanceof T.SkinnedMesh){object.skeleton.update();const count=geometry.getAttribute('position').count,positions=new Float32Array(count*3);for(let i=0;i<count;i++){object.getVertexPosition(i,point);positions[i*3]=point.x;positions[i*3+1]=point.y;positions[i*3+2]=point.z;}geometry.setAttribute('position',new T.BufferAttribute(positions,3));}
    const materials=Array.isArray(object.material)?object.material:[object.material];
    // The official protagonists use one vertex-coloured material per mesh.
    // Preserve material groups too, rather than recolouring a future model.
    const groups=geometry.groups.length?geometry.groups:[{start:0,count:geometry.index?.count??geometry.getAttribute('position').count,materialIndex:0}];
    for(const group of groups){const material=materials[group.materialIndex??0] as T.MeshStandardMaterial,flat=geometry.index?geometry.toNonIndexed():geometry.clone(),section=new T.BufferGeometry();
     for(const name of ['position','color']){const a=flat.getAttribute(name);if(!a)continue;const values=new Float32Array(group.count*3);for(let i=0;i<group.count;i++){values[i*3]=a.getX(group.start+i);values[i*3+1]=a.getY(group.start+i);values[i*3+2]=a.getZ(group.start+i);}section.setAttribute(name,new T.BufferAttribute(values,3));}
     parts.push(this.colored(section,object.matrixWorld,material.color??new T.Color('white'),material.vertexColors));flat.dispose();section.dispose();
    }
    geometry.dispose();
   });
   return this.merge(parts);
   }finally{driver.dispose();}
  }
  this.avatarParts??=createAvatarParts();await prepareStorybookCharacters();if(this.disposed)throw Error('Driver scene closed');
  const matrix=new T.Matrix4(),rotation=new T.Quaternion(),parts:T.BufferGeometry[]=[],color=new T.Color();
  for(const part of this.avatarParts){if(part.visible&&!part.visible(avatar))continue;
   rotation.setFromEuler(new T.Euler(...part.rotation));matrix.compose(new T.Vector3(...part.position),rotation,new T.Vector3(...part.scale));
   const material=part.material as T.MeshStandardMaterial;
   if(part.color){const bank=part.color==='body'?BODY_COLORS:part.color==='hair'?HAIR_COLORS:part.color==='eyeColor'?EYE_COLORS:AVATAR_COLORS;color.set(bank[avatar[part.color]??0]);}else color.copy(material.color??new T.Color('white'));
   parts.push(this.colored(part.geometry,matrix,color,material.vertexColors));
  }
  return this.merge(parts);
 }
 dispose(){this.disposed=true;this.geometries.forEach(g=>g.dispose());this.geometries.clear();this.cache.clear();this.material.dispose();const geometries=new Set<T.BufferGeometry>(),materials=new Set<T.Material>();for(const p of this.avatarParts??[]){geometries.add(p.geometry);materials.add(p.material);}geometries.forEach(g=>g.dispose());materials.forEach(m=>m.dispose());}
}

export class MinimalDriver {
 readonly root=new T.Group();private request=0;private key='';private disposed=false;
 constructor(private library:MinimalDriverLibrary){this.root.name='MinimalSelectedDriver';}
 get ready(){return this.root.children.length>0;}
 setAvatar(avatar:KartAvatar){const key=driverAppearanceKey(avatar);if(this.key===key)return;this.key=key;const request=++this.request;this.root.clear();this.root.userData.protagonist=avatar.protagonist||'';
  this.library.get(avatar).then(geometry=>{if(this.disposed||request!==this.request)return;this.root.add(new T.Mesh(geometry,this.library.material));this.root.userData.staticCharacter=true;}).catch(()=>{if(!this.disposed&&request===this.request)this.root.userData.failed=true;});
 }
 update(){} // Static seated pose: no per-racer animation mixer or bone updates.
 dispose(){this.disposed=true;++this.request;this.root.clear();}
}
