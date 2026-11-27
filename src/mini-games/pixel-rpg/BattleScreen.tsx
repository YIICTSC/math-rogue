import { useEffect, useState } from 'react';
import { Swords, Shield, Sparkles, HeartPulse, Target as AimIcon, Flame, FlaskConical, BookOpen, ChevronRight, Flag, Zap, ScrollText } from 'lucide-react';
import { COMBOS, HEROES, ITEMS, JOBS, type ItemId, type Target, type Technique } from './catalog';
import { REGIONS } from './campaign';
import { LIMIT_MAX, LINK_MAX, availableCombos, battleItem, canPlay, describeIntent, elementLabel, endTurn, explain, fighter, flee, inspect, living, orderOf, playCard, useCombo, useLimit, type Battle, type Fighter, type ResolvedCard } from './battle';
import { BattleCanvas, Meter, Panel, positionStyle, useWords } from './presentation';
import { illustration, type Animation } from './art';
import { getMagicCardArtUrl } from '../../utils/cardArtPaths';
import { getCardIllustrationPaths } from '../../utils/cardIllustration';
import type { Settings } from './adventure';

type Pending = { kind:'card'; id:number; card:ResolvedCard; actor:string } |
  { kind:'limit'|'combo'; id:string; tech:Technique; actor:string } |
  { kind:'item'; id:ItemId; actor:string };

function CardArt({technique}:{technique:Technique}){
  const source=technique.source;
  const paths=source?[...(getMagicCardArtUrl(source)?[getMagicCardArtUrl(source)!]:[]),...getCardIllustrationPaths(source.id,source.name)]:[];
  const [index,setIndex]=useState(0);
  return index<Math.min(paths.length,4)?<img className="pr-card-art" src={paths[index]} alt="" onError={()=>setIndex(i=>i+1)} />:null;
}
export function CardInfo({card}:{card:ResolvedCard}){
  const {l,i,t}=useWords();
  return <div className="pr-card-info"><h3>{l(card.name)}{card.rank>0&&` +${card.rank}`} <small>{card.cost} EN</small></h3>
    <div>{card.parts.map((p,index)=><article key={`${p.id}:${index}`}><CardArt technique={p}/><b>{l(p.name)}</b><p>{explain(p,i,card.rank,card.element)}</p></article>)}</div>
    {!card.parts.length&&<p>{t('敵によって混ぜられた札。使うと取り除ける。','A card planted by the enemy. Play it to remove it.')}</p>}</div>;
}

export default function BattleScreen({battle,actor,setActor,onCommand,onStudy,onOutcome,animation,settings,covered}:{
  battle:Battle;actor:string;setActor:(id:string)=>void;onCommand:(op:(b:Battle)=>Battle,actor?:string)=>void;
  onStudy:()=>void;onOutcome:()=>void;animation?:Animation;settings:Settings;covered:boolean;
}){
  const {l,t,i}=useWords();
  const [pending,setPending]=useState<Pending>(),[menu,setMenu]=useState<'link'|'items'|'log'|'options'|undefined>();
  const unit=fighter(battle,actor)??battle.party.find(p=>p.hp>0)??battle.party[0];
  const alive=living(battle), combos=availableCombos(battle), phase=alive.some(e=>e.phase===2);
  const locked=Boolean(animation)&&settings.rateFx!=='instant'&&!battle.outcome;
  const targetType:Target|undefined=pending?.kind==='card'?pending.card.target:pending?.kind==='item'?'ally':pending?.tech.target;
  const needsTarget=targetType==='foe'||targetType==='ally';
  const isStudyReady=!battle.spentStudy&&(settings.quizHints==='turn'||settings.quizHints==='battle'&&!battle.learnedHelped);
  const showPoints=(p:Fighter)=>{
    const status=[p.poison>0?t('毒','Poison')+` ${p.poison}`:'',p.sealed>0?t('封印','Seal'):'',p.weak>0?t('弱体','Weak'):'',p.expose>0?t('脆弱','Exposed'):''].filter(Boolean).join(' · ');
    return <><span><HeartPulse size={11} /> {p.hp}/{p.max}</span><span><Shield size={11} /> {p.block}</span>{status&&<small className="pr-unit-status">{status}</small>}</>;
  };
  const targetValid=(id:string,side:'enemy'|'party')=>side==='enemy'?targetType==='foe':targetType==='ally'&&(pending?.kind==='item'&&pending.id==='dew'?!orderOf(battle,id)?.hp:!!fighter(battle,id));
  const act=(id:string)=>{
    if(!pending||locked)return;
    const op=pending.kind==='card'?(b:Battle)=>playCard(b,pending.actor,pending.id,id)
      :pending.kind==='combo'?(b:Battle)=>useCombo(b,pending.id,id)
      :pending.kind==='limit'?(b:Battle)=>useLimit(b,pending.actor,id)
      :(b:Battle)=>battleItem(b,pending.id as ItemId,pending.actor,id);
    setPending(undefined);onCommand(op,pending.actor);
  };
  useEffect(()=>{
    if(battle.outcome){setPending(undefined);setMenu(undefined);}
  },[battle.outcome]);
  useEffect(()=>{
    if(covered||menu)return;
    const keys=(e:KeyboardEvent)=>{
      if(e.target instanceof HTMLInputElement||e.target instanceof HTMLSelectElement||e.ctrlKey||e.metaKey||e.repeat)return;
      if(e.key==='Escape'&&pending){e.preventDefault();setPending(undefined);return;}
      if(e.key==='Escape'){e.preventDefault();if(!battle.outcome)setMenu('options');return;}
      if(locked||battle.outcome)return;
      if(e.key==='Tab'&&e.shiftKey&&(document.activeElement===document.body)){e.preventDefault();return;}
      if(/^[1-7]$/.test(e.key)&&!pending){
        const hand=unit.hand[Number(e.key)-1];
        if(hand&&canPlay(battle,unit,hand)){e.preventDefault();setPending({kind:'card',id:hand.id,card:inspect(hand),actor:unit.id});}
      }
      if(e.key.toLowerCase()==='e'&&!pending){e.preventDefault();onCommand(endTurn);}
    };
    window.addEventListener('keydown',keys);
    return()=>window.removeEventListener('keydown',keys);
  },[battle,unit,locked,menu,pending,covered,onCommand]);
  return <section className="pr-combat">
    <header className="pr-combat-top">
      <div><span>{phase?t('第二形態','Second phase'):battle.encounter.boss?t('番人戦','Guardian battle'):t('遭遇戦','Encounter')}</span><strong>{l(REGIONS[battle.encounter.region].name)}</strong></div>
      <b>TURN {battle.turn}</b>
      <button className="pr-icon" aria-label={t('戦闘の選択肢','Battle options')} onClick={()=>setMenu('options')} disabled={Boolean(battle.outcome)}><Flag size={16} /></button>
    </header>
    <div className="pr-arena">
      <BattleCanvas battle={battle} animation={animation} reduced={settings.reduceFx} />
      <div className="pr-arena-bar">
        <span><span className="pr-indicator pr-red" /> {t('敵の予兆','Enemy intents')}</span>
        <button type="button" onClick={()=>setMenu('log')} aria-label={t('戦闘記録','Battle log')}><ScrollText size={15}/></button>
        <span>{t('冒険隊','Travelers')} <span className="pr-indicator"/></span>
      </div>
      {alive.map((e,index)=>{
        const valid=targetValid(e.id,'enemy'),target=HEROES[e.target];
        return <button key={e.id} style={positionStyle('enemy',index)} className={`pr-unit pr-unit-enemy ${valid?'pr-target':''}`}
          onClick={()=>{if(valid)act(e.id);else setMenu('log');}} aria-label={l(e.spec.name)} disabled={Boolean(battle.outcome)}>
          <b>{e.spec.part?'◇ ':''}{l(e.spec.name)}</b><Meter value={e.hp} max={e.max} className="pr-meter-red" />
          <small>{e.hp}/{e.max}{e.block>0&&` · ◈${e.block}`} · {l(elementLabel(e.weakness))}</small>
          <span className="pr-intent">{e.intent==='charge'&&<Flame size={11}/>} {l(describeIntent(e))}{target&&['attack','charge','venom','seal','jam'].includes(e.intent)&&!(e.intent==='charge'&&e.spec.boss&&e.phase===2)&&<em>{l(target.name)}</em>}</span>
        </button>;
      })}
      {battle.party.map((p,index)=><button key={p.id} style={positionStyle('party',index)} className={`pr-unit pr-unit-ally ${p.id===unit.id?'pr-unit-selected':''} ${targetValid(p.id,'party')?'pr-target':''}`}
        disabled={!p.hp&&!targetValid(p.id,'party')||Boolean(battle.outcome)} aria-label={l(HEROES[p.id].name)} onClick={()=>{if(targetValid(p.id,'party'))act(p.id);else if(p.hp){setPending(undefined);setActor(p.id);}}}>
        <b>{l(HEROES[p.id].name)}</b><Meter value={p.hp} max={p.max} /><div>{showPoints(p)}</div>
      </button>)}
      {animation?.actors.length&&!settings.reduceFx&&<div className="pr-cut" aria-hidden="true">
        {animation.actors.map(id=>{const member=orderOf(battle,id);return member&&<img key={id} src={illustration(id,member.hero.job,'limit')} alt="" />;})}
      </div>}
      {battle.outcome&&<div className="pr-outcome" role="status">
        <small>{battle.outcome==='win'?'VICTORY':battle.outcome==='loss'?'DEFEAT':'RETREAT'}</small>
        <strong>{battle.outcome==='win'?t('勝利！','Victory!'):battle.outcome==='loss'?t('冒険隊は力尽きた','The party fell'):t('無事に退いた','Retreated safely')}</strong>
        <p>{battle.outcome==='loss'?t('記録した休憩地点から再開します。','Resume at the last resting point.'):battle.outcome==='win'?t('経験値と熟練度を獲得。','Earn experience and job mastery.'):t('少しの間、敵との遭遇を避けます。','Avoid encounters briefly after retreating.')}</p>
        <button data-gamepad-initial-choice className="pr-primary" onClick={onOutcome}>{battle.outcome==='loss'?t('休憩地点へ','Return to checkpoint'):t('続ける','Continue')}</button>
      </div>}
    </div>
    <section className="pr-battle-deck" aria-label={t('手札','Hand')}>
      <div className="pr-deck-meta">
        <div><b>{l(HEROES[unit.id].name)}</b><span>{l(JOBS[unit.hero.job].name)}</span></div>
        <span className="pr-energy" aria-label={t('エナジー','Energy')}><Zap size={13}/>{unit.energy} EN</span>
        <span className="pr-piles">{t('山札','Draw')} {unit.draw.length} / {t('捨て札','Discard')} {unit.discard.length}</span>
        <div className="pr-link"><Sparkles size={13}/><span>LINK {battle.link}/{LINK_MAX}</span><Meter value={battle.link} max={LINK_MAX}/></div>
      </div>
      {pending&&<div className="pr-target-bar">
        <div><strong>{pending.kind==='card'?l(pending.card.name):pending.kind==='item'?l(ITEMS[pending.id].name):l(pending.tech.name)}</strong>
          <small>{needsTarget?(targetType==='foe'?t('盤面の敵を選ぶ','Select an enemy above'):t('盤面の味方を選ぶ','Select an ally above')):t('対象はカードの効果に含まれます。','The card specifies its own targets.')}</small></div>
        <button onClick={()=>setPending(undefined)}>{t('取り消す','Cancel')}</button>
        {!needsTarget&&<button className="pr-primary" onClick={()=>act(unit.id)}>{t('発動','Play')} <ChevronRight size={14}/></button>}
      </div>}
      <div className="pr-hand">
        {unit.hand.map((c,index)=>{
          const card=inspect(c),p=card.parts[0],selected=pending?.kind==='card'&&pending.id===c.id;
          const Icon=p?.skill.damage?Swords:p?.skill.heal?HeartPulse:p?.skill.block?Shield:Sparkles;
          return <button key={c.id} className={`pr-hand-card pr-element-${card.element??p?.element??'steel'} ${selected?'pr-card-selected':''}`}
            disabled={locked||!canPlay(battle,unit,c)}
            title={card.parts.map(p=>explain(p,i,card.rank,card.element)).join('\n')}
            onClick={()=>setPending({kind:'card',id:c.id,card,actor:unit.id})}>
            <span><Icon size={15}/><b>{card.cost} EN</b><small>{index+1}</small></span>
            <strong>{l(card.name)}{card.rank>0&&` +${card.rank}`}</strong>
            <small>{p?explain(p,i,card.rank,card.element):t('効果なし','No effect')}</small>
          </button>;
        })}
        {!unit.hand.length&&<p className="pr-hand-empty">{t('手札がない。ターンを終えて引き直す。','No cards left. End the turn to draw.')}</p>}
      </div>
      <nav className="pr-battle-actions">
        <button className={isStudyReady?'pr-study-ready':''} disabled={locked||battle.spentStudy||!!battle.outcome} onClick={()=>{setPending(undefined);onStudy();}}><BookOpen size={15}/>{t('ひらめき','Study')}</button>
        <button disabled={locked||!!battle.outcome} onClick={()=>setMenu('items')}><FlaskConical size={15}/>{t('道具','Items')}</button>
        <button disabled={locked||!combos.length||!!battle.outcome} onClick={()=>setMenu('link')}><Sparkles size={15}/>{t('連携','Link')}</button>
        <button disabled={locked||unit.limit<LIMIT_MAX||!!battle.outcome} onClick={()=>setPending({kind:'limit',id:unit.id,tech:HEROES[unit.id].limit,actor:unit.id})}><AimIcon size={15}/>{t('決め技','Finale')} {unit.limit}/{LIMIT_MAX}</button>
        <button className="pr-primary pr-endturn" disabled={locked||!!battle.outcome} onClick={()=>{setPending(undefined);onCommand(endTurn);}}>{t('ターン終了','End turn')} <ChevronRight size={15}/></button>
      </nav>
    </section>
    {menu&&<Panel heading={menu==='link'?t('連携技','Link techniques'):menu==='items'?t('戦闘道具','Battle items'):menu==='log'?t('戦闘記録','Battle log'):t('戦闘の選択肢','Battle options')} close={()=>setMenu(undefined)}>
      {menu==='link'&&<div className="pr-list">
        <p>{t('味方のカードや学習で溜める。ゲージが満ちると発動できる。','Fill the gauge with party cards and study, then unleash a Link.')}</p>
        {COMBOS.map(c=><button key={c.id} disabled={!combos.includes(c)||battle.link<LINK_MAX||locked} onClick={()=>{setMenu(undefined);setPending({kind:'combo',id:c.id,tech:c.tech,actor:unit.id});}}>
          <span><b>{l(c.name)}</b><small>{explain(c.tech,i)}</small></span><span>{combos.includes(c)?`${battle.link}/${LINK_MAX}`:t('編成条件','Formation')}</span>
        </button>)}
      </div>}
      {menu==='items'&&<div className="pr-list">{(Object.keys(ITEMS) as ItemId[]).filter(id=>id!=='oil').map(id=><button key={id} disabled={!battle.items[id]||!unit.freeItem||locked} onClick={()=>{setMenu(undefined);setPending({kind:'item',id,actor:unit.id});}}>
        <span><b>{l(ITEMS[id].name)}</b><small>{l(ITEMS[id].desc)}</small></span><span>×{battle.items[id]}</span></button>)}</div>}
      {menu==='log'&&<div className="pr-list">
        {alive.some(e=>e.spec.part)&&<p>{t('部位が残っている間、本体のダメージが軽減される。貫通効果は無視できる。','The active part reduces damage to the guardian. Piercing attacks ignore it.')}</p>}
        {alive.map(e=><article key={e.id}><span><b>{l(e.spec.name)}</b><small>{l(describeIntent(e))} · {t('弱点','Weakness')} {l(elementLabel(e.weakness))}</small></span><span>{e.hp}/{e.max}</span></article>)}
        {battle.history.map((line,index)=><p key={index}>{l(line)}</p>)}
        {!battle.history.length&&<p>{t('敵の予兆を見て、手札から行動を選ぼう。','Read the enemy intents, then act from your hand.')}</p>}
      </div>}
      {menu==='options'&&<div className="pr-list">
        <button disabled={!!battle.encounter.boss||locked} onClick={()=>{setMenu(undefined);onCommand(flee);}}>{t('退却する','Retreat')}</button>
        <p>{t('1〜7で手札を選択、Eでターン終了。手札を選んだら、盤面から対象を選ぶ。','Press 1–7 for cards or E to end turn. Select a target on the field after choosing a card.')}</p>
      </div>}
    </Panel>}
  </section>;
}
