import fs from 'node:fs/promises';
import {existsSync} from 'node:fs';
import assert from 'node:assert/strict';
import {createServer} from 'vite';
import {chromium} from 'playwright';

const output='tmp/point-exchange-qa';await fs.mkdir(output,{recursive:true});
const manifest=JSON.parse(await fs.readFile('src/mini-games/lantern-war/voiceManifest.json'));
const catalog=JSON.parse(await fs.readFile('src/point-exchange/voiceCatalog.json'));
const cases=[['aster','君の剣は王座ではなく、帰り道を指すんだね。'],['end-vesper','[banter-reply:thanks]']].map(([actor,text])=>{
 const voice=manifest[actor+'\n'+text],clip=catalog.find(c=>c.id===voice?.id);
 assert(clip?.path.includes('/banter/')&&clip.actor===actor);return clip;
});
let server,browser;
try{
 server=await createServer({configFile:false,cacheDir:'node_modules/.vite-point-exchange',optimizeDeps:{noDiscovery:true,include:['react','react-dom','react-dom/client','react/jsx-runtime','react/jsx-dev-runtime','lucide-react']},logLevel:'error',server:{host:'127.0.0.1',port:0,hmr:false,watch:null},plugins:[{name:'theater-banter-qa',configureServer(s){s.middlewares.use('/theater-banter-test',async(req,res)=>{res.setHeader('Content-Type','text/html');res.end(await s.transformIndexHtml('/theater-banter-test','<html><meta name="viewport" content="width=device-width,initial-scale=1"><div id="root"></div><script type="module" src="/scripts/fixtures/point-exchange.tsx"></script>'));});}}]});
 await server.listen();browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||(existsSync('/usr/bin/chromium')?'/usr/bin/chromium':undefined),args:['--no-sandbox']});
 const context=await browser.newContext({viewport:{width:1280,height:800},hasTouch:true}),page=await context.newPage(),errors=[],requests=[];
 page.setDefaultTimeout(90000);page.on('pageerror',e=>errors.push(e.message));page.on('response',r=>{if(r.url().includes('/sfx/lantern-war/banter/')){requests.push(r.url());if(![200,206].includes(r.status()))errors.push('Voice HTTP '+r.status());}});
 const url='http://127.0.0.1:'+server.httpServer.address().port+'/theater-banter-test?real-voice';
 await page.goto(url,{waitUntil:'domcontentloaded',timeout:90000});
 await page.evaluate(async()=>{
  const {changePoints}=await import('/src/point-exchange/store.ts');await changePoints(s=>{s.earned+=10000;return true;});
  const {audioService:a}=await import('/src/services/audioService.ts');a.init();a.setVoiceVolume(1);if(a.isMuted)a.toggleMute();
 });
 await page.getByRole('button',{name:/ポイント交換/}).click();await page.getByRole('button',{name:'ボイスシアター',exact:true}).click();await page.getByRole('button',{name:'ボイスシアターを解禁',exact:true}).click();
 for(const clip of cases){
  await page.getByLabel('話す人物',{exact:true}).selectOption(clip.actor);await page.getByLabel('ボイスのゲーム',{exact:true}).selectOption('継界戦記');
  await page.getByLabel('収録セリフを検索',{exact:true}).fill(clip.text);
  const select=page.getByLabel('ゲーム内の収録セリフ',{exact:true});await select.selectOption(clip.id);
  assert.equal(await page.getByLabel('字幕を編集',{exact:true}).inputValue(),clip.text);
  await page.getByLabel('セリフの後の間（秒）',{exact:true}).fill('0');
  await page.getByRole('button',{name:'この行を試聴',exact:true}).click();
  await page.waitForFunction(id=>window.__pointVoiceResults.some(r=>r.id===id&&r.ok),clip.id);
  assert(requests.some(path=>path.includes(clip.path)),'Preview must load the actual shipped recording');
  await page.getByRole('button',{name:'停止',exact:true}).click();
  await page.getByLabel('収録セリフを検索',{exact:true}).fill('');
 }
 await page.getByLabel('作品名',{exact:true}).fill('戦記の追加ボイス');await page.getByRole('button',{name:'作品を保存',exact:true}).click();await page.getByText('作品を保存しました',{exact:true}).waitFor();
 await page.waitForFunction(async id=>(await import('/src/point-exchange/store.ts')).readPoints().draft?.lines[0].voice===id,cases.at(-1).id);
 await page.setViewportSize({width:390,height:844});await page.getByLabel('ゲーム内の収録セリフ',{exact:true}).scrollIntoViewIfNeeded();await page.screenshot({path:output+'/banter-selected-390.png'});
 await page.goto(url,{waitUntil:'domcontentloaded'});await page.getByRole('button',{name:/ポイント交換/}).click();await page.getByRole('button',{name:'ボイスシアター',exact:true}).click();
 assert.equal(await page.getByLabel('ゲーム内の収録セリフ',{exact:true}).inputValue(),cases.at(-1).id);
 assert.equal(await page.getByLabel('字幕を編集',{exact:true}).inputValue(),cases.at(-1).text);
 assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);assert.deepEqual(errors,[]);
 console.log('PASS new full dialogue and short replies: speaker/game/text selection, matching captions, real audio playback, saved voice IDs and portrait layout.');
}finally{await browser?.close();await server?.close();}
