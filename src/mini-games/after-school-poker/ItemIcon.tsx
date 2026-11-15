import React from 'react';
import manifest from './iconManifest.json';
import {assetUrl} from '../../utils/assetPaths';
export function hasPokerDedicatedIcon(id:string){return id in manifest;}
export function PokerDedicatedIcon({id,className='',title=''}:{id:string;className?:string;title?:string}){const entry=manifest[id as keyof typeof manifest];if(!entry)return null;return <span aria-hidden="true" data-poker-icon={id} title={title} className={`poker-dedicated-icon ${className}`} style={{display:'inline-block',flexShrink:0,backgroundImage:`url("${assetUrl('sprites/after-school-poker/expansion/'+entry.sheet+'.webp')}")`,backgroundRepeat:'no-repeat',backgroundSize:`${entry.columns*100}% ${entry.rows*100}%`,backgroundPosition:`${entry.index%entry.columns/(entry.columns-1)*100}% ${Math.floor(entry.index/entry.columns)/(entry.rows-1)*100}%`}}/>;}
