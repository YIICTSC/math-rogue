import assert from 'node:assert/strict';
import {build} from 'esbuild';
const source=await build({stdin:{contents:`export * from './src/mini-games/gakuro-kart/performance';export {KartRoom} from './src/mini-games/gakuro-kart/network';`,resolveDir:process.cwd()},bundle:true,write:false,format:'esm',platform:'node',define:{'import.meta.env':'{}'},plugins:[{name:'fake-signalling',setup(b){b.onResolve({filter:/^peerjs$/},()=>({path:'peerjs',namespace:'fake'}));b.onLoad({filter:/.*/,namespace:'fake'},()=>({contents:`export default class Peer {id='qa-peer';handlers={};constructor(){const attempt=++globalThis.peerAttempts;queueMicrotask(()=>{if(globalThis.peerHang)return;if(attempt<globalThis.peerSucceedAt)this.handlers.error?.({type:globalThis.peerError||'network'});else this.handlers.open?.();});}once(event,fn){this.handlers[event]=fn;}on(){}destroy(){globalThis.peerDestroyed++;}}` }));}}]});
const {KartConnectionHealth:H,slowConnectionHint,kartRenderProfile,KartRoom}=await import('data:text/javascript;base64,'+Buffer.from(source.outputFiles[0].text).toString('base64'));
let h=new H();for(let t=0;t<3000;t+=100){h.packet(t);assert.equal(h.sample(t,0,true),false);}
assert.equal(h.sample(4200,0,true),true);h.packet(4300);assert(h.slow,'Do not oscillate after recovery');
h=new H();for(const t of [0,400,800,1200])h.packet(t);assert(h.slow);
h=new H();h.packet(0);assert(!h.sample(600,4096,false));assert(h.sample(1600,4096,false));
h=new H();h.packet(0);h.resume(10000);assert(!h.sample(10100,0,true),'Backgrounding is not a network fault');
assert(slowConnectionHint({downlink:.7}));assert(slowConnectionHint({rtt:500}));assert(slowConnectionHint({saveData:true}));assert(!slowConnectionHint({downlink:30,rtt:30}));
assert.equal(kartRenderProfile('minimal').fps,30);assert(kartRenderProfile('minimal').maxPixels<=640*360);
globalThis.peerAttempts=0;globalThis.peerDestroyed=0;globalThis.peerSucceedAt=3;
const room=new KartRoom(()=>{},()=>{});await room.open();assert.equal(globalThis.peerAttempts,3);assert.equal(globalThis.peerDestroyed,2);
globalThis.peerAttempts=0;globalThis.peerError='browser-incompatible';globalThis.peerSucceedAt=9;
await assert.rejects(new KartRoom(()=>{},()=>{}).open(),/browser-incompatible/);assert.equal(globalThis.peerAttempts,1);
globalThis.peerHang=true;globalThis.document={removeEventListener(){}};globalThis.cancelAnimationFrame=()=>{};
const cancelled=new KartRoom(()=>{},()=>{}),waiting=cancelled.open();cancelled.close(false);await assert.rejects(waiting,/接続を終了/);assert.equal(cancelled.pending.size,0);
console.log('PASS: delayed snapshots/backlog/connection hints, independent connection diagnostics, background immunity, render budget, transient signalling retry and fatal-error stop.');
