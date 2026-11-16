import React from 'react';
import {assetUrl} from '../../../utils/assetPaths';
const controls:Record<string,number>={left:0,right:1,shot:2,special:3,map:4,help:5,pause:6,play:7,brake:8,undo:9,center:10,finish:11};
const balls:Record<string,number>={ball:0,anchor:1,snow:2,weight:3,bounce:4,feather:5,ghost:6,'star-ball':7,'undo-ball':8};
export default function ActionIcon({kind}:{kind:string}){const item=kind in balls,index=item?balls[kind]:controls[kind]??2,rows=item?3:4;return <span aria-hidden="true" className="sg-action-art" data-golf-art={kind} style={{backgroundImage:`url(${assetUrl('sprites/golf-2d/'+(item?'balls-v1.webp':'controls-v1.webp'))})`,backgroundSize:`300% ${rows*100}%`,backgroundPosition:`${index%3*50}% ${Math.floor(index/3)*100/(rows-1)}%`}}/>;}
