// Audit actual synthesized releases in isolated, connected and geminated contexts.
import assert from'node:assert/strict';import fs from'node:fs/promises';import{build}from'esbuild';import{execFileSync}from'node:child_process';
const arg=process.argv.indexOf('--revision'),source=arg<0?await fs.readFile('src/rpg/residentVoiceSynth.ts','utf8'):execFileSync('git',['show',process.argv[arg+1]+':src/rpg/residentVoiceSynth.ts'],{encoding:'utf8'});
const built=await build({stdin:{contents:source,loader:'ts',resolveDir:process.cwd()+'/src/rpg'},bundle:true,write:false,platform:'node',format:'esm'});
const api=await import('data:text/javascript;base64,'+Buffer.from(built.outputFiles[0].text).toString('base64'));
const syllables=['か','き','く','け','こ','が','ぎ','ぐ','げ','ご','た','て','と','だ','で','ど','ぱ','ぴ','ぷ','ぺ','ぽ','ば','び','ぶ','べ','ぼ','ち','つ','じ','きゃ','きゅ','きょ','ぎゃ','ぎゅ','ぎょ','ちゃ','ちゅ','ちょ','じゃ','じゅ','じょ'];
syllables.push('にゃ','にゅ','にょ','ひゃ','ひゅ','ひょ','みゃ','みゅ','みょ','りゃ','りゅ','りょ','びゃ','びゅ','びょ','ぴゃ','ぴゅ','ぴょ','しゃ','しゅ','しょ','ふぁ','ふぃ','ふぇ','ふぉ','てぃ','でぃ','とぅ','どぅ','ゔぁ','ゔぃ','ゔぇ','ゔぉ');
syllables.push(...'あいうえおさしすせそざずぜぞなにぬねのはひふへほまみむめもらりるれろやゆよわをゔん');
const profiles=[['mid',1.1,1,'smooth'],['high',1.85,1.08,'playful'],['low',.8,.86,'calm'],['fast',1.3,1.3,'bouncy']];const results=[];
const rms=a=>Math.sqrt(a.reduce((n,v)=>n+v*v,0)/a.length),peak=a=>a.reduce((n,v)=>Math.max(n,Math.abs(v)),0);
for(const[name,pitch,rate,style]of profiles)for(const timbre of[0,1,2,3]){
 const effectiveRate=Math.max(.6,Math.min(1.35,rate))*(style==='calm'?.9:style==='warm'?.96:1);
 for(const context of['isolated','connected','geminated']){
  const cases=syllables.map(s=>{const pre=context==='isolated'?'':context==='connected'?'あ':'あっ';return{syllable:s,prefix:pre,text:pre+s+'あ。'};});
  // Stay below the runtime's 240-character input limit.
  for(let first=0;first<cases.length;first+=18){
  const batch=cases.slice(first,first+18);
  const units=api.residentVoiceMoras(batch.map(c=>c.text).join('')),pcm=api.renderResidentVoice(units,{enabled:true,engine:'original',pitch,rate,style,timbre,intonation:.7});let caseOffset=0;
  for(const c of batch){
   const own=api.residentVoiceMoras(c.text),pre=c.prefix?api.residentVoiceMoras(c.prefix):[],index=pre.length,start=caseOffset+pre.reduce((n,m)=>n+Math.round(22050*m.duration/effectiveRate),0),length=Math.round(22050*own[index].duration/effectiveRate);
   const release=pcm.slice(start+Math.round(22050*.012/effectiveRate),start+Math.round(22050*.06/effectiveRate));
   const body=pcm.slice(start+Math.round(length*.62),start+Math.round(length*.93));
   assert(body.length&&release.length,'Audit input was truncated');
   const consonant=own[index].consonant,plosive=/^[kgtdbp]/.test(consonant)||/^ch|^ts|^j/.test(consonant),voiced=/^[gdbzjvmnrwy]/.test(consonant),closure=plosive?(voiced?.012:.018):0;
   const burst=pcm.slice(start+Math.round(22050*closure/effectiveRate),start+Math.round(22050*(closure+.012)/effectiveRate));
   results.push({burstRms:rms(burst),burstPeak:peak(burst),profile:name,timbre,context,syllable:c.syllable,consonant:own[index].consonant,releasePeak:peak(release),releaseRms:rms(release),vowelRms:rms(body),ratio:peak(release)/Math.max(.005,rms(body))});
   caseOffset+=own.reduce((n,m)=>n+Math.round(22050*m.duration/effectiveRate),0);
  }
  }
 }
}
const out=process.argv.indexOf('--output');if(out>=0)await fs.writeFile(process.argv[out+1],JSON.stringify(results,null,2)+'\n');
const grouped=Object.entries(Object.groupBy(results,r=>r.consonant)).map(([consonant,rs])=>({consonant,releaseRms:rs.reduce((n,r)=>n+r.releaseRms,0)/rs.length,releasePeak:Math.max(...rs.map(r=>r.releasePeak))})).sort((a,b)=>b.releaseRms-a.releaseRms);console.table(grouped);console.log(results.length,'release windows audited');

if(process.argv.includes('--check')){
 const limits={t:.50,d:.40,p:.40,b:.35,ch:.30,ts:.35,j:.25,chy:.50,jy:.45,py:.45,by:.40,ky:.60,gy:.60,m:1.5,n:1.5,my:1.7,ny:1.7};
 for(const[c,limit]of Object.entries(limits)){
  const family=results.filter(r=>r.consonant===c),vowel=family.reduce((n,r)=>n+r.vowelRms,0),burst=family.reduce((n,r)=>n+r.burstRms,0);
  assert(family.length&&vowel/family.length>.015,'Missing audible vowel bodies for '+c);
  assert(burst/vowel<limit,`Consonant ${c}: onset/vowel ratio ${burst/vowel} exceeds ${limit}`);
 }
 assert(results.every(r=>[r.releasePeak,r.releaseRms,r.burstRms,r.vowelRms].every(Number.isFinite)));
 console.log('PASS broad release-level regression across all surveyed registers, timbres and contexts.');
}
