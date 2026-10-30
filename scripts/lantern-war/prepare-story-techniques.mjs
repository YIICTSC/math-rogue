import {build} from 'esbuild';
import fs from 'node:fs/promises';
import {createHash} from 'node:crypto';
const base='assets/lantern-war/';
const read=async n=>JSON.parse(await fs.readFile(base+n+'.json','utf8'));
const out=await build({stdin:{contents:"export * from './src/mini-games/lantern-war/endingText';export * from './src/mini-games/lantern-war/story';export * from './src/mini-games/lantern-war/roster';export * from './src/mini-games/lantern-war/world';export * from './src/mini-games/lantern-war/techniques';",resolveDir:process.cwd()},bundle:true,platform:'node',format:'esm',write:false});
const m=await import('data:text/javascript;base64,'+Buffer.from(out.outputFiles[0].text).toString('base64'));
const plan=await read('voice-plan'),old=await read('voice-catalog'),corrections=await read('voice-corrections');
// Story coverage is rebuilt from current speakers; preserve approved battle recordings.
const clips=new Map(old.clips.filter(c=>c.kind!=='story').map(c=>[c.id,c]));
const add=(speaker,text,kind='story')=>{if(speaker==='narrator')return;if(!plan.speakers[speaker])throw Error('Unknown speaker '+speaker);const id=createHash('sha256').update(speaker+'\n'+text).digest('hex').slice(0,20);clips.set(id,{id,speaker,text,kind,path:`sfx/lantern-war/${speaker}/${id}.ogg`});if(kind==='technique')plan.clip_overrides[id]={steps:20,seconds:Math.max(3,Math.min(6,text.length*.19)),caption:plan.speakers[speaker].caption+' 参照音声と同じ人物の声を保つ。戦いのクライマックスで必殺技名を勢いよく力強く叫ぶ！子音と母音は明瞭に、語尾まで熱く響かせる。音楽・効果音なし。'};};
const lines=ls=>ls.forEach(l=>{if(l.who==='$hero'){add('aster',l.text);add('lyra',l.text.replaceAll('僕','私'));}else add(l.who,l.text);});
for(const c of m.CHAPTERS){lines(c.intro);lines(c.outro);}for(let i=0;i<m.SUPPORTS.length;i++)for(let rank=0;rank<3;rank++)lines(m.supportLines(i,rank));for(const q of m.FIELD_QUESTS)lines(m.fieldLines(q.id));
for(const text of [m.endingNarration(true),m.endingNarration(false),m.endingCrown('アステル'),m.endingCrown('リュラ')])for(const part of m.narrationParts(text))add('narrator',part);
for(const h of m.HEROES)add(h.id,h.motto);
for(const h of m.HEROES)for(const t of m.PERSONAL_TECHNIQUES[h.id])add(h.id,t.name+'！','technique');
// Minato explicitly uses the original battle recording, never a redesigned sports voice.
for(const h of m.HEROES){
 if(h.id.startsWith('high-school-'))plan.speakers[h.id].reference='public/sfx/high-school-voices/'+h.id.slice(12).toUpperCase()+'/endless-true-1.ogg';
 if(h.id.startsWith('magic-')&&h.id!=='magic-minato')plan.speakers[h.id].reference='public/sfx/magic-event-voices/'+h.id.slice(6).toUpperCase()+'/endless-true-1.ogg';
}
const minato=plan.speakers['magic-minato'];minato.reference='public/sfx/magic-voices/MINATO/attack-1.ogg';
for(const [speaker,ref]of Object.entries(plan.speakers)){ref.reference_sha256=createHash('sha256').update(await fs.readFile(ref.reference)).digest('hex');if(ref.design_text)delete ref.design_text;}
for(const [id,override]of Object.entries(corrections))plan.clip_overrides[id]={...plan.clip_overrides[id],...override};
plan.model='Aratako/Irodori-TTS-v4.1-Small';plan.clips=[...clips.values()].sort((a,b)=>Number(a.kind==='story')-Number(b.kind==='story'));plan.default_steps=12;plan.seconds_per_mora=.17;plan.latest_checked_at=new Date().toISOString();
const policy={generated_voices:'story-and-techniques',story_voices:'enabled',narration_voices:'restored-from-history',technique_media:'discarded',audition_only:[],reason:'User authorized fresh reference-matched story and shouted katakana personal-technique voices; preserve existing recordings and upstream artwork.'};
for(const [n,v] of Object.entries({'voice-plan':plan,'voice-catalog':{heroes:m.HEROES,clips:plan.clips},'voice-policy':policy}))await fs.writeFile(base+n+'.json',JSON.stringify(v,null,2)+'\n');
console.log('Prepared',plan.clips.length,'clips:',Object.fromEntries([...new Set(plan.clips.map(c=>c.kind))].map(k=>[k,plan.clips.filter(c=>c.kind===k).length])));
