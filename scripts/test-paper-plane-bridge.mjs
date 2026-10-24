import assert from 'node:assert/strict';
import fs from 'node:fs';
import crypto from 'node:crypto';
import {build} from 'esbuild';
await build({entryPoints:['src/components/PaperPlaneBridge.tsx'],outfile:'tmp/paper-bridge-unit.mjs',bundle:true,platform:'node',format:'esm',packages:'external',loader:{'.css':'empty'},define:{'import.meta.env':'{}'}});
const {bridgeExchange,PAPER_CAPTAINS}=await import('../tmp/paper-bridge-unit.mjs');
const plan=JSON.parse(fs.readFileSync('assets/paper-plane/bridge-voice-plan.json'));
const captains=plan.characters.filter(c=>c.role==='captain'),deputies=plan.characters.filter(c=>c.role==='deputy'),rivals=plan.characters.filter(c=>c.role==='rival');
assert.deepEqual(captains.map(c=>c.id),PAPER_CAPTAINS.map(h=>h.id));const battle=fs.readFileSync('src/components/PaperPlaneBattle.tsx','utf8');const roster=battle.slice(battle.indexOf('const PILOTS:'),battle.indexOf('// Define Ships'));assert.deepEqual(deputies.map(c=>c.id),[...roster.matchAll(/id: '(PL_[A-Z0-9_]+)'/g)].map(m=>m[1]));assert.equal(deputies.length,26);assert.equal(rivals.length,4);
const used=new Set();for(let i=0;i<26;i++)for(const event of['launch','fire','move','load','damage','critical','hit','ready','win','lose'])for(let n=0;n<4;n++){
 const exchange=bridgeExchange(event,captains[i].id,deputies[i].id,rivals[i%4].id,n);
 for(const cue of exchange){assert(cue.text);assert(plan.characters.find(c=>c.id===cue.id)?.lines[cue.key]===cue.text);used.add(cue.id+'/'+cue.key);}
 if(event==='fire'){assert.equal(exchange[0].id,deputies[i].id);assert.equal(exchange[1].id,captains[i].id);assert.equal(exchange[1].expression,'command');}
 if(event==='win')assert.equal(exchange.at(-1).expression,'win');
 if(event==='critical')assert.equal(exchange[1].expression,'damage');
}
assert.equal(used.size,plan.total_clips,'Every authored line must be reachable from combat events');
for(let n=0;n<8;n++){
 const fire=bridgeExchange('fire',captains[0].id,deputies[0].id,rivals[0].id,n),next=bridgeExchange('fire',captains[0].id,deputies[0].id,rivals[0].id,n+1);
 assert(fire.every((cue,i)=>cue.key!==next[i].key),'Consecutive volleys must vary');
}
assert.equal(new Set(Array.from({length:4},(_,n)=>bridgeExchange('ready',captains[0].id,deputies[0].id,rivals[0].id,n)[0].key)).size,4);
const hashes=new Set();for(const c of [...captains,...rivals])for(const exp of['normal','command','damage','win']){
 const file=`public/sprites/paper-plane/bridge/${c.id}${exp==='normal'?'':'-'+exp}.webp`;const bytes=fs.readFileSync(file);assert(bytes.length>1000);const sha=crypto.createHash('sha256').update(bytes).digest('hex');assert(!hashes.has(sha),file);hashes.add(sha);
}
console.log(JSON.stringify({captains:26,deputies:26,rivals:4,reachableVoiceLines:used.size,distinctPortraits:hashes.size,callResponse:true}));
