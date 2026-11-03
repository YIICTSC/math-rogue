import React,{useId} from 'react';
import data from './portraitMetrics.json';
import {assetUrl} from '../utils/assetPaths';
import {mirrorArt} from '../mini-games/lantern-war/artFacing';
import type {Mood} from './store';
type Source={path:string;width:number;height:number;cellWidth:number;frames:{x:number;y:number;w:number;h:number}[]};
const metrics=data as Record<string,{normal:Source;vacation?:Source}>;
export const hasVacationPortrait=(id:string)=>!!metrics[id]?.vacation;
export default function TheaterPortrait({id,mood='neutral',vacation=false,facing}:{id:string;mood?:Mood;vacation?:boolean;facing:'left'|'right'}){
 const clipId='point-portrait-'+useId().replace(/:/g,'');const entry=metrics[id];if(!entry)return null;
 const source=vacation&&entry.vacation?entry.vacation:entry.normal;
 const frame=source.frames.length===1?0:Math.max(0,['neutral','joy','concern','resolve'].indexOf(mood));
 const bounds=source.frames[frame],reference=metrics.aster.normal.frames[0],scale=reference.h/bounds.h;
 const x=224-(frame*source.cellWidth+bounds.x+bounds.w/2)*scale,y=reference.y-bounds.y*scale;
 const flip=mirrorArt(id,'dialogue',frame,facing,vacation&&!!entry.vacation);
 return <svg className="points-scaled-portrait" viewBox="0 0 448 704" preserveAspectRatio="xMidYMax meet" overflow="hidden" aria-hidden="true" style={{transform:flip?'scaleX(-1)':undefined}} data-actor={id} data-reaction={mood} data-vacation={vacation&&entry.vacation?id:undefined} data-visible-height={reference.h} data-scale={scale}><defs><clipPath id={clipId}><rect x={x+frame*source.cellWidth*scale} y={y} width={source.cellWidth*scale} height={(id.startsWith('elementary-')?source.height/2:source.height)*scale}/></clipPath></defs><image clipPath={`url(#${clipId})`} href={assetUrl(source.path)} x={x} y={y} width={source.width*scale} height={source.height*scale}/></svg>;
}
