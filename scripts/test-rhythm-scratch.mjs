import assert from 'node:assert/strict';
import { createServer } from 'vite';
import { chromium } from 'playwright';
const vite = await createServer({ optimizeDeps: {noDiscovery:true,entries:[]}, server: { host: '127.0.0.1', port: 5225 }, plugins: [{name:'scratch-test',configureServer(server){server.middlewares.use('/__scratch',(_req,res)=>res.end('<html></html>'));}}], logLevel: 'error' });
let browser;
try {
  await vite.listen();
  browser = await chromium.launch({headless:true});
  const page = await browser.newPage();
  await page.goto('http://127.0.0.1:5225/__scratch');
  const result = await page.evaluate(async () => {
    const {createScratchGraph, rhythmHitVolume} = await import('/src/rpg/rhythm/songScratch.ts');
    const context = new OfflineAudioContext(1, 48000, 48000);
    const source = context.createOscillator();
    source.frequency.value = 440;
    const graph = createScratchGraph(context, source);
    graph.output.connect(context.destination);
    source.start();
    const on = context.suspend(.25).then(() => {graph.setActive(true);return context.resume();});
    const off = context.suspend(.75).then(() => {graph.setActive(false);return context.resume();});
    const buffer = await context.startRendering();
    await Promise.all([on,off]);
    const data = buffer.getChannelData(0);
    const error = (start,end) => {
      let sum=0;
      for(let i=start*48000;i<end*48000;i++) sum += (data[i]-Math.sin(2*Math.PI*440*i/48000))**2;
      return Math.sqrt(sum/((end-start)*48000));
    };
    graph.dispose();
    return {before:error(.05,.2),during:error(.35,.65),after:error(.85,.95),peak:Math.max(...data.map(Math.abs)),volumes:[.12,.2,.61].map(rhythmHitVolume)};
  });
  assert.ok(result.before<.001, JSON.stringify(result));
  assert.ok(result.during>.5, 'Actual source waveform must change during scratch');
  assert.ok(result.after<.001, 'Release must restore the unprocessed source');
  assert.ok(result.peak<=1.01, 'Crossfade must not amplify the track');
  assert.ok(result.volumes.every(v=>v>=.5&&v<=1));
  console.log('Scratch audio passed: real source waveform changes, clean release, bounded gain, louder accents.');
} finally { await browser?.close(); await vite.close(); }
