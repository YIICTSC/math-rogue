import assert from 'node:assert/strict';
import { writeFile } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import { createServer } from 'vite';

const baseline = process.argv.includes('--baseline');
const baselineSource = baseline ? execFileSync('git', ['show', 'HEAD:src/rpg/engine.ts'], { encoding: 'utf8' }) : null;
const server = await createServer({
  plugins: baseline ? [{ name: 'baseline-layout', enforce: 'pre', load(id) { if (id.replaceAll('\\', '/').endsWith('/src/rpg/engine.ts')) return baselineSource; } }] : [],
  configFile: false,
  esbuild: { tsconfigRaw: {} },
  optimizeDeps: { noDiscovery: true, entries: [] },
  server: { middlewareMode: true, hmr: { port: 0 } },
  appType: 'custom',
  logLevel: 'error',
});
const reportOnly = process.argv.includes('--report-only');
try {
  const { createWorld, WIDTH, HEIGHT, addPlayer } = await server.ssrLoadModule('/src/rpg/engine.ts');
  const { BIOMES, biomeAt } = await server.ssrLoadModule('/src/rpg/biomes.ts');
  const distances = { facility: [], interaction: [], walkableFacility: [], walkableInteraction: [], walkableTown: [] };
  const summaries = [];
  const seeds = reportOnly ? 24 : 100;
  for (let seed = 0; seed < seeds; seed++) {
    const world = createWorld(seed);
    const walkDistances = sources => {
      const result = new Int32Array(WIDTH * HEIGHT).fill(-1), queue = [];
      for (const s of sources) { const k = s.y * WIDTH + s.x; result[k] = 0; queue.push(k); }
      for (let i = 0; i < queue.length; i++) {
        const k = queue[i], x = k % WIDTH, y = Math.floor(k / WIDTH);
        for (const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]]) {
          const nx=x+dx, ny=y+dy, next=ny*WIDTH+nx;
          if (nx<1 || ny<1 || nx>=WIDTH-1 || ny>=HEIGHT-1 || result[next]>=0 || ['forest','water'].includes(world.tiles[next])) continue;
          result[next]=result[k]+1; queue.push(next);
        }
      }
      return result;
    };
    const start = world.sites.find(s => s.kind === 'town');
    const reachable = walkDistances([start]);
    const recovery = walkDistances(world.sites.filter(s => ['town','rest'].includes(s.kind)));
    const towns = walkDistances(world.sites.filter(s => s.kind === 'town'));
    const interactions = walkDistances(world.sites);
    const counts = Object.fromEntries(BIOMES.map(b => [b.id, {}]));
    for (const site of world.sites) {
      const countsInBiome = counts[biomeAt(site.x, site.y).id];
      countsInBiome[site.kind] = (countsInBiome[site.kind] || 0) + 1;
    }
    for (let y = 4; y < HEIGHT - 4; y += 4) for (let x = 4; x < WIDTH - 4; x += 4) {
      const nearest = sites => Math.min(...sites.map(s => Math.abs(s.x - x) + Math.abs(s.y - y)));
      distances.facility.push(nearest(world.sites.filter(s => ['town', 'rest'].includes(s.kind))));
      distances.interaction.push(nearest(world.sites));
      const k = y * WIDTH + x;
      if (reachable[k] >= 0) {
        distances.walkableFacility.push(recovery[k]);
        distances.walkableInteraction.push(interactions[k]);
        distances.walkableTown.push(towns[k]);
      }
    }
    if (!reportOnly) {
      assert.equal(world.tiles.length, WIDTH * HEIGHT);
      assert.equal(world.sites.filter(s => s.kind === 'guardian').length, 3);
      assert.equal(world.sites.filter(s => s.kind === 'boss').length, 1);
      assert.equal(world.sites.filter(s => s.kind === 'town').length, 2);
      assert.equal(world.sites.filter(s => s.kind === 'rest').length, 4);
      for (const b of BIOMES) {
        assert.equal((counts[b.id].town || 0) + (counts[b.id].rest || 0), 1, `${seed}: recovery coverage ${b.id}`);
        assert.equal(counts[b.id].enemy, 3, `${seed}: encounters ${b.id}`);
        assert.equal(counts[b.id].event, 1, `${seed}: events ${b.id}`);
        assert.equal(counts[b.id].treasure, 2, `${seed}: treasure ${b.id}`);
      }
      assert.equal(new Set(world.sites.map(s => `${s.x},${s.y}`)).size, world.sites.length, `${seed}: no overlapping sites`);
      const visited = new Set([start.y * WIDTH + start.x]), queue = [...visited];
      for (let i = 0; i < queue.length; i++) {
        const k = queue[i], x = k % WIDTH, y = Math.floor(k / WIDTH);
        for (const [dx, dy] of [[1,0],[-1,0],[0,1],[0,-1]]) {
          const nx = x + dx, ny = y + dy, next = ny * WIDTH + nx;
          if (nx < 1 || ny < 1 || nx >= WIDTH - 1 || ny >= HEIGHT - 1 || visited.has(next) || world.tiles[next] !== 'road') continue;
          visited.add(next); queue.push(next);
        }
      }
      for (const site of world.sites) {
        assert(Number.isInteger(site.x) && Number.isInteger(site.y));
        assert(site.x >= 3 && site.y >= 3 && site.x < WIDTH - 3 && site.y < HEIGHT - 3);
        assert(visited.has(site.y * WIDTH + site.x), `${seed}: road access ${site.name}`);
        assert(reachable[site.y * WIDTH + site.x] >= 0, `${seed}: walkable access ${site.name}`);
        if (['enemy', 'event', 'treasure'].includes(site.kind))
          assert(world.sites.every(other => other === site || Math.abs(other.x-site.x)+Math.abs(other.y-site.y) >= 7), `${seed}: site spacing`);
      }
      addPlayer(world, 'test', 'test');
      assert(visited.has(world.players.test.y * WIDTH + world.players.test.x) || world.tiles[world.players.test.y * WIDTH + world.players.test.x] === 'grass');
      const nearbyEnemies = world.sites.filter(s => s.kind === 'enemy' && Math.abs(s.x-start.x)+Math.abs(s.y-start.y) <= 32);
      assert(nearbyEnemies.length >= 3, `${seed}: starter three wins available`);
      assert.deepEqual(createWorld(seed).sites, world.sites, 'seed determinism');
    }
    if (seed === 7) summaries.push({ seed, counts });
  }
  const metrics = values => {
    values.sort((a,b) => a-b);
    return { mean: +(values.reduce((sum,n) => sum+n,0)/values.length).toFixed(1), p95: values[Math.floor(values.length*.95)], max: values.at(-1) };
  };
  const report = { seeds, baseline, facilityDistance: metrics(distances.facility), interactionDistance: metrics(distances.interaction), walkableFacilityDistance: metrics(distances.walkableFacility), walkableInteractionDistance: metrics(distances.walkableInteraction), walkableTownDistance: metrics(distances.walkableTown), summaries };
  const outputIndex = process.argv.indexOf('--output');
  if (outputIndex >= 0) await writeFile(process.argv[outputIndex+1], `${JSON.stringify(report, null, 2)}\n`);
  console.log(JSON.stringify(report));
  if (!reportOnly) console.log('100 seeds passed: balanced biome coverage, road reachability, spacing, starter encounters and deterministic layouts.');
} finally { await server.close(); }
