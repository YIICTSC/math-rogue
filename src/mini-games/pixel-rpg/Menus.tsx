import { useEffect, useRef, useState } from 'react';
import { BookOpen, Backpack, Map, Puzzle, Settings2, Shield, Sparkles, Users, Save, Flag, ChevronRight, Gem, ScrollText } from 'lucide-react';
import { GameMode, type LanguageMode } from '../../types';
import ModeSelectionScreen from '../../components/ModeSelectionScreen';
import { trans } from '../../utils/textUtils';
import { CARDS, CARD_LIST, COMBOS, ELEMENTS, GEAR, GEAR_LIST, HEROES, ITEMS, JOBS, JOB_LIST, PASSIVES, RELICS, SLOTS, type Element, type EquipSlot, type ItemId, type RelicId } from './catalog';
import { REGIONS, SERVICES, VEHICLES, type Service } from './campaign';
import { availableCards, canJob, changeJob, editDeck, equip, fieldItem, maxHp, partyCommand, purchase, questFlag, setRelic, stats, xpNext, type Adventure, type Change, type HeroState } from './adventure';
import { elementLabel, FOES, inspect } from './battle';
import { CardInfo } from './BattleScreen';
import { illustration } from './art';
import { Meter, Panel, useWords } from './presentation';
import { SAVE_SLOTS, type Slot, type SlotData } from './save';
import { Tile, WORLD_ID, area, isWater, sitePoint, tileAt } from './world';

export type MenuTab='party'|'job'|'gear'|'deck'|'relics'|'pack'|'map'|'quests'|'index'|'study'|'save'|'settings';
export type Apply=(change:(s:Adventure)=>Change)=>void;

function Status({h}:{h:HeroState}){
  const {t,l}=useWords(),r=stats(h),hero=HEROES[h.id];
  return <div className="pr-person">
    <img src={illustration(h.id,h.job)} alt="" />
    <div><h3>{l(hero.name)}</h3><p>{l(JOBS[h.job].name)} · Lv. {h.level}</p><p>{l(PASSIVES[hero.passive])}</p><p>HP {h.hp}/{r.hp} · EXP {h.xp}/{xpNext(h.level)}</p>
      <Meter value={h.hp} max={r.hp}/></div>
    <dl>{([
      ['攻撃','Attack',r.attack],['魔力','Magic',r.magic],['防御','Defense',r.ward],['魔防','Resistance',r.resist],['素早さ','Speed',r.speed],['運','Luck',r.luck],
    ] as const).map(([ja,en,num])=><div key={en}><dt>{t(ja,en)}</dt><dd>{num}</dd></div>)}</dl>
  </div>;
}
function Party({state,h,apply}:{state:Adventure;h:HeroState;apply:Apply}){
  const {t,l}=useWords(),active=state.party.includes(h.id),position=state.party.indexOf(h.id);
  return <>
    <Status h={h}/>
    <section className="pr-inline pr-formation">
      <button disabled={!active||position===0} onClick={()=>apply(s=>partyCommand(s,h.id,'leader'))}>{t('先頭にする','Move to lead')}</button>
      <button onClick={()=>apply(s=>partyCommand(s,h.id,'row'))}>{h.rear?t('後衛 → 前衛','Rear → Front'):t('前衛 → 後衛','Front → Rear')}</button>
      {active?<button disabled={state.party.length<2} onClick={()=>apply(s=>partyCommand(s,h.id,'swap'))}>{t('控えに回す','Move to reserve')}</button>
        :state.party.length<4?<button onClick={()=>apply(s=>partyCommand(s,h.id,'swap'))}>{t('冒険隊に加える','Add to party')}</button>
        :<label>{t('入れ替え','Swap with')} <select value="" onChange={e=>apply(s=>partyCommand(s,h.id,'swap',e.target.value))}><option value="" disabled>{t('交代する仲間','Choose an ally')}</option>{state.party.map(id=><option key={id} value={id}>{l(HEROES[id].name)}</option>)}</select></label>}
      <button onClick={()=>apply(s=>partyCommand(s,h.id,'substory'))}>{t('仲間の旅の話','Companion story')}</button>
    </section>
    <h3>{t('連携の組み合わせ','Link combinations')}</h3><div className="pr-list">{COMBOS.map(c=>{
      const room=state.party.map(id=>state.heroes[id]);
      const origins=room.map(h=>HEROES[h.id].origin);
      const available=(!c.origins||c.origins.every(o=>origins.includes(o)))&&(!c.jobs||c.jobs.every(j=>room.some(h=>h.job===j)))&&(!c.full||room.length===4&&['elementary','high-school','magic'].every(origin=>origins.includes(origin as typeof origins[number])));
      return <article key={c.id}><b>{l(c.name)}</b><small>{available?t('使用可能','Available'):t('編成条件あり','Formation required')}</small></article>;
    })}</div>
  </>;
}
function JobMenu({state,h,apply}:{state:Adventure;h:HeroState;apply:Apply}){
  const {l,t}=useWords();
  const [tier,setTier]=useState(0);
  return <>
    <Status h={h}/>
    <nav className="pr-tabs">{[[t('基本','Basic'),0],[t('中級','Intermediate'),1],[t('上級','Advanced'),2]].map(([label,index])=><button key={index} aria-pressed={tier===index} onClick={()=>setTier(Number(index))}>{label}</button>)}</nav>
    <div className="pr-list">{JOB_LIST.filter(j=>j.tier===tier).map(j=>{
      const ready=canJob(state,h,j.id),mentor=j.mentor?l(JOBS[j.mentor].name):undefined;
      return <button key={j.id} disabled={!ready||h.job===j.id} onClick={()=>apply(s=>({
        state:changeJob(s,h.id,j.id),message:[`${HEROES[h.id].name[0]}が${j.name[0]}に転職した。`,`${HEROES[h.id].name[1]} became a ${j.name[1]}.`],sound:'buff',
      }))}>
        <img className="pr-job-preview" src={illustration(h.id,j.id,'joy')} alt="" />
        <span><b>{l(j.name)}</b><small>{l(j.role)} · {t('熟練度','Mastery')} {h.mastery[j.id]??0}</small>
          <small>{t('技','Art')} {l(j.signature.name)} / {t('熟練度5','Mastery 5')} {l(j.mastery.name)}</small>
          {!ready&&<small>{mentor?`${mentor} · ${t('熟練度と章の条件','Mastery and chapter')}`:t('灯ノ根村の灯守に会うと解放','Meet the Lamplighter in Lamproot')}</small>}</span>
        <span>{h.job===j.id?t('現職','Current'):ready?t('転職','Change'):t('未解放','Locked')}</span></button>;
    })}</div>
    <label className="pr-select-label">{t('引き継ぎ技','Inherited technique')}<select value={h.inherited??''} onChange={e=>apply(s=>partyCommand(s,h.id,'inherit',e.target.value||undefined))}>
      <option value="">{t('なし','None')}</option>
      {JOB_LIST.filter(j=>(h.mastery[j.id]??0)>=5).map(j=><option key={j.id} value={j.mastery.id}>{l(j.mastery.name)}</option>)}
    </select><small>{t('熟練度5の技を、転職後も1枚デッキに加えられる。','Add a mastered card to your deck even after changing jobs.')}</small></label>
  </>;
}
const gearEffects=(g:typeof GEAR[string],i:0|1)=>{
  const attrs=Object.entries({ATK:g.atk,HP:g.hp,MAG:g.magic,DEF:g.ward,DRAW:g.draw,LINK:g.link,EN:g.energy}).filter(([,val])=>val).map(([label,val])=>`${label} +${val}`);
  if(g.element)attrs.push(elementLabel(g.element)[i]);
  return attrs.join(' · ');
};
function GearMenu({state,h,apply}:{state:Adventure;h:HeroState;apply:Apply}){
  const {t,l,i}=useWords();
  return <>
    <Status h={h}/>
    <div className="pr-list">{(Object.keys(SLOTS) as EquipSlot[]).map(slot=>{
      const available=state.gear.map(id=>GEAR[id]).filter(g=>g.slot===slot&&(!g.style||g.style===JOBS[h.job].style));
      return <label key={slot} className="pr-select-label">{l(SLOTS[slot])}<select value={h.equipment[slot]??''} onChange={e=>apply(s=>({state:equip(s,h.id,slot,e.target.value||undefined)}))}>
        <option value="">{t('外す','Unequip')}</option>
        {available.map(g=><option key={g.id} value={g.id}>{l(g.name)} · {gearEffects(g,i)}</option>)}
      </select></label>;
    })}</div>
  </>;
}
function DeckMenu({state,h,apply,forge=false}:{state:Adventure;h:HeroState;apply:Apply;forge?:boolean}){
  const {t,l}=useWords();
  const [picked,setPicked]=useState(0),[extra,setExtra]=useState(1),[infusion,setInfusion]=useState<Element>('fire');
  const deck=h.deck, selected=Math.min(picked,deck.length-1), card=inspect({id:selected,value:deck[selected]});
  const source=availableCards(state,h);
  return <div className="pr-deck-editor">
    <div>
      <p>{t('デッキ','Deck')} {deck.length}/20 · {t('職の札','Job card')} {l(JOBS[h.job].signature.name)}</p>
      <div className="pr-deck-grid">{deck.map((c,index)=><button key={index} aria-pressed={selected===index} onClick={()=>{setPicked(index);if(index===extra)setExtra(index===0?1:0);}}>
        <span>{index+1}</span>{l(inspect({id:index,value:c}).name)}{c.rank? ` +${c.rank}`:''}</button>)}</div>
    </div>
    <section>
      <CardInfo key={`${h.id}:${selected}:${card.name[0]}`} card={card}/>
      {!forge&&<div className="pr-inline">
        <select aria-label={t('加えるカード','Card to add')} value="" disabled={deck.length>=20} onChange={e=>apply(s=>editDeck(s,h.id,'add',e.target.value))}>
          <option value="" disabled>{t('カードを加える','Add a card')}</option>
          {source.map(id=><option key={id} value={id} disabled={deck.filter(c=>c.key===id).length>=4||id.startsWith('job:')&&deck.some(c=>c.key===id)}>{l(CARDS[id].name)}</option>)}
        </select>
        <button disabled={deck.length<=10} onClick={()=>apply(s=>editDeck(s,h.id,'remove',selected))}>{t('デッキから外す','Remove from deck')}</button>
      </div>}
      {forge&&<div className="pr-forge">
        <button disabled={card.rank>=2||state.gold<24+card.rank*16} onClick={()=>apply(s=>editDeck(s,h.id,'upgrade',selected))}>{t('強化','Upgrade')} · {24+card.rank*16} G</button>
        <div className="pr-inline"><select value={infusion} aria-label={t('付与する属性','Element to infuse')} onChange={e=>setInfusion(e.target.value as Element)}>
          {Object.entries(ELEMENTS).map(([key,name])=><option key={key} value={key}>{l(name)}</option>)}
        </select><button disabled={state.gold<20} onClick={()=>apply(s=>editDeck(s,h.id,'infuse',selected,infusion))}>{t('属性付与','Infuse')} · 20 G</button></div>
        <div className="pr-inline"><select aria-label={t('合成する2枚目','Second card to fuse')} value={extra!==selected&&extra<deck.length?extra:(selected===0?1:0)} onChange={e=>setExtra(Number(e.target.value))}>
          {deck.map((c,index)=>index!==selected&&<option value={index} key={index}>{index+1}. {l(inspect({id:index,value:c}).name)}</option>)}
        </select><button disabled={state.gold<44||deck.length<=10} onClick={()=>apply(s=>editDeck(s,h.id,'fuse',selected,extra!==selected&&extra<deck.length?extra:(selected===0?1:0)))}>{t('この順で合成','Fuse in this order')} · 44 G</button></div>
        <small>{t('合成札は上から順に発動し、エナジーは素材の最大値。合成後も10枚以上必要。','Fused cards play in order and cost the highest energy of their parts. Keep at least 10 cards.')}</small>
      </div>}
    </section>
  </div>;
}
function RelicMenu({state,h,apply}:{state:Adventure;h:HeroState;apply:Apply}){
  const {l,t}=useWords();
  const selector=(hero?:string)=><select value={(hero?h.relic:state.partyRelic)??''} onChange={e=>apply(s=>({state:setRelic(s,(e.target.value||undefined) as RelicId|undefined,hero)}))}>
    <option value="">{t('なし','None')}</option>{state.relics.map(id=><option key={id} value={id}>{l(RELICS[id].name)}</option>)}
  </select>;
  return <div className="pr-list">
    <label className="pr-select-label">{t('パーティー共通','Party relic')}{selector()}</label>
    <label className="pr-select-label">{l(HEROES[h.id].name)}{selector(h.id)}</label>
    {state.relics.map(id=><article key={id}><span><b>{l(RELICS[id].name)}</b><small>{l(RELICS[id].description)}</small></span></article>)}
    {!state.relics.length&&<p>{t('レリックは道具屋で購入できる。','Relics are available at general stores.')}</p>}
  </div>;
}
function Pack({state,h,apply}:{state:Adventure;h:HeroState;apply:Apply}){
  const {l}=useWords();
  return <div className="pr-list">{(Object.keys(ITEMS) as ItemId[]).map(id=><button key={id} disabled={!state.items[id]} onClick={()=>apply(s=>fieldItem(s,id,h.id))}>
    <span><b>{l(ITEMS[id].name)}</b><small>{l(ITEMS[id].desc)}</small></span><span>×{state.items[id]}</span>
  </button>)}</div>;
}
function WorldMap({state}:{state:Adventure}){
  const {t,l}=useWords(),ref=useRef<HTMLCanvasElement>(null);
  useEffect(()=>{
    const c=ref.current?.getContext('2d'),world=area(WORLD_ID);
    if(!c)return;
    c.imageSmoothingEnabled=false;
    const light=['#a5d6ad','#c9bc85','#a9a4d1','#8bc4c1','#adc3d2','#bda2ae','#8a9ec3'];
    for(let y=0;y<world.height;y++)for(let x=0;x<world.width;x++){
      const tile=tileAt(world,{x,y});
      c.fillStyle=isWater(tile)?tile===Tile.Deep?'#203049':tile===Tile.Sea?'#344963':'#446878':tile===Tile.Forest?'#345555':tile===Tile.Hill||tile===Tile.Rock?'#6f7880':tile===Tile.Path?'#d9bd8f':'#649579';
      c.fillRect(x*3,y*3,3,3);
    }
    for(let n=0;n<REGIONS.length;n++){
      const [x,y]=REGIONS[n].place;
      c.fillStyle=n<=state.stage?light[n]:'#131e37';
      c.beginPath();c.arc(x*3,y*3,9,0,Math.PI*2);c.fill();c.fillStyle=n<=state.stage?'#172732':'#9aacbe';c.font='bold 11px monospace';c.textAlign='center';c.fillText(String(n+1),x*3,y*3+4);
    }
    if(state.map===WORLD_ID){c.strokeStyle='#fff3a9';c.lineWidth=2;c.strokeRect(state.at.x*3-4,state.at.y*3-4,11,11);}
  },[state.map,state.at.x,state.at.y,state.stage]);
  const visible=REGIONS.flatMap((r,i)=>r.sites.map((_,s)=>`r${i}-s${s}-f0`)).filter(m=>state.visits.includes(m)).length;
  return <>
    <canvas ref={ref} width={375} height={246} className="pr-world-chart" aria-label={t('地域と現在地の地図','World regions and position')}/>
    <p>{t('訪れた場所','Sites visited')} {visible}/35 · {Math.round(visible/35*100)}%</p>
    <div className="pr-list">{REGIONS.map((r,i)=><details key={i} open={i===Math.min(state.stage,6)?true:undefined}><summary>{i+1}. {l(r.name)} · {i>state.stage?t('未到達','Locked'):l(VEHICLES[r.required])}</summary>
      {r.sites.map((s,index)=>{
        const {x,y}=sitePoint(i,index);
        const visited=state.visits.includes(`r${i}-s${index}-f0`);
        return <p key={index}>{l(s.name)} <small>{x}E · {y}S {visited?'✓':''}</small></p>;
      })}</details>)}</div>
  </>;
}
function QuestList({state}:{state:Adventure}){
  const {t,l}=useWords();
  const main=Math.min(state.stage,6),r=REGIONS[main];
  return <div className="pr-list">
    <div className="pr-quest-lead"><strong>{l(r.chapter)}</strong><p>{state.stage>=7?t('番人の記憶試練に挑むか、未踏の場所を訪ねよう。','Take on the Trial of the Guardians or explore unvisited places.'):state.flags.includes(`book-${main}`)?t('見つけた記録を元に、最深部の番人を探す。','Use the record to find the guardian in the deepest site.'):l(r.quest)}</p>
      <p>{l(r.rumor)}</p></div>
    {REGIONS.slice(0,main+1).map((r,index)=><article key={index}><span><b>{l(r.keeper)}</b><small>{l(r.quest)}</small></span><span>{state.quests.includes(questFlag(index))?'✓':state.flags.includes(`book-${index}`)?t('報告可','Ready to report'):t('探索中','In progress')}</span></article>)}
  </div>;
}
function Index({state}:{state:Adventure}){
  const {t,l}=useWords();
  const [tab,setTab]=useState<'foes'|'cards'|'books'>('foes'),[card,setCard]=useState<string>();
  const cards=[...new Set([...state.unlockedCards,...state.party.flatMap(id=>availableCards(state,state.heroes[id]))])];
  return <><nav className="pr-tabs"><button aria-pressed={tab==='foes'} onClick={()=>setTab('foes')}>{t('魔物','Bestiary')} {state.monsters.length}/{Object.keys(FOES).length}</button><button aria-pressed={tab==='cards'} onClick={()=>setTab('cards')}>{t('カード','Cards')} {cards.length}/{CARD_LIST.length}</button><button aria-pressed={tab==='books'} onClick={()=>setTab('books')}>{t('蔵書','Books')} {state.books.length}/7</button></nav>
    <div className="pr-list">{tab==='foes'&&Object.values(FOES).filter(f=>state.monsters.includes(f.id)).map(e=><article key={e.id}><span><b>{l(e.name)}</b><small>{l(REGIONS[e.region].name)} · {t('弱点','Weakness')} {l(elementLabel(e.weakTo))}</small></span><span>{e.hp} HP</span></article>)}
      {tab==='cards'&&cards.map(key=><button key={key} onClick={()=>setCard(card===key?undefined:key)}><b>{l(CARDS[key].name)}</b><ChevronRight size={16}/></button>)}
      {tab==='cards'&&card&&<CardInfo card={inspect({id:0,value:{key:card}})}/>}
      {tab==='books'&&state.books.map(region=><article key={region}><span><b>{l(REGIONS[region].book)}</b><small>{l(REGIONS[region].questDone)}</small></span></article>)}
      {tab==='foes'&&!state.monsters.length&&<p>{t('倒した魔物の記録がここに並ぶ。','Defeated creatures appear here.')}</p>}
    </div></>;
}
function SettingsPanel({state,apply,onLesson}:{state:Adventure;apply:Apply;onLesson:()=>void}){
  const {t}=useWords();
  const s=state.settings;
  function set<K extends keyof Adventure['settings']>(key:K,value:Adventure['settings'][K]){apply(st=>({state:{...st,settings:{...st.settings,[key]:value}}}));}
  return <div className="pr-list pr-settings">
    <label className="pr-select-label">{t('エンカウント方式','Encounter style')}<select value={s.encounters} onChange={e=>set('encounters',e.target.value as typeof s.encounters)}><option value="random">{t('ランダム','Random')}</option><option value="symbol">{t('シンボル','Visible symbols')}</option></select></label>
    <label className="pr-select-label">{t('ランダム遭遇率','Random encounter rate')}<select value={s.rate} onChange={e=>set('rate',e.target.value as typeof s.rate)}><option value="normal">{t('標準','Standard')}</option><option value="low">{t('少ない','Low')}</option></select></label>
    <label className="pr-check"><input type="checkbox" checked={!!s.avoidWeak} onChange={e=>set('avoidWeak',e.target.checked)}/>{t('格下の敵との自動遭遇を避ける','Skip automatic encounters with weaker foes')}</label>
    <label className="pr-select-label">{t('戦闘の演出速度','Battle animation speed')}<select value={s.rateFx} onChange={e=>set('rateFx',e.target.value as typeof s.rateFx)}><option value="normal">{t('標準','Standard')}</option><option value="quick">{t('倍速','Double speed')}</option><option value="instant">{t('演出スキップ','Skip animations')}</option></select></label>
    <label className="pr-check"><input type="checkbox" checked={s.reduceFx} onChange={e=>set('reduceFx',e.target.checked)}/>{t('点滅・移動演出を軽減','Reduce flashes and motion')}</label>
    <label className="pr-select-label">{t('回答方法','Answer mode')}<select value={s.answer} onChange={e=>set('answer',e.target.value as typeof s.answer)}><option value="choice">{t('選択式','Multiple choice')}</option><option value="typing">{t('入力式','Typed answer')}</option></select></label>
    <label className="pr-select-label">{t('ひらめきの表示頻度','Study reminders')}<select value={s.quizHints} onChange={e=>set('quizHints',e.target.value as typeof s.quizHints)}>
      <option value="turn">{t('毎ターン','Each turn')}</option><option value="battle">{t('各戦闘の最初','Once per battle')}</option><option value="off">{t('通知なし','No reminder')}</option></select></label>
    <label className="pr-select-label">{t('言語','Language')}<select value={s.language??''} onChange={e=>set('language',e.target.value as LanguageMode||undefined)}>
      <option value="">{t('本編と同じ','Use app setting')}</option><option value="JAPANESE">{t('日本語','Japanese')}</option><option value="HIRAGANA">{t('ひらがな','Hiragana')}</option><option value="ENGLISH">English</option></select></label>
    <label className="pr-check"><input type="checkbox" checked={s.read} onChange={e=>set('read',e.target.checked)}/>{t('問題の読み上げ','Question audio')}</label>
    <button onClick={onLesson}>{t('学年・教科・単元を選ぶ','Choose grade, subject and units')} <ChevronRight size={15}/></button>
  </div>;
}
export function Lessons({close,onSelect}:{close:()=>void;onSelect:(mode:GameMode,modes?:string[],answer?:'CHOICE'|'TYPING')=>void}){
  const {t,language}=useWords();
  return <Panel wide heading={t('学習する範囲','Learning units')} subtitle={t('難易度に関係なく、戦闘で得る効果は同じ。','Every difficulty grants the same battle bonus.')} close={close}>
    <div className="pr-lesson-picker"><ModeSelectionScreen onBack={close} languageMode={language} onSelectMode={(mode,pool,answer)=>onSelect(mode,pool,answer==='CHOICE'?'CHOICE':answer?'TYPING':undefined)}/></div>
  </Panel>;
}
export function SaveSlots({mode,data,onPick,onLoad,onPlus,selected}:{mode:'new'|'load';data:Record<Slot,SlotData[]>;onPick:(slot:Slot)=>void;onLoad:(slot:Slot,save:SlotData)=>void;onPlus:(slot:Slot,save:SlotData)=>void;selected?:Slot}){
  const {l,t,language}=useWords();
  return <div className="pr-list pr-save-list">{SAVE_SLOTS.map(slot=>{
    const list=data[slot],save=list[0],hero=save?save.state.heroes[save.state.leader]:undefined;
    return <article key={slot} className={selected===slot?'pr-save-picked':''}>
      <div><b>{t('記録','Slot')} {slot}</b>{hero&&<span>{l(HEROES[hero.id].name)} · Lv. {hero.level}</span>}
        {save?<small>{l(REGIONS[Math.min(save.state.stage,6)].chapter)} · {Math.floor(save.state.elapsed/60)}m · {new Date(save.savedAt).toLocaleDateString(language==='ENGLISH'?'en-US':'ja-JP')}</small>:<small>{t('記録なし','Empty')}</small>}</div>
      <div className="pr-inline">
        {mode==='new'&&<button onClick={()=>onPick(slot)}>{save?t('選ぶ…','Select…'):t('ここに記録','Use slot')}</button>}
        {mode==='load'&&list.map(entry=><button key={entry.kind} onClick={()=>onLoad(slot,entry)}>{entry.kind==='auto'?t('自動記録','Autosave'):t('手動記録','Manual save')}</button>)}
        {mode==='load'&&save?.state.ending&&<button onClick={()=>onPlus(slot,save)}>{t('強くてニューゲーム…','New Game+…')}</button>}
      </div>
    </article>;
  })}</div>;
}
export function Journal({state,initial,apply,slot,onClose,onSave,onLesson,onReview,onExit}:{state:Adventure;initial:MenuTab;apply:Apply;slot:Slot;onClose:()=>void;onSave:()=>void;onLesson:()=>void;onReview:()=>void;onExit:()=>void}){
  const {t,l,language}=useWords();
  const [tab,setTab]=useState(initial),[hero,setHero]=useState(state.party[0]);
  const h=state.heroes[hero]??state.heroes[state.party[0]];
  const tabs=[
    ['party',Users,t('隊列','Party')],['job',Shield,t('ジョブ','Jobs')],['gear',Gem,t('装備','Gear')],['deck',Puzzle,t('デッキ','Deck')],
    ['relics',Sparkles,t('レリック','Relics')],['pack',Backpack,t('道具','Items')],['map',Map,t('地図','World map')],['quests',Flag,t('依頼','Quests')],
    ['index',BookOpen,t('図鑑','Codex')],['study',ScrollText,t('学習','Learning')],['save',Save,t('記録','Save')],['settings',Settings2,t('設定','Settings')],
  ] as const;
  const heroTab=['party','job','gear','deck','pack','relics'].includes(tab);
  return <Panel wide heading={t('旅の手帳','Traveler’s journal')} subtitle={`${state.gold} G · ${state.party.length}/4`} close={onClose}>
    <nav className="pr-tabs pr-journal-tabs" aria-label={t('手帳のページ','Journal pages')}>{tabs.map(([key,Icon,label])=><button aria-pressed={tab===key} key={key} onClick={()=>setTab(key)}><Icon size={15}/>{label}</button>)}</nav>
    {heroTab&&<label className="pr-select-label pr-member-select">{t('仲間','Companion')}<select value={h.id} onChange={e=>setHero(e.target.value)}>{Object.values(state.heroes).map(h=><option key={h.id} value={h.id}>{state.party.includes(h.id)?'◆ ':''}{l(HEROES[h.id].name)} · Lv. {h.level}</option>)}</select></label>}
    {tab==='party'&&<Party state={state} h={h} apply={apply}/>}
    {tab==='job'&&<JobMenu state={state} h={h} apply={apply}/>}
    {tab==='gear'&&<GearMenu state={state} h={h} apply={apply}/>}
    {tab==='deck'&&<DeckMenu key={h.id} state={state} h={h} apply={apply}/>}
    {tab==='relics'&&<RelicMenu state={state} h={h} apply={apply}/>}
    {tab==='pack'&&<Pack state={state} h={h} apply={apply}/>}
    {tab==='map'&&<WorldMap state={state}/>}
    {tab==='quests'&&<QuestList state={state}/>}
    {tab==='index'&&<Index state={state}/>}
    {tab==='study'&&<div className="pr-list"><article><span><b>{t('旅の中で答えた問題','Questions answered on the journey')}</b><small>{t('冒険の学習記録はこの記録枠に保存される。','Learning progress is saved in this adventure slot.')}</small></span><span>{state.learned.correct}/{state.learned.attempts}</span></article>
      <button onClick={onReview} disabled={!state.learned.missed.length}>{t('まちがえた問題を復習','Review missed questions')} <span>{state.learned.missed.length}</span></button>
      <button onClick={onLesson}>{t('学習範囲を設定','Choose learning units')}</button>
      {Object.entries(state.learned.units).map(([mode,counts])=><article key={mode}><b>{trans(mode,language)}</b><span>{counts.correct}/{counts.attempts}</span></article>)}
    </div>}
    {tab==='save'&&<div className="pr-list">
      <p>{t('自動記録とは別に手動で保存できる。タイトルから両方を読み込める。','Manual saves are separate from autosaves. Both can be loaded from the title.')}</p>
      <button className="pr-primary" onClick={onSave}>{t('手動で記録','Save manually')} · {t('記録','Slot')} {slot}</button>
      <p>{t('プレイ時間','Play time')} {Math.floor(state.elapsed/3600)}h {Math.floor(state.elapsed/60)%60}m</p>
      <button onClick={onExit}>{t('タイトルへ戻る','Return to title')}</button>
    </div>}
    {tab==='settings'&&<SettingsPanel state={state} apply={apply} onLesson={onLesson}/>}
  </Panel>;
}

export function ServicePanel({state,service,region,apply,close,onJournal,onStudy}:{state:Adventure;service:Service;region:number;apply:Apply;close:()=>void;onJournal:(tab:MenuTab)=>void;onStudy:()=>void}){
  const {t,l,i}=useWords();
  const [hero,setHero]=useState(state.party[0]);
  const h=state.heroes[hero];
  const shopCards=CARD_LIST.filter(c=>!c.id.includes(':')&&!['artifact','remnant','transfigure'].includes(c.id));
  const inn=service==='inn'||service==='tavern';
  return <Panel wide heading={l(SERVICES[service])} subtitle={`${state.gold} G · ${l(REGIONS[region].name)}`} close={close}>
    {inn&&<div className="pr-list"><p>{t('食事と休息をとると体力が全快し、ここが再開地点になる。','A meal and a rest restore everyone and set your checkpoint.')}</p><button className="pr-primary" onClick={()=>apply(s=>purchase(s,'inn','',region))}>{t('食事と休息','Eat and rest')}</button></div>}
    {service==='armory'&&<div className="pr-list">{GEAR_LIST.filter(g=>g.place===region||g.place===0).map(g=><button key={g.id} disabled={state.gold<g.price||state.gear.includes(g.id)} onClick={()=>apply(s=>purchase(s,'gear',g.id,region))}>
      <span><b>{l(g.name)}</b><small>{l(SLOTS[g.slot])} · {gearEffects(g,i)}</small></span><span>{state.gear.includes(g.id)?'✓':`${g.price} G`}</span></button>)}</div>}
    {service==='cards'&&<div className="pr-list">{shopCards.map(c=><button key={c.id} disabled={state.unlockedCards.includes(c.id)||state.gold<24+region*8} onClick={()=>apply(s=>purchase(s,'card',c.id,region))}>
      <b>{l(c.name)}</b><span>{state.unlockedCards.includes(c.id)?'✓':`${24+region*8} G`}</span></button>)}</div>}
    {service==='items'&&<div className="pr-list">{(Object.keys(ITEMS) as ItemId[]).map(id=><button key={id} disabled={state.gold<ITEMS[id].price} onClick={()=>apply(s=>purchase(s,'item',id,region))}>
      <span><b>{l(ITEMS[id].name)} ×{state.items[id]}</b><small>{l(ITEMS[id].desc)}</small></span><span>{ITEMS[id].price} G</span></button>)}
      {(Object.keys(RELICS) as RelicId[]).filter(id=>RELICS[id].place<=region).map(id=><button key={id} disabled={state.relics.includes(id)||state.gold<RELICS[id].price} onClick={()=>apply(s=>purchase(s,'relic',id,region))}>
        <span><b>{l(RELICS[id].name)}</b><small>{l(RELICS[id].description)}</small></span><span>{state.relics.includes(id)?'✓':`${RELICS[id].price} G`}</span></button>)}</div>}
    {service==='forge'&&<><label className="pr-select-label">{t('持ち主','Card owner')}<select value={hero} onChange={e=>setHero(e.target.value)}>{Object.keys(state.heroes).map(id=><option value={id} key={id}>{l(HEROES[id].name)}</option>)}</select></label>
      <DeckMenu key={h.id} state={state} h={h} apply={apply} forge/></>}
    {service==='library'&&<div className="pr-list"><p>{l(REGIONS[region].rumor)}</p><button onClick={()=>onJournal('index')}>{t('旅の蔵書を見る','Open the book collection')}</button><button onClick={onStudy}>{t('蔵書を読んで学ぶ','Study in the library')}</button></div>}
    {service==='guild'&&<div className="pr-list"><p>{t('自分に合った技を探そう。熟練度5で、転職後にも技を持ち越せる。奥の演習場で試してみよう。','Find a style that suits you. At mastery 5, a technique can carry over to other jobs. Try the training ground behind the guild.')}</p><button onClick={()=>onJournal('job')}>{t('ジョブと習得技','Jobs and techniques')}</button></div>}
    {service==='notice'&&<QuestList state={state}/>}
    {service==='home'&&<div className="pr-list"><p>{l(REGIONS[region].questDone)}</p><p>{t('戸棚の隅に光るものが見える。','Something glints beside the dresser.')}</p></div>}
  </Panel>;
}
