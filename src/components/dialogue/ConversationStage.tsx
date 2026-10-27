import React, {useEffect, useRef, useState} from 'react';
import {createPortal} from 'react-dom';
import {assetUrl} from '../../utils/assetPaths';
import {DIALOGUE_PORTRAITS} from '../../data/dialoguePortraits.generated';
import './conversation.css';

export type Reaction = 'neutral' | 'joy' | 'concern' | 'resolve';
export type ConversationActor = {id:string;name:string;reaction?:Reaction;echo?:boolean};
const expressions:Reaction[]=['neutral','joy','concern','resolve'];

export function ReactionPortrait({actor,mirror=false}:{actor:ConversationActor;mirror?:boolean}) {
  const art=DIALOGUE_PORTRAITS[actor.id], [failed,setFailed]=useState(false),[missing,setMissing]=useState(false);
  useEffect(()=>{setFailed(false);setMissing(false);},[art?.sheet,actor.id]);
  const fallback=failed||!art?.sheet,src=fallback?art?.fallback:art.sheet;
  return <span className={`conversation-portrait ${mirror?'is-mirrored':''} ${actor.echo?'is-echo':''}`} data-portrait={actor.id} data-reaction={actor.reaction||'neutral'} aria-hidden="true">
    {src&&!missing?<svg viewBox={`${fallback?0:(art.focusX??192)-192} ${fallback?0:art.top} 384 ${fallback?576:576-art.top}`} preserveAspectRatio="xMidYMin slice" focusable="false"><svg x="0" y="0" width="384" height="576" overflow="hidden"><image href={assetUrl(src)} onError={()=>{if(fallback)setMissing(true);else setFailed(true);}} x={fallback?0:-expressions.indexOf(actor.reaction||'neutral')*384} y={fallback?0:-art.row*576} width={fallback?384:art.columns*384} height={fallback?576:art.rows*576} preserveAspectRatio={fallback?'xMidYMax meet':'none'}/></svg></svg>:<span className="conversation-missing">✦</span>}
  </span>;
}

/** One readable dialogue surface. Reading does not alter the caller's story state. */
export default function ConversationStage({title,eyebrow,background,left,right,active='right',speaker,text,lineKey,progress,children,onClose,closeLabel='Close',modal=true,className='',theme='dungeon',illustration=false,singleActor=false}:{
  title:string;eyebrow?:string;background:string;left:ConversationActor;right:ConversationActor;
  active?:'left'|'right'|'narrator';speaker:string;text:string;lineKey:string;progress?:string;
  children:React.ReactNode;onClose?:()=>void;closeLabel?:string;modal?:boolean;className?:string;theme?:'dungeon'|'sea';illustration?:boolean;singleActor?:boolean;
}) {
  const root=useRef<HTMLElement>(null);
  const previousFocus=useRef(typeof document==='undefined'?null:document.activeElement as HTMLElement|null);
  useEffect(()=>{
    const previous=previousFocus.current;
    return()=>{if(previous?.isConnected&&!document.querySelector('[data-conversation-stage]'))previous.focus();};
  },[]);
  useEffect(()=>{
    if(root.current&&!root.current.contains(document.activeElement)){
      const next=root.current.querySelector<HTMLButtonElement>('.conversation-actions .conversation-primary:not(:disabled),.conversation-actions button[data-gamepad-initial-choice]:not(:disabled)')||root.current.querySelector<HTMLButtonElement>('.conversation-actions button:not(:disabled),button:not(:disabled)');
      next?.focus();
    }
  },[lineKey,children]);
  const stage=<section ref={root} className={`conversation-stage conversation-${theme} ${singleActor?'conversation-solo':''} ${className}`} data-conversation-stage data-presentation={illustration?'illustration':'conversation'} data-gamepad-initial-scope={lineKey} data-gamepad-modal role={modal?'dialog':undefined} aria-modal={modal||undefined} aria-label={title} onPointerDown={e=>e.stopPropagation()} onKeyDown={event=>{
    event.stopPropagation();
    if(event.key==='Escape'&&onClose){event.preventDefault();onClose();}
    if(event.key==='Tab'){
      const controls=[...event.currentTarget.querySelectorAll<HTMLElement>('button:not(:disabled),a[href],input:not(:disabled),select:not(:disabled),[tabindex="0"]')].filter(n=>n.getClientRects().length),first=controls[0],last=controls.at(-1);
      if(event.shiftKey&&document.activeElement===first){event.preventDefault();last?.focus();}
      else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first?.focus();}
    }
  }}>
    <div className="conversation-landscape" style={{backgroundImage:`url(${assetUrl(background)})`}} aria-hidden="true"/><div className="conversation-veil" aria-hidden="true"/>
    <header className="conversation-header"><div>{eyebrow&&<small>{eyebrow}</small>}<h2>{title}</h2></div>{onClose&&<button data-gamepad-back onClick={onClose}>{closeLabel} <span aria-hidden="true">×</span></button>}</header>
    <div className="conversation-visuals" data-show-illustration={illustration}>
      {(theme==='sea'||illustration)&&<figure className="conversation-illustration" aria-hidden="true"><img src={assetUrl(background)} alt=""/></figure>}
      {(theme==='sea'||!illustration)&&<div className={`conversation-cast ${singleActor?'conversation-cast-single':''}`} aria-hidden={illustration||undefined}>
      {(singleActor?[{actor:left,side:'left'}]:[{actor:left,side:'left'},{actor:right,side:'right'}]).map(({actor,side})=><figure key={side} className={`conversation-actor conversation-${side} ${active===side?'is-speaking':'is-listening'}`} data-speaker-active={active===side}>
        <div className="conversation-actor-frame"/><ReactionPortrait actor={actor} mirror={side==='left'}/><figcaption><span>{actor.name}</span><i aria-hidden="true">{active===side?'◆':'◇'}</i></figcaption>
      </figure>)}
      {!singleActor&&<div className="conversation-distance" aria-hidden="true">✦</div>}
    </div>}
    </div>
    <div className={`conversation-script speaker-${active}`}><div className="conversation-speaker"><strong>{speaker}</strong>{progress&&<small>{progress}</small>}</div><p className="conversation-text" key={lineKey} role="status" aria-live="polite">{text}</p><div className="conversation-actions">{children}</div></div>
  </section>;
  return typeof document==='undefined'?stage:createPortal(stage,document.body);
}
