import fs from 'node:fs/promises';import{createHash}from'node:crypto';import{build}from'esbuild';
const result=await build({stdin:{contents:"export{ENDLESS_CAST}from'./src/mini-games/lantern-war/endlessRoster';export{BATTLE_VOICE_KINDS,battleVoiceText}from'./src/mini-games/lantern-war/battleVoiceLines';",resolveDir:process.cwd()},bundle:true,write:false,format:'esm',platform:'node'});const m=await import('data:text/javascript;base64,'+Buffer.from(result.outputFiles[0].text).toString('base64'));
const sha=b=>createHash('sha256').update(b).digest('hex');
const captions={
'end-vesper':'日本語の成人女性。20代後半から30代前半の落ち着いた中低音。銀髪、黒金の鎧と赤い外套を着た歴戦の女将軍。凛とした芯と胸の響き。幼い少女声ではない。威厳があり、贖罪と守る決意を秘めた自然な演技。明瞭な標準語。',
'end-hikari':'日本語の成人女性。20代前半の、澄んだ中音域。珊瑚色の長い髪、花飾りをつけた海辺の灯台守ミレア。人懐っこい温かさと、灯を守る時の芯の強さ。子どもっぽすぎない、明瞭で自然な標準語。既存のあかりとは別人として設計する。',
'end-ren':'日本語の成人男性。20代半ばの穏やかな中低音。黒髪に白と青の海辺の装束をまとい、日傘を旗にする守護者カイ。柔らかい口調の奥に揺るがぬ決意。既存のレンとは別人として設計し、幼い少年声ではなく温かく明瞭な声。',
'end-sable':'日本語の成人男性。20代後半から30代の低めの声。黒髪、緑の外套をまとった寡黙な狙撃手。息を漏らしすぎず、静かな確信と仲間への温かさを感じる、明瞭で自然な標準語。幼い少年声や極端な老人声ではない。'
};
const design={'end-vesper':'今度こそ、この盾で帰る場所を守る。私の背中に続いてくれ。','end-sable':'この一発は、仲間を無事に帰すために。俺が援護する。安心して進め。','end-hikari':'私はミレア。海の向こうから来た人にも、帰り道の灯を届けたい。','end-ren':'僕はカイ。この入江を守っている。誰もが帰れる岸辺を、一緒に守ろう。'};
const emotion={attack:'短く鋭い攻撃の掛け声。',damage:'被弾して踏みとどまる、短い苦痛と決意。',heal:'仲間への自然な感謝。',ultimate:'必殺技の名前を、力強く明瞭に叫ぶ。',support:'仲間に声を届ける、頼もしい援護。',win:'勝利の安堵と仲間への優しさ。',defeat:'力尽きて仲間に託す、静かな声。'};
const reading={'贖いの城塞！':'あがないのじょうさい！','夜明けの照準！':'よあけのしょうじゅん！','真夏の灯台！':'まなつのとうだい！','潮騒の祝福！':'しおさいのしゅくふく！','皆を、頼む。':'みんなを、たのむ。'};
let old;try{old=JSON.parse(await fs.readFile('assets/lantern-war/endless/voice-plan.json','utf8'));}catch{}
const plan={model:'Aratako/Irodori-TTS-v4.1-Small-MF',default_steps:4,seconds_per_mora:.16,speakers:{},clips:[],clip_overrides:{}};
for(const [i,h]of m.ENDLESS_CAST.entries()){
 const speaker={reference:`assets/lantern-war/endless/references/${h.id}.ogg`,caption:captions[h.id],design_text:design[h.id],design_seed:971007+i,visual_reference:`public/sprites/lantern-war/endless/dialogue-${h.id}.png`};
 if(old?.speakers[h.id]?.reference===speaker.reference&&old.speakers[h.id]?.reference_sha256)speaker.reference_sha256=old.speakers[h.id].reference_sha256;
 plan.speakers[h.id]=speaker;
 for(const kind of m.BATTLE_VOICE_KINDS){const text=m.battleVoiceText(h.id,kind),id=sha(h.id+'\n'+text).slice(0,20);plan.clips.push({id,speaker:h.id,text,kind,path:`sfx/lantern-war/endless/${h.id}/${id}.ogg`});plan.clip_overrides[id]={steps:kind==='ultimate'?8:4,caption:speaker.caption+' '+emotion[kind]+' 参照と同じ人物の声色と年齢感。指定の台詞だけを一度発声。背景音と音楽なし。',...(reading[text]?{spoken_text:reading[text]}:{}),...(kind==='ultimate'?{seconds:2.7}:{})};}
}
await fs.mkdir('assets/lantern-war/endless/references',{recursive:true});await fs.writeFile('assets/lantern-war/endless/voice-plan.json',JSON.stringify(plan,null,2)+'\n');console.log('Prepared',plan.clips.length,'battle calls for',Object.keys(plan.speakers).length,'new actors; original story/battle plans remain unchanged.');
