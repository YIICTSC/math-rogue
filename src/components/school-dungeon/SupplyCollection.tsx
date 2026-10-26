import './inventory-menu.css';
import React,{useState} from 'react';
import {InspectSlot} from '../item-menu/InspectSlot';
import {SchoolSupplyIcon} from './sprites';
export type SupplyChoice={id:string;type:string;name:string;description:string;badge?:string;count?:string|number;actions:{label:string;disabled?:boolean;run:()=>void}[]};
export function SupplyCollection({choices}:{choices:SupplyChoice[]}){
 const [selected,select]=useState(''),current=choices.find(c=>c.id===selected)||choices[0];
 return <div className="supply-collection"><div className="item-menu-grid">{choices.map(c=><InspectSlot key={c.id} className="item-menu-slot" aria-label={c.name} aria-pressed={current?.id===c.id} onInspect={()=>select(c.id)}><SchoolSupplyIcon type={c.type} size={36}/><span className="item-menu-label">{c.name}</span><span className="item-menu-count">{c.count}</span><span className="item-menu-badge">{c.badge}</span></InspectSlot>)}</div>{current&&<aside aria-live="polite"><h3>{current.name}</h3><p>{current.description}</p><div className="item-menu-actions">{current.actions.map(action=><button key={action.label} disabled={action.disabled} onClick={action.run}>{action.label}</button>)}</div></aside>}</div>;
}
