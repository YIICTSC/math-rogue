import * as T from 'three';
import {KartScene} from '../../src/mini-games/gakuro-kart/scene';
import {createRace,addRacer} from '../../src/mini-games/gakuro-kart/engine';
import {COURSES,getTrack} from '../../src/mini-games/gakuro-kart/track';
import {SceneryClearance} from '../../src/mini-games/gakuro-kart/sceneryClearance';
let scene:any,world:ReturnType<typeof createRace>,frame=0;
const canvas=document.querySelector('canvas')!;
function show(course:number,quality:'low'|'high'='low'){
 cancelAnimationFrame(frame);scene?.dispose();world=createRace(course);addRacer(world,'self','Self');world.phase='race';
 world.players.self.distance=0;world.players.self.x=0;
 scene=new KartScene(canvas,world,'self',false,()=>{throw new Error('WebGL context lost');},quality);
 const draw=(now:number)=>{scene.setWorld(world);scene.draw(now);frame=requestAnimationFrame(draw);};frame=requestAnimationFrame(draw);
}
function audit(){
 scene.scene.updateMatrixWorld(true);
 const cars=new Set(scene.parts.map((p:any)=>p.mesh)),guard=new SceneryClearance(getTrack(world.course,world.customCourse));
 const blockers:any[]=[];let checked=0;
 const matrix=new T.Matrix4(),worldMatrix=new T.Matrix4(),scale=new T.Vector3();
 scene.scene.traverse((mesh:T.Object3D)=>{
  if(!(mesh instanceof T.Mesh)||cars.has(mesh))return;
  let imported=false,parent:T.Object3D|null=mesh;while(parent){if(parent===scene.storybook.group){imported=true;break;}parent=parent.parent;}
  if(!(mesh instanceof T.InstancedMesh)&&!imported)return;
  const p=(mesh.geometry as any).parameters;
  if(mesh.geometry.type==='BoxGeometry'&&((p.width===.5&&p.height===.75&&p.depth===8)||(p.width===1.2&&p.height===.08&&p.depth===3)||(p.width===.14&&p.height===.02&&p.depth===4)))return;
  mesh.geometry.computeBoundingBox();
  const count=mesh instanceof T.InstancedMesh?mesh.count:1;
  for(let i=0;i<count;i++){
   if(mesh instanceof T.InstancedMesh)mesh.getMatrixAt(i,matrix);else matrix.identity();
   scale.setFromMatrixScale(matrix);if(scale.lengthSq()<1e-10)continue;
   worldMatrix.multiplyMatrices(mesh.matrixWorld,matrix);
   const box=mesh.geometry.boundingBox!.clone().applyMatrix4(worldMatrix);checked++;
   const hit=guard.firstIntersection(box);
   if(hit>=0)blockers.push({kind:mesh.geometry.type,parameters:p,index:i,segment:hit,min:box.min.toArray(),max:box.max.toArray()});
  }
 });
 return {course:world.course,name:COURSES[world.course].name,checked,blockers,modelsReady:scene.storybook.ready,modelsFailed:scene.storybook.failed,filteredModels:scene.storybook.group.userData.filteredModels??0};
}
Object.assign(window,{courseNames:COURSES.map(c=>c.name),showCourse:show,auditScenery:audit,modelsReady:()=>scene.storybook.ready||scene.storybook.failed,
 pauseCourse(){cancelAnimationFrame(frame);},
 seekCourse(fraction:number){world.players.self.distance=getTrack(world.course).length*fraction;scene.smoothed.clear();scene.cameraReady=false;scene.draw(performance.now());},
});show(0);
