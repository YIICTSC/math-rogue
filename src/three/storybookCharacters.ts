import * as T from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {assetUrl} from '../utils/assetPaths';
export type CharacterComponent='head'|'humanhead'|'hairstrand'|'sweater'|'sleeve'|'mitten'|'haircap'|'hairlock'|'ear'|'shoe'|'trouser'|'pointedear'|'robothead'|'collar';
let library:Promise<Map<string,T.BufferGeometry>>|undefined;
function load(){return library??=new Promise<Map<string,T.BufferGeometry>>(resolve=>{
 new GLTFLoader().load(assetUrl('models/storybook/characters-v2.glb'),gltf=>{
  const bank=new Map<string,T.BufferGeometry>();gltf.scene.updateMatrixWorld(true);
  for(const name of ['head','humanhead','hairstrand','sweater','sleeve','mitten','haircap','hairlock','ear','shoe','trouser','pointedear','robothead','collar']){
   const object=gltf.scene.getObjectByName(name);object?.traverse(o=>{if(!(o instanceof T.Mesh)||bank.has(name))return;const g=o.geometry.clone().applyMatrix4(o.matrixWorld);g.computeBoundingBox();const size=g.boundingBox!.getSize(new T.Vector3()),center=g.boundingBox!.getCenter(new T.Vector3());g.translate(-center.x,-center.y,-center.z);const round=['head','humanhead','sleeve','mitten','haircap','ear'].includes(name),cylinder=name==='trouser'||name==='pointedear';g.scale((round||cylinder?2:1)/size.x,(round?2:1)/size.y,(round||cylinder?2:1)/size.z);g.computeBoundingBox();g.computeBoundingSphere();bank.set(name,g);});
  }
  const geo=new Set<T.BufferGeometry>(),mat=new Set<T.Material>();gltf.scene.traverse(o=>{if(o instanceof T.Mesh){geo.add(o.geometry);(Array.isArray(o.material)?o.material:[o.material]).forEach(m=>mat.add(m));}});geo.forEach(g=>g.dispose());mat.forEach(m=>m.dispose());resolve(bank);
 },undefined,error=>{console.warn('Character models unavailable; keeping the existing avatar.',error);resolve(new Map());});
 });}
/** Upgrade shared geometry in place: customization, instancing and live rigs keep their identity. */
export function characterGeometry(name:CharacterComponent,fallback:T.BufferGeometry,shape?:(geometry:T.BufferGeometry)=>void){
 const geometry=fallback.clone();shape?.(geometry);let disposed=false,upgrading=false;
 geometry.addEventListener('dispose',()=>{if(!upgrading)disposed=true;});
 void load().then(bank=>{const source=bank.get(name);if(disposed||!source)return;upgrading=true;geometry.dispose();geometry.copy(source);shape?.(geometry);geometry.name=`BlenderCharacter:${name}`;geometry.userData.storybookCharacter=name;upgrading=false;});return geometry;
}
