import assert from 'node:assert/strict';
import {readFile,stat} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {createServer} from 'vite';
const server=await createServer({optimizeDeps:{noDiscovery:true},server:{middlewareMode:true,hmr:false},appType:'custom'});
try{
 const {CARD_CLUB_HEROES}=await server.ssrLoadModule('/src/mini-games/card-club/session.ts');
 const {CARD_CLUB_VOICE_HEROES,CARD_CLUB_VOICE_MS,cardClubVoice}=await server.ssrLoadModule('/src/data/cardClubVoices.ts');
 const plan=JSON.parse(await readFile('assets/card-club/hero-voice-plan.json','utf8')),build=JSON.parse(await readFile('assets/card-club/hero-voice-build.json','utf8')),qa=JSON.parse(await readFile('assets/card-club/voice-speech-qa.json','utf8'));
 assert.deepEqual([...CARD_CLUB_VOICE_HEROES].sort(),CARD_CLUB_HEROES.map(h=>h.id).sort());assert.equal(plan.heroes.length,26);assert.equal(Object.keys(CARD_CLUB_VOICE_MS).length,104);
 let clips=0;const hashes=new Set();
 for(const hero of plan.heroes)for(const event of ['start','play','win','lose']){
  const key=hero.id+'/'+event,meta=build.clips[key],clip=cardClubVoice(hero.id,event);assert(clip);assert(clip.maxDurationMs>CARD_CLUB_VOICE_MS[key]);
  const audio=await readFile('public/'+clip.path),sha=createHash('sha256').update(audio).digest('hex');assert.equal(audio.subarray(0,4).toString(),'OggS');assert((await stat('public/'+clip.path)).size>1500);assert.equal(sha,meta.sha256);assert.equal(sha,qa.clips[key].sha256);assert(!hashes.has(sha));hashes.add(sha);
  assert.equal(meta.model_device,'cpu');assert.equal(meta.codec_device,'cpu');assert(build.models[meta.model]);assert.equal(meta.checkpoint_sha256,build.models[meta.model].checkpoint_sha256);assert(meta.silentcipher_watermark);assert.equal(meta.text,hero.lines[event]);assert(qa.clips[key].similarity>=.85);assert(Math.abs(meta.seconds*1000-CARD_CLUB_VOICE_MS[key])<90);clips++;
 }
 assert.equal(cardClubVoice('../unsafe','start'),null);assert.equal(cardClubVoice('high-school-warrior','unknown'),null);
 console.log(JSON.stringify({heroVoices:26,voiceClips:clips,cpuOnly:true,measuredDurations:true,speechQA:true}));
}finally{await server.close();}
