import routes from './routes.json';
import personalities from './heroes.json';
export type ChronicleBranch='release'|'accord'|'defy';
export type Bilingual=readonly[string,string];
export interface ChronicleRun{version:1;mode:string;heroId:string;seen:number[];choices:Partial<Record<number,ChronicleBranch>>;pending?:{stage:number;line:number};ending?:ChronicleBranch;completed?:boolean;}
export interface ChronicleRecord{series:1|2;mode:string;heroId:string;ending:ChronicleBranch;title:Bilingual;}
export const CHRONICLE_ROUTES=routes;
export const CHRONICLE_HEROES=personalities;
export const chronicleRoute=(mode:string)=>routes.find(r=>r.id===mode)||routes[0];
export const chronicleArtSlug=(mode:string)=>{const route=chronicleRoute(mode);return (route.art||route.id).toLowerCase();};
export const chronicleBackground=(mode:string)=>`sprites/dungeons-chronicles/background/${chronicleArtSlug(mode)}.webp`;
export function chronicleNpcArt(mode:string){
 const slug=chronicleArtSlug(mode);
 return {actorId:`chronicle-${slug}`,portrait:`sprites/dungeons-chronicles/npc/${slug}.webp`};
}
export const chronicleHero=(id:string)=>personalities.find(h=>h.id===id)||personalities[0];
export const newChronicle=(mode:string,heroId:string):ChronicleRun=>({version:1,mode,heroId,seen:[],choices:{}});
export function chronicleStage(floor:number,goal:number,run:ChronicleRun){return [1,Math.max(2,Math.ceil(goal*.4)),Math.max(3,Math.ceil(goal*.75))].findIndex((at,i)=>floor>=at&&!run.seen.includes(i));}
export function chronicleEnding(run:ChronicleRun):ChronicleBranch{
 const scores={release:0,accord:0,defy:0};for(const branch of Object.values(run.choices))if(branch in scores)scores[branch!]++;
 const last=run.choices[2]||run.choices[1]||run.choices[0]||'accord',max=Math.max(...Object.values(scores));return scores[last]===max?last:(Object.keys(scores)as ChronicleBranch[]).find(k=>scores[k]===max)!;
}
export function chooseChronicle(run:ChronicleRun,stage:number,branch:ChronicleBranch){if(!['release','accord','defy'].includes(branch)||stage<0||stage>2||!Number.isInteger(stage)||run.seen.includes(stage))return false;run.choices[stage]=branch;run.seen.push(stage);delete run.pending;return true;}
const CHRONICLE_CHOICES:Record<ChronicleBranch,Bilingual>={
 release:['今の決まりをやめる','End the old rule'],
 accord:['みんなで引き受ける','Share the work'],
 defy:['別の方法を試す','Try another way'],
};

export function chronicleScene(run:ChronicleRun,heroName:string,series:1|2,stage:number){
 const route=chronicleRoute(run.mode),hero=chronicleHero(run.heroId);
 const choices=route.endings.map(e=>({id:e.id as ChronicleBranch,label:CHRONICLE_CHOICES[e.id as ChronicleBranch],detail:e.choice as unknown as Bilingual}));
 const end=route.endings.find(e=>e.id===(run.ending||chronicleEnding(run)))!;
 const npc=route.npc as [string,string],you:Bilingual=[heroName,hero.en],narrator:Bilingual=['街道の記録','Roadside chronicle'];
 const line=(speaker:Bilingual,text:readonly string[])=>({speaker,text:text as Bilingual});
 let lines:ReturnType<typeof line>[];
 if(stage===0)lines=[
  line(narrator,route.premise),line(npc,route.request),line(you,hero.open),line(npc,route.price),
  line(you,hero.vow),line(narrator,series===2?['先へ続く階段から、冷たい風が上がってきた。歩き出す前に、まず返事をしよう。','Cold air rose from the stairs ahead. Before you set out, give an answer.']:['遠くで足音がした。先へ進む前に、どんな手を貸せるか考えた。','Footsteps echoed in the distance. Before going on, you considered how you could help.']),
 ];
 else if(stage===1)lines=[
  line(narrator,route.truth),line(you,hero.doubt),line(npc,['あの時は、こうするしかないと思った。今は、私一人で決めることじゃないと思っています。','At the time I thought it was my only choice. Now I know it is not mine alone to make.']),
  line(npc,route.price),line(you,hero.vow),line(narrator,['すぐに決めきれないことは、次に会う時まで考えておいていい。今の考えを伝えよう。','There will be time to think over what you cannot settle today. Say what you think for now.']),
 ];
 else if(stage===2){
  const previous=run.choices[1]||run.choices[0];
  const earlier=choices.find(choice=>choice.id===previous)?.detail||route.request;
  lines=[
   line(narrator,route.truth),line(npc,['この先をどうするか、そろそろ決めよう。前に話したことも、覚えているよ。','It is nearly time to decide what happens next. I remember what we talked about.']),
   line(previous?narrator:npc,earlier),line(you,hero.resolve),line(npc,route.price),
   line(narrator,['返事を変えてもいい。ここまで見たことを思い出し、最後に何をするか伝えよう。','You can change your mind. Think of what you have seen, then say what you will do.']),
  ];
 }else lines=[
  line(narrator,end.consequence),line(npc,['話を聞いてくれてありがとう。あの時、立ち止まってくれてよかった。','Thank you for listening. I am glad you stopped that day.']),
  line(you,hero.resolve),line(npc,[`${heroName}、帰り道は足元に気をつけて。`,`${hero.en}, watch your step on the way home.`]),
  line(you,['またここを通ったら、続きを聞かせてね。','When I pass through again, tell me what happened next.']),line(narrator,['迷宮の出口では外の風がした。歩き慣れた道を、今日は少しゆっくり帰った。','Outside the labyrinth, a breeze was blowing. You walked the familiar road a little slower today.']),
 ];
 const title=stage===3?end.title:route.title;
 return {heroId:run.heroId,branch:end.id,routeId:route.id,title:title as unknown as Bilingual,npc,...chronicleNpcArt(route.id),background:chronicleBackground(route.id),lines,choices,stage,ending:stage===3};
}
