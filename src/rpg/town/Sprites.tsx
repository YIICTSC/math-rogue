import FarmSprite from '../farm/Sprite';
import React from 'react';
import {assetUrl} from '../../utils/assetPaths';
import {flowerAtlas,flowerById,dishById} from './catalog';
export function AtlasSprite({path,index,columns=4,rows=3,className=''}:{path:string;index:number;columns?:number;rows?:number;className?:string}){return <span aria-hidden="true" className={'town-sprite '+className} style={{backgroundImage:`url("${assetUrl(path)}")`,backgroundSize:`${columns*100}% ${rows*100}%`,backgroundPosition:`${index%columns*100/(columns-1)}% ${Math.floor(index/columns)*100/(rows-1)}%`}}/>;}
export function FlowerSprite({id}:{id:string}){const f=flowerById(id);return f?<AtlasSprite path={flowerAtlas(f.season)} index={f.index}/>:null;}
export function FoodSprite({id}:{id:string}){const f=dishById(id);return f?.atlas==='farm'?<FarmSprite kind="food" id={f.index}/>:f?<AtlasSprite path={`sprites/rpg/town/food-${Math.floor(f.index/12)}.webp`} index={f.index%12}/>:null;}
