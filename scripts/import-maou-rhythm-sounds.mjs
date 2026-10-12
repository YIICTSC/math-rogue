// Maou.audio percussion, adapted for four rhythm lanes. See docs/licenses/maou-rhythm.md.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {execFileSync} from 'node:child_process';
const rate=44100,dir=fs.mkdtempSync(path.join(os.tmpdir(),'maou-rhythm-'));
const pads=[['kick','drum2_kick',.24],['snare','drum2_snare',.2],['cymbal','drum2_cymbal',.55],['scratch','drum2_hat',.28]];
try{
 for(const [pad,source,duration] of pads){
  const url=`https://maou.audio/sound/se/maou_se_inst_${source}.wav`,input=path.join(dir,`${source}.wav`);
  execFileSync('curl',['--fail','--location','--silent','--show-error','--referer',`https://maou.audio/se_inst_${source}/`,url,'--output',input]);
  const raw=execFileSync('ffmpeg',['-v','error','-i',input,'-af','silenceremove=start_periods=1:start_duration=0:start_threshold=-55dB','-ac','1','-ar',String(rate),'-f','f32le','pipe:1'],{maxBuffer:16*1024*1024});
  const original=Array.from({length:raw.length/4},(_,i)=>raw.readFloatLE(i*4)),count=Math.round(rate*duration),samples=new Float64Array(count);
  if(!original.length)throw new Error(`Empty sample: ${source}`);
  for(let i=0;i<count;i++){
   const t=i/rate;
   if(pad==='scratch'){
    // Four forward/backward record movements, entirely from the supplied hi-hat.
    const stroke=t/.07,position=(stroke%1),ping=Math.floor(stroke)%2?1-position:position;
    const index=Math.min(original.length-1,ping*Math.min(original.length-1,rate*.095));
    const lower=Math.floor(index),mix=index-lower;
    samples[i]=(original[lower]*(1-mix)+(original[Math.min(lower+1,original.length-1)]||0)*mix)*(.22+.78*Math.sin(position*Math.PI));
   }else samples[i]=original[i]||0;
   samples[i]*=Math.min(1,t/.001,(duration-t)/.015);
  }
  const peak=samples.reduce((a,b)=>Math.max(a,Math.abs(b)),0);if(!peak)throw new Error(`Silent sample: ${source}`);
  const wav=Buffer.alloc(44+count*2);wav.write('RIFF');wav.writeUInt32LE(wav.length-8,4);wav.write('WAVEfmt ',8);wav.writeUInt32LE(16,16);wav.writeUInt16LE(1,20);wav.writeUInt16LE(1,22);wav.writeUInt32LE(rate,24);wav.writeUInt32LE(rate*2,28);wav.writeUInt16LE(2,32);wav.writeUInt16LE(16,34);wav.write('data',36);wav.writeUInt32LE(count*2,40);
  for(let i=0;i<count;i++)wav.writeInt16LE(Math.round(samples[i]/peak*.55*32767),44+i*2);
  const adapted=path.join(dir,`${pad}.wav`);fs.writeFileSync(adapted,wav);
  for(const [root,extension,codec]of[['sfx','mp3','libmp3lame'],['web-audio/sfx','ogg','libopus']]){
   execFileSync('ffmpeg',['-v','error','-y','-i',adapted,'-c:a',codec,'-b:a','96k','-metadata','artist=Maou Damashii / Koichi Morita','-metadata',`comment=Source: ${url}; adapted for Learning Rogue`,`public/${root}/rpg-games/maou-rhythm-${pad}.${extension}`]);
  }
  console.log(`Imported ${pad}: ${source}`);
 }
}finally{fs.rmSync(dir,{recursive:true,force:true});}
