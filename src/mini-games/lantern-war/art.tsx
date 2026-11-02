import {mirrorArt,type Facing} from './artFacing';
import ENDLESS_METRICS from './endlessBattleMetrics.json';
import {ENDLESS_CAST} from './endlessRoster';
import React,{useEffect,useState} from 'react';
import {assetUrl} from '../../utils/assetPaths';
import {battleSource,type BattleAction} from './battleSources';
import {PERSONAL_TECHNIQUES} from './techniques';
export type ArtAction=BattleAction;
export function battleArt(id:string,action:ArtAction='ready',frame=0){const source=battleSource(id,action,frame);return {src:source.path,cols:source.cols,rows:source.rows,frame:source.index};}
export function Atlas({src,cols=1,rows=1,frame=0,className='',flip=false}:{src:string;cols?:number;rows?:number;frame?:number;className?:string;flip?:boolean}){
 return <svg className={'lw-atlas '+className} style={{transform:flip?'scaleX(-1)':undefined}} viewBox="0 0 100 100" aria-hidden="true" preserveAspectRatio="xMidYMid meet"><svg x="0" y="0" width="100" height="100" overflow="hidden"><image href={assetUrl(src)} x={-(frame%cols)*100} y={-Math.floor(frame/cols)*100} width={cols*100} height={rows*100} preserveAspectRatio={cols===1&&rows===1?'xMidYMax meet':'none'}/></svg></svg>;
}
export function BattleArt({id,action='ready',className='',facing='right'}:{id:string;action?:ArtAction;className?:string;facing?:Facing}){
 const [frame,setFrame]=useState(0);
 useEffect(()=>{setFrame(0);if(action==='ready')return;const timer=setInterval(()=>setFrame(f=>(f+1)%4),160);return()=>clearInterval(timer);},[id,action]);
 const flip=mirrorArt(id,action,frame,facing);
 const row=ENDLESS_CAST.findIndex(h=>h.id===id);if(row>=0){const m=(ENDLESS_METRICS as Record<string,Record<BattleAction,{x:number;y:number;bounds:{x:number;y:number;w:number;h:number}}[]>>)[id]?.[action]?.[0];if(m)return <svg className={'lw-atlas '+className} style={{transform:flip?'scaleX(-1)':undefined}} viewBox={`${m.x+m.bounds.x-16} ${m.y+m.bounds.y-16} ${m.bounds.w+32} ${m.bounds.h+32}`} aria-hidden="true" preserveAspectRatio="xMidYMax meet"><image href={assetUrl('sprites/lantern-war/endless/actions-'+id+'.webp')} width="2304" height="1792"/></svg>;}
 return <Atlas {...battleArt(id,action,frame)} className={className} flip={flip}/>;
}
export function MapArt({id,direction=2,walking=false}:{id:string;direction?:number;walking?:boolean}){
 const row=ENDLESS_CAST.findIndex(h=>h.id===id);if(row>=0)return <BattleArt id={id} facing={direction===3?'left':'right'}/>;
 if(['aster','lyra','nagi','mio','sena'].includes(id))return <Atlas src={'sprites/lantern-war/'+id+'-map.webp'} cols={4} rows={3} frame={direction+(walking?4:0)}/>;
 if(id==='civil')return <Atlas src="sprites/wandering-student/high-school-caretaker.webp" cols={4} rows={2} frame={direction}/>;
 if(id.startsWith('enemy-'))return <Atlas src={'sprites/furai-sfc-v2-enemy-5x5-1.webp'} cols={5} rows={5} frame={Number(id.slice(6))%6}/>;
 return <Atlas src={id.startsWith('dungeons2-')?'sprites/dungeons2/'+id.slice(10)+'-directions.webp':'sprites/wandering-student/'+id+'.webp'} cols={4} rows={2} frame={direction}/>;
}
export function Portrait({id,reaction='neutral',facing}:{id:string;reaction?:'neutral'|'joy'|'concern'|'resolve';facing?:Facing}){
 const flip=facing?mirrorArt(id,'dialogue',Math.max(0,['neutral','joy','concern','resolve'].indexOf(reaction)),facing):false;
 const row=ENDLESS_CAST.findIndex(h=>h.id===id);if(row>=0){const frame=Math.max(0,['neutral','joy','concern','resolve'].indexOf(reaction));return <svg className="lw-dialogue-portrait lw-portrait-normalized" style={{transform:flip?'scaleX(-1)':undefined}} data-reaction={reaction} viewBox="0 0 448 704" overflow="hidden" preserveAspectRatio="xMidYMin meet" aria-hidden="true"><svg x="56" y="28" width="336" height="528" viewBox="0 0 448 704" overflow="hidden" preserveAspectRatio="none"><image href={assetUrl('sprites/lantern-war/endless/dialogue-'+id+'.png')} x={-frame*448} y="0" width="1792" height="704" preserveAspectRatio="none"/></svg></svg>;}
 const frame=['neutral','joy','concern','resolve'].indexOf(reaction);return <svg className={'lw-dialogue-portrait lw-portrait-normalized'+(['nagi','mio','sena'].includes(id)?' is-small':'')} style={{transform:flip?'scaleX(-1)':undefined}} data-dialogue-original={['aster','lyra'].includes(id)?id:undefined} data-reaction={reaction} viewBox="0 0 448 704" overflow="hidden" preserveAspectRatio="xMidYMin meet" aria-hidden="true"><svg width="448" height="704" overflow="hidden"><image href={assetUrl('sprites/lantern-war/dialogue-normalized/'+id+'.webp')} x={-Math.max(0,frame)*448} y="0" width="1792" height="704"/></svg></svg>;
}
export function cutin(id:string,name?:string){
 if(ENDLESS_CAST.some(h=>h.id===id))return 'sprites/lantern-war/endless/cutins.png';
 const techniques=PERSONAL_TECHNIQUES[id];
 if(!techniques)return null;
 const technique=techniques.find(t=>t.name===name);
 return 'sprites/lantern-war/cutins/'+id+'-'+(technique?.id||'ultimate')+'.webp';
}

export function EndlessCutin({id}:{id:string}){const row=ENDLESS_CAST.findIndex(h=>h.id===id);return <svg viewBox="0 0 1536 256" aria-hidden="true"><image href={assetUrl('sprites/lantern-war/endless/cutins.png')} width="1536" height="1024" y={-Math.max(0,row)*256}/></svg>;}
