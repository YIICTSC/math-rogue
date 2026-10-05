import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {createServer} from 'vite';
const vite=await createServer({server:{middlewareMode:true},appType:'custom',logLevel:'error',optimizeDeps:{noDiscovery:true,entries:[]}});
try{
 const {RHYTHM_SONGS}=await vite.ssrLoadModule('/src/rpg/rhythm/catalog.generated.ts');
 const {RHYTHM_PERFORMANCE}=await vite.ssrLoadModule('/src/rpg/rhythm/accents.generated.ts');
 const {rhythmChart,rhythmAccent}=await vite.ssrLoadModule('/src/rpg/rhythm/chart.ts');
 const {recordKey}=await vite.ssrLoadModule('/src/rpg/rhythm/records.ts');
 assert.notEqual(recordKey('s','easy','full',1),recordKey('s','easy','full',2),'Old and new scores must not mix');
 const totals={songs:143,charts:0,beforeNotes:0,afterNotes:0,beforeOffAttack:0,afterOffAttack:0,beforeIneligibleScratch:0,afterIneligibleScratch:0};
 const report=[];
 for(const song of RHYTHM_SONGS){
  const profile=RHYTHM_PERFORMANCE[song.id];assert.equal(profile.accents.length,song.onsets.length);
  const times=new Set(song.onsets.map(ms=>ms/1000));const bySong={id:song.id,scratchEligible:profile.scratch,percussion:profile.percussion,charts:[]};
  for(const difficulty of ['easy','normal','expert'])for(const length of ['full','short']){
   const before=rhythmChart(song,difficulty,length,1),after=rhythmChart(song,difficulty,length),occupied=[0,0,0,0];let lastScratch=-Infinity;
   const oldOff=before.filter(n=>!song.onsets.some(ms=>Math.abs(ms/1000-n.time)<.025)).length;
   const oldScratch=profile.scratch?0:before.filter(n=>n.lane===3).length;
   assert.ok(after.length>0);assert.deepEqual(after,rhythmChart(song,difficulty,length));
   for(const n of after){
    assert.ok(times.has(n.time),`${song.id}: head is not an analyzed attack`);
    assert.ok(n.time>occupied[n.lane]+.139);
    assert.ok(n.velocity>=.084&&n.velocity<=.61);
    if(n.end){assert.equal(n.lane,2,'Holds use the hat/phrase lane, never a held kick/snare');assert.ok(times.has(n.end));assert.ok(n.end>n.time);}
    occupied[n.lane]=n.end??n.time;
    if(n.lane===3){assert.ok(profile.scratch);assert.ok(n.time-lastScratch>60/song.bpm*8-.001);assert.ok(n.velocity<=.4);lastScratch=n.time;}
   }
   const notesAt=new Map();for(const n of after){const a=notesAt.get(n.time)||[];a.push(n.lane);notesAt.set(n.time,a);}
   for(const lanes of notesAt.values())if(lanes.length>1)assert.ok(lanes.length===2&&lanes.includes(2)&&!lanes.includes(3),'Chords are a drum plus hat, not scratch stacks');
   totals.charts++;totals.beforeNotes+=before.length;totals.afterNotes+=after.length;totals.beforeOffAttack+=oldOff;totals.beforeIneligibleScratch+=oldScratch;
   bySong.charts.push({difficulty,length,beforeNotes:before.length,afterNotes:after.length,oldOffAttack:oldOff,oldIneligibleScratch:oldScratch,lanes:[0,1,2,3].map(l=>after.filter(n=>n.lane===l).length),holds:after.filter(n=>n.end).length});
  }
  for(const length of ['full','short']){const density=Object.fromEntries(bySong.charts.filter(c=>c.length===length).map(c=>[c.difficulty,c.afterNotes]));assert.ok(density.expert>=density.normal&&density.normal>=density.easy,`${song.id}: difficulty density`);}
  report.push(bySong);
 }
 // Synthetic musical attacks demonstrate that the three acoustic roles are used, not a lane cycle.
 for(const song of RHYTHM_SONGS)for(let i=0;i<song.onsets.length;i++){const a=rhythmAccent(song,i);assert.ok(a.lane!==3||RHYTHM_PERFORMANCE[song.id].scratch);}
 await fs.writeFile('docs/rpg/rhythm-accompaniment-audit.json',JSON.stringify({method:'Band attack and harmonic concentration estimates; no source separation or claim of subjective listening to all tracks.',totals,songs:report},null,2)+'\n');
 console.log(JSON.stringify(totals));
}finally{await vite.close();}
