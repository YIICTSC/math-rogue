import fs from 'node:fs/promises';
import crypto from 'node:crypto';
import sharp from 'sharp';
const hash=bytes=>crypto.createHash('sha256').update(bytes).digest('hex');
const routes=['school','rooftops','canal','garden','clockwork','skyway','storm'];
const output='public/sprites/go-home-dash/parallax';await fs.mkdir(output,{recursive:true});
const records=[];
for(const route of routes)for(const layer of ['architecture','foreground']){
 const source=`tmp/home-dash-blender/${route}-${layer}.png`,file=`${output}/${route}-${layer}.webp`;
 const raw=await fs.readFile(source);await sharp(raw).webp({quality:90,alphaQuality:100}).toFile(file);
 records.push({route,layer,source_sha256:hash(raw),output:file,sha256:hash(await fs.readFile(file)),width:1280,height:640});
}
await fs.copyFile('tmp/home-dash-blender/school-parallax.blend','assets/go-home-dash/school-parallax.blend');
await fs.writeFile('assets/go-home-dash/parallax-build.json',JSON.stringify({generator:'Blender 4.3.2 / Cycles CPU',script:'scripts/build-home-dash-parallax.py',script_sha256:hash(await fs.readFile('scripts/build-home-dash-parallax.py')),samples:32,dimensions:[1280,640],paintedLayerSpeed:.09,architectureLayerSpeed:.28,foregroundLayerSpeed:.65,editableScene:'assets/go-home-dash/school-parallax.blend',records},null,2)+'\n');
console.log(`Prepared ${records.length} transparent Blender scenery layers and an editable scene.`);
