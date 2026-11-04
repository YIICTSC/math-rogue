import assert from 'node:assert/strict';
import {writeFile, unlink} from 'node:fs/promises';
import {createServer} from 'vite';
import {chromium} from 'playwright';

const fixture = `.rest-long-card-${process.pid}.tsx`;
let server, browser;
try {
  await writeFile(fixture, `import React from 'react'; import {createRoot} from 'react-dom/client'; import RestScreen from './src/components/RestScreen'; import './src/styles.css';
const params=new URLSearchParams(location.search), lang=params.get('lang')||'JAPANESE';
const name=lang==='ENGLISH'?'ExtraordinarilyLongUnbrokenCardName'.repeat(18):'とても長い合成カードの名前'.repeat(50);
const card={id:'test-long-card',name,description:'6ダメージ。',cost:1,type:'ATTACK',rarity:'BASIC',damage:6};
const player={id:'WARRIOR',currentHp:80,maxHp:80,deck:[card],relics:[]}; window.__leaves=0;window.__upgrades=0;
createRoot(document.getElementById('root')).render(<div style={{height:'100dvh',width:'100%'}}><RestScreen player={player} languageMode={lang} scienceRoomChance={0} onRest={()=>{}} onUpgrade={()=>window.__upgrades++} onSynthesize={()=>card} onSelfStudy={()=>{}} onLeave={()=>window.__leaves++}/></div>);`);
  server = await createServer({configFile:false, logLevel:'error', cacheDir:'node_modules/.vite-rest-long-card', optimizeDeps:{noDiscovery:true, include:['react','react-dom','react-dom/client','react/jsx-runtime','react/jsx-dev-runtime','lucide-react']}, server:{host:'127.0.0.1',port:0,hmr:false}, plugins:[{name:'rest-fixture',configureServer(v){v.middlewares.use('/__rest-long',(_req,res)=>{res.setHeader('Content-Type','text/html');res.end(`<meta name="viewport" content="width=device-width,initial-scale=1"><div id="root"></div><script type="module" src="/${fixture}"></script>`);});}}]});
  await server.listen(); browser=await chromium.launch({headless:true});
  for (const [width,height,lang] of [[390,844,'JAPANESE'],[844,390,'JAPANESE'],[320,568,'ENGLISH'],[568,320,'ENGLISH']]) {
    const page=await browser.newPage({viewport:{width,height},isMobile:true,hasTouch:true}); page.on('pageerror',e=>console.error('PAGE ERROR',e));page.on('console',m=>{if(m.type()==='error')console.error('CONSOLE',m.text())});
    await page.goto(`http://127.0.0.1:${server.httpServer.address().port}/__rest-long?lang=${lang}`);
    await page.locator('.rest-choice-grid button').filter({hasText:lang==='ENGLISH'?'Upgrade':'図工室'}).click();
    await page.locator('[data-rest-mode="UPGRADE"] [role="button"]').first().click();
    await page.locator('.rest-upgrade-actions button').first().click();
    await page.locator('[data-rest-mode="DONE"]').waitFor();
    const button=page.locator('[data-rest-mode="DONE"] .rest-panel > button');
    const rect=await button.boundingBox(); assert(rect && rect.x>=0 && rect.y>=0 && rect.x+rect.width<=width && rect.y+rect.height<=height, `Departure button outside ${width}x${height}: ${JSON.stringify(rect)}`);
    assert.equal(await page.evaluate(()=>window.__upgrades),1);
    await button.tap(); assert.equal(await page.evaluate(()=>window.__leaves),1, 'Departure must work after upgrade');
    const message=await page.locator('.rest-message').evaluate(el=>({scroll:el.scrollHeight,client:el.clientHeight,width:el.scrollWidth,clientWidth:el.clientWidth}));
    assert(message.scroll>message.client, 'Long message remains scrollable'); assert(message.width<=message.clientWidth+1,'Long names must wrap within message');
    await page.close();
  }
  console.log('PASS long upgraded card names: portrait and landscape, Japanese and English; departure remains tappable.');
} finally { await browser?.close(); await server?.close(); await unlink(fixture).catch(()=>{}); }
