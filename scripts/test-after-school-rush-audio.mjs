import assert from 'node:assert/strict';
import fs from 'node:fs';
import { execFileSync } from 'node:child_process';
import vm from 'node:vm';
import { build, transform } from 'esbuild';

const bundled = await build({ stdin: { contents: `import {CATALOG} from './src/mini-games/after-school-rush/catalog';import {soundFor,actionVoiceFor} from './src/mini-games/after-school-rush/direction';import {musicFor} from './src/mini-games/after-school-rush/music';export const rows=CATALOG.map(entry=>({key:entry.key,family:entry.game.action.family,sounds:['start','action','score','hurt','clear'].flatMap(event=>[4,5].map(index=>soundFor(entry,event,index))).filter(Boolean),voices:[4,5].map(index=>actionVoiceFor(entry,index)).filter(Boolean),music:musicFor(entry)}));`, resolveDir: process.cwd(), loader: 'ts' }, bundle: true, write: false, platform: 'node', format: 'esm', logLevel: 'silent' });
const { rows } = await import(`data:text/javascript;base64,${Buffer.from(bundled.outputFiles[0].text).toString('base64')}`);
const tracked = new Set(execFileSync('git', ['ls-tree', '-r', '--name-only', 'HEAD', 'public/sfx'], { encoding: 'utf8', maxBuffer: 8 * 1024 * 1024 }).trim().split('\n'));
const sounds = new Set(), voices = new Map();
const newFamilies = new Set(['bat','rally','soccer','golf','kart','parry','grapple','fishing','mining','volley']);
for (const row of rows) {
  assert(row.music?.type && row.music.options?.mode, row.key + ' has an explicit source soundtrack');
  for (const sound of row.sounds) { assert(tracked.has('public/' + sound.path), row.key + ': ' + sound.path); assert(sound.duration > 0 && sound.fallback); sounds.add(sound.path); }
  for (const [path, duration] of row.voices) { assert(tracked.has('public/' + path), row.key + ': ' + path); if (newFamilies.has(row.family)) voices.set(path, duration); }
}
let measured = 0;
for (const [path, duration] of voices) {
  assert(fs.existsSync('public/' + path), 'Reused voice must be locally available to verify: ' + path);
  const actual = Number(execFileSync('ffprobe', ['-v','error','-show_entries','format=duration','-of','default=nw=1:nk=1','public/' + path], {encoding:'utf8'}).trim()) * 1000;
  assert(Math.abs(actual-duration) < 60, `${path}: ${actual}ms recording, ${duration}ms playback`); measured++;
}
console.log(`PASS ${rows.length} game audio policies, ${sounds.size} existing Foley files, ${measured} actor-matched voice durations and source soundtracks.`);

// Execute the production methods against delayed media promises. A pause,
// screen exit, mute, or newer input must cancel an old pending sound.
const source = fs.readFileSync('src/services/audioService.ts','utf8');
const foley = source.slice(source.indexOf('  public prepareMiniRushFoley('), source.indexOf('  public playMiniRushVoice('));
const stop = source.slice(source.indexOf('  public stopMiniRushAudio('), source.indexOf('  public playHomeDashVoice('));
assert(foley.includes('playMiniRushFoley') && stop.includes('miniRushGeneration++'));
const code = await transform(`class Probe {${foley}\n${stop}};globalThis.Probe=Probe;`, {loader:'ts',target:'es2022'});
const context = { performance: { now: () => 100 }, MINI_RUSH_FOLEY:'mini-rush-foley', MINI_RUSH_JINGLE:'mini-rush-jingle', Probe:undefined };
vm.runInNewContext(code.code, context);
function probe(running=false) {
  const p = new context.Probe();
  Object.assign(p,{miniRushGeneration:0,sfxPlaybackGenerations:new Map(),sfxBuffers:{},ctx:{state:running?'running':'interrupted'},foregroundRecoveryPromise:null,allowed:true,events:[],pending:[],canPlaySfx(){return this.allowed;},init(){},preloadSfx(names){this.events.push(['preload',names]);return Promise.resolve();},getSfxPlaybackPaths(name){return ['sfx/'+name+'.mp3'];},startSfxSource(...args){this.events.push(['source',...args]);return true;},playHtmlSfx(...args){this.events.push(['html',...args]);return new Promise(resolve=>this.pending.push(resolve));},loadSfxBuffer(){return Promise.resolve(null);},playMiniRushCue(cue){this.events.push(['cue',cue]);},stopMiniRushVoice(){this.events.push(['stop-voice']);},stopActiveSfx(name){this.events.push(['stop',name]);}});
  return p;
}
const flush = async () => { await Promise.resolve(); await Promise.resolve(); };
const cached = probe(true); cached.sfxBuffers['golf/swing']={duration:.4}; cached.playMiniRushFoley('sfx/golf/swing.mp3',450,'shot');assert.equal(cached.events[0][0],'source');assert.equal(cached.events[0][1],'mini-rush-foley');
const ios = probe(); ios.playMiniRushFoley('sfx/golf/swing.mp3',450,'shot');assert.equal(ios.events[0][0],'html','Interrupted WebAudio uses immediate native media');ios.pending.shift()(false);await flush();assert.deepEqual(ios.events.filter(e=>e[0]==='cue'),[['cue','shot']]);
const exited = probe();exited.playMiniRushFoley('sfx/golf/swing.mp3',450,'shot');exited.stopMiniRushAudio();exited.pending.shift()(false);await flush();assert.equal(exited.events.filter(e=>e[0]==='cue').length,0);assert.equal(exited.sfxPlaybackGenerations.get('mini-rush-foley'),2);
const superseded = probe();superseded.playMiniRushFoley('sfx/golf/swing.mp3',450,'shot');superseded.playMiniRushFoley('sfx/golf/putt.mp3',300,'tap');superseded.pending.shift()(false);await flush();assert.equal(superseded.events.filter(e=>e[0]==='cue').length,0);superseded.pending.shift()(false);await flush();assert.deepEqual(superseded.events.filter(e=>e[0]==='cue'),[['cue','tap']]);
const muted = probe();muted.playMiniRushFoley('sfx/golf/swing.mp3',450,'shot');muted.allowed=false;muted.pending.shift()(false);await flush();assert.equal(muted.events.filter(e=>e[0]==='cue').length,0);muted.playMiniRushFoley('sfx/golf/putt.mp3',300,'tap');assert.equal(muted.pending.length,0);
const preload = probe();preload.prepareMiniRushFoley(['sfx/golf/swing.mp3','sfx/golf/swing.mp3']);assert.deepEqual(Array.from(preload.events[0][1]),['golf/swing']);
console.log('PASS actual Foley methods: cached output, immediate interrupted-iOS path, synth fallback, deduplication, mute, newer input and exit cancellation.');
