import assert from 'node:assert/strict';import vm from 'node:vm';import fs from 'node:fs/promises';
const source=await fs.readFile('public/sw.js','utf8');
for(const unavailable of [false,true]){
const handlers={},options=[];let skipped=false,claimed=false;
vm.runInNewContext(source,{self:{location:{origin:'https://test'},registration:{scope:'https://test/math-rogue/'},addEventListener:(name,handler)=>handlers[name]=handler,skipWaiting:async()=>{skipped=true},clients:{claim:async()=>{claimed=true}}},URL,caches:{keys:async()=>{throw new Error('Cache unavailable')},match:async()=>{throw new Error('Cache unavailable')},open:async()=>{if(unavailable)throw new Error('Cache unavailable');return{put:async()=>{throw new Error('QuotaExceededError')}}}},fetch:async(request,opts)=>{options.push(opts);return new Response('LATEST',{status:200})}});
for(const request of [{method:'GET',url:'https://test/math-rogue/',mode:'navigate'},{method:'GET',url:'https://test/math-rogue/assets/app.js',mode:'cors'}]){let promise;handlers.fetch({request,respondWith:p=>promise=p});assert.equal(await(await promise).text(),'LATEST');}
assert.equal(options[0].cache,'no-store');let install,activate;handlers.install({waitUntil:p=>install=p});await install;handlers.activate({waitUntil:p=>activate=p});await activate;assert(skipped&&claimed);
}
console.log('PASS: unavailable/full caches cannot block online HTML/JS, installation or activation; navigation bypasses stale HTTP cache.');
