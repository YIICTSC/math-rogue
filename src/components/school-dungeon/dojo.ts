/** Fifty independent, deterministic lessons. State is separate from expedition equipment. */
export type DojoAction={type:'COLLECT'}|{type:'PLACE'}|{type:'FACE';dx:number;dy:number}|{type:'ATTACK'}|{type:'MOVE';dx:number;dy:number}|{type:'WAIT'}|{type:'TOOL'}|{type:'EAT'};
export interface DojoStage {id:number;name:string;en:string;lesson:string;english:string;hint:string;hintEn:string;map:string[][];start:{x:number;y:number};goal:{x:number;y:number};limit:number;food:number;tool:string;charges:number;enemies:{x:number;y:number;damage:number;sleep:number}[];traps:{x:number;y:number}[];key:{x:number;y:number}|null;}
export interface DojoRun {pouch?:number;used?:string[];stage:number;x:number;y:number;dir:{x:number;y:number};turns:number;hp:number;food:number;charges:number;tool:string;key:boolean;map:string[][];enemies:DojoStage['enemies'];traps:DojoStage['traps'];revealed:boolean;won:boolean;failed:boolean;message:string;}
const topics=[
 ['一歩と一ターン','A step is a turn','階段への最短経路を考えよう。','Find the shortest route to the stairs.','曲がり角の内側を通ると手数を節約できる。','Take the inside route at corners.'],
 ['向きと壁の角','Facing and corners','向き変更はターンを使わない。向きを変え、壁の角を避けて階段へ。','Face without spending a turn, then avoid blocked diagonal corners.','通路では上下左右、広い場所では斜めを使おう。','Use straight steps in corridors and diagonals in rooms.'],
 ['通路の一対一','One at a time','敵に向かって歩くと攻撃。敵が並ぶ通路で一体ずつ。','Move toward a foe to attack. Fight one at a time in a corridor.','敵のHPは3。2回攻撃で倒せるが、隣接すると反撃される。','Foes have 3 HP. Two attacks defeat one, but adjacent foes strike back.'],
 ['眠らせて通る','Sleep and pass','ホイッスルで近くの敵を眠らせ、反撃を止めよう。','A whistle puts nearby foes to sleep and prevents retaliation.','距離2以内で道具を使い、眠っているうちに進もう。','Use the tool within two tiles, then pass while they sleep.'],
 ['一直線の道具','Line of sight','傘の魔法は向いている方向の一直線に届く。','Umbrella magic travels along the direction you face.','敵と同じ列で道具を使おう。壁を貫通しない。','Face a foe in the same row or column. Walls block the ray.'],
 ['水路の備え','Crossing water','浮き輪を使ってから水路へ入ろう。','Activate the float before entering water.','道具を使うと、この練習中ずっと水を渡れる。','The float remains active for the entire lesson.'],
 ['罠を調べる','Checking traps','虫めがねで罠を見つけてから、安全な道へ。','Reveal traps with a magnifier and choose a safe route.','赤い罠はHP3減。遠回りと手数を比べよう。','Red traps cost 3 HP. Compare detours with the turn budget.'],
 ['お腹とお弁当','Food planning','お腹が0だと毎ターンHPが減る。早めに食べよう。','An empty belly drains HP every turn. Eat before it runs out.','お弁当を食べるとお腹が20回復。食べるのも1ターン。','Lunch restores 20 food and takes one turn.'],
 ['鍵と寄り道','A key and a detour','鍵を拾い、扉の隣で道具を使って開けよう。','Pick up the key, then use it beside the door.','鍵は枝道にある。扉へ直行しても開かない。','The key is in a side path. Going straight to the door will not work.'],
 ['掘って近道','Dig a shortcut','つるはしで正面の壁を掘り、近道を作ろう。','Dig the wall ahead to make a shortcut.','向きを変えるときは壁へ歩く。外周は壊せない。','Move toward a wall to face it. Outer walls cannot be dug.'],
];
export const DOJO_STAGES:DojoStage[]=Array.from({length:50},(_,index)=>{
 const group=index%10,v=Math.floor(index/10),t=topics[group];
 const map=Array.from({length:9},()=>Array(9).fill('WALL'));
 // Each lesson has a different route geometry. Rotate pairs to avoid rote directions.
 const top=1+(v%2),bottom=6+(v%2),left=1,right=6+(v%2);
 for(let x=left;x<=right;x++){map[top][x]='FLOOR';map[bottom][x]='FLOOR';}
 for(let y=top;y<=bottom;y++){map[y][left]='FLOOR';map[y][right]='FLOOR';}
 if(group===1||group===6)for(let y=top;y<=bottom;y++)for(let x=left;x<=right;x++)map[y][x]='FLOOR';
 const start={x:left,y:top},goal={x:right,y:bottom};map[goal.y][goal.x]='STAIRS';
 let tool='',charges=0,food=30;const enemies:DojoStage['enemies']=[],traps:DojoStage['traps']=[];let key:DojoStage['key']=null;
 if([2,3,4].includes(group)){enemies.push({x:3+v%2,y:top,damage:group===2?1:6,sleep:0});map[top+1][left]='WALL';tool=group===3?'SLEEP':group===4?'RAY':'';charges=tool?1:0;}
 if(group===5){for(let y=top+1;y<bottom;y++)map[y][right]='WATER';map[top+1][left]='WALL';tool='FLOAT';charges=1;}
 if(group===6){traps.push({x:3,y:top+1},{x:4,y:top+2},{x:right-1,y:bottom-1});tool='REVEAL';charges=1;}
 if(group===7){food=2;tool='LUNCH';charges=1;map[top+1][left]='WALL';}
 if(group===8){const doorX=right,doorY=top+2;map[doorY][doorX]='DOOR';map[top+1][left]='WALL';map[top+1][3]='FLOOR';map[top+2][3]='FLOOR';key={x:3,y:top+2};tool='KEY';charges=1;}
 if(group===9){map[top+1][left]='WALL';map[top][right]='WALL';map[top+1][right]='WALL';tool='DIG';charges=3;}
 const limit=(right-left)+(bottom-top)+8+v;
 const transform=(p:{x:number;y:number})=>({x:v===2||v===4?8-p.x:p.x,y:v>=3?8-p.y:p.y});
 const transformed=Array.from({length:9},()=>Array(9).fill('WALL'));for(let y=0;y<9;y++)for(let x=0;x<9;x++){const p=transform({x,y});transformed[p.y][p.x]=map[y][x];}
 return {id:index+1,name:(group===6&&v>=2?(v===2?'罠の回収':'罠の再配置'):index===10?'Aで足踏み':t[0])+' '+(v+1),en:(group===6&&v>=2?(v===2?'Collect a trap':'Place a trap'):index===10?'A to wait':t[1])+' '+(v+1),lesson:group===6&&v>=2?'Rで罠を調べ、向き変更で正面に合わせて罠回収。回収した罠を罠配置で置こう。':index===10?'正面に敵がいないときのAは足踏み。1回試してから階段へ。':t[2],english:group===6&&v>=2?'Reveal with R, face a trap and Collect. Use Place to set the collected trap.':index===10?'A with no foe ahead waits one turn. Try it once, then reach the stairs.':t[3],hint:t[4],hintEn:t[5],map:transformed,start:transform(start),goal:transform(goal),limit,food,tool,charges,enemies:enemies.map(e=>({...e,...transform(e)})),traps:traps.map(transform),key:key?transform(key):null};
});
export function dojoStart(stage:DojoStage):DojoRun {return {stage:stage.id,x:stage.start.x,y:stage.start.y,dir:{x:[2,4].includes(Math.floor((stage.id-1)/10))?-1:1,y:0},turns:0,hp:7,food:stage.food,tool:stage.tool,charges:stage.charges,key:false,map:stage.map.map(r=>[...r]),enemies:stage.enemies.map(e=>({...e,hp:3})),traps:stage.traps.map(t=>({...t})),revealed:false,won:false,failed:false,message:''};}
export function dojoAct(run:DojoRun,action:DojoAction):DojoRun {
 if(run.won||run.failed)return run;
 const r=JSON.parse(JSON.stringify(run)) as DojoRun,stage=DOJO_STAGES[r.stage-1];let spent=true;r.used??=[];
 if(action.type==='FACE'){r.dir={x:Math.sign(action.dx),y:Math.sign(action.dy)};if(!r.dir.x&&!r.dir.y)r.dir.y=1;r.used=[...new Set([...r.used,'FACE'])];r.message='FACE';r.won=dojoRequired(r.stage)==='FACE'&&r.x===stage.goal.x&&r.y===stage.goal.y&&r.hp>0&&r.turns<=stage.limit;return r;}
 if(action.type==='ATTACK'){const foe=r.enemies.find(e=>e.x===r.x+r.dir.x&&e.y===r.y+r.dir.y);if(foe){(foe as any).hp-=2;if((foe as any).hp<=0)r.enemies=r.enemies.filter(e=>e!==foe);}r.message='ATTACK';}

 if(action.type==='COLLECT'||action.type==='PLACE'){
  const x=r.x+r.dir.x,y=r.y+r.dir.y;
  if(action.type==='COLLECT'&&r.revealed&&r.traps.some(t=>t.x===x&&t.y===y)){r.traps=r.traps.filter(t=>t.x!==x||t.y!==y);r.pouch=(r.pouch||0)+1;r.message='COLLECT';}
  else if(action.type==='PLACE'&&(r.pouch||0)>0&&r.map[y]?.[x]==='FLOOR'&&!r.traps.some(t=>t.x===x&&t.y===y)&&!r.enemies.some(e=>e.x===x&&e.y===y)){r.traps.push({x,y});r.pouch!--;r.message='PLACE';}
  else{spent=false;r.message='BLOCKED';}
 }
 if(action.type==='MOVE'){
  const {dx,dy}=action;r.dir={x:Math.sign(dx),y:Math.sign(dy)};const x=r.x+dx,y=r.y+dy,t=r.map[y]?.[x];
  if(!t||t==='WALL'||t==='DOOR'||(t==='WATER'&&r.tool!=='FLOAT_ACTIVE')||(dx&&dy&&[r.map[r.y]?.[x],r.map[y]?.[r.x]].some(v=>!v||v==='WALL'||v==='DOOR'||(v==='WATER'&&r.tool!=='FLOAT_ACTIVE')))){spent=false;r.message='BLOCKED';}
  else {const foe=r.enemies.find(e=>e.x===x&&e.y===y);if(foe){(foe as any).hp-=2;if((foe as any).hp<=0)r.enemies=r.enemies.filter(e=>e!==foe);r.message='ATTACK';}else{r.x=x;r.y=y;r.message='MOVE';if(stage.key?.x===x&&stage.key?.y===y)r.key=true;if(r.traps.some(t=>t.x===x&&t.y===y)){r.hp-=3;r.traps=r.traps.filter(t=>t.x!==x||t.y!==y);r.message='TRAP';}}}
 }else if(action.type==='TOOL'||action.type==='EAT'){
  if(r.charges<=0){spent=false;r.message='EMPTY';}
  else if(r.tool==='SLEEP'){for(const e of r.enemies)if(Math.max(Math.abs(e.x-r.x),Math.abs(e.y-r.y))<=2)e.sleep=8;r.charges--;r.message='SLEEP';}
  else if(r.tool==='RAY'){let x=r.x+r.dir.x,y=r.y+r.dir.y;while(r.map[y]?.[x]&&r.map[y][x]!=='WALL'&&r.map[y][x]!=='DOOR'){r.enemies=r.enemies.filter(e=>e.x!==x||e.y!==y);x+=r.dir.x;y+=r.dir.y;}r.charges--;r.message='RAY';}
  else if(r.tool==='FLOAT'){r.tool='FLOAT_ACTIVE';r.charges--;r.message='FLOAT';}
  else if(r.tool==='REVEAL'){r.revealed=true;r.charges--;r.message='REVEAL';}
  else if(r.tool==='LUNCH'){r.food+=20;r.charges--;r.message='LUNCH';}
  else if(r.tool==='KEY'&&r.key){const door=[[0,1],[0,-1],[-1,0],[1,0]].map(([dx,dy])=>({x:r.x+dx,y:r.y+dy})).find(p=>r.map[p.y]?.[p.x]==='DOOR');if(door){r.map[door.y][door.x]='FLOOR';r.charges--;r.message='KEY';}else{spent=false;r.message='BLOCKED';}}
  else if(r.tool==='DIG'){const x=r.x+r.dir.x,y=r.y+r.dir.y;if(x>0&&y>0&&x<8&&y<8&&r.map[y][x]==='WALL'){r.map[y][x]='FLOOR';r.charges--;r.message='DIG';}else{spent=false;r.message='BLOCKED';}}
  else{spent=false;r.message='BLOCKED';}
 }
 if(spent){r.used=[...new Set([...r.used,action.type,r.message])];r.turns++;r.food=Math.max(0,r.food-1);if(r.food===0)r.hp--;for(const e of r.enemies){if(e.sleep>0)e.sleep--;else if(Math.max(Math.abs(e.x-r.x),Math.abs(e.y-r.y))<=1)r.hp-=e.damage;}}
 const required=dojoRequired(r.stage);
 r.won=r.used.includes(required)&&r.x===stage.goal.x&&r.y===stage.goal.y&&r.hp>0&&r.turns<=stage.limit;r.failed=!r.won&&(r.hp<=0||r.turns>=stage.limit);return r;
}

export function dojoRequired(stage:number){return stage===11?'WAIT':(stage-1)%10===6&&stage>=37?'PLACE':(stage-1)%10===6&&stage>=27?'COLLECT':['MOVE','FACE','ATTACK','SLEEP','RAY','FLOAT','REVEAL','LUNCH','KEY','DIG'][(stage-1)%10];}
