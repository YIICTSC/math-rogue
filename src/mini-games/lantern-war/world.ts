import{MAIN_SITES,SIDE_SITES}from'./scenes';
import {CHAPTERS} from './story';
import {heroById} from './roster';
import type {Campaign,Line} from './types';
export const MAIN_POINTS=MAIN_SITES.map(({x,y})=>({x,y}));
type FieldQuest={id:string;title:string;place:string;hero:string;unlock:number;x:number;y:number;request:string;reply:string;resolution:string;choices:[string,string]};
const rows:[string,string,string,number,number,number,string,string,string,[string,string]][]=[
 ['渡し守の約束','川辺の渡し場','high-school-caretaker',0,17,68,'橋が落ちて、薬を届けられない家がある。','先に薬を運ぶ。あなたは、ここで帰りを待つ人を支えて。','渡し場に灯がともり、救護の舟が岸を離れた。',['薬草を分けて舟を出す','村人と一緒に迂回路を探す']],
 ['空腹の作戦会議','風車の炊き出し','high-school-chef',0,34,68,'剣を握る前に鍋を持ちな。ここには空腹の避難民がいる。','僕も手伝う。誰が何を食べられるか、まず聞いてこよう。','食卓に座れなかった子にも、温かな一杯が渡った。',['保存食を炊き出しに使う','畑の収穫を手伝う']],
 ['名前のない種','朝露の畑','high-school-gardener',1,32,91,'踏まれた畑にも芽が残っている。ここを道にしないで。','遠回りしてもいい。芽を避けて通れる道を作ろう。','小さな種袋が、砦へ向かう荷車に積まれた。',['畑を守る柵を直す','種を集めて次の村へ運ぶ']],
 ['帳簿にない乗客','霧の船着き場','nagi',2,48,65,'海図にない浅瀬なら、追手の船も通れない。','それでも乗客全員の名前を聞いてから出よう。誰も置き去りにしない。','ナギの船は、名簿の最後の一人を乗せて霧へ進んだ。',['避難する人を先に乗せる','物資を積み替えて全員で渡る']],
 ['影の道しるべ','石切り場の抜け道','high-school-assassin',3,62,93,'見張りの交代はあと少し。音を立てずに、捕らわれた人を連れ出す。','鍵を開けた後は、君も一緒に帰るんだ。','消された足跡の先に、帰還を知らせる白い布が結ばれた。',['見張りを遠くへ誘導する','牢の裏に逃げ道を掘る']],
 ['緑の帰り道','木霊の小径','mio',4,77,65,'森が道を隠しているのは、怖がっているからかもしれない。','なら、枝を切る前に、迷った人の呼ぶ声を探そう。','ミオが結んだ葉の目印を頼りに、家族が森を抜けた。',['木々の傷を手当てする','迷子と一緒に道を覚える']],
 ['止まった時計台','潮騒の時計塔','sena',5,94,64,'歯車を直すだけじゃだめ。鐘を鳴らす人が帰ってこないと。','時計台へ戻ろう。帰る人が、ここを見つけられるように。','止まっていた鐘が、港の帰還船に時刻を伝えた。',['部品を探して修理する','町の人と交代で鐘を鳴らす']],
 ['春を待つ温室','雪解けの温室','dungeons2-celis',6,93,41,'凍らせれば苗は守れる。でも、春を迎える場所も必要ね。','暖かい部屋を一つ空けよう。城よりも苗床を優先する。','氷の覆いが解け、最初の双葉が窓へ顔を向けた。',['燃料を温室に届ける','地下水を温める溝を掘る']],
 ['頁の余白','水路の古書店','high-school-librarian',7,78,39,'焼け残った本に、逃げた人の名が挟まっていた。','続きを書ける人を探そう。名簿を弔辞で終わらせたくない。','本の余白に、再会した家族の住所が書き足された。',['証言を集めて記録する','本を抱えて避難所を訪ねる']],
 ['一粒の森','緑灯の苗床','dungeons2-flora',8,61,40,'荒れた土地にも森は戻る。でも一晩では戻らないわ。','僕たちが去った後も、世話を続けられる仲間を見つけよう。','苗床には町の子どもたちが書いた木の名前が並んだ。',['苗を各家に分ける','共同の庭を作る']],
 ['数字の向こう側','廃工房の実験室','high-school-mage',9,46,35,'この装置の出力なら街を守れる。でも、誰が代償を払う？','出力を落として、みんなで持ち回りにできないかな。','小さな発電機が各家へ渡り、工房の大きな炉は静かになった。',['装置を小型化する','安全な運転記録を集める']],
 ['禁書の返却日','夜露の書庫','dungeons2-noctia',10,30,39,'危険な本だと閉じられた頁に、治療の記録がある。','読む責任を、一人に押しつけない。必要な人と一緒に確かめよう。','書庫の扉には、禁止札の代わりに閲覧の約束が掲げられた。',['治療記録を写して配る','研究会を開いて検証する']],
 ['灯のない礼拝堂','丘の診療所','dungeons2-aurene',11,8,36,'祈りだけでは包帯は増えません。でも、隣にいることはできます。','僕にもできる仕事を教えて。祈る人を一人にしたくない。','診療所の前に、包帯を洗う人と湯を運ぶ人の列ができた。',['薬草を診療所へ届ける','町から手伝いを募る']],
 ['追われる足音','葦原の隠れ里','dungeons2-leif',12,5,16,'足跡は消せる。でも、逃げる人の行き先まで消しちゃいけない。','隠れ里まで道をつなごう。合図は、追手に分からないものを。','葦の結び目が、避難する人だけの道しるべになった。',['安全な道を見回る','荷物を分けて足取りを軽くする']],
 ['最後の一投','崩れた競技場','high-school-dodgeball',13,25,9,'外した一球で終わりにするなよ。まだ受け取る仲間がいる。','じゃあ、今度は一人で投げない。みんなで道を作ろう。','瓦礫を運ぶ掛け声が、競技場の応援と同じ拍子で響いた。',['仲間と瓦礫を片づける','避難の合図を練習する']],
 ['編集しない声','旅人の野外劇場','high-school-bard',14,46,11,'届けたい声を選ぶのは、もうやめた。怖い声も、弱い声も流すよ。','僕は最後まで聞く。途中で言葉が止まっても、待っている。','夜の劇場に、名乗らずに話せる小さな席が作られた。',['町の声を放送する','一人ずつ語る夜会を開く']],
 ['盾を下ろす場所','旧街道の番所','dungeons2-leon',15,63,8,'守るための盾でも、いつかは下ろせる場所が必要だ。','ここを、その場所にしよう。通る人を止める門ではなくて。','番所の兵が兜を脱ぎ、旅人と同じ食卓についた。',['休める宿を整える','街道の見張りを交代制にする']],
 ['夜明け前の火','星見の焚き火','dungeons2-ignis',16,82,9,'怖くないって言えたらよかった。でも、やっぱり怖いよ。','怖いままでいい。一歩ずつ、隣を歩こう。','夜明けを待つ焚き火の輪に、空いた席が一つずつ埋まった。',['皆の不安を聞く','一緒に最後の道を歩く']],
];
export const FIELD_QUESTS:FieldQuest[]=rows.map((r,i)=>({id:'side-'+i,title:r[0],place:r[1],hero:r[2],unlock:r[3],x:SIDE_SITES[i].x,y:SIDE_SITES[i].y,request:r[6],reply:r[7],resolution:r[8],choices:r[9]}));
export function fieldLines(id:string):Line[]{const q=FIELD_QUESTS.find(q=>q.id===id)!;return [{who:'narrator',text:q.place+'で、旅人たちを待つ声があった。'},{who:q.hero,text:q.request,reaction:'concern'},{who:'$hero',text:q.reply,reaction:'resolve'},{who:q.hero,text:heroById(q.hero).motto,reaction:'neutral'},{who:'$hero',text:'ここから先は、一緒に考えよう。誰かが帰れる道を、もう一本増やしたい。',reaction:'joy'},{who:'narrator',text:q.resolution}];}
export function finishFieldQuest(s:Campaign,choice:number){const q=FIELD_QUESTS.find(q=>q.id===s.fieldQuest);if(!q)return;const done=s.fieldCompleted||[];if(!done.includes(q.id)){s.fieldCompleted=[...done,q.id];s.fieldChoices={...s.fieldChoices,[q.id]:choice};s.gold+=choice===0?100:160;s.supplies+=choice===0?3:1;s.xp[q.hero]=(s.xp[q.hero]||0)+70;if(!s.recruited.includes(q.hero)){s.recruited.push(q.hero);const target=s.formations.find(f=>f.slots.filter(Boolean).length<(s.chapter<6?3:s.chapter<12?4:6));if(target){const slot=target.slots.indexOf(null);if(slot>=0)target.slots[slot]=q.hero;}}}s.fieldQuest=undefined;s.phase='field';s.storyIndex=0;}
export function locationPoint(id:string){return id.startsWith('main-')?MAIN_POINTS[Number(id.slice(5))]||MAIN_POINTS[0]:FIELD_QUESTS.find(q=>q.id===id)||MAIN_POINTS[0];}
export function canVisit(s:Campaign,id:string){if(id.startsWith('main-'))return Number(id.slice(5))<=s.chapter;return (FIELD_QUESTS.find(q=>q.id===id)?.unlock??99)<=s.chapter;}
export function travelPath(s:Campaign,from:string,to:string){if(!canVisit(s,to))return [];const anchor=(id:string)=>id.startsWith('main-')?Number(id.slice(5)):FIELD_QUESTS.find(q=>q.id===id)?.unlock||0;const a=anchor(from),b=anchor(to),steps:string[]=[];if(!from.startsWith('main-'))steps.push('main-'+a);for(let i=a;i!==b;){i+=b>a?1:-1;steps.push('main-'+i);}if(!to.startsWith('main-'))steps.push(to);return steps;}

const ROAD_BENDS:number[][][]=[[[22,69],[34,69],[43,67]],[[40,62],[34,60]],[[40,62],[48,64],[57,68],[65,73],[74,74]],[[72,65],[73,55],[80,48],[84,41]],[[84,41],[77,46],[70,51]],[[56,52],[47,48],[36,43],[28,40],[22,36]],[[27,36],[35,39],[42,42]],[[43,44],[38,47]],[[44,49],[50,52]],[[61,49],[64,41]],[[77,35]],[[77,28],[68,24],[59,24],[48,22],[37,21]],[[33,19],[41,18]],[[56,17],[62,16]],[[65,18],[60,20]],[[54,17],[52,13]],[[60,15],[69,13],[78,12]]];
/** Landmarks follow the painted roads rather than a uniform snake grid. */
export function mapWaypoints(from:string,to:string):{x:number;y:number}[]{
 if(from.startsWith('main-')&&to.startsWith('main-')){const a=Number(from.slice(5)),b=Number(to.slice(5));if(Math.abs(a-b)===1){const bends=ROAD_BENDS[Math.min(a,b)].map(([x,y])=>({x,y}));return [...(b>a?bends:bends.reverse()),locationPoint(to)];}}
 return [locationPoint(to)];
}
