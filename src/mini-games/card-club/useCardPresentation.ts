import { useLayoutEffect, useRef } from 'react';
import type { RefObject } from 'react';
import { audioService } from '../../services/audioService';
import type { ClubView } from './model';
import { presentationDelta,presentationSnapshot,type PresentationState } from './presentation';

type PositionedCard={
  card:number;rect:DOMRect;width:number;height:number;html:string;className:string;
  hand:boolean;table:boolean;node:HTMLElement;seat?:number;angle:number;
};
type Snapshot={view:PresentationState;cards:PositionedCard[];seats:DOMRect[];stock:DOMRect|null};

function cardLayout(host:HTMLElement){
  const visible=(el:HTMLElement)=>{
    const r=el.getBoundingClientRect();
    if(r.width<=0||r.height<=0||r.right<=0||r.left>=innerWidth||r.bottom<=0||r.top>=innerHeight)return false;
    const panel=el.closest('.cc-hand,.cc-seat-notes,.cc-playfield');if(!panel)return true;
    const p=panel.getBoundingClientRect();return r.right>p.left&&r.left<p.right&&r.bottom>p.top&&r.top<p.bottom;
  };
  const nodes=Array.from(host.querySelectorAll<HTMLElement>('.cc-match .cc-card'));
  const cards=nodes.filter(visible).map((el):PositionedCard=>{
    const group=el.closest<HTMLElement>('[data-club-play-seat]');
    return {
      node:el,card:Number(el.dataset.card),rect:el.getBoundingClientRect(),width:el.offsetWidth,height:el.offsetHeight,
      html:el.innerHTML,className:el.className,hand:!!el.closest('.cc-hand'),
      table:!!group||!!el.closest('.cc-table-cards, .cc-seat-center'),
      seat:group?Number(group.dataset.clubPlaySeat):undefined,angle:Number(group?.dataset.cardAngle??0),
    };
  });
  const seats=Array.from(host.querySelectorAll<HTMLElement>('[data-club-seat]')).map(el=>el.getBoundingClientRect());
  const stock=host.querySelector('.cc-stock-stack')?.getBoundingClientRect()??null;
  return {nodes,cards,seats,stock};
}

export function useCardPresentation(root:RefObject<HTMLElement|null>,view:ClubView|null){
  const previous=useRef<Snapshot|null>(null);
  useLayoutEffect(()=>{
    const host=root.current;if(!host||!view){previous.current=null;return;}
    const {nodes,cards,seats,stock}=cardLayout(host);
    const old=previous.current;previous.current={view:presentationSnapshot(view),cards,seats,stock};
    if(document.hidden)return;
    const delta=presentationDelta(old?.view??null,view);
    if(delta.cue)audioService.playCardClubSound(delta.cue);
    const collector=old&&!delta.deal?view.players.findIndex((p,i)=>p.takenCount>(old.view.players[i]?.takenCount??0)):-1;
    if(collector>=0&&delta.cue!=='collect')audioService.playCardClubSound('collect');
    if(matchMedia('(prefers-reduced-motion: reduce)').matches||typeof Element.prototype.animate!=='function')return;
    if(old&&!delta.deal&&old.view.revision===view.revision)return;

    const layer=document.createElement('div');layer.className='cc-flight-layer';layer.setAttribute('aria-hidden','true');host.append(layer);
    const animations:Animation[]=[];
    const fly=(from:DOMRect|undefined|null,to:DOMRect|undefined|null,card?:PositionedCard,delay=0,back=false,land=false)=>{
      if(!from||!to||from.width<=0||to.width<=0||layer.childElementCount>=16)return;
      const node=document.createElement('div');node.className=back?'cc-flying-back':`${card?.className??'cc-card'} cc-flying-card`;
      if(!back&&card)node.innerHTML=card.html;
      const width=card?.width??44,height=card?.height??64;
      const left=to.left+(to.width-width)/2,top=to.top+(to.height-height)/2;
      node.style.cssText=`position:absolute;left:${left}px;top:${top}px;width:${width}px;height:${height}px;margin:0;pointer-events:none;`;
      node.style.opacity='0';
      layer.append(node);
      const dx=from.left+(from.width-width)/2-left,dy=from.top+(from.height-height)/2-top;
      const rawAngle=land?(card?.angle??0):0;
      const angle=rawAngle>180?rawAngle-360:rawAngle;
      const duration=delta.deal?400:290;
      if(land&&card){
        node.dataset.seated='';
        node.style.fontSize=getComputedStyle(card.node).fontSize;
        animations.push(card.node.animate([{opacity:0},{opacity:0}],{duration:duration+delay}));
      }
      const animation=node.animate([
        {transform:`translate(${dx}px,${dy}px) scale(.8) rotate(${angle*.22-9}deg)`,opacity:0.75},
        {transform:`translate(${dx*.45}px,${dy*.45-10}px) scale(1.08) rotate(${angle*.72+4}deg)`,opacity:1,offset:.5},
        {transform:`translate(0,0) scale(1) rotate(${angle}deg)`,opacity:land?1:0},
      ],{duration,delay,easing:'cubic-bezier(.2,.7,.25,1)'});
      animations.push(animation);
    };
    if(delta.deal){
      // Deal only a few representative cards; every recipient sees backs at other seats.
      cards.filter(c=>c.hand).slice(0,6).forEach((card,i)=>fly(stock??seats[view.dealer],card.rect,card,i*30,true));
      seats.forEach((seat,i)=>{if(i!==view.self&&view.players[i].handCount)fly(stock??seats[view.dealer],seat,undefined,i*25,true);});
      if(!cards.some(c=>c.hand))nodes.slice(0,Math.max(0,12-animations.length)).forEach((el,i)=>{animations.push(el.animate([{opacity:.25,transform:'scale(.92)'},{opacity:1,transform:'scale(1)'}],{duration:230,delay:i*12}));});
    }else if(old){
      const actor=delta.events.find(e=>e.player!==undefined)?.player??old.view.turn;
      const donor=view.players.findIndex((p,i)=>i!==view.self&&p.handCount<(old.view.players[i]?.handCount??0));
      const added=cards.filter(c=>c.card>=0&&!old.cards.some(before=>before.card===c.card&&before.hand===c.hand&&before.seat===c.seat));
      added.slice(0,13).forEach((card,i)=>{
        // A card that changed from back to front flips in place, never flies from a hidden hand.
        if(!card.hand&&delta.cue==='flip'&&!card.node.closest('.cc-durak-table')){
          const body=card.node.querySelector<HTMLElement>('.cc-card-body');
          // New reveal slots (War, stock, blind draws) need a flip even without a prior DOM back.
          if(body&&!body.getAnimations().length&&animations.length<12)animations.push(body.animate([{transform:'rotateY(180deg)'},{transform:'rotateY(0)'}],{duration:280,easing:'ease-out'}));
          return;
        }
        const owner=card.seat;
        const known=old.cards.find(c=>c.card===card.card&&(owner===undefined||(owner===view.self&&c.hand)));
        const origin=owner!==undefined?seats[owner]:card.hand&&view.stock<old.view.stock?old.stock:
          old.seats[card.hand&&donor>=0?donor:actor];
        fly(known?.rect??origin,card.rect,card,i*18,card.hand&&!known,owner!==undefined);
      });
      const blind=cards.filter(c=>c.table&&c.card<0),blindBefore=old.cards.filter(c=>c.table&&c.card<0).length;
      blind.slice(blindBefore).slice(0,4).forEach((card,i)=>fly(old.seats[actor],card.rect,card,i*24,true));
      if(collector>=0){
        // The seated table keeps the finished trick in view until the next lead.
        const gathered=[...old.cards,...cards].filter(c=>c.table&&c.card>=0&&c.seat===undefined);
        [...new Map(gathered.map(c=>[c.card,c])).values()].slice(0,5).forEach((card,i)=>fly(card.rect,seats[collector],card,90+i*18));
      }
      // Hidden opponent draws are represented by backs and public counts alone.
      const drawSource=view.stock<old.view.stock?old.stock:old.cards.find(c=>c.table)?.rect??old.seats[old.view.turn];
      view.players.forEach((p,i)=>{if(i!==view.self&&p.handCount>(old.view.players[i]?.handCount??0))fly(drawSource,seats[i],undefined,0,true);});
    }
    void Promise.all(animations.map(a=>a.finished.catch(()=>{}))).then(()=>layer.remove());
    return ()=>{animations.forEach(a=>a.cancel());layer.remove();};
  },[root,view]);
  return ()=>{if(root.current&&previous.current)previous.current={...previous.current,...cardLayout(root.current)};};
}
