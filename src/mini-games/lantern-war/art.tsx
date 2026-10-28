import React,{useEffect,useState} from 'react';
import {assetUrl} from '../../utils/assetPaths';
import {battleSource,type BattleAction} from './battleSources';
export type ArtAction=BattleAction;
export function battleArt(id:string,action:ArtAction='ready',frame=0){const source=battleSource(id,action,frame);return {src:source.path,cols:source.cols,rows:source.rows,frame:source.index};}
export function Atlas({src,cols=1,rows=1,frame=0,className=''}:{src:string;cols?:number;rows?:number;frame?:number;className?:string}){
 return <svg className={'lw-atlas '+className} viewBox="0 0 100 100" aria-hidden="true" preserveAspectRatio="xMidYMid meet"><svg x="0" y="0" width="100" height="100" overflow="hidden"><image href={assetUrl(src)} x={-(frame%cols)*100} y={-Math.floor(frame/cols)*100} width={cols*100} height={rows*100} preserveAspectRatio={cols===1&&rows===1?'xMidYMax meet':'none'}/></svg></svg>;
}
export function BattleArt({id,action='ready',className=''}:{id:string;action?:ArtAction;className?:string}){
 const [frame,setFrame]=useState(0);
 useEffect(()=>{setFrame(0);if(action==='ready')return;const timer=setInterval(()=>setFrame(f=>(f+1)%4),160);return()=>clearInterval(timer);},[id,action]);
 return <Atlas {...battleArt(id,action,frame)} className={className}/>;
}
export function MapArt({id,direction=2,walking=false}:{id:string;direction?:number;walking?:boolean}){
 if(['aster','lyra','nagi','mio','sena'].includes(id))return <Atlas src={'sprites/lantern-war/'+id+'-map.webp'} cols={4} rows={3} frame={direction+(walking?4:0)}/>;
 if(id==='civil')return <Atlas src="sprites/wandering-student/high-school-caretaker.webp" cols={4} rows={2} frame={direction}/>;
 if(id.startsWith('enemy-'))return <Atlas src={'sprites/furai-sfc-v2-enemy-5x5-1.webp'} cols={5} rows={5} frame={Number(id.slice(6))%6}/>;
 return <Atlas src={id.startsWith('dungeons2-')?'sprites/dungeons2/'+id.slice(10)+'-directions.webp':'sprites/wandering-student/'+id+'.webp'} cols={4} rows={2} frame={direction}/>;
}
export function Portrait({id,reaction='neutral'}:{id:string;reaction?:'neutral'|'joy'|'concern'|'resolve'}){
 const frame=['neutral','joy','concern','resolve'].indexOf(reaction);return <svg className={'lw-dialogue-portrait lw-portrait-normalized'+(['nagi','mio','sena'].includes(id)?' is-small':'')} data-dialogue-original={['aster','lyra'].includes(id)?id:undefined} data-reaction={reaction} viewBox="0 0 448 704" overflow="hidden" preserveAspectRatio="xMidYMin meet" aria-hidden="true"><svg width="448" height="704" overflow="hidden"><image href={assetUrl('sprites/lantern-war/dialogue-normalized/'+id+'.webp')} x={-Math.max(0,frame)*448} y="0" width="1792" height="704"/></svg></svg>;
}
export function cutin(id:string){if(['aster','lyra','nagi','mio','sena'].includes(id))return null;if(id.startsWith('enemy-'))return null;return 'sprites/ultimate-cutins/'+id+'-skill-'+(id.startsWith('dungeons2-')?'3':'1')+(id.startsWith('magic-')?'-transformed':'')+'.webp';}
