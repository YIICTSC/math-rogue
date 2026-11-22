import { createServer } from 'vite';
import { chromium, webkit } from 'playwright';
import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
const file = '.material-sound-fixture.tsx';
const scratch = await fs.mkdtemp((await import('node:os')).tmpdir() + '/traditional-sound-');
const screenshots = process.env.TRADITIONAL_SCREENSHOT_DIR || scratch;
await fs.mkdir(screenshots, { recursive: true });
await fs.writeFile(
  file,
  `
import React,{useState} from 'react';
import {createRoot} from 'react-dom/client';
import {audioService} from './src/services/audioService';
import {TableBoard} from './src/mini-games/traditional-games/Boards';
import {applyTableAction,createTable,tableViewFor} from './src/mini-games/traditional-games/engine';
import {useTableVoice} from './src/mini-games/shared/useTableVoice';
import {CARD_CLUB_VOICE_HEROES} from './src/data/cardClubVoices';
import {resolveShot} from './src/mini-games/traditional-games/crokinole';
import './src/mini-games/traditional-games/traditionalGames.css';
const audio=audioService as any;
const test=window as any;test.audio=audio;test.impacts=[];test.starts=[];test.native=[];
const original=audio.playTraditionalSound.bind(audio);
audio.playTraditionalSound=(material,strength)=>{test.impacts.push({material,strength,at:performance.now()});return original(material,strength)};
const start=audio.startSfxSource.bind(audio);
audio.startSfxSource=(name,buffer,max,overlap,gain=1,...rest)=>{const ok=start(name,buffer,max,overlap,gain,...rest);if(ok)test.starts.push({name,gain,at:performance.now()});return ok};
const play=HTMLMediaElement.prototype.play;
HTMLMediaElement.prototype.play=function(){test.native.push({src:this.src,volume:this.volume});return play.call(this)};
const players=CARD_CLUB_VOICE_HEROES.slice(0,4).map((hero,i)=>({hero,id:String(i),name:'Player '+i,cpu:true}));
let revision=0;
let peeper=null;
function App(){const [ready,setReady]=useState(false),[view,setView]=useState<any>(null);
const current=view?.game==='peeper'?view:null;
useTableVoice(current?{...current,hero:current.players[current.self].hero,start:'table-start'}:null);
return <main className="traditional-tables">
<button onClick={()=>{audio.init();if(audio.isMuted)audio.toggleMute();audio.setSfxVolume(.6);Promise.all([audio.preloadTraditionalSounds(),audio.unlockAudio()]).then(()=>setReady(true))}}>Enable sound</button>
<output>{ready?'ready':'loading'}</output>
<button disabled={!ready} onClick={()=>{const s=createTable('goita',players,1);s.revision=++revision;s.event={key:'attack',seat:0};setView(tableViewFor(s,0))}}>Bamboo pair</button>
<button disabled={!ready} onClick={()=>{const s=createTable('crokinole',players.slice(0,2),1);const shot={type:'shot',angle:0,aim:0,power:.56};s.revision=++revision;s.turn=0;s.lastShot={before:[{id:90,seat:1,x:0,y:.5}],shot,seat:0,discId:s.revision};s.discs=resolveShot(s.lastShot.before,0,2,shot,s.revision).board;setView(tableViewFor(s,0))}}>Colliding shot</button>
<button disabled={!ready} onClick={()=>{
  peeper=createTable('peeper',players,1);peeper.turn=0;peeper.hands=[[0,34],[1,2,35],[3,36],[60]];
  setView(tableViewFor(peeper,0));
}}>Open Peeper</button>
<button disabled={!peeper} onClick={()=>{
  applyTableAction(peeper,0,{type:'tiles',tiles:[0]});
  applyTableAction(peeper,1,{type:'mine'});
  applyTableAction(peeper,2,{type:'return'});
  setView(tableViewFor(peeper,0));
}}>Show interrupt chain</button>
<button onClick={()=>setView(null)}>Leave table</button>
<button disabled={!ready} onClick={()=>{for(const key of Object.keys(audio.sfxBuffers))if(key.startsWith('traditional-table/wood-'))delete audio.sfxBuffers[key];audio.playTraditionalSound('wood',.2)}}>Native soft hit</button>
{view && <TableBoard view={view} language="ENGLISH" send={()=>{}}/>}</main>}
createRoot(document.getElementById('root')!).render(<React.StrictMode><App/></React.StrictMode>);
`,
);
const vite = await createServer({
  cacheDir: scratch + '/vite',
  logLevel: 'error',
  server: { host: '127.0.0.1', port: 0, hmr: false },
  optimizeDeps: {
    noDiscovery: true,
    include: [
      'react',
      'react-dom/client',
      'react/jsx-runtime',
      'peerjs',
      'three',
      'lucide-react',
      '@capacitor/core',
    ],
  },
  plugins: [
    {
      name: 'pull-fixture',
      configureServer(s) {
        s.middlewares.use('/material-qa', async (req, res) => {
          res.setHeader('Content-Type', 'text/html');
          res.end(
            await s.transformIndexHtml(
              '/material-qa',
              `<html><head><meta name="viewport" content="width=device-width,initial-scale=1"/></head><body style="margin:0"><div id="root" style="height:100dvh;position:relative"></div><script type="module" src="/${file}"></script></body></html>`,
            ),
          );
        });
      },
    },
  ],
});
let browser;
try {
  await vite.listen();
  browser = process.env.PLAYWRIGHT_WEBKIT_EXECUTABLE
    ? await webkit.launch({ executablePath: process.env.PLAYWRIGHT_WEBKIT_EXECUTABLE })
    : await chromium.launch({
        executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE || '/usr/bin/chromium',
        args: ['--no-sandbox'],
      });
  const page = await browser.newPage({ viewport: { width: 844, height: 390 }, hasTouch: true });
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto('http://127.0.0.1:' + vite.httpServer.address().port + '/material-qa');
  await page.getByRole('button', { name: 'Enable sound', exact: true }).click();
  await page.waitForFunction(() => document.querySelector('output').textContent === 'ready');
  assert.equal(
    await page.evaluate(
      () =>
        Object.keys(window.audio.sfxBuffers).filter((k) => k.startsWith('traditional-table/'))
          .length,
    ),
    24,
  );
  await page.getByRole('button', { name: 'Bamboo pair', exact: true }).click();
  await page.waitForFunction(
    () => window.starts.filter((x) => x.name.includes('/bamboo-')).length === 2,
  );
  assert.equal(
    await page.evaluate(() => window.impacts.filter((x) => x.material === 'bamboo').length),
    2,
    'StrictMode must not duplicate taps',
  );
  const starts = await page.evaluate(() =>
    window.starts.filter((x) => x.name.includes('/bamboo-')),
  );
  assert(
    starts[1].at - starts[0].at >= 35,
    'cover and attack should be distinct taps ' + JSON.stringify(starts),
  );
  await page.getByRole('button', { name: 'Leave table', exact: true }).click();
  await page.evaluate(() => {
    window.impacts = [];
    window.starts = [];
  });
  await page.getByRole('button', { name: 'Colliding shot', exact: true }).click();
  await page.waitForFunction(() => window.starts.some((x) => x.name.includes('/wood-')));
  const contacts = await page.evaluate(() => window.impacts);
  assert(contacts.some((c) => c.material === 'flick'));
  const first = contacts.find((c) => c.material === 'flick'),
    hit = contacts.find((c) => c.material === 'wood');
  assert(hit.at - first.at >= 30, 'wood impact must follow visible travel');
  await page.getByRole('button', { name: 'Leave table', exact: true }).click();
  assert.equal(
    await page.evaluate(
      () =>
        [...window.audio.activeSfxSources.keys()].filter((k) => k.startsWith('traditional-table/'))
          .length,
    ),
    0,
  );
  await page.evaluate(() => {
    window.audio.setSfxVolume(0);
    window.starts = [];
    window.native = [];
    window.audio.playTraditionalSound('wood', 1);
  });
  await page.waitForTimeout(80);
  assert.equal(
    await page.evaluate(() => window.starts.length + window.native.length),
    0,
    'muting prevents both playback paths',
  );
  await page.evaluate(() => window.audio.setSfxVolume(0.6));
  await page.getByRole('button', { name: 'Native soft hit', exact: true }).click();
  await page.waitForFunction(() =>
    window.native.some((x) => x.src.includes('/traditional-table/wood-') && x.src.endsWith('.mp3')),
  );
  const native = await page.evaluate(() =>
    window.native.filter(
      (x) => x.src.includes('/traditional-table/wood-') && x.src.endsWith('.mp3'),
    ),
  );
  assert(
    native.every((c) => c.volume > 0 && c.volume < 0.3),
    'HTML fallback preserves soft-contact gain',
  );
  await page.getByRole('button', { name: 'Open Peeper' }).click();
  await page.getByRole('button', { name: 'Show interrupt chain' }).click();
  await page.waitForFunction(() =>
    window.native.some((x) => x.src.includes('/table-declarations/high-school-assassin/return.mp3')),
  );
  const spoken = await page.evaluate(() =>
    window.native
      .map((x) => new URL(x.src).pathname)
      .filter((path) => path.includes('/table-declarations/')),
  );
  assert.deepEqual(spoken, [
    '/sfx/table-declarations/high-school-caretaker/mine.mp3',
    '/sfx/table-declarations/high-school-assassin/return.mp3',
  ]);
  await page.getByRole('button', { name: 'Leave table' }).click();
  assert.deepEqual(errors, []);
  console.log(
    'PASS 24 decoded samples, two bamboo taps under StrictMode, collision-timed wood audio, exit cancellation, mute, and HTMLAudio gain.',
  );
} finally {
  await browser?.close();
  await vite.close();
  await fs.rm(file, { force: true });
}
