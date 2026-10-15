import React,{useId} from 'react';
import {assetUrl} from '../../utils/assetPaths';
import {ACTION_TUTORIALS,ACTION_TUTORIAL_FOCUS,type ActionTutorial} from './actionTutorials';

export default function ActionTutorialDialog({action,en,missionId,remaining,onContinue}:{action:ActionTutorial;en:boolean;missionId:number;remaining:number;onContinue:()=>void}){
 const titleId=useId(),tutorial=ACTION_TUTORIALS[action],focus=ACTION_TUTORIAL_FOCUS[action];
 return <div className="gear-overlay gear-action-tutorial"><section role="dialog" aria-modal="true" aria-labelledby={titleId}>
  <small>MISSION {missionId} · {remaining}</small>
  <h2 id={titleId}>{en?tutorial.en:tutorial.ja}</h2>
  <figure className="gear-tutorial-figure">
   <img src={assetUrl(`sprites/gakurogear/tutorials/${action}.webp`)} width={960} height={540} alt={en?focus.en:focus.ja}/>
   <figcaption>{focus.key&&<kbd>{focus.key}</kbd>}<span>{en?focus.en:focus.ja}</span></figcaption>
  </figure>
  <p>{en?tutorial.english:tutorial.body}</p>
  <button autoFocus className="gear-primary" onClick={onContinue}>{en?'Got it / continue':'わかった・続ける'}</button>
 </section></div>;
}
