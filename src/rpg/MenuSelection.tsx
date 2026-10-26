import React,{useEffect,useState} from 'react';
import{createPortal}from'react-dom';
import './menu-selection.css';
/** Adds a shared item inspector without replacing each menu's actions or forms. */
export default function MenuSelection(){
 const [selection,setSelection]=useState<{panel:HTMLElement;item:HTMLElement;title:string;description:string;image?:string}|null>(null);
 useEffect(()=>{
  const choose=(event:Event)=>{
   const target=event.target as HTMLElement;if(!target.closest)return;
   const panel=target.closest<HTMLElement>('.rpg-root .rpg-dialog,.rpg-root .rpg-life,.rpg-life-backdrop .rpg-life,.rpg-root .rpg-detail-sheet,.rpg-root .rpg-settings,.rpg-root .rpg-hero-builder');
   if(!panel||target.closest('.rpg-selection-detail'))return;
   if(target.closest('nav,header')){setSelection(null);return;}
   const item=target.closest<HTMLElement>('article,[data-rpg-choice],.rpg-team-member-row,.rpg-life-bag>span');if(!item||!panel.contains(item))return;
   const title=item.querySelector('h3,h4,strong')?.textContent||item.getAttribute('aria-label')||'';
   if(!title.trim())return;
   const description=Array.from(item.querySelectorAll('p,small')).map(n=>n.textContent?.trim()).filter(Boolean).join(' · ');
   setSelection({panel,item,title,description,image:item.querySelector('img')?.src});
  };
  document.addEventListener('click',choose,true);document.addEventListener('focusin',choose,true);
  return()=>{document.removeEventListener('click',choose,true);document.removeEventListener('focusin',choose,true);};
 },[]);
 useEffect(()=>{
  if(!selection)return;const{panel,item}=selection;panel.classList.add('rpg-menu-inspected');item.classList.add('rpg-menu-selected');
  const observer=new MutationObserver(()=>{if(!panel.isConnected||!item.isConnected){setSelection(null);return;}const description=Array.from(item.querySelectorAll('p,small')).map(n=>n.textContent?.trim()).filter(Boolean).join(' · ');setSelection(current=>current&&current.description!==description?{...current,description}:current);});observer.observe(document.body,{childList:true,characterData:true,subtree:true});
  return()=>{panel.classList.remove('rpg-menu-inspected');item.classList.remove('rpg-menu-selected');observer.disconnect();};
 },[selection]);
 return selection&&selection.panel.isConnected?createPortal(<aside className="rpg-selection-detail" aria-live="polite">{selection.image&&<img src={selection.image} alt=""/>}<div><h3>{selection.title}</h3><p>{selection.description}</p></div></aside>,selection.panel):null;
}
