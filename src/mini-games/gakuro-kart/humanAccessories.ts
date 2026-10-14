import * as T from 'three';
import type { AvatarPart } from './avatarModels';
import {characterGeometry} from '../../three/storybookCharacters';

/** Material-separated Blender accessories, with stable saved IDs and outfit tinting. */
export function createHumanAccessories():AvatarPart[]{
  const materials:Record<string,T.Material>={
    ink:new T.MeshStandardMaterial({color:'#263148',roughness:.3}),
    gold:new T.MeshStandardMaterial({color:'#edbf68',metalness:.72,roughness:.26}),
    pink:new T.MeshPhysicalMaterial({color:'#ef648d',roughness:.32,clearcoat:.2}),
    white:new T.MeshStandardMaterial({color:'#fff1dc',roughness:.4}),
    green:new T.MeshPhysicalMaterial({color:'#39b89e',roughness:.22,clearcoat:.4}),
    lens:new T.MeshPhysicalMaterial({color:'#235979',metalness:.35,roughness:.16,clearcoat:.65}),
    outfit:new T.MeshStandardMaterial({color:'#ffffff',roughness:.43}),
  };
  const groups:Record<number,string[]>={1:['ink','gold','lens'],2:['outfit','white','gold','lens'],3:['gold','green'],4:['ink','gold'],5:['ink','gold'],6:['ink','gold','lens'],7:['pink','gold'],8:['pink','gold','green'],9:['ink','gold'],10:['ink','pink'],11:['outfit','ink','gold'],12:['gold'],13:['outfit','white']};
  const parts:AvatarPart[]=[];
  for(const [id,keys] of Object.entries(groups))for(const key of keys){
    const fallback=new T.SphereGeometry(.035,8,6);fallback.translate(.34,2.30,.30);
    const geometry=characterGeometry(`acc_${Number(id)}_${key}`,fallback);fallback.dispose();
    parts.push({geometry,material:materials[key],position:[0,0,0],scale:[1,1,1],rotation:[0,0,0],motion:'head',
      color:key==='outfit'?'outfit':undefined,visible:a=>a.accessory===Number(id)&&(Number(id)<=3||a.species===0)});
  }
  return parts;
}
