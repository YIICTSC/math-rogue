import fs from 'node:fs/promises';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import sharp from 'sharp';
const catalog=JSON.parse(await fs.readFile('assets/go-home-dash/hero-voice-lines.json','utf8'));
const build=JSON.parse(await fs.readFile('assets/go-home-dash/hero-voice-build.json','utf8'));
const speech=JSON.parse(await fs.readFile('assets/go-home-dash/speech-qa.json','utf8'));
assert.equal(speech.samples.length,156);
const reviewed=new Map(speech.samples.map(s=>[s.clip,s.sha256]));
const art=JSON.parse(await fs.readFile('assets/go-home-dash/illustration-build.json','utf8'));
assert.equal(catalog.heroes.length,26);assert.equal(art.heroes.length,26);assert.deepEqual(art.routes.map(r=>r.id).sort(),['school','rooftops','canal','garden','clockwork','skyway','storm'].sort());
for(const {id} of art.routes)assert.equal((await sharp(`public/sprites/go-home-dash/routes/${id}.webp`).metadata()).width,1280);
const hash=buffer=>crypto.createHash('sha256').update(buffer).digest('hex');
const audioHashes=new Set();let voices=0;
for(const hero of catalog.heroes){
 const sprite=`public/sprites/go-home-dash/heroes/${hero.id}.webp`, meta=await sharp(sprite).metadata();
 assert.equal(meta.width,512);assert.equal(meta.height,320);assert.equal(meta.hasAlpha,true);
 const frames=[];for(let i=0;i<8;i++)frames.push(hash(await sharp(sprite).extract({left:i%4*128,top:Math.floor(i/4)*160,width:128,height:160}).raw().toBuffer()));
 assert.equal(new Set(frames).size,8,hero.id+' duplicate animation frames');
 for(const reference of build.references[hero.id]) assert.equal(hash(await fs.readFile(reference.path)),reference.sha256);
 for(const event of Object.keys(hero.lines)){
  const key=`${hero.id}/${event}`, target=`public/sfx/go-home-dash/${key}.ogg`, data=await fs.readFile(target), sha=hash(data);
  assert.equal(reviewed.get(key),sha,key+' speech review is stale');assert.equal(build.clips[key]?.sha256,sha,key);assert.equal(build.clips[key].text,hero.lines[event],key+' transcript');
  for(const reference of build.clips[key].references || [])assert.equal(hash(await fs.readFile(reference.path)),reference.sha256);assert.ok(!audioHashes.has(sha),key+' duplicate voice');audioHashes.add(sha);
  const info=JSON.parse(execFileSync('ffprobe',['-v','error','-show_streams','-show_format','-of','json',target],{encoding:'utf8'}));
  assert.equal(info.streams[0].sample_rate,'44100');assert.equal(info.streams[0].channels,1);assert.equal(info.streams[0].codec_name,'vorbis');
  assert.ok(Number(info.format.duration)>.35&&Number(info.format.duration)<=8.1,key+' invalid duration');
  execFileSync('ffmpeg',['-v','error','-i',target,'-f','null','-']);voices++;
 }
}
assert.equal(voices,156);assert.equal(build.silentcipher_watermark,true);
for(const name of ['title','enemies'])assert.ok((await sharp(`public/sprites/go-home-dash/${name}.webp`).metadata()).width>0);
build.verified_clips=voices;await fs.writeFile('assets/go-home-dash/hero-voice-build.json',JSON.stringify(build,null,2)+'\n');
console.log(`Verified ${voices} unique reference-conditioned voices, 26 character atlases / 208 distinct frames, title and enemies.`);
