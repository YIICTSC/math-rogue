import {STORY_VARIANTS,NPC_EVENT_BACKGROUNDS,storyEventArt} from './storyVariants';
import type { Adventurer, Site, World } from './engine';
import { activityBusy, grant } from './activities';
export const STORIES = [
 {id:'letter',title:'届かなかった手紙',npc:'郵便屋リノ',portrait:'sprites/rpg/npcs/rino.webp',x:34,y:64,goalX:53,goalY:72,goal:'風車の郵便箱',intro:'時計塔が止まった日から、旅人の手紙が届かないの。東の風車に、一通だけ残っているはず。届ける相手を一緒に探してくれる？',discovery:'「またここで会おう」。宛名はない。でも封筒には、郵便屋リノと同じ小さな羽根の印がある。',returning:'これは昔の私が、未来の自分へ書いた手紙……。忘れていた約束を届けてくれて、ありがとう。',endings:['リノは旅人のための郵便所を開いた。新しい道しるべに、あなたの名が刻まれる。','リノと草原でお茶を飲んだ。急がなくても、届く想いがあると知った。']},
 {id:'seed',title:'森が覚えている歌',npc:'森番フィル',portrait:'sprites/rpg/npcs/phil.webp',x:39,y:27,goalX:19,goalY:12,goal:'歌う大樹',intro:'大樹の歌が聞こえなくなった。北西の根元に残る「記憶の種」を探してほしい。森を切るか、守るか……決める前に声を聞こう。',discovery:'幹に触れると、幼い森番の歌声が響く。種は枯れていない。長い冬を待っていただけだ。',returning:'種は生きていたんだな。木材を売れば町を救える。でも森と生きる方法もあるはずだ。君ならどうする？',endings:['落ちた枝だけを集める工房が生まれた。森も町も、少しずつ息を吹き返す。','種を植え、森番と歌った。若木の下で休む旅人が増えていった。']},
 {id:'bell',title:'水底の約束',npc:'渡し守ミオ',portrait:'sprites/rpg/npcs/mio.webp',x:105,y:57,goalX:78,goalY:73,goal:'沈んだ鐘楼',intro:'水の底で鐘が鳴る夜は、船を出せない。沈んだ鐘楼の石碑を読んで、鳴り続ける理由を教えて。',discovery:'石碑には「帰る者のために灯を」とある。鐘の音は警告ではなく、迷った船への道案内だった。',returning:'怖がるばかりで、声を聞こうとしなかった。鐘楼を町のために使いたい。何を残そうか？',endings:['鐘楼に航路の標識が立ち、夜の渡し船が戻った。町の市場に笑い声が満ちる。','鐘楼を小さな祈りの場所にした。渡し守は帰らない人にも灯をともし続ける。']},
 {id:'compass',title:'砂に消えた旅路',npc:'地図師サハ',portrait:'sprites/rpg/npcs/saha.webp',x:79,y:26,goalX:111,goalY:14,goal:'琥珀の道標',intro:'古い地図と今の砂丘は形が違う。北東の道標に残る星の印を写してきて。失われた商路を、もう一度つなぎたい。',discovery:'星の印は道の位置ではなく、夜空を見る時刻を示している。砂が動いても、星は道を教えてくれる。',returning:'固定した線ばかり見ていたよ。地図は完成した。商人に渡すか、誰もが見られる場所に残すか……。',endings:['商隊は安全に砂丘を越えた。サハは報酬を受け取り、次の地図を描き始める。','道標に星の地図を刻んだ。名もない旅人たちが、互いの道しるべになった。']},
 {id:'lantern',title:'雪原の最後の灯',npc:'灯台守ユキ',portrait:'sprites/rpg/npcs/yuki.webp',x:145,y:65,goalX:174,goalY:76,goal:'凍った観測所',intro:'吹雪で灯台の結晶が砕けてしまった。東の観測所なら、予備の結晶が残っている。無理はしないでね。',discovery:'観測所の日誌には、吹雪の中でも星を記録した人々の名前が並ぶ。最後のページに、灯台の結晶が包まれていた。',returning:'この光があれば帰り道が見える。灯台を強く照らすか、旅人に小さな灯を分けるか、選んでくれる？',endings:['大きな灯が峠を照らし、観測所への往来が戻った。忘れられた記録が町へ届く。','結晶を小さな灯に分けた。雪原を渡る人々の光が、新しい星座のようにつながる。']},
 {id:'clock',title:'止まった時計の明日',npc:'時計師トワ',portrait:'sprites/rpg/npcs/towa.webp',x:144,y:26,goalX:176,goalY:33,goal:'記憶の歯車庫',intro:'時計塔は、過去を守ろうとして時を止めた。東の歯車庫にある未完成の歯車を見つけて。未来を選ぶ鍵になる。',discovery:'歯車の欠けた部分には、まだ文字がない。完成させるのは過去の時計師ではなく、今ここにいる人の役目だ。',returning:'元通りに直すだけでは、同じことを繰り返すかもしれない。時計を町の暦にするか、一人ひとりの歩幅を刻むか。',endings:['町は新しい暦を手に入れた。過去の失敗を記した祝日に、人々は集まり語り合う。','時計は急がせる音をやめた。人々はそれぞれの歩幅で、明日へ進み始める。']},
] as const;
export type StoryProgress = {variant?:number;stage:'accepted'|'found'|'complete';ending?:number};
export type StoryAction = {type:'story-choice';siteId:string;choice:'accept'|'search'|'restore'|'share'};
export function storyForSite(site:Site,p?:Adventurer){const base=STORIES.find(s=>s.id===site.storyId);if(!base)return undefined;const index=STORIES.findIndex(s=>s.id===base.id);const n=p?.stories?.[base.id]?.variant??site.storyVariant??0;const variant=Number.isInteger(n)&&n>=0&&n<4?n:0;const extra=STORY_VARIANTS[index][variant];return {...base,...(extra?{title:extra.title.ja,goal:extra.goal.ja,intro:extra.intro.ja,discovery:extra.discovery.ja,returning:extra.returning.ja,endings:extra.endings.map(v=>v.ja)}:{}),variant,background:NPC_EVENT_BACKGROUNDS[index],illustration:storyEventArt(index,variant)};}
export function applyStory(w:World,p:Adventurer,action:StoryAction):boolean {
 const site=w.sites.find(s=>s.id===action.siteId);
 const story=site?storyForSite(site,p):undefined;
 if(!site||!story||w.ended||p.nativeScene||activityBusy(w,p)||!p.profile||Math.abs(p.x-site.x)+Math.abs(p.y-site.y)>2)return false;
 const progress=p.stories?.[story.id];
 let next:StoryProgress;
 if(site.storyRole==='npc'&&!progress&&action.choice==='accept')next={stage:'accepted'};
 else if(site.storyRole==='goal'&&progress?.stage==='accepted'&&action.choice==='search')next={stage:'found'};
 else if(site.storyRole==='npc'&&progress?.stage==='found'&&['restore','share'].includes(action.choice)) {
  const ending=action.choice==='restore'?0:1;
  next={stage:'complete',ending};
  grant(p,{remove:[],cards:[],gold:ending===0?45:20,heal:ending===0?0:Math.ceil(p.maxHp*.4)});
 } else return false;
 next.variant=story.variant;p.stories={...p.stories,[story.id]:next};
 p.interactionCount++;
 p.message=next.stage==='complete'?story.endings[next.ending!]:next.stage==='found'?story.discovery:story.intro;
 w.revision++;
 return true;
}
export function storyDialogue(site:Site,p:Adventurer) {
 const story=storyForSite(site,p)!;
 const progress=p.stories?.[story.id];
 const choices:Array<{id:StoryAction['choice'];label:string}>=[];
 let text:string=story.intro;
 if(progress?.stage==='complete')text=story.endings[progress.ending||0];
 else if(site.storyRole==='goal') {
  text=progress?story.discovery:`ここには誰かの物語が眠っている。${story.npc}に話を聞いてみよう。`;
  if(progress?.stage==='accepted')choices.push({id:'search',label:'手がかりを持ち帰る'});
 } else if(progress?.stage==='found') {
  text=story.returning;
  choices.push({id:'restore',label:'町の復興に役立てる（45G）'},{id:'share',label:'人々と分かち合う（20G・HP40%回復）'});
 } else if(progress?.stage==='accepted')text=`${story.goal}を調べてきて。道は地図で確認できるよ。`;
 else choices.push({id:'accept',label:'依頼を引き受ける'});
 return {story,text,choices};
}
