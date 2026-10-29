import * as T from 'three';
import parts from './wardrobeParts.json';
import { AVATAR_COLORS, BODY_COLORS, HAIR_COLORS, type KartAvatar } from '../mini-games/gakuro-kart/avatar';
export type Sport = 'tennis'|'basketball'|'dodgeball'|'golf';
export const SPORTS: Sport[] = ['tennis','basketball','dodgeball','golf'];
export const avatarHero = (a: KartAvatar) => a.protagonist || a.customBase;
export const wardrobeFor = (a: KartAvatar, sport?: Sport): Sport|'regular' => a.wardrobe === 'regular' ? 'regular' : a.wardrobe && a.wardrobe !== 'sport' ? a.wardrobe : sport || 'regular';
interface Source { colors: T.BufferAttribute; indices: number[] }
const sources = new WeakMap<T.BufferGeometry,Source>();
/** Semantic attributes survive Blender's joined, skinned single-mesh export. */
export function dressHero(model:T.Object3D, avatar:KartAvatar, sport?:Sport, hairOnly=false) {
 const kit=wardrobeFor(avatar,sport),custom=!!avatar.customBase&&!avatar.protagonist;
 model.traverse(o=>{
  if(!(o instanceof T.Mesh))return;
  const g=o.geometry,part=g.getAttribute('_part'),tint=g.getAttribute('_tint'),color=g.getAttribute('color');
  if(!part||!tint||!color)return;
  let source=sources.get(g);if(!source){source={colors:color.clone() as T.BufferAttribute,indices:g.index?Array.from(g.index.array):Array.from({length:part.count},(_,i)=>i)};sources.set(g,source);}
  const visible=(i:number)=>{const name=(parts as Record<string,string>)[String(Math.round(part.getX(i)))]||'';const isHair=name.startsWith('hair')||['long_hair','side_locks','top_bun'].includes(name);if(hairOnly)return isHair;if(custom&&avatar.customHair&&isHair)return false;const prefix=SPORTS.find(s=>name.startsWith(s+'_'));if(prefix)return prefix===kit;return kit==='regular'||isHair||['skin','eyes','face'].includes(name);};
  const index:number[]=[];for(let i=0;i<source.indices.length;i+=3)if(visible(source.indices[i]))index.push(...source.indices.slice(i,i+3));g.setIndex(index);
  const paints:Record<number,T.Color>={1:new T.Color(BODY_COLORS[avatar.body]),2:new T.Color(HAIR_COLORS[avatar.hair]),3:new T.Color(AVATAR_COLORS[avatar.outfit]),4:new T.Color(AVATAR_COLORS[avatar.bottom??7]),5:new T.Color(AVATAR_COLORS[(avatar.outfit+3)%AVATAR_COLORS.length])};
  for(let i=0;i<color.count;i++) {const role=Math.round(tint.getX(i));const paint=!avatar.originalColors&&(custom||role>=3&&kit!=='regular')?paints[role]:undefined;if(paint)color.setXYZ(i,paint.r,paint.g,paint.b);else color.setXYZ(i,source.colors.getX(i),source.colors.getY(i),source.colors.getZ(i));}
  color.needsUpdate=true;g.computeBoundingSphere();
 });
 model.userData.wardrobe=kit;model.userData.customBase=avatar.customBase||'';
}
