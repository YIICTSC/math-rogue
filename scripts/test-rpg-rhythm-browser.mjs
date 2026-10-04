import assert from "node:assert/strict";
import fs from "node:fs/promises";
import { createServer } from "vite";
import { chromium } from "playwright";
const file = `.rpg-rhythm-fixture-${process.pid}.tsx`;
let vite, browser;
try {
  await fs.writeFile(
    file,
    `import React,{useEffect,useState} from 'react';import {createRoot} from 'react-dom/client';import RhythmPanel from './src/rpg/rhythm/RhythmPanel';import {gameCommand,tickGames} from './src/mini-games/gakuro-craft/homeGames';import {RHYTHM_SONGS} from './src/rpg/rhythm/catalog.generated';import {rhythmChart} from './src/rpg/rhythm/chart';import {trans} from './src/utils/textUtils';import {audioService} from './src/services/audioService';window.audio=audioService;
const home={tile:9,level:1,furniture:[{slot:2,item:'rhythm'}]},world={tiles:[],homeViews:{9:home},players:{},games:{},time:10,paused:false};world.tiles[9]={homeOwner:'p0'};for(let i=0;i<4;i++){const id='p'+i;world.players[id]={id,name:'Player '+i,indoors:true,homeTile:9,progress:{home}};gameCommand(world,world.players[id],{type:'game_join',slot:2});}const game=world.games['9:2'];const song=RHYTHM_SONGS.find(s=>s.path==='bgm-new/magic-female/reward.mp3');gameCommand(world,world.players.p0,{type:'game_rhythm_select',key:game.key,song:song.id,difficulty:'expert',length:'full'});for(let i=1;i<4;i++)gameCommand(world,world.players['p'+i],{type:'game_rhythm_ready',key:game.key,song:song.id,difficulty:'expert',length:'full',ready:true});window.notes=rhythmChart(song,'expert','full');window.authority=world;window.game=game;
function App(){const [w,sw]=useState(structuredClone(world)),[mode,sm]=useState('JAPANESE');const emit=()=>sw(structuredClone(world));window.emit=emit;window.setMode=sm;const send=c=>{gameCommand(world,world.players.p0,c);emit();};window.send=send;useEffect(()=>{let previous=performance.now();const timer=setInterval(()=>{const now=performance.now();world.time+=(now-previous)/1000;previous=now;tickGames(world,.05);emit();},50);return()=>clearInterval(timer);},[]);return world.games[game.key]?.players.includes('p0')?<RhythmPanel world={w} g={w.games[game.key]} selfId="p0" t={s=>trans(s,mode)} send={send}/>:<div>LEFT</div>;}createRoot(document.getElementById('root')).render(<App/>);`,
  );
  vite = await createServer({
    cacheDir: "node_modules/.vite-rhythm-browser",
    optimizeDeps: {
      noDiscovery: true,
      entries: [],
      include: ["react", "react-dom/client", "react/jsx-runtime"],
    },
    server: { host: "127.0.0.1", port: 5224, strictPort: true, hmr: false },
    plugins: [
      {
        name: "rhythm-test",
        configureServer(s) {
          s.middlewares.use("/__rhythm", async (req, res) => {
            res.setHeader("Content-Type", "text/html");
            res.end(
              await s.transformIndexHtml(
                req.url,
                `<html><meta name="viewport" content="width=device-width,initial-scale=1"><body style="margin:0"><div id="root"></div><script type="module" src="/${file}"></script></body></html>`,
              ),
            );
          });
        },
      },
    ],
    logLevel: "error",
  });
  await vite.listen();
  browser = await chromium.launch({ headless: true });
  const p = await browser.newPage({ viewport: { width: 390, height: 844 } });
  p.setDefaultTimeout(60000);
  p.setDefaultNavigationTimeout(120000);
  const errors = [];
  p.on("pageerror", (e) => errors.push(e.message));
  await p.addInitScript(() => {
    const Original = window.Audio;
    window.Audio = function (src) {
      const a = new Original(src);
      if (src?.includes("/bgm")) window.music = a;
      return a;
    };
    window.Audio.prototype = Original.prototype;
  });
  await p.goto("http://127.0.0.1:5224/__rhythm");
  await p.getByText("楽曲読み込み完了", { exact: true }).waitFor();
  assert.equal(await p.locator(".rpg-rhythm-songs button").count(), 143);
  assert.equal(await p.locator(".rpg-rhythm-board article").count(), 4);
  await p.getByLabel("編を選ぶ").selectOption("マジック編・女性");
  assert.equal(await p.locator(".rpg-rhythm-songs button").count(), 27);
  await p.getByLabel("編を選ぶ").selectOption("all");
  await p.getByLabel("BGMの種類").selectOption("新BGM");
  assert.equal(await p.locator(".rpg-rhythm-songs button").count(), 71);
  await p.getByLabel("BGMの種類").selectOption("all");
  await p.evaluate(() => window.setMode("ENGLISH"));
  await p.getByLabel("Choose chapter").selectOption("マジック編・女性");
  assert.equal(await p.locator(".rpg-rhythm-songs button").count(), 27);
  await p.getByLabel("Choose chapter").selectOption("all");
  await p.evaluate(() => window.setMode("JAPANESE"));
  await p.getByRole("button", { name: "楽曲を試聴", exact: true }).click();
  await p.waitForFunction(() => window.music.currentTime > 0.1);
  await p.getByRole("button", { name: "試聴を止める", exact: true }).click();
  assert.ok(await p.evaluate(() => window.music.paused));
  await p.getByRole("button", { name: "準備する", exact: true }).click();
  await p.waitForFunction(() => window.game.rhythm.ready[0]);
  await p.getByRole("button", { name: "演奏を開始", exact: true }).click();
  await p.getByRole("dialog", { name: "学ロリズム" }).waitFor();
  await p.screenshot({ path: "/tmp/rpg-rhythm-portrait.png" });
  await p.setViewportSize({ width: 844, height: 390 });
  await p.screenshot({ path: "/tmp/rpg-rhythm-landscape.png" });
  await p.setViewportSize({ width: 1440, height: 900 });
  await p.screenshot({ path: "/tmp/rpg-rhythm-desktop.png" });
  await p.evaluate(() => {
    window.autoEvents = window.notes
      .flatMap((n, i) => [
        { time: n.time, lane: n.lane, down: true },
        { time: n.end ?? n.time + 0.025, lane: n.lane, down: false },
      ])
      .sort((a, b) => a.time - b.time);
    window.autoIndex = 0;
    function tick() {
      const a = window.music;
      if (a && !a.paused) {
        while (
          window.autoIndex < window.autoEvents.length &&
          window.autoEvents[window.autoIndex].time <= a.currentTime
        ) {
          const e = window.autoEvents[window.autoIndex++];
          document
            .querySelector(".rpg-rhythm-stage canvas")
            .dispatchEvent(
              new KeyboardEvent(e.down ? "keydown" : "keyup", {
                key: ["d", "f", "j", "k"][e.lane],
                bubbles: true,
              }),
            );
        }
      }
      window.autoFrame = requestAnimationFrame(tick);
    }
    tick();
  });
  await p.getByRole("status").waitFor();
  const final = await p.evaluate(() => ({
    score: window.game.scores[0],
    r: window.game.rhythm.results[0],
    count: window.notes.length,
    record: JSON.parse(localStorage.getItem("rpg-rhythm-records-v1")),
  }));
  assert.ok(final.score > 950000, JSON.stringify(final));
  assert.equal(final.r.miss, 0);
  assert.ok(final.r.perfect >= final.count);
  assert.equal(Object.values(final.record)[0].score, final.score);
  await p.screenshot({ path: "/tmp/rpg-rhythm-result.png" });
  await p.evaluate(() => cancelAnimationFrame(window.autoFrame));
  await p.getByRole("button", { name: "もう一度遊ぶ", exact: true }).click();
  await p.getByRole("dialog", { name: "学ロリズム" }).waitFor();
  await p.waitForFunction(
    () => window.music.currentTime > 0.1 && !window.music.paused,
  );
  await p.getByRole("button", { name: "一時停止", exact: true }).click();
  await p.getByText("一時停止中", { exact: true }).waitFor();
  const paused = await p.evaluate(() => window.music.currentTime);
  await p.waitForTimeout(350);
  assert.ok(
    Math.abs((await p.evaluate(() => window.music.currentTime)) - paused) < 0.1,
  );
  await p.getByRole("button", { name: "再開", exact: true }).first().click();
  await p.waitForFunction((t) => window.music.currentTime > t + 0.15, paused);
  assert.equal(await p.evaluate(() => window.game.rhythm.run), 2);
  const firstNote = await p.evaluate(() => window.notes[0]);
  await p.waitForFunction((time) => window.music.currentTime >= time - 0.03, firstNote.time);
  await p.locator(".rpg-rhythm-pads button").nth(firstNote.lane).click();
  await p.waitForFunction(() => window.game.rhythm.results[0].heads[0] > 0);
  assert.notEqual(await p.evaluate(() => window.game.rhythm.results[0].heads[0]), 4, "Pointer input scores a note");
  await p.screenshot({path:"/tmp/rpg-rhythm-playing.png"});
  await p.evaluate(async () => {
    window.audio.toggleMute();
  });
  await p.waitForFunction(() => window.music.volume === 0);
  await p.evaluate(() => window.audio.toggleMute());
  await p.waitForFunction(() => window.music.volume > 0);
  await p.getByRole("button", { name: "退出", exact: true }).click();
  await p.getByText("LEFT", { exact: true }).waitFor();
  assert.equal(
    await p.evaluate(() => window.game.phase),
    "playing",
    "Others continue after leaving",
  );
  assert.deepEqual(await p.evaluate(() => window.game.players), [
    "p1",
    "p2",
    "p3",
  ]);
  assert.ok(await p.evaluate(() => window.music.paused));
  assert.equal(errors.length, 0, errors.join("\n"));
  console.log(
    "Rhythm browser passed: real MP3 loading/preview/playback, all 143 song choices and filters, 4 seats, keyboard taps/holds with live score, responsive portrait/landscape/desktop, records, rematch reset, synchronized pause/resume, mute and cleanup while other players continue.",
  );
} finally {
  await browser?.close();
  await vite?.close();
  await fs.rm(file, { force: true });
}
