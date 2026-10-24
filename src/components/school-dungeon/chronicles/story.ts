import routes from './routes.json';
import personalities from './heroes.json';
export type ChronicleBranch='release'|'accord'|'defy';
export type Bilingual=readonly[string,string];
export interface ChronicleRun{version:1;mode:string;heroId:string;seen:number[];choices:Partial<Record<number,ChronicleBranch>>;pending?:{stage:number;line:number};ending?:ChronicleBranch;completed?:boolean;}
export interface ChronicleRecord{series:1|2;mode:string;heroId:string;ending:ChronicleBranch;title:Bilingual;}
export const CHRONICLE_ROUTES=routes;
export const CHRONICLE_HEROES=personalities;
export const chronicleRoute=(mode:string)=>routes.find(r=>r.id===mode)||routes[0];
export const chronicleHero=(id:string)=>personalities.find(h=>h.id===id)||personalities[0];
export const newChronicle=(mode:string,heroId:string):ChronicleRun=>({version:1,mode,heroId,seen:[],choices:{}});
export function chronicleStage(floor:number,goal:number,run:ChronicleRun){return [1,Math.max(2,Math.ceil(goal*.4)),Math.max(3,Math.ceil(goal*.75))].findIndex((at,i)=>floor>=at&&!run.seen.includes(i));}
export function chronicleEnding(run:ChronicleRun):ChronicleBranch{
 const scores={release:0,accord:0,defy:0};for(const branch of Object.values(run.choices))if(branch in scores)scores[branch!]++;
 const last=run.choices[2]||run.choices[1]||run.choices[0]||'accord',max=Math.max(...Object.values(scores));return scores[last]===max?last:(Object.keys(scores)as ChronicleBranch[]).find(k=>scores[k]===max)!;
}
export function chooseChronicle(run:ChronicleRun,stage:number,branch:ChronicleBranch){if(!['release','accord','defy'].includes(branch)||stage<0||stage>2||!Number.isInteger(stage)||run.seen.includes(stage))return false;run.choices[stage]=branch;run.seen.push(stage);delete run.pending;return true;}
export const CHRONICLE_CHOICES:{id:ChronicleBranch;label:Bilingual;detail:Bilingual}[]=[
 {id:'release',label:['手放して、奪われたものを返す','Let go and return what was taken'],detail:['失うものを引き受け、仕組みを終わらせる。','Accept a loss and end the system.']},
 {id:'accord',label:['一人に背負わせず、約束を結び直す','Share the burden and remake the promise'],detail:['責任を分け、誰か一人の犠牲に頼らない。','Share responsibility instead of relying on a sacrifice.']},
 {id:'defy',label:['二つの答えを拒み、別の道を作る','Refuse the dilemma and make another road'],detail:['答えのない問いも抱え、自分たちで進む。','Carry the unanswered question and move forward together.']},
];
export function chronicleScene(run:ChronicleRun,heroName:string,series:1|2,stage:number){
 const route=chronicleRoute(run.mode),hero=chronicleHero(run.heroId),end=route.endings.find(e=>e.id===(run.ending||chronicleEnding(run)))!,npc=route.npc as [string,string];
 const line=(speaker:Bilingual,text:readonly string[])=>({speaker,text:text as Bilingual});
 const you:[string,string]=[heroName,hero.en],narrator:[string,string]=['街道の記録','Roadside chronicle'];
 let lines:ReturnType<typeof line>[];
 if(stage===0)lines=[line(narrator,route.premise),line(npc,['旅人、出口だけが欲しいなら、私のことは聞かないで。','Traveler, if you want only an exit, do not ask about me.']),line(you,hero.open),line(npc,[`それなら聞いて。${route.price[0]}`,`Then listen. ${route.price[1]}`]),line(you,[`${route.npc[0]}。${hero.vow[0]}`,`${route.npc[1]}. ${hero.vow[1]}`]),line(narrator,series===2?['深淵へ続く道で、前の旅の正解だけは通用しなかった。','On the road into the abyss, yesterday’s right answer was no longer enough.']:['この出会いを、あとで「ただの寄り道」と呼ぶことはできなかった。','You would never again call this meeting a mere detour.'])];
 else if(stage===1)lines=[line(npc,route.truth),line(you,hero.doubt),line(npc,['本当のことを知れば優しくなれる、なんて嘘だった。知ってしまった後のほうが、選ぶのは難しい。','Knowing the truth did not make kindness simple. It made choosing harder.']),line(you,[`それでも、${route.npc[0]}を仕組みの名前だけで呼びたくない。`,`Even so, I will not reduce ${route.npc[1]} to a part of the machinery.`]),line(npc,route.price),line(you,hero.vow)];
 else if(stage===2){const prior=run.choices[1]||run.choices[0]||'accord';lines=[line(narrator,[`あなたが選んだ「${CHRONICLE_CHOICES.find(c=>c.id===prior)!.label[0]}」は、もう誰かの生活を変えていた。`,`Your decision to ${CHRONICLE_CHOICES.find(c=>c.id===prior)!.label[1].toLowerCase()} has already changed someone’s life.`]),line(npc,['今なら、私一人を悪者にして終われる。それが一番、簡単な記録になる。','You can still make me the villain. That would be the simplest history to write.']),line(you,hero.resolve),line(npc,[`では、最後にもう一度。${route.price[0]}`,`Then once more. ${route.price[1]}`]),line(you,['簡単な物語にするために、あなたを置いていかない。','I will not leave you behind to make the story simpler.']),line(narrator,['約束を守ることと、約束に縛ることは違う。最後の返事を、自分の声で選ぶ時が来た。','Keeping a promise is not the same as keeping someone bound to it. The final answer must be your own.'])];}
 else lines=[line(narrator,end.consequence),line(npc,['何を失ったかは、忘れないで。でも、失ったものだけで私たちを数えないでほしい。','Remember what was lost. But do not measure us only by our losses.']),line(you,hero.resolve),line(npc,[`${heroName}。あなたがいても同じ結末だった、とは言わない。あなたがいたから、この続きになった。`,`${hero.en}. I will not say this would have happened without you. You made this continuation possible.`]),line(you,[`${route.npc[0]}、${hero.farewell[0]}`,`${route.npc[1]}, ${hero.farewell[1]}`]),line(narrator,['迷宮は終わった。けれど、出会った人の暮らしはエンディングの外でも続いていく。','The dungeon is over. The lives you touched continue beyond its ending.'])];
 return {heroId:run.heroId,branch:end.id,routeId:route.id,title:[...(stage===3?end.title:route.title)]as unknown as Bilingual,npc,portrait:`sprites/dungeons-chronicles/npc/${route.id.toLowerCase()}.webp`,eventArt:`sprites/dungeons-chronicles/event/${route.id.toLowerCase()}.webp`,lines,stage,ending:stage===3};
}
