import fs from 'node:fs';import{createHash}from'node:crypto';import assert from'node:assert/strict';import sharp from'sharp';import{build as bundle}from'esbuild';
const plan=JSON.parse(fs.readFileSync('assets/star-tide/voice-plan.json')),build=JSON.parse(fs.readFileSync('assets/star-tide/voice-build.json')),catalog=JSON.parse(fs.readFileSync('src/mini-games/star-tide/voiceCatalog.json'));
const hash=bytes=>createHash('sha256').update(bytes).digest('hex');
assert.equal(build.device,'cpu');assert.equal(build.codecDevice,'cpu');assert.equal(build.clips.length,plan.clips.length);
const entries=new Map(build.clips.map(c=>[c.id,c]));
for(const c of plan.clips){const made=entries.get(c.id);assert(made,c.id);assert.equal(c.text,catalog[c.id].text);assert.equal(c.speaker,catalog[c.id].speaker);assert.equal(made.text,c.text);assert.equal(made.speaker,c.speaker);assert.equal(made.path,c.path);assert.equal(made.spokenText,c.spokenText);const bytes=fs.readFileSync('public/'+c.path);assert.equal(bytes.subarray(0,4).toString(),'OggS');assert.equal(hash(bytes),made.sha256,c.id);assert(made.duration>.15&&made.duration<60,c.id);assert(made.rms>.003&&made.peak<=1,c.id);}
assert.deepEqual(Object.keys(catalog).sort(),plan.clips.map(c=>c.id).sort());
for(let c=0;c<12;c++){assert(entries.has('chapter-'+c));assert(entries.has(`npc-${c}-journey`));for(let room=0;room<3;room++)assert(entries.has(`npc-${c}-room-${room}`));}
for(let i=0;i<7;i++)assert(entries.has('opening-'+i));
for(const action of ['sword','ring','wand','hook','hammer','bow','shield','spear','dodge','damage','rescue','heal','glide','land','pickup','solved','beacon','quest','food','cook'])assert(plan.clips.filter(c=>c.id.startsWith('action-'+action+'-')).length>=3,action);
const art=JSON.parse(fs.readFileSync('assets/star-tide/event-art.json'));assert.equal(art.records.length,13);
const files=[];
for(const r of art.records){assert.equal(hash(fs.readFileSync(r.source)),r.sourceSha256);const bytes=fs.readFileSync(r.output);assert.equal(hash(bytes),r.sha256);const m=await sharp(bytes).metadata();assert.equal(m.width,1200);assert.equal(m.height,800);files.push(r.output.replace(/^public\//,''));}
for(const path of ['public/web-asset-manifest.json','public/android-asset-pack-manifest.json']){const m=JSON.parse(fs.readFileSync(path)),fileset=new Set(Object.values(m.packs).flatMap(p=>p.files.map(f=>f.path)));for(const f of [...files,...plan.clips.map(c=>c.path)])assert(fileset.has(f),path+' missing '+f);}
console.log(`PASS: ${art.records.length} original event paintings and ${plan.clips.length} CPU-generated voice files match scripts, hashes, waveform limits and Web/Android delivery manifests.`);

const compiled=await bundle({stdin:{contents: "export{CHAPTERS,ENDINGS}from'./src/mini-games/star-tide/content';export{JOURNEY_TALKS,ROOM_TALKS}from'./src/mini-games/star-tide/quests';",resolveDir:process.cwd(),loader:'ts'},bundle:true,write:false,format:'esm',platform:'node'});
const content=await import('data:text/javascript;base64,'+Buffer.from(compiled.outputFiles[0].text).toString('base64'));
const dialogue=text=>text.includes('「')?text.slice(text.indexOf('「')+1).replace(/」$/,''):text;
for(const c of content.CHAPTERS){assert.equal(c.story,catalog['chapter-'+c.id].text);assert.equal(dialogue(content.JOURNEY_TALKS[c.id][0]),catalog[`npc-${c.id}-journey`].text);for(let r=0;r<3;r++)assert.equal(dialogue(content.ROOM_TALKS[c.id][r][0]),catalog[`npc-${c.id}-room-${r}`].text);}
for(const kind of ['restore','community'])assert.equal(content.ENDINGS[kind][0],catalog['ending-'+kind].text);
JSON.parse(fs.readFileSync('src/mini-games/star-tide/opening.json')).forEach((line,i)=>assert.equal(line[1],catalog['opening-'+i].text));
console.log('PASS: voiced scripts match all live chapter introductions, 48 NPC conversations, 7 opening lines and both endings.');

assert.equal(Object.keys(build.actorReferences).length,new Set(plan.clips.map(c=>c.speaker)).size);
for(const r of Object.values(build.actorReferences))assert.equal(hash(fs.readFileSync(r.path)),r.sha256);
const review=JSON.parse(fs.readFileSync('assets/star-tide/voice-review.json'));assert.equal(review.clips.length,plan.clips.length);
for(const c of review.clips){assert.equal(c.sha256,entries.get(c.id).sha256,c.id+' has stale transcription');assert(!c.needsReview||c.resolution,c.id+' requires transcription review');}
console.log('PASS: every actor reference and every independent transcription review matches the delivered audio.');
