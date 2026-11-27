import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';
import sharp from 'sharp';
import { Box3, Matrix4, Quaternion, Vector3 } from 'three';

const model=await readFile('public/models/storybook/rpg-creatures.glb');
assert.equal(model.toString('ascii',0,4),'glTF');
const gltf=JSON.parse(model.toString('utf8',20,20+model.readUInt32LE(12)));
const roots=new Map(gltf.scenes[gltf.scene].nodes.map(index=>[gltf.nodes[index].name,index]));
const measurements=new Map();

for(const [name,index] of roots){
  const limits=new Box3(),joints=new Set();
  let triangles=0;
  function traverse(i,parent){
    const node=gltf.nodes[i];
    const transform=new Matrix4().compose(new Vector3().fromArray(node.translation??[0,0,0]),
      new Quaternion().fromArray(node.rotation??[0,0,0,1]),new Vector3().fromArray(node.scale??[1,1,1]));
    const world=transform.premultiply(parent);
    if(node.extras?.part) joints.add(node.extras.part);
    for(const primitive of gltf.meshes[node.mesh]?.primitives??[]){
      const positions=gltf.accessors[primitive.attributes.POSITION];
      limits.union(new Box3(new Vector3().fromArray(positions.min),new Vector3().fromArray(positions.max)).applyMatrix4(world));
      triangles+=(gltf.accessors[primitive.indices]?.count??positions.count)/3;
    }
    for(const child of node.children??[]) traverse(child,world);
  }
  traverse(index,new Matrix4());
  assert(joints.has('head')&&joints.has('body'),`${name} needs shared head and body rigs for animation.`);
  assert(triangles>=80&&triangles<=2900,`${name} polygon budget: ${triangles}.`);
  assert(limits.min.y>-.15&&limits.max.y<3.5,`${name} bounds must be in world meters.`);
  measurements.set(name,{height:limits.max.y,triangles});
}

const path='public/sprites/rpg/creatures';
const pictures=await readdir(path);
assert.equal(pictures.length,roots.size*3);
for(const key of roots.keys()){
  for(const [ext,width,height,cell] of [['',96,96,96],['-poses',384,96,96],['-motion',576,288,72]]){
    const image=await sharp(`${path}/${key}${ext}.webp`).ensureAlpha().raw().toBuffer({resolveWithObject:true});
    assert.equal(image.info.width,width);
    assert.equal(image.info.height,height);
    for(let y=0;y<height;y+=cell) for(let x=0;x<width;x++) assert(image.data[(y*width+x)*4+3]<19,'Leave an alpha margin above each model.');
    for(let y=0;y<height;y++) for(let x=0;x<width;x+=cell) assert(image.data[(y*width+x)*4+3]<19,'Leave room between poses.');
    assert(image.data.some((value,i)=>i%4===3&&value>230));
  }
}
for(const kind of ['cow','sheep','pig','goat','alpaca','duck','chicken','bees']){
  const young=measurements.get(`${kind}-young`),growing=measurements.get(`${kind}-growing`),adult=measurements.get(kind);
  assert(adult.height>young.height+.13,`${kind} must grow through distinct silhouettes.`);
  assert(growing.height>=young.height&&growing.height<=adult.height);
}
assert(model.length<10*1024*1024,'Use a compact library for ordinary mobile hardware.');
console.log(`PASS ${roots.size} jointed models, ${pictures.length} WebP assets, juvenile geometry, alpha edges and model budgets.`);
