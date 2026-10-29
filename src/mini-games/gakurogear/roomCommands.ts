import { answer,retryCoop,validInput,type OnlineWorld,type VrInput } from './onlineEngine';
import { completeQuiz,requestSupply } from './onlineRules';
import { validAvatar } from '../gakuro-kart/avatar';
export function vrCommand(w:OnlineWorld,id:string,d:any,controls:Record<string,VrInput>,lastInput:Record<string,number>){
 const p=w.players[id];if(!p?.connected||(p.spectator&&d.type!=='avatar'))return;
 if(d.type==='input'&&validInput(d.input)){
  const next:VrInput={...d.input},before=controls[id];
  // A release or movement packet must not erase a pulse before the next simulation tick.
  for(const key of ['shoot','decoy','reload','useItem','bomb','remote','cover'] as const)if(before?.[key])next[key]=true;
  if(next.weapon===undefined)next.weapon=before?.weapon;
  if(next.item===undefined)next.item=before?.item;
  controls[id]=next;lastInput[id]=Date.now();
 }
 if(d.type==='avatar'&&validAvatar(d.avatar))p.avatar={...d.avatar};
 if(d.type==='retry')retryCoop(w,id);
 if(d.type==='answer')answer(w,id,d.choice,d.round);
 if(d.type==='quizComplete')completeQuiz(w,id);
 if(d.type==='supply')requestSupply(w,id);
 if(d.type==='closeBombQuiz'&&w.mode==='bomb'&&p.quizReason==='bomb'){p.quiz=false;delete controls[id];}
}
export function clearVrPulses(controls:Record<string,VrInput>){for(const input of Object.values(controls)){input.shoot=input.decoy=input.reload=input.useItem=input.bomb=input.remote=input.cover=false;input.weapon=input.item=undefined;}}
