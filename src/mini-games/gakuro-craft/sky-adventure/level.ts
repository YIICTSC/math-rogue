export const STAGE_COUNT=30;
export type Platform={id:string;x:number;y:number;z:number;w:number;d:number;h:number;moving?:boolean;spring?:boolean;active?:boolean;kind?:'ice'|'belt'|'blink'|'fan'|'lift'};
const themes=['風の草原島','夕焼けの時計塔','星空の水晶島','雲の回廊','歯車の空中庭園','水辺の浮島','氷の天空路','ベルト工房','消える星橋','風車の頂'];
export const STAGE_NAMES=Array.from({length:30},(_,i)=>themes[i%10]);
const colors=[['#72c6ed','#5eae58','#e1bb79'],['#edb89b','#b98b61','#a87753'],['#253563','#6586bb','#9b8ee4'],['#9fdcec','#8ac6b1','#cebfa1'],['#abc4d0','#bc9b67','#7f7563'],['#62bed3','#65b092','#dac27c'],['#b1dcea','#d1ecf1','#b6d1e0'],['#cabcb4','#7c998f','#d2a674'],['#493c72','#b19ace','#967fbc'],['#92d6c9','#7ab365','#bea273']];
export const STAGE_COLORS=Array.from({length:30},(_,i)=>colors[i%10]);
// Authored turns create ten distinct routes. Three tiers vary floor width, height and moving-floor speed.
const turns=[[0,0,0,0,0,0],[0,.7,.7,-.7,-.7,0],[0,-.7,-.7,.7,.7,0],[.9,.9,0,-.9,-.9,0],[-.9,-.9,0,.9,.9,0],[.6,-.6,.6,-.6,.6,0],[-.5,0,.5,0,-.5,0],[.7,-.7,.7,-.7,.7,0],[-.7,.7,-.7,.7,-.7,0],[.8,.4,-.4,-.8,0,0]];
export function platforms(stage:number,time:number):Platform[]{const theme=stage%10,tier=Math.floor(stage/10),height=1+tier*.08;let x=0,z=-8;const out:Platform[]=[{id:'home',x:0,y:0,z:0,w:12,d:12,h:3}];
 for(let i=1;i<=7;i++){if(i>1){const a=turns[theme][i-2];x+=Math.sin(a)*5.3;z-=Math.cos(a)*4.6;}const p:Platform={id:['','step1','step2','camp','spring','switch','bridge','summit'][i],x,y:i*height,z,w:i===7?8:i===3?6:4.8-tier*.2,d:i===7?6:i===3?5.2:4,h:2+i*.55,active:true};if(i===4)p.spring=true;
 if(i===6||theme===4&&i===2){p.moving=true;p.x+=Math.sin(time*(.45+tier*.08)+i)*(.55+tier*.1);}
 if(theme===3&&i===6){p.kind='lift';p.y+=Math.sin(time*.65)*.3;}
 if(theme===6&&(i===2||i===5))p.kind='ice';if(theme===7&&(i===2||i===6))p.kind='belt';if(theme===8&&i===2){p.kind='blink';p.active=time%5<3.8;}if(theme===9&&(i===2||i===5))p.kind='fan';out.push(p);}
 const camp=out[3];out.push({id:'secret',x:camp.x-5.5,y:camp.y,z:camp.z,w:4.5,d:5,h:3});return out;}
export function coins(stage:number,time:number){const ps=platforms(stage,time);return Array.from({length:27},(_,i)=>{const p=ps[i>=24?8:Math.floor(i/3)];return {x:p.x+(i%3-1)*.9,y:p.y+.7,z:p.z+.5};});}
export function landmarks(stage:number,time:number){const ps=platforms(stage,time),s=ps[5],top=ps[7],camp=ps[3];return {switch:{x:s.x,y:s.y,z:s.z},summit:{x:top.x-2,y:top.y,z:top.z},goal:{x:top.x+2,y:top.y,z:top.z-1},checkpoint:{x:camp.x,y:camp.y,z:camp.z}};}
export const COINS=coins(0,0),SWITCH=landmarks(0,0).switch,SUMMIT=landmarks(0,0).summit,GOAL=landmarks(0,0).goal;
export function enemies(stage:number,time:number){return [1,2,3].slice(0,Math.min(3,1+Math.floor(stage/3))).map(id=>{const p=platforms(stage,time)[id===1?2:id===2?5:7];return {id,x:p.x+Math.sin(time*(.65+id*.08)+id)*1.1,y:p.y,z:p.z+Math.cos(time*.5+id)*.6};});}
