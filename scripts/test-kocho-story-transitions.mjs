import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import { createServer } from 'vite';
import { chromium } from 'playwright';
let server,browser;
const out='tmp/kocho-qa';await fs.mkdir(out,{recursive:true});
try {
 server=await createServer({configFile:false,logLevel:'error',cacheDir:'node_modules/.vite-kocho-qa',optimizeDeps:{entries:['scripts/fixtures/kocho.tsx']},server:{host:'127.0.0.1',port:0,hmr:false},plugins:[{name:'kocho-qa',enforce:'pre',
  configureServer(s){s.middlewares.use('/kocho-test',async(req,res)=>{res.setHeader('Content-Type','text/html');res.end(await s.transformIndexHtml(req.url,'<html><meta name="viewport" content="width=device-width,initial-scale=1"><body style="margin:0"><div id="root" style="height:100dvh"></div><script type="module" src="/scripts/fixtures/kocho.tsx"></script></body></html>'));});},
  transform(source,id){if(!id.endsWith('/components/KochoShowdown.tsx'))return;return "import {flushSync as qaFlush} from 'react-dom';\n"+source.replace('    // --- MAIN RENDER ---',`    Object.assign(window,{__kocho:{state:gameState,story:storyScene,initial:getInitialState,cards:ALL_KOCHO_CARD_DB,rewards:rewardCards,pool:getUnlockedKochoCardTemplates,hydrate:hydrateState,generateRewards,execute:executeQueue,move:handleMove,special:handleSwapPosition,turn:handleTurn,wait:handleWait,consume:useConsumable,consumables:CONSUMABLE_DB,setState:(v:any)=>qaFlush(()=>{stateRef.current=v;setGameState({...v});})}});\n    // --- MAIN RENDER ---`);},
 }]});await server.listen();
 browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium',args:['--no-sandbox',...((process.env.KOCHO_VOICE_TEST||process.env.KOCHO_ENEMY_VOICE_TEST||process.env.KOCHO_SUPER_TEST||process.env.KOCHO_SUPER_AUDIO_TEST)?['--autoplay-policy=no-user-gesture-required']:[])]});

 const page=await browser.newPage({viewport:{width:844,height:390}}),errors=[];page.setDefaultTimeout(90000);page.on('pageerror',e=>errors.push(e.message));await page.goto('http://127.0.0.1:'+server.httpServer.address().port+'/kocho-test');await page.waitForFunction(()=>!!window.__kocho);
 for(const hero of ['original','rebel','akari'])for(let stage=1;stage<=8;stage++){
  await page.evaluate(({hero,stage})=>{const p=__kocho,s=p.initial(hero);p.setState({...s,phase:'BATTLE',status:stage===8?'VICTORY':'PLAYING',battleStage:stage,storySeen:[]});},{hero,stage});await page.waitForFunction(id=>__kocho.story===id,hero+'-'+stage);assert((await page.locator('.kocho-story-art').getAttribute('src')).endsWith(hero+'-'+stage+'.webp'));
  const before=await page.evaluate(()=>({pos:__kocho.state.player.pos,turn:__kocho.state.totalTurns}));await page.evaluate(()=>__kocho.move(1));assert.deepEqual(await page.evaluate(()=>({pos:__kocho.state.player.pos,turn:__kocho.state.totalTurns})),before,'Story blocks background battle actions');await page.locator('.kocho-story-screen header button').click();assert((await page.evaluate(()=>__kocho.state.storySeen)).includes(hero+'-'+stage));assert.equal(await page.locator('[data-kocho-story]').count(),0);
 }
 await page.evaluate(()=>{const s=__kocho.initial('original');__kocho.setState({...s,phase:'BATTLE',isEndless:true,battleStage:8,status:'PLAYING'});});assert.equal(await page.locator('[data-kocho-story]').count(),0,'Endless does not reopen normal endings');assert.deepEqual(errors,[]);console.log('PASS all 24 actual game-stage/story transitions, battle-input gating, per-run seen receipts and endless exclusion.');
}finally{await browser?.close();await server?.close();}
