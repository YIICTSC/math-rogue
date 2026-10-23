// Record the browser's actual Ogg playback clock (including container offsets).
import fs from 'node:fs/promises';
import crypto from 'node:crypto';
import {createServer} from 'vite';
import {chromium} from 'playwright';
const record=JSON.parse(await fs.readFile('assets/paper-plane/bridge-voice-build.json','utf8'));
let server,browser;
try{
 server=await createServer({logLevel:'error',server:{host:'127.0.0.1',port:5245,hmr:false},plugins:[{name:'voice-clock',configureServer(s){s.middlewares.use('/__voice_clock',(_req,res)=>{res.setHeader('Content-Type','text/html');res.end('<html><head><link rel="icon" href="data:,"/></head><body>Audio metadata verification</body></html>');});}}]});await server.listen();
 browser=await chromium.launch({headless:true,executablePath:process.env.CHROMIUM_PATH||await fs.access('/usr/bin/chromium').then(()=>'/usr/bin/chromium',()=>undefined),args:['--no-sandbox']});const page=await browser.newPage();await page.goto('http://127.0.0.1:5245/__voice_clock');
 const measured=await page.evaluate(async keys=>{const result={};for(let i=0;i<keys.length;i+=8)await Promise.all(keys.slice(i,i+8).map(key=>new Promise((resolve,reject)=>{const a=new Audio(),timeout=setTimeout(()=>reject(Error('Metadata timeout '+key)),15000);a.onloadedmetadata=()=>{clearTimeout(timeout);if(!Number.isFinite(a.duration)||a.duration<=0)return reject(Error('Invalid duration '+key));result[key]=Math.ceil(a.duration*1000);a.onloadedmetadata=null;a.onerror=null;a.removeAttribute('src');a.load();resolve();};a.onerror=()=>reject(Error('Decode failed '+key));a.src='/sfx/paper-plane-voices/'+key+'.ogg';})));return result;},Object.keys(record.clips));
 const clips={};for(const key of Object.keys(record.clips)){const clip=record.clips[key],sha=crypto.createHash('sha256').update(await fs.readFile(clip.output)).digest('hex');if(sha!==clip.sha256)throw Error('Stale build '+key);clips[key]={sha256:sha,browser_ms:measured[key]};}
 await fs.writeFile('assets/paper-plane/voice-playback-qa.json',JSON.stringify({browser:browser.version(),clips},null,2)+'\n');
 const path='src/data/paperPlaneBridge.ts',source=await fs.readFile(path,'utf8');await fs.writeFile(path,source.replace(/export const PAPER_VOICE_MS:Record<string,number>=\{[\s\S]*?\};/,'export const PAPER_VOICE_MS:Record<string,number>='+JSON.stringify(measured,null,2)+';'));
 console.log(JSON.stringify({browserPlaybackClocks:Object.keys(clips).length,browser:browser.version()}));
}finally{await browser?.close();await server?.close();}
