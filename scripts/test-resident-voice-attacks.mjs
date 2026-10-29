import assert from 'node:assert/strict';
import{build}from'esbuild';
const r=await build({entryPoints:['src/rpg/residentVoiceSynth.ts'],bundle:true,write:false,platform:'node',format:'esm'});
const{residentVoiceMoras,renderResidentVoice}=await import('data:text/javascript;base64,'+Buffer.from(r.outputFiles[0].text).toString('base64'));
const prefix='こんにちは。りんごをたべよう。あなたのおはなしを';
const units=residentVoiceMoras(prefix+'きかせてね。');
const voice={enabled:true,engine:'original',pitch:1.1,rate:1,style:'playful',timbre:0,intonation:.7};
const pcm=renderResidentVoice(units,voice),sr=22050;
const rms=x=>Math.sqrt(x.reduce((sum,v)=>sum+v*v,0)/x.length);
let offset=residentVoiceMoras(prefix).reduce((n,m)=>n+Math.round(m.duration*sr),0);
// The user-reviewed sample had release peaks .238 / .186. Preserve the vowels
// while preventing the same sharp attacks from returning in "きかせて".
for(const [n,limit,minimumVowel]of [[0,.205,.11],[1,.12,.03]]){
 const release=pcm.slice(offset+Math.round(.018*sr),offset+Math.round(.046*sr));
 const body=pcm.slice(offset+Math.round(.075*sr),offset+Math.round(.13*sr));
 const peak=Math.max(...release.map(Math.abs));
 assert(peak<limit,`Velar release ${n}: ${peak} exceeds ${limit}`);
 assert(rms(body)>minimumVowel,`Vowel ${n} became too quiet`);
 offset+=Math.round(units[residentVoiceMoras(prefix).length+n].duration*sr);
}
console.log('PASS softened ki/ka release peaks in the reviewed phrase, with audible sustained vowels.');
