import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import { createServer } from 'vite';
import { chromium } from 'playwright';
const entry = `.dungeons1-audio-${process.pid}.tsx`, out = 'tmp/dungeons1-audio';
let server, browser;
try {
  await fs.mkdir(out, { recursive: true });
  await fs.writeFile(entry, `
import React,{useState} from 'react';import{createRoot}from'react-dom/client';
import Game from './src/components/SchoolDungeonRPG';import './src/styles.css';
import {audioService as audio}from './src/services/audioService';
import {useStudentAudio}from './src/components/school-dungeon/student/useStudentAudio';
import {ChronicleScene}from './src/components/school-dungeon/chronicles/ChronicleScene';
import {chronicleScene}from './src/components/school-dungeon/chronicles/story';
window.__calls=[];window.__voiceClock=0;audio.playBGM=async()=>{};audio.stopBGM=()=>{};
audio.canPlayConversationVoice=()=>true;
for(const method of ['playAttackEffectSound','playStatusEffectSound','playBattleSound','playDungeonsAbilitySound'])audio[method]=(...args)=>window.__calls.push([method,...args]);
for(const method of ['playHighSchoolVoiceFile','playMagicVoiceFile','playDungeonChronicleVoiceFile','playDungeons2VoiceFile'])audio[method]=(...args)=>{window.__calls.push([method,...args]);return Promise.resolve(true);};
function HookProbe(){const [s,set]=useState({heroId:'high-school-warrior',active:true,runId:'probe',floor:2,hp:100,gameOver:false,gameClear:false,transformed:false,inventory:[],equipment:{weapon:null,armor:null},inDungeon:true,movement:'0'});window.__snapshot=(p)=>set(s=>({...s,...p}));useStudentAudio(s,'dungeons1');return <p>Audio probe</p>;}
const params=new URLSearchParams(location.search),hero=params.get('sceneHero');
const root=createRoot(document.getElementById('root'));
if(hero){const s=chronicleScene({version:1,mode:'STORY',heroId:hero,seen:[0,1,2],choices:{0:'release',1:'release',2:'release'},ending:'release'},hero,hero.startsWith('dungeons2-')?2:1,params.has('npc')?1:3);root.render(<ChronicleScene scene={s} line={0} text={(j,e)=>e} advance={()=>{}} choose={()=>{}}/>);}
else root.render(params.has('hook')?<HookProbe/>:<Game languageMode="ENGLISH" onBack={()=>{}}/>);
`);
  server = await createServer({ logLevel: 'error', cacheDir: 'node_modules/.vite-d1-audio',
    optimizeDeps: { noDiscovery: true, include: ['react', 'react-dom/client', 'react/jsx-runtime', 'three'] },
    server: { host: '127.0.0.1', port: 0, hmr: false }, plugins: [{ name: 'd1-audio', enforce: 'pre',
      transform(code, id) {
        if (id.endsWith('/components/SchoolDungeonRPG.tsx')) return code.replace('  const { C0, C1, C2, C3 } = currentTheme.colors;', '(window as any).__game={player,enemies,setMenuOpen,setShowMathChallenge,setLaunch,setGameOver,setGameClear,setPlayer,setEnemies,setMap,setFloor,setTraps,setFloorItems,handleMoveInput,handleActionBtn};\n  const { C0, C1, C2, C3 } = currentTheme.colors;');
        if (id.endsWith('/school-dungeon/useSchoolAdventure.ts')) return code.replace(' return {known:', ' const api={known:').replace('\n };\n}\nexport type', '\n };\n(window as any).__adventure=api;return api;\n}\nexport type');
        if (id.endsWith('/student/useStudentAudio.ts')) return code.replace('createStudentAudio(audioService,undefined,undefined,profile)', 'createStudentAudio(audioService,()=>((window as any).__voiceClock||0),()=>0,profile)');
      }, configureServer(s) { s.middlewares.use('/d1-audio', async (req, res) => { res.setHeader('Content-Type', 'text/html');res.end(await s.transformIndexHtml(req.url, `<html><meta name="viewport" content="width=device-width,initial-scale=1"/><body style="margin:0"><div id="root" style="height:100dvh"></div><script type="module" src="/${entry}"></script></body></html>`)); }); }
    }] });
  await server.listen();browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || '/usr/bin/chromium', args: ['--no-sandbox'] });
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });page.setDefaultTimeout(60000);page.on('dialog', dialog => dialog.accept());
  const errors = [];page.on('pageerror', error => { errors.push(error.message);console.error(error.message); });
  const base = `http://127.0.0.1:${server.httpServer.address().port}/d1-audio`;
  await page.goto(base + '?hook');await page.waitForFunction(() => window.__snapshot);
  for (let step = 1; step <= 30; step++) {
    await page.evaluate(step => { window.__voiceClock += 5000;window.__snapshot({ movement: String(step), equipment: { weapon: null, armor: null } }); }, step);
    await page.waitForTimeout(20);
  }
  assert.deepEqual(await page.evaluate(() => window.__calls), [], 'Ordinary movement and cloned equipment must not speak or play equip/selection effects');
  await page.evaluate(() => { window.__snapshot({ equipment: { weapon: { id: 'equipped-pencil' }, armor: null } }); });
  await page.waitForFunction(() => window.__calls.length > 0);
  assert.deepEqual(await page.evaluate(() => window.__calls), [['playStatusEffectSound', 'block']]);
  console.log('PASS hook: walking and cloned equipment are silent; real equipment SE remains');
  for (const hero of ['high-school-warrior', 'magic-akari']) {
  await page.goto(base);await page.getByRole('button', { name: 'New game', exact: true }).click();await page.getByRole('button', { name: 'Begin this journey', exact: true }).click();await page.locator('.d2-pixel-town').waitFor();await page.waitForFunction(() => window.__game && window.__adventure);
    await page.waitForTimeout(200);
    await page.evaluate(hero => {
      const a = window.__adventure, g = window.__game;g.setMenuOpen(false);g.setShowMathChallenge(false);g.setLaunch('PLAY');g.setGameOver(false);g.setGameClear(false);
      a.restore({ ...a.snapshot(), heroId: hero, runId: 'audio-' + hero, mode: 'BARE', place: 'DUNGEON', town: false, scene: undefined, returned: false, rescued: false, pendingStory: undefined, storySeen: [1,5,10,15,20,21], terrain: {}, events: {}, companion: null,
        chronicle: { version: 1, mode: 'BARE', heroId: hero, seen: [0,1,2], choices: {0:'release',1:'release',2:'release'} } }, 2);
      g.setFloor(2);g.setMap(Array.from({length:26},(_,y)=>Array.from({length:26},(_,x)=>x>0&&y>0&&x<25&&y<25?'FLOOR':'WALL')));
      g.setPlayer(p=>({...p,x:5,y:5,hp:1000,maxHp:1000,attack:999,dir:{x:1,y:0},status:{...p.status,poison:0}}));g.setEnemies([]);g.setTraps([]);g.setFloorItems([]);
    }, hero);
    await page.waitForFunction(hero => window.__adventure.hero.id === hero && window.__game.player.x === 5 && !window.__adventure.blocksInput(), hero).catch(async e=>{console.log(await page.evaluate(()=>({state:window.__adventure.state,panel:window.__adventure.panel,player:window.__game.player})));throw e;});
    await page.evaluate(() => { window.__calls=[]; });
    for (let step = 0; step < 20; step++) {
      await page.evaluate(dx => { window.__voiceClock += 5000;window.__game.handleMoveInput(dx,0); }, step % 2 ? -1 : 1);
      await page.waitForFunction(x => window.__game.player.x === x, step % 2 ? 5 : 6,{timeout:5000}).catch(async e=>{console.log('step',step,await page.evaluate(()=>({blocked:window.__adventure.blocksInput(),state:window.__adventure.state,panel:window.__adventure.panel,player:window.__game.player})));throw e;});
    }
    assert.equal(await page.evaluate(() => window.__calls.filter(c=>c[0].includes('VoiceFile')).length), 0, hero + ': walking should be silent');
    await page.evaluate(() => {
      window.__game.setPlayer(p=>({...p,dir:{x:1,y:0}}));window.__game.setEnemies([{id:8801,type:'ENEMY',enemyType:'SLIME',x:6,y:5,char:'s',name:'Audio test slime',hp:1,maxHp:1,baseAttack:1,baseDefense:0,attack:1,defense:0,xp:1,dir:{x:0,y:1},status:{sleep:0,confused:0,frozen:0,blind:0,speed:0,poison:0}}]);window.__calls=[];window.__voiceClock+=5000;
    });
    await page.waitForFunction(() => window.__game.enemies.length === 1);
    await page.evaluate(() => window.__game.handleActionBtn());
    await page.waitForFunction(() => window.__calls.some(c=>c[0].includes('VoiceFile')));
    const voices = await page.evaluate(() => window.__calls.filter(c=>c[0].includes('VoiceFile')));
    assert.deepEqual(voices, [hero.startsWith('magic-') ? ['playMagicVoiceFile','AKARI','spell-1'] : ['playHighSchoolVoiceFile','WARRIOR','finish-1']]);
    await page.screenshot({ path: `${out}/${hero}.png` });console.log('PASS real dungeon movement and finisher:', hero);
  }
  for (const hero of ['high-school-warrior', 'magic-akari', 'elementary-warrior', 'dungeons2-lyria']) {
    await page.goto(base + '?sceneHero=' + hero);await page.locator('.dungeon-chronicle').waitFor();
    await page.waitForTimeout(100);
    const voices = await page.evaluate(() => window.__calls.filter(c=>c[0].includes('VoiceFile')));
    assert.equal(voices.length, hero.startsWith('high-school-') || hero.startsWith('magic-') || hero.startsWith('dungeons2-') ? 0 : 1);
    assert(await page.locator('.chronicle-dialogue').innerText());
  }
  await page.goto(base + '?sceneHero=high-school-warrior&npc=1');await page.waitForFunction(() => window.__calls.some(c=>c[0]==='playDungeonChronicleVoiceFile'));
  assert((await page.evaluate(() => window.__calls)).some(c=>c[1].startsWith('npc-')&&c[2]==='reveal'));
  assert.deepEqual(errors, []);
  console.log('PASS: real WARRIOR/AKARI dungeon walking is silent, kills use the main-battle bank, cloned equipment is silent, real equip SE remains, unreferenced hero endings are skipped, NPC/elementary dialogue remains.');
} finally { await browser?.close();server?.httpServer?.closeAllConnections();await server?.close();await fs.rm(entry,{force:true}); }
