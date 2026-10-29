// Run with the dev-only packages from scripts/blender/voxel-heroes/package.json.
import fs from 'node:fs/promises';
import {NodeIO} from '@gltf-transform/core';
import {dedup,weld,resample,prune,quantize} from '@gltf-transform/functions';
import {KHRMeshQuantization} from '@gltf-transform/extensions';
import validator from 'gltf-validator';
const root=process.argv[2]||'public/models/sports-wardrobe',io=new NodeIO().registerExtensions([KHRMeshQuantization]);const report=[];
for(const file of (await fs.readdir(root)).filter(f=>f.endsWith('.glb'))){
 const path=root+'/'+file,doc=await io.read(path),before=(await fs.stat(path)).size;
 for(const node of doc.getRoot().listNodes()){if(!node.getSkin()||!node.getMesh())continue;const parent=node.getParentNode();if(parent&&parent.getTranslation().every(v=>v===0)&&parent.getScale().every(v=>v===1)&&parent.getRotation().every((v,i)=>v===(i===3?1:0))){parent.removeChild(node);doc.getRoot().listScenes()[0].addChild(node);}}
 await doc.transform(dedup(),weld({tolerance:0}),resample(),quantize({pattern:/^(POSITION|NORMAL|COLOR_0|WEIGHTS_0)$/,quantizePosition:14,quantizeNormal:10,quantizeColor:8,quantizeWeight:8}),prune());
 await io.write(path,doc);const bytes=await fs.readFile(path),r=await validator.validateBytes(bytes,{uri:file});if(r.issues.numErrors)throw Error(file+JSON.stringify(r.issues));report.push({id:file.slice(0,-4),before,bytes:bytes.length,errors:r.issues.numErrors});
}
await fs.writeFile('assets/protagonists/sports-wardrobe-validation.json',JSON.stringify(report,null,2)+'\n');console.log('Validated',report.length,'optimized wardrobe models.');
