import * as T from 'three';
import {GLTFLoader,type GLTF} from 'three/addons/loaders/GLTFLoader.js';
import {clone} from 'three/addons/utils/SkeletonUtils.js';
import {assetUrl} from '../utils/assetPaths';
import {isProtagonistId} from './protagonistCatalog';
const cache=new Map<string,Promise<GLTF>>();
function load(id:string){let promise=cache.get(id);if(!promise){promise=new GLTFLoader().loadAsync(assetUrl(`models/protagonists/${id}.glb`));cache.set(id,promise);if(cache.size>8)cache.delete(cache.keys().next().value!);promise.catch(()=>cache.delete(id));}return promise;}
export const prepareProtagonistModel=(id:unknown):Promise<void>=>isProtagonistId(id)?load(id).then(()=>undefined):Promise.resolve();
/** Each instance owns its skin, geometry and materials; scene disposal cannot invalidate another player. */
export class ProtagonistModel {
 readonly root=new T.Group();private model?:T.Group;private rests=new Map<string,T.Quaternion>();private mixer?:T.AnimationMixer;private action?:T.AnimationAction;private clips:T.AnimationClip[]=[];private request=0;private id?:string;private disposed=false;private elapsed=0;
 private pending:Promise<void>=Promise.resolve();
 constructor(readonly seated=false){this.root.name='LearningRogueProtagonist';}
 set(id:unknown,transformed=false){const base=isProtagonistId(id)?id:undefined;const next=base?base+(transformed&&base.startsWith('magic-')?'-transformed':''):undefined;if(this.id===next)return this.pending;this.id=next;const request=++this.request;this.clear();this.root.userData.protagonist=next||'';if(!next)return this.pending=Promise.resolve();
  return this.pending=load(next).then(gltf=>{if(this.disposed||request!==this.request)return;const model=clone(gltf.scene) as T.Group;
   model.traverse(o=>{if(o instanceof T.Mesh){o.geometry=o.geometry.clone();o.material=Array.isArray(o.material)?o.material.map(m=>m.clone()):o.material.clone();o.castShadow=true;o.receiveShadow=true;}});
   // Physics owns vertical displacement. Keep the visual jump pose, without doubling the jump height.
   this.clips=gltf.animations.map(c=>new T.AnimationClip(c.name,c.duration,c.tracks.filter(t=>!t.name.endsWith('root.position')).map(t=>t.clone())));
   model.traverse(o=>{if(o instanceof T.Bone)this.rests.set(o.name,o.quaternion.clone());});this.model=model;this.root.add(model);this.mixer=new T.AnimationMixer(model);this.root.userData.ready=true;this.update(0);}).catch(()=>{if(request===this.request)this.root.userData.failed=true;});
 }
 get ready(){return !!this.model;}
 update(dt:number,motion:'Idle'|'Walk'|'Jump'|'Attack'='Idle',reduced=false){if(!this.model||!this.mixer)return;const clip=this.clips.find(c=>c.name===(this.seated?'Idle':motion));if(clip&&this.action?.getClip()!==clip){const next=this.mixer.clipAction(clip);next.reset().play();if(this.action)this.action.crossFadeTo(next,.12,false);this.action=next;}
  this.elapsed+=Math.max(0,Math.min(dt,.1));if(reduced)this.mixer.setTime(0);else this.mixer.update(Math.max(0,Math.min(dt,.1)));
  if(this.seated){this.model.scale.setScalar(1.3);this.model.position.set(0,.1,-.1);this.pose('thigh.L',-.95);this.pose('thigh.R',-.95);this.pose('shin.L',1.25);this.pose('shin.R',1.25);this.pose('upper_arm.L',-.8);this.pose('upper_arm.R',-.8);this.pose('forearm.L',-.4);this.pose('forearm.R',-.4);}
 }
 pose(name:string,x:number,z=0){const bone=this.model?.getObjectByName(T.PropertyBinding.sanitizeNodeName(name));if(bone){const rest=this.rests.get(bone.name);if(rest)bone.quaternion.copy(rest).multiply(new T.Quaternion().setFromEuler(new T.Euler(x,0,z)));}}
 grip(target:T.Object3D){if(!this.model||!target.parent)return;const points=['forearmL','forearmR'].map(name=>{const bone=this.model!.getObjectByName(name);return bone?bone.localToWorld(new T.Vector3(0,.24,0)):undefined;});if(points[0]&&points[1]){target.parent.updateWorldMatrix(true,false);target.position.copy(target.parent.worldToLocal(points[0].add(points[1]).multiplyScalar(.5)));}}
 private clear(){if(this.model){this.mixer?.stopAllAction();this.mixer?.uncacheRoot(this.model);this.model.traverse(o=>{if(o instanceof T.SkinnedMesh)o.skeleton.dispose();if(o instanceof T.Mesh){o.geometry.dispose();for(const m of [o.material].flat())m.dispose();}});this.root.remove(this.model);}this.rests.clear();this.model=undefined;this.mixer=undefined;this.action=undefined;this.root.userData.ready=false;this.root.userData.failed=false;}
 dispose(){this.disposed=true;++this.request;this.clear();}
}
/** Update and dispose nested mini-game avatars through their owning scene. */
export function updateProtagonists(root:T.Object3D,dt:number){root.traverse(o=>{const hero=o.userData.protagonistModel as ProtagonistModel|undefined;if(hero){const previous=o.userData.protagonistPosition as T.Vector3|undefined;const moving=previous&&previous.distanceToSquared(o.position)>.000001;hero.update(dt,moving?'Walk':'Idle');o.userData.protagonistPosition??=new T.Vector3();o.userData.protagonistPosition.copy(o.position);o.userData.protagonistUpdate?.();}});}
export function disposeProtagonists(root:T.Object3D){root.traverse(o=>{(o.userData.protagonistModel as ProtagonistModel|undefined)?.dispose();});}
