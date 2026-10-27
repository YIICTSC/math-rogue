import React from 'react';
import {assetUrl} from '../../utils/assetPaths';
const cells={attack:[0,0],use:[1,0],crouch:[2,0],collect:[3,0],hold:[0,1],decoy:[1,1],reload:[2,1],bomb:[3,1],remote:[0,2],supply:[1,2],guide:[2,2],camera:[3,2]} as const;
export default function VrActionVisual({action,children}:{action:keyof typeof cells;children:React.ReactNode}){
 const [col,row]=cells[action];
 return <><span className="gear-action-art" aria-hidden="true" data-vr-action={action} style={{backgroundImage:`url(${assetUrl('sprites/gakurogear/action-icons-v1.webp')})`,backgroundPosition:`${col*100/3}% ${row*50}%`}}/><span className="gear-action-label">{children}</span></>;
}
