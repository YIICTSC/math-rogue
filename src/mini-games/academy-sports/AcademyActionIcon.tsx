import React from 'react';
import {assetUrl} from '../../utils/assetPaths';
import type {SportId,Action} from './core';
export default function AcademyActionIcon({sport,action,pitching=false}:{sport:SportId;action:Action;pitching?:boolean}){
 const cell=action==='dash'||action==='advance'||action==='steal'?5:action==='special'?4:sport==='baseball'?(action==='primary'?(pitching?3:0):action==='defend'?1:action==='switch'?3:2):sport==='soccer'?(action==='primary'?0:action==='pass'?1:action==='defend'?2:3):(action==='primary'?0:action==='jump'?1:action==='defend'?2:3);
 return <span className="ac-action-art" aria-hidden="true" style={{backgroundImage:`url(${assetUrl(`sprites/academy-sports/${sport}-actions-v1.webp`)})`,backgroundPosition:`${cell%3*50}% ${Math.floor(cell/3)*100}%`}}/>;
}
