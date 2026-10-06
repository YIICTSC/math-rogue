import * as T from 'three';
export type Quality = 'auto'|'high'|'low';
export function qualityProfile(value: Quality = 'auto') {
  const mobile = typeof window !== 'undefined' && (window.innerWidth < 900 || matchMedia('(pointer:coarse)').matches);
  const low = value==='low'||value==='auto'&&mobile;
  return { low, pixelRatio: low?1:1.6, shadows: !low, shadowSize:1024, decorations:low?.6:1 };
}
/** Paint-grain surface shading in world space: no stretched UVs or grid seams. */
export function paintedSurface(material: T.MeshStandardMaterial, kind: 'grass'|'road'|'stone' = 'grass') {
  const frequency=kind==='road'?1.7:kind==='stone'?2.4:.75;
  material.onBeforeCompile=shader=>{
    shader.vertexShader=shader.vertexShader.replace('#include <common>','#include <common>\nvarying vec3 bookWorld;').replace('#include <worldpos_vertex>',`#include <worldpos_vertex>\nvec4 bookPosition=vec4(transformed,1.0);\n#ifdef USE_INSTANCING\nbookPosition=instanceMatrix*bookPosition;\n#endif\nbookWorld=(modelMatrix*bookPosition).xyz;`);
    shader.fragmentShader=shader.fragmentShader.replace('#include <common>',`#include <common>\nvarying vec3 bookWorld;\nfloat bookHash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}\nfloat bookNoise(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(bookHash(i),bookHash(i+vec2(1.,0.)),f.x),mix(bookHash(i+vec2(0.,1.)),bookHash(i+1.),f.x),f.y);}`).replace('#include <color_fragment>',`#include <color_fragment>\nfloat wash=bookNoise(bookWorld.xz*${frequency.toFixed(2)});float grain=bookNoise(bookWorld.xz*24.);diffuseColor.rgb*=.91+wash*.16+grain*.045;`);
  };material.customProgramCacheKey=()=>`storybook-${kind}-v1`;material.needsUpdate=true;return material;
}
export function storybookWater(){
  const material=new T.MeshStandardMaterial({color:'#69ada8',roughness:.32,metalness:.08});const clock={value:0};
  material.onBeforeCompile=shader=>{
    shader.uniforms.bookTime=clock;
    shader.vertexShader=shader.vertexShader.replace('#include <common>','#include <common>\nvarying vec3 waterWorld;').replace('#include <worldpos_vertex>','#include <worldpos_vertex>\nvec4 waterPos=vec4(transformed,1.);\n#ifdef USE_INSTANCING\nwaterPos=instanceMatrix*waterPos;\n#endif\nwaterWorld=(modelMatrix*waterPos).xyz;');
    shader.fragmentShader=shader.fragmentShader.replace('#include <common>','#include <common>\nvarying vec3 waterWorld;uniform float bookTime;').replace('#include <color_fragment>','#include <color_fragment>\nfloat wave=sin(waterWorld.x*2.+bookTime*.7)*sin(waterWorld.z*2.7-bookTime*.5);float glint=pow(max(0.,wave),14.);diffuseColor.rgb=mix(diffuseColor.rgb,vec3(.87,.96,.83),glint*.55);diffuseColor.rgb*=.96+wave*.045;');
  };material.customProgramCacheKey=()=> 'storybook-water-v1';return {material,update:(seconds:number)=>clock.value=seconds};
}
export function configureStorybook(renderer:T.WebGLRenderer, quality:Quality='auto'){
  const p=qualityProfile(quality);renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,p.pixelRatio));renderer.outputColorSpace=T.SRGBColorSpace;renderer.toneMapping=T.ACESFilmicToneMapping;renderer.toneMappingExposure=1.08;renderer.shadowMap.enabled=p.shadows;renderer.shadowMap.type=T.PCFSoftShadowMap;renderer.domElement.dataset.artStyle='storybook-fantasy';renderer.domElement.dataset.quality=p.low?'low':'high';return p;
}
/** Soft distant hills, drifting cloud cushions and pollen; all are decorative. */
export function storybookAtmosphere(scene:T.Scene,scale=1,quality:Quality='auto'){
  const root=new T.Group();scene.add(root);const profile=qualityProfile(quality);
  const geo=new T.SphereGeometry(1,12,8), cloudMat=new T.MeshBasicMaterial({color:'#fff1d5',transparent:true,opacity:.7,depthWrite:false}),hillMat=new T.MeshStandardMaterial({color:'#90ab94',roughness:1});
  const clouds=new T.InstancedMesh(geo,cloudMat,18),hills=new T.InstancedMesh(geo,hillMat,14),dummy=new T.Object3D();root.add(clouds,hills);
  for(let i=0;i<14;i++){const a=i*Math.PI*2/14;dummy.position.set(Math.cos(a)*42*scale,-5*scale,Math.sin(a)*42*scale);dummy.scale.set(12*scale,(9+i%3*2)*scale,13*scale);dummy.updateMatrix();hills.setMatrixAt(i,dummy.matrix);}
  for(let i=0;i<18;i++){const a=i*2.4;dummy.position.set(Math.cos(a)*38*scale,(13+i%4*2)*scale,Math.sin(a)*38*scale);dummy.scale.set((4+i%3)*scale,1*scale,2.4*scale);dummy.updateMatrix();clouds.setMatrixAt(i,dummy.matrix);}
  const particleGeo=new T.BufferGeometry(),count=profile.low?30:70,positions=new Float32Array(count*3);
  for(let i=0;i<count;i++){positions[i*3]=Math.sin(i*17)*15*scale;positions[i*3+1]=(1+i%11*.3)*scale;positions[i*3+2]=Math.cos(i*13)*15*scale;}particleGeo.setAttribute('position',new T.BufferAttribute(positions,3));
  const particleMat=new T.PointsMaterial({color:'#ffe6a0',size:.035*scale,transparent:true,opacity:.65,depthWrite:false});const particles=new T.Points(particleGeo,particleMat);root.add(particles);
  return {update:(seconds:number,center?:T.Vector3,reduced=false)=>{if(center){root.position.x=center.x;root.position.z=center.z;}if(!reduced){clouds.rotation.y=seconds*.002;particles.rotation.y=seconds*.013;particles.position.y=Math.sin(seconds*.3)*.15*scale;}},dispose:()=>{root.removeFromParent();clouds.dispose();hills.dispose();geo.dispose();cloudMat.dispose();hillMat.dispose();particleGeo.dispose();particleMat.dispose();}};
}
