import React from 'react';
import {assetUrl} from '../../utils/assetPaths';

export type StarAction='dodge'|'guard'|'target'|'burst'|'glide'|'interact'|'journal'|'map';
const actionCells:Record<StarAction,number>={dodge:8,guard:9,target:10,burst:11,glide:12,interact:13,journal:14,map:15};

export function StarActionIcon({action,weapon}:{action?:StarAction;weapon?:number}){
 const index=action?actionCells[action]:Math.max(0,Math.min(7,weapon??0));
 return <span className="st-action-icon" aria-hidden="true" data-action-art={action??`weapon-${weapon??0}`} style={{backgroundImage:`url(${assetUrl('sprites/star-tide/arpg/action-icons.webp')})`,backgroundPosition:`${index%4/3*100}% ${Math.floor(index/4)/3*100}%`}}/>;
}
