import * as T from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';
import {assetUrl} from '../utils/assetPaths';
import {VOXEL_CATALOG,shapeOf,type CatalogBlock,type BlockShape} from './voxelCatalog';
import {VOXEL_COLORS,type TerrainBlock} from './voxel';

/** One instanced mesh per block; procedural pixels are original, never external game textures. */
export function voxelMaterial(block:TerrainBlock){
 const def=VOXEL_CATALOG[block as CatalogBlock],color=VOXEL_COLORS[block],pattern=def?.pattern??'stone';
 const canvas=document.createElement('canvas');canvas.width=canvas.height=32;const c=canvas.getContext('2d')!;
 c.fillStyle=color;c.fillRect(0,0,32,32);
 for(let y=0;y<32;y++)for(let x=0;x<32;x++){const hash=(x*29+y*43+x*y*7)%31;c.fillStyle=hash%2?`rgba(255,255,255,${hash*.003})`:`rgba(12,20,26,${hash*.005})`;c.fillRect(x,y,1,1);}
 c.strokeStyle='#20252e55';c.lineWidth=1;
 if(['brick','plank','cobble'].includes(pattern)){const h=pattern==='plank'?8:pattern==='brick'?8:16;for(let y=0;y<32;y+=h){c.beginPath();c.moveTo(0,y+.5);c.lineTo(32,y+.5);c.stroke();for(let x=(y/h%2)*8;x<32;x+=16){c.beginPath();c.moveTo(x+.5,y);c.lineTo(x+.5,y+h);c.stroke();}}}
 if(pattern==='log'){for(let x=2;x<32;x+=5){c.fillStyle='#24190940';c.fillRect(x,0,2,32);c.fillStyle='#ffe6b433';c.fillRect(x+2,0,1,32);}}
 if(pattern==='ore'){c.fillStyle='#657179';c.fillRect(0,0,32,32);for(let i=0;i<12;i++){const x=(i*13+5)%29,y=(i*19+3)%29;c.fillStyle=color;c.fillRect(x,y,4,3);c.fillStyle='#ffffff66';c.fillRect(x,y,2,1);}}
 if(pattern==='leaf'||pattern==='fruit'){for(let i=0;i<30;i++){c.fillStyle=i%2?'#fff7b633':'#173a3555';c.fillRect(i*7%32,i*13%32,4,3);}if(pattern==='fruit'){c.fillStyle='#ef7958';for(const [x,y] of [[5,7],[22,10],[13,24]])c.fillRect(x,y,5,5);}}
 if(pattern==='glass'){c.clearRect(0,0,32,32);c.fillStyle=color+'55';c.fillRect(0,0,32,32);c.strokeStyle=color;c.strokeRect(1,1,30,30);c.fillStyle='#ffffff88';c.fillRect(6,6,2,9);c.fillRect(9,4,2,5);}
 if(pattern==='woven'){for(let y=0;y<32;y+=4){c.fillStyle='#ffffff22';c.fillRect(0,y,32,1);}for(let x=0;x<32;x+=4){c.fillStyle='#191d2622';c.fillRect(x,0,1,32);}}
 if(pattern==='metal'){c.fillStyle='#ffffff33';c.fillRect(1,1,30,2);c.fillStyle='#172d3955';c.fillRect(1,29,30,2);for(const x of [3,26])for(const y of [3,26]){c.fillStyle='#354b5a';c.fillRect(x,y,2,2);}}
 if(pattern==='chest'||pattern==='door'||pattern==='workbench'){c.strokeStyle='#432e2277';c.lineWidth=2;c.strokeRect(2,2,28,28);for(let x=8;x<32;x+=8){c.beginPath();c.moveTo(x,2);c.lineTo(x,30);c.stroke();}if(pattern==='workbench'){for(let y=8;y<32;y+=8){c.beginPath();c.moveTo(2,y);c.lineTo(30,y);c.stroke();}}else{c.fillStyle='#efd27d';c.fillRect(23,14,4,5);}}
 if(pattern==='furnace'){c.fillStyle='#424954';c.fillRect(5,5,22,5);c.fillStyle='#29313b';c.fillRect(5,16,22,12);c.fillStyle='#bc7948';c.fillRect(9,25,14,2);}
 if(pattern==='bookshelf'){for(let y=4;y<32;y+=15){for(let i=0;i<6;i++){c.fillStyle=['#687eab','#cf8a68','#87a77c','#e0c77e','#a17f9d','#658e95'][i];c.fillRect(3+i*4,y,3,11);}c.fillStyle='#543c2c';c.fillRect(0,y+11,32,2);}}
 const map=new T.CanvasTexture(canvas);map.colorSpace=T.SRGBColorSpace;map.magFilter=T.NearestFilter;map.minFilter=T.NearestMipmapLinearFilter;
 const transparent=def?.transparent||block==='oasis-water';
 return new T.MeshStandardMaterial({map,color:'#ffffff',roughness:transparent?.2:.86,metalness:pattern==='metal'?.35:0,transparent,opacity:block==='oasis-water'?.65:1,depthWrite:!transparent,side:transparent?T.DoubleSide:T.FrontSide,emissive:def?.light?color:block==='oasis-water'?'#17877e':'#000000',emissiveIntensity:def?.light?.65:.1});
}
export function createConstructionGeometry(onReady:()=>void){
 let disposed=false;
 const box=(x:number,y:number,z:number,sx:number,sy:number,sz:number)=>new T.BoxGeometry(sx,sy,sz).translate(x,y,z);
 const geometry=new Map<BlockShape,T.BufferGeometry>();
 geometry.set('cube',new T.BoxGeometry(1,1,1));geometry.set('slab',box(0,-.25,0,1,.5,1));
 const pieces=[box(0,-.25,0,1,.5,1),box(0,.25,-.25,1,.5,.5)];geometry.set('stairs',mergeGeometries(pieces));pieces.forEach(g=>g.dispose());
 geometry.set('pane',new T.BoxGeometry(1,1,.08));
 for(const shape of ['fence','workbench','furnace','chest','torch','lantern','composter','irrigator'] as BlockShape[])geometry.set(shape,new T.BoxGeometry(shape==='torch'?.15:1,1,shape==='torch'?.15:1));
 new GLTFLoader().load(assetUrl('models/storybook/voxel-workshop-v1.glb'),gltf=>{
  gltf.scene.updateMatrixWorld(true);
  gltf.scene.traverse(o=>{if(!(o instanceof T.Mesh))return;const target=geometry.get(o.name as BlockShape);if(target&&!disposed){const source=o.geometry.clone().applyMatrix4(o.matrixWorld);target.dispose();target.copy(source);target.userData.blenderShape=o.name;source.dispose();}o.geometry.dispose();(Array.isArray(o.material)?o.material:[o.material]).forEach(m=>m.dispose());});
  if(!disposed)onReady();
 },undefined,()=>{});
 return {get:(block:string)=>geometry.get(shapeOf(block))!,get readyShapes(){return [...geometry.values()].filter(g=>g.userData.blenderShape).length;},dispose:()=>{disposed=true;geometry.forEach(g=>g.dispose());}};
}
