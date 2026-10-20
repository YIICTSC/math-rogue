import assert from 'node:assert/strict';
import { build } from 'esbuild';
import { createServer } from 'node:http';
import { chromium } from 'playwright';

const source = `import React from 'react';import {createRoot} from 'react-dom/client';import QuizPanel from './src/mini-games/gakuro-golf/QuizPanel';
const root=createRoot(document.getElementById('app'));window.commands=[];
window.renderQuiz=(index=0,disabled=false,answer=null)=>{const question={id:'q'+index,mode:'ADDITION',question:'1+1=?',options:['2','3','4','5'],correct:0};window.currentQuiz={shotId:'shot',index,question,answer,selected:answer===null?null:1};root.render(React.createElement(QuizPanel,{quiz:window.currentQuiz,languageMode:'JAPANESE',disabled,send:c=>{window.commands.push(c);if(c.type==='answer')window.renderQuiz(index,disabled,0);}}));};window.renderQuiz();`;
const bundle = await build({ stdin: { contents: source, resolveDir: process.cwd() }, bundle: true, write: false, format: 'esm', loader: { '.css': 'empty' }, define: { 'import.meta.env': JSON.stringify({ BASE_URL: '/', VITE_APP_PLATFORM: 'web' }), '__APP_ASSET_VERSION__': '"test"' } });
const fixture = createServer((req, res) => {
  res.setHeader('Content-Type', req.url === '/bundle.js' ? 'text/javascript' : 'text/html');
  res.end(req.url === '/bundle.js' ? bundle.outputFiles[0].text : '<div id="app"></div><script type="module" src="/bundle.js"></script>');
});
await new Promise(resolve => fixture.listen(0, '127.0.0.1', resolve));
const browser = await chromium.launch({ channel: process.env.PLAYWRIGHT_CHANNEL || (process.platform === 'darwin' ? 'chrome' : undefined) });
try {
  const page = await browser.newPage(); page.on('pageerror', error => console.error(error)); await page.goto(`http://127.0.0.1:${fixture.address().port}`);
  await page.locator('.gg-options button').first().waitFor();
  // Freeze the feedback timer so assertions cannot race the 850 ms advance.
  await page.clock.install();
  for (let index = 0; index < 3; index++) {
    if (index) { await page.evaluate(i => window.renderQuiz(i), index); await page.locator('.gg-options button:enabled').first().waitFor(); }
    await page.locator('.gg-options button').nth(index === 1 ? 1 : 0).click();
    await page.waitForFunction(() => window.currentQuiz.answer !== null);
    assert.equal(await page.getByRole('button', { name: '次へ', exact: true }).count(), 0);
    assert.equal(await page.locator('.gg-options button:enabled').count(), 0);
    await page.clock.fastForward(900);
    assert.equal(await page.evaluate(i => window.commands.filter(c => c.type === 'continue' && c.index === i).length, index), 1);
    await page.clock.fastForward(1500);
    assert.equal(await page.evaluate(i => window.commands.filter(c => c.type === 'continue' && c.index === i).length, index), 1, 'advance is sent once');
  }
  await page.evaluate(() => { window.commands=[];window.renderQuiz(0,true,0); });
  await page.clock.fastForward(2000);
  assert.equal(await page.evaluate(() => window.commands.length), 0, 'paused feedback must not advance');
  await page.evaluate(() => window.renderQuiz(0,false,0));
  await page.clock.fastForward(900);
  assert.equal(await page.evaluate(() => window.commands.filter(c=>c.type==='continue').length), 1, 'resuming advances automatically');
  console.log('PASS: golf has no Next button; correct and wrong answers advance once after feedback; pausing/resuming is respected.');
} finally { await browser.close(); await new Promise(resolve => fixture.close(resolve)); }
