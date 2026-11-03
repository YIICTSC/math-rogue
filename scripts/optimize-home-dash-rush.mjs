import {NodeIO} from '@gltf-transform/core';
import {ALL_EXTENSIONS} from '@gltf-transform/extensions';
import {dedup,prune,weld} from '@gltf-transform/functions';
const io=new NodeIO().registerExtensions(ALL_EXTENSIONS);
const doc=await io.read('tmp/home-dash-rush/rush-course.glb');
await doc.transform(dedup(),weld(),prune());
await io.write('public/sprites/go-home-dash/rush/rush-course.glb',doc);
console.log(`Home Dash: ${doc.getRoot().listMeshes().length} prefabs, ${doc.getRoot().listMaterials().length} reused materials; no textures or runtime decoder.`);
