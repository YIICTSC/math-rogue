import assert from 'node:assert/strict';
import { createServer } from 'vite';
const server = await createServer({ server: { middlewareMode: true, watch: null, hmr: false }, optimizeDeps: { noDiscovery: true, include: [] }, appType: 'custom' });
try {
  const { meterPosition, impactAt, SWEEP_MS } = await server.ssrLoadModule('/src/mini-games/gakuro-golf/shotTiming.ts');
  const { createGolf, addPlayer, startGolf, command, tick, viewFor, shotVelocity, shotQuality } = await server.ssrLoadModule('/src/mini-games/gakuro-golf/engine.ts');
  const { predictShot } = await server.ssrLoadModule('/src/mini-games/gakuro-golf/motion.ts');
  const { validView } = await server.ssrLoadModule('/src/mini-games/gakuro-golf/protocol.ts');
  assert.equal(meterPosition(SWEEP_MS*.7).position,.7);
  assert.equal(meterPosition(SWEEP_MS).position,1);
  assert.equal(meterPosition(SWEEP_MS*1.5).returning,true);
  assert(Math.abs(meterPosition(SWEEP_MS*1.88).position-.12)<1e-10);
  assert(Math.abs(impactAt(meterPosition(SWEEP_MS*1.88).position))<1e-10);
  assert.equal(meterPosition(SWEEP_MS*2).expired,true);
  assert.equal(shotQuality(0),'nice'); assert.equal(shotQuality(.4),'good'); assert.equal(shotQuality(.9),'miss');
  const setup = () => {const w=createGolf(23);addPlayer(w,'p','P');startGolf(w,'Lesson');Object.assign(w.players.p,{phase:'aim',correct:3,shotsLeft:3});return w;};
  const w=setup(),p=w.players.p,shot={type:'shot',shotId:p.shotId,club:'wedge',angle:0,power:.7,spin:-1,impact:.1};
  for (const bad of [{spin:2},{impact:NaN},{spin:'1'},{impact:-1.01}]) assert.equal(command(w,'p',{...shot,...bad}),false);
  assert(command(w,'p',shot)); assert.equal(p.shotQuality,'nice');assert.equal(p.shotSpin,-1);
  assert.equal(command(w,'p',shot),false,'second tap cannot submit duplicate shot');
  assert(validView(viewFor(w,'p')));assert.equal(validView({...viewFor(w,'p'),players:[{...viewFor(w,'p').players[0],shotSpin:5}]}),false);
  const neutral=shotVelocity(p,'wedge',0,.7),back=shotVelocity(p,'wedge',0,.7,-1),top=shotVelocity(p,'wedge',0,.7,1);
  assert(back.vy>neutral.vy&&top.vy<neutral.vy,'backspin lifts, topspin lowers launch');
  assert.deepEqual(shotVelocity(p,'putter',0,.7,1),shotVelocity(p,'putter',0,.7,-1),'putter remains neutral');
  const previewPlayer={...viewFor(setup(),'p').players[0],hole:0,x:0,z:0};
  assert.notDeepEqual(predictShot(previewPlayer,'wedge',0,.7,-1),predictShot(previewPlayer,'wedge',0,.7,1));
  for(const spin of [-1,0,1]) {
    const w=setup(),p=w.players.p;Object.assign(p,{x:0,z:20,y:.01,phase:'moving',vx:0,vz:2,vy:-1,shotSpin:spin,shotClub:'wedge',shotAngle:0});tick(w,1/30);
    assert.equal(p.spinApplied,true);if(spin<0)assert(p.vz<0,'backspin can reverse first landing');if(spin>0)assert(p.vz>2,'topspin accelerates first roll');
    const vz=p.vz;tick(w,1/30);assert(Math.abs(p.vz-vz)<1,'landing impulse is applied once');
  }
  console.log('Golf meter: continuing sweep, return target, timeout, validated spin/impact, authoritative grade, putter, launch and one-time landing spin passed.');
} finally {await server.close();}
