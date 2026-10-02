import { WebSocket } from 'ws';
import assert from 'node:assert/strict';
import { build } from 'esbuild';
import { mkdir, readFile } from 'node:fs/promises';
import { createServer } from 'node:http';
import { spawn } from 'node:child_process';
import { chromium } from 'playwright';

// Use the actual game components and network clients. Only the curriculum
// picker is replaced with a fixed lesson, keeping this test focused on hosting.
const port = 10108, clients=[];
await mkdir('tmp/host-spectator-ui', { recursive: true });
await build({stdin:{contents:"export {defaultAvatar} from './src/mini-games/gakuro-kart/avatar';",resolveDir:process.cwd()},outfile:'tmp/host-spectator-ui/avatars.mjs',bundle:true,platform:'node',format:'esm'});
const {defaultAvatar}=await import('../tmp/host-spectator-ui/avatars.mjs');
await build({ stdin: { contents: `import React from 'react';import{createRoot}from'react-dom/client';
import RpgOnline from './src/rpg/RpgOnline';import GakuroKart from './src/mini-games/gakuro-kart/GakuroKart';
import GakuroCraft from './src/mini-games/gakuro-craft/GakuroCraft';import GakuroGolf from './src/mini-games/gakuro-golf/GakuroGolf';
import{RpgRoom}from'./src/rpg/network';import{KartRoom}from'./src/mini-games/gakuro-kart/network';
import{CraftRoom}from'./src/mini-games/gakuro-craft/network';import{GolfRoom}from'./src/mini-games/gakuro-golf/network';
const classes={rpg:RpgRoom,kart:KartRoom,craft:CraftRoom,golf:GolfRoom};
for(const Room of Object.values(classes)){const create=Room.prototype.create;Room.prototype.create=async function(...args){window.hostRoom=this;return create.apply(this,args);};}
window.guestRooms=[];window.guestViews=[];window.root=createRoot(document.getElementById('root'));
window.mountGame=game=>{const Component={kart:GakuroKart,craft:GakuroCraft,golf:GakuroGolf}[game];window.root.render(game==='rpg'?<RpgOnline player={{id:'WARRIOR',currentHp:100,maxHp:100,gold:0,deck:[]}} active languageMode="JAPANESE" adventureSetup={{visualTheme:'elementary',mode:'ADDITION',answerMode:'CHOICE',difficultyLevel:1}} onRoom={()=>{}} onSnapshot={()=>{}} onSetup={()=>{}} onClose={()=>{}}/>:<Component onClose={()=>{}} languageMode="JAPANESE" allowHost/>);};
window.joinGuests=async game=>{for(let i=0;i<39;i++){const Room=classes[game];const update=w=>window.guestViews[i]=w;const r=game==='craft'?new Room(update,()=>{},()=>{}):new Room(update,()=>{});window.guestRooms.push(r);await r.join(window.hostRoom.code,'参加者'+String(i+1).padStart(2,'0')+'あいうえおかきくけこ',0);}};
window.cleanup=()=>{window.hostRoom?.close();window.guestRooms.forEach(r=>r.close());window.root.unmount();};`, loader: 'tsx', resolveDir: process.cwd() },
  outfile: 'tmp/host-spectator-ui/browser.js', bundle: true, format: 'esm',
  loader: { '.webp': 'file', '.png': 'file', '.jpg': 'file', '.svg': 'file', '.woff': 'file', '.woff2': 'file', '.ttf': 'file' },
  define: { 'import.meta.env': JSON.stringify({ VITE_ONLINE_SERVER_URL: `http://127.0.0.1:${port}` }) },
  plugins: [{ name: 'fixed-lesson', setup(b) { b.onLoad({ filter: /gakuro-(kart|craft|golf)\/LessonPicker\.tsx$/ }, () => ({ contents: `import React from 'react';export default function Picker({onSelect}){return <button onClick={()=>onSelect({mode:'ADDITION'})}>Use test lesson</button>;}`, loader: 'tsx' })); } }] });

const backend = spawn(process.execPath, ['server/dist/index.mjs'], { env: { ...process.env, PORT: String(port), ALLOWED_ORIGINS: '' }, stdio: ['ignore', 'pipe', 'pipe'] });
backend.stderr.on('data', d => process.stderr.write(d));
const web = createServer(async (req, res) => {
  const pathname = new URL(req.url, 'http://localhost').pathname;
  if (pathname === '/') { res.end('<html><head><meta name="viewport" content="width=device-width"><link rel="stylesheet" href="/browser.css"></head><body><div id="root"></div><script type="module" src="/browser.js"></script></body></html>'); return; }
  const ext = pathname.split('.').pop();
  const type = { js: 'text/javascript', css: 'text/css', webp: 'image/webp', png: 'image/png', svg: 'image/svg+xml', mp3: 'audio/mpeg' }[ext];
  if (type) res.setHeader('Content-Type', type);
  try { res.end(await readFile(`tmp/host-spectator-ui${pathname}`)); }
  catch { try { res.end(await readFile(`public${pathname}`)); } catch { res.writeHead(404); res.end(); } }
});
let browser;
try {
  await new Promise((resolve, reject) => { backend.stdout.once('data', resolve); backend.once('exit', c => reject(Error(`Server exited ${c}`))); });
  await new Promise(r => web.listen(0, '127.0.0.1', r));
  browser = await chromium.launch({ headless: true });
  for (const game of (process.env.TEST_GAMES || 'rpg,kart,craft,golf').split(',')) {
    const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
    const errors = []; page.on('pageerror', e => { errors.push(e.message); console.error(game, e.message); });
    await page.goto(`http://127.0.0.1:${web.address().port}`); await page.waitForFunction(() => window.mountGame);
    await page.evaluate(game => window.mountGame(game), game);
    const createLabel = { rpg: '部屋を作る', kart: /オンラインの部屋を作る/, craft: 'みんなの島を開く', golf: '問題を選んで部屋を作る' }[game];
    await page.getByRole('button', { name: createLabel, exact: typeof createLabel === 'string' }).click();
    if (game !== 'rpg') await page.getByRole('button', { name: 'Use test lesson' }).click();
    const roster={rpg:'.rpg-waiting-roster li:not(.rpg-waiting-empty)',kart:'.gk-roster>div',craft:'.gc-collection-roster>div',golf:'.gg-roster>span'}[game];
    await page.waitForFunction(()=>window.hostRoom?.code);
    const roomCode=await page.evaluate(()=>window.hostRoom.code), sockets=[];
    for(let i=0;i<39;i++) {const socket=new WebSocket(`ws://127.0.0.1:${port}/${game==='rpg'?'online':game}`);sockets.push(socket);clients.push(socket);await new Promise((resolve,reject)=>{const timer=setTimeout(()=>reject(Error(game+' guest '+i+' timeout')),10000);socket.once('error',reject);socket.once('open',()=>socket.send(JSON.stringify({type:'connect',protocol:1,create:false,code:roomCode,name:'参加者'+String(i+1).padStart(2,'0')+'あいうえおかきくけこ',hero:0,avatar:defaultAvatar(),profileId:'ui-guest-'+String(i).padStart(8,'0')})));socket.on('message',(raw,binary)=>{if(!binary&&JSON.parse(raw.toString()).type==='connected'){clearTimeout(timer);resolve();}});});}

    await page.waitForFunction(sel=>document.querySelectorAll(sel).length===40,roster);
    for(const size of [{width:1366,height:768},{width:1280,height:720},{width:1024,height:768}]){
      await page.setViewportSize(size);await page.waitForTimeout(150);
      const metrics=await page.locator(roster).evaluateAll(nodes=>nodes.map(n=>{const r=n.getBoundingClientRect();return {name:n.textContent,x:r.x,y:r.y,right:r.right,bottom:r.bottom,scroll:n.scrollHeight,client:n.clientHeight};}));
      assert(metrics.every(n=>n.x>=0&&n.y>=0&&n.right<=size.width&&n.bottom<=size.height&&n.scroll<=n.client+2),game+' roster overflow '+JSON.stringify(metrics.filter(n=>n.bottom>size.height||n.scroll>n.client+2)));
      const startButton=page.getByRole('button',{name:{rpg:'ゲーム開始',kart:'レースを開始 →',golf:'ラウンド開始',craft:'島に戻る'}[game],exact:true});const startBox=await startButton.boundingBox();assert(startBox&&startBox.y>=0&&startBox.y+startBox.height<=size.height,game+' start action overflow '+JSON.stringify(startBox));
      await page.screenshot({path:`tmp/host-spectator-ui/${game}-collection-${size.width}.png`});
    }
    const guest=await browser.newPage({viewport:{width:1280,height:720}});await guest.goto(`http://127.0.0.1:${web.address().port}`);await guest.waitForFunction(()=>window.mountGame);await guest.evaluate(game=>window.mountGame(game),game);
    const joinButton=guest.getByRole('button',{name:{rpg:'招待コードを入力して入室する',kart:'参加 →',craft:'島に参加',golf:'参加する'}[game],exact:true});
    const box=await joinButton.boundingBox();assert(box&&box.height>=56&&box.y>=0&&box.y+box.height<=720,game+' join button outside viewport '+JSON.stringify(box));
    await guest.screenshot({path:`tmp/host-spectator-ui/${game}-join-desktop.png`});sockets[0].terminate();await page.waitForFunction(sel=>document.querySelectorAll(sel).length===39,roster);
    await guest.getByPlaceholder({rpg:'ABC123',kart:'6文字のルームコード',craft:'ABC234',golf:'ABC234'}[game],{exact:true}).fill(roomCode);
    await joinButton.click();await guest.waitForFunction(sel=>document.querySelectorAll(sel).length===40,roster);
    const guestNames=await guest.locator(roster).evaluateAll(nodes=>nodes.map(n=>{const r=n.getBoundingClientRect();return {y:r.y,bottom:r.bottom};}));assert(guestNames.every(n=>n.y>=0&&n.bottom<=720),game+' guest roster overflow');
    await guest.screenshot({path:`tmp/host-spectator-ui/${game}-guest-collection.png`});await guest.evaluate(()=>window.cleanup());await guest.close();
    assert.deepEqual(errors,[],game+' runtime errors');
    sockets.forEach(s=>s.terminate());
    await page.evaluate(() => window.cleanup()); await page.close();
    console.log(`PASS ${game}: 40 readable names fit 3 PC viewports; large join button visible.`);
  }
} finally { clients.forEach(s=>s.terminate());await browser?.close(); await new Promise(r => web.close(r)); backend.kill(); }
