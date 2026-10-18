import {storybookWater} from '../three/storybookStyle';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';
import {RoundedBoxGeometry} from 'three/addons/geometries/RoundedBoxGeometry.js';
import * as T from 'three';
/** Original world-space mineral grain and rounded-edge lighting, shared across every LOD.
 * This is inexpensive material AO, not a screen-space post-process. Collision cubes stay exact. */
export function adventureSurface(material:T.MeshStandardMaterial,foliage=false,clock={value:0}){
 material.onBeforeCompile=shader=>{
  shader.uniforms.adventureTime=clock;
  shader.vertexShader=shader.vertexShader.replace('#include <common>',`#include <common>
   varying vec3 adventureWorld; uniform float adventureTime;`)
   .replace('#include <begin_vertex>',`#include <begin_vertex>
    ${foliage?'transformed.x+=sin(adventureTime*1.4+position.y*2.)*.025*max(0.,position.y+.5);':''}`)
   .replace('#include <worldpos_vertex>',`#include <worldpos_vertex>
    vec4 adventureP=vec4(transformed,1.);
    #ifdef USE_INSTANCING
    adventureP=instanceMatrix*adventureP;
    #endif
    adventureWorld=(modelMatrix*adventureP).xyz;`);
  shader.fragmentShader=shader.fragmentShader.replace('#include <common>',`#include <common>
   varying vec3 adventureWorld;
   float adventureHash(vec3 p){return fract(sin(dot(p,vec3(127.1,311.7,74.7)))*43758.5453);}`)
   .replace('#include <color_fragment>',`#include <color_fragment>
    vec3 p=adventureWorld;
    float grain=adventureHash(floor(p*24.));
    vec3 edge=min(fract(p),1.-fract(p));
    float bevel=smoothstep(0.,.045,min(max(edge.x,edge.z),min(max(edge.x,edge.y),max(edge.y,edge.z))));
    float strata=.5+.5*sin(p.y*19.+sin(p.x*3.+p.z*2.));
    diffuseColor.rgb*=.91+grain*.075+strata*.035;
    diffuseColor.rgb=mix(diffuseColor.rgb*1.12,diffuseColor.rgb,bevel);
    // Gentle contact darkening along the lower edge of each block.
    diffuseColor.rgb*=.88+.12*smoothstep(0.,.2,fract(p.y+.001));`);
 };
 material.customProgramCacheKey=()=>`adventure-surface-1-${foliage}`;material.needsUpdate=true;return material;
}
/** Small original voxel adventurer. No textures, skeleton downloads or external character designs. */
export function adventureAvatar(seed=0){
 const coat=['#316e77','#88658e','#a16c50','#677f4d','#52698e'][Math.abs(seed)%5];
 const hair=['#493e4c','#8e684a','#b9b3c7','#d7b775'][Math.abs(seed)%4];
 const root=new T.Group(),body=new T.Group();root.add(body);
 const shadowGeometry=new T.CircleGeometry(.42,16),colors=[];
 for(let i=0;i<shadowGeometry.getAttribute('position').count;i++)colors.push(1,1,1,i===0?.24:0);
 shadowGeometry.setAttribute('color',new T.Float32BufferAttribute(colors,4));
 const shadowMaterial=new T.MeshBasicMaterial({color:'#28443c',vertexColors:true,transparent:true,depthWrite:false});
 const shadow=new T.Mesh(shadowGeometry,shadowMaterial);shadow.rotation.x=-Math.PI/2;shadow.position.y=.018;root.add(shadow);
 const box=new RoundedBoxGeometry(1,1,1,1,.06),materials=new Map<string,T.MeshStandardMaterial>();
 const part=(parent:T.Group,color:string,x:number,y:number,z:number,sx:number,sy:number,sz:number)=>{
  let m=materials.get(color);if(!m){m=new T.MeshStandardMaterial({color,roughness:.85});materials.set(color,m);}
  const o=new T.Mesh(box,m);o.position.set(x,y,z);o.scale.set(sx,sy,sz);o.castShadow=true;o.receiveShadow=true;parent.add(o);return o;
 };
 part(body,coat,0,.88,0,.48,.58,.3);part(body,'#e7ba69',0,.65,0,.5,.09,.32);
 part(body,'#f2c69c',0,1.43,0,.56,.53,.49);part(body,hair,0,1.69,-.025,.6,.18,.54);
 part(body,hair,-.24,1.51,-.04,.13,.35,.5);
 part(body,hair,.1,1.59,.23,.32,.17,.11);
 for(const side of [-1,1])part(body,'#f2c69c',side*.3,1.4,0,.09,.16,.18);
 for(const x of [-.14,.14])part(body,'#28343e',x,1.45,.251,.065,.08,.018);
 part(body,'#f6d281',0,1.13,.18,.47,.12,.1);part(body,'#a16e49',0,.93,-.23,.33,.4,.18);
 const limbs:T.Group[]=[];
 for(const side of [-1,1]){const arm=new T.Group();arm.position.set(side*.32,1.09,0);body.add(arm);part(arm,coat,0,-.15,0,.17,.32,.2);part(arm,'#f2c69c',0,-.36,0,.16,.15,.18);limbs.push(arm);}
 for(const side of [-1,1]){const leg=new T.Group();leg.position.set(side*.14,.61,0);body.add(leg);part(leg,'#3f485e',0,-.23,0,.19,.43,.22);part(leg,'#654b43',0,-.52,.04,.23,.17,.33);limbs.push(leg);}
 // Merge rigid coloured parts per limb: six draws per actor instead of two dozen.
 const merged:T.BufferGeometry[]=[],rigMaterial=new T.MeshStandardMaterial({vertexColors:true,roughness:.85});
 for(const parent of [body,...limbs]){
  const meshes=parent.children.filter((o):o is T.Mesh=>o instanceof T.Mesh),pieces:T.BufferGeometry[]=[];
  for(const mesh of meshes){mesh.updateMatrix();const g=mesh.geometry.clone().applyMatrix4(mesh.matrix),color=(mesh.material as T.MeshStandardMaterial).color,values=[];for(let i=0;i<g.getAttribute('position').count;i++)values.push(color.r,color.g,color.b);g.setAttribute('color',new T.Float32BufferAttribute(values,3));pieces.push(g);parent.remove(mesh);}
  if(pieces.length){const geometry=mergeGeometries(pieces);merged.push(geometry);pieces.forEach(g=>g.dispose());const mesh=new T.Mesh(geometry,rigMaterial);mesh.castShadow=true;mesh.receiveShadow=true;parent.add(mesh);}
 }
 return {root,update:(time:number,speed:number,airborne:boolean,reduced:boolean)=>{const stride=reduced?0:Math.sin(time*9)*Math.min(1,speed)*.65;limbs.forEach((l,i)=>l.rotation.x=airborne?(i<2?-.6:.3):stride*(i%2?1:-1)*(i<2?-1:1));body.position.y=reduced?0:Math.sin(time*(speed>.1?18:2))*(speed>.1?.025:.012);},dispose:()=>{root.removeFromParent();box.dispose();shadowGeometry.dispose();shadowMaterial.dispose();rigMaterial.dispose();merged.forEach(g=>g.dispose());materials.forEach(m=>m.dispose());}};
}
/** Mortar follows world metres, so tall facades never stretch a single brick texture. */
export function adventureMasonry(material:T.MeshStandardMaterial){
 adventureSurface(material);const compile=material.onBeforeCompile;
 material.onBeforeCompile=function(shader,renderer){compile.call(this,shader,renderer);shader.fragmentShader=shader.fragmentShader.replace('float strata=.5+',`vec2 brick=vec2(adventureWorld.x+adventureWorld.z,adventureWorld.y*2.);
 brick.x+=mod(floor(brick.y),2.)*.5;
 vec2 mortar=min(fract(brick),1.-fract(brick));
 diffuseColor.rgb*=mix(.78,1.,smoothstep(.015,.04,min(mortar.x,mortar.y)));
 float strata=.5+`);};material.customProgramCacheKey=()=> 'adventure-masonry-1';return material;
}

/** Shared RPG water: translucent surfaces and animated downward streaks on cascade faces. */
export function adventureWater(){
 const effect=storybookWater(),material=effect.material,compile=material.onBeforeCompile;
 material.transparent=true;material.opacity=.78;material.depthWrite=false;material.roughness=.22;
 material.onBeforeCompile=function(shader,renderer){compile.call(this,shader,renderer);shader.fragmentShader=shader.fragmentShader.replace('diffuseColor.rgb*=.96+wave*.045;','diffuseColor.rgb*=.96+wave*.045;float runnel=.5+.5*sin(waterWorld.y*8.+bookTime*7.+sin(waterWorld.z*4.));diffuseColor.rgb+=vec3(.018,.03,.035)*runnel;');};
 material.customProgramCacheKey=()=> 'adventure-water-1';return effect;
}
