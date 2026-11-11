import type {Athlete,Motion} from './core';
import {clamp} from './core';
import type {Match} from './engine';
export interface JointPose {x:number;y:number;z:number}
export interface SportsPose {joints:Record<string,JointPose>;bob:number;roll:number;label:string}
const mix=(a:number,b:number,t:number)=>a+(b-a)*clamp(t,0,1);
const ease=(t:number)=>{const v=clamp(t,0,1);return v*v*(3-2*v);};
/** Visual poses only. Ball release, hit windows and collisions stay in the simulation. */
export function sportsPose(s:Match,p:Athlete,motion:Motion,remaining:number,duration:number,gait:number,reduced=false):SportsPose{
 const result:SportsPose={joints:{},bob:0,roll:0,label:motion};
 const pose=(name:string,x=0,z=0,y=0)=>{result.joints[name]={x,y,z};};
 const speed=Math.hypot(p.v.x,p.v.z),t=1-clamp(remaining/Math.max(.1,duration),0,1),wave=Math.sin(t*Math.PI);
 // Reset all overridden joints every draw so a completed kick cannot leave a bent leg behind.
 for(const name of ['spine','head','upper_arm.L','upper_arm.R','forearm.L','forearm.R','thigh.L','thigh.R','shin.L','shin.R'])pose(name);
 if(motion==='run'&&speed>.15){
  const stride=Math.sin(gait),pace=clamp(speed/7,.25,1),dribble=s.sport==='soccer'&&s.ball.owner===p.id;
  pose('spine',.12+pace*.12,0,Math.sin(gait)*.07);pose('thigh.L',stride*(dribble?.62:.9)*pace);pose('thigh.R',-stride*(dribble?.62:.9)*pace);
  pose('shin.L',Math.max(0,-stride)*1.05*pace);pose('shin.R',Math.max(0,stride)*1.05*pace);
  pose('upper_arm.L',-stride*.65*pace,.1);pose('upper_arm.R',stride*.65*pace,-.1);pose('forearm.L',-.9);pose('forearm.R',-.9);
  result.bob=reduced?0:Math.abs(Math.cos(gait))*.045*pace;result.label=dribble?'dribble':'sprint';
 }else if(motion==='idle'){
  pose('spine',.025);pose('upper_arm.L',.03,.08);pose('upper_arm.R',.03,-.08);
  result.bob=reduced?0:Math.sin(s.clock*2+p.id)*.008;
 }
 if(s.sport==='baseball'){
  const ready=['set','meter','windup','pitch'].includes(s.stage);
  if(p.id===s.bat&&ready&&motion!=='swing'){
   pose('spine',.08,0,.48);pose('thigh.L',-.22,-.13);pose('thigh.R',-.22,.13);pose('shin.L',.23);pose('shin.R',.23);
   pose('upper_arm.L',-1.05,.38,-.3);pose('upper_arm.R',-1.12,-.3,.2);pose('forearm.L',-1.2);pose('forearm.R',-1.45);result.label='batting-stance';
  }else if(p.role==='C'&&p.team!==s.half&&ready){
   pose('spine',.34);pose('thigh.L',-1.12,-.22);pose('thigh.R',-1.12,.22);pose('shin.L',1.65);pose('shin.R',1.65);pose('upper_arm.L',-1.05,.15);pose('forearm.L',-.3);pose('upper_arm.R',-.5);result.label='catcher-crouch';
  }else if(p.id===s.pitcher&&['set','meter'].includes(s.stage)){
   pose('upper_arm.L',-.75,.2);pose('upper_arm.R',-.8,-.2);pose('forearm.L',-1.25);pose('forearm.R',-1.25);pose('spine',.02,0,-.2);result.label='pitch-set';
  }
  if(p.id===s.pitcher&&(s.stage==='windup'||motion==='pitch')){
   const q=s.stage==='windup'?clamp(s.timer/.65,0,1):1+clamp((.35-remaining)/.35,0,1),lift=Math.sin(clamp(q/.65,0,1)*Math.PI);
   const release=ease((q-.45)/.55),follow=ease(q-1);
   pose('spine',mix(-.1,.55,release)-follow*.15,0,mix(-.7,.6,release));
   pose('thigh.L',-lift*1.15+follow*.3,-.12);pose('shin.L',lift*1.5);pose('thigh.R',.15-release*.3);pose('shin.R',release*.28);
   pose('upper_arm.R',mix(-2.2,.6,release),-.38,mix(-.4,.3,release));pose('forearm.R',mix(-1.65,-.1,release));
   pose('upper_arm.L',mix(-1.1,.15,release),.25);pose('forearm.L',mix(-.9,-1.2,release));result.label=q<.45?'windup':q<1?'pitch-release':'pitch-follow-through';
  }
  if(motion==='swing'){
   // The simulation resolves contact on activation; begin at the striking phase.
   const turn=ease(.55+t*.7),finish=ease((t-.35)/.65);
   pose('spine',.09+wave*.12,0,mix(-.65,1.05,turn));pose('thigh.L',-.25+turn*.3,-.12);pose('thigh.R',-.2+turn*.35,.12);pose('shin.L',.25*(1-turn));pose('shin.R',.3*(1-turn));
   pose('upper_arm.R',mix(-1.15,-.7,finish),mix(-.45,.7,turn),mix(-.35,.55,turn));pose('upper_arm.L',mix(-1.1,-.8,finish),mix(.35,-.6,turn),mix(-.25,.65,turn));
   pose('forearm.R',mix(-1.3,-.18,turn)+finish*.6);pose('forearm.L',mix(-1.2,-.2,turn)+finish*.4);result.label='bat-swing';
  }
  if(motion==='throw'){
   const recover=ease((t-.25)/.75);pose('spine',.35*(1-recover),0,.4*(1-recover));pose('upper_arm.R',mix(.45,0,recover),-.3*(1-recover));pose('forearm.R',mix(-.15,-.6,recover));pose('upper_arm.L',-.55,.3);pose('thigh.L',-.25*wave);result.label='field-throw';
  }
 }
 if(s.sport==='soccer'){
  if(s.ball.owner===p.id&&p.charge>0&&motion!=='kick'){
   pose('spine',.16,0,-.2);pose('thigh.L',-.2);pose('shin.L',.3);pose('thigh.R',.4);pose('shin.R',.65);pose('upper_arm.L',-.35,.4);pose('upper_arm.R',-.15,-.4);result.label='shot-charge';
  }
  if(motion==='kick'){
   const preparing=s.pendingShot?.actor===p.id&&s.cinema>0,recover=ease(t),extension=1-recover;
   if(preparing){const wind=1-s.cinema/.7;pose('spine',-.12,0,-.3);pose('thigh.R',.55+wind*.15);pose('shin.R',1.05);result.label='shot-windup';}
   else{pose('spine',.32*extension,0,.4*extension);pose('thigh.R',-1.25*extension);pose('shin.R',.12+recover*.1);result.label='kick-follow-through';}
   pose('thigh.L',-.16);pose('shin.L',.23);pose('upper_arm.L',-.3,.45*extension);pose('upper_arm.R',.15,-.5*extension);pose('forearm.L',-.65);pose('forearm.R',-.6);
  }
  if(motion==='tackle'){
   pose('spine',-.28+wave*.15,0,.2*wave);pose('thigh.R',-1.25*wave);pose('shin.R',.1);pose('thigh.L',-.7*wave,.3);pose('shin.L',1.25*wave);pose('upper_arm.L',.2,.45);pose('upper_arm.R',-.5,-.4);result.roll=-wave*.18;result.label='slide-tackle';
  }
  if(p.role==='GK'&&motion==='catch'){
   const high=s.ball.y>1.7,reach=high?-2.5:-1.25;
   pose('spine',.1,0,0);pose('upper_arm.L',reach,.25);pose('upper_arm.R',reach,-.25);pose('forearm.L',-.25);pose('forearm.R',-.25);pose('thigh.L',-.25);pose('thigh.R',-.25);pose('shin.L',.45);pose('shin.R',.45);
   result.roll=p.p.y>.1?clamp((s.ball.x-p.p.x)*.15,-.5,.5)*wave:0;result.label=high?'keeper-high-save':'keeper-catch';
  }
 }
 if(motion==='catch'&&p.role!=='GK'){
  pose('spine',.25);pose('upper_arm.L',-1.2,.1);pose('forearm.L',-.3);pose('upper_arm.R',-.6,-.1);pose('forearm.R',-.75);result.label='field-catch';
 }
 if(motion==='hurt'){pose('spine',-.35*wave);pose('upper_arm.L',-.4,.3);pose('upper_arm.R',-.4,-.3);}
 if(motion==='celebrate'){pose('upper_arm.L',-2.7,.3);pose('upper_arm.R',-2.7,-.3);result.bob=reduced?0:Math.abs(Math.sin(s.clock*6))*.07;}
 return result;
}
