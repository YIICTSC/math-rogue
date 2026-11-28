import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { Shield, Sparkles, HeartPulse, Target as AimIcon, ChevronDown, Flame, FlaskConical, BookOpen, ChevronRight, Flag, Zap, ScrollText, Swords, Trophy } from 'lucide-react';
import CardView from '../../components/Card';
import { CardType } from '../../types';
import { COMBOS, HEROES, ITEMS, JOBS, type ItemId, type Target } from './catalog';
import { REGIONS } from './campaign';
import { LIMIT_MAX, LINK_MAX, availableCombos, battleItem, canAct, canPlay, comboMembers, cursorTarget, describeIntent, elementLabel, endTurn, explain, fighter, flee, inspect, living, orderOf, playCard, useCombo, useLimit, type Battle, type Fighter, type PlayedCard, type ResolvedCard } from './battle';
import { BattleCanvas, Meter, Panel, positionStyle, useWords } from './presentation';
import { type Animation } from './art';
import { TechniqueArtwork, TechniqueStrip } from './CardArtwork';
import TravelerPortrait from './TravelerPortrait';
import { GROUPS, type Settings, type VictoryRewards } from './adventure';

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

function BattleOutcome({outcome,rewards,onContinue}:{outcome:NonNullable<Battle['outcome']>;rewards?:VictoryRewards;onContinue:()=>void}){
  const {t,l}=useWords();
  const button=useRef<HTMLButtonElement>(null);
  useEffect(()=>{button.current?.focus({preventScroll:true});},[]);
  const won=outcome==='win';
  const title=won?t('勝利！','Victory!'):outcome==='loss'?t('冒険隊は力尽きた','The party fell'):t('無事に退いた','Retreated safely');
  return <div className="pr-outcome" data-victory={won||undefined} role="dialog" aria-modal="true" aria-label={title} data-gamepad-modal
    onClick={won?onContinue:undefined}>
    <div className="pr-result">
      <header>{won&&<Trophy size={22} aria-hidden="true" />}<strong>{title}</strong></header>
      {won&&rewards?<div className="pr-reward-grid">
        <section aria-label={t('経験値と熟練度','Experience and mastery')}>
          <h3>{t('旅人の成長','Traveler growth')}</h3>
          <ul className="pr-reward-heroes">{rewards.heroes.map(hero=><li key={hero.id}>
            <span><b>{l(HEROES[hero.id].name)}</b>{hero.reserve&&<small>{t('控え','Reserve')}</small>}{hero.level>0&&<small className="pr-level-up">Lv. +{hero.level}</small>}</span>
            <span className="pr-reward-exp"><b>EXP +{hero.xp}</b>{hero.mastery>0&&<small>{t('熟練度','Mastery')} +{hero.mastery}</small>}</span>
          </li>)}</ul>
        </section>
        <section aria-label={t('獲得アイテム','Rewards')}>
          <h3>{t('獲得報酬','Loot')}</h3>
          <ul className="pr-reward-loot"><li><b>{t('ゴールド','Gold')}</b><span>+{rewards.gold} G</span></li>
            {rewards.loot.map(({name,quantity},index)=><li key={index}><b>{l(name)}</b>{quantity!==undefined&&<span>×{quantity}</span>}</li>)}
          </ul>
          {!rewards.loot.length&&<p>{t('アイテムの獲得はありません','No item drops')}</p>}
        </section>
      </div>:<p>{outcome==='loss'?t('記録した休憩地点から再開します。','Resume at the last resting point.'):t('少しの間、敵との遭遇を避けます。','Avoid encounters briefly after retreating.')}</p>}
      <footer><button ref={button} type="button" data-gamepad-initial-choice className="pr-primary" onClick={won?undefined:onContinue}>
        {outcome==='loss'?t('休憩地点へ','Return to checkpoint'):t('続ける','Continue')} <ChevronRight size={15}/>
      </button>{won&&<small>{t('画面のどこでもタップして続行','Tap anywhere to continue')}</small>}</footer>
    </div>
  </div>;
}

export default function BattleScreen({battle,actor,setActor,onCommand,onStudy,onOutcome,animation,settings,covered,encounterIntro,rewards}:{
  battle:Battle;actor:string;setActor:(id:string)=>void;onCommand:(op:(b:Battle)=>Battle,actor?:string)=>void;
  onStudy:()=>void;onOutcome:()=>void;animation?:Animation;settings:Settings;covered:boolean;encounterIntro:number;rewards?:VictoryRewards;
}){
  const {l,t,i,language}=useWords();
  const [menu,setMenu]=useState<'link'|'items'|'log'|'options'>();
  const [showOtherCombos,setShowOtherCombos]=useState(false);
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
  const opening=encounterIntro>0;
  const inactive=locked||opening||covered||Boolean(battle.outcome);
  const menusCover=inactive||Boolean(menu||detail);
  const linkReady=battle.link>=LINK_MAX&&combos.length>0;
  const turnReady=!inactive&&!battle.party.some(p=>canAct(battle,p));
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
  return <section className="pr-combat" data-pr-reduced-fx={settings.reduceFx||undefined}>
    <header className="pr-combat-top" inert={menusCover}>
      <div><span>{phase?t('第二形態','Second phase'):battle.encounter.boss?t('番人戦','Guardian battle'):t('遭遇戦','Encounter')}</span><strong>{l(REGIONS[battle.encounter.region].name)}</strong></div>
      <b>TURN {battle.turn}</b>
      <button className="pr-icon" aria-label={t('戦闘の選択肢','Battle options')} onClick={()=>setMenu('options')} disabled={inactive}><Flag size={16} /></button>
    </header>
    <div className="pr-arena" inert={menusCover} data-finishing={Boolean(animation?.defeated?.length)&&!settings.reduceFx||undefined}>
      <BattleCanvas battle={battle} animation={animation} reduced={settings.reduceFx} />
      <div className="pr-arena-bar">
        <span><span className="pr-indicator pr-red" /> {t('敵の予兆','Enemy intents')}</span>
        <button type="button" onClick={()=>setMenu('log')} disabled={inactive} aria-label={t('戦闘記録','Battle log')}><ScrollText size={15}/></button>
        <span>{t('冒険隊','Travelers')} <span className="pr-indicator"/></span>
      </div>
      {alive.map((e,index)=>{
        const aimed=e.id===aimedEnemy, highlighted=preview==='foes'||aimed&&preview==='foe', target=HEROES[e.target];
        const partyAttack=e.intent==='charge'&&e.spec.boss&&e.phase===2;
        const slot=animation?.enemyOrder?.indexOf(e.id)??index;
        return <button key={e.id} style={positionStyle('enemy',slot<0?index:slot)} className={`pr-unit pr-unit-enemy ${aimed?'pr-enemy-aimed':''} ${highlighted?'pr-target':''}`}
          aria-pressed={aimed} onClick={()=>{setEnemyCursor(e.id);setPreview(undefined);}} aria-label={l(e.spec.name)} disabled={inactive||!!item}>
          {aimed&&<span className="pr-enemy-cursor" aria-hidden="true"><ChevronDown size={17} /></span>}
          <b>{e.spec.part?'◇ ':''}{l(e.spec.name)}</b><Meter value={e.hp} max={e.max} className="pr-meter-red" />
          <small>{e.hp}/{e.max}{e.block>0&&` · ◈${e.block}`} · {l(elementLabel(e.weakness))}</small>
          <span className="pr-intent">{e.intent==='charge'&&<Flame size={11}/>} {l(describeIntent(e))}
            {partyAttack?<em>{t('味方全体','All travelers')}</em>:target&&['attack','charge','venom','seal','jam'].includes(e.intent)&&<em>{l(target.name)}</em>}</span>
        </button>;
      })}
      {battle.party.map((p,index)=>{
        const targeted=itemTarget(p)||p.hp>0&&(preview==='party'||preview==='ally'&&p.id===aimedAlly||preview==='self'&&p.id===unit.id);
        return <button key={p.id} style={positionStyle('party',index)} className={`pr-unit pr-unit-ally ${p.id===unit.id?'pr-unit-selected':''} ${targeted?'pr-target':''}`}
          disabled={inactive||(item?!itemTarget(p):!p.hp)} aria-label={l(HEROES[p.id].name)} onClick={()=>pickAlly(p)}>
          <b>{l(HEROES[p.id].name)}</b><Meter value={p.hp} max={p.max} /><div>{showPoints(p)}</div>
        </button>;
      })}
      {animation&&animation.actors.length>0&&!settings.reduceFx&&<div className="pr-cut" aria-hidden="true">
        {animation.actors.map(id=>orderOf(battle,id)&&<div key={id} className="pr-cut-portrait"><TravelerPortrait id={id} name={l(HEROES[id].name)} reaction="resolve" /></div>)}
      </div>}
      {animation&&activeCue&&<aside key={animation.at} className={`pr-play-cue pr-play-${activeCue.kind}`} aria-live="polite"
        style={{'--pr-cue-ms':`${animation.duration}ms`} as CSSProperties}>
        {!settings.reduceFx&&<TechniqueStrip parts={activeCue.parts} />}
        <div>{activeCue.kind!=='card'&&<small>{activeCue.kind==='link'?t('連携','Link'):t('決め技','Finale')}</small>}
          <b>{l(activeCue.name)}</b></div>
      </aside>}
    </div>
    <section className="pr-battle-deck" inert={menusCover} aria-label={t('手札','Hand')}>
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
        <button className={linkReady?'pr-link-ready':''} disabled={inactive||!combos.length} onClick={()=>{setPreview(undefined);setMenu('link');}}>
          <Sparkles size={15}/>{t('連携','Link')}{linkReady&&<span className="sr-only">{t('発動可能','Ready')}</span>}
        </button>
        <button disabled={inactive||unit.limit<LIMIT_MAX} onClick={useFinale}><AimIcon size={15}/>{t('決め技','Finale')} {unit.limit}/{LIMIT_MAX}</button>
        <button className="pr-primary pr-endturn" data-ready={turnReady||undefined} disabled={inactive}
          onClick={()=>{setItem(undefined);setPreview(undefined);onCommand(endTurn);}}>
          <span>{t('ターン終了','End turn')}</span><ChevronRight size={15}/>
          {turnReady&&<small>{t('使える手札なし','No playable cards')}</small>}
        </button>
      </nav>
    </section>
    {opening&&<div className="pr-encounter-intro" data-boss={battle.encounter.boss||undefined}
      style={{'--pr-encounter-ms':`${encounterIntro}ms`} as CSSProperties} role="status">
      <div><Swords aria-hidden="true" size={24}/><strong>{battle.encounter.boss?t('番人戦','Guardian battle'):battle.encounter.surprise==='party'?t('先制攻撃！','Preemptive strike!'):battle.encounter.surprise==='foe'?t('不意打ち！','Ambush!'):t('魔物と遭遇！','Encounter!')}</strong></div>
    </div>}
    {battle.outcome&&!locked&&<BattleOutcome outcome={battle.outcome} rewards={rewards} onContinue={onOutcome}/>}
    {detail&&<Panel heading={l(detail.name)} close={()=>setDetail(undefined)}><CardInfo card={detail}/></Panel>}
    {menu&&<Panel heading={menu==='link'?t('連携技','Link techniques'):menu==='items'?t('戦闘道具','Battle items'):menu==='log'?t('戦闘記録','Battle log'):t('戦闘の選択肢','Battle options')} close={()=>setMenu(undefined)}>
      {menu==='link'&&<div className="pr-list pr-link-list">
        <div className="pr-link-overview"><span>{t('連携ゲージ','Link gauge')} <b>{battle.link}/{LINK_MAX}</b></span><Meter value={battle.link} max={LINK_MAX}/>
          <p>{t('カードやひらめきで溜まり、次の戦闘に持ち越せる。','Play cards or Study to build Link. The gauge carries into the next battle.')}</p></div>
        {combos.map(c=><button key={c.id} disabled={!linkReady||inactive} onClick={()=>useLink(c)}>
          <span><b>{l(c.name)}</b><small>{explain(c.tech,i)}</small></span>{linkReady&&<span>{t('発動','Use')}</span>}
        </button>)}
        {combos.length<COMBOS.length&&<div className="pr-link-locked">
          <button type="button" aria-expanded={showOtherCombos} onClick={()=>setShowOtherCombos(open=>!open)}>
            {t('ほかの編成で使える技','Techniques for other parties')} <ChevronDown size={14}/>
          </button>
          {showOtherCombos&&<div className="pr-list">{COMBOS.filter(c=>!combos.includes(c)).map(c=>{
            const members=c.origins?.map(origin=>l(GROUPS[origin]))??c.jobs?.map(job=>l(JOBS[job].name));
            return <article key={c.id}><span><b>{l(c.name)}</b><small>{explain(c.tech,i)}</small>
              <small>{c.full?`${t('4人','4 travelers')} · `:''}{members?.join(' × ')??t('味方2人','2 allies')}</small></span></article>;
          })}</div>}
        </div>}
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
