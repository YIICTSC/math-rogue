import assert from "node:assert/strict";
import { readFile, access } from "node:fs/promises";
import { createServer } from "vite";
import sharp from "sharp";
const server = await createServer({
  logLevel: "error",
  optimizeDeps: { noDiscovery: true, entries: [] },
  server: { middlewareMode: true },
  appType: "custom",
});
try {
  const { HEROES, FIELDS, createObstacles, moveActor, spawnPoint } =
    await server.ssrLoadModule("/src/mini-games/schoolyard-survivor/world.ts");
  assert.equal(HEROES.length, 35);
  assert.equal(new Set(HEROES.map((h) => h.id)).size, 35);
  for (const h of HEROES)
    await access(`public/sprites/wandering-student/${h.id}.webp`);
  for (const f of FIELDS) {
    const obstacles = createObstacles(f);
    assert(obstacles.length >= 30);
    assert(!obstacles.some((o) => Math.hypot(o.x - 1000, o.y - 1000) < 200));
    for (const o of obstacles) {
      const a = { x: o.x - o.w / 2 - 40, y: o.y };
      moveActor(a, 200, 0, 12, [o]);
      assert(a.x <= o.x - o.w / 2 - 12, "dash must not tunnel through props");
      const sliding = { x: o.x - o.w / 2 - 13, y: o.y };
      moveActor(sliding, 15, 25, 12, [o]);
      assert(sliding.y > o.y, "actors slide along a blocked wall");
    }
    for (let x = 50; x <= 1950; x += 190)
      for (let y = 50; y <= 1950; y += 190) {
        const p = spawnPoint(x, y, Math.PI / 7, 350, obstacles);
        assert(p, "a reachable spawn exists at world edges");
        assert(Math.hypot(p.x - x, p.y - y) >= 350 * 0.65);
        assert(
          !obstacles.some(
            (o) =>
              Math.abs(p.x - o.x) < o.w / 2 + 40 &&
              Math.abs(p.y - o.y) < o.h / 2 + 40,
          ),
        );
      }
  }
  const { STUDENT_ABILITIES } = await server.ssrLoadModule(
    "/src/components/school-dungeon/student/abilities.ts",
  );
  const { abilityCutin } = await server.ssrLoadModule(
    "/src/components/school-dungeon/student/cutins.ts",
  );
  for (const hero of HEROES) {
    const ability = STUDENT_ABILITIES[hero.id],
      cutin = abilityCutin(hero.id, ability.en);
    assert(
      cutin?.url.includes(`sprites/ultimate-cutins/${hero.id}-skill-1.webp`),
    );
    await access(`public/sprites/ultimate-cutins/${hero.id}-skill-1.webp`);
  }
  const atlas = JSON.parse(
    await readFile("assets/schoolyard-survivor/atlas.json", "utf8"),
  );
  assert.equal(atlas.weapons.length, 40);
  assert.equal(atlas.scenery.length, 12);
  assert.equal(atlas.effects.length * atlas.effectFrames, 48);
  for (const [name, rows] of [
    ["weapons", 5],
    ["scenery", 2],
    ["effects", 6],
  ]) {
    const image = sharp(`public/sprites/schoolyard-survivor/${name}.webp`),
      m = await image.metadata();
    assert.equal(m.width, 1024);
    assert.equal(m.height, 128 * rows);
    assert(m.hasAlpha);
    const pixels = await image.raw().toBuffer();
    assert.equal(pixels[3], 0);
  }
  console.log(
    "PASS: 35 authentic heroes; all four fields; collision/sliding/dash tunneling; edge-safe spawns; Blender atlas dimensions and transparency.",
  );
} finally {
  await server.close();
}
