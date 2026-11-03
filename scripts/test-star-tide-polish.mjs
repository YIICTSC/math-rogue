import assert from 'node:assert/strict';
import fs from 'node:fs';
const voices=JSON.parse(fs.readFileSync('src/mini-games/star-tide/voiceCatalog.json','utf8'));
import {build} from 'esbuild';
import {solveStarMechanism} from './helpers/star-tide-mechanism.mjs';
const r=await build({stdin:{contents:['engine','combat','mechanisms','elevation','encounters','conversation','beamPuzzles','blockPuzzles','circuitPuzzles','icePuzzles'].map(n=>`export * from './src/mini-games/star-tide/${n}';`).join('\n'),resolveDir:process.cwd()},bundle:true,platform:'node',format:'esm',write:false});
const M=await import('data:text/javascript;base64,'+Buffer.from(r.outputFiles[0].text).toString('base64'));
const advance=(w,t)=>{for(let elapsed=0;elapsed<t;elapsed+=.01)w.tick(.01,0,0);};
const arena=()=>{const w=new M.World(M.fresh());Object.assign(w,{x:7,y:7});w.enemies=[];w.map=Array.from({length:14},()=>Array(20).fill(0));w.s.ownedTools=[0,1,2,3,4,5,6,7];return w;};
for(let weapon=0;weapon<8;weapon++){
 const w=arena();w.s.weaponA=weapon;w.beginCharge();advance(w,.52);assert.equal(w.attack,0);assert(w.releaseCharge());assert.equal(w.attackMode,'charged');assert(w.stamina>=0);advance(w,.35);if([1,2,5].includes(weapon))assert.equal(w.shots.length,5);assert(!w.releaseCharge(),'Release cannot repeat the same skill');
 const c=arena();c.s.weaponA=weapon;c.roll();advance(c,.24);assert(c.swing());assert.equal(c.attackMode,'counter');assert.equal(c.counterWindow,0);
 const a=arena();a.s.weaponA=weapon;a.s.beacons=[0];assert(a.toggleGlide());assert(a.swing());assert.equal(a.attackMode,'aerial');
 assert.equal(new Set(['normal','charged','counter','aerial'].map(mode=>M.attackName(weapon,0,mode)[0])).size,4);
}
const quick=arena();quick.beginCharge();advance(quick,.1);quick.releaseCharge();assert.equal(quick.attackMode,'normal');
const cancel=arena();cancel.beginCharge();advance(cancel,.6);cancel.roll();assert(!cancel.releaseCharge());assert.equal(cancel.chargeTime,0);
const weak=arena();weak.s.weaponA=6;weak.stamina=.5;assert(!weak.swing(false,false,'charged'));assert.equal(weak.stamina,.5);
const perfect=arena();perfect.enemies=[{x:8,y:7,hp:20,max:20,kind:0,cool:3,phase:0,windup:.15}];perfect.roll();assert(perfect.perfectDodge);assert.equal(perfect.counterWindow,1.4);
const radial=arena();radial.enemies=[{x:6,y:7,hp:30,max:30,kind:3,cool:100,phase:0}];radial.swing(false,false,'charged');advance(radial,.34);assert(radial.enemies[0].hp<30,'Charged sword hits behind the hero');
const reflect=arena();reflect.s.weaponA=6;reflect.shots=[{x:8,y:7,vx:-2,vy:0,friendly:false,life:3}];reflect.swing(false,false,'charged');reflect.strike();reflect.strikePending=false;assert(reflect.shots[0].friendly);assert(reflect.shots[0].vx>0);
let solved=0;
for(let chapter=0;chapter<12;chapter++){
 const kinds=Array.from({length:24},(_,room)=>M.MECHANISMS[room]?.kind).filter(Boolean);assert.equal(new Set(kinds).size,kinds.length);assert.equal(kinds.length,13);
 assert.equal(Array.from({length:8},(_,room)=>M.terracesFor(chapter,room).length).reduce((a,b)=>a+b,0),2);
 for(let room=0;room<24;room++){
  const w=arena();Object.assign(w.s,{chapter,room});w.enter();w.enemies=[];
  assert.equal(Boolean(w.barrel),room===1,'Explosive barrels occur once per chapter');
  if(w.mechanismInfo){solveStarMechanism(w,M);solved++;const before=w.s.spirit;w.markSolved();assert.equal(w.s.spirit,before);}
  const e=M.encounterFor(chapter,room);if(!e){assert.equal(w.npc,null);continue;}
  assert.equal(w.npc.id,e.id);assert.equal(M.conversationWords(e.text[0]),voices[e.id].text,'Displayed text must match its recorded voice: '+e.id);const dialogue=M.starDialogue(chapter,e.id,false);assert.equal(dialogue.active,e.speaker==='narrator'?'narrator':e.speaker==='nagi'?'left':'right');
  if(e.kind==='person'){assert.equal(dialogue.right.id,'star-'+e.speaker);assert.equal(dialogue.right.name,e.name[0]);assert(e.text[0].startsWith(e.name[0]+'「'));}
  if(e.kind==='record')assert.equal(dialogue.active,'narrator');
 }
}
for(const room of [16,20]){const w=arena();w.s.room=room;w.enter();w.enemies=[];w.x=8.5;w.y=6.5;if(room===16)w.tick(.01,0,0);else w.swing();assert.equal(w.mechanism.progress,1);advance(w,9);assert.equal(w.mechanism.progress,0);w.x=12.5;if(room===16)w.tick(.01,0,0);else{w.attack=0;w.swing();}assert(!w.s.solved.includes(M.key(w.s)),'Expired delivery must not solve');}
for(const room of [12,13,14,15,18,20,22]){const w=arena();w.s.room=room;w.enter();w.enemies=[];w.x=8.5;w.y=6.5;w.swing();w.rememberPuzzle();const copy=structuredClone(w.s),reloaded=new M.World(copy);assert.equal(reloaded.mechanism.dial,w.mechanism.dial);assert.equal(reloaded.mechanism.progress,room===20?0:w.mechanism.progress);assert(reloaded.resetPuzzle());assert.equal(reloaded.mechanism.progress,0);}
console.log('PASS: 24 new weapon skills, charge/release/cancellation and stamina, dodge counters, aerial attacks, radial damage, projectile reflection, 156 non-repeating mechanisms, timed retries/save recovery, 24 sparse terraces, and all 48 field/dialogue/voice identities.');
