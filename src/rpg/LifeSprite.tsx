import React from 'react';
import {assetUrl} from '../utils/assetPaths';
export const LIFE_ATLASES={nature:{path:'sprites/rpg/frontier-atlas.webp',columns:6,rows:4},craft:{path:'sprites/rpg/craft-items.webp',columns:4,rows:3},interior:{path:'sprites/rpg/home-interiors.webp',columns:6,rows:4}} as const;
export default function LifeSprite({index,atlas='nature'}:{index:number;atlas?:keyof typeof LIFE_ATLASES}){const a=LIFE_ATLASES[atlas];return <span className="rpg-life-sprite" aria-hidden="true" style={{backgroundImage:`url(${assetUrl(a.path)})`,backgroundSize:`${a.columns*100}% ${a.rows*100}%`,backgroundPosition:`${index%a.columns*100/(a.columns-1)}% ${Math.floor(index/a.columns)*100/(a.rows-1)}%`}}/>;}
