import {ProtagonistModel} from '../../three/protagonistModel';
import * as T from 'three';
import {characterGeometry} from '../../three/storybookCharacters';
import {createAvatarParts} from '../gakuro-kart/avatarModels';
import {AVATAR_COLORS,BODY_COLORS,HAIR_COLORS,EYE_COLORS,defaultAvatar,validAvatar,type KartAvatar} from '../gakuro-kart/avatar';
export function loadVrAvatar():KartAvatar {try{const value=JSON.parse(localStorage.getItem('gakuro-vr-avatar-v1')||'null');return validAvatar(value)?value:defaultAvatar();}catch{return defaultAvatar();}}
export function saveVrAvatar(a:KartAvatar){try{localStorage.setItem('gakuro-vr-avatar-v1',JSON.stringify(a));}catch{}}
/** Keep live Blender geometries until the owning scene disposes this avatar.
 * Cloning the pre-load fallback would permanently lose asynchronous upgrades. */
export function createVrCharacter(a:KartAvatar){
  if(a.protagonist){const root=new T.Group(),fallback=createVrCharacter({...a,protagonist:undefined}),hero=new ProtagonistModel();hero.root.scale.setScalar(.9);root.add(fallback,hero.root);root.userData.protagonistModel=hero;root.userData.protagonistUpdate=()=>{fallback.visible=!hero.ready;hero.root.visible=hero.ready;};hero.set(a.protagonist);return root;}
  const g=new T.Group(),parts=createAvatarParts();
  const palette={body:BODY_COLORS,outfit:AVATAR_COLORS,hair:HAIR_COLORS,eyeColor:EYE_COLORS};
  const used=new Set<T.BufferGeometry>();
  const tinted=new Map<T.Material,T.Material>();
  for(const part of parts){
    if(part.visible&&!part.visible(a))continue;
    // Materials with different color channels must remain independently tintable.
    let material=part.color?undefined:tinted.get(part.material);
    if(!material){material=part.material.clone();if(!part.color)tinted.set(part.material,material);}
    if(part.color&&(material as T.MeshStandardMaterial).color)(material as T.MeshStandardMaterial).color.set(palette[part.color][a[part.color]??0]);
    const mesh=new T.Mesh(part.geometry,material);used.add(part.geometry);
    mesh.position.fromArray(part.position);mesh.scale.fromArray(part.scale);mesh.rotation.set(...part.rotation as [number,number,number]);g.add(mesh);
  }
  for(const geometry of new Set(parts.map(p=>p.geometry)))if(!used.has(geometry))geometry.dispose();
  for(const material of new Set(parts.map(p=>p.material)))material.dispose();
  const fallback=new T.CylinderGeometry(1,1,1,12),box=new T.BoxGeometry(1,1,1);
  const trouser=characterGeometry('trouser',fallback),shoe=characterGeometry('shoe',box);fallback.dispose();box.dispose();
  const trousers=new T.MeshStandardMaterial({color:'#344357',roughness:.55});
  const leather=new T.MeshStandardMaterial({color:'#263148',roughness:.32});
  for(const x of [-.23,.23]){
    const leg=new T.Mesh(trouser,trousers);leg.position.set(x,.49,-.13);leg.scale.set(.16,.78,.16);g.add(leg);
    const foot=new T.Mesh(shoe,leather);foot.position.set(x,.10,.035);foot.scale.set(.36,.20,.55);g.add(foot);
  }
  g.scale.setScalar(.64);const root=new T.Group();root.name='GakuroStudioAvatar';root.add(g);return root;
}
