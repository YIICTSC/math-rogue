import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import * as T from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
const bytes=await fs.readFile('public/models/storybook/storybook-v1.glb');
assert(bytes.length<1_100_000,'Keep the shared mobile download under 1.1 MB');
const gltf=await new GLTFLoader().parseAsync(bytes.buffer.slice(bytes.byteOffset,bytes.byteOffset+bytes.byteLength),'');
const catalog=JSON.parse(await fs.readFile('public/models/storybook/catalog.json','utf8'));
assert.equal(catalog.models.length,19);
for(const name of catalog.models){const model=gltf.scene.getObjectByName(name);assert(model,`Missing ${name}`);const box=new T.Box3().setFromObject(model);assert(!box.isEmpty());assert(box.min.y>=-.15,`${name} must sit above the floor`);assert(box.getSize(new T.Vector3()).length()<8,`${name} is unexpectedly large`);}
for(const name of ['windmill','butterfly']){const root=gltf.scene.getObjectByName(name).clone(true),mixer=new T.AnimationMixer(root);for(const clip of gltf.animations)if(clip.name.includes(name==='windmill'?'Windmill':'Butterfly'))mixer.clipAction(clip).play();const before=[];root.traverse(o=>before.push(o.quaternion.toArray()));mixer.update(.23);const after=[];root.traverse(o=>after.push(o.quaternion.toArray()));assert.notDeepEqual(before,after,`${name} animation must move its own geometry`);mixer.stopAllAction();mixer.uncacheRoot(root);}
const json=JSON.parse(bytes.subarray(20,20+bytes.readUInt32LE(12)).toString());assert(!json.images?.length,'Assets must remain self contained');assert(json.buffers.every(b=>!b.uri));
assert((await fs.stat('assets/storybook/storybook.blend')).size>100000);
console.log('19 floor-aligned Blender models, two working animated models, self-contained GLB under 1.1 MB and editable Blender source passed.');
