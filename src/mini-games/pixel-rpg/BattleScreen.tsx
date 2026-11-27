import { useEffect, useState, type CSSProperties } from 'react';
import { Shield, Sparkles, HeartPulse, Target as AimIcon, ChevronDown, Flame, FlaskConical, BookOpen, ChevronRight, Flag, Zap, ScrollText } from 'lucide-react';
import CardView from '../../components/Card';
import { CardType } from '../../types';
import { COMBOS, HEROES, ITEMS, JOBS, type ItemId, type Target } from './catalog';
import { REGIONS } from './campaign';
import { LIMIT_MAX, LINK_MAX, availableCombos, battleItem, canPlay, comboMembers, cursorTarget, describeIntent, elementLabel, endTurn, explain, fighter, flee, inspect, living, orderOf, playCard, useCombo, useLimit, type Battle, type Fighter, type PlayedCard, type ResolvedCard } from './battle';
import { BattleCanvas, Meter, Panel, positionStyle, useWords } from './presentation';
import { type Animation } from './art';
import { TechniqueArtwork, TechniqueStrip } from './CardArtwork';
import TravelerPortrait from './TravelerPortrait';
import type { Settings } from './adventure';

export function CardInfo({card}:{card:ResolvedCard}){
  const {l,i,t}=useWords();
  return <div className="pr-card-info"><h3>{l(card.name)}{card.rank>0&&` +${card.rank}`} <small>{card.cost} EN</small></h3>
    <div>{card.parts.map((part,index)=><article key={`${part.id}:${index}`}><TechniqueArtwork technique={part}/><b>{l(part.name)}</b><p>{explain(part,i,card.rank,card.element)}</p></article>)}</div>
    {!card.parts.length&&<p>{t('敵によって混ぜられた札。使うと取り除ける。','A card planted by the enemy. Play it to remove it.')}</p>}</div>;
}

function handKind(card:ResolvedCard){
  if(!card.parts.length)return CardType.STATUS;
  if(card.parts.some(part=>part.skill.summon))return CardType.SUMMON;
  if(card.parts.some(part=>part.skill.damage))return CardType.ATTACK;
  if(card.parts.some(part=>part.skill.transform||part.skill.strength))return CardType.POWER;
  return CardType.SKILL;
}

export default function BattleScreen({battle,actor,setActor,onCommand,onStudy,onOutcome,animation,settings,covered}:{
  battle:Battle;actor:string;setActor:(id:string)=>void;onCommand:(op:(b:Battle)=>Battle,actor?:string)=>void;
  onStudy:()=>void;onOutcome:()=>void;animation?:Animation;settings:Settings;covered:boolean;
}){
  const {l,t,i,language}=useWords();
  const [menu,setMenu]=useState<'link'|'items'|'log'|'options'>();
  const [detail,setDetail]=useState<ResolvedCard>();
  const [item,setItem]=useState<ItemId>();
  const [enemyCursor,setEnemyCursor]=useState<string>();
  const [supportCursor,setSupportCursor]=useState<{actor:string;target:string}>();
  const [preview,setPreview]=useState<Target>();
  const unit=fighter(battle,actor)??battle.party.find(p=>p.hp>0)??battle.party[0];
  const alive=living(battle), allies=battle.party.filter(p=>p.hp>0), combos=availableCombos(battle), phase=alive.some(e=>e.phase===2);
  const aimedEnemy=cursorTarget(battle,unit.id,'foe',enemyCursor);
  const supportTarget=supportCursor?.actor===unit.id?supportCursor.target:undefined;
  const aimedAlly=cursorTarget(battle,unit.id,'ally',undefined,supportTarget);
  const hasSupport=unit.hand.some(c=>inspect(c).target==='ally')||HEROES[unit.id].limit.target==='ally';
  const locked=Boolean(animation)&&settings.rateFx!=='instant';
  const inactive=locked||Boolean(battle.outcome);
  const isStudyReady=!battle.spentStudy&&(settings.quizHints==='turn'||settings.quizHints==='battle'&&!battle.learnedHelped);
  const nextEnemy=(delta:number)=>{
    if(!alive.length)return;
    const index=alive.findIndex(e=>e.id===aimedEnemy);
    setEnemyCursor(alive[(index+delta+alive.length)%alive.length].id);
  };
  const nextAlly=()=>{
    if(!allies.length)return;
    const index=allies.findIndex(p=>p.id===aimedAlly);
    setSupportCursor({actor:unit.id,target:allies[(index+1)%allies.length].id});
  };
  const play=(c:PlayedCard)=>{
    if(inactive||item||!canPlay(battle,unit,c))return;
    const target=inspect(c).target;
    setPreview(undefined);
    onCommand(b=>{
      const id=cursorTarget(b,unit.id,target,aimedEnemy,supportTarget);
      return id?playCard(b,unit.id,c.id,id):b;
    },unit.id);
  };
  const useFinale=()=>{
    const technique=HEROES[unit.id].limit;
    setItem(undefined);setPreview(undefined);
    onCommand(b=>{
      const id=cursorTarget(b,unit.id,technique.target,aimedEnemy,supportTarget);
      return id?useLimit(b,unit.id,id):b;
    },unit.id);
  };
  const useLink=(combo:typeof COMBOS[number])=>{
    const actor=comboMembers(battle,combo)[0]?.id;
    if(!actor)return;
    setMenu(undefined);setItem(undefined);setPreview(undefined);
    onCommand(b=>{
      const id=cursorTarget(b,actor,combo.tech.target,aimedEnemy,supportTarget);
      return id?useCombo(b,combo.id,id):b;
    },actor);
  };
  const itemTarget=(p:Fighter)=>item==='dew'?p.hp===0:!!item&&p.hp>0&&(
    p.hp<p.max||item==='salve'&&Boolean(p.poison||p.sealed||p.weak||p.expose));
  const pickAlly=(p:Fighter)=>{
    if(item){
      if(!itemTarget(p))return;
      onCommand(b=>battleItem(b,item,unit.id,p.id),unit.id);setItem(undefined);
    }else if(p.hp){setPreview(undefined);setSupportCursor(undefined);setActor(p.id);}
  };
  const showPoints=(p:Fighter)=>{
    const status=[p.poison>0?t('毒','Poison')+` ${p.poison}`:'',p.sealed>0?t('封印','Seal'):'',p.weak>0?t('弱体','Weak'):'',p.expose>0?t('脆弱','Exposed'):''].filter(Boolean).join(' · ');
    return <><span><HeartPulse size={11} /> {p.hp}/{p.max}</span><span><Shield size={11} /> {p.block}</span>{status&&<small className="pr-unit-status">{status}</small>}</>;
  };
  useEffect(()=>{
    if(battle.outcome){setItem(undefined);setMenu(undefined);setDetail(undefined);setPreview(undefined);}
  },[battle.outcome]);
  useEffect(()=>{
    if(covered||menu||detail)return;
    const keys=(e:KeyboardEvent)=>{
      if(e.defaultPrevented||e.target instanceof HTMLInputElement||e.target instanceof HTMLSelectElement||e.ctrlKey||e.metaKey||e.repeat)return;
      if(e.key==='Escape'&&item){e.preventDefault();setItem(undefined);return;}
      if(e.key==='Escape'&&!inactive){e.preventDefault();setMenu('options');return;}
      if(inactive||item)return;
      if(e.key==='ArrowLeft'||e.key==='ArrowRight'){e.preventDefault();nextEnemy(e.key==='ArrowLeft'?-1:1);}
      if(/^[1-7]$/.test(e.key)){
        const hand=unit.hand[Number(e.key)-1];
        if(hand&&canPlay(battle,unit,hand)){e.preventDefault();play(hand);}
      }
      if(e.key.toLowerCase()==='e'){e.preventDefault();onCommand(endTurn);}
    };
    window.addEventListener('keydown',keys);
    return()=>window.removeEventListener('keydown',keys);
  });
  const activeCue=animation?.cue;
  return <section className="pr-combat">
    <header className="pr-combat-top">
      <div><span>{phase?t('第二形態','Second phase'):battle.encounter.boss?t('番人戦','Guardian battle'):t('遭遇戦','Encounter')}</span><strong>{l(REGIONS[battle.encounter.region].name)}</strong></div>
      <b>TURN {battle.turn}</b>
      <button className="pr-icon" aria-label={t('戦闘の選択肢','Battle options')} onClick={()=>setMenu('options')} disabled={inactive}><Flag size={16} /></button>
    </header>
    <div className="pr-arena" data-finishing={Boolean(animation?.defeated?.length)&&!settings.reduceFx||undefined}>
      <BattleCanvas battle={battle} animation={animation} reduced={settings.reduceFx} />
      <div className="pr-arena-bar">
        <span><span className="pr-indicator pr-red" /> {t('敵の予兆','Enemy intents')}</span>
        <button type="button" onClick={()=>setMenu('log')} aria-label={t('戦闘記録','Battle log')}><ScrollText size={15}/></button>
        <span>{t('冒険隊','Travelers')} <span className="pr-indicator"/></span>
      </div>
      {alive.map((e,index)=>{
        const aimed=e.id===aimedEnemy, highlighted=preview==='foes'||aimed&&preview==='foe', target=HEROES[e.target];
        const slot=animation?.enemyOrder?.indexOf(e.id)??index;
        return <button key={e.id} style={positionStyle('enemy',slot<0?index:slot)} className={`pr-unit pr-unit-enemy ${aimed?'pr-enemy-aimed':''} ${highlighted?'pr-target':''}`}
          aria-pressed={aimed} onClick={()=>{setEnemyCursor(e.id);setPreview(undefined);}} aria-label={l(e.spec.name)} disabled={inactive||!!item}>
          {aimed&&<span className="pr-enemy-cursor" aria-hidden="true"><ChevronDown size={17} /></span>}
          <b>{e.spec.part?'◇ ':''}{l(e.spec.name)}</b><Meter value={e.hp} max={e.max} className="pr-meter-red" />
          <small>{e.hp}/{e.max}{e.block>0&&` · ◈${e.block}`} · {l(elementLabel(e.weakness))}</small>
          <span className="pr-intent">{e.intent==='charge'&&<Flame size={11}/>} {l(describeIntent(e))}{target&&['attack','charge','venom','seal','jam'].includes(e.intent)&&!(e.intent==='charge'&&e.spec.boss&&e.phase===2)&&<em>{l(target.name)}</em>}</span>
        </button>;
      })}
      {battle.party.map((p,index)=>{
        const targeted=itemTarget(p)||p.hp>0&&(preview==='party'||preview==='ally'&&p.id===aimedAlly||preview==='self'&&p.id===unit.id);
        return <button key={p.id} style={positionStyle('party',index)} className={`pr-unit pr-unit-ally ${p.id===unit.id?'pr-unit-selected':''} ${targeted?'pr-target':''}`}
          disabled={inactive||(item?!itemTarget(p):!p.hp)} aria-label={l(HEROES[p.id].name)} onClick={()=>pickAlly(p)}>
          <b>{l(HEROES[p.id].name)}</b><Meter value={p.hp} max={p.max} /><div>{showPoints(p)}</div>
        </button>;
      })}
      {animation?.actors.length&&!settings.reduceFx&&<div className="pr-cut" aria-hidden="true">
        {animation.actors.map(id=>orderOf(battle,id)&&<div key={id} className="pr-cut-portrait"><TravelerPortrait id={id} name={l(HEROES[id].name)} reaction="resolve" /></div>)}
      </div>}
      {animation&&activeCue&&<aside key={animation.at} className={`pr-play-cue pr-play-${activeCue.kind}`} aria-live="polite"
        style={{'--pr-cue-ms':`${animation.duration}ms`} as CSSProperties}>
        {!settings.reduceFx&&<TechniqueStrip parts={activeCue.parts} />}
        <div>{activeCue.kind!=='card'&&<small>{activeCue.kind==='link'?t('連携','Link'):t('決め技','Finale')}</small>}
          <b>{l(activeCue.name)}</b></div>
      </aside>}
      {battle.outcome&&(!animation||settings.reduceFx)&&<div className="pr-outcome" role="status">
        <small>{battle.outcome==='win'?'VICTORY':battle.outcome==='loss'?'DEFEAT':'RETREAT'}</small>
        <strong>{battle.outcome==='win'?t('勝利！','Victory!'):battle.outcome==='loss'?t('冒険隊は力尽きた','The party fell'):t('無事に退いた','Retreated safely')}</strong>
        <p>{battle.outcome==='loss'?t('記録した休憩地点から再開します。','Resume at the last resting point.'):battle.outcome==='win'?t('経験値と熟練度を獲得。','Earn experience and job mastery.'):t('少しの間、敵との遭遇を避けます。','Avoid encounters briefly after retreating.')}</p>
        <button data-gamepad-initial-choice className="pr-primary" onClick={onOutcome} disabled={locked}>{battle.outcome==='loss'?t('休憩地点へ','Return to checkpoint'):t('続ける','Continue')}</button>
      </div>}
    </div>
    <section className="pr-battle-deck" aria-label={t('手札','Hand')}>
      <div className="pr-deck-meta">
        <div><b>{l(HEROES[unit.id].name)}</b><span>{l(JOBS[unit.hero.job].name)}</span></div>
        <span className="pr-energy" aria-label={t('エナジー','Energy')}><Zap size={13}/>{unit.energy} EN</span>
        <span className="pr-piles">{t('山札','Draw')} {unit.draw.length} / {t('捨て札','Discard')} {unit.discard.length}</span>
        {hasSupport&&allies.length>1&&aimedAlly&&<button type="button" className="pr-support-target" onClick={nextAlly} disabled={inactive||!!item}>
          <AimIcon size={12} /> {t('支援','Support')}<b>{aimedAlly===unit.id?t('自分','Self'):l(HEROES[aimedAlly].name)}</b>
        </button>}
        <div className="pr-link"><Sparkles size={13}/><span>LINK {battle.link}/{LINK_MAX}</span><Meter value={battle.link} max={LINK_MAX}/></div>
      </div>
      {item&&<div className="pr-target-bar">
        <div><strong>{l(ITEMS[item].name)}</strong><small>{t('盤面の味方を選ぶ','Select an ally above')}</small></div>
        <button onClick={()=>setItem(undefined)}>{t('取り消す','Cancel')}</button>
      </div>}
      <div className="pr-hand">
        {unit.hand.map((c,index)=>{
          const card=inspect(c),name=l(card.name)+(card.rank?` +${card.rank}`:'');
          const description=card.parts.map(p=>explain(p,i,card.rank,card.element)).join('\n')||t('使用すると取り除く。','Play to remove.');
          const disabled=inactive||!!item||!canPlay(battle,unit,c);
          return <div key={c.id} className="pr-hand-slot" onPointerEnter={()=>!disabled&&setPreview(card.target)} onPointerLeave={()=>setPreview(undefined)}
            onFocus={()=>!disabled&&setPreview(card.target)} onBlur={()=>setPreview(undefined)}>
            <CardView className="pr-hand-card" card={{id:`traveler-${unit.id}-${c.id}`,name,cost:card.cost,type:handKind(card),description,rarity:'COMMON'}}
              presentation={{name,description,artwork:<TechniqueStrip parts={card.parts}/>}} languageMode={language} gamepadZone="pixel-rpg-hand" gamepadOrder={index}
              onClick={()=>play(c)} onInspect={()=>{setPreview(undefined);setDetail(card);}} disabled={disabled} />
          </div>;
        })}
        {!unit.hand.length&&<p className="pr-hand-empty">{t('手札がない。ターンを終えて引き直す。','No cards left. End the turn to draw.')}</p>}
      </div>
      <nav className="pr-battle-actions">
        <button className={isStudyReady?'pr-study-ready':''} disabled={inactive||battle.spentStudy} onClick={()=>{setItem(undefined);setPreview(undefined);onStudy();}}><BookOpen size={15}/>{t('ひらめき','Study')}</button>
        <button disabled={inactive} onClick={()=>setMenu('items')}><FlaskConical size={15}/>{t('道具','Items')}</button>
        <button disabled={inactive||!combos.length} onClick={()=>setMenu('link')}><Sparkles size={15}/>{t('連携','Link')}</button>
        <button disabled={inactive||unit.limit<LIMIT_MAX} onClick={useFinale}><AimIcon size={15}/>{t('決め技','Finale')} {unit.limit}/{LIMIT_MAX}</button>
        <button className="pr-primary pr-endturn" disabled={inactive} onClick={()=>{setItem(undefined);setPreview(undefined);onCommand(endTurn);}}>{t('ターン終了','End turn')} <ChevronRight size={15}/></button>
      </nav>
    </section>
    {detail&&<Panel heading={l(detail.name)} close={()=>setDetail(undefined)}><CardInfo card={detail}/></Panel>}
    {menu&&<Panel heading={menu==='link'?t('連携技','Link techniques'):menu==='items'?t('戦闘道具','Battle items'):menu==='log'?t('戦闘記録','Battle log'):t('戦闘の選択肢','Battle options')} close={()=>setMenu(undefined)}>
      {menu==='link'&&<div className="pr-list">
        <p>{t('味方のカードや学習で溜める。ゲージが満ちると発動できる。','Fill the gauge with party cards and study, then unleash a Link.')}</p>
        {COMBOS.map(c=><button key={c.id} disabled={!combos.includes(c)||battle.link<LINK_MAX||inactive} onClick={()=>useLink(c)}>
          <span><b>{l(c.name)}</b><small>{explain(c.tech,i)}</small></span><span>{combos.includes(c)?`${battle.link}/${LINK_MAX}`:t('編成条件','Formation')}</span>
        </button>)}
      </div>}
      {menu==='items'&&<div className="pr-list">{(Object.keys(ITEMS) as ItemId[]).filter(id=>id!=='oil').map(id=><button key={id} disabled={!battle.items[id]||!unit.freeItem||inactive} onClick={()=>{setMenu(undefined);setPreview(undefined);setItem(id);}}>
        <span><b>{l(ITEMS[id].name)}</b><small>{l(ITEMS[id].desc)}</small></span><span>×{battle.items[id]}</span></button>)}</div>}
      {menu==='log'&&<div className="pr-list">
        {alive.some(e=>e.spec.part)&&<p>{t('部位が残っている間、本体のダメージが軽減される。貫通効果は無視できる。','The active part reduces damage to the guardian. Piercing attacks ignore it.')}</p>}
        {alive.map(e=><article key={e.id}><span><b>{l(e.spec.name)}</b><small>{l(describeIntent(e))} · {t('弱点','Weakness')} {l(elementLabel(e.weakness))}</small></span><span>{e.hp}/{e.max}</span></article>)}
        {battle.history.map((line,index)=><p key={index}>{l(line)}</p>)}
        {!battle.history.length&&<p>{t('敵の予兆を見て、手札から行動を選ぼう。','Read the enemy intents, then act from your hand.')}</p>}
      </div>}
      {menu==='options'&&<div className="pr-list">
        <button disabled={!!battle.encounter.boss||inactive} onClick={()=>{setMenu(undefined);onCommand(flee);}}>{t('退却する','Retreat')}</button>
        <p>{t('敵をタップするか左右キーで照準を変更。カードはタップまたは1〜7で即使用、長押しで詳細。味方への支援先は手札の上で変更できる。Eでターン終了。','Tap an enemy or use Left and Right to aim. Tap a card or press 1–7 to play it. Hold a card to read it. Change ally support above the hand. Press E to end the turn.')}</p>
      </div>}
    </Panel>}
  </section>;
}
