import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createServer} from 'vite';
const server=await createServer({optimizeDeps:{noDiscovery:true},server:{middlewareMode:true},logLevel:'error'});
const originalImage=globalThis.Image;
const originalPerformance=globalThis.performance;
let now=1000;
globalThis.performance={now:()=>now};
globalThis.Image=class {complete=true;naturalWidth=768;set src(value){this.url=value;}};
try {
 const d2=await server.ssrLoadModule('/src/components/school-dungeon/dungeons2/heroActions.ts');
 const calls=[];
 const ctx={save(){},restore(){},drawImage(...args){calls.push(args);}};
 for(const transformed of [false,true]) {
  for(const hero of ['lyria','celis','flora','noctia','aurene','ignis','leon','orion','leif']) {
   const id=`dungeons2-${hero}`;
   d2.clearD2HeroAction(id);
   assert.equal(d2.drawD2HeroAction(ctx,id,2,0,0,128,transformed),false,'idle must use directional standing sprite');
   for(const action of ['walk','attack','throw','swing','read','use','shoot']) {
    now+=1000;d2.cueD2HeroAction(id,action);
    assert.equal(d2.drawD2HeroAction(ctx,id,2,0,0,128,transformed),true);
    assert.equal(calls.at(-1)[1],192,'right direction must use column 2');
    now+=800;
    assert.equal(d2.drawD2HeroAction(ctx,id,2,0,0,128,transformed),false,'completed action must fall back to open-eyed idle');
   }
   d2.cueD2HeroAction(id,'walk');d2.clearD2HeroAction(id);
   assert.equal(d2.d2HeroActionSnapshot(id),null);
  }
 }
 const manifest=JSON.parse(fs.readFileSync('src/generated/miniGameMediaIndex.json','utf8'));
 for(const [kind,paths] of Object.entries(manifest)) {
  assert.equal(paths.length,new Set(paths).size,`${kind} paths must be unique`);
  for(const path of paths)assert.ok(fs.existsSync(`public/${path}`),path);
 }
 for(const path of ['sprites/dungeons2/lyria-directions.webp','sprites/dungeons2/animations/lyria.webp','sfx/dungeons2-voices/lyria/attack.ogg','sfx/card-club-voices/magic-akari/start.ogg']) {
  assert.ok([...manifest.images,...manifest.audio].includes(path),path);
 }
 for(const suffix of ['walk','profile','combo','tools','flight'])assert(manifest.images.includes(`sprites/star-tide/hero-nagi-${suffix}.webp`));
 for(const hero of ['nagi','mio','sena'])for(const suffix of ['', '-vertical'])assert(manifest.images.includes(`sprites/star-tide/hero-${hero}${suffix}.webp`));
 const {MEDIA_ENGLISH,MEDIA_HIRAGANA}=await server.ssrLoadModule('/src/components/miniGameMediaCopy.ts');
 assert.deepEqual(Object.keys(MEDIA_ENGLISH).sort(),Object.keys(MEDIA_HIRAGANA).sort());
 console.log(`PASS: 126 action-to-idle transitions, 18 forms; ${manifest.images.length} images, ${manifest.audio.length} voice files; translation parity`);
} finally {
 globalThis.Image=originalImage;globalThis.performance=originalPerformance;
 await server.close();
}
