import {ABYSS_HEROES,abyssHero} from './dungeons2/roster';
import {expedition,expeditionUnlocked} from './expeditions';
import {chronicleHero,type Bilingual} from './chronicles/story';
import {PROTAGONISTS,studentChapter,studentHero,STUDENT_STORIES} from './student/content';
import type {AdventureMode,SchoolBase} from './adventure';
export const ROUTE_ORDER:AdventureMode[]=['STORY','PUZZLE','TRAPS','MYSTERY','CARDS','NO_GEAR','BARE'];
export function routeOpen(base:SchoolBase,mode:AdventureMode){if(expedition(mode))return expeditionUnlocked(base,mode);if(mode==='RESCUE')return Boolean(base.rescue&&base.rescue.attempts<3);const index=ROUTE_ORDER.indexOf(mode);return index===0||Boolean(base.clears[mode])||ROUTE_ORDER.slice(index).some(id=>Boolean(base.clears[id]))||Boolean(base.clears[ROUTE_ORDER[index-1]]);}
export function classmateFor(id:string){const roster=abyssHero(id)?ABYSS_HEROES:PROTAGONISTS.filter(p=>studentChapter(p.id)===studentChapter(id));return roster[(roster.findIndex(p=>p.id===id)+1)%roster.length];}
export function personalStories(id:string){
 const hero=studentHero(id),profile=chronicleHero(hero.id);
 const englishName=profile.en[0].toUpperCase()+profile.en.slice(1);
 return STUDENT_STORIES[studentChapter(hero.id)].map(act=>({
  ...act,
  lines:[...act.lines.map(([ja,en])=>[ja.replaceAll('{hero}',hero.name),en.replace(/^\{hero\}/,englishName).replaceAll('{hero}',profile.en)] as const),
   ...(act.floor===21?[routeEpilogue('STORY')]:[])],
 }));
}
export interface TownBuilding {kind:string;x:number;name:string;en:string;npc?:boolean;actorId?:string;portrait?:string;}
export const TOWN_BUILDINGS:readonly TownBuilding[]=[
 {kind:'GUIDE',x:5,name:'旅の案内人',en:'Travel guide',npc:true},
 {kind:'INN',x:11,name:'ひだまりの宿',en:'Sunbeam inn'},
 {kind:'DOJO',x:19,name:'風来道場',en:'Wanderer dojo'},
 {kind:'SHOP',x:27,name:'旅の購買部',en:'Travel shop'},
 {kind:'SCOUT',x:33,name:'先帰りの学生',en:'Returning student',npc:true},
 {kind:'SMITH',x:39,name:'工作工房',en:'Craft workshop'},
 {kind:'BANK',x:47,name:'郵便・預かり所',en:'Mail and savings'},
 {kind:'WAREHOUSE',x:55,name:'旅支度の蔵',en:'Supply storehouse'},
 {kind:'STORY_GUIDE',x:61,name:'道しるべの先生',en:'Signpost teacher',npc:true},
 {kind:'FESTIVAL',x:67,name:'旅人の広場',en:'Travelers’ square'},
 {kind:'GATE',x:77,name:'ダンジョン入口',en:'Dungeon entrance'},
] as const;
export function townBuildings(home:boolean,heroId:string=PROTAGONISTS[0].id):TownBuilding[]{
 const homePositions:Record<string,number>={GUIDE:5,WAREHOUSE:13,DOJO:23,SCOUT:31,STORY_GUIDE:39,GATE:49};
 const guide=heroId==='elementary-dodgeball'?'elementary-warrior':'elementary-dodgeball';
 const unavailable=new Set([heroId,guide,classmateFor(heroId).id]);
 const scout=PROTAGONISTS.find(hero=>studentChapter(hero.id)===studentChapter(heroId)&&!unavailable.has(hero.id))
  ?? PROTAGONISTS.find(hero=>!unavailable.has(hero.id))!;
 const actors:Record<string,string>={GUIDE:guide,SCOUT:scout.id,STORY_GUIDE:'town-teacher'};
 return TOWN_BUILDINGS.filter(building=>!home||homePositions[building.kind]!==undefined).map(building=>({
  ...building,x:home?homePositions[building.kind]:building.x,actorId:actors[building.kind],
 }));
}
export function townDialogue(kind:string,heroId:string,clears:number,home:boolean,recruited=false):readonly Bilingual[]{
 if(kind==='SCOUT'){
  const friend=classmateFor(heroId),en=chronicleHero(friend.id).en;
  return recruited?[
   [`${friend.name}と一緒だったんだね。さっき姿が見えて、ほっとしたよ。`,`I saw you with ${en}. It was a relief to know you made it together.`],
   ['出発はいつでもいいんだし、宿の前で一息ついていったら？','There is no hurry to leave. Why not take a moment by the inn?'],
  ]:[
   [`途中で${friend.name}を見かけたよ。一人で奥へ向かったから、少し気になってる。`,`I saw ${en} heading deeper inside alone. I've been thinking about that ever since.`],
   ['会ったら声をかけてくれない？　同じ方へ行くなら、一緒に歩くだけで心強いよ。','Would you say hello if you meet? If you are going the same way, it helps to have someone beside you.'],
  ];
 }
 if(kind==='STORY_GUIDE'){
  if(!home)return [
   ['入り口まで道を見てきたよ。町を出たら、すぐ次の階だ。','I checked the road to the gate. The next floor starts as soon as you leave town.'],
   ['道具を買い忘れていないか、今のうちに確かめておいで。門は逃げないよ。','Check now if there is anything you meant to buy. The gate will still be there.'],
  ];
  return clears?[
   ['迷宮から帰ったんだね。今日は、前は白紙だったところに、新しい道を一本描けたよ。','You made it back from the labyrinth. Today I drew a road where the map used to be blank.'],
   ['次の行き先は町の奥の門で聞ける。どの道を歩くかは、急いで決めなくていい。','Ask at the far gate about the new routes. Take your time choosing where to go.'],
  ]:[
   ['町の地図は、帰ってきた旅人の話を聞きながら描いているんだ。まだ白い場所が多いだろう？','I draw the map from stories returning travelers tell me. See how much is still blank?'],
   ['最初の迷宮から戻ったら、君の見た道も教えてくれ。町の奥の門から行けるよ。','When you return from the first labyrinth, tell me what road you saw. The gate at the end of town will get you there.'],
  ];
 }
 return home?[
  ['ようこそ。初めてなら、道の右端まで行ってごらん。ダンジョンの門が見えるよ。','Welcome. If this is your first visit, follow the road to the right until you see the dungeon gate.'],
  ['扉の前でAか上を押せば入れる。心配なら、手前の道場で道具を使ってみるといい。','Press A or Up at a door to enter. If you want to try out your supplies, stop at the dojo first.'],
 ]:[
  ['おかえりと言うには早いかな。でも、ここにいる間はお腹もすかないし、時間も進まないよ。','Maybe it is too early to say welcome home, but while you are here, time and hunger stand still.'],
  ['出発するときは右端の門へ。前の階へ戻る道じゃないから、荷物を整えてから行っておいで。','Head to the far-right gate when ready. It takes you onward, so check your supplies before you go.'],
 ];
}
export function routeEpilogue(mode:AdventureMode):readonly [string,string]{const messages:Partial<Record<AdventureMode,readonly [string,string]>>={STORY:['戻った地図に、新しい分かれ道が浮かんだ。町の門から「放課後の一手」へ。','A new fork appears on the restored atlas. One Clever Move is now open at the town gate.'],PUZZLE:['解いた道順が工作室の鍵になった。町から「いたずら工作室」への街道が開通した。','The solved route becomes a workshop key. The road to Trap Workshop is now open.'],TRAPS:['仕掛けの記録をたどり、霧の校舎への道を見つけた。「なぞなぞ校舎」が開かれた。','The mechanism notes reveal a fogbound school. Mystery School is now open.'],MYSTERY:['道具の正体を書いたノートが新しい扉を開いた。「作戦ノートの30階」へ進める。','Your discoveries open a new door. Strategy Notebook is now accessible.'],CARDS:['作戦を届けた先で、身軽な旅の招待状をもらった。「体操服の挑戦」が開かれた。','Delivering your strategies earns an invitation. Gym-clothes Challenge is now open.'],NO_GEAR:['道具より大切な知恵を認められ、遠い山道が現れた。「手ぶらの99階」へ。','Your ingenuity reveals a distant mountain road. Empty-handed 99 Floors is now open.'],BARE:['遠い街道を歩き切った。町のみんなは、新しい道しるべに君の名前を刻んだ。','You walked the longest road. The townspeople carve your name into a new signpost.']};const bonus=expedition(mode);if(bonus)return [`${bonus.ja}を踏破。はじまりの町に新しい分かれ道が届いた。`,`${bonus.en} cleared. New routes await at Firstlight Town.`];return messages[mode]||['忘れ物を町へ届けた。次の旅へ備えよう。','The lost supplies are home. Prepare for your next journey.'];}
