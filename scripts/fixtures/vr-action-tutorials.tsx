import React from 'react';
import {createRoot} from 'react-dom/client';
import {flushSync} from 'react-dom';
import {MISSIONS,createRun,step,type Mission,type Input} from '../../src/mini-games/gakurogear/engine';
import {createScene} from '../../src/mini-games/gakurogear/scene';
import {defaultAvatar} from '../../src/mini-games/gakuro-kart/avatar';
import {ACTION_TUTORIALS,type ActionTutorial} from '../../src/mini-games/gakurogear/actionTutorials';
import ActionTutorialDialog from '../../src/mini-games/gakurogear/ActionTutorialDialog';
import GakuroGear from '../../src/mini-games/gakurogear/GakuroGear';
import '../../src/mini-games/gakurogear/gakurogear.css';

const root=createRoot(document.getElementById('root')!);
const host=document.querySelector<HTMLElement>('#capture .gear-canvas')!;
const status=document.querySelector<HTMLElement>('#capture .gear-objective')!;
let scene:ReturnType<typeof createScene>|undefined,frame=0,serial=0;
function stopScene(){cancelAnimationFrame(frame);scene?.dispose();scene=undefined;}
// Controlled examples, simulated and rendered with the same engine as training.
function capture(action:ActionTutorial){
 stopScene();document.body.dataset.mode='capture';flushSync(()=>root.render(null));
 const m:Mission={...MISSIONS[6],id:100,size:8,terrain:[],routes:[],cameras:[],switches:[],sensors:[],targets:[],targetKinds:[],requiredHolds:0,requiredShots:0,defend:undefined,requireSwitches:false,spawn:{x:0,z:-2},exit:{x:7,z:7},obstacles:[{x:-4,z:1,w:1.5,d:3,h:1,kind:'desk'},{x:4,z:1,w:1.5,d:3,h:1,kind:'desk'}]};
 let input:Input={x:0,z:0,crouch:false,interact:false,decoy:false},ticks=1;
 if(action==='collect'){m.targets=[{x:-1.4,z:0},{x:0,z:0},{x:1.4,z:0}];m.targetKinds=['file','rescue','relay'];m.spawn={x:0,z:-.9};input.interact=true;ticks=13;}
 if(action==='crouch'){m.obstacles.push({x:0,z:0,w:3,d:2,h:2.5,clearance:.95,kind:'crawl'});m.spawn={x:0,z:-1.6};input.crouch=true;}
 if(action==='hold'){m.routes=[[{x:0,z:0},{x:0,z:4}]];input.hold=true;ticks=11;}
 if(action==='shoot'){m.routes=[[{x:0,z:1},{x:0,z:5}]];input.shoot=true;}
 if(action==='switch'){m.switches=[{x:-1,z:0}];m.obstacles.push({x:0,z:2,w:3.5,d:.4,h:2.5,kind:'door',switchId:0});m.spawn={x:-1,z:-.9};input.interact=true;ticks=9;}
 if(action==='sensor'){m.sensors=[{x:0,z:0,w:3,d:.2,period:5}];m.spawn={x:0,z:-.9};input.crouch=true;}
 if(action==='defend'){m.defend={x:0,z:0,seconds:5};m.spawn={x:0,z:0};ticks=50;}
 if(action==='decoy'){m.routes=[[{x:-2,z:2},{x:2,z:2}]];input.decoy=true;}
 const s=createRun(m);s.player.angle=0;
 for(let i=0;i<ticks;i++)step(m,s,{...input,facing:0},.05);
 if(action==='shoot'){step(m,s,{...input,shoot:false,facing:0},.05);step(m,s,{...input,shoot:false,facing:0},.05);}
 if(action==='decoy')for(let i=0;i<6;i++)step(m,s,{...input,decoy:false,facing:0},.05);
 const badge={collect:'E · HOLD',crouch:'C · CROUCH',hold:'F · HOLD',shoot:'R · FIRE',switch:'E · HOLD',sensor:'C · CROUCH',defend:'DEFEND',decoy:'Q · DECOY'}[action];
 const progress=action==='hold'?s.holdProgress/.9:action==='collect'?s.interact/1.2:action==='switch'?s.switchProgress/.9:action==='defend'?s.defended/5:undefined;
 status.replaceChildren(document.createTextNode(badge));
 if(progress!==undefined){const bar=document.createElement('progress');bar.max=1;bar.value=progress;status.appendChild(bar);}
 scene=createScene(host,m,defaultAvatar());
 const draw=()=>{scene?.draw(s,{mode:'third',yaw:.6});frame=requestAnimationFrame(draw);};draw();
 return {holdProgress:s.holdProgress,crouch:s.crouch,interact:s.interact,switchProgress:s.switchProgress,defended:s.defended,noise:!!s.noise,bubble:!!s.bubble};
}
Object.assign(window,{
 tutorialActions:Object.keys(ACTION_TUTORIALS),captureTutorialAction:capture,
 showTutorial(action:ActionTutorial,en=false){stopScene();document.body.dataset.mode='dialog';flushSync(()=>root.render(<div className="gear-shell"><ActionTutorialDialog key={++serial} action={action} en={en} missionId={7} remaining={1} onContinue={()=>root.render(null)}/></div>));},
 showGame(){stopScene();document.body.dataset.mode='dialog';localStorage.removeItem('gakuro-vr-action-tutorials-v1');flushSync(()=>root.render(<GakuroGear onBack={()=>{}} languageMode="JAPANESE"/>));},
});
