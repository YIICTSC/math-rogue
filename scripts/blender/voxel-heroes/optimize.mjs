import fs from 'node:fs/promises';
import path from 'node:path';
import {NodeIO} from '@gltf-transform/core';
import {dedup,prune,resample,weld,quantize} from '@gltf-transform/functions';
import validator from 'gltf-validator';
import {KHRMeshQuantization} from '@gltf-transform/extensions';
const root=process.argv[2];const only=process.argv[3];const io=new NodeIO().registerExtensions([KHRMeshQuantization]);const report=[];
for(const id of (await fs.readdir(root)).filter(x=>!only||x===only)){
 const file=path.join(root,id,id+'.glb');try{await fs.stat(file)}catch{continue}
 const before=(await fs.stat(file)).size,doc=await io.read(file);
 for (const n of doc.getRoot().listNodes()) {
  if(n.getSkin() && n.getMesh()) {
   const parent=n.getParentNode();
   if(parent && parent.getTranslation().every(v=>v===0) && parent.getScale().every(v=>v===1) && parent.getRotation().every((v,i)=>v===(i===3?1:0))) {parent.removeChild(n);doc.getRoot().listScenes()[0].addChild(n);}
  }
 }
 await doc.transform(dedup(),weld({tolerance:0}),resample(),quantize({quantizePosition:14,quantizeNormal:10,quantizeColor:8,quantizeWeight:8}),prune());
 await io.write(file,doc);const bytes=await fs.readFile(file);const result=await validator.validateBytes(bytes,{uri:id+'.glb'});
 const r={id,before,bytes:bytes.length,meshes:doc.getRoot().listMeshes().length,primitives:doc.getRoot().listMeshes().reduce((n,m)=>n+m.listPrimitives().length,0),materials:doc.getRoot().listMaterials().length,animations:doc.getRoot().listAnimations().map(a=>a.getName()),errors:result.issues.numErrors,warnings:result.issues.numWarnings,messages:result.issues.messages};report.push(r);console.log(JSON.stringify(r));
 const statsFile=path.join(root,id,'stats.json');
 try{const stats=JSON.parse(await fs.readFile(statsFile,'utf8'));stats.sourceGlbBytes=before;stats.glbBytes=bytes.length;await fs.writeFile(statsFile,JSON.stringify(stats,null,2));}catch(e){if(e.code!=='ENOENT')throw e;}
 if(result.issues.numErrors)process.exitCode=1;
}
await fs.writeFile(path.join(root,'validation'+(only?'-'+only:'')+'.json'),JSON.stringify(report,null,2));
