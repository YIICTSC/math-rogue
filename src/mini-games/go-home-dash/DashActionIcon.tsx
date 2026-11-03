import React from 'react';
import {assetUrl} from '../../utils/assetPaths';
export type DashAction='jump'|'dash'|'slide'|'left'|'right'|'pause';
const cells:Record<DashAction,[number,number]>={jump:[0,0],dash:[1,0],slide:[2,0],left:[0,1],right:[1,1],pause:[2,1]};
export function DashActionIcon({action}:{action:DashAction}){
 const [x,y]=cells[action];
 return <span className="dash-action-art" data-action-art={action} aria-hidden="true" style={{backgroundImage:`url(${assetUrl('sprites/go-home-dash/rush/action-icons.webp')})`,backgroundPosition:`${x*50}% ${y*100}%`}}/>;
}
