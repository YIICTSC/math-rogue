import type { ConversationVoice } from './conversationVoice';

/** Original, asset-free kana formant synthesizer. No sampled or proprietary voices. */
export interface VoiceMora { vowel: number; consonant: string; duration: number; question?: boolean }
const rows = [
  ['あいうえお',''], ['かきくけこ','k'], ['がぎぐげご','g'],
  ['さしすせそ','s'], ['ざじずぜぞ','z'], ['たちつてと','t'],
  ['だぢづでど','d'], ['なにぬねの','n'], ['はひふへほ','h'],
  ['ばびぶべぼ','b'], ['ぱぴぷぺぽ','p'], ['まみむめも','m'],
  ['らりるれろ','r'], ['やいゆえよ','y'], ['わいうえを','w'],
] as const;
const kana = new Map<string, [number, string]>();
for (const [letters, consonant] of rows) [...letters].forEach((letter, index) => {
  if (!kana.has(letter)) kana.set(letter, [index, consonant]);
});
kana.set('ゔ', [2, 'v']);
// Japanese affricates and palatal fricatives have distinct consonant spectra.
for(const [letter,vowel,consonant] of [['し',1,'sh'],['じ',1,'j'],['ち',1,'ch'],['ぢ',1,'j'],['つ',2,'ts'],['づ',2,'z'],['ふ',2,'f'],['ひ',1,'hy']] as const)kana.set(letter,[vowel,consonant]);
const small = 'ぁぃぅぇぉ';
const formants = [[800,1200,2500],[300,2300,3000],[350,1300,2400],[500,1900,2600],[500,850,2400]];

/** Unknown scripts are rejected rather than assigned invented readings. */
export function residentVoiceMoras(text: string): VoiceMora[] | null {
  const input = text.normalize('NFKC').replace(/こんにちは/g,'こんにちわ').replace(/こんばんは/g,'こんばんわ').replace(/[ァ-ヶ]/g, c => String.fromCharCode(c.charCodeAt(0) - 96));
  const result: VoiceMora[] = [];
  for (const letter of [...input].slice(0, 240)) {
    const previous = result.at(-1);
    if (/\s|[、,・「」『』（）()…：:；;]/u.test(letter)) { result.push({vowel:-1,consonant:'',duration:.09}); continue; }
    if (/[。.!！?？]/u.test(letter)) {
      if (previous && /[?？]/.test(letter)) previous.question = true;
      result.push({vowel:-1,consonant:'',duration:.22}); continue;
    }
    if (letter === 'ー' && previous && previous.vowel >= 0) { previous.duration += .13; continue; }
    if (letter === 'っ') { result.push({vowel:-1,consonant:'',duration:.075}); continue; }
    if (letter === 'ん') { result.push({vowel:2,consonant:'nasal',duration:.11}); continue; }
    const modifier = small.indexOf(letter);
    const glide = 'ゃゅょ'.indexOf(letter);
    if ((modifier >= 0 || glide >= 0) && previous && previous.vowel >= 0) {
      previous.vowel = modifier >= 0 ? modifier : [0,2,4][glide];
      if (glide >= 0) previous.consonant += 'y';
      continue;
    }
    const phoneme = kana.get(letter);
    if (!phoneme) return null;
    result.push({vowel:phoneme[0],consonant:phoneme[1],duration:.145});
  }
  return result.some(m => m.vowel >= 0) ? result : null;
}

type Resonator = {b0:number;b2:number;a1:number;a2:number;x1:number;x2:number;y1:number;y2:number};
function resonator():Resonator{return {b0:0,b2:0,a1:0,a2:0,x1:0,x2:0,y1:0,y2:0};}
function tune(r:Resonator,frequency:number,bandwidth:number,sampleRate:number){
 const f=Math.max(80,Math.min(sampleRate*.45,frequency)),omega=2*Math.PI*f/sampleRate;
 const alpha=Math.sin(omega)/(2*Math.max(.5,f/bandwidth)),a0=1+alpha;
 r.b0=alpha/a0;r.b2=-alpha/a0;r.a1=-2*Math.cos(omega)/a0;r.a2=(1-alpha)/a0;
}
function filter(r:Resonator,input:number){
 const value=r.b0*input+r.b2*r.x2-r.a1*r.y1-r.a2*r.y2;
 r.x2=r.x1;r.x1=input;r.y2=r.y1;r.y1=value;return value;
}
const unvoiced=(consonant:string)=>/^(k|p|t|s|h|f)/.test(consonant);
/** Source/filter synthesis: closures, bursts, frication, nasals and connected vowels. */
export function renderResidentVoice(moras: VoiceMora[], voice: ConversationVoice, sampleRate = 22050): Float32Array {
  const rate=Math.max(.6,Math.min(1.35,voice.rate))*(voice.style==='calm'?.9:voice.style==='warm'?.96:1);
  const units=moras.slice(0,240),sizes=units.map(m=>Math.round(sampleRate*m.duration/rate));
  const pcm=new Float32Array(sizes.reduce((a,b)=>a+b,0));
  const color=([1,1.08,.96,.90][voice.timbre]??1)*(voice.style==='warm'?.97:1);
  const expression=voice.intonation??.65,bright=voice.style==='bouncy'||voice.style==='playful';
  const vowels=[resonator(),resonator(),resonator()],friction=resonator(),nasal=resonator();
  tune(nasal,280,180,sampleRate);
  let offset=0,phase=0,seed=1471,lastPulse=0,phraseIndex=0;
  const steps=[0,2,-1,3,-2,1],openPhase=[.56,.44,.61,.68][voice.timbre]??.56;
  for(let index=0;index<units.length;index++){
    const m=units[index],length=sizes[index];
    if(m.vowel<0){offset+=length;phraseIndex=0;continue;}
    const previous=units[index-1],next=units[index+1],c=m.consonant;
    const stop=/^[kgtdbp]/.test(c)&&!/^ts|^ch/.test(c),affricate=/^ch|^ts|^j/.test(c);
    const fricative=/^s|^sh|^z|^h|^f|^v/.test(c),isNasal=/^[mn]/.test(c),syllabic=c==='nasal';
    const voicedConsonant=/^[gdbzjvmnrwy]/.test(c);
    const palatal=c.includes('y')||/^sh|^ch|^j/.test(c),labial=/^[pbmfvw]/.test(c);
    const closure=(stop||affricate?(voicedConsonant?.012:.018):c==='r'?.012:0)/rate;
    const onset=(affricate?.052:fricative?.048:isNasal?.040:c==='r'?.030:c?.036:.008)/rate;
    const burstEnd=closure+.012/rate,transition=onset+.014/rate;
    const devoiced=(m.vowel===1||m.vowel===2)&&unvoiced(c)&&(!next||next.vowel<0||unvoiced(next.consonant));
    const noiseFrequency=/^sh|^ch|^j|^hy/.test(c)?3600:/^s|^ts|^z/.test(c)?6500:/^k|^g/.test(c)?2600:labial?1200:1900;
    tune(friction,noiseFrequency,/^s|^sh|^ts|^ch/.test(c)?2200:1600,sampleRate);
    const target=formants[m.vowel],prev=previous&&previous.vowel>=0?formants[previous.vowel]:target;
    // A small stepped melody gives each mora a playful 'kero' inflection.
    // Articulation and vowel formants stay independent of the character effect.
    const depth=voice.style==='robot'?0:expression*(voice.style==='playful'?1.5:bright?1.25:voice.style==='calm'?.55:.85);
    const note=steps[phraseIndex%steps.length]*depth;
    const previousNote=phraseIndex?steps[(phraseIndex-1)%steps.length]*depth:note;
    const fundamental=165*Math.max(.65,Math.min(1.7,voice.pitch));
    const boundarySample=offset>0?pcm[offset-1]:0;
    for(let i=0;i<length;i++){
      const time=i/sampleRate,position=i/length;
      if(i%48===0){
        const blend=Math.min(1,time/transition),connected=Math.min(1,time/(.02/rate));
        const start=[180,palatal?2300:labial?800:/^[kg]/.test(c)?1700:1800,2800];
        for(let j=0;j<3;j++)tune(vowels[j],(c?start[j]*(1-blend)+target[j]*blend:prev[j]*(1-connected)+target[j]*connected)*color,110+j*95,sampleRate);
      }
      seed=(Math.imul(seed,1664525)+1013904223)|0;const noise=seed/2147483648;
      const vowelTime=Math.max(0,time-onset),glide=Math.min(1,vowelTime/(.026/rate));
      const pitchStep=previousNote+(note-previousNote)*glide;
      const kero=voice.style==='robot'?0:Math.sin(vowelTime*2*Math.PI*(voice.style==='playful'?27:bright?21:17))*.024*expression*glide;
      const f0=fundamental*Math.pow(2,pitchStep/12)*(1+kero+(m.question?Math.max(0,position-.55)*.22*expression:0));
      phase+=f0/sampleRate;const cycle=phase%1;
      const pulse=cycle<openPhase?.5*(1-Math.cos(Math.PI*cycle/openPhase)):.5*(1+Math.cos(Math.PI*(cycle-openPhase)/(1-openPhase)));
      // A band-limited buzz supplies the upper harmonics needed to hear F2/F3 clearly.
      const dt=f0/sampleRate;let buzz=2*cycle-1;
      if(cycle<dt){const t=cycle/dt;buzz-=t+t-t*t-1;}
      else if(cycle>1-dt){const t=(cycle-1)/dt;buzz-=t*t+t+t+1;}
      const excitation=(pulse-lastPulse)*sampleRate/f0*.24+buzz*.28+Math.sin(phase*2*Math.PI)*.04;
      lastPulse=pulse;
      const vowel=filter(vowels[0],excitation+noise*.014)+filter(vowels[1],excitation)*.62+filter(vowels[2],excitation)*.32;
      const nasalVoice=filter(nasal,excitation)*1.5+Math.sin(phase*2*Math.PI)*.10;
      const frictionVoice=filter(friction,noise);
      let voicedGain=c?Math.max(0,Math.min(1,(time-closure)/(onset-closure||.001))):1;
      let value=vowel*voicedGain*(devoiced?.65:1);
      if(syllabic)value=nasalVoice*.8;
      else if(isNasal){const mix=Math.max(0,1-time/onset);value=vowel*(1-mix)+nasalVoice*mix;}
      else if(stop||affricate){
        if(time<closure)value=voicedConsonant?nasalVoice*.2:0;
        else if(time<burstEnd)value+=frictionVoice*(voicedConsonant?.18:.35)*(1-(time-closure)/(burstEnd-closure));
        if(affricate&&time>=closure&&time<onset)value+=frictionVoice*.32*(1-voicedGain);
        else if(stop&&time>=burstEnd&&time<onset)value+=frictionVoice*.16*(1-voicedGain);
      }else if(fricative){
        const mix=Math.max(0,1-time/onset);
        value+=frictionVoice*(/^h/.test(c)?.20:.32)*mix;
        if(voicedConsonant)value+=nasalVoice*.16*mix;
      }else if(c==='r'&&time<closure)value*=.12;
      if(devoiced)value+=frictionVoice*.045*voicedGain;
      const attack=previous&&previous.vowel>=0?1:Math.min(1,time/.006);
      const release=next&&next.vowel>=0?1:Math.min(1,(length-i)/(sampleRate*.018));
      const blend=Math.min(1,time/.003);
      pcm[offset+i]=boundarySample*(1-blend)+value*attack*release*blend;
    }
    offset+=length;phraseIndex++;
  }
  // Remove low-frequency rumble before peak normalization so consonants stay audible.
  let previousInput=0,previousOutput=0,peak=0;
  for(let i=0;i<pcm.length;i++){const input=pcm[i],output=input-previousInput+.995*previousOutput;previousInput=input;previousOutput=output;pcm[i]=output;peak=Math.max(peak,Math.abs(output));}
  const gain=peak>0?Math.min(6,.70/peak):1;
  for(let i=0;i<pcm.length;i++)pcm[i]=Math.max(-.85,Math.min(.85,pcm[i]*gain));
  return pcm;
}

let context: AudioContext | undefined;
export function residentVoiceSupported() {
  return typeof window !== 'undefined' && !!(window.AudioContext || (window as unknown as {webkitAudioContext?: typeof AudioContext}).webkitAudioContext);
}
export function unlockResidentVoice(): AudioContext | undefined {
  if (!residentVoiceSupported()) return;
  const Constructor = window.AudioContext || (window as unknown as {webkitAudioContext: typeof AudioContext}).webkitAudioContext;
  try {
    if (!context || context.state === 'closed') context = new Constructor();
    if (context.state === 'suspended') void context.resume().catch(() => {});
    return context;
  } catch { return undefined; }
}
