import assert from "node:assert/strict";
import { createServer } from "vite";

const server = await createServer({
  optimizeDeps: { noDiscovery: true, entries: [] },
  server: { middlewareMode: true },
  appType: "custom",
  logLevel: "error",
});
let checks = 0;
const check = (value, message) => {
  assert.ok(value, message);
  checks++;
};
try {
  const e = await server.ssrLoadModule("/src/rpg/engine.ts");
  const {
    createWorld,
    addPlayer,
    applyAction,
    removePlayer,
    WIDTH,
    HEIGHT,
    card,
  } = e;
  for (let seed = 0; seed < 80; seed++) {
    const w = createWorld(seed),
      queue = [32 * WIDTH + 10],
      seen = new Set(queue);
    for (let i = 0; i < queue.length; i++)
      for (const [dx, dy] of [
        [1, 0],
        [-1, 0],
        [0, 1],
        [0, -1],
      ]) {
        const n = queue[i],
          x = (n % WIDTH) + dx,
          y = Math.floor(n / WIDTH) + dy,
          k = y * WIDTH + x;
        if (
          x < 1 ||
          x >= WIDTH - 1 ||
          y < 1 ||
          y >= HEIGHT - 1 ||
          seen.has(k) ||
          ["forest", "water"].includes(w.tiles[k])
        )
          continue;
        seen.add(k);
        queue.push(k);
      }
    check(
      w.sites.every((s) => seen.has(s.y * WIDTH + s.x)),
      `all landmarks reachable, seed ${seed}`,
    );
    assert.deepEqual(w, createWorld(seed));
  }
  check(
    JSON.stringify(createWorld(1).tiles) !==
      JSON.stringify(createWorld(2).tiles),
    "different seeds make different worlds",
  );
  const w = createWorld(777);
  for (let i = 0; i < 40; i++)
    check(addPlayer(w, `p${i}`, `冒険者${i}`), "40 participants accepted");
  check(!addPlayer(w, "overflow", "41人目"), "41st participant rejected");
  const p = w.players.p0;
  check(
    !applyAction(w, "intruder", { type: "move", dx: 1, dy: 0 }),
    "unknown actor rejected",
  );
  check(
    !applyAction(w, "p0", { type: "move", dx: 10, dy: 0 }),
    "teleport rejected",
  );
  check(
    !applyAction(w, "p0", { type: "move", dx: 1, dy: 1 }),
    "diagonal rejected",
  );
  p.x = 10;
  p.y = 32;
  check(
    applyAction(w, "p0", { type: "move", dx: 1, dy: 0 }, 1000),
    "legal movement",
  );
  check(
    !applyAction(w, "p0", { type: "move", dx: 1, dy: 0 }, 1050),
    "movement rate limited",
  );
  applyAction(w, "p0", { type: "team", target: "p0" });
  for (let i = 1; i <= 3; i++)
    applyAction(w, `p${i}`, { type: "team", target: "p0" });
  applyAction(w, "p4", { type: "team", target: "p0" });
  check(w.players.p4.team === null, "team capped at four");
  applyAction(w, "p3", { type: "team", target: null });
  check(w.players.p3.team === null, "leave team is voluntary");
  applyAction(w, "p4", { type: "team", target: "p0" });
  check(w.players.p4.team === "p0", "vacated team slot reusable");
  const boss = w.sites.find((s) => s.kind === "boss");
  p.x = boss.x;
  p.y = boss.y;
  applyAction(w, "p0", { type: "interact", siteId: boss.id });
  check(!p.battle, "boss gated by guardians");
  check(
    !applyAction(w, "p0", { type: "town", choice: "rest" }),
    "remote heal rejected",
  );
  const chest = w.sites.find((s) => s.kind === "treasure");
  p.x = chest.x;
  p.y = chest.y;
  applyAction(w, "p0", { type: "interact", siteId: chest.id });
  const gold = p.gold;
  applyAction(w, "p0", { type: "interact", siteId: chest.id });
  check(p.gold === gold, "treasure cannot be claimed twice");
  p.x = 10;
  p.y = 32;
  p.hp = 1;
  applyAction(w, "p0", { type: "town", choice: "rest" });
  check(p.hp === p.maxHp, "town heals");
  applyAction(w, "p0", { type: "town", choice: "upgrade", card: "STRIKE" });
  check(p.upgrades.includes("STRIKE"), "upgrade added");
  const afterUpgrade = p.gold;
  applyAction(w, "p0", { type: "town", choice: "upgrade", card: "STRIKE" });
  check(p.gold === afterUpgrade, "duplicate upgrade rejected");
  const guardian = w.sites.find((s) => s.kind === "guardian");
  for (let i = 0; i < 2; i++) {
    const q = w.players[`p${i}`];
    q.x = guardian.x;
    q.y = guardian.y;
    applyAction(w, q.id, { type: "interact", siteId: guardian.id });
  }
  check(!!p.battle, "nearby interaction begins battle");
  const initialHp = guardian.hp;
  check(
    !applyAction(w, "p0", { type: "card", index: 0 }),
    "cannot play before quiz",
  );
  check(
    !applyAction(w, "p0", { type: "answer", index: 99 }),
    "invalid answer rejected",
  );
  applyAction(w, "p0", { type: "answer", index: p.battle.quiz.answer });
  check(p.battle.energy === 3, "correct answer gives three energy");
  check(
    !applyAction(w, "p0", { type: "answer", index: p.battle.quiz.answer }),
    "answer cannot be replayed",
  );
  const attackIndex = p.battle.hand.findIndex(
    (k) => card(k).damage && card(k).cost <= p.battle.energy,
  );
  check(attackIndex >= 0, "deterministic hand includes attack");
  applyAction(w, "p0", { type: "card", index: attackIndex });
  check(guardian.hp < initialHp, "attack damages shared enemy");
  check(w.players.p1.battle.hp === guardian.hp, "shared enemy HP synchronized");
  const savedHp = guardian.hp;
  applyAction(w, "p0", { type: "flee" });
  applyAction(w, "p0", { type: "interact", siteId: guardian.id });
  check(p.battle.hp === savedHp, "shared damage survives retreat");
  // Simulate all forty players issuing independently validated turns through a complete raid.
  for (const s of w.sites.filter(
    (s) => s.kind === "guardian" || s.kind === "boss",
  )) {
    for (const q of Object.values(w.players)) {
      q.battle = null;
      q.x = s.x;
      q.y = s.y;
      q.hp = q.maxHp;
      applyAction(w, q.id, { type: "interact", siteId: s.id });
    }
    for (let turn = 0; turn < 40 && !s.cleared; turn++)
      for (const q of Object.values(w.players)) {
        if (!q.battle) continue;
        applyAction(w, q.id, { type: "answer", index: q.battle.quiz.answer });
        while (q.battle?.phase === "cards") {
          const index = q.battle.hand.findIndex(
            (k) => card(k).damage && card(k).cost <= q.battle.energy,
          );
          if (index < 0) break;
          applyAction(w, q.id, { type: "card", index });
        }
        if (q.battle) applyAction(w, q.id, { type: "end" });
      }
    check(s.cleared, `shared raid completes: ${s.name}`);
    check(
      Object.values(w.players).every(
        (q) => q.claimed.filter((k) => k === s.id).length === 1,
      ),
      "raid rewards exactly once per participant",
    );
  }
  check(w.won, "all forty share the victory");
  check(
    Object.values(w.players).every((q) => !q.battle),
    "victory clears all battles",
  );
  removePlayer(w, "p0");
  check(Object.keys(w.players).length === 39, "disconnect removes player");
  const solo = createWorld(3, "science");
  addPlayer(solo, "solo", "学習者");
  const student = solo.players.solo;
  const encounter = solo.sites.find((s) => s.kind === "enemy");
  student.x = encounter.x;
  student.y = encounter.y;
  applyAction(solo, "solo", { type: "interact", siteId: encounter.id });
  check(
    student.battle.quiz.options.length >= 2,
    "existing science questions loaded",
  );
  applyAction(solo, "solo", {
    type: "answer",
    index:
      (student.battle.quiz.answer + 1) % student.battle.quiz.options.length,
  });
  check(
    student.battle.energy === 1 && student.correct === 0,
    "incorrect answer still permits play",
  );
  student.hp = 1;
  applyAction(solo, "solo", { type: "end" });
  check(
    !student.battle && student.hp > 0 && student.x === 10 && student.y === 32,
    "defeat returns to town",
  );
  console.log(
    `RPG online: ${checks} checks passed; 80 connected maps, 40-player raid, card economy, teams, recovery.`,
  );
} finally {
  await server.close();
}
