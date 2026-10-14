import assert from 'node:assert/strict';import {build} from 'esbuild';
for(const [name,file] of [['engine','onlineEngine'],['rules','onlineRules'],['settings','roomSettings'],['invite','invite'],['commands','roomCommands']])await build({entryPoints:[`src/mini-games/gakurogear/${file}.ts`],outfile:`tmp/vr-${name}-flow.mjs`,bundle:true,platform:'node',format:'esm'});
const E=await import('../tmp/vr-engine-flow.mjs'),R=await import('../tmp/vr-rules-flow.mjs'),S=await import('../tmp/vr-settings-flow.mjs'),I=await import('../tmp/vr-invite-flow.mjs'),C=await import('../tmp/vr-commands-flow.mjs');
const lesson={title:'Test',questions:Array.from({length:3},(_,i)=>({id:String(i),mode:'ADDITION',question:'1+1',options:['2','3','4','5'],correct:0}))};
assert.equal(I.vrInviteCode('https://example.com/math/?vrRoom=s-abcdef'),'S-ABCDEF');assert.equal(I.vrInviteCode('https://example.com/?vrRoom=bad'),'');assert.equal(I.vrInviteUrl('https://example.com/math/?kartRoom=old#x','H-ABCDEF'),'https://example.com/math/?vrRoom=H-ABCDEF');
for(const mode of ['coop','royale','bomb']){
 const w=E.createWorld(mode,1,lesson);for(const id of ['host','a','b'])E.addPlayer(w,id,id);
 assert(R.setVrSpectator(w,'host',true));assert.equal(R.playerSeats(w).length,2);
 assert(S.updateVrSettings(w,{limit:90}));assert(!S.updateVrSettings(w,{limit:70,missionId:999}));assert.equal(w.limit,90);
 assert(E.startWorld(w,123));assert(!R.setVrSpectator(w,'host',false));assert(!S.updateVrSettings(w,{limit:120}));assert(!R.requestSupply(w,'host'));
 const controls={},before=structuredClone(w.players.host.run.player);C.vrCommand(w,'host',{type:'input',input:{x:1,z:0,crouch:false,interact:false,decoy:false,bomb:true}},controls,{});assert(!controls.host);
 for(let i=0;i<10;i++)E.tickWorld(w,controls,.05);assert.deepEqual(w.players.host.run.player,before);assert.equal(w.players.host.hits,0);
 if(mode==='coop'){w.guards.guards=[];w.mission.cameras=[];w.mission.sensors=[];for(const p of R.playerSeats(w)){p.run.status='clear';p.quiz=false;}E.tickWorld(w,{},.05);assert.equal(w.phase,'result');assert.deepEqual(w.winner,['a','b']);}
 else{w.players.a.out=true;E.tickWorld(w,{},.05);assert.equal(w.phase,'result');assert.deepEqual(w.winner,['b']);}
 assert.equal(w.players.host.wins,0);
}
for(const mode of ['royale','bomb']){const w=E.createWorld(mode,1,lesson);E.addPlayer(w,'h','Host');E.addPlayer(w,'a','A');R.setVrSpectator(w,'h',true);assert(!E.startWorld(w,1),'Battle needs two active participants');}
console.log('PASS: invite paths/transports, atomic lobby settings, spectator command guards, all three modes exclude spectator from simulation and winners, active-player minimum.');
