import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import sharp from 'sharp';
import { createServer } from 'vite';
const server = await createServer({ server: { middlewareMode: true }, appType: 'custom', logLevel: 'error', cacheDir: 'node_modules/.vite-mahjong-engine-test', optimizeDeps: { noDiscovery: true, entries: [] } });
const previousRandom = Math.random; let seed = 20261022;
Math.random = () => { seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0; return seed / 4294967296; };
try {
  const t = await server.ssrLoadModule('/src/mini-games/mahjong/tiles.ts');
  const s = await server.ssrLoadModule('/src/mini-games/mahjong/scoring.ts');
  const g = await server.ssrLoadModule('/src/mini-games/mahjong/table.ts');
  const r = await server.ssrLoadModule('/src/mini-games/mahjong/rogue.ts');
  let counter = 0;
  const tiles = types => types.map(type => ({ id: `test-${counter++}`, type }));
  const context = { winning: 21, tsumo: true, seat: 28, round: 27, dealer: false };
  const hand = tiles([0, 1, 2, 3, 4, 5, 12, 13, 14, 19, 20, 21, 13, 13]);
  assert.ok(t.shapes(hand).length);
  const pinfu = s.scoreHand(hand, [], context);
  assert.equal(pinfu.fu, 20); assert.equal(pinfu.han, 2); assert.equal(pinfu.total, 1500);
  assert.ok(pinfu.yaku.some(y => y.name === '平和'));
  const ron = s.scoreHand(hand, [], { ...context, tsumo: false });
  assert.equal(ron.han, 1); assert.equal(ron.fu, 30); assert.equal(ron.ron, 1000);
  const pairs = tiles([0, 0, 3, 3, 8, 8, 12, 12, 18, 18, 28, 28, 32, 32]);
  assert.equal(s.scoreHand(pairs, [], { ...context, tsumo: false, winning: 32 }).fu, 25);
  assert.equal(t.shapes(tiles([0, 0, 0, 0, 3, 3, 5, 5, 9, 9, 18, 18, 32, 32])).some(x => x.special === 'pairs'), false);
  const orphans = tiles([...t.ORPHANS, 0]);
  assert.equal(s.scoreHand(orphans, [], { ...context, tsumo: false, winning: 0 }).ron, 32000);
  assert.equal(t.shapes(tiles([0, 1, 2, 9, 10, 11, 27, 27])).length, 0);
  assert.equal(t.shapes(tiles([0, 0, 0, 0, 0, 3, 4, 5, 9, 10, 11, 27, 27, 27])).length, 0);
  assert.deepEqual(t.waits(hand.slice(0, -1)), [13]);
  assert.equal(t.shanten(hand), -1); assert.equal(t.shanten(hand.slice(0, -1)), 0);
  assert.equal(t.nextDora(8), 0); assert.equal(t.nextDora(30), 27); assert.equal(t.nextDora(33), 31);
  // Open, no yaku. Ten dora would still not permit a win.
  const chi = { kind: 'chi', open: true, tiles: tiles([0, 1, 2]) };
  const naked = tiles([3, 4, 5, 12, 13, 14, 19, 20, 21, 13, 13]);
  assert.equal(s.scoreHand(naked, [chi], { ...context, tsumo: false, indicators: Array(10).fill(12) }), null);
  // Four triplets on ron is not suuankou when the winning tile opens a triplet.
  const four = tiles([1, 1, 1, 10, 10, 10, 19, 19, 19, 31, 31, 31, 27, 27]);
  assert.equal(s.scoreHand(four, [], { ...context, tsumo: false, winning: 31 }).yaku.some(y => y.name === '四暗刻'), false);
  assert.equal(s.scoreHand(four, [], { ...context, tsumo: true, winning: 31 }).yaku.some(y => y.name === '四暗刻'), true);
  // Genuine triplets consume three tiles, not two; all concealed shapes use every tile.
  assert.equal(t.shapes(tiles([0, 0, 1, 1, 9, 9, 10, 10, 18, 18, 19, 19, 27, 28])).length, 0);
  const invariant = state => {
    const physical = [...state.wall, ...state.dead, ...state.players.flatMap(p => [...p.hand, ...p.melds.flatMap(m => m.tiles), ...p.river.filter(x => !x.called).map(x => x.tile)])];
    assert.equal(physical.length, 136); assert.equal(new Set(physical.map(t => t.id)).size, 136);
    assert.ok(t.countsOf(physical).every(n => n === 4)); assert.equal(state.dead.length, 14);
    assert.equal(state.players.reduce((a, p) => a + p.points, 0) + state.sticks * 1000, 100000);
    if (['draw', 'discard', 'reaction'].includes(state.phase)) state.players.forEach((p, seat) => {
      const extra = seat === state.turn && (state.phase === 'discard' || (state.phase === 'reaction' && state.pending?.addedKan !== undefined));
      assert.equal(p.hand.length, 13 - p.melds.length * 3 + Number(extra), `wrong hand size seat=${seat} phase=${state.phase}`);
    });
  };
  let wins = 0, draws = 0, played = 0;
  const started = performance.now();
  for (let match = 0; match < 6; match++) {
    let state = g.createTable(match === 0 ? 8 : 4), steps = 0;
    assert.equal(state.wall.length, 70); assert.equal(state.players.length, 4);
    while (state.phase !== 'finished' && steps++ < 6000) {
      invariant(state); played++;
      if (state.phase === 'result') { if (state.result.winner === null) draws++; else wins++; state = g.tableStep(state, { type: 'next' }); continue; }
      if (state.phase === 'reaction') { state = g.tableStep(state, { type: 'react', call: state.pending.calls.find(c => c.seat === 0 && c.kind === 'ron') }); continue; }
      if (state.turn !== 0) { state = g.cpuStep(state); continue; }
      if (state.phase === 'draw') { state = g.tableStep(state, { type: 'draw' }); continue; }
      if (g.canTsumo(state)) { state = g.tableStep(state, { type: 'tsumo' }); continue; }
      const p = state.players[0], kans = g.kanTypes(state);
      if (kans.length) { state = g.tableStep(state, { type: 'kan', tileType: kans[0] }); continue; }
      const discard = p.riichi ? p.hand.find(t => t.id === state.drawn) : p.hand[t.bestDiscard(p.hand, p.melds)];
      state = g.tableStep(state, { type: 'discard', id: discard.id, riichi: g.riichiDiscards(state).includes(discard.id) });
    }
    assert.equal(state.phase, 'finished'); invariant(state);
  }
  assert.ok(wins > 0); assert.ok(draws > 0);
  // Calls and passing: chi only from kamicha; furiten blocks ron, not tsumo.
  let fixture = g.createTable();
  fixture.players[0].hand = hand.slice(0, -1); fixture.players[0].river = [{ tile: { id: 'past', type: 13 } }];
  assert.ok(g.isFuriten(fixture, 0));
  fixture.players[0].river = []; assert.equal(g.isFuriten(fixture, 0), false);
  // Riichi cannot discard a concealed tile or be declared by an open hand.
  fixture.phase = 'discard'; fixture.turn = 0; fixture.players[0].hand = hand; fixture.drawn = hand.at(-1).id; fixture.players[0].riichi = 1;
  assert.equal(g.tableStep(fixture, { type: 'discard', id: hand[0].id }), fixture);
  fixture.players[0].riichi = 0; fixture.players[0].melds = [chi]; assert.deepEqual(g.riichiDiscards(fixture), []);
  const noWin = [0,2,4,6,8,9,11,13,15,17,27,29,31];
  const arrange = () => { const x=g.createTable(); x.players.forEach(p=>{p.hand=tiles(noWin);p.melds=[];p.river=[];}); return x; };
  let callFixture=arrange(); callFixture.turn=3; callFixture.phase='discard';
  callFixture.players[0].hand=tiles([0,1,5,6,9,11,14,16,18,20,23,25,30]);
  const dropped=tiles([2])[0]; callFixture.players[3].hand.push(dropped);
  let reaction=g.tableStep(callFixture,{type:'discard',id:dropped.id});
  const chiCall=reaction.pending.calls.find(c=>c.seat===0&&c.kind==='chi');assert.ok(chiCall);
  let called=g.tableStep(reaction,{type:'react',call:chiCall});assert.equal(called.turn,0);assert.equal(called.phase,'discard');assert.equal(called.players[0].melds[0].kind,'chi');assert.equal(called.players[0].hand.length,11);assert.ok(called.players[3].river.at(-1).called);
  callFixture.turn=1;callFixture.players[1].hand.push(dropped);
  reaction=g.tableStep(callFixture,{type:'discard',id:dropped.id});assert.equal(reaction.pending.calls.some(c=>c.seat===0&&c.kind==='chi'),false);
  let kanFixture=arrange();kanFixture.turn=0;kanFixture.phase='discard';kanFixture.players[0].hand=tiles([4,4,4,4,0,1,2,9,10,11,19,20,27,27]);kanFixture.drawn=kanFixture.players[0].hand[3].id;
  assert.ok(g.kanTypes(kanFixture).includes(4));const wallBefore=kanFixture.wall.length;
  const kanDone=g.tableStep(kanFixture,{type:'kan',tileType:4});assert.equal(kanDone.kanCount,1);assert.equal(kanDone.wall.length,wallBefore-1);assert.equal(kanDone.dead.length,14);assert.equal(kanDone.players[0].hand.length,11);assert.equal(g.indicators(kanDone).length,2);assert.ok(kanDone.rinshan);
  let rob=arrange();rob.turn=1;rob.phase='discard';rob.players[1].melds=[{kind:'pon',open:true,tiles:tiles([13,13,13])}];rob.players[1].hand=tiles([13,0,2,4,6,8,10,12,14,16,18]);rob.drawn=rob.players[1].hand[0].id;
  rob.players[0].hand=tiles([0,1,2,3,4,5,11,12,19,20,21,27,27]);
  rob=g.tableStep(rob,{type:'kan',tileType:13});const robCall=rob.pending.calls.find(c=>c.seat===0&&c.kind==='ron');assert.ok(robCall);
  const robbed=g.tableStep(rob,{type:'react',call:robCall});assert.equal(robbed.result.winner,0);assert.ok(robbed.result.score.yaku.some(y=>y.name==='槍槓'));assert.equal(robbed.kanCount,0);
  const passed=g.tableStep(rob,{type:'react'});assert.ok(passed.players[0].tempFuriten);assert.equal(passed.kanCount,1);
  const terminalWin=g.createTable();terminalWin.phase='discard';terminalWin.players[0].hand=hand;terminalWin.drawn=hand[11].id;assert.ok(g.canTsumo(terminalWin).yaku.some(y=>y.name==='天和'));
  // Stale actions cannot duplicate draws, payments, shop purchases, or banked tiles.
  let run = r.createRogue(); assert.ok(r.validRogueSave(run));
  assert.equal(run.deck.length, 144); assert.equal(run.hand.length, 16);
  assert.equal(r.rogueStep(run, { type: 'bank', ids: [run.hand[0].id, run.hand[0].id] }), run);
  assert.equal(r.classify(tiles([7, 8, 9])), null);
  const sourceId = run.hand.find(t => t.type < 27).id;
  const sourceType = run.deck.find(t => t.id === sourceId).type;
  run = r.rogueStep(run, { type: 'tool', ids: [sourceId] });
  assert.equal(run.deck.find(t => t.id === sourceId).type, sourceType, 'tools must not mutate the persistent deck');
  for (const values of [[0, 1, 2], [9, 10, 11], [18, 19, 20], [31, 31, 31], [27, 27]]) {
    const group = tiles(values); run.hand = [...group, ...run.hand.filter(t => !group.includes(t))].slice(0, 16);
    run = r.rogueStep(run, { type: 'bank', ids: group.map(t => t.id) });
  }
  assert.equal(run.banks.length, 5); assert.ok(run.score >= r.rogueGoal(1)); assert.equal(run.phase, 'shop');
  const pattern = run.offers.find(o => o.kind === 'pattern'), beforeLevel = run.levels[pattern.target];
  run = r.rogueStep(run, { type: 'buy', id: pattern.id }); assert.equal(run.levels[pattern.target], beforeLevel + 1);
  assert.equal(r.rogueStep(run, { type: 'buy', id: pattern.id }), run);
  const again = r.rogueStep(run, { type: 'next' }); assert.equal(again.stage, 2); assert.equal(again.banks.length, 0);
  assert.ok(r.validRogueSave(again)); assert.equal(r.validRogueSave({ version: 1 }), false);
  assert.equal(r.validRogueSave({ ...again, discards: undefined }), false);
  assert.equal(r.validRogueSave({ ...again, score: NaN }), false);
  // All eight gates can settle, award progression and enter endless without
  // reusing committed tiles. Controlled groups isolate score/progression logic.
  let tour=r.createRogue();tour.relics=['prism','echo','garden'];tour.levels=Object.fromEntries(r.PATTERNS.map(p=>[p.id,4]));
  for(let gate=1;gate<=8;gate++){
    assert.equal(tour.stage,gate);
    for(const [n,values] of [[0,[1,2,3]],[1,[10,11,12]],[2,[19,20,21]],[3,[31,31,31]],[4,[27,27]]]){
      const group=values.map((type,i)=>({id:`gate-${gate}-${n}-${i}`,type,foil:true}));tour.hand=[...group,...tour.hand].slice(0,16);tour=r.rogueStep(tour,{type:'bank',ids:group.map(t=>t.id)});
    }
    assert.ok(tour.score>=r.rogueGoal(gate));assert.equal(tour.phase,gate===8?'won':'shop');
    if(gate<8)tour=r.rogueStep(tour,{type:'next'});
  }
  tour=r.rogueStep(tour,{type:'next'});assert.equal(tour.stage,9);assert.equal(tour.phase,'play');assert.equal(r.rogueGoal(9),32000);
  for (const relic of r.RELICS) assert.ok(typeof relic.description === 'string');
  for (const key of ['m1','m9','p1','p9','s1','s9','z1','z7','back','star','f1','f8']) await fs.access(`public/sprites/mahjong/tiles/${key}.webp`);
  const files=(await fs.readdir('public/sprites/mahjong/tiles')).filter(f=>f.endsWith('.webp'));assert.equal(files.length,44);
  for(const file of files){const {data,info}=await sharp(`public/sprites/mahjong/tiles/${file}`).ensureAlpha().raw().toBuffer({resolveWithObject:true});assert.equal(info.width,128);assert.equal(info.height,176);
    for(let y=24;y<150;y++)for(let x=12;x<116;x++)assert.equal(data[(y*info.width+x)*4+3],255,`interior transparency ${file} ${x},${y}`);
  }
  console.log(JSON.stringify({ result: 'PASS', matches: 6, wins, draws, steps: played, seconds: Math.round((performance.now() - started) / 100) / 10 }));
} finally { Math.random = previousRandom; await server.close(); }
