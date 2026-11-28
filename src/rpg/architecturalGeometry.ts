import * as T from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import type { BlockShape } from './voxelCatalog';

export function architecturalGeometry() {
  const box=(x:number,y:number,z:number,w:number,h:number,d:number)=>new T.BoxGeometry(w,h,d).translate(x,y,z);
  const shape=new Map<BlockShape,T.BufferGeometry>();
  const create=(name:BlockShape,pieces:T.BufferGeometry[])=>{
    const triangles=pieces.map(piece=>piece.index?piece.toNonIndexed():piece);
    shape.set(name,mergeGeometries(triangles)!);
    new Set([...pieces,...triangles]).forEach(piece=>piece.dispose());
  };
  create('ladder',[
    ...[-.34,.34].map(x=>box(x,0,-.39,.11,.99,.12)),
    ...[-.39,-.13,.13,.39].map(y=>box(0,y,-.35,.72,.068,.11)),
  ]);
  create('rope',[
    new T.CylinderGeometry(.047,.04,.99,7).translate(0,0,.07),
    ...[-.32,.12,.43].map(y=>new T.CylinderGeometry(.082,.056,.09,7).translate(0,y,.07)),
  ]);
  create('scaffold',[
    ...[-.38,.38].flatMap(x=>[-.38,.38].map(z=>box(x,0,z,.10,1,.10))),
    ...[-.31,.22].flatMap(y=>[-.39,.39].flatMap(edge=>[box(edge,y,0,.1,.075,.85),box(0,y,edge,.85,.075,.10)])),
    ...[-.3,-.1,.1,.3].map(x=>box(x,.46,0,.15,.08,.86)),
  ]);
  shape.set('carpet',box(0,-.473,0,.98,.054,.98));
  create('sign',[box(0,-.25,0,.08,.49,.08),box(0,.06,0,.78,.35,.088),box(0,.236,0,.80,.035,.095)]);
  create('hanging-sign',[box(0,-.08,0,.76,.38,.081),...[-.27,.27].map(x=>box(x,.29,0,.04,.38,.053))]);
  create('frame',[
    box(0,.03,-.367,.61,.61,.07),...[-.33,.33].map(x=>box(x,.04,-.31,.09,.74,.10)),
    ...[-.31,.39].map(y=>box(0,y,-.31,.62,.07,.1)),
  ]);
  create('banner',[
    box(0,0,0,.05,1,.055),box(0,.355,0,.79,.055,.06),
    box(0,.045,.055,.66,.59,.045),box(0,-.28,.055,.54,.065,.04),
  ]);
  create('chain',Array.from({length:5},(_,i)=>{
    const ring=new T.TorusGeometry(.08,.022,5,12);
    return ring.rotateY(i%2?Math.PI/2:0).translate(0,(i-2)*.18,0);
  }));
  create('flowerpot',[
    new T.CylinderGeometry(.23,.15,.25,8).translate(0,-.375,0),
    new T.CylinderGeometry(.248,.248,.05,8).translate(0,-.249,0),
    new T.CylinderGeometry(.035,.046,.30,6).translate(0,-.12,0),
    new T.IcosahedronGeometry(.14,0).scale(1,.62,1).translate(0,.038,0),
  ]);
  create('garden',[
    box(0,-.42,0,.91,.16,.91),...[-.27,.26].flatMap(x=>[-.25,.25].map(z=>new T.IcosahedronGeometry(.17,0).translate(x,-.24,z))),
  ]);
  create('hydroponic',[
    box(0,-.43,0,.95,.14,.96),...[-.42,.42].flatMap(edge=>[
      box(edge,-.32,0,.10,.22,.95),box(0,-.32,edge,.84,.22,.10),
    ]),
    ...[-.26,0,.26].map(z=>box(0,-.30,z,.83,.055,.13)),
  ]);
  create('cauldron',[
    new T.CylinderGeometry(.32,.21,.30,12).translate(0,-.26,0),
    new T.CylinderGeometry(.39,.32,.29,12,1,true).translate(0,.035,0),
    new T.TorusGeometry(.384,.043,6,14).rotateX(Math.PI/2).translate(0,.18,0),
    ...[-.32,.32].map(x=>new T.TorusGeometry(.12,.028,5,9).rotateY(Math.PI/2).translate(x,-.06,0)),
  ]);
  create('altar',[
    box(0,-.42,0,.94,.16,.91),box(0,-.21,0,.61,.28,.58),box(0,-.025,0,.82,.09,.77),
    ...[-.27,.27].flatMap(x=>[-.25,.25].map(z=>new T.OctahedronGeometry(.12,0).scale(.72,1.65,.72).translate(x,.14,z))),
    new T.OctahedronGeometry(.18,0).scale(.85,1.40,.85).translate(0,.21,0),
  ]);
  create('candle',[
    new T.CylinderGeometry(.14,.14,.075,8).translate(0,-.45,0),
    new T.CylinderGeometry(.067,.077,.32,7).translate(0,-.27,0),
    new T.IcosahedronGeometry(.06,0).scale(.75,1.7,.75).translate(0,-.04,0),
  ]);
  create('bell',[
    new T.CylinderGeometry(.17,.37,.40,10).translate(0,-.10,0),
    new T.CylinderGeometry(.37,.37,.045,10).translate(0,-.31,0),
    new T.IcosahedronGeometry(.09,0).translate(0,-.36,0),box(0,.22,0,.13,.31,.15),
  ]);
  return shape;
}
