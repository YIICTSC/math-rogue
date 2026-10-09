process.env.PW_TEST_SCREENSHOT_NO_FONTS_READY = "1";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import { createServer } from "vite";
import { chromium } from "playwright";
const file = `.online-layout-${process.pid}.tsx`;
let server, browser;
const errors = [];
try {
  await fs.writeFile(file, `import React,{useState} from 'react';import {createRoot} from 'react-dom/client';import './src/styles.css';import './src/mini-games/gakurogear/gakurogear.css';import VrLobby from './src/mini-games/gakurogear/VrLobby';import OnlineGame from './src/mini-games/gakurogear/OnlineGame';import QuizBoard from './src/mini-games/gakuro-kart/QuizBoard';import {createRace,addRacer} from './src/mini-games/gakuro-kart/engine';import './src/mini-games/gakuro-kart/kart.css';import {createWorld,addPlayer,startWorld} from './src/mini-games/gakurogear/onlineEngine';import InviteJoin from './src/mini-games/shared/InviteJoin';import GameTitleScreen from './src/mini-games/shared/GameTitleScreen';import ArcadeModal from './src/rpg/ArcadeModal';import FarmPanel from './src/rpg/farm/Panel';import CityPanel from './src/rpg/city/Panel';import CommunityPanel from './src/rpg/lifestyle/CommunityPanel';import TownPanel from './src/rpg/town/Panel';import HomeRoom from './src/rpg/HomeRoom';import MiniGameLab from './src/rpg/MiniGameLab';import {personOf} from './src/rpg/town/model';import {newInterior} from './src/rpg/homeCatalog';import HeroBuilder from './src/rpg/HeroBuilder';import RpgSettings from './src/rpg/RpgSettings';import LifePanel from './src/rpg/LifePanel';import {createWorld as rpgWorld,addPlayer as rpgPlayer} from './src/rpg/engine';const lesson={title:'Long selected lesson: arithmetic, geometry and word problems',questions:[{id:'a',question:'1 + 1',options:['2','3','4','5'],correct:0,mode:'ADDITION'}]};const w=createWorld('coop',1,lesson);for(let i=0;i<8;i++)addPlayer(w,String(i),'Long participant name '+i);lesson.questions=Array.from({length:3},(_,i)=>({...lesson.questions[0],id:String(i)}));const race=createRace();addRacer(race,'a','Player');race.phase='race';race.players.a.distance=0;race.lesson={...lesson,questions:lesson.questions.map(q=>({...q,question:'A long word problem: '+q.question+' Which answer is correct?',options:['Two','Three','Four','Five']}))};const room={selfId:'0',host:true,input:()=>{},answer:()=>{},retry:()=>{},completeQuiz:()=>{},supply:()=>{},rematch:()=>{}};const rw=rpgWorld(42);rpgPlayer(rw,'a','Hero');rw.players.a.profile={hp:80,maxHp:80,gold:100,deck:[],deckSize:0,character:'WARRIOR',image:''};rw.city={unlocked:true,treasury:3000,debt:0,aidMonth:-6,roads:[],lots:[],tax:9,budgets:{},policies:[false,false,false,false],month:0,lastTime:0,accumulator:0,population:0,happiness:0,jobs:0,traffic:0,pollution:0,income:0,expenses:0,level:0,services:{},history:[],news:[],challenge:0,challengeRound:0,claimed:0,origin:{x:30,y:30},revision:0};const kind=new URLSearchParams(location.search).get('kind');function App(){const [value,setValue]=useState('Player'),[closed,setClosed]=useState(false);window.closedPanel=closed;window.setWork=active=>{const now=Date.now();rw.life.now=now;rw.players.a.life.work=active?{tile:rw.players.a.y*192+rw.players.a.x,kind:'gather',started:now,target:now+5000,expires:now+6000}:undefined;setClosed(v=>!v);};if(kind==='invite')return <InviteJoin title='Learning Rogue online invitation' name={value} onName={setValue} onJoin={()=>{}} onClose={()=>setClosed(true)} busy={false} error={'Connection failed. Please check your network and try again. '.repeat(5)} languageMode='ENGLISH'/>;if(kind==='title')return <GameTitleScreen kind='vr' title='Create room' subtitle='Training' languageMode='ENGLISH' backdrop={<div/>} onClose={()=>{}} actions={[{label:'Create',onClick:()=>{}}]}><input aria-label='Name'/><select aria-label='Mode'><option>Co-op</option></select><button>Help</button></GameTitleScreen>;if(kind==='town'){personOf(rw,'a');return <div className='rpg-life-backdrop'><section className='rpg-life'><div className='rpg-life-content'><TownPanel world={rw} selfId='a' send={()=>{}} languageMode='ENGLISH'/></div></section></div>;}if(kind==='home'){rw.life.houses=[{id:'home',owner:'a',ownerName:'Hero',x:30,y:30,biome:'forest',home:{tile:5790,level:1,furniture:[]},interior:newInterior(),invitedAt:0}];rw.players.a.life.indoors='home';return <HomeRoom world={rw} selfId='a' send={()=>{}} languageMode='ENGLISH' onBuilder={()=>{}} onMemory={()=>{}}/>;}if(kind==='lab')return <MiniGameLab languageMode='ENGLISH' onClose={()=>{}}/>;if(kind==='racequiz')return <div className='gk-root gk-playing'><header className='gk-header'>Race</header><section className='gk-race-view has-quiz'><QuizBoard world={race} racer={race.players.a} languageMode='ENGLISH' sound={false}/></section><nav className='gk-controls'><button>Left</button><button>Right</button></nav></div>;if(kind==='hero')return <HeroBuilder initial={null} languageMode='ENGLISH' onSave={()=>{}} onClose={()=>{}}/>;if(kind==='settings')return <RpgSettings languageMode='ENGLISH' onClose={()=>{}}/>;if(kind==='farm')return <FarmPanel world={rw} selfId='a' send={()=>{}} languageMode='ENGLISH' onClose={()=>{}}/>;if(kind==='city')return <CityPanel world={rw} selfId='a' send={()=>{}} languageMode='ENGLISH' onClose={()=>{}}/>;if(kind==='life')return <LifePanel world={rw} selfId='a' target={null} languageMode='ENGLISH' send={a=>window.action=a} onClose={()=>{}} onTrack={()=>{}}/>;if(kind==='community')return <div className='rpg-life-backdrop'><section className='rpg-life'><div className='rpg-life-content'><CommunityPanel world={rw} selfId='a' send={()=>{}} languageMode='ENGLISH'/></div></section></div>;if(kind==='arcade')return <ArcadeModal me={rw.players.a} siteId='town' ready visible languageMode='ENGLISH' send={()=>{}} onClose={()=>setClosed(true)}/>;if(kind==='lobby')return <VrLobby world={w} code='ABC123' host en error='' onLeave={()=>{}} onConfigure={()=>{}} onStart={()=>setClosed(true)}/>;if(kind==='royale'||kind==='respawn'){w.mode='royale';w.missionId=300;}startWorld(w,42);w.players['0'].run.status='clear';if(kind==='result'){w.phase='result';w.winner=['0'];}if(kind==='respawn'){w.players['0'].out=true;}if(kind==='quiz')w.players['0'].quiz=true;return <OnlineGame room={room} world={w} en onBack={()=>{}} onConfigure={()=>{}}/>;}createRoot(document.getElementById('root')).render(<App/>);`);
  server = await createServer({ logLevel: "error", optimizeDeps: { noDiscovery: true, entries: [], include: ["react", "react-dom/client", "react/jsx-runtime", "three", "peerjs"] }, server: { host: "127.0.0.1", port: 5264, strictPort: true, hmr: false }, plugins: [{ name: "screen-layout-fixture", configureServer(s) {
    s.middlewares.use("/__layout", async (req, res) => {
      res.setHeader("Content-Type", "text/html");
      res.end(await s.transformIndexHtml(req.originalUrl, `<html><meta name="viewport" content="width=device-width,initial-scale=1"><body style="margin:0"><div id="root"></div><script type="module" src="/${file}"><\/script></body></html>`));
    });
  } }] });
  await server.listen();
  browser = await chromium.launch({ args: ["--no-sandbox", "--use-angle=swiftshader", "--enable-unsafe-swiftshader"] });
  const page = await browser.newPage({ reducedMotion: "reduce" });
  page.setDefaultTimeout(9e4);
  if (process.env.LAYOUT_SCREENSHOTS === "0") page.screenshot = async () => Buffer.alloc(0);
  page.on("pageerror", (e) => {
    errors.push(e.message);
    console.error(e.stack);
  });
  await fs.mkdir("tmp/online-layout", { recursive: true });
  const fit = async (locator) => {
    const b = await locator.boundingBox(), v = page.viewportSize();
    assert(b && b.x >= -1 && b.y >= -1 && b.x + b.width <= v.width + 1 && b.y + b.height <= v.height + 1, JSON.stringify(b));
  };
  for (const kind of ["lobby", "game", "quiz", "result", "royale", "respawn", "racequiz", "invite", "arcade", "hero", "settings", "farm", "city", "life", "community", "town", "home", "lab"].filter((k) => !process.env.LAYOUT_KINDS || process.env.LAYOUT_KINDS.split(",").includes(k))) {
    console.log("Checking", kind);
    await page.goto("http://127.0.0.1:5264/__layout?kind=" + kind, { waitUntil: "domcontentloaded", timeout: 12e4 });
    await page.locator(kind === "arcade" ? ".rpg-arcade-dialog" : kind === "invite" ? ".online-invite-entry" : kind === "settings" ? ".rpg-settings" : kind === "racequiz" ? ".gk-quiz-board" : kind === "lab" ? ".rpg-mini-lab" : ["hero", "farm", "city", "life", "community", "town", "home", "lab"].includes(kind) ? ".rpg-life" : ".gear-shell").waitFor();
    for (const [width, height] of [[320, 568], [390, 844], [568, 320], [844, 390], [1280, 800]]) {
      await page.setViewportSize({ width, height });
      await page.waitForTimeout(80);
      assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), kind + " horizontal overflow");
      if (["hero", "settings", "farm", "city", "life", "community", "town", "home", "lab"].includes(kind)) {
        const root = page.locator(kind === "settings" ? ".rpg-settings" : kind === "racequiz" ? ".gk-quiz-board" : kind === "lab" ? ".rpg-mini-lab" : ".rpg-life").first();
        assert(await root.evaluate((el) => el.scrollWidth <= el.clientWidth + 2), kind + " panel horizontal overflow");
        for (const area of await root.locator(".rpg-life-content,.rpg-settings-content,.farm-scroll").all()) assert(await area.evaluate((el) => el.scrollWidth <= el.clientWidth + 2), kind + " inner horizontal overflow");
        for (const button of await root.locator(":scope > header button").all()) await fit(button);
        const nav = root.locator(":scope > nav");
        if (await nav.count()) assert((await nav.boundingBox()).height <= 100, kind + " navigation too tall");
      }
      if (["farm", "city", "life"].includes(kind)) {
        const selector = kind === "farm" ? ".farm-tabs button" : ".rpg-life>nav button";
        for (const button of await page.locator(selector).all()) {
          await button.click();
          for (const area of await page.locator(".rpg-life-content,.farm-scroll,.city-content").all()) assert(await area.evaluate((el) => el.scrollWidth <= el.clientWidth + 2), kind + " tab overflow " + await button.innerText());
        }
      }
      if (kind === "town") {
        for (const button of await page.locator(".town-tabs button").all()) {
          await button.click();
          assert(await page.locator(".town-panel").evaluate((el) => el.scrollWidth <= el.clientWidth + 2), "Town tab overflow " + await button.innerText());
        }
      }
      if (kind === "home") {
        for (const button of await page.locator(".rpg-life>nav button").all()) {
          await button.click();
          assert(await page.locator(".rpg-life-content").evaluate((el) => el.scrollWidth <= el.clientWidth + 2), "Home tab overflow " + await button.innerText());
        }
      }
      if (kind === "lab") {
        await page.evaluate(() => document.querySelector(".rpg-mini-lab").scrollTop = 1e4);
        await fit(page.locator(".rpg-mini-lab>header button"));
        const count = await page.locator(".gc-party-lobby button").count();
        assert.equal(count, 10);
        for (let i = 0; i < count; i++) {
          await page.locator(".gc-party-lobby button").nth(i).click();
          await page.locator(".gc-game-start,.rpg-rhythm-lobby").first().waitFor();
          if (await page.locator(".rpg-rhythm-lobby").count()) {
            assert(await page.locator(".rpg-rhythm-lobby").evaluate((el) => el.scrollWidth <= el.clientWidth + 2), "Rhythm lobby overflow");
            await page.locator(".rpg-rhythm-actions>button").last().click();
            await page.locator(".gc-party-lobby").waitFor();
            continue;
          }
          await page.locator(".gc-game-start").click();
          await page.locator(".gc-hobby.is-live,.rpg-rhythm-live").first().waitFor();
          if (await page.locator(".gc-hobby.is-live").count()) {
            const game = page.locator(".gc-hobby.is-live");
            assert(await game.evaluate((el) => el.scrollWidth <= el.clientWidth + 2), "Game furniture overflow " + i + " at " + width + "x" + height);
            await fit(game.locator(":scope>.gc-game-exit"));
            await game.locator(":scope>.gc-game-exit").click();
          } else {
            await page.keyboard.press("Escape");
          }
          await page.locator(".gc-party-lobby").waitFor();
        }
      }
      if (kind === "lobby") {
        await fit(page.getByRole("button", { name: "START", exact: true }));
        assert.equal(await page.locator(".gear-lobby-roster p").count(), 8);
        await page.getByRole("button", { name: "START", exact: true }).click();
        assert(await page.evaluate(() => window.closedPanel));
      }
      if (kind === "racequiz") {
        await fit(page.locator(".gk-quiz-board"));
      }
      if (kind === "quiz" || kind === "result") {
        await fit(page.locator(".gear-overlay section"));
        assert(await page.locator(".gear-overlay section").evaluate((el) => el.scrollWidth <= el.clientWidth + 2), "Quiz/result horizontal overflow");
      }
      if (kind === "game" || kind === "royale") {
        await fit(page.locator(".gear-controls"));
        const field=await page.locator('.gear-field').boundingBox(),weapon=await page.locator('.gear-weapon-slot').boundingBox(),item=await page.locator('.gear-item-slot').boundingBox();
        assert(weapon.x>field.x+field.width/2&&item.x<field.x+field.width/2,'Equipment corners');
        assert(weapon.y+weapon.height<=field.y+field.height+1&&item.y+item.height<=field.y+field.height+1,'Equipment remains inside field');
        assert(item.x+item.width<weapon.x,'Equipment slots do not overlap');
        for(const control of await page.locator('.gear-loadout select,.gear-loadout button').all())await fit(control);
        await fit(page.locator(".gear-objective"));
        await page.locator(".gear-online-roster summary").click();
        const a = await page.locator(".gear-online-roster").boundingBox(), b = await page.locator(".gear-radar").boundingBox();
        assert(a.x >= b.x + b.width, "Roster covers radar");
        await page.locator(".gear-online-roster summary").click();
        for (const button of await page.locator(".gear-controls button,.gear-header button").all()) await fit(button);
      }
      if (kind === "invite") {
        await fit(page.locator(".online-invite-submit"));
        await fit(page.locator(".online-invite-close"));
      }
      if (kind === "arcade") {
        await page.locator(".rpg-arcade-content").evaluate((el) => el.scrollTop = el.scrollHeight);
        await fit(page.locator(".rpg-arcade-close"));
        const close = page.locator(".rpg-arcade-close");
        assert(await close.evaluate((el) => {
          const r = el.getBoundingClientRect();
          return el.contains(document.elementFromPoint(r.x + r.width / 2, r.y + r.height / 2));
        }), "Arcade close covered");
      }
      if (width === 568 || width === 390) await page.screenshot({ path: "tmp/online-layout/" + kind + "-" + width + ".png" });
    }
    if (kind === "life") {
      await page.locator(".rpg-life>nav button").first().click();
      await page.evaluate(() => window.setWork(true));
      await page.locator(".rpg-life-gauge b").waitFor();
      const before = await page.locator(".rpg-life-gauge b").boundingBox();
      await page.waitForTimeout(250);
      const after = await page.locator(".rpg-life-gauge b").boundingBox();
      assert(after.x > before.x, "Active gathering meter advances");
      await page.locator(".rpg-life-work .rpg-life-primary").click();
      assert.equal(await page.evaluate(() => window.action.type), "life-hit");
      await page.evaluate(() => window.setWork(false));
      await page.locator(".rpg-life-gauge").waitFor({ state: "detached" });
    }
    console.log("PASS", kind, "five sizes");
  }
  await page.goto("http://127.0.0.1:5264/__layout?kind=title", { waitUntil: "domcontentloaded" });
  await page.getByLabel("Name").waitFor();
  await page.getByRole("button", { name: "Help", exact: true }).focus();
  await page.keyboard.press("Tab");
  assert.equal(await page.evaluate(() => document.activeElement.className), "game-launch-back");
  await page.keyboard.press("Shift+Tab");
  assert.equal(await page.evaluate(() => document.activeElement.textContent), "Help");
  await page.getByLabel("Name").focus();
  await page.keyboard.press("Tab");
  assert.equal(await page.evaluate(() => document.activeElement.tagName), "SELECT");
  assert.deepEqual(errors, []);
  console.log("PASS keyboard focus includes room fields");
} finally {
  await browser?.close();
  await server?.close();
  await fs.rm(file, { force: true });
}
