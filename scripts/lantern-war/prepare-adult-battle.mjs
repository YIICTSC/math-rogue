import {build} from 'esbuild';import fs from 'node:fs/promises';import {createHash} from 'node:crypto';
const bundled=await build({stdin:{contents:"export * from './src/mini-games/lantern-war/battleVoiceLines';export * from './src/mini-games/lantern-war/techniques';export * from './src/mini-games/lantern-war/roster';",resolveDir:process.cwd()},bundle:true,platform:'node',format:'esm',write:false});
const m=await import('data:text/javascript;base64,'+Buffer.from(bundled.outputFiles[0].text).toString('base64'));
const base='assets/lantern-war/',read=async name=>JSON.parse(await fs.readFile(base+name+'.json','utf8'));
const plan=await read('voice-plan'),catalog=await read('voice-catalog'),auditions=await read('audition-plan'),buildRecord=await read('voice-build'),auditionBuild=await read('audition-build'),policy=await read('voice-policy');
const reading={'暁を継ぐ剣！':'あかつきをつぐつるぎ！','星灯の切先！':'せいとうのきっさき！','隣人の号令！':'りんじんのごうれい！','暁路の三日月！':'ぎょうろのみかづき！','帰郷の踏み込み！':'ききょうのふみこみ！','灯守の構え！':'ひもりのかまえ！','王冠を解く剣！':'おうかんをとくつるぎ！','この灯を、託す。':'このともしびを、たくす。'};
const corrections=await read('voice-corrections');
const emotion={attack:'戦闘中の鋭く短い掛け声。',damage:'傷を受けて耐える、短い強がり。',heal:'回復への感謝、息を整えた自然な声。',ultimate:'必殺技名を凛と力強く告げる。',support:'仲間を支える、頼もしさと温かさ。',win:'戦いを終えた安堵と仲間への感謝。',defeat:'力を使い果たし、仲間へ託す静かな声。',technique:'固有技名を明瞭に、短く力強く告げる。'};
plan.model=auditions.model;plan.default_steps=12;plan.seconds_per_mora=.17;plan.clips=[];plan.clip_overrides={};
for(const hero of ['aster','lyra']){
 const ref=auditions.speakers[hero];if(!ref.reference.endsWith('-v3.ogg'))throw Error('Expected approved adult v3 reference');
 const bytes=await fs.readFile(ref.reference);if(createHash('sha256').update(bytes).digest('hex')!==ref.reference_sha256)throw Error('Reference changed');
 plan.speakers[hero]=ref;buildRecord.references[hero]=auditionBuild.references[hero];
 const lines=[...m.BATTLE_VOICE_KINDS.map(kind=>({kind,text:m.battleVoiceText(hero,kind)})),...m.PERSONAL_TECHNIQUES[hero].map(t=>({kind:'technique',text:m.battleVoiceText(hero,'technique',undefined,t.name)}))];
 for(const {kind,text} of lines){const id=createHash('sha256').update(hero+'\n'+text).digest('hex').slice(0,20);plan.clips.push({id,speaker:hero,text,kind,path:`sfx/lantern-war/${hero}/${id}.ogg`});plan.clip_overrides[id]={steps:kind==='ultimate'||kind==='technique'?16:12,...(kind==='ultimate'||kind==='technique'?{seconds:3.0}:{}),caption:ref.caption+' '+emotion[kind]+' 参照音声と同じ人物の声質と成人の声域を保つ。',...(reading[text]?{spoken_text:reading[text]}:{}),...corrections[id]};}
}
catalog.clips=plan.clips;policy.generated_voices='battle-only';policy.battle_speakers=['aster','lyra'];policy.audition_only=[];policy.reason='Approved adult v3 references for Aster and Lyra battle recordings only. Story voices and prototype artwork remain discarded.';
const pronunciations=await read('pronunciations');for(const [name,kana]of Object.entries(reading))if(name.endsWith('！'))pronunciations.skills[name.slice(0,-1)]=kana.slice(0,-1);
for(const [name,value]of Object.entries({'voice-plan':plan,'voice-catalog':catalog,'voice-build':buildRecord,'voice-policy':policy,pronunciations}))await fs.writeFile(base+name+'.json',JSON.stringify(value,null,2)+'\n');
console.log('Prepared',plan.clips.length,'battle voices from approved adult v3 references.');
