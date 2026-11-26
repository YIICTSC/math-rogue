import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { once } from 'node:events';
import { spawn } from 'node:child_process';
import { createServer as freeServer } from 'node:net';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { setTimeout as delay } from 'node:timers/promises';
import { chromium } from 'playwright';
import { createServer } from 'vite';

const output=await mkdtemp(join(tmpdir(),'secret-mission-browser-'));
console.log('Screenshots',output);
const network=freeServer();network.listen(0,'127.0.0.1');await once(network,'listening');
const port=network.address().port;await new Promise(resolve=>network.close(resolve));
const child=spawn(process.execPath,['--preserve-symlinks-main','server/dist/index.mjs'],{env:{...process.env,PORT:String(port),ALLOWED_ORIGINS:''},stdio:['ignore','pipe','inherit']});
let vite,browser;
const baseURL='http://127.0.0.1:'+port;
const errors=[];
try{
  for(let i=0;i<80;i++){
    if(await fetch(baseURL+'/health').then(r=>r.ok).catch(()=>false))break;
    await delay(100);
  }
  vite=await createServer({
    configFile:false,cacheDir:join(output,'vite'),logLevel:'error',
    optimizeDeps:{entries:['scripts/fixtures/secret-mission.tsx']},
    define:{'import.meta.env.VITE_ONLINE_SERVER_URL':JSON.stringify(baseURL)},
    server:{host:'127.0.0.1',port:0,hmr:false,watch:null},
    plugins:[{
      name:'secret-mission-test',
      configureServer(server){
        server.middlewares.use('/mission-test',async(_req,res)=>{
          res.setHeader('Content-Type','text/html');
          res.end(await server.transformIndexHtml('/mission-test',
            '<meta name="viewport" content="width=device-width,initial-scale=1"><style>body{margin:0}#root{height:100dvh}</style><div id="root"></div><script type="module" src="/scripts/fixtures/secret-mission.tsx"></script>'));
        });
      },
    }],
  });
  await vite.listen();
  const url='http://127.0.0.1:'+vite.httpServer.address().port+'/mission-test';
  const executablePath=process.env.CHROMIUM_PATH??(existsSync('/usr/bin/chromium')?'/usr/bin/chromium':undefined);
  browser=await chromium.launch({executablePath,args:['--no-sandbox','--use-angle=swiftshader','--enable-unsafe-swiftshader','--disable-dev-shm-usage']});
  const makePage=async options=>{
    const page=await browser.newPage(options);
    await page.addInitScript(()=>localStorage.setItem('gakuro-secret-mission-quality','low'));
    page.setDefaultTimeout(26000);page.on('pageerror',error=>errors.push(error.message));
    await page.route(/^https?:\/\/(?!127\.0\.0\.1)/,route=>route.abort());
    return page;
  };
  const button=(page,name)=>page.getByRole('button',{name,exact:true});
  const go=async page=>{
    await page.goto(url,{waitUntil:'domcontentloaded'});
    await button(page,'学習ローグ SECRET MISSION').waitFor();
    assert.equal(await button(page,'ステルスミッション').count(),1);
    await button(page,'学習ローグ SECRET MISSION').click();
    await page.locator('[data-secret-mission]').waitFor();
  };
  const fit=async(page,selector)=>{
    const box=await page.locator(selector).boundingBox();
    const size=page.viewportSize();
    assert(box&&box.x>=-.5&&box.y>=-.5&&box.x+box.width<=size.width+.5&&box.y+box.height<=size.height+.5,selector+' fits the viewport');
  };

  const portrait=await makePage({viewport:{width:390,height:844},hasTouch:true,deviceScaleFactor:1});
  await go(portrait);
  await fit(portrait,'.sm-title-actions');
  await portrait.locator('.sm-cover .sm-renderer canvas').waitFor();
  await portrait.screenshot({path:join(output,'title-portrait.png')});
  await button(portrait,'CPUで練習').tap();
  await portrait.getByRole('combobox',{name:/マップ/}).selectOption('magic');
  await button(portrait,'練習を始める').tap();
  await portrait.getByRole('dialog',{name:'役職発表'}).waitFor();
  await portrait.locator('[data-secret-phase="field"] .sm-renderer canvas').waitFor({timeout:20000});
  assert.equal(await portrait.locator('.sm-fallback').count(),0,'Real WebGL must render in Chromium');
  const player=portrait.locator('.sm-actor-label.is-self');
  await player.waitFor();
  await fit(portrait,'.sm-actions');await fit(portrait,'.sm-stick');
  const heading=await player.getAttribute('style');
  const stick=await portrait.getByRole('group',{name:'移動スティック'}).boundingBox();
  await portrait.mouse.move(stick.x+stick.width/2,stick.y+stick.height/2);
  await portrait.mouse.down();
  await portrait.mouse.move(stick.x+stick.width*.84,stick.y+stick.height*.48);
  await delay(480);
  await portrait.mouse.up();
  assert.notEqual(await player.getAttribute('style'),heading,'Joystick moves the visible character');
  await portrait.screenshot({path:join(output,'practice-portrait.png')});
  await portrait.setViewportSize({width:844,height:390});
  await fit(portrait,'.sm-actions');await fit(portrait,'.sm-stick');
  await portrait.screenshot({path:join(output,'practice-landscape.png')});
  await button(portrait,'地図を開く').tap();
  await portrait.getByRole('dialog',{name:'施設マップ'}).waitFor();
  await fit(portrait,'.sm-panel');
  await portrait.screenshot({path:join(output,'map-landscape.png')});
  await portrait.close();
  console.log('PASS real VR title, offline practice, WebGL, movement stick, mobile landscape and map');

  const host=await makePage({viewport:{width:1000,height:700},acceptDownloads:true});
  const guest=await makePage({viewport:{width:844,height:390},hasTouch:true});
  let guestView;
  guest.on('websocket',socket=>{
    if(!socket.url().endsWith('/secret-mission'))return;
    socket.on('framereceived',event=>{
      try{
        const p=JSON.parse(String(event.payload));
        if(p.type!=='view')return;
        if(p.full)guestView=p.full;
        else if(guestView){guestView={...guestView,...p.patch};for(const key of p.remove??[])delete guestView[key];}
      }catch{}
    });
  });
  await go(host);
  await button(host,'オンラインの部屋を作る').click();
  await host.getByLabel('参加名').fill('先生');
  await host.getByLabel('対戦の種類').selectOption('classroom');
  await button(host,'部屋を作る').click();
  await host.locator('.sm-code').waitFor();
  await button(host,'対戦設定').click();
  await host.getByLabel('CPUで補う人数').fill('5');
  await host.getByLabel('シャボンの再使用（秒）').fill('70');
  await button(host,'設定を適用').click();
  await button(host,'問題を作る').click();
  await host.getByLabel('問題文',{exact:true}).fill('2 + 3 = ?');
  await host.getByLabel('正解',{exact:true}).fill('5');
  for(const [i,v] of ['3','4','6'].entries())await host.getByLabel('誤答候補 '+(i+1)).fill(v);
  await button(host,'この問題セットを使う').click();
  await host.getByText('クラスの問題',{exact:true}).waitFor();
  const link=await host.getByLabel('招待URL').inputValue();
  assert(/vrRoom=\d{6}&vrMode=secret-mission/.test(link));
  await guest.goto(link);
  await guest.getByLabel('参加名').fill('見習い');
  await button(guest,'参加する').tap();
  await button(guest,'準備完了').tap();
  await button(host,'作戦を開始').click();
  await guest.locator('[data-secret-phase="field"] .sm-renderer canvas').waitFor({timeout:19000});
  assert(guestView?.role);
  assert(guestView?.settings.mode==='classroom'&&!guestView.reports);
  const id=guestView.who;
  guestView=undefined;
  await guest.bringToFront();
  await guest.reload({waitUntil:'domcontentloaded'});
  await guest.locator('[data-secret-phase="field"]').waitFor({state:'attached',timeout:32000});
  assert.equal(guestView?.who,id);
  await button(host,'進行').click();
  await host.getByRole('dialog',{name:'進行管理'}).waitFor();
  await host.getByText('クラス全体',{exact:false}).waitFor();
  await button(host,'会議を開く').click();
  await guest.getByRole('dialog',{name:'緊急会議'}).waitFor();
  await guest.screenshot({path:join(output,'meeting-landscape.png')});
  await button(guest,'定型文を送る').tap();
  await host.getByRole('list',{name:'会議の発言'}).getByText('見習い',{exact:true}).waitFor();
  await host.getByRole('dialog',{name:'緊急会議'}).waitFor();
  assert.equal(await guest.getByRole('button',{name:'CSVを保存'}).count(),0);
  await button(host,'進行管理').click();
  host.once('dialog',dialog=>dialog.accept());
  await button(host,'対戦を終了').click();
  await guest.getByRole('dialog',{name:'対戦結果'}).waitFor();
  const pendingCsv=host.waitForEvent('download');
  await button(host,'CSVを保存').click();
  const csv=await pendingCsv;
  assert.equal(csv.suggestedFilename(),'secret-mission-class.csv');
  assert((await readFile(await csv.path(),'utf8')).includes('見習い'));
  await button(host,'同じ設定でロビーへ').click();
  await guest.getByRole('heading',{name:'作戦室'}).waitFor();
  assert.deepEqual(errors,[]);
  console.log('PASS online invite, teacher-created questions, classroom, reload reconnection, meeting, private CSV and rematch');
}catch(error){
  for(const context of browser?.contexts()??[])for(const page of context.pages())console.log('Screen',page.url(),(await page.locator('body').innerText().catch(()=>'' )).slice(0,1500));
  console.log('Browser errors',errors);throw error;
}finally{
  await browser?.close();await vite?.close();if(child.exitCode===null&&child.signalCode===null){child.kill('SIGTERM');await once(child,'exit');}
  await rm(join(output,'vite'),{recursive:true,force:true});
}
