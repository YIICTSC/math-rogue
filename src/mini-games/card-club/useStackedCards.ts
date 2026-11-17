import {useLayoutEffect,type RefObject} from 'react';
/** Keep every exposed corner readable; long collections use multiple overlapping rows. */
export function useStackedCards(root:RefObject<HTMLElement|null>){
 useLayoutEffect(()=>{const host=root.current;if(!host)return;let frame=0;const observer=new ResizeObserver(()=>schedule());const watched=new Set<Element>();
 const layout=()=>{frame=0;for(const el of watched)if(!host.contains(el)){observer.unobserve(el);watched.delete(el);}host.querySelectorAll<HTMLElement>('.cc-hand,.cc-table-cards,.cc-public-hand,.cc-fantan-row,.cc-melds article>div,.cc-foundations article>div,.cc-layouts article>div:not(.cc-golf-grid):not(.cc-chinese-grid),.cc-mitch-row').forEach(el=>{
 const children=Array.from(el.children).filter(c=>c.matches('.cc-card,figure'));if(!children.length)return;
 if(!watched.has(el)){observer.observe(el);watched.add(el);}const card=children[0].matches('.cc-card')?children[0]:children[0].querySelector('.cc-card');const width=card?.getBoundingClientRect().width??0,available=el.clientWidth;
 if(!width||!available)return;const overflow=children.length*(width+6)>available;el.classList.toggle('cc-auto-stack',overflow);
 if(overflow){const cols=Math.min(children.length,Math.max(1,Math.floor((available-width)/30)+1));el.style.setProperty('--cc-stack-cols',String(cols));el.style.setProperty('--cc-stack-tail',`${Math.max(0,width-(available-width)/Math.max(1,cols-1))}px`);}
 });};const schedule=()=>{if(!frame)frame=requestAnimationFrame(layout);};const changes=new MutationObserver(schedule);changes.observe(host,{childList:true,subtree:true});observer.observe(host);schedule();return()=>{changes.disconnect();observer.disconnect();cancelAnimationFrame(frame);};
 },[root]);
}
