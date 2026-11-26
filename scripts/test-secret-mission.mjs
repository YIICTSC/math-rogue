import assert from 'node:assert/strict';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { build } from 'esbuild';

const work=await mkdtemp(join(tmpdir(),'secret-mission-rules-')),out=join(work,'rules.mjs');
try{
  await build({stdin:{contents:`
    export {MissionRoom} from './src/mini-games/secret-mission/authority';
    export {MAPS, missionMap, canStand, near} from './src/mini-games/secret-mission/maps';
    export {pathTo} from './src/mini-games/secret-mission/pathfinding';
    export {PRESETS, ROLES} from './src/mini-games/secret-mission/rules';
    export {ViewEncoder, patchView} from './src/mini-games/secret-mission/packets';
    export {defaultAvatar} from './src/mini-games/gakuro-kart/avatar';`,
    resolveDir:process.cwd(),loader:'ts'},outfile:out,platform:'node',format:'esm',bundle:true,define:{'import.meta.env':'{}'}});
  const {MissionRoom,MAPS,missionMap,canStand,near,pathTo,PRESETS,ROLES,ViewEncoder,patchView,defaultAvatar}=await import(out);
  const bank={title:'Number check',questions:Array.from({length:3},(_,i)=>({id:'test-'+i,mode:'MATH_G7_U01',question:'3 の反対の数は？',options:['-3','3','1','4'],correct:0}))};
  let tick=100000;
  const room=(settings={},count=6,seed=121)=>{
    const game=new MissionRoom('test','p0',{...PRESETS.standard,...settings},bank,()=>((seed=(Math.imul(seed,1664525)+1013904223)>>>0)/4294967296));
    for(let i=0;i<count;i++){const id='p'+i;assert(game.add(id,'Player '+i,defaultAvatar(i),tick));game.command(id,{type:'ready',value:true},tick);}
    return game;
  };
  const send=(game,id,type,extra={})=>game.command(id,{type,...extra},tick);
  const at=(player,{x,z})=>Object.assign(player,{x,z});
  const advance=(game,ms)=>{tick+=ms;game.tick(tick,Math.min(50,ms));};
  const start=game=>{send(game,'p0','start');assert.equal(game.view('p0',tick).phase,'briefing');advance(game,5200);};
  for(const id of Object.keys(MAPS))for(const large of [false,true]){
    const map=missionMap(id,large);
    assert(canStand(map,map.meeting),id+' meeting point is accessible');
    for(const point of [...map.tunnels,...map.facilities,...map.cameras]){
      assert(canStand(map,point),id+' accessible landmark '+JSON.stringify(point));
      assert(pathTo(map,map.meeting,point,-1).length,id+' connected landmark '+JSON.stringify(point));
    }
  }
  console.log('PASS all four maps and expanded layouts have reachable terminals, cameras and service tunnels');

  const game=room({roles:{},difficulty:'easy'});start(game);
  const players=[...game.players.values()];
  const attacker=players.find(p=>ROLES[p.role][2]==='shade'),crew=players.filter(p=>p!==attacker);
  const [a,b,c]=crew,g=game.groups[0],f=g.map.facilities[0];
  assert.equal(game.view(a.id,tick).roster.some(p=>p.role),false);
  assert.equal(game.view(a.id,tick).allies.length,0);
  Object.assign(a,{x:f.x-f.w/2-.5,z:f.z});Object.assign(attacker,{x:f.x-f.w/2+.5,z:f.z});
  assert(!near(g.map,a,attacker,8));
  assert(!game.view(a.id,tick).actors.some(p=>p.id===attacker.id));
  advance(game,20000);send(game,attacker.id,'stun',{id:a.id});
  assert.equal(a.presence,'active','Wall blocks stun');
  const before=a.x;send(game,a.id,'input',{x:99999,z:0});advance(game,50);
  assert(a.x-before<.3&&canStand(g.map,a),'Authority clamps movement and blocks the wall');

  const station=a.assigned[0],point=g.map.facilities[station];at(a,point);
  send(game,a.id,'task',{id:station});
  let view=game.view(a.id,tick);
  assert(view.task&&view.task.question&&!Object.hasOwn(view.task.question,'correct')&&!view.task.question.options);
  assert.equal(game.view(b.id,tick).task,undefined);
  const token=view.task.token;
  send(game,a.id,'answer',{token,text:'3'});
  assert.equal(g.done,0);assert.equal(a.stats.correct,0);
  advance(game,350);send(game,a.id,'answer',{token,text:'－３'});
  send(game,a.id,'answer',{token,text:'－３'});
  assert.equal(g.done,1);assert.equal(a.stats.correct,1);assert.equal(a.stats.answers,2);
  assert(a.completed.has(station),'Completion is durable and only counted once');

  Object.assign(attacker,{x:point.x+.8,z:point.z});Object.assign(b,{x:point.x-1,z:point.z});
  send(game,attacker.id,'stun',{id:a.id});
  assert.equal(a.presence,'ghost');assert.equal(g.bodies.size,1);
  assert(!game.view(b.id,tick).actors.some(o=>o.id===a.id));
  assert.equal(game.view(c.id,tick).roster.find(p=>p.id===a.id).presence,'active','Undiscovered status stays private');
  send(game,b.id,'report',{id:a.id});
  assert.equal(g.phase,'talk');assert.equal(g.meeting.victim,a.id);
  send(game,a.id,'say',{line:4});assert.equal(g.meeting.messages.length,0);
  send(game,b.id,'say',{line:4,target:attacker.id});
  assert.equal(g.meeting.messages.length,1);
  advance(game,33000);
  send(game,a.id,'vote',{id:attacker.id});assert(!g.meeting.ballots.has(a.id));
  for(const p of players.filter(p=>p.presence==='active'))send(game,p.id,'vote',{id:attacker.id});
  assert.equal(g.phase,'eject');
  assert.equal(g.meeting.totals[attacker.id],5);
  assert(!game.view(b.id,tick).meeting.ballots);
  advance(game,4800);
  assert.equal(g.winner.side,'crew');
  assert(game.view(b.id,tick).won);
  assert(!game.view(b.id,tick).reports);
  send(game,b.id,'practice-task');assert(game.view(b.id,tick).task);
  send(game,'p0','rematch');assert.equal(game.view('p0',tick).phase,'lobby');
  assert.equal(game.settings.map,'school');
  console.log('PASS private roles/questions, wall collision, guarded answers, ghosts, report, ballots, win and rematch');

  const classRoom=room({...PRESETS.classroom,capacity:40,split:true,roles:{},difficulty:'easy'},33);start(classRoom);
  assert.deepEqual(classRoom.groups.map(g=>g.ids.length),[11,11,10]);
  const learner=classRoom.players.get('p1'),teacher=classRoom.view('p0',tick);
  assert(teacher.observer&&teacher.reports.length===32);
  assert(!classRoom.view('p1',tick).reports);
  send(classRoom,'p1','end');assert.notEqual(classRoom.groups[0].phase,'result');
  send(classRoom,'p0','pause');assert(classRoom.paused);
  const group=classRoom.groups[learner.group],original=group.clock;advance(classRoom,500);
  assert.equal(group.clock,original);
  send(classRoom,'p0','pause');send(classRoom,'p0','group',{id:2});assert.equal(classRoom.view('p0',tick).group,2);
  classRoom.disconnect('p1',tick);assert(!learner.connected);assert(classRoom.reconnect('p1'));assert(learner.connected);
  assert(classRoom.add('late','New player',defaultAvatar(),tick));assert.equal(classRoom.players.get('late').presence,'ghost');
  send(classRoom,'p0','end');assert(classRoom.groups.every(g=>g.phase==='result'));
  const encoder=new ViewEncoder();let state=patchView(encoder.encode(classRoom.view('p1',tick)),null);
  assert.equal(state.winner.side,'ended');
  send(classRoom,'p0','rematch');
  state=patchView(encoder.encode(classRoom.view('p1',tick)),state);
  assert(!state.winner&&!state.report&&!state.role);
  console.log('PASS classroom isolation, balanced parallel groups, pause/observe, reconnect, late joining and private delta removal');

  const alarms=room({roles:{},difficulty:'easy',map:'orbit'});start(alarms);advance(alarms,21000);
  const health=alarms.groups[0],shade=[...alarms.players.values()].find(p=>p.role==='shade');
  const responders=[...alarms.players.values()].filter(p=>p.role==='crew').slice(0,2);
  send(alarms,responders[0].id,'sabotage',{kind:'critical'});assert(!health.alarm);
  send(alarms,shade.id,'sabotage',{kind:'critical'});assert.equal(health.alarm.kind,'critical');
  const repairs=[...health.alarm.stations];
  for(const [i,id] of repairs.entries()){
    const p=responders[i];at(p,health.map.facilities[id]);
    send(alarms,p.id,'repair',{id});
    const task=alarms.view(p.id,tick).task;
    send(alarms,p.id,'answer',{token:task.token,text:'-3',choice:0});
    assert.equal(p.stats.repairs,1);
  }
  assert(!health.alarm);assert(responders.every(p=>p.stats.cooperation===1));
  advance(alarms,49000);send(alarms,shade.id,'sabotage',{kind:'critical'});
  advance(alarms,85000);assert.equal(health.winner.reason,'failure');
  const tag=room({...PRESETS.tag,roles:{},difficulty:'easy'});start(tag);advance(tag,18000);
  const runner=[...tag.players.values()].find(p=>p.role==='crew'),tg=tag.groups[0];
  Object.assign(runner,tg.map.meeting);send(tag,runner.id,'meeting');assert.equal(tg.phase,'field');
  const goal=runner.assigned[0];at(runner,tg.map.facilities[goal]);send(tag,runner.id,'task',{id:goal});
  const task=tag.view(runner.id,tick).task;send(tag,runner.id,'answer',{token:task.token,choice:0});
  assert(runner.speedUntil>tick);
  console.log('PASS two-terminal cooperation, sabotage timeout, non-infiltrator rejection and Chase rewards');

  const circuits=room({roles:{},difficulty:'normal',style:'choice',tasks:6});start(circuits);
  const cg=circuits.groups[0], operator=[...circuits.players.values()].find(p=>p.role==='crew');
  operator.assigned=[0,1,2,3,4];
  for(const station of operator.assigned){
    at(operator,cg.map.facilities[station]);send(circuits,operator.id,'task',{id:station});
    const token=operator.task.token;
    send(circuits,operator.id,'answer',{token,choice:0});
    const puzzle=circuits.view(operator.id,tick).task.puzzle;
    assert(puzzle&&!Object.hasOwn(puzzle,'answer'),'Circuit response is verified by the authority');
    advance(circuits,350);send(circuits,operator.id,'answer',{token,puzzle:[]});
    assert(!operator.completed.has(station),'Invalid circuits never complete a task');
    advance(circuits,350);
    send(circuits,operator.id,'answer',{token,puzzle:operator.task.puzzle.answer});
    assert(operator.completed.has(station));
  }
  assert.equal(operator.stats.tasks,5);
  const specialists=room({roles:{},difficulty:'easy'});start(specialists);advance(specialists,23000);
  const sg=specialists.groups[0], rogue=[...specialists.players.values()].find(p=>p.role==='shade');
  const [guard,medic,victim]=[...specialists.players.values()].filter(p=>p.role==='crew');
  guard.role='guardian';medic.role='medic';
  const lab=sg.map.facilities[0];
  at(guard,lab);at(victim,{x:lab.x+.8,z:lab.z});at(medic,{x:lab.x-4,z:lab.z});at(rogue,{x:lab.x-8,z:lab.z});
  send(specialists,guard.id,'ability',{id:victim.id});
  assert(victim.shieldUntil>tick);
  at(rogue,{x:lab.x+.2,z:lab.z});
  send(specialists,rogue.id,'stun',{id:victim.id});
  assert.equal(victim.presence,'active');assert.equal(victim.shieldUntil,0);
  advance(specialists,30000);
  send(specialists,rogue.id,'stun',{id:victim.id});
  assert.equal(victim.presence,'ghost');
  at(medic,{x:lab.x+1.3,z:lab.z});
  send(specialists,medic.id,'ability',{id:victim.id});
  assert.equal(victim.presence,'active');assert.equal(sg.bodies.size,0);assert.equal(medic.rescueLeft,0);
  console.log('PASS all five circuit styles, shield consumption and rescue limits');
}finally{await rm(work,{recursive:true,force:true});}
