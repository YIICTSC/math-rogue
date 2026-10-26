import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
import { createServer } from 'vite';
import { chromium } from 'playwright';

const entry = `.tennis-layout-${process.pid}.tsx`;
let server, browser;
try {
  await fs.writeFile(entry, `
import React from 'react';
import {createRoot} from 'react-dom/client';
import Tennis from './src/mini-games/tennis/Tennis';
import * as E from './src/mini-games/tennis/engine';
import * as T from 'three';
import {audioService as audio} from './src/services/audioService';
import './src/styles.css';
const release=()=>{};release.update=()=>{};audio.acquireBgmScene=()=>release;audio.playSound=()=>{};
const params=new URLSearchParams(location.search),w=E.createTennis(1,true);
if(params.get('side')==='1')E.addPlayer(w,'other','Guest');
E.addPlayer(w,'local','Nagi');E.configure(w,'doubles',3);
const factory=()=>({title:'Addition',questions:[0,1,2].map(i=>({id:'q'+i,mode:'ADDITION',question:'1+1',options:['0','1','2','3'],correct:2}))});
E.startTennis(w,factory);
for(const p of Object.values(w.players))while(p.quiz){const q=p.quiz;E.command(w,p.id,{type:'answer',id:q.id,index:q.index,option:2});E.command(w,p.id,{type:'continue',id:q.id,index:q.index});}
if(params.get('side')==='1'){const m=w.matches[0];m.games=[1,0];m.phase='point';m.wait=0;E.tick(w,1/60,factory);}
window.__layoutView=E.viewFor(w,'local');window.T=T;
E.command(w,'local',{type:'swing',shot:'topspin',aim:.3,power:.7});
for(let i=0;i<12;i++)E.tick(w,1/60,factory);
window.__rallyView=E.viewFor(w,'local');
createRoot(document.getElementById('root')).render(<Tennis languageMode={params.get('lang')||'ENGLISH'} onClose={()=>{}}/>);
`);
  server = await createServer({
    logLevel: 'error', cacheDir: 'node_modules/.vite-tennis-layout',
    optimizeDeps: { noDiscovery: true, include: ['react', 'react-dom', 'react-dom/client', 'react/jsx-runtime', 'three', 'peerjs', 'lucide-react'] },
    server: { watch: null, host: '127.0.0.1', port: 0, hmr: false },
    plugins: [{
      name: 'layout-fixture', enforce: 'pre',
      transform(code, id) {
        if (id.endsWith('/tennis/Tennis.tsx')) return code.replace('useState<TennisView|null>(null)', 'useState<TennisView|null>((window as any).__layoutView)').replace('const snapshot=useRef(view);', '(window as any).__setLayoutView=setView;const snapshot=useRef(view);');
        if (id.endsWith('/tennis/TennisCanvas.tsx')) return code.replace('const camera=new T.PerspectiveCamera(43,1,.1,150);', 'const camera=new T.PerspectiveCamera(43,1,.1,150);(window as any).__courtCamera=camera;').replace('const trail=new T.Line(trailGeo,trailMat);', 'const trail=new T.Line(trailGeo,trailMat);(window as any).__ballTrail=trail;');
      },
      configureServer(s) {
        s.middlewares.use('/__layout', async (req, res) => res.end(await s.transformIndexHtml('/__layout', `<meta name="viewport" content="width=device-width,initial-scale=1"><style>html,body,#root{height:100%;margin:0}</style><div id="root"></div><script type="module" src="/${entry}"></script>`)));
      },
    }],
  });
  await server.listen();
  const base = `http://127.0.0.1:${server.httpServer.address().port}/__layout`;
  browser = await chromium.launch({ headless: true, args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  const page = await browser.newPage({ viewport: { width: 320, height: 568 } }), errors = [], geometryWarnings = [];
  page.setDefaultTimeout(90_000);
  page.on('pageerror', e => errors.push(e.message));
  page.on('console', m => { if (m.text().includes('Buffer size too small')) geometryWarnings.push(m.text()); });
  await fs.mkdir('tmp/tennis-qa', { recursive: true });
  for (const side of [0, 1]) {
    await page.goto(`${base}?side=${side}`, { waitUntil: 'domcontentloaded', timeout: 120_000 });
    await page.waitForFunction(() => document.querySelector('[data-testid=tennis-court]')?.dataset.heroes === '4');
    assert.equal(await page.evaluate(() => window.__layoutView.match.units[window.__layoutView.match.serverUnit].owner), 'local');
    // Exercise empty -> moving -> empty -> moving on the same renderer.
    for (const key of ['__rallyView', '__layoutView', '__rallyView']) {
      await page.evaluate(key => window.__setLayoutView(window[key]), key);
      await page.waitForFunction(expected => window.__ballTrail?.visible === expected && window.__ballTrail.geometry.drawRange.count === (expected ? 12 : 0), key === '__rallyView');
      const trail = await page.evaluate(() => ({ visible: window.__ballTrail.visible, capacity: window.__ballTrail.geometry.getAttribute('position').count, drawn: window.__ballTrail.geometry.drawRange.count }));
      assert(trail.capacity >= 12);
      assert.equal(trail.drawn, key === '__rallyView' ? 12 : 0);
      assert.equal(trail.visible, key === '__rallyView');
    }
    for (const [width, height] of [[320, 568], [390, 844], [844, 390], [1280, 800]]) {
      await page.setViewportSize({ width, height });
      await page.waitForTimeout(250);
      const boxes = await page.locator('.tn-shot-buttons button,.tn-match-head button').evaluateAll(nodes => nodes.map(n => ({ name: n.textContent, r: n.getBoundingClientRect().toJSON() })));
      for (const { name, r } of boxes) assert(r.x >= 0 && r.y >= 0 && r.x + r.width <= width + 1 && r.y + r.height <= height + 1, name + JSON.stringify(r));
      const feet = await page.evaluate(() => {
        const u = window.__layoutView.match.units.find(u => u.owner === 'local'), v = new window.T.Vector3(u.x, 0, u.side === 0 ? 14 : -14).project(window.__courtCamera);
        return { x: (v.x + 1) / 2 * innerWidth, y: (1 - v.y) / 2 * innerHeight };
      });
      assert(feet.x >= 0 && feet.x <= width && feet.y >= 0 && feet.y <= height - 5, `The retreating hero must remain visible on side ${side} at ${width}: ${JSON.stringify(feet)}`);
      const occlusion = await page.evaluate(() => {
        const u = window.__layoutView.match.units.find(u => u.owner === 'local'), v = new window.T.Vector3(u.x, 1.2, -u.y).project(window.__courtCamera), x = (v.x + 1) / 2 * innerWidth, y = (1 - v.y) / 2 * innerHeight;
        return [...document.querySelectorAll('.tn-stick,.tn-aim,.tn-shot-buttons')].filter(n => { const r = n.getBoundingClientRect(); return x > r.left && x < r.right && y > r.top && y < r.bottom; }).map(n => n.className);
      });
      assert.deepEqual(occlusion, [], `Controls must not hide the serving hero on side ${side} at ${width}`);
      await page.screenshot({ path: `tmp/tennis-qa/final-layout-${width}${side ? '-side1' : ''}.png` });
    }
  }
  const fallback = await browser.newPage({ viewport: { width: 390, height: 844 } });
  fallback.on('pageerror', e => errors.push(e.message));
  await fallback.addInitScript(() => {
    const context = HTMLCanvasElement.prototype.getContext, arc = CanvasRenderingContext2D.prototype.arc;
    window.__fallbackCircles = [];
    HTMLCanvasElement.prototype.getContext = function (kind, ...args) { return String(kind).includes('webgl') ? null : context.call(this, kind, ...args); };
    CanvasRenderingContext2D.prototype.arc = function (x, y, radius, ...args) {
      if (this.canvas.classList.contains('tennis-fallback') && radius === 12) window.__fallbackCircles.push({ x, y, color: this.fillStyle });
      return arc.call(this, x, y, radius, ...args);
    };
  });
  for (const side of [0, 1]) {
    await fallback.goto(`${base}?side=${side}`, { waitUntil: 'domcontentloaded', timeout: 120_000 });
    await fallback.locator('.tennis-fallback').waitFor({ timeout: 90_000 });
    await fallback.waitForFunction(() => window.__fallbackCircles.some(c => c.color === '#ffe49a'));
    const hero = await fallback.evaluate(() => window.__fallbackCircles.find(c => c.color === '#ffe49a'));
    assert(hero.y > 500 && hero.y < 600, `GPU fallback must put the serving player at the near baseline on side ${side}: ${JSON.stringify(hero)}`);
  }
  assert.deepEqual(errors, []);
  assert.deepEqual(geometryWarnings, []);
  console.log('PASS: both court sides at 320/390/844/1280, HUD bounds, visible retreating hero, clear touch controls, persistent ball trails and correctly oriented GPU fallback.');
} finally {
  await browser?.close();
  await server?.close();
  await fs.unlink(entry).catch(() => {});
}
