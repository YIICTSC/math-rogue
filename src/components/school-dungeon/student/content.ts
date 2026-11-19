import {PROTAGONISTS,isProtagonistId as isLegacyProtagonistId,type ProtagonistId} from '../../../three/protagonistCatalog';
import {abyssHero} from '../dungeons2/roster';
export {PROTAGONISTS};
export const isProtagonistId=(id:unknown):id is string=>typeof id==='string'&&(isLegacyProtagonistId(id)||Boolean(abyssHero(id))); export type {ProtagonistId};
export type StudentChapter='elementary'|'high-school'|'magic';
export function studentChapter(id:string):StudentChapter{return (id.startsWith('magic-')||abyssHero(id))?'magic':id.startsWith('high-school-')?'high-school':'elementary';}
export function studentHero(id?:string){return abyssHero(id)||PROTAGONISTS.find(p=>p.id===id)||PROTAGONISTS[0];}
export const CHAPTER_LABELS={elementary:['小学生編','Elementary'], 'high-school':['高校生編','High school'],magic:['魔法学園編','Magic academy']} as const;
export interface StudentGear {type:string;category:string;name:string;desc:string;en:string;englishDesc:string;power:number;value:number;chapter:StudentChapter;floor:number;model:string;icon:number;count?:number;marks?:string[];}
const gear=(chapter:StudentChapter,key:string,category:string,name:string,en:string,power:number,floor:number,model:string,icon:number):StudentGear=>({type:`STUDENT_${chapter==='elementary'?'E':chapter==='high-school'?'H':'M'}_${key}`,category,name,en,power,value:100+power*80,chapter,floor,model,icon,count:category==='RANGED'?12:undefined,marks:category==='ACCESSORY'?[key==='COMPASS'?'RING_SIGHT':key==='WATCH'?'RING_HUNGER':chapter==='magic'?'RING_HEAL':chapter==='high-school'?'RING_TRAP':'RING_HUNGER']:undefined,desc:category==='ACCESSORY'?(key==='COMPASS'?'敵と道具の位置がわかる。':key==='WATCH'||chapter==='elementary'?'お腹が減りにくくなる。':chapter==='magic'?'HPの回復が早くなるが、お腹も減る。':'足元の罠が見える。'):`${name}。${category==='WEAPON'?'攻撃':category==='ARMOR'?'防御':'道具の力'}+${power}。旅の仲間が手入れした道具。`,englishDesc:category==='ACCESSORY'?(key==='COMPASS'?'Reveals foes and supplies.':key==='WATCH'||chapter==='elementary'?'Slows hunger.':chapter==='magic'?'Accelerates recovery, at the cost of food.':'Reveals traps.'):`${en}. ${category==='WEAPON'?'Attack':category==='ARMOR'?'Defense':'Tool power'} +${power}. Maintained by your traveling companions.`});
export const STUDENT_GEAR:StudentGear[]=[
 gear('elementary','PENCIL','WEAPON','旅立ちのえんぴつ','Journey pencil',4,1,'pencil',2),gear('elementary','RULER','WEAPON','友情のものさし','Friendship ruler',6,5,'ruler',2),gear('elementary','BROOM','WEAPON','通学路のほうき','School-route broom',8,10,'broom',2),gear('elementary','STAR_PENCIL','WEAPON','虹色のえんぴつ','Rainbow pencil',11,15,'pencil',2),
 gear('elementary','VEST','ARMOR','遠足のベスト','Field-trip vest',3,1,'coat',3),gear('elementary','BACKPACK','ARMOR','冒険のランドセル','Adventure backpack',5,5,'backpack',3),gear('elementary','SHIELD','ARMOR','みんなの学級盾','Classroom shield',8,10,'shield',3),gear('elementary','CAPE','ARMOR','卒業のマント','Graduation cape',11,15,'cape',3),
 gear('elementary','PLANE','RANGED','約束の紙飛行機','Promise paper plane',5,3,'paper_plane',5),gear('elementary','STONES','RANGED','川原のまる石','River pebbles',7,9,'stone',5),gear('elementary','BADGE','ACCESSORY','友だちの校章','Friendship badge',0,3,'badge',8),gear('elementary','COMPASS','ACCESSORY','帰り道のコンパス','Homeward compass',0,12,'compass',8),
 gear('high-school','RAPIER','WEAPON','文化祭のレイピア','Festival rapier',4,1,'blade',2),gear('high-school','POINTER','WEAPON','探究の指示棒','Inquiry pointer',6,5,'ruler',2),gear('high-school','HAMMER','WEAPON','工芸部のハンマー','Craft-club hammer',8,10,'hammer',2),gear('high-school','BLADE','WEAPON','夜明けのペンブレード','Dawn pen blade',11,15,'blade',2),
 gear('high-school','UNIFORM','ARMOR','旅人のブレザー','Traveler blazer',3,1,'coat',3),gear('high-school','APRON','ARMOR','部活動エプロン','Club apron',5,5,'apron',3),gear('high-school','SHIELD','ARMOR','実行委員の盾','Festival committee shield',8,10,'shield',3),gear('high-school','COAT','ARMOR','星見のロングコート','Stargazing coat',11,15,'coat',3),
 gear('high-school','CHALK','RANGED','青空のチョーク','Blue-sky chalk',5,3,'chalk',5),gear('high-school','PLANE','RANGED','風読みのグライダー','Wind-reading glider',7,9,'paper_plane',5),gear('high-school','BADGE','ACCESSORY','文化祭パス','Festival pass',0,3,'badge',8),gear('high-school','WATCH','ACCESSORY','放課後の時計','After-school watch',0,12,'watch',8),
 gear('magic','WAND','WEAPON','星灯りの筆杖','Starlight quill wand',4,1,'pencil',2),gear('magic','MOON','WEAPON','月鏡の細剣','Moon-mirror rapier',6,5,'blade',2),gear('magic','BROOM','WEAPON','精霊のほうき','Spirit broom',8,10,'broom',2),gear('magic','WAND_LAST','WEAPON','星図の筆杖','Star-atlas quill wand',11,15,'pencil',2),
 gear('magic','CAPE','ARMOR','見習いの星マント','Apprentice star cape',3,1,'cape',3),gear('magic','COAT','ARMOR','月織りのコート','Moonwoven coat',5,5,'coat',3),gear('magic','SHIELD','ARMOR','花守りの結界盾','Blossom ward shield',8,10,'shield',3),gear('magic','CAPE_LAST','ARMOR','星界の旅マント','Astral traveler cape',11,15,'cape',3),
 gear('magic','CRANE','RANGED','光の折り鶴','Light origami crane',5,3,'paper_plane',5),gear('magic','MARBLE','RANGED','精霊のビー玉','Spirit marbles',7,9,'stone',5),gear('magic','MEDAL','ACCESSORY','星結びの校章','Starbinding badge',0,3,'badge',8),gear('magic','COMPASS','ACCESSORY','星界のコンパス','Astral compass',0,12,'compass',8),
];
export const STUDENT_ITEM_DB=Object.fromEntries(STUDENT_GEAR.map(g=>[g.type,g]));
export function studentGear(id:string,floor=20){const chapter=studentChapter(id);return STUDENT_GEAR.filter(g=>g.chapter===chapter&&g.floor<=floor);}
export type StoryAct = {floor:number;title:string;englishTitle:string;lines:readonly (readonly [string,string])[];};
export const STUDENT_STORIES:Record<StudentChapter,readonly StoryAct[]>={
 "elementary":[
  {floor:1,title:"消えた帰り道",englishTitle:"The missing way home",lines:[
   ["下校のベルが鳴った。ところが、{hero}が校門を出ると、いつもの帰り道が白い行き止まりになっていた。","The dismissal bell rang. Beyond the gate, {hero} found a blank wall of white where the road home should have been."],
   ["図書室の地図帳を開くと、町を描いた紙が破れている。風に飛ばされたページは、校門の下に現れた階段へ落ちていった。","The atlas in the library had lost its map of town. The loose pages had blown down a new staircase beneath the gate."],
   ["校長先生は、先に階段を下りていった。入口には「20階で待つ。拾った紙は捨てるな」と、急いで書いたメモが残っていた。","The principal had gone down first. A hurried note at the entrance read, “Meet me on floor 20. Keep any paper you find.”"],
   ["{hero}は破れた地図帳を抱え直し、一段目を下りた。","{hero} tucked the torn atlas under an arm and stepped down."],
  ]},
  {floor:5,title:"小さな約束",englishTitle:"A small promise",lines:[
   ["中継町に着いた{hero}の靴先へ、紙飛行機がすべり込んできた。折り目を開くと、同じ学校の子の字だった。","A paper plane slid up to {hero}'s shoe in the relay town. The handwriting inside belonged to a pupil from the same school."],
   ["「一人で近道を探すより、ここを通った人が知らせを残そう」。裏には、小さな矢印と、おにぎりの絵が描いてあった。","“Instead of searching for shortcuts alone, let's leave messages for the next person.” A little arrow and a rice ball were drawn on the back."],
   ["宿の人が、おにぎりの絵を見て笑った。あたたかいのがまだ一つあるよ、と教えてくれた。","The innkeeper smiled at the picture. There was one warm rice ball left, they said."],
   ["{hero}も次の人に伝言を残した。道を探す前に、ここで少し休めると書いた。","{hero} left a message too, passing on that this was a good place to rest before looking for the road."],
  ]},
  {floor:10,title:"川の向こうの一頁",englishTitle:"A page across the river",lines:[
   ["川に着いた{hero}は、渡し場の柱にふやけた地図のページが引っかかっているのを見つけた。","At the ferry landing, {hero} spotted a soggy map page caught on a post."],
   ["紙には川しか残っていない。近くにいた子が「橋なら、向こうの柳の下だよ」と、かじりかけのおにぎりで指した。","Only the river was left on the paper. A child pointed with a half-eaten rice ball. “The bridge is by that willow.”"],
   ["言われた通りに歩くと、木の下に古い板橋があった。地図の線がなくても、覚えている人がいれば描き直せる。","Just as the child said, there was an old plank bridge under the tree. If someone remembered a road, the line could be drawn again."],
   ["{hero}はページを乾かし、橋の位置と柳の絵を描いておいた。","{hero} dried the page and marked where the bridge and the willow stood."],
  ]},
  {floor:15,title:"みんなの道しるべ",englishTitle:"A signpost for everyone",lines:[
   ["{hero}が集めた紙を並べると、よく知っている町の形になった。校門から先だけ、まだ線が切れている。","When {hero} laid out the pages, they made the shape of the familiar town. Only the line beyond the gate still broke off."],
   ["見つけた橋の印や、町の人から聞いた近道を書き足した。余白には、休める場所も小さく描いた。","The new map gained the bridge, the shortcuts people had mentioned, and little marks in the margins for places to rest."],
   ["校長先生のメモには、端にもう一行あった。「誰かに渡せる地図を持っておいで」。","There was one more line along the edge of the principal's note: “Bring a map you could hand to someone else.”"],
   ["{hero}は地図を折った。初めて通る子にも分かるよう、表の角に大きく「学校」と書いた。","{hero} folded the map and wrote “SCHOOL” in one corner so even a first-time traveler could find it."],
  ]},
  {floor:20,title:"校長先生の問い",englishTitle:"The principal’s question",lines:[
   ["いちばん下の階で、{hero}は出口の前に立つ校長先生に追いついた。先生の靴にも、同じ泥がついていた。","On the bottom floor, {hero} caught up with the principal by the exit. The principal had the same mud on their shoes."],
   ["校長先生は地図を受け取り、柳の絵を見つけた。「そこは私も迷ったよ。これなら次の子は渡れるね」。","The principal took the map and found the willow. “I got lost there too. The next child will find the crossing with this.”"],
   ["出口を開くには、ここまで来た旅人が最後の実技を通らなければならない。「相手は私だ。迷宮で覚えたことを見せてごらん」と、先生は地図を預かった。","The exit would open when the traveler passed a final practical test. The principal took the map. “I will be your opponent. Show me what you learned along the way.”"],
   ["{hero}は道具を取り出した。これで帰り道を描くだけでなく、みんなが通れるようにする。","{hero} reached for the supplies. The road was drawn. Now people needed to be able to use it."],
  ]},
  {floor:21,title:"おかえりの地図",englishTitle:"The welcome-home atlas",lines:[
   ["校門をくぐった{hero}の前に、見慣れた道が続いていた。川までは、あの柳が目印だ。","Beyond the gate, {hero} found the familiar road again. The willow still marked the way down to the river."],
   ["地図は図書室の壁に貼られた。橋の絵を見つけた子が、余白に自分の家を描き足した。","The map went up on the library wall. A child spotted the bridge and drew their house in the margin."],
   ["校長先生が「おかえり」と言う。夕方に聞くその一言は、朝に聞く「おはよう」と同じくらい、町に似合っていた。","The principal said, “Welcome home.” It belonged in the town at dusk as surely as “Good morning” did at dawn."],
   ["{hero}は明日のためにえんぴつを削り、今日の帰り道をゆっくり歩いた。","{hero} sharpened a pencil for tomorrow and took the road home slowly today."],
  ]},
 ],
 "high-school":[
  {floor:1,title:"終業ベルの向こう",englishTitle:"Beyond the final bell",lines:[
   ["文化祭の前日、{hero}が廊下を走ると、どの時計も同じ時刻で止まっていた。その先は見知らぬ階段だ。","The day before the festival, every clock {hero} passed in the hall showed the same stopped time. An unfamiliar stairway waited ahead."],
   ["準備ノートには、各部が明日までにやることを書いてある。そのノートが風にあおられ、階段の奥へ落ちてしまった。","The festival notebook listed what every club still had to do by tomorrow. A gust carried it down the stairs."],
   ["先生が階段から顔を出した。「紙を集めて20階に持ってきて。私は時計塔で、針が急に進まないように押さえておく」。","A teacher called from the stairs. “Collect the pages and bring them to floor 20. I'll keep the clock hands from jumping ahead.”"],
   ["{hero}は明日の掲示板に「準備中」と書き、階段へ向かった。","{hero} wrote “Still preparing” on the noticeboard for tomorrow and headed for the stairs."],
  ]},
  {floor:5,title:"途切れた連絡網",englishTitle:"The broken message chain",lines:[
   ["中継町の掲示板で、{hero}は部員の伝言を見つけた。「美術部より。暗くて看板が描けません」。","On the relay town's noticeboard, {hero} found a message. “From the art club. It's too dark to paint the sign.”"],
   ["すぐ横に「電灯なら貸せる。電池がない」と、別の筆跡で書いてあった。","Beside it, another hand had written, “We can lend you a lamp. No batteries.”"],
   ["自分の担当だけ見ていたら、二つの伝言がつながることもなかった。","Nobody would have put the two messages together by looking only at their own assignment."],
   ["{hero}は電池の預け先を書き足し、手持ちの道具をそろえて次の階へ急いだ。","{hero} wrote where to find spare batteries, checked the gear, and headed down to the next floor."],
  ]},
  {floor:10,title:"失敗の書き直し",englishTitle:"Rewriting a setback",lines:[
   ["川辺で{hero}が拾ったページは、赤字だらけだった。飾りが重くて落ちた日や、予行で音が出なかった日が残っている。","The page {hero} found by the river was covered in red ink. It listed the day the decorations fell and the rehearsal where the sound cut out."],
   ["よく読むと、そのあと何を直したかも書いてあった。去年の誰かが、同じ係に引き継ぐつもりで残したらしい。","A closer look showed what had been fixed. Someone from last year must have wanted the next crew to know."],
   ["きれいに書き直したいところをこらえ、{hero}は泥だけそっとふき取った。","{hero} resisted the urge to copy it out neatly and wiped away only the mud."],
   ["乾いたページを折りたたむ。明日もし失敗しても、これならその先を考えられる。","The dry page folded neatly. Tomorrow, if something went wrong, there would be somewhere to start."],
  ]},
  {floor:15,title:"一人分の明かり",englishTitle:"One person’s light",lines:[
   ["中継町の奥が明るい。{hero}が近づくと、部の違う生徒たちが、ひとつの作業台を囲んでいた。","Light spilled from the end of the relay town. As {hero} came closer, students from several clubs were sharing one workbench."],
   ["電灯が一つしかないので、手の空いた人が持っている。看板には、やっと最後の一文字が入ろうとしていた。","There was only one lamp, held by whoever had a hand free. The painted sign was nearly down to its final letter."],
   ["集めたノートの最後に、まだ誰も書いていない欄があった。「困ったら、どこへ行く？」","One space was still blank at the back of the notebook: “Where can you go if you need help?”"],
   ["{hero}は「明かりのある作業台」と書いて、残りのページを時計塔へ運んだ。","{hero} wrote “To the workbench with the light” and carried the pages to the clock tower."],
  ]},
  {floor:20,title:"時計塔の最終確認",englishTitle:"The clock tower’s final check",lines:[
   ["時計塔で、{hero}は針を支える校長先生を見つけた。歯車の間から、最後のページの角がのぞいている。","In the clock tower, {hero} found the principal holding the hands in place. The corner of the last page stuck out between two gears."],
   ["準備ノートが歯車を止めていたのだ。ここで急に抜くと、止まった分だけ一気に時が進んでしまう。","The notebook had jammed the gears. Pull it out too fast and time would leap ahead."],
   ["「ここの歯車は、最後の実技を終えたら外せる。実技の相手は私だ」。校長先生は、試合のあとに動かす歯車をノートの余白に描いた。","“This gear comes free once you pass the last practical test. I will be your opponent.” The principal marked the gear they would move after the match."],
   ["{hero}は手順をよく見て、実行へ移った。何も書いていない頃より、ずっとやることがはっきりしていた。","{hero} studied the sketch and got to work. It was much clearer than when the page was blank."],
  ]},
  {floor:21,title:"開幕のベル",englishTitle:"The opening bell",lines:[
   ["時計が動く。{hero}が校庭へ戻った時、放送係はまだ開幕の一言を練習していた。","The clock started moving. When {hero} returned to the schoolyard, the announcer was still practicing the opening."],
   ["いちばん目立つところに、あの看板が掛かった。一文字だけ色が違うのは、夜に描いた証拠だと言って、みんなが笑った。","The sign went up in the most visible spot. Everyone laughed about the one odd-colored letter. It was proof they had painted it at night."],
   ["準備ノートには、直した跡も、電池の置き場所も残っている。来年の係なら、まずそこから読める。","The notebook kept its corrections and even the note about batteries. Next year's crew would know where to start."],
   ["開幕のベルが鳴った。{hero}はもう時計を見ないで、できあがった看板の下を歩いた。","The opening bell rang. {hero} walked under the finished sign without looking at the clock."],
  ]},
 ],
 "magic":[
  {floor:1,title:"星図の頁を追って",englishTitle:"Following the star-atlas pages",lines:[
   ["{hero}が魔法学園の窓を閉めると、星図から一つずつ星が落ちていった。外にいる生徒が帰る門まで消えてしまう。","As {hero} shut the academy window, stars began falling from the atlas. The gate students used to come home vanished too."],
   ["司書が頁の切れ端を持って駆けてきた。「星は地面に落ちたんじゃない。星図の下に、階段ができてる」。","The librarian hurried in with a scrap of paper. “The stars didn't fall to the ground. Look. There are stairs under the atlas.”"],
   ["校長先生は20階の門を開ける準備をしている。そこまでに、散った星の頁を拾い集めよう。","The principal was preparing the gate on floor 20. The fallen pages needed to reach it."],
   ["{hero}は足元を照らした。最初の頁が階段の隅に光り、進む方角を教えてくれた。","{hero} lit the stairs. The first page gleamed in a corner, showing which way to go."],
  ]},
  {floor:5,title:"月の町の伝言",englishTitle:"A message in the moon town",lines:[
   ["中継町で、{hero}は片方ずつ違う色の灯りを見た。一つは学校側、もう一つは星界から来た旅人のためだ。","In the relay town, {hero} found two lights of different colors. One served travelers from school and the other those from the astral realm."],
   ["小さな宿で、異なる属性の旅人が同じ地図を囲んでいた。消えた門の場所に、誰かが熱い茶をこぼした跡がある。","Travelers with different kinds of magic bent over one map in the inn. There was a tea stain where the missing gate should be."],
   ["「茶の輪のところが帰り道だよ」。宿の人がそう言って、星の頁を一枚、乾いた布から出してくれた。","“The road home is by the tea ring,” the innkeeper said, taking one star page from a dry cloth."],
   ["{hero}は受け取り、次の人が迷わないよう、その頁にも小さな丸を描いた。","{hero} took it and drew a small circle on that page too, so the next traveler could find it."],
  ]},
  {floor:10,title:"影に残る名前",englishTitle:"Names left in shadow",lines:[
   ["{hero}が川の暗がりで拾った頁には、星ではなく、生徒の名前が書かれていた。","The page {hero} found in the shadows by the river held students' names instead of stars."],
   ["以前に門が閉じたとき、帰れなくなった人が、自分で名前を残したらしい。最後の一人の字だけ、かすれていた。","People who were stranded when the gate closed before seem to have written their names here. The last person's writing had faded."],
   ["魔法を強くすると紙ごと焼けそうだ。{hero}は灯りを下げ、読めた文字をゆっくり別の頁に写した。","Too much magic might burn the paper. {hero} lowered the light and copied the letters that could still be read."],
   ["読めなかった場所は空けておいた。町に帰ったら、覚えていそうな人に聞いてみよう。","The unreadable part stayed blank. Someone in town might remember when they got back."],
  ]},
  {floor:15,title:"ほどけない約束",englishTitle:"A promise that holds",lines:[
   ["{hero}は中継町の机に星図を広げた。頁を重ねると、学校へ戻る線が出る。最後の角だけが合わない。","{hero} spread the atlas across a table in the relay town. The pages made a route back to school, all but the last corner."],
   ["線の先を探すあいだ、風を止める人と、机を照らす人がいた。どちらがいなくても、紙は読めなかった。","While they searched for the end of the line, one traveler held back the wind and another lit the table. Both made it possible to read."],
   ["最後の角は、ただ裏返しになっていただけだった。誰からともなく笑いがもれた。","The last corner was simply upside down. A laugh went around the table."],
   ["{hero}は道を描いてくれた人の名も、星の隣に書き足した。帰りの門には、全員の仕事が入っていた。","{hero} wrote the helpers' names beside the stars. Everyone had a part in the road home."],
  ]},
  {floor:20,title:"封印の向こう側",englishTitle:"Beyond the seal",lines:[
   ["いちばん下の階で、{hero}は門を支える校長先生に追いついた。開いたすき間から、学園の廊下の音が聞こえる。","On the lowest floor, {hero} found the principal holding the gate steady. A sound like the academy hallway came through the gap."],
   ["集めた頁を置くと、門の形がはっきりした。あとは門を開く実技に合格するだけだ。校長先生が向かいの印に立ち、対戦の構えを取った。","The gathered pages brought the gate into focus. Passing the final practical test would open it. The principal took their place on the opposite mark, ready to spar."],
   ["天井に、新しい印が見えた。町で写した文字と同じ形だ。誰かが前にも、同じ場所まで帰ろうとしたのだ。","A mark on the ceiling matched the letters copied in town. Someone had once tried to get home this far too."],
   ["{hero}は星図を安全な台へ置き、自分の側の印に立った。","{hero} set the atlas safely on a stand and stepped onto the other mark."],
  ]},
  {floor:21,title:"明日へ続く星座",englishTitle:"A constellation toward tomorrow",lines:[
   ["門をくぐった{hero}は、学園の廊下に戻った。向こうから次々に靴音がして、遅くなった生徒たちも帰ってきた。","{hero} stepped through into the academy hallway. Footsteps followed as the students who'd been away too long came home."],
   ["司書が星図を壁に戻し、かすれていた名前の空欄を見た。「この人なら知ってるよ。今は別の町で先生をしている」。","The librarian put the atlas back and saw the blank space where the name had faded. “I know who that was. They teach in another town now.”"],
   ["書き足した名前の上に、小さな星が光った。窓の外にも、同じ場所に新しい光が見えた。","A little star shone over the restored name. Outside the window, a new point of light appeared in the same place."],
   ["{hero}は星図にまだ空白があるのを確かめた。次に誰かが見つけた道も、そこに描ける。","{hero} checked that there was still blank space on the atlas. The next person to find a road could draw it there too."],
  ]},
 ],
};
