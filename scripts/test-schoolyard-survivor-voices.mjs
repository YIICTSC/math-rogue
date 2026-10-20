import assert from "node:assert/strict";
import { access } from "node:fs/promises";
import { build } from "esbuild";
const bundle = await build({
  entryPoints: ["src/mini-games/schoolyard-survivor/voices.ts"],
  bundle: true,
  write: false,
  format: "esm",
  platform: "node",
});
const { createSurvivorVoices } = await import(
  "data:text/javascript;base64," +
    Buffer.from(bundle.outputFiles[0].text).toString("base64")
);
const roster = await build({
  entryPoints: ["src/three/protagonistCatalog.ts"],
  bundle: true,
  write: false,
  format: "esm",
  platform: "node",
});
const { PROTAGONISTS } = await import(
  "data:text/javascript;base64," +
    Buffer.from(roster.outputFiles[0].text).toString("base64")
);
let time = 0,
  allowed = true,
  rng = 0;
const calls = [];
const audio = {
  canPlayConversationVoice: () => allowed,
  stopSchoolHeroVoices: () => calls.push(["stop"]),
  playHighSchoolVoiceFile: (...args) => {
    calls.push(["high-school", ...args]);
    return Promise.resolve(true);
  },
  playMagicVoiceFile: (...args) => {
    calls.push(["magic", ...args]);
    return Promise.resolve(true);
  },
};
const controller = createSurvivorVoices(
    audio,
    () => time,
    () => rng,
  ),
  voices = () => calls.filter((c) => c[0] !== "stop"),
  tick = async () => {
    time += 5000;
    await new Promise((resolve) => setImmediate(resolve));
  };
for (const hero of PROTAGONISTS)
  for (const action of ["attack", "damage", "heal", "burst", "win", "defeat"])
    for (const variant of [0, 0.999]) {
      await tick();
      rng = variant;
      controller.reset(hero.id);
      // Normal voice probability and variation are independent: pass its chance roll, then select the variant.
      let roll = 0;
      const selected = createSurvivorVoices(
        audio,
        () => time,
        () =>
          roll++ === 0 && !["burst", "win", "defeat"].includes(action)
            ? 0
            : variant,
      );
      selected.reset(hero.id);
      const before = voices().length;
      selected.play(action);
      await tick();
      if (hero.id.startsWith("elementary-"))
        assert.equal(voices().length, before);
      else {
        const [theme, id, file] = voices().at(-1);
        assert.equal(
          id,
          hero.id.replace(/^(high-school|magic)-/, "").toUpperCase(),
        );
        await access(`public/sfx/${theme}-voices/${id}/${file}.ogg`);
      }
    }
rng = 0;
controller.reset("high-school-warrior");
controller.play("attack");
const first = voices().length;
controller.play("attack");
assert.equal(voices().length, first);
await tick();
controller.play("damage");
assert.equal(voices().at(-1)[2], "damage-1");
controller.play("burst");
assert.equal(
  voices().at(-1)[2],
  "power-1",
  "burst preempts the normal cooldown",
);
controller.play("win");
assert.equal(voices().at(-1)[2], "finish-1");
controller.play("defeat");
assert.equal(voices().at(-1)[2], "defeat-1");
allowed = false;
const muted = voices().length;
controller.play("burst");
assert.equal(voices().length, muted);
allowed = true;
const releases = [];
audio.playMagicVoiceFile = (...args) => {
  calls.push(["magic", ...args]);
  return new Promise((resolve) => releases.push(resolve));
};
controller.reset("magic-akari");
controller.play("attack");
await tick();
const pending = voices().length;
controller.play("damage");
assert.equal(voices().length, pending, "no queue while a clip loads");
controller.play("burst");
assert.equal(voices().at(-1)[2], "spell-1");
releases[0](true);
await tick();
const stillPending = voices().length;
controller.play("damage");
assert.equal(
  voices().length,
  stillPending,
  "an old completion cannot unlock a newer load",
);
releases[1](true);
await tick();
controller.play("damage");
assert.equal(voices().at(-1)[2], "damage-1");
controller.stop();
audio.playMagicVoiceFile = () => Promise.reject(new Error("offline"));
controller.reset("magic-ren");
controller.play("burst");
await tick();
audio.playMagicVoiceFile = (...args) => {
  calls.push(["magic", ...args]);
  return Promise.resolve(true);
};
controller.play("burst");
assert.equal(voices().at(-1)[1], "REN");
console.log(
  "PASS: all 26 voiced heroes and six action families use existing clips; elementary silence, probability/spacing, mute, priority, pending-load exclusion, stale completions and offline recovery.",
);
