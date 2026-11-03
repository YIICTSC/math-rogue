import React from 'react';
import {assetUrl} from '../utils/assetPaths';
import {backgroundPath} from './catalog';
/** The exchange preview and question screens share the same rendering. */
export default function BackgroundAppearance({id,shade,blur,portrait}:{id:string;shade:number;blur:number;portrait?:boolean}){
 return <><picture>{portrait===undefined&&<source media="(orientation:portrait)" srcSet={assetUrl(backgroundPath(id,true))}/>}<img src={assetUrl(backgroundPath(id,portrait===true))} alt="" style={{filter:`blur(${blur}px)`}}/></picture><div className="points-background-shade" style={{background:`rgba(5,15,31,${shade/100})`}}/></>;
}
