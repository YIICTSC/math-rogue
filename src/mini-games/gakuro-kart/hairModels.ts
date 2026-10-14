import { characterGeometry } from '../../three/storybookCharacters';
import * as T from 'three';
import type { AvatarPart } from './avatarModels';

/** Eleven complete Blender hairstyles; saved style 11 remains the shaved head. */
export function createHairParts(): AvatarPart[] {
  const material = new T.MeshPhysicalMaterial({color:'#ffffff',roughness:.32,clearcoat:.22,clearcoatRoughness:.38});
  return Array.from({length:11},(_,style)=>{
    const fallback=new T.SphereGeometry(1,16,10);
    fallback.scale(.52,.29,.48);fallback.translate(0,2.19,-.24);
    const geometry=characterGeometry(`hairdo_${style}`,fallback);fallback.dispose();
    return {geometry,material,position:[0,0,0],scale:[1,1,1],rotation:[0,0,0],color:'hair',motion:'head',
      visible:a=>a.species===0&&a.accessory!==2&&a.hairStyle===style} satisfies AvatarPart;
  });
}
