import React from 'react';
import {assetUrl} from '../../utils/assetPaths';
const cells={throw:[0,0],catch:[1,0],dodge:[2,0],pass:[0,1],dash:[1,1],jump:[2,1],special:[0,2],wave:[1,2],arc:[2,2]} as const;
export default function DodgeActionIcon({action}:{action:keyof typeof cells}){const[col,row]=cells[action];return <span className="dg-action-illustration" aria-hidden="true" data-action-art={action} style={{backgroundImage:`url(${assetUrl('sprites/dodgeball/action-icons-v1.webp')})`,backgroundPosition:`${col*50}% ${row*50}%`}}/>;}
