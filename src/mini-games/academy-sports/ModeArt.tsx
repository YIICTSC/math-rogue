import React from 'react';
import {assetUrl} from '../../utils/assetPaths';
import type {SportId} from './core';
export default function ModeArt({sport,index=0}:{sport:SportId;index?:number}){
 return <span aria-hidden="true" className={`ac-mode-art ac-mode-art-${sport}`} style={sport==='festival'?{backgroundImage:`url("${assetUrl('sprites/mini-game-titles/festival-landscape-v1.webp')}")`,backgroundSize:'cover',backgroundPosition:'center'}:{backgroundImage:`url("${assetUrl(`sprites/academy-sports/modes/${sport}-${index}-v1.webp`)}")`,backgroundSize:'cover',backgroundPosition:'center 30%'}}/>;
}
