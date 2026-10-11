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
const small = 'ぁぃぅぇぉ';
const formants = [[800,1200,2500],[300,2300,3000],[350,1300,2400],[500,1900,2600],[500,850,2400]];

/** Unknown scripts are rejected rather than assigned invented readings. */
export function residentVoiceMoras(text: string): VoiceMora[] | null {
  const input = text.normalize('NFKC').replace(/[ァ-ヶ]/g, c => String.fromCharCode(c.charCodeAt(0) - 96));
  const result: VoiceMora[] = [];
  for (const letter of [...input].slice(0, 240)) {
    const previous = result.at(-1);
    if (/\s|[、,・「」『』（）()…：:；;]/u.test(letter)) { result.push({vowel:-1,consonant:'',duration:.09}); continue; }
    if (/[。.!！?？]/u.test(letter)) {
      if (previous && /[?？]/.test(letter)) previous.question = true;
      result.push({vowel:-1,consonant:'',duration:.22}); continue;
    }
    if (letter === 'ー' && previous && previous.vowel >= 0) { result.push({...previous,consonant:'',duration:.13}); continue; }
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
    result.push({vowel:phoneme[0],consonant:phoneme[1],duration:.125});
  }
  return result.some(m => m.vowel >= 0) ? result : null;
}

/** Render a bounded mono PCM buffer; stable noise makes a resident sound consistent. */
export function renderResidentVoice(moras: VoiceMora[], voice: ConversationVoice, sampleRate = 22050): Float32Array {
  const rate = Math.max(.6, Math.min(1.6, voice.rate)) * (voice.style === "calm" ? .9 : voice.style === "warm" ? .96 : 1);
  const units = moras.slice(0,240);
  const sizes = units.map(m => Math.round(sampleRate * m.duration / rate));
  const pcm = new Float32Array(sizes.reduce((a,b) => a+b,0));
  const color = ([1,1.18,.87,.72][voice.timbre] ?? 1) * (voice.style === "warm" ? .94 : 1);
  const expression = voice.intonation ?? .65;
  let offset = 0, phase = 0, seed = 1471;
  units.forEach((m,index) => {
    const length = sizes[index];
    if (m.vowel < 0) { offset += length; return; }
    const bright = voice.style === 'bouncy' || voice.style === 'playful';
    const contour = voice.style === 'robot' ? 0 : expression * (Math.sin(index * (bright ? 1.8 : .65)) * (bright ? .15 : .065));
    const fundamental = 165 * voice.pitch * (1 + contour);
    const frequencies = formants[m.vowel];
    const harmonics = Array.from({length:Math.min(40, Math.floor(sampleRate / 2 / (fundamental * 1.2)))},(_,h) => {
      const frequency = (h+1)*fundamental;
      return frequencies.reduce((sum,f,j) => sum + Math.exp(-.5*((frequency-f*color)/(90+j*55))**2)/(1+j*.45), .015)/(h+1)**.65;
    });
    const normalizer = harmonics.reduce((a,b)=>a+b,0) || 1;
    for (let i=0;i<length;i++) {
      const time = i/sampleRate, position = i/length;
      phase += 2*Math.PI*fundamental*(1 + (m.question ? position*.18*expression : 0))/sampleRate;
      const onset = m.consonant ? .027 : .008;
      let voiced = 0;
      for(let h=0;h<harmonics.length;h++) voiced += Math.sin(phase*(h+1))*harmonics[h];
      voiced /= normalizer;
      seed = (Math.imul(seed,1664525)+1013904223) | 0;
      const noise = seed/2147483648;
      const fricative = /^[szhfv]/.test(m.consonant);
      const nasal = /^[mn]/.test(m.consonant);
      const attack = Math.min(1,time/onset);
      const envelope = Math.min(1,time/.006,(length-i)/(sampleRate*.015));
      let value = voiced * attack;
      if (time < onset && fricative) value += noise * .32 * (1-attack);
      else if(time < .008 && /^[ktpgdb]/.test(m.consonant)) value += noise*.22*(1-time/.008);
      if(nasal) value = value*.5 + Math.sin(phase)*.25;
      if(m.consonant.includes('y') && time < .035) value *= .75;
      pcm[offset+i] = Math.max(-.85,Math.min(.85,value*envelope*.6));
    }
    offset += length;
  });
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
