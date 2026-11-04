import assert from 'node:assert/strict';
import {readFile,mkdir} from 'node:fs/promises';
import {spawn} from 'node:child_process';
import {createServer as netServer} from 'node:net';
import {createServer} from 'vite';
import {chromium} from 'playwright';
let server,browser,backend;
const errors=[],out='tmp/online-rpg-entry';
const freePort=()=>new Promise(resolve=>{const s=netServer();s.listen(0,'127.0.0.1',()=>{const p=s.address().port;s.close(()=>resolve(p));});});
try{
 await mkdir(out,{recursive:true});const port=await freePort();
 backend=spawn(process.execPath,['server/dist/index.mjs'],{env:{...process.env,PORT:String(port)},stdio:['ignore','pipe','inherit']});
 await new Promise((resolve,reject)=>{const timer=setTimeout(()=>reject(Error('Server startup timeout')),30000);backend.stdout.once('data',()=>{clearTimeout(timer);resolve();});backend.once('error',reject);});
 server=await createServer({cacheDir:'node_modules/.vite-rpg-entry-isolation',logLevel:'error',optimizeDeps:{entries:['index.html']},define:{'import.meta.env.VITE_ENABLE_DEBUG_FEATURES':'"true"','import.meta.env.VITE_ONLINE_SERVER_URL':JSON.stringify(`ws://127.0.0.1:${port}`)},server:{host:'127.0.0.1',port:0,hmr:false,watch:null},plugins:[{name:'rpg-entry-isolation',enforce:'pre',async load(id){if(!id.endsWith('/src/App.tsx'))return;const source=await readFile(id,'utf8'),at=source.lastIndexOf('\n    return (');assert(at>0);return source.slice(0,at)+`
 (window as any).__rpgEntry={state:gameState,room:rpgRoomRef.current,snapshot:rpgSnapshotRef.current,
 start:()=>launchNewAdventure(visualTheme,true),character:()=>handleCharacterSelect(themedCharacters[0]),
 exit:returnToTitle,lose:resolveBattleDefeat,recover:handleRpgDefeatChallengeComplete,mainSave:()=>storageService.loadGame(),starter:()=>storageService.hasSkippedFirstStarterRelic(),
 seedMain:()=>{const next={...gameState,screen:GameScreen.START_MENU,rpgOnline:undefined,act:3,floor:19,isEndless:false,challengeMode:undefined,player:{...gameState.player,gold:777,deck:[{...gameState.player.deck[0],id:'main-sentinel-card'}]}};storageService.saveGame({...next,screen:GameScreen.MAP});setGameState(next);},
 changeRpg:()=>setGameState(prev=>({...prev,player:{...prev.player,gold:9,deck:[{...prev.player.deck[0],id:'rpg-sentinel-card'}]}}))};
 `+source.slice(at);}}]});
 await server.listen();const base=`http://127.0.0.1:${server.httpServer.address().port}`;
 browser=await chromium.launch({headless:true});
 const ctx=await browser.newContext({viewport:{width:390,height:844},hasTouch:true});ctx.setDefaultTimeout(90000);
 await ctx.addInitScript(()=>{try{localStorage.setItem('pixel_spire_language_mode_v1','JAPANESE');localStorage.setItem('pixel_spire_seen_battle_tutorial_v1','true');localStorage.setItem('pixel_spire_seen_parry_tutorial_v1','true');}catch{}});
 ctx.on('page',p=>p.on('pageerror',e=>{errors.push(e.message);console.log('PAGE ERROR',e.message);}));
 const host=await ctx.newPage();await host.goto(base,{waitUntil:'domcontentloaded',timeout:120000});
 await host.getByRole('button',{name:'小学5年生',exact:true}).click();await host.getByRole('button',{name:'あとで決める',exact:true}).last().click();
 console.log('App ready');await host.waitForFunction(()=>window.__rpgEntry);await host.evaluate(()=>window.__rpgEntry.seedMain());console.log('SEEDED',await host.evaluate(()=>({gold:window.__rpgEntry.state.player.gold,screen:window.__rpgEntry.state.screen})));await host.waitForFunction(()=>window.__rpgEntry.state.player.gold===777);
 const main=await host.evaluate(()=>({player:window.__rpgEntry.state.player,floor:window.__rpgEntry.state.floor,act:window.__rpgEntry.state.act,save:window.__rpgEntry.mainSave(),starter:window.__rpgEntry.starter()}));
 await host.evaluate(()=>window.__rpgEntry.start());await host.locator('.rpg-entry-form').waitFor();
 assert.equal(await host.evaluate(()=>window.__rpgEntry.state.player.deck.some(c=>c.id==='main-sentinel-card')),false);
 await host.getByRole('button',{name:'部屋を作る',exact:true}).click();await host.getByLabel('冒険者の名前',{exact:true}).fill('Host');
 await host.getByRole('button',{name:/サーバー通信.*beta/}).click();await host.screenshot({path:`${out}/host-entry.png`});
 await host.getByRole('button',{name:'オンラインの部屋を作る',exact:true}).click();await host.waitForFunction(()=>window.__rpgEntry.state.screen==='CHARACTER_SELECTION'&&window.__rpgEntry.snapshot?.world.players[window.__rpgEntry.snapshot.selfId]?.name==='Host');
 await host.evaluate(()=>window.__rpgEntry.character());await host.getByRole('button',{name:'ゲーム開始',exact:true}).waitFor();assert(await host.getByRole('button',{name:'ゲーム開始',exact:true}).isEnabled());
 assert.equal(await host.evaluate(()=>window.__rpgEntry.starter()),main.starter,'RPG selection must not consume the main starter relic flag');
 const code=await host.evaluate(()=>window.__rpgEntry.room.code);await host.getByRole('button',{name:'ゲーム開始',exact:true}).click();await host.waitForFunction(()=>window.__rpgEntry.snapshot?.world.started);
 const guestContext=await browser.newContext({viewport:{width:390,height:844},hasTouch:true});guestContext.setDefaultTimeout(90000);await guestContext.addInitScript(()=>{try{localStorage.setItem('pixel_spire_language_mode_v1','JAPANESE');}catch{}});guestContext.on('page',p=>p.on('pageerror',e=>errors.push(e.message)));
 const guest=await guestContext.newPage();await guest.goto(base+'/?rpgRoom='+code,{waitUntil:'domcontentloaded',timeout:120000});
 await guest.locator('[data-invite-entry]').waitFor();assert.equal(await guest.getByLabel('参加名',{exact:true}).inputValue(),'');await guest.screenshot({path:`${out}/join-name-first.png`});await guest.getByLabel('参加名',{exact:true}).fill('Late adventurer');await guest.locator('.online-invite-submit').click();
 await guest.waitForFunction(()=>window.__rpgEntry.state.screen==='CHARACTER_SELECTION'&&window.__rpgEntry.snapshot?.world.players[window.__rpgEntry.snapshot.selfId]?.name==='Late adventurer');await guest.screenshot({path:`${out}/joined-character-selection.png`});
 await guest.evaluate(()=>window.__rpgEntry.character());await guest.waitForFunction(()=>window.__rpgEntry.state.screen==='MAP'&&window.__rpgEntry.snapshot?.world.started);await guest.locator('.rpg-map-container').first().waitFor({state:'visible'});
 for(const [width,height]of [[390,844],[844,390]]){await guest.setViewportSize({width,height});await guest.screenshot({path:`${out}/late-map-${width}.png`});}
 assert.equal(await host.evaluate(()=>Object.keys(window.__rpgEntry.snapshot.world.players).length),2);
 await host.evaluate(()=>window.__rpgEntry.lose());await host.waitForFunction(()=>window.__rpgEntry.state.screen==='RPG_DEFEAT_CHALLENGE');await host.evaluate(()=>window.__rpgEntry.recover());await host.waitForFunction(()=>window.__rpgEntry.state.screen==='MAP');
 await host.evaluate(()=>window.__rpgEntry.changeRpg());await host.waitForFunction(()=>window.__rpgEntry.state.player.gold===9);await host.evaluate(()=>window.__rpgEntry.exit());await host.waitForFunction(()=>!window.__rpgEntry.state.rpgOnline);
 const restored=await host.evaluate(()=>({player:window.__rpgEntry.state.player,floor:window.__rpgEntry.state.floor,act:window.__rpgEntry.state.act,save:window.__rpgEntry.mainSave()}));
 assert.deepEqual(restored.player,main.player);assert.equal(restored.floor,19);assert.equal(restored.act,3);assert.deepEqual(restored.save,main.save);assert.deepEqual(errors,[]);
 console.log('PASS: actual App admits a name before character selection, solo host starts, active-game guest enters, portrait/landscape maps render, RPG inventory and main save remain independent.');
}catch(e){console.log('RPG diagnostics',errors);if(browser)for(const [i,p]of browser.contexts().flatMap(c=>c.pages()).entries()){console.log('STATE',i,await p.evaluate(()=>({gold:window.__rpgEntry?.state.player.gold,screen:window.__rpgEntry?.state.screen,rpg:window.__rpgEntry?.state.rpgOnline})));console.log('PAGE',i,(await p.locator('body').innerText()).slice(0,2000));await p.screenshot({path:`${out}/failure-${i}.png`}).catch(()=>{});}throw e;}finally{await browser?.close();await server?.close();backend?.kill();}
