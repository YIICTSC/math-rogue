// Original deterministic percussion/scratch samples. No third-party samples.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {execFileSync} from 'node:child_process';
const rate=44100, lengths=[.19,.16,.1,.22], names=['Kick','Snare','Hi-hat','Scratch'];
const dir=fs.mkdtempSync(path.join(os.tmpdir(),'rhythm-pads-'));
try {
  for(let lane=0;lane<4;lane++){
    const count=Math.round(rate*lengths[lane]),samples=new Float64Array(count);
    let seed=81723+lane,phase=0,low=0,previous=0;
    for(let i=0;i<count;i++){
      const t=i/rate;seed=(Math.imul(seed,1664525)+1013904223)>>>0;
      const noise=seed/2147483648-1;low+=.12*(noise-low);
      const high=noise-low,fade=Math.min(1,t/.0015,(lengths[lane]-t)/.008);
      if(lane===0){phase+=2*Math.PI*(48+130*Math.exp(-t*55))/rate;samples[i]=(Math.sin(phase)*Math.exp(-t*20)+high*.1*Math.exp(-t*200))*fade;}
      if(lane===1)samples[i]=(high*.72*Math.exp(-t*32)+Math.sin(2*Math.PI*185*t)*.28*Math.exp(-t*42))*fade;
      if(lane===2)samples[i]=(high*.66+Math.sign(Math.sin(2*Math.PI*7100*t))*Math.sign(Math.sin(2*Math.PI*5300*t))*.15)*Math.exp(-t*65)*fade;
      if(lane===3){const sweep=Math.sin(t/lengths[lane]*Math.PI*4),frequency=550+1550*Math.abs(sweep);phase+=2*Math.PI*frequency/rate;const grain=low-previous;previous=low;samples[i]=(Math.sin(phase)*.26+grain*2.7+high*.19)*(0.22+.78*Math.abs(sweep))*Math.exp(-t*3)*fade;}
    }
    const peak=samples.reduce((a,b)=>Math.max(a,Math.abs(b)),0),wav=Buffer.alloc(44+count*2);
    wav.write('RIFF');wav.writeUInt32LE(wav.length-8,4);wav.write('WAVEfmt ',8);wav.writeUInt32LE(16,16);wav.writeUInt16LE(1,20);wav.writeUInt16LE(1,22);wav.writeUInt32LE(rate,24);wav.writeUInt32LE(rate*2,28);wav.writeUInt16LE(2,32);wav.writeUInt16LE(16,34);wav.write('data',36);wav.writeUInt32LE(count*2,40);
    for(let i=0;i<count;i++)wav.writeInt16LE(Math.round(samples[i]/peak*.55*32767),44+i*2);
    const input=path.join(dir,`${lane}.wav`);fs.writeFileSync(input,wav);
    for(const [root,extension,codec] of [['sfx','mp3','libmp3lame'],['web-audio/sfx','ogg','libopus']]){
      const output=`public/${root}/rpg-games/note-${lane}.${extension}`;
      execFileSync('ffmpeg',['-v','error','-y','-i',input,'-c:a',codec,'-b:a','96k','-metadata',`title=Learning Rogue ${names[lane]}`,output]);
    }
  }
  console.log('Generated kick, snare, hi-hat and scratch: mono MP3 + Opus.');
} finally {fs.rmSync(dir,{recursive:true,force:true});}
