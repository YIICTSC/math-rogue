import { createServer } from 'vite';
import { chromium, webkit } from 'playwright';
import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
import { tmpdir } from 'node:os';

const file = '.flight-result-fixture.tsx';
const scratch = await fs.mkdtemp(tmpdir() + '/flight-results-');
const useWebkit = process.argv.includes('--webkit');
await fs.writeFile(
  file,
  `
 import React from 'react';
 import {createRoot} from 'react-dom/client';
 import FlightSchool from './src/mini-games/flight-school/FlightSchool';
 import {GameMode} from './src/types';
 import {audioService} from './src/services/audioService';
 import './src/styles.css';
 audioService.playBGM = async () => {};
 createRoot(document.getElementById('root')!).render(
   <React.StrictMode>
     <FlightSchool onBack={() => {}} languageMode="JAPANESE" problemMode={GameMode.MIXED}/>
   </React.StrictMode>
 );
`,
);
const vite = await createServer({
  cacheDir: scratch + '/vite',
  logLevel: 'error',
  optimizeDeps: {
    noDiscovery: true,
    include: [
      'react',
      'react-dom/client',
      'react/jsx-runtime',
      'three',
      'lucide-react',
      '@capacitor/core',
    ],
  },
  server: { host: '127.0.0.1', port: 0, hmr: false },
  plugins: [
    {
      name: 'qa-only',
      enforce: 'pre',
      transform(code, id) {
        // Observe the real deck's completion before React removes its controls.
        if (id.endsWith('/flight-school/FlightDeck.tsx')) {
          return code
            .replace(
              'callbacks.current = { onRadio, onRadioStop, onPatrolLost };',
              'callbacks.current = { onRadio, onRadioStop, onPatrolLost }; (window as any).__flightQA = { flight: s, patrol };',
            )
            .replace(
              'done.current(s.result);',
              "(window as any).__flightEndQA = Array.from(document.querySelectorAll('.fs-deck button')).filter(e => e.hasPointerCapture(1)).length; done.current(s.result);",
            );
        }
        // This regression concerns the flight/result transition. Advance past
        // ground school without changing the deck, radio or debrief components.
        if (id.endsWith('/components/MiniGameProblemChallenge.tsx'))
          return `import React from 'react';export default function Problem({onComplete}){return <button onClick={onComplete}>QA 座学終了</button>}`;
      },
      configureServer(server) {
        server.middlewares.use('/flight-result-qa', async (req, res) => {
          res.setHeader('Content-Type', 'text/html');
          res.end(
            await server.transformIndexHtml(
              '/flight-result-qa',
              `<html><head><link rel="icon" href="data:,"/><meta name="viewport" content="width=device-width,initial-scale=1"/></head><body style="margin:0"><div id="root" style="height:100dvh;position:relative;overflow:hidden"></div><script type="module" src="/${file}"></script></body></html>`,
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
  browser = useWebkit
    ? await webkit.launch({
        executablePath: process.env.PLAYWRIGHT_WEBKIT_EXECUTABLE || webkit.executablePath(),
      })
    : await chromium.launch({
        executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE || '/usr/bin/chromium',
        args: ['--no-sandbox', '--enable-unsafe-swiftshader'],
      });
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    hasTouch: true,
    isMobile: true,
  });
  const page = await context.newPage();
  page.setDefaultTimeout(35000);
  page.on('pageerror', (e) => console.error('PAGE ERROR', e.message));
  page.on('console', (m) => {
    if (m.type() === 'error') console.error('CONSOLE', m.text().slice(0, 300));
  });
  await page.goto('http://127.0.0.1:' + vite.httpServer.address().port + '/flight-result-qa');
  // WebKit can omit the compatibility click while another finger is held.
  const pressWithoutClick = (name) =>
    page.getByRole('button', { name, exact: true }).dispatchEvent('pointerdown', {
      pointerType: 'touch',
      pointerId: 7,
      button: 0,
      isPrimary: false,
    });
  await page.getByRole('button', { name: '空港間フライト', exact: false }).tap();
  await page.getByRole('button', { name: '座学と技能検定', exact: true }).tap();
  await page.getByRole('button', { name: 'QA 座学終了' }).tap();
  await page.locator('.fs-deck').waitFor();

  await page.waitForTimeout(800);
  const held = await page.locator('.fs-ctl[data-flight-control="primary"]').boundingBox();
  await page.mouse.move(held.x + held.width / 2, held.y + held.height / 2);
  await page.mouse.down();
  await page.mouse.move(held.x + held.width / 2 + 1, held.y + held.height / 2);
  assert.equal(
    await page
      .locator('.fs-ctl[data-flight-control="primary"]')
      .evaluate((e) => e.hasPointerCapture(1)),
    true,
  );
  await page.evaluate(() => {
    window.__flightQA.flight.result = {
      reason: 'landed',
      medal: 'gold',
      score: 98,
      rings: 40,
      precision: 30,
      handling: 28,
      distance: 3,
      sink: 1,
      time: 168,
    };
  });
  await page.getByText('到着しました', { exact: true }).waitFor();

  assert.equal(
    await page.evaluate(() => window.__flightEndQA),
    0,
    'Flight controls must release captures before showing results',
  );
  await page.mouse.up();
  await pressWithoutClick('折り返し便へ');
  await page.getByRole('button', { name: '座学と技能検定', exact: true }).waitFor();
  console.log('PASS return planning button');
  await page.getByRole('button', { name: '座学と技能検定', exact: true }).tap();
  await page.getByRole('button', { name: 'QA 座学終了' }).tap();
  await page.locator('.fs-deck').waitFor();
  await page.waitForTimeout(800);
  await page.evaluate(() => {
    window.__flightQA.flight.result = {
      reason: 'landed',
      medal: 'gold',
      score: 98,
      rings: 40,
      precision: 30,
      handling: 28,
      distance: 3,
      sink: 1,
      time: 168,
    };
  });
  await page.getByText('到着しました', { exact: true }).waitFor();
  await pressWithoutClick('もう一度飛ぶ');
  await page.getByRole('button', { name: 'QA 座学終了' }).waitFor();
  console.log('PASS fly again button');
  await page.reload();
  await page.getByRole('button', { name: '戦闘訓練', exact: true }).tap();
  await page.getByRole('button', { name: '座学と技能検定', exact: true }).tap();
  await page.getByRole('button', { name: 'QA 座学終了' }).tap();
  await page.locator('.fs-deck').waitFor();
  await page.waitForTimeout(800);
  await page.evaluate(() => {
    window.__flightQA.patrol.sortie.finished = 'clear';
    window.__flightQA.flight.result = {
      reason: 'landed',
      medal: 'gold',
      score: 90,
      rings: 40,
      precision: 30,
      handling: 20,
      distance: 3,
      sink: 1,
      time: 168,
    };
  });
  await page.getByText('任務達成', { exact: true }).waitFor();
  await pressWithoutClick('課目選択へ');
  await page.getByRole('button', { name: '座学と技能検定', exact: true }).waitFor();
  console.log('PASS combat mission select button');
  await page.getByRole('button', { name: '座学と技能検定', exact: true }).tap();
  await page.getByRole('button', { name: 'QA 座学終了' }).tap();
  await page.locator('.fs-deck').waitFor();
  await page.waitForTimeout(800);
  await page.evaluate(() => {
    window.__flightQA.patrol.sortie.finished = 'clear';
    window.__flightQA.flight.result = {
      reason: 'landed',
      medal: 'gold',
      score: 90,
      rings: 40,
      precision: 30,
      handling: 20,
      distance: 3,
      sink: 1,
      time: 168,
    };
  });
  await page.getByText('任務達成', { exact: true }).waitFor();
  await pressWithoutClick('再挑戦');
  await page.getByRole('button', { name: 'QA 座学終了' }).waitFor();
  console.log('PASS combat retry button');
  for (const retry of [false, true]) {
    await page.reload();
    await page.getByRole('button', { name: '軽飛行機', exact: true }).tap();
    await page.getByRole('button', { name: '座学と技能検定', exact: true }).tap();
    await page.getByRole('button', { name: 'QA 座学終了' }).tap();
    await page.locator('.fs-deck').waitFor();
    await page.waitForFunction(() => window.__flightQA?.flight?.lesson?.aircraft === 'plane');
    await page.evaluate(() => {
      window.__flightQA.flight.result = {
        reason: 'landed',
        medal: 'gold',
        score: 85,
        rings: 40,
        precision: 23,
        handling: 22,
        distance: 23,
        time: 77,
        sink: 1,
      };
    });
    const btn = page.getByRole('button', {
      name: retry ? '同じ課目でもう一度' : '別の空港・種目へ',
      exact: true,
    });
    await btn.waitFor();
    // Secondary touch while the original flying finger is still on the glass:
    // browsers may deliver pointerdown/up without synthesizing click.
    await btn.dispatchEvent('pointerdown', {
      pointerType: 'touch',
      pointerId: 7,
      button: 0,
      isPrimary: false,
    });
    await page
      .getByRole('button', { name: retry ? 'QA 座学終了' : '座学と技能検定', exact: true })
      .waitFor();
  }
  console.log('PASS light-plane touch retry and course selection without a synthetic click.');
  await page.evaluate(() => {
    localStorage.setItem(
      'learning-rogue:flight-school:sorties:v1',
      JSON.stringify(
        Object.fromEntries(
          ['intercept', 'duel', 'base', 'escort', 'sprint', 'flagship'].map((id) => [
            'SDJ/' + id + '/exam',
            85,
          ]),
        ),
      ),
    );
  });
  await page.reload();
  await page.getByRole('button', { name: '飛行日誌', exact: true }).tap();
  await page.getByText('100%', { exact: true }).waitFor();
  await page.getByRole('button', { name: '格納庫', exact: true }).tap();
  await page.getByRole('button', { name: '戦闘訓練', exact: true }).tap();
  await page.getByRole('button', { name: '大阪湾・海上発艦', exact: true }).tap();
  await page.getByLabel('搭乗機').selectOption('f14');
  await page.getByRole('button', { name: '座学と技能検定', exact: true }).tap();
  await page.getByRole('button', { name: 'QA 座学終了' }).tap();
  await page.waitForFunction(
    () => window.__flightQA?.flight.lesson.carrier && window.__flightQA?.patrol.tomcat,
  );
  assert.equal(await page.locator('.fs-cover').count(), 0);
  console.log('PASS legacy log unlocks and carrier deck launch with selected F-14.');
} finally {
  await browser?.close();
  await vite.close();
  await fs.unlink(file).catch(() => {});
  await fs.rm(scratch, { recursive: true, force: true });
}
