import {assistTeam,beginQuiz,finishWorld,magazineSize,newStats,spawnSupplies,tickArena,type Supply} from './onlineRules';
import type {KartAvatar} from '../gakuro-kart/avatar';
import { equip, WEAPONS, floorHeight, MISSIONS, activeObstacles, blocked, clearSight, createRun, distance, step, type Input, type Mission, type Point, type Run } from './engine';
import type { KartLesson } from '../gakuro-kart/learning';
export type OnlineMode = 'coop' | 'royale';
export type Participant = { stats:ReturnType<typeof newStats>; wins:number; helpTarget:string; helpProgress:number; zoneExposure:number; nextSupplyAt:number; quizQuestions:number[]; quizDeck:number[]; quizCycle:number; lastQuestion:number; quizReason:'recovery'|'supply'|'finish'; avatar?: KartAvatar; id: string; name: string; run: Run; hits: number; out: boolean; invulnerable: number; energy: number; reloading: number; quiz: boolean; answers: number[]; quizCorrect: number; quizRound: number; connected: boolean; helped: string[] };
export type OnlineWorld = { supplies:Supply[]; phase: 'lobby' | 'playing' | 'result'; mode: OnlineMode; missionId: number; seed: number; time: number; limit: number; players: Record<string, Participant>; mission: Mission; lesson: KartLesson; winner: string[]; paused: boolean; round: number };
export const MAX_PLAYERS = 8;
export function createWorld(mode: OnlineMode, missionId: number, lesson: KartLesson, limit = 300): OnlineWorld { const mission = structuredClone(MISSIONS[missionId - 1] ?? MISSIONS[0]); return { supplies:[], phase: 'lobby', mode, missionId: mission.id, seed: 1, time: 0, limit: Math.max(60, Math.min(900, limit)), players: {}, mission, lesson, winner: [], paused: false, round: 0 }; }
export function addPlayer(w: OnlineWorld, id: string, name: string) { if (w.phase !== 'lobby' || Object.keys(w.players).length >= MAX_PLAYERS || w.players[id]) return false; w.players[id] = { stats:newStats(),wins:0,helpTarget:'',helpProgress:0,zoneExposure:0,nextSupplyAt:0,quizQuestions:[],quizDeck:[],quizCycle:0,lastQuestion:-1,quizReason:'recovery',id, name: name.trim().slice(0, 24) || 'Player', run: createRun(w.mission), hits: 0, out: false, invulnerable: 0, energy: 100, reloading: 0, quiz: false, answers: [], quizCorrect: 0, quizRound: 0, connected: true, helped: [] }; return true; }
function random(seed: number) { let n = seed >>> 0; return () => { n += 0x6d2b79f5; let t = n; t = Math.imul(t ^ t >>> 15, t | 1); t ^= t + Math.imul(t ^ t >>> 7, t | 61); return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
export function startWorld(w: OnlineWorld, seed: number) {
  if (w.phase !== 'lobby' || (w.mode === 'royale' && Object.values(w.players).filter(p => p.connected).length < 2)) return false;
  const ids = Object.keys(w.players), base = structuredClone(MISSIONS[w.missionId - 1]), rand = random(seed); w.seed = seed; w.round++; w.time = 0; w.winner = [];
  if (w.mode === 'coop') {
    const columns = Math.ceil(Math.sqrt(ids.length)), rows = Math.ceil(ids.length / columns), size = Math.max(columns, rows) * ((base.size??8)+.5);
    const zones = ids.map((id, i) => ({ id, x: (i % columns - (columns - 1) / 2) * (2*(base.size??8)+1), z: (Math.floor(i / columns) - (rows - 1) / 2) * (2*(base.size??8)+1) }));
    const shift = (p: Point, z: Point) => ({ ...p, x: p.x + z.x, z: p.z + z.z });
    w.mission = { ...base, size, targetKinds: zones.flatMap(()=>base.targetKinds??base.targets.map(()=>'file' as const)), terrain: zones.flatMap(z=>(base.terrain??[]).map(t=>({...t,...shift(t,z)}))), limit: w.limit, obstacles: zones.flatMap((z,zi) => base.obstacles.map(b => ({ ...b, ...shift(b, z), switchId: b.switchId===undefined?undefined:b.switchId+zi*(base.switches?.length??0) }))), switches: zones.flatMap(z=>(base.switches??[]).map(p=>shift(p,z))), sensors: zones.flatMap(z => (base.sensors ?? []).map(b => ({ ...b, ...shift(b, z) }))), routes: zones.flatMap(z => base.routes.map(r => r.map(p => shift(p, z)))), cameras: zones.flatMap(z => base.cameras.map(c => ({ ...c, ...shift(c, z) }))), targets: zones.flatMap(z => base.targets.map(p => shift(p, z))) };
    zones.forEach((z, i) => { const p = w.players[z.id]; p.run = createRun(w.mission); p.run.player = { ...shift(base.spawn, z), angle: Math.PI }; p.run.guards = []; p.run.collected = base.targets.map(() => false); p.run.player.y=floorHeight(w.mission,p.run.player); p.run.status = 'playing'; p.out = false; p.hits = 0; p.helped = []; p.quiz = false; p.answers = []; });
    // Guards and sensors belong to the shared field; progress belongs to each player's zone.
    (w as OnlineWorld & { guards?: Run }).guards = createRun(w.mission);
  } else {
    const size = 16 + ids.length * 1.8, obstacles: Mission['obstacles'] = [];
    for (let i = 0; i < 100; i++) { const x = Math.round((rand() * 2 - 1) * (size - 3)), z = Math.round((rand() * 2 - 1) * (size - 3)); const wBox = 1 + rand() * 2, d = 1 + rand() * 2; if (Math.hypot(x,z)<3 || Math.hypot(x, z) > size - 6 || obstacles.some(b => Math.abs(b.x - x) < 3 && Math.abs(b.z - z) < 3)) continue; obstacles.push({ x, z, w: wBox, d, h: i % 3 ? 2.3 : 1, kind: i % 3 ? 'shelf' : 'desk' }); }
    w.mission = { ...base, size, terrain: [], defend: undefined, requireSwitches: false, obstacles, routes: [], cameras: [], targets: [], switches: [], sensors: [], requiredHolds: 0, requiredShots: 0, limit: w.limit, exit: { x: size + 10, z: size + 10 } };
    ids.forEach((id, i) => { const p = w.players[id], a = i / ids.length * Math.PI * 2; p.run = createRun(w.mission); p.run.player = { x: Math.sin(a) * (size - 2), z: Math.cos(a) * (size - 2), angle: a + Math.PI }; p.run.ammo = 6; p.hits = 0; p.out = false; p.energy = 100; p.invulnerable = 3; p.reloading = 0; p.quiz = false; p.answers = []; p.quizCorrect = 0; });
  }
  Object.values(w.players).forEach(p=>{p.stats=newStats();p.helpTarget='';p.helpProgress=0;p.zoneExposure=0;p.nextSupplyAt=0;p.quizQuestions=[];p.quiz=false;p.answers=[];});w.supplies=[];if(w.mode==='royale')spawnSupplies(w);w.phase = 'playing'; return true;
}
export function validInput(v: unknown): v is Input { if (!v || typeof v !== 'object') return false; const p = v as Input; return Number.isFinite(p.x) && Math.abs(p.x) <= 1 && Number.isFinite(p.z) && Math.abs(p.z) <= 1 && typeof p.crouch === 'boolean' && typeof p.interact === 'boolean' && typeof p.decoy === 'boolean' && (p.weapon===undefined||(Number.isInteger(p.weapon)&&p.weapon>=0&&p.weapon<WEAPONS.length)) && (p.item===undefined||(Number.isInteger(p.item)&&p.item>=0&&p.item<4)) && (p.facing === undefined || Number.isFinite(p.facing)) && ['hold', 'shoot', 'useItem'].every(k => (p as any)[k] === undefined || typeof (p as any)[k] === 'boolean'); }
export function answer(w: OnlineWorld, id: string, choice: number) {
 const p=w.players[id];if(!p?.quiz||!Number.isInteger(choice)||choice<0||choice>3||p.answers.length>=3)return;
 const index=p.quizQuestions[p.answers.length]??p.answers.length;
 const q=w.lesson.questions[index];if(!q)return;p.answers.push(choice);if(choice===q.correct)p.quizCorrect++;
}
const neutral: Input & {reload?:boolean} = { x: 0, z: 0, crouch: true, interact: false, decoy: false };
export function tickWorld(w: OnlineWorld, controls: Record<string, Input & { reload?: boolean }>, dt: number) {
  if (w.phase !== 'playing' || w.paused) return; dt = Math.min(.05, dt); w.time += dt;
  const players = Object.values(w.players), connected = players.filter(p => p.connected);
  for (const p of connected) {
    p.invulnerable = Math.max(0, p.invulnerable - dt);
    if (p.out || p.quiz) continue;
    const input = controls[p.id] ?? neutral;
    if (w.mode === 'coop') p.run.guards = [];
    if (w.mode === 'coop') {
      const skillProgress=p.run.holdProgress,skillTarget=p.run.holdTarget;
      const base = MISSIONS[w.missionId - 1];
      const index = players.indexOf(p), columns = Math.ceil(Math.sqrt(players.length)), rows = Math.ceil(players.length / columns), offset = { x: (index % columns - (columns - 1) / 2) * (2*(base.size??8)+1), z: (Math.floor(index / columns) - (rows - 1) / 2) * (2*(base.size??8)+1) };
      const local = { ...w.mission, defend: base.defend?{...base.defend,x:base.defend.x+offset.x,z:base.defend.z+offset.z}:undefined, targets: base.targets.map(q => ({ ...q, x: q.x + offset.x, z: q.z + offset.z })), exit: { x: base.exit.x + offset.x, z: base.exit.z + offset.z } };
      // Completed players keep moving and can collect files in another participant's zone.
      local.requireSwitches=false;
      if(base.requireSwitches&&!p.run.switches.slice(index*(base.switches?.length??0),(index+1)*(base.switches?.length??0)).every(Boolean)) local.exit={x:999,z:999};
      const done = p.run.status === 'clear';
      if (done) { p.run.status = 'playing'; step({ ...local, targets: [], defend:undefined, requireSwitches:false, exit: { x: 999, z: 999 }, requiredHolds: 0, requiredShots: 0, routes: [], cameras: [], sensors: [] }, p.run, {...input,hold:false,shoot:false,decoy:false,useItem:input.useItem&&(input.item??p.run.item)!==0}, dt); p.run.status = 'clear';

      } else if (p.run.status === 'playing') { step({ ...local, routes: [], cameras: [], sensors: [] }, p.run, {...input,hold:false,shoot:false,decoy:false,useItem:input.useItem&&(input.item??p.run.item)!==0}, dt); if (p.run.status !== 'playing') beginQuiz(w,p,p.run.status==='clear'?'finish':'recovery'); }
      p.run.holdProgress=skillProgress;p.run.holdTarget=skillTarget;assistTeam(w,p,input,dt);
    } else {
      if (input.reload && p.reloading === 0 && magazineSize(p.run.weapon)>0 && p.run.ammo < magazineSize(p.run.weapon) && p.energy >= 25) { p.energy -= 25; p.reloading = 1.1; if (p.energy < 20) beginQuiz(w,p); }
      if (p.reloading > 0) { p.reloading -= dt; if (p.reloading <= 0) { p.reloading = 0; p.run.ammo = magazineSize(p.run.weapon); } }
      let struck: Participant | undefined;
      const holdTarget = connected.find(q => q !== p && !q.out && !q.quiz && q.invulnerable === 0 && distance(q.run.player, p.run.player) < 1.15 && ((p.run.player.x - q.run.player.x) * Math.sin(q.run.player.angle) + (p.run.player.z - q.run.player.z) * Math.cos(q.run.player.angle)) < -.3 && clearSight(w.mission, p.run.player, q.run.player, true));
      if (input.hold && holdTarget && p.energy >= 20 && Math.hypot(input.x, input.z) < .1) { if(p.run.holdTarget!==players.indexOf(holdTarget)){p.run.holdProgress=0;p.run.holdTarget=players.indexOf(holdTarget);} p.run.holdProgress += dt; if (p.run.holdProgress >= .9) { struck = holdTarget; p.energy -= 20; p.run.holdProgress = 0; } } else {p.run.holdProgress = 0;p.run.holdTarget=-1;}
      equip(w.mission,p.run,input);
      const weapon=WEAPONS[p.run.weapon];
      const firing = input.shoot && p.run.ammo >= weapon.cost && p.run.shotCooldown === 0 && p.reloading === 0;
      if (firing) {p.run.stealth=0;const from = p.run.player, a = input.facing ?? from.angle; const candidates = connected.filter(q => q !== p && !q.out && !q.quiz && q.invulnerable === 0 && (q.run.stealth<=0||distance(q.run.player,p.run.player)<=2)).map(q => { const dx = q.run.player.x - from.x, dz = q.run.player.z - from.z; return { q, along: dx * Math.sin(a) + dz * Math.cos(a), side: Math.abs(dx * Math.cos(a) - dz * Math.sin(a)) }; }).filter(q => q.along > 0 && q.along < weapon.range && q.side < weapon.spread && clearSight(w.mission, from, q.q.run.player, true)).sort((a, b) => a.along - b.along); struck = candidates[0]?.q; }
      const holdProgress = p.run.holdProgress;
      step(w.mission, p.run, { ...input, shoot: firing, hold: false, interact: false, decoy: false }, dt); p.run.holdProgress = holdProgress;
      if (struck) { p.stats.hits++;p.run.stealth=0;struck.hits++; struck.invulnerable = .9; if (struck.hits >= 3) { struck.out = true; struck.run.status = 'caught'; } }
      if (p.energy < 20 && p.run.ammo === 0 && p.reloading === 0) beginQuiz(w,p);
    }
  }
  if (w.mode === 'coop') {
    const shared = (w as OnlineWorld & { guards?: Run }).guards!;
    shared.switches=shared.switches.map((v,i)=>v||connected.some(p=>p.run.switches[i]));
    connected.forEach(p=>{p.run.switches=[...shared.switches];});
    // One common patrol simulation. Sleeping a guard helps the entire team.
    const active=connected.filter(p=>!p.quiz&&['playing','clear'].includes(p.run.status));
    for (const p of active) { const frozen=new Map<number,number>();connected.filter(q=>q!==p&&controls[q.id]?.hold&&q.run.holdTarget>=0).forEach(q=>{const i=q.run.holdTarget,g=shared.guards[i];if(g&&g.sleep<=0){frozen.set(i,g.sleep);g.sleep=1;}}); const guardSleepBefore=shared.guards.map(g=>g.sleep); const heldBefore=p.run.holds,shotsBefore=p.run.shots; shared.meleeHits=p.run.meleeHits;shared.weapon=p.run.weapon;shared.item=p.run.item;shared.items=[...p.run.items];shared.stealth=p.run.stealth;shared.boost=p.run.boost;shared.player = { ...p.run.player }; shared.collected = [...p.run.collected]; shared.status = 'playing'; shared.time = w.time; shared.detection = p.run.detection; shared.ammo = p.run.ammo; shared.holdProgress = p.run.holdProgress; shared.holdTarget = p.run.holdTarget; shared.shotCooldown=p.run.shotCooldown; shared.decoys=p.run.decoys; shared.cooldown=p.run.cooldown; shared.holds = p.run.holds; shared.shots = p.run.shots; step({...w.mission,switches:[]}, shared, { ...(controls[p.id] ?? neutral), x: 0, z: 0, interact: false, useItem:false, decoy:!!(controls[p.id]?.decoy||(controls[p.id]?.useItem&&p.run.item===0)) }, dt / Math.max(1, active.length)); frozen.forEach((sleep,i)=>{shared.guards[i].sleep=sleep;}); p.run.detection = p.invulnerable>0?0:Math.max(0,Math.min(100,p.run.detection+(shared.detection-p.run.detection)*Math.max(1,active.length))); p.run.peak = Math.max(p.run.peak, shared.peak); p.run.ammo = shared.ammo; p.run.shotCooldown=shared.shotCooldown; p.run.decoys=shared.decoys;p.run.items[0]=shared.decoys;p.run.noise=shared.noise; p.run.cooldown=shared.cooldown; p.run.meleeHits=shared.meleeHits;p.run.bubble=shared.bubble; p.run.holds = shared.holds; p.run.shots = shared.shots; p.run.holdProgress = shared.holdProgress; if((controls[p.id]?.hold)&&shared.holdTarget>=0)p.run.holdProgress+=dt-dt/Math.max(1,connected.length); p.run.holdTarget = shared.holdTarget; if(p.run.holds>heldBefore||p.run.shots>shotsBefore){const gi=shared.guards.findIndex((g,i)=>g.sleep>guardSleepBefore[i]);if(gi>=0){const base=MISSIONS[w.missionId-1],guard=shared.guards[gi],columns=Math.ceil(Math.sqrt(players.length)),rows=Math.ceil(players.length/columns);connected.filter(q=>q!==p).forEach(q=>{const i=players.indexOf(q),x=(i%columns-(columns-1)/2)*(2*(base.size??8)+1),z=(Math.floor(i/columns)-(rows-1)/2)*(2*(base.size??8)+1);if(Math.abs(guard.x-x)<(base.size??8)+.5&&Math.abs(guard.z-z)<(base.size??8)+.5){const holds=p.run.holds-heldBefore,shots=p.run.shots-shotsBefore;q.run.holds+=holds;q.run.shots+=shots;p.run.holds-=holds;p.run.shots-=shots;p.stats.assists++;if(!p.helped.includes(q.id))p.helped.push(q.id);}});}} if (p.run.detection>=100 && p.invulnerable===0 && p.run.status!=='clear') { p.run.status = 'caught'; beginQuiz(w,p); } }
    connected.forEach(p => { p.run.guards = shared.guards; });
    if (connected.length && connected.every(p => p.run.status === 'clear' && !p.quiz)) { finishWorld(w,connected.map(p=>p.id)); }
  } else {tickArena(w,dt);const alive=connected.filter(p=>!p.out);if(alive.length<=1)finishWorld(w,alive.map(p=>p.id));}
  if (w.time >= w.limit) { if(w.mode==='coop')connected.filter(p=>p.run.status!=='clear'&&!p.quiz).forEach(p=>{p.run.status='timeout';beginQuiz(w,p);}); const winners = w.mode === 'coop' ? connected.filter(p => p.run.status === 'clear').map(p => p.id) : connected.filter(p => !p.out).sort((a, b) => a.hits - b.hits).filter((p, _, all) => p.hits === all[0].hits).map(p => p.id);finishWorld(w,winners); }
}

export function retryCoop(w:OnlineWorld,id:string){const p=w.players[id];if(w.mode!=='coop'||w.phase!=='playing'||!p||p.quiz||!['caught','timeout'].includes(p.run.status))return;const ids=Object.keys(w.players),i=ids.indexOf(id),columns=Math.ceil(Math.sqrt(ids.length)),rows=Math.ceil(ids.length/columns),base=MISSIONS[w.missionId-1];const run=p.run;run.status='playing';run.detection=0;run.player={x:base.spawn.x+(i%columns-(columns-1)/2)*(2*(base.size??8)+1),z:base.spawn.z+(Math.floor(i/columns)-(rows-1)/2)*(2*(base.size??8)+1),angle:Math.PI};run.player.y=floorHeight(w.mission,run.player);run.guards=[];p.run=run;p.invulnerable=2;}

export {completeQuiz,requestSupply,returnToLobby,safeRadius,quizLesson} from './onlineRules';
