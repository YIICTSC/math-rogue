import fs from 'node:fs/promises';import {createHash} from 'node:crypto';import {createRequire} from 'node:module';import path from 'node:path';import sharp from 'sharp';
const require=createRequire(path.resolve(process.argv[2]??'/workspace/sports-asset-tools','package.json'));
const {NodeIO}=require('@gltf-transform/core'),{dedup,prune,weld,resample}=require('@gltf-transform/functions');
const {ALL_EXTENSIONS}=require('@gltf-transform/extensions');
const io=new NodeIO().registerExtensions(ALL_EXTENSIONS),record=JSON.parse(await fs.readFile('assets/sports-performances/effect-build.json','utf8'));await fs.mkdir('public/sprites/sports-effects',{recursive:true});
for(const sport of Object.keys(record.effects)){
 const raw=`public/models/sports-effects/${sport}.raw.glb`,output=`public/models/sports-effects/${sport}.glb`,doc=await io.read(raw);await doc.transform(dedup(),weld(),resample(),prune());await io.write(output,doc);
 const frames=[];for(let i=0;i<16;i++)frames.push({input:`tmp/sports-effect-frames/${sport}/${String(i).padStart(2,'0')}.png`,left:i*256,top:0});
 await sharp({create:{width:4096,height:256,channels:4,background:'#00000000'}}).composite(frames).webp({quality:88,alphaQuality:100}).toFile(`public/sprites/sports-effects/${sport}.webp`);
 record.effects[sport].optimized_bytes=(await fs.stat(output)).size;record.effects[sport].sha256=createHash('sha256').update(await fs.readFile(output)).digest('hex');record.effects[sport].animations=doc.getRoot().listAnimations().length;record.effects[sport].materials=doc.getRoot().listMaterials().length;
 if(record.effects[sport].animations<1||record.effects[sport].materials>6||record.effects[sport].optimized_bytes>150000)throw Error('Effect budget failed: '+sport);await fs.unlink(raw);
 console.log(sport,record.effects[sport]);
}
record.optimization=['glTF Transform dedup','weld','resample','prune'];record.source_sha256=createHash('sha256').update(await fs.readFile('assets/sports-performances/ultimate-effects.blend')).digest('hex');await fs.writeFile('assets/sports-performances/effect-build.json',JSON.stringify(record,null,2)+'\n');
