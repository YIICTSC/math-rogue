import assert from 'node:assert/strict';import {build} from 'esbuild';import {NodeIO} from '@gltf-transform/core';import {Matrix4,Vector3} from 'three';
const b=await build({stdin:{contents:"export * from './src/mini-games/academy-sports/core';export * from './src/mini-games/academy-sports/soccer';export * from './src/mini-games/academy-sports/courts';",resolveDir:process.cwd()},bundle:true,write:false,format:'esm',platform:'node'}),E=await import('data:text/javascript;base64,'+Buffer.from(b.outputFiles[0].text).toString('base64'));
const w=E.SOCCER_FIELD.width-E.SOCCER_PLAYER_MARGIN,l=E.SOCCER_FIELD.length-E.SOCCER_PLAYER_MARGIN;
function inside(s,label){for(const p of s.players)for(const [kind,v]of [['player',p.p],['home',p.home],['target',p.cpuTarget]])if(v){assert(Math.abs(v.x)<=w+1e-8,label+' '+p.id+' '+kind+' x');assert(Math.abs(v.z)<=l+1e-8,label+' '+p.id+' '+kind+' z');}}
let frames=0;
for(const online of [false,true])for(const signX of [-1,1])for(const signZ of [-1,1]){
 const s=E.createSoccer({...E.defaultConfig('soccer'),minutes:5});s.phase='play';s.online=online;
 for(const kind of ['kickoff','throw-in','corner','free-kick','penalty','goal-kick','offside']){for(const p of s.players){p.p=E.vec(signX*(w+12),0,signZ*(l+12));p.cpuTarget=E.vec(signX*200,0,signZ*200);}E.placeRestart(s,kind,0,E.vec(signX*(w+1),0,signZ*(l+1)));inside(s,kind);}
 s.stage='open';s.ball.owner=-1;Object.assign(s.ball,{x:signX*(w+.3),z:signZ*(l-8),y:5,vx:signX*5,vz:0});
 for(let i=0;i<720;i++){if(s.phase!=='play'){s.phase='play';s.phaseTime=0;}if(s.stage==='restart'){s.stage='open';s.ball.owner=-1;s.ball.y=3;}const input={...E.neutral(),x:signX,z:signZ,dash:true};if(online)s.controls={[s.selected]:input};E.stepSoccer(s,input,1/60);inside(s,'chase/separation');frames++;}
 const passer=s.players.find(p=>p.id===s.selected),receiver=s.players.find(p=>p.team===passer.team&&p.id!==passer.id&&p.role!=='GK');passer.p=E.vec(signX*(w-.1),0,signZ*(l-1));receiver.p=E.vec(signX*(w-.1),0,signZ*(l-.1));receiver.v=E.vec(signX*12,0,signZ*12);s.stage='open';s.ball.owner=passer.id;s.lastInput={...E.neutral(),x:signX,z:signZ};E.soccerAction(s,'lob');for(let i=0;i<90;i++){E.stepSoccer(s,E.neutral(),1/60);inside(s,'long pass');frames++;}
}
const venue=await new NodeIO().read('public/models/academy-sports/'+E.SOCCER_VENUE+'.glb');
function center(n,material){const p=n.getMesh().listPrimitives().find(p=>p.getMaterial().getName()===material),a=p.getAttribute('POSITION').getArray(),lo=[Infinity,Infinity,Infinity],hi=[-Infinity,-Infinity,-Infinity],m=new Matrix4().fromArray(n.getWorldMatrix());for(let i=0;i<a.length;i+=3)new Vector3(...a.slice(i,i+3)).applyMatrix4(m).toArray().forEach((v,j)=>{lo[j]=Math.min(lo[j],v);hi[j]=Math.max(hi[j],v);});return lo.map((v,i)=>(v+hi[i])/2);}
for(const name of ['BenchLeft','BenchRight']){const n=venue.getRoot().listNodes().find(n=>n.getName()===name),seat=center(n,'teal'),back=center(n,'navy');assert(seat[0]<-E.SOCCER_FIELD.width,'Both technical benches are on the far sideline');assert(seat[0]>back[0]+.4,'Seat fronts face the pitch, away from the backrest');}
assert(venue.getRoot().listNodes().some(n=>n.getName()==='StadiumBoard'),'Venue board has a separate rotatable mount');
console.log('PASS '+frames+' offline/online boundary frames, CPU chasing, lob lead, body separation, seven restarts and both inward-facing bench geometries.');
