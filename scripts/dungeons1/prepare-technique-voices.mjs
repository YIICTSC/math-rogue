import fs from 'node:fs/promises';import crypto from 'node:crypto';import {build} from 'esbuild';
const bundle=await build({stdin:{contents:"export {TECHNIQUES} from './src/components/school-dungeon/dungeons1/mastery';export {PROTAGONISTS} from './src/three/protagonistCatalog';",resolveDir:process.cwd()},bundle:true,platform:'node',format:'esm',write:false});
const {TECHNIQUES,PROTAGONISTS}=await import('data:text/javascript;base64,'+Buffer.from(bundle.outputFiles[0].text).toString('base64'));
const originals=JSON.parse(await fs.readFile('assets/card-club/hero-voice-plan.json','utf8')).heroes;
const intros={
 'elementary-warrior':['いっけー','ぼくの番だ','友だちのために','勇気いっぱい'],
 'elementary-caretaker':['だいじょうぶ','やさしく強く','命を守るよ','みんなを守る'],
 'elementary-assassin':['そこだね','気配を消して','見切ったよ','もう逃がさない'],
 'elementary-dodgeball':['全力だ','ナイス狙い','勝負だよ','最後の一本'],
 'elementary-bard':['せーの','リズムに乗って','声を合わせて','響けぼくの音'],
 'elementary-librarian':['読めました','この一節で','答えはここに','物語を開くよ'],
 'elementary-chef':['いただきます','仕上げだよ','腕を振るうよ','とっておきだよ'],
 'elementary-gardener':['芽を出せ','大きく育て','風にのって','花よ咲き誇れ'],
 'elementary-mage':['実験開始','ひらめいた','法則発見','これが大発見'],
 'high-school-warrior':['道を開け','俺が決める','迷いはない','この覚悟で'],
 'high-school-caretaker':['守り抜くよ','心を重ねて','もう傷つけない','命をつなぐ'],
 'high-school-assassin':['隙はそこ','影から行く','音もなく','これで終幕だ'],
 'high-school-dodgeball':['全力勝負','真っ向から','狙いは外さない','最高の一撃だ'],
 'high-school-bard':['響かせよう','今のリズムで','声を力に','世界へ届け'],
 'high-school-librarian':['続きを刻む','解き明かそう','行間を見抜く','終わりを書き換える'],
 'high-school-chef':['腕の見せどころ','仕込みは万全','熱いうちに','究極の仕上げだ'],
 'high-school-gardener':['根を張れ','風を味方に','命よ芽吹け','大地とともに'],
 'high-school-mage':['仮説を試す','観測完了','解は得られた','証明してみせる'],
 'magic-akari':['光よ集まれ','わたしは進む','希望を照らせ','みんなの明日へ'],
 'magic-elliot':['静かに刻め','誇りにかけて','夜明けを導く','この誓いを貫く'],
 'magic-hiyori':['だいじょうぶよ','花のように','ぬくもりを力に','命を抱きしめて'],
 'magic-koharu':['春風よ','緑の息吹','芽吹きの力で','花咲く明日へ'],
 'magic-leon':['道は俺が開く','誇り高く','王者の一歩だ','この空を越える'],
 'magic-madoka':['まるく結んで','くるりと行くよ','輪になれ光','願いよつながれ'],
 'magic-minato':['流れをつかむ','波を越えて','潮よ導け','海原をひらく'],
 'magic-mirai':['未来はここから','その先へ行くよ','きらめきを信じて','明日を変える'],
 'magic-rei':['静寂の中で','刃の心で','闇を断ち切る','この意志は折れない'],
 'magic-ren':['風は読めた','軽やかに','緑の道を行く','大地よ応えろ'],
 'magic-riku':['踏みしめて','まだ前へ','岩より強く','この一歩を刻む'],
 'magic-sakuya':['夜を越えて','影よ舞え','月の導きで','闇にも灯を'],
 'magic-sera':['祈りをここに','星よ守って','願いを重ねて','慈しみを力に'],
 'magic-shizuku':['水よ澄みわたれ','一滴の勇気','流れに乗せて','清らかなる力'],
 'magic-soma':['星の軌道で','見定めた','静かに貫く','蒼き誓いを'],
 'magic-tsubasa':['空へ飛び出せ','翼を広げて','追い風に乗れ','限界の向こうへ'],
 'magic-yamato':['燃えろ心','真っすぐ行く','炎よ応えろ','魂を解き放つ'],
};
const elementaryCaptions={warrior:'元気な小学生の男の子。明るい少年声。勇敢で友だち思い。',caretaker:'小学生の女の子。やさしく暖かい高めの声。生き物を大切にする芯の強さ。',assassin:'小学生の男の子。少し低く静かな少年声。転校生の慎重で鋭い口調。',dodgeball:'小学生の男の子。元気で弾む声。運動が得意な爽やかな勢い。',bard:'小学生の男の子。通る明るい声。放送委員の明瞭なリズム。',librarian:'小学生の女の子。静かで明瞭な知的な高めの声。図書委員の丁寧な口調。',chef:'小学生の男の子。朗らかで温かい声。給食当番リーダーの親しみやすさ。',gardener:'小学生の男の子。素直で柔らかい声。園芸が大好きで自然を信じる。',mage:'小学生の男の子。好奇心いっぱいの快活な声。理科クラブの発見に心が弾む。'};
const readings=[
'ふうほしょう','しょうようれんきゃく','そらなりけん','てんかんむはく',
'あさつゆばらい','ふたばがえし','よいぼしのりんぶ','れいめいいちもんじ',
'くもわり','ゆうなぎおろし','げつりょうだん','そうてんきょうかいざん',
'はりさめ','ほしぬい','ぎんしのらせん','りゅうせいてんびょう',
'こだまうち','あかばおとし','いわとざき','てんじゅくずし',
'かざみづき','つばめわたり','へきらいせん','せいがつらぬき',
'こえだばらい','みずかがみがえし','てんびんまわし','ばんしょうのえん',
'かねひとつ','じひびきびょうし','さいげつのこどう','ぎょうしょうごうてん',
'かぜいとうち','そうこうのや','ほしくずしぐれ','てんこななさい',
'くさなみうち','しでんのむすび','かざはなみだれ','せいかんのまい',
'こげつなげ','そうりんめぐり','ふうりんれんげ','てんりんきこう',
'おうぎ、ばんさいれいめい','おうぎ、ちてんきょうめい','おうぎ、せいじゅんてんしょう','おうぎ、むきゅうしんりん'];
const heroes=[];
for(const hero of PROTAGONISTS){
 const source=originals.find(h=>h.id===hero.id),young=hero.id.startsWith('elementary-');
 const reference=young?`public/sfx/dungeons-chronicles/${hero.id}/attack.ogg`:source.reference;
 const bytes=await fs.readFile(reference),prefixes=intros[hero.id];if(!prefixes)throw Error(hero.id);
 const caption=(young?elementaryCaptions[hero.id.slice(11)]:source.caption.split(' 放課後に')[0])+' 戦闘の短い技の掛け声。参照音声と同じ本人の声色。鋭く力強く、自然で明瞭な日本語。音楽や効果音なし。';
 const lines={},spoken={},seconds={};
 TECHNIQUES.forEach((t,i)=>{const prefix=prefixes[(i+Math.floor(i/4))%4];lines[t.id]=`${prefix}！ ${t.ja}！`;spoken[t.id]=`${prefix}！ ${readings[i]}！`;seconds[t.id]=Math.min(4.6,Math.max(2.4,(Array.from(prefix).length+readings[i].length)*.15+.55));});
 heroes.push({...hero,reference,reference_sha256:crypto.createHash('sha256').update(bytes).digest('hex'),caption,lines,readings:spoken,seconds});
}
const plan={upstream:'https://github.com/Aratako/Irodori-TTS',model:'Aratako/Irodori-TTS-v4.1-Small-MF',model_revision:'ccc78f5d480b6e51b69b2d5042a14c4da04fea6e',latest_code_checked:'89f9d8fbd4d51ea019867ee1197725ede1df13c5',latest_checked_at:'2026-10-24',model_selection:'Current official v4.1 Small MeanFlow, latest CPU-feasible few-step model; v4-Large 13.15 GB weights exceed 9.7 GiB RAM. Official upstream and public Hugging Face model list checked for this build.',total_clips:heroes.length*TECHNIQUES.length,heroes};
await fs.writeFile('assets/dungeons1/technique-voice-plan.json',JSON.stringify(plan,null,2)+'\n');
console.log(`Prepared ${heroes.length} distinct protagonists × ${TECHNIQUES.length} techniques = ${plan.total_clips} authored calls with explicit technique readings and matching speaker references.`);
