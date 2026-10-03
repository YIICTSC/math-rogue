import React from 'react';
import {assetUrl} from '../utils/assetPaths';
export default function FishSprite({id,unknown=false}:{id:string;unknown?:boolean}){return <img className={`rpg-fish-sprite ${unknown?'is-unknown':''}`} src={assetUrl(`sprites/rpg/fishing/${id}.webp`)} alt="" loading="lazy" draggable={false}/>;}
export function FishingFrame({index}:{index:number}){return <span className="rpg-fishing-frame" aria-hidden="true" style={{backgroundImage:`url(${assetUrl('sprites/rpg/fishing/action.webp')})`,backgroundPosition:`${index%4*100/3}% ${Math.floor(index/4)*100}%`}}/>;}
