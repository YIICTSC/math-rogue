import { answer,retryCoop,validInput,type OnlineWorld,type VrInput } from './onlineEngine';
import { completeQuiz,requestSupply } from './onlineRules';
import { validAvatar } from '../gakuro-kart/avatar';
export function vrCommand(w:OnlineWorld,id:string,d:any,controls:Record<string,VrInput>,lastInput:Record<string,number>){
 const p=w.players[id];if(!p?.connected)return;
 if(d.type==='input'&&validInput(d.input)){controls[id]={...d.input};lastInput[id]=Date.now();}
 if(d.type==='avatar'&&validAvatar(d.avatar))p.avatar={...d.avatar};
 if(d.type==='retry')retryCoop(w,id);
 if(d.type==='answer')answer(w,id,d.choice,d.round);
 if(d.type==='quizComplete')completeQuiz(w,id);
 if(d.type==='supply')requestSupply(w,id);
 if(d.type==='closeBombQuiz'&&w.mode==='bomb'&&p.quizReason==='bomb'){p.quiz=false;delete controls[id];}
}
export function clearVrPulses(controls:Record<string,VrInput>){for(const input of Object.values(controls)){input.shoot=input.decoy=input.reload=input.useItem=input.bomb=input.remote=false;}}
