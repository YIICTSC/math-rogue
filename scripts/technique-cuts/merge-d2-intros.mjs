import fs from 'node:fs';import crypto from 'node:crypto';
const file='src/components/school-dungeon/techniques/voiceCuts.json',bank=JSON.parse(fs.readFileSync(file)),build=JSON.parse(fs.readFileSync('assets/technique-cuts/d2-intro-build.json')),review=JSON.parse(fs.readFileSync('assets/technique-cuts/d2-intro-review.json'));
const accepted=JSON.parse(fs.readFileSync('assets/technique-cuts/d2-intro-acceptance.json'));
const rejected=new Set(JSON.parse(fs.readFileSync('assets/technique-cuts/d2-intro-rejected.json')).map(r=>r.clip.sha256));
if(Object.keys(build.clips).length!==27)throw Error('All 27 new shouts must be generated first');
for(const actor of new Set(Object.values(build.clips).map(c=>c.actor))){const clips=Object.entries(build.clips).filter(([,c])=>c.actor===actor);bank.prefixes[actor]=clips.map(([id,c])=>{const sha=crypto.createHash('sha256').update(fs.readFileSync('public/'+c.path)).digest('hex');if(accepted[id]?.decision!=='accepted'||accepted[id]?.sha256!==sha||rejected.has(sha)||sha!==c.sha256||review[id]?.sha256!==sha||review[id].clipped_fraction>.001)throw Error('Unreviewed/changed clip '+id);return{id:'d2-'+id,path:c.path,duration:c.duration};});}
fs.writeFileSync(file,JSON.stringify(bank)+'\n');console.log('Merged 27 original D2 shouts into nine actor-specific pools.');
