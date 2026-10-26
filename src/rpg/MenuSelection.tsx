import {VoxelIcon} from './VoxelWorkshopPanel';
import React,{useEffect,useRef,useState} from 'react';
import{createPortal}from'react-dom';
import {InspectSlot} from '../components/item-menu/InspectSlot';
import './menu-selection.css';
type Choice={panel:HTMLElement;item:HTMLElement;title:string;description:string;image?:string;art?:React.CSSProperties;actions:HTMLButtonElement[];labels:string[];disabled:boolean[];signature:string;material?:string;count?:string};
const panels='.rpg-root .rpg-dialog,.rpg-root .rpg-life,.rpg-life-backdrop .rpg-life,.rpg-root .rpg-detail-sheet,.voxel-workshop';
const cells='.rpg-life-grid>article,.rpg-life-bag>span,.rpg-fish-catalog>article,.farm-grid>article,.voxel-material-grid>article,.voxel-recipe-grid>article,.voxel-storage-list>article';
function read(item:HTMLElement,panel:HTMLElement):Choice|null{
 const original=(selector:string)=>[...item.querySelectorAll<HTMLElement>(selector)].filter(el=>!el.closest('.rpg-slot-face'));
 const title=item.dataset.itemName||original('h3,h4')[0]?.textContent||original('strong,b')[0]?.textContent||item.getAttribute('aria-label')||'';
 if(!title.trim())return null;
 const actions=original('button').filter(el=>!el.closest('.rpg-slot-face')) as HTMLButtonElement[];
 const description=(item.dataset.itemCount!==undefined?`${title}: ${item.dataset.itemCount} · `:'')+ (original('p,small,li').map(el=>el.textContent?.trim()).filter(Boolean).join(' · ')||original('span,strong').filter(el=>!el.hasAttribute('aria-hidden')&&!el.classList.contains('rpg-life-sprite')).map(el=>el.textContent?.trim()).filter(Boolean).join(' · '));
 const image=(original('img')[0] as HTMLImageElement|undefined)?.src;
 const sprite=original('[style*="background-image"]')[0],style=sprite?getComputedStyle(sprite):null;
 const art=style?{backgroundImage:style.backgroundImage,backgroundPosition:style.backgroundPosition,backgroundSize:style.backgroundSize}:undefined;
 const labels=actions.map(button=>button.getAttribute('aria-label')||button.title||button.textContent?.trim()||title),disabled=actions.map(button=>button.disabled);
 return {panel,item,title:title.trim(),description,image,art,actions,labels,disabled,material:item.dataset.material,count:item.dataset.itemCount,signature:JSON.stringify([title,description,image,art,labels,disabled,item.dataset.itemCount])};
}
/** Compact item surfaces keep their existing React actions, reached only from the inspector. */
export default function MenuSelection(){
 const [items,setItems]=useState<Choice[]>([]),[selection,setSelection]=useState<Choice|null>(null),current=useRef(selection);current.current=selection;
 useEffect(()=>{
  let frame=0;const decorated=new Set<HTMLElement>(),grids=new Set<HTMLElement>();
  const scan=()=>{
   const next:Choice[]=[];
   document.querySelectorAll<HTMLElement>(panels).forEach(panel=>panel.querySelectorAll<HTMLElement>(cells).forEach(item=>{
    // Budgets, names, filters and settings retain their native form layout.
    if(item.querySelector('input,select,textarea')||item.closest('.rpg-selection-detail'))return;
    const choice=read(item,panel);if(!choice)return;
    if(!decorated.has(item)){decorated.add(item);item.classList.add('rpg-compact-item');if(item.parentElement){grids.add(item.parentElement);item.parentElement.classList.add('rpg-compact-grid');}}
    next.push(choice);
   }));
   for(const item of decorated)if(!next.some(c=>c.item===item)){item.classList.remove('rpg-compact-item');decorated.delete(item);}
   for(const grid of grids)if(!grid.querySelector(':scope>.rpg-compact-item')){grid.classList.remove('rpg-compact-grid');grids.delete(grid);}
   setItems(prev=>prev.length===next.length&&prev.every((v,i)=>v.item===next[i].item&&v.signature===next[i].signature)?prev:next);
   const selected=current.current;if(selected){if(!selected.item.isConnected||!selected.panel.isConnected)setSelection(null);else{const updated=next.find(v=>v.item===selected.item)||read(selected.item,selected.panel);if(updated&&updated.signature!==selected.signature)setSelection(updated);}}
  };
  const schedule=()=>{if(!frame)frame=requestAnimationFrame(()=>{frame=0;scan();});};
  const choose=(event:Event)=>{const target=event.target as HTMLElement;if(!target.closest||target.closest('.rpg-slot-face,.rpg-selection-detail'))return;const panel=target.closest<HTMLElement>(panels);if(!panel)return;if(target.closest('nav,header,.rpg-room-filters')){setSelection(null);return;}const item=target.closest<HTMLElement>('article,[data-rpg-choice],.rpg-team-member-row');if(item&&!item.classList.contains('rpg-compact-item')){const choice=read(item,panel);if(choice)setSelection(choice);}};
  scan();const observer=new MutationObserver(schedule);observer.observe(document.body,{childList:true,characterData:true,subtree:true,attributes:true,attributeFilter:['disabled']});document.addEventListener('focusin',choose,true);document.addEventListener('click',choose,true);
  return()=>{observer.disconnect();cancelAnimationFrame(frame);document.removeEventListener('focusin',choose,true);document.removeEventListener('click',choose,true);for(const item of decorated)item.classList.remove('rpg-compact-item');for(const grid of grids)grid.classList.remove('rpg-compact-grid');};
 },[]);
 useEffect(()=>{if(!selection)return;selection.panel.classList.add('rpg-menu-inspected');selection.item.classList.add('rpg-menu-selected');return()=>{selection.panel.classList.remove('rpg-menu-inspected');selection.item.classList.remove('rpg-menu-selected');};},[selection]);
 return <>{items.filter(c=>c.item.isConnected).map((c,i)=>createPortal(<InspectSlot className="rpg-slot-face item-menu-slot" aria-label={c.title} aria-pressed={selection?.item===c.item} onInspect={()=>setSelection(c)}>{c.material?<VoxelIcon block={c.material}/>:c.image?<img src={c.image} alt=""/>:c.art?<span className="rpg-slot-art" aria-hidden="true" style={c.art}/>:<span className="rpg-slot-glyph" aria-hidden="true">◇</span>}<span className="item-menu-label">{c.title}</span>{c.count!==undefined&&<span className="item-menu-count">×{c.count}</span>}</InspectSlot>,c.item,String(i)))}{selection&&selection.panel.isConnected?createPortal(<aside className="rpg-selection-detail" aria-live="polite">{selection.material?<VoxelIcon block={selection.material}/>:selection.image?<img src={selection.image} alt=""/>:selection.art?<span className="rpg-slot-art" aria-hidden="true" style={selection.art}/>:null}<div className="rpg-selection-copy"><h3>{selection.title}</h3><p>{selection.description}</p></div><div className="item-menu-actions">{selection.actions.map((button,i)=><button key={i} disabled={selection.disabled[i]} onClick={()=>{if(button.isConnected&&!button.disabled)button.click();}}>{selection.labels[i]}</button>)}</div></aside>,selection.panel):null}</>;
}
