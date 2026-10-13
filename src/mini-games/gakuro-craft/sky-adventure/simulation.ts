import {queueLearning} from '../furnitureLearning';
import type {HomeGame,HomeGameWorld} from '../homeGames';
import {platforms,coins,enemies,landmarks,STAGE_COUNT} from './level';
export const SKY_RELICS={boots:'風のブーツ',wings:'雲の羽',magnet:'星の磁石',shield:'おまもり',treasure:'宝探しの袋'} as const;
export type SkyRelic=keyof typeof SKY_RELICS;
export type SkyInput={x:number;z:number;dash:boolean;stomp:boolean;jump:number;attack:number};
export type SkyCommand={type:'game_sky_input';key:string;input:SkyInput}|{type:'game_sky_relic';key:string;relic:SkyRelic};
export type SkyRunner={x:number;y:number;z:number;vx:number;vz:number;vy:number;yaw:number;stage:number;hp:number;falls:number;jumps:number;grounded:boolean;groundAt:number;checkpoint:number;coins:number[];stars:number[];defeated:number[];relics:SkyRelic[];offers:SkyRelic[];quizQueued?:boolean;finished:boolean;input:SkyInput;inputAt:number;jumpAt:number;attackUntil:number;invincibleUntil:number;springAt:number;message:string};
export type SkyState={runners:Record<string,SkyRunner>;seed:number;time:number};
const emptyInput=():SkyInput=>({x:0,z:0,dash:false,stomp:false,jump:0,attack:0});
export function newRunner():SkyRunner{return {x:0,y:0,z:3,vx:0,vz:0,vy:0,yaw:Math.PI,stage:0,hp:5,falls:0,jumps:0,grounded:true,groundAt:0,checkpoint:0,coins:[],stars:[],defeated:[],relics:[],offers:[],finished:false,input:emptyInput(),inputAt:-10,jumpAt:-10,attackUntil:-10,invincibleUntil:-10,springAt:-10,message:'星を3つ集めて頂上の門へ！'};}
export function startSky(w:HomeGameWorld,g:HomeGame){g.sky={runners:Object.fromEntries(g.players.map(id=>[id,newRunner()])),seed:Math.floor(w.time*1000)%100000,time:0};g.deadline=w.time+1800;}
export function skyCommand(w:HomeGameWorld,g:HomeGame,id:string,c:SkyCommand){const r=g.sky?.runners[id];if(!r||r.finished||w.learning?.[id]?.due)return false;
 if(c.type==='game_sky_relic'){if(!r.offers.includes(c.relic))return false;r.relics.push(c.relic);r.offers=[];r.stage++;r.quizQueued=false;resetPosition(r,false);r.coins=[];r.stars=[];r.defeated=[];r.checkpoint=0;r.hp=5;r.message='次の空島を探索しよう！';g.revision++;return true;}
 if(r.offers.length)return false;
 const v=c.input;if(!v||![v.x,v.z,v.jump,v.attack].every(Number.isFinite)||!Number.isInteger(v.jump)||!Number.isInteger(v.attack)||v.jump<0||v.attack<0)return false;
 const n=Math.max(1,Math.hypot(v.x,v.z));const old=r.input;
 if(v.jump>old.jump&&v.jump-old.jump<=2)r.jumpAt=w.time;
 if(v.attack>old.attack&&v.attack-old.attack<=2&&w.time>r.attackUntil+.25)r.attackUntil=w.time+.3;
 r.input={x:Math.max(-1,Math.min(1,v.x/n)),z:Math.max(-1,Math.min(1,v.z/n)),dash:!!v.dash,stomp:!!v.stomp,jump:v.jump,attack:v.attack};r.inputAt=w.time;return true;
}
function resetPosition(r:SkyRunner,checkpoint=true){const cp=landmarks(r.stage,0).checkpoint;r.x=checkpoint&&r.checkpoint?cp.x:0;r.y=checkpoint&&r.checkpoint?cp.y:0;r.z=checkpoint&&r.checkpoint?cp.z:3;r.vx=r.vz=r.vy=0;r.grounded=true;r.jumps=0;r.jumpAt=-10;r.input.x=r.input.z=0;}
const has=(r:SkyRunner,k:SkyRelic)=>Math.min(3,r.relics.filter(x=>x===k).length);
const near=(r:SkyRunner,p:{x:number;y:number;z:number},range=1)=>Math.hypot(r.x-p.x,r.z-p.z)<range&&Math.abs(r.y-p.y)<1.6;
function hurt(r:SkyRunner,time:number,fall=false){if(!fall&&time<r.invincibleUntil)return;r.hp-=1;r.invincibleUntil=time+2+has(r,'shield')*1.5;if(fall){r.falls++;resetPosition(r);}else {r.vy=6;r.grounded=false;}if(r.hp<=0){r.hp=5;r.coins=[];r.stars=[];r.defeated=[];r.checkpoint=0;resetPosition(r,false);r.message='もう一度挑戦！星はこの島で集め直そう。';}else r.message=fall?'旗から再開！':'おばけに注意！踏むかアタックしよう。';}
function step(r:SkyRunner,time:number,dt:number){
 const ps=platforms(r.stage,time).filter(p=>p.active!==false),lm=landmarks(r.stage,time),i=time-r.inputAt<.35?r.input:emptyInput(),speed=(i.dash?8:5.5)+has(r,'boots')*.7;
 if(time-r.jumpAt<.14&&(r.grounded||time-r.groundAt<.1||r.jumps<2)){r.vy=(r.jumps===1?8:9.8)+has(r,'wings')*.7;r.jumps++;r.grounded=false;r.jumpAt=-10;}
 const acceleration=1-Math.exp(-(r.grounded?(ps.some(p=>p.kind==='ice'&&Math.abs(r.x-p.x)<p.w/2&&Math.abs(r.z-p.z)<p.d/2)?3:16):7)*dt);r.vx+=(i.x*speed-r.vx)*acceleration;r.vz+=(i.z*speed-r.vz)*acceleration;
 if(Math.hypot(i.x,i.z)>.1)r.yaw=Math.atan2(i.x,i.z);
 const previousY=r.y;r.vy-=23*dt;if(i.stomp&&!r.grounded)r.vy=Math.min(r.vy,-17);
 const oldX=r.x,oldZ=r.z;r.x+=r.vx*dt;r.z+=r.vz*dt;r.y+=r.vy*dt;
 for(const p of ps){if(r.y+1.65>p.y-p.h&&r.y<p.y-.18){if(Math.abs(r.x-p.x)<p.w/2+.3&&Math.abs(oldZ-p.z)<p.d/2+.3)r.x=oldX;if(Math.abs(r.x-p.x)<p.w/2+.3&&Math.abs(r.z-p.z)<p.d/2+.3)r.z=oldZ;}}
 r.grounded=false;
 for(const p of ps){if(Math.abs(r.x-p.x)<p.w/2+.22&&Math.abs(r.z-p.z)<p.d/2+.22&&r.vy<=0&&previousY>=p.y-.05&&r.y<=p.y){r.y=p.y;r.vy=0;r.grounded=true;r.groundAt=time;r.jumps=0;if(p.moving){const next=platforms(r.stage,time+dt).find(v=>v.id===p.id)!;r.x+=next.x-p.x;r.z+=next.z-p.z;r.y+=next.y-p.y;}if(p.kind==='belt')r.x+=1.1*dt;if(p.kind==='fan'&&Math.abs(r.x-p.x)<1&&Math.abs(r.z-p.z)<1){r.vy=10;r.grounded=false;}if(p.spring&&Math.abs(r.x-p.x)<.8&&Math.abs(r.z-p.z)<.8&&time>r.springAt+.7){r.vy=13;r.grounded=false;r.springAt=time;r.message='ジャンプ台で高く飛ぼう！';}break;}}
 if(r.y<-14||Math.hypot(r.x,r.z)>80){hurt(r,time,true);return;}
 if(near(r,lm.checkpoint,2)&&!r.checkpoint){r.checkpoint=1;r.message='チェックポイント！';}
 coins(r.stage,time).forEach((c,k)=>{if(!r.coins.includes(k)&&near(r,c,1+has(r,'magnet')*.8)){r.coins.push(k);if(r.coins.length>=8&&!r.stars.includes(0)){r.stars.push(0);r.message='コインの星を獲得！';}}});
 if(near(r,lm.switch,1.3)&&!r.stars.includes(1)){r.stars.push(1);r.message='スイッチの星を獲得！';}
 if(near(r,lm.summit,1.2)&&!r.stars.includes(2)){r.stars.push(2);r.message='頂上の星を獲得！';}
 for(const e of enemies(r.stage,time)){if(r.defeated.includes(e.id)||!near(r,e,.95))continue;if(r.vy<-1&&r.y>e.y+.5||time<r.attackUntil){r.defeated.push(e.id);r.vy=8;r.grounded=false;r.hp=Math.min(5,r.hp+1);r.message='おばけを追い払った！';}else if(!has(r,'shield')||time>r.invincibleUntil)hurt(r,time);}
 if(r.stars.length===3&&r.grounded&&near(r,lm.goal,1.3)){if(r.stage===STAGE_COUNT-1){r.finished=true;r.message='30ステージを踏破！';}else{const keys=Object.keys(SKY_RELICS) as SkyRelic[];r.offers=[0,1,2].map(n=>keys[(r.stage*2+n+r.coins.length)%keys.length]);r.message='島をクリア！次の島への強化を選ぼう。';}}
}
export function tickSky(w:HomeGameWorld,g:HomeGame,dt:number){if(!g.sky)return;g.sky.time+=Math.min(.1,Math.max(0,dt));const steps=Math.max(1,Math.ceil(Math.min(.1,dt)*60)),delta=Math.min(.1,Math.max(0,dt))/steps;
 for(const id of g.players){const r=g.sky.runners[id];if(!r)continue;if(!r.finished&&!r.offers.length&&!w.learning?.[id]?.due)for(let n=0;n<steps;n++)step(r,w.time-delta*(steps-n-1),delta);if((r.finished||r.offers.length)&&!r.quizQueued&&(r.stage+1)%3===0){queueLearning(w,id,'stages');r.quizQueued=true;}const seat=g.players.indexOf(id);g.scores[seat]=r.stage*1000+r.stars.length*200+r.coins.length*(has(r,'treasure')?20:10)+r.defeated.length*50+(r.finished?1500:0)-r.falls*30;g.scores[seat]=Math.max(0,g.scores[seat]);}
 if(g.players.some(id=>w.learning?.[id]?.due))g.deadline+=Math.min(.1,dt);
 if(w.time>=g.deadline||g.players.every(id=>g.sky!.runners[id]?.finished&&!w.learning?.[id]?.due)){g.phase='finished';const best=Math.max(...g.scores);g.winner=g.scores.map((s,i)=>s===best?i:-1).filter(i=>i>=0);g.message='空島の冒険が終了しました！';g.revision++;}
}
