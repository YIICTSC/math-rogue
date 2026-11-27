import { useCallback, useEffect, useRef, useState, type PointerEvent } from 'react';
import { ArrowLeft, ArrowUp, ArrowRight, ArrowDown, BookOpen, Compass, Flag, Map, Backpack, ShipWheel, Footprints, ChevronRight, Move, Save, Swords, Shield } from 'lucide-react';
import { GameMode, type AnswerMode, type AssignmentAnswerResult, type AssignmentReviewProblem, type LanguageMode } from '../../types';
import type { MiniGameComponentProps } from '../../components/MiniGameRouter';
import { PAD, useGameplayGamepad } from '../../hooks/useGameplayGamepad';
import { audioService } from '../../services/audioService';
import { assetUrl } from '../../utils/assetPaths';
import { abyssHero } from '../../components/school-dungeon/dungeons2/roster';
import { isProtagonistId } from '../../components/school-dungeon/student/content';
import { studentSpriteUrl } from '../../components/school-dungeon/student/sprites';
import AdventureProblemSheet from '../shared/AdventureProblemSheet';
import { GROUPS, applyStudy, climate, completeBattle, currentLandmark, currentRegion, escape, interact, introScenes, maxHp, mount, newAdventure, recover, reviewEntry, step, type Adventure, type Change, type Encounter, type Scene, type Settings } from './adventure';
import { heroSelectionIllustration, illustration, type Animation } from './art';
import { createBattle, fighter, studyBonus, victory, type Battle } from './battle';
import { playTravelerBattleVoice } from './battleVoice';
import BattleScreen from './BattleScreen';
import { HEROES, HERO_LIST, JOBS, PASSIVES, type WorldOfOrigin } from './catalog';
import { REGIONS, TITLE, VEHICLES, type Copy, type Service } from './campaign';
import { guestSpriteUrl } from './guestArt';
import { Journal, Lessons, SaveSlots, ServicePanel, type MenuTab } from './Menus';
import type { PixelRpgTrack } from './music';
import { FieldCanvas, Language, Meter, Panel, useWords } from './presentation';
import { clearSlot, readSave, SAVE_SLOTS, writeSave, type Slot, type SlotData } from './save';
import TravelerPortrait from './TravelerPortrait';
import { WORLD_ID, area, headline, isAir, type Direction, type Landmark } from './world';
import './pixelRpg.css';

const DIRECTIONS = [
  ['up',ArrowUp,'上','Up'],['left',ArrowLeft,'左','Left'],['down',ArrowDown,'下','Down'],['right',ArrowRight,'右','Right'],
] as const;
const KEY_DIRECTIONS:Record<string,Direction>={ArrowUp:'up',ArrowDown:'down',ArrowLeft:'left',ArrowRight:'right',w:'up',a:'left',s:'down',d:'right'};
type StudyState = { mode:'battle'|'seal'|'review'|'library'; review?:AssignmentReviewProblem; landmark?:Landmark; actor?:string; nonce:number };
type Overlay =
  | {type:'journal';tab:MenuTab}
  | {type:'shop';service:Service;region:number}
  | {type:'dialog';scenes:Scene[];index:number;ending?:boolean}
  | {type:'study';data:StudyState}
  | {type:'lesson'}
  | {type:'travel'}
  | {type:'exit'};
type TitlePanel = 'hero'|'new'|'load'|'replace'|'help'|undefined;

function HeroChoiceArt({id}:{id:string}){
  const abyss=abyssHero(id);
  if(abyss)return <img src={assetUrl(abyss.portrait)} alt="" />;
  const guest=guestSpriteUrl(id);
  if(guest)return <span className="pr-hero-dungeon-sprite pr-hero-guest-sprite" aria-hidden="true" style={{backgroundImage:`url("${guest}")`}} />;
  if(isProtagonistId(id))return <span className="pr-hero-dungeon-sprite" aria-hidden="true" style={{backgroundImage:`url("${studentSpriteUrl(id)}")`}} />;
  return <img src={heroSelectionIllustration(id)} alt="" />;
}

function HeroChoice({selected,onSelect}:{selected:string;onSelect:(id:string)=>void}){
  const {t,l}=useWords(),[group,setGroup]=useState<WorldOfOrigin>(HEROES[selected].origin);
  const hero=HEROES[selected];
  return <div className="pr-hero-select">
    <div className="pr-hero-feature">
      <div><HeroChoiceArt id={hero.id} /></div>
      <section><span>{l(GROUPS[hero.origin])}</span><h3>{l(hero.name)}</h3><strong>{l(JOBS[hero.job].name)}</strong><p>{l(PASSIVES[hero.passive])}</p><p>{l(hero.voice)}</p></section>
    </div>
    <nav className="pr-tabs" aria-label={t('出身編','School worlds')}>{(Object.keys(GROUPS) as WorldOfOrigin[]).map(g=><button key={g} aria-pressed={group===g} onClick={()=>setGroup(g)}>{l(GROUPS[g])}</button>)}</nav>
    <div className="pr-hero-grid">{HERO_LIST.filter(h=>h.origin===group).map(h=><button key={h.id} aria-pressed={selected===h.id} onClick={()=>onSelect(h.id)}>
      <HeroChoiceArt id={h.id} /><span>{l(h.name)}</span></button>)}</div>
  </div>;
}
function FieldView({state,dash,setDash,move,hold,stop,activate,open,travel,message,covered}:{
  state:Adventure;dash:boolean;setDash:(value:boolean)=>void;move:(d:Direction)=>void;hold:(d:Direction)=>void;stop:()=>void;activate:()=>void;
  open:(tab:MenuTab)=>void;travel:()=>void;message?:Copy;covered:boolean;
}){
  const {l,t}=useWords(),a=area(state.map),region=REGIONS[currentRegion(state)],point=currentLandmark(state), time=state.minutes%1440;
  const objective=REGIONS[Math.min(state.stage,6)];
  const press=(e:PointerEvent<HTMLButtonElement>,direction:Direction)=>{
    if(e.button!==0)return;
    e.preventDefault();e.currentTarget.setPointerCapture(e.pointerId);hold(direction);
  };
  const coord=state.map===WORLD_ID?`${state.at.x}E · ${state.at.y}S`:`X ${state.at.x} · Y ${state.at.y}`;
  const labels=t('場所','Location');
  return <section className="pr-field" data-gamepad-live={covered?undefined:'pixel-rpg'} aria-label={t('フィールド','Field')} data-pr-map={state.map} data-pr-x={state.at.x} data-pr-y={state.at.y}>
    <FieldCanvas state={state} dash={dash}/>
    <header className="pr-field-head">
      <div className="pr-location" aria-label={labels}><span>{l(region.chapter)}</span><h1>{l(headline(a,state.at))}</h1>
        <small>{coord} <span>·</span> {String(Math.floor(time/60)).padStart(2,'0')}:{String(time%60).padStart(2,'0')}{state.vehicle!=='foot'&&` · ${l(VEHICLES[state.vehicle])}`}</small></div>
      <div className="pr-field-top-actions"><button aria-label={t('世界地図','World map')} onClick={()=>open('map')}><Map size={19}/></button>
        <button onClick={()=>open('party')}><BookOpen size={19}/><span>{t('手帳','Journal')}</span></button></div>
    </header>
    <div className="pr-objective"><Flag size={13}/><span>{state.stage>=7?t('忘却の裏庭を踏破 · 記憶の試練へ','Garden cleared · Try the Trial of Memory'):state.flags.includes(`book-${state.stage}`)?l(objective.sites[4].name):state.stage===0&&!state.flags.includes('met-0')?t('村の灯守に話しかける','Speak with the village Lamplighter'):l(objective.quest)}</span></div>
    <div className="pr-field-party">{state.party.map((id,index)=>{
      const h=state.heroes[id];
      return <button onClick={()=>open('party')} key={id} title={l(HEROES[id].name)} aria-label={l(HEROES[id].name)} className={index===0?'pr-leading':''}>
        <img src={illustration(id,h.job)} alt="" /><span><b>Lv. {h.level}</b><small>HP {h.hp}/{maxHp(h)}</small><Meter value={h.hp} max={maxHp(h)}/></span></button>;
    })}</div>
    {message&&<div className="pr-toast" role="status">{l(message)}</div>}
    <footer className="pr-field-controls">
      <div className="pr-dpad" aria-label={t('移動','Movement')}>
        <div className="pr-dpad-center"><Move size={17}/></div>
        {DIRECTIONS.map(([d,Icon,ja,en])=><button key={d} className={`pr-dir-${d}`} aria-label={t(ja,en)}
          onPointerDown={e=>press(e,d)} onPointerUp={stop} onPointerCancel={stop} onLostPointerCapture={stop}
          onClick={e=>{if(e.detail===0)move(d);}}><Icon size={21}/></button>)}
      </div>
      <div className="pr-field-action">
        {point&&<div className="pr-nearby" aria-live="polite"><Compass size={15}/>{l(point.label)}</div>}
        <button className="pr-primary pr-action-main" onClick={activate}><span>A</span>{t('調べる','Interact')}</button>
        <div>
          <button aria-label={t('所持品','Inventory')} onClick={()=>open('pack')}><Backpack size={17}/></button>
          {state.map===WORLD_ID&&state.licenses.length>1&&<button aria-label={t('乗り物','Vehicles')} onClick={travel}><ShipWheel size={17}/></button>}
          <button aria-label={t('ダッシュ','Dash')} aria-pressed={dash} onClick={()=>setDash(!dash)}><Footprints size={17}/></button>
        </div>
      </div>
    </footer>
  </section>;
}

function sceneMusic(state:Adventure|undefined,battle:Battle|undefined,overlay:Overlay|undefined,panel:TitlePanel):PixelRpgTrack{
  if(overlay?.type==='dialog'){
    if(overlay.ending)return 'pixel-rpg-ending';
    if(overlay.scenes[0]?.speaker[1].startsWith('Prologue'))return 'pixel-rpg-opening';
    if(overlay.scenes.some(s=>s.hero))return 'pixel-rpg-reunion';
    if(state?.stage===5)return 'pixel-rpg-sorrow';
    return 'pixel-rpg-main';
  }
  if(battle){
    if(battle.outcome==='win')return 'pixel-rpg-victory';
    if(battle.outcome==='loss')return 'pixel-rpg-sorrow';
    if(battle.encounter.boss)return battle.encounter.region>=5?'pixel-rpg-final':'pixel-rpg-boss';
    return battle.encounter.variant===3||battle.encounter.hidden?'pixel-rpg-strong':'pixel-rpg-battle';
  }
  if(!state)return panel==='hero'?'pixel-rpg-main':'pixel-rpg-title';
  if(overlay?.type==='journal'&&overlay.tab==='job'||overlay?.type==='shop'&&overlay.service==='guild')return 'pixel-rpg-job';
  if(overlay?.type==='study'&&overlay.data.mode==='seal')return 'pixel-rpg-treasure';
  if(state.vehicle==='submarine')return 'pixel-rpg-underwater';
  if(isAir(state.vehicle))return 'pixel-rpg-airship';
  if(state.vehicle!=='foot')return 'pixel-rpg-sea';
  const a=area(state.map);
  if(a.region===6||state.map===WORLD_ID&&currentRegion(state)===6)return 'pixel-rpg-post';
  if(a.place==='world')return 'pixel-rpg-world';
  if(a.place==='dungeon')return a.climate==='tide'?'pixel-rpg-underwater':a.climate==='sky'?'pixel-rpg-sky':'pixel-rpg-cave';
  if(a.place==='wild')return a.climate==='sky'?'pixel-rpg-sky':'pixel-rpg-forest';
  if(a.climate==='machine')return state.map.includes('/library')?'pixel-rpg-castle':'pixel-rpg-city';
  if(a.climate==='crystal')return 'pixel-rpg-academy';
  if(a.climate==='tide')return 'pixel-rpg-sea';
  if(a.climate==='sky')return 'pixel-rpg-sky';
  return 'pixel-rpg-village';
}

function defaultModes(props:MiniGameComponentProps):string[]{
  return props.problemModePool?.length?[...props.problemModePool]:[props.problemMode??GameMode.ADDITION];
}
const savedAnswer = (mode?:AnswerMode):Settings['answer'] => mode==='WRITING'?'writing':mode==='INPUT'?'typing':'choice';
const answerMode = (mode:Settings['answer']):AnswerMode => mode==='writing'?'WRITING':mode==='typing'?'INPUT':'CHOICE';
const titleAsset='sprites/pixel-rpg/title.webp';
const slotList=()=>Object.fromEntries(SAVE_SLOTS.map(s=>[s,readSave(s)])) as Record<Slot,SlotData[]>;
function PixelRpgRun(props:MiniGameComponentProps & {setLanguage:(language:LanguageMode|undefined)=>void}){
  const {onBack,setLanguage}=props;
  const {t,l,language}=useWords();
  const [state,setState]=useState<Adventure>(),stateRef=useRef<Adventure|undefined>(undefined);
  const [title,setTitle]=useState<TitlePanel>(),[selected,setSelected]=useState<string>(HERO_LIST[0].id);
  const [saves,setSaves]=useState(slotList),[slot,setSlot]=useState<Slot>(1),slotRef=useRef<Slot>(1);
  const [carry,setCarry]=useState<Adventure>();
  const [battle,setBattle]=useState<Battle>(),battleRef=useRef<Battle|undefined>(undefined);
  const [actor,setActor]=useState('');
  const [overlay,setOverlay]=useState<Overlay>(),overlayRef=useRef<Overlay|undefined>(undefined);
  const [returnOverlay,setReturnOverlay]=useState<Overlay>();
  const [animation,setAnimation]=useState<Animation>(),fxTimer=useRef(0),animationUntil=useRef(0);
  const [message,setMessage]=useState<Copy>(),messageTimer=useRef(0);
  const [dash,setDash]=useState(false),[pressedShift,setPressedShift]=useState(false);
  const [storageError,setStorageError]=useState(false);
  const startAt=useRef(0), saveAt=useRef(0);
  const fieldInput=useRef<{key?:Direction;touch?:Direction;pad?:Direction;next:number;shift:boolean}>({next:0,shift:false});
  const questionCount=useRef(0);
  const answered=useRef(0);
  const track=sceneMusic(state,battle,overlay,title);
  const trackRef=useRef(track);trackRef.current=track;
  const audioScope=useRef<ReturnType<typeof audioService.acquireBgmScene>|undefined>(undefined);

  const present=(value:Overlay|undefined)=>{overlayRef.current=value;setOverlay(value);fieldInput.current.key=undefined;fieldInput.current.touch=undefined;};
  const changeState=(s:Adventure)=>{stateRef.current=s;setState(s);};
  const changeBattle=(b:Battle|undefined)=>{
    battleRef.current=b;setBattle(b);
  };
  const tell=(value:Copy)=>{
    setMessage(value);
    window.clearTimeout(messageTimer.current);
    messageTimer.current=window.setTimeout(()=>setMessage(undefined),3600);
  };
  const snapshot=():Adventure|undefined=>{
    const s=stateRef.current;if(!s)return;
    const elapsed=s.elapsed+Math.max(0,Math.floor((performance.now()-startAt.current)/1000));
    return {...s,elapsed};
  };
  const save=useCallback((kind:'auto'|'manual',report=false)=>{
    const s=snapshot();
    if(!s)return;
    const ok=writeSave(slotRef.current,s,kind);
    if(ok)saveAt.current=performance.now();
    setStorageError(!ok);
    if(report)tell(ok?['手動で記録した。','Manual save written.']:['この端末に記録できません。','This device could not write the save.']);
    return ok;
  },[]);
  const begin=(s:Adventure,slot:Slot,opening:boolean)=>{
    changeBattle(undefined);setActor(s.party[0]);setAnimation(undefined);animationUntil.current=0;
    startAt.current=performance.now();saveAt.current=0;slotRef.current=slot;setSlot(slot);
    setTitle(undefined);setMessage(undefined);setCarry(undefined);setReturnOverlay(undefined);setLanguage(s.settings.language);
    changeState(s);save('auto');
    present(opening?{type:'dialog',scenes:introScenes(),index:0}:undefined);
  };
  const openTitle=()=>{
    save('auto');
    stateRef.current=undefined;setState(undefined);
    setLanguage(undefined);
    setSaves(slotList());setTitle(undefined);setAnimation(undefined);changeBattle(undefined);present(undefined);setReturnOverlay(undefined);
  };
  const beginBattle=(s:Adventure,encounter:Encounter)=>{
    setAnimation(undefined);window.clearTimeout(fxTimer.current);animationUntil.current=0;
    present(undefined);setReturnOverlay(undefined);
    const fight=createBattle(s,encounter);
    changeBattle(fight);setActor(fight.party[0].id);
    if(!s.flags.includes('battle-tutorial')){
      changeState({...s,flags:[...s.flags,'battle-tutorial']});
      present({type:'dialog',index:0,scenes:[
        {speaker:['戦闘の手引き','Field manual'],line:['赤いカーソルの敵が攻撃対象。敵をタップして照準を変え、手札を一度タップすれば技が出る。防御は自分にかかる。','The red cursor marks your target. Tap an enemy to aim, then tap a card once to play it. Guard cards protect their user.']},
        {speaker:['戦闘の手引き','Field manual'],line:['敵の予兆と狙い先を見てから、全員が動き終わったらターン終了。ひらめきは、答えられそうなときに使っていい。','Read enemy intents and targets. End the turn when everyone is ready. Use Study when you want an optional boost.']},
      ]});
    }
    audioService.playSound(encounter.boss?'buff':'select');
  };
  const ask=(mode:StudyState['mode'],landmark?:Landmark,heroId?:string)=>{
    const s=stateRef.current;if(!s)return;
    const nonce=++questionCount.current;
    answered.current=0;
    if(mode==='review'||mode==='library')setReturnOverlay(overlayRef.current);
    const missed=mode==='review'?s.learned.missed[0]:undefined;
    present({type:'study',data:{mode,landmark,actor:heroId,nonce,review:missed?reviewEntry(missed):undefined}});
  };
  const apply = (op:(s:Adventure)=>Change) => {
    const s=stateRef.current;if(!s)return;
    const change=op(s);
    if(change.state!==s){
      changeState(change.state);
      if(change.state.settings.language!==s.settings.language)setLanguage(change.state.settings.language);
    }
    if(change.message)tell(change.message);
    if(change.sound)audioService.playSound(change.sound);
    const effect=change.effect;
    if(!effect)return;
    if(effect.type==='battle'){beginBattle(change.state,effect.encounter);return;}
    if(effect.type==='study'){void ask('seal',effect.landmark);return;}
    if(effect.type==='dialog'||effect.type==='ending'){
      present({type:'dialog',index:0,scenes:effect.scenes,ending:effect.type==='ending'});save('auto');return;
    }
    present({type:'shop',service:effect.service,region:effect.region});
  };
  const updateCombat=(op:(b:Battle)=>Battle,voiceId?:string)=>{
    const b=battleRef.current,s=stateRef.current;
    if(!b||!s||performance.now()<animationUntil.current)return;
    const next=op(b);
    if(next===b)return;
    const before=b.enemies.filter(enemy=>enemy.hp>0);
    const defeated=before.filter(enemy=>next.enemies.find(after=>after.id===enemy.id)?.hp===0);
    const newEnemies=next.enemies.filter(enemy=>enemy.hp>0&&!before.some(old=>old.id===enemy.id));
    const duration=s.settings.rateFx==='instant'?0:s.settings.rateFx==='quick'?(defeated.length?290:176)
      :defeated.some(enemy=>enemy.spec.boss)?880:next.comboActors?.length?730:defeated.length?580:390;
    const settle=()=>{
      setAnimation(undefined);
      if(next.outcome==='win')audioService.playSound('win');
      if(next.outcome==='loss')audioService.playSound('lose');
    };
    window.clearTimeout(fxTimer.current);
    const at=performance.now(),animated=duration>0&&(next.pulses.length>0||defeated.length>0);
    animationUntil.current=animated?at+duration:0;
    if(animated){
      setAnimation({pulses:next.pulses,at,actors:next.comboActors??[],duration,cue:next.cue,
        defeated:defeated.map(enemy=>enemy.id),enemyOrder:[...before,...newEnemies].map(enemy=>enemy.id)});
      fxTimer.current=window.setTimeout(settle,duration);
    }else settle();
    changeBattle(next);
    const art=next.pulses[0]?.art;
    if(!next.outcome||animated){
      audioService.playSound(defeated.length&&animated||next.cue?.kind==='finale'||next.cue?.kind==='link'||art==='phase'||art==='summon'?'finisher_explosion':
        art==='hit'?'damage':art==='block'?'block':art==='heal'?'buff':!art||art==='gesture'?'select':'attack');
    }
    const speaking=next.cue?.actor??voiceId;
    if(speaking&&(next.cue||art==='heal')){
      void playTravelerBattleVoice(speaking,next.cue?.kind==='finale'?'ultimate':next.outcome==='win'?'win':
        art==='heal'?'heal':next.cue?.kind==='card'&&next.cue.parts.some(part=>part.skill.damage)?'attack':'skill');
    }else{
      const injured=next.party.find(member=>member.hp===0&&b.party.some(old=>old.id===member.id&&old.hp>0))
        ??next.party.find(member=>next.pulses.some(p=>p.to===member.id&&(p.value??0)>0&&(p.art==='hit'||p.art==='status')));
      if(injured)void playTravelerBattleVoice(injured.id,injured.hp>0?'damage':'defeat');
    }
  };
  const acknowledge=()=>{
    const b=battleRef.current,s=stateRef.current;
    if(!s||!b?.outcome)return;
    changeBattle(undefined);setAnimation(undefined);animationUntil.current=0;window.clearTimeout(fxTimer.current);
    if(b.outcome==='win')apply(st=>completeBattle({...st,items:b.items,rng:b.rng},b.encounter,victory(b)));
    else if(b.outcome==='loss')apply(st=>({state:recover({...st,items:b.items,rng:b.rng})}));
    else apply(st=>({state:escape({...st,items:b.items,rng:b.rng,heroes:Object.fromEntries(Object.entries(st.heroes).map(([id,h])=>[id,{...h,hp:Math.max(1,b.party.find(p=>p.id===id)?.hp??h.hp)}]))})}));
    save('auto');
  };
  const moving=useRef<(direction:Direction)=>void>(()=>undefined);
  const actionRef=useRef<()=>void>(()=>undefined);
  const openRef=useRef<(tab:MenuTab)=>void>(()=>undefined);
  const dashRef=useRef(false);dashRef.current=dash||pressedShift;
  moving.current=(direction:Direction)=>{
    if(!stateRef.current||battleRef.current||overlayRef.current)return;
    const s=stateRef.current;
    apply(st=>step(st,direction,dashRef.current||fieldInput.current.shift));
    if(stateRef.current?.map!==s.map)save('auto');
  };
  actionRef.current=()=>{
    if(battleRef.current||overlayRef.current)return;
    apply(s=>interact(s));
    if(!battleRef.current)save('auto');
  };
  openRef.current=(tab:MenuTab)=>present({type:'journal',tab});
  const hold=(direction:Direction)=>{
    fieldInput.current.touch=direction;
    fieldInput.current.next=performance.now()+145;
    moving.current(direction);
  };
  const stop=()=>{fieldInput.current.touch=undefined;};
  useGameplayGamepad('pixel-rpg',pad=>{
    const input=fieldInput.current;
    input.pad=pad.active&&(Math.abs(pad.x)>.37||Math.abs(pad.y)>.37)?
      Math.abs(pad.x)>Math.abs(pad.y)?(pad.x<0?'left':'right'):(pad.y<0?'up':'down'):undefined;
    input.shift=pad.active&&!!(pad.buttons[PAD.LB]||pad.buttons[PAD.RB]);
    if(pad.pressed[PAD.A])actionRef.current();
    if(pad.pressed[PAD.B]||pad.pressed[PAD.Y])openRef.current('party');
    if(pad.pressed[PAD.X])openRef.current('map');
  });
  useEffect(()=>{
    let frame=0;
    const tick=(at:number)=>{
      frame=requestAnimationFrame(tick);
      const input=fieldInput.current;
      const direction=input.touch??input.key??input.pad;
      if(direction&&at>=input.next){
        input.next=at+(dashRef.current||input.shift?84:127);
        moving.current(direction);
      }
    };
    const keydown=(e:KeyboardEvent)=>{
      if(!stateRef.current||battleRef.current||overlayRef.current||e.altKey||e.ctrlKey||e.metaKey||e.target instanceof HTMLInputElement||e.target instanceof HTMLSelectElement)return;
      const direction=KEY_DIRECTIONS[e.key]??KEY_DIRECTIONS[e.key.toLowerCase()];
      if(direction){
        e.preventDefault();
        if(!e.repeat){
          const input=fieldInput.current;input.key=direction;input.next=performance.now()+137;moving.current(direction);
        }return;
      }
      if(e.key==='Shift'){setPressedShift(true);return;}
      if(e.repeat)return;
      if(([' ','Enter'].includes(e.key)&&!(e.target instanceof HTMLButtonElement))||e.key.toLowerCase()==='z'){e.preventDefault();actionRef.current();}
      if(['Escape','m','x'].includes(e.key.toLowerCase())||e.key==='Escape'){e.preventDefault();openRef.current(e.key.toLowerCase()==='m'?'map':'party');}
    };
    const keyup=(e:KeyboardEvent)=>{
      if(e.key==='Shift')setPressedShift(false);
      if(KEY_DIRECTIONS[e.key]===fieldInput.current.key||KEY_DIRECTIONS[e.key.toLowerCase()]===fieldInput.current.key)fieldInput.current.key=undefined;
    };
    const clear=()=>{fieldInput.current={next:0,shift:false};setPressedShift(false);};
    frame=requestAnimationFrame(tick);
    window.addEventListener('keydown',keydown);window.addEventListener('keyup',keyup);window.addEventListener('blur',clear);
    return()=>{cancelAnimationFrame(frame);window.removeEventListener('keydown',keydown);window.removeEventListener('keyup',keyup);window.removeEventListener('blur',clear);};
  },[]);
  useEffect(()=>{
    audioScope.current=audioService.acquireBgmScene(trackRef.current,{},24);
    return()=>{audioScope.current?.();audioScope.current=undefined;};
  },[]);
  useEffect(()=>{audioScope.current?.update(track,{});},[track]);
  useEffect(()=>{
    const auto=window.setInterval(()=>{if(stateRef.current&&!battleRef.current&&performance.now()-saveAt.current>9500)save('auto');},10000);
    const background=()=>{if(!battleRef.current)save('auto');};
    const onVisibility=()=>{if(document.hidden)background();};
    window.addEventListener('pagehide',background);document.addEventListener('visibilitychange',onVisibility);
    return()=>{window.clearInterval(auto);window.clearTimeout(messageTimer.current);window.clearTimeout(fxTimer.current);window.removeEventListener('pagehide',background);document.removeEventListener('visibilitychange',onVisibility);};
  },[save]);
  const canStart=(item:Slot)=>{setSlot(item);if(saves[item].length)setTitle('replace');else start(item);};
  const start=(item:Slot)=>{
    const seed=(Math.random()*2**32)>>>0;
    const next=newAdventure(selected,seed,{modes:defaultModes(props),answer:savedAnswer(props.answerMode)},carry);
    if(saves[item].length&&!writeSave(item,next,'auto')){setStorageError(true);return;}
    if(saves[item].length)clearSlot(item,undefined,'manual');
    begin(next,item,true);
  };
  const openNew=(plus?:Adventure)=>{setCarry(plus);if(plus)setSelected(HEROES[plus.leader].id);setTitle('hero');setSaves(slotList());};
  const titlePanel=(value:TitlePanel)=>{setTitle(value);setSaves(slotList());};
  const closeOverlay=()=>{
    if(overlay?.type==='study'||overlay?.type==='lesson'){
      present(returnOverlay);setReturnOverlay(undefined);
    }else present(undefined);
  };
  const journal=(tab:MenuTab)=>present({type:'journal',tab});
  const lesson=()=>{setReturnOverlay(overlayRef.current);present({type:'lesson'});};
  const readQuestion=(result:AssignmentAnswerResult,data:StudyState)=>{
    if(answered.current===data.nonce)return;
    answered.current=data.nonce;
    props.onAnswerResult?.(result);
    const active=overlayRef.current;
    if(active?.type!=='study'||active.data.nonce!==data.nonce)return;
    if(result.question&&result.correctAnswer){
      const entry:AssignmentReviewProblem={mode:result.mode,problemId:result.problemId,
        problemKey:result.problemKey??`${result.mode}:${result.question}`,question:result.question,correctAnswer:result.correctAnswer};
      apply(s=>applyStudy(s,entry,result.correct,data.landmark));
    }
    if(data.mode==='battle'&&data.actor)updateCombat(b=>studyBonus(b,data.actor!,result.correct));
  };
  const nextScene=()=>{
    const ui=overlayRef.current;
    if(ui?.type!=='dialog')return;
    if(ui.index+1<ui.scenes.length){present({...ui,index:ui.index+1});audioService.playSound('select');}
    else{present(undefined);if(!battleRef.current)save('auto');}
  };

  return <main className="pixel-rpg" lang={language==='ENGLISH'?'en':'ja'} data-gamepad-navigation-root data-adventure-screen
    data-allow-japanese={language!=='ENGLISH'&&props.languageMode==='ENGLISH'?true:undefined} data-pr-theme={state?climate(state):'meadow'} data-pr-playing={!!state}>
    {!state&&<section className="pr-title" aria-label={l(TITLE)}>
      <img className="pr-title-art" src={`${import.meta.env.BASE_URL}${titleAsset}`} alt="" fetchPriority="high" onError={event=>{
        const image=event.currentTarget, fallback=assetUrl(titleAsset);
        if(image.getAttribute('src')!==fallback)image.src=fallback;
      }}/>
      <button className="pr-title-back" data-gamepad-back onClick={onBack}><ArrowLeft size={18}/> {t('ゲーム一覧','Games')}</button>
      <section className="pr-title-copy">
        <div className="pr-title-brand"><Compass size={23}/><span>{t('学習ローグ','Learning Rogue')}</span></div>
        <h1>{l(TITLE)}</h1>
        <p>{t('地図にない世界へ。四人の仲間と、失われた記憶をたどる。','Set out beyond the map with four travelers and follow the trail of lost memories.')}</p>
        <nav aria-label={t('タイトルメニュー','Title menu')}>
          <button className="pr-primary" data-gamepad-initial-choice onClick={()=>openNew()}><Compass size={17}/>{t('新しく冒険する','New adventure')}<ChevronRight size={16}/></button>
          <button disabled={!SAVE_SLOTS.some(key=>saves[key].length)} onClick={()=>titlePanel('load')}><Save size={16}/>{t('旅を続ける','Continue')}</button>
          <button className="pr-title-help" onClick={()=>titlePanel('help')}><BookOpen size={16}/>{t('遊び方','How to play')}</button>
        </nav>
      </section>
      {title&&<Panel wide={title==='hero'||title==='load'} close={()=>setTitle(undefined)} heading={
        title==='hero'?t('旅人を選ぶ','Choose your traveler'):title==='load'?t('旅の記録','Saved adventures'):
        title==='new'?t('記録する場所を選ぶ','Choose a save slot'):title==='replace'?t('記録を上書きする','Replace this save?'):t('冒険の手引き','Adventure guide')}>
        {title==='hero'&&<><HeroChoice selected={selected} onSelect={setSelected}/><footer className="pr-sticky"><button className="pr-primary" onClick={()=>setTitle('new')}>{t('この旅人で進む','Continue with this traveler')} <ChevronRight size={16}/></button></footer></>}
        {title==='new'&&<SaveSlots mode="new" data={saves} onPick={canStart} onLoad={beginLoad} onPlus={(_,save)=>openNew(save.state)}/>}
        {title==='load'&&<SaveSlots mode="load" data={saves} onPick={canStart} onLoad={beginLoad} onPlus={(_,save)=>openNew(save.state)}/>}
        {title==='replace'&&<div className="pr-list"><p>{t('この枠の手動記録と自動記録を置き換えます。','The manual and automatic saves in this slot will be replaced.')}</p>
          <button className="pr-primary" onClick={()=>start(slot)}>{t('上書きして出発する','Replace and depart')}</button>
          <button onClick={()=>setTitle('new')}>{t('別の記録枠を選ぶ','Choose a different slot')}</button></div>}
        {title==='help'&&<div className="pr-list">
          <article><Footprints size={19}/><span><b>{t('探索','Explore')}</b><small>{t('十字キー、矢印、WASDで移動。調べるはA、Z、Space。町や洞窟の入口を調べて入る。','Move with arrows, WASD or the D-pad. Use A, Z or Space to inspect entrances, people and objects.')}</small></span></article>
          <article><Swords size={19}/><span><b>{t('カード戦闘','Card battles')}</b><small>{t('手札を選び、次に対象を決める。好きな順番で仲間を動かせる。','Choose a card, then a target. Command allies in any order.')}</small></span></article>
          <article><Shield size={19}/><span><b>{t('育成と学び','Training and study')}</b><small>{t('転職、装備、デッキ編集を組み合わせる。ひらめきの学習問題は、答えたいときに取り組める。','Customize jobs, gear and decks. Study questions are available whenever you want an optional boost.')}</small></span></article>
        </div>}
      </Panel>}
    </section>}
    {state&&(battle
      ? <BattleScreen battle={battle} actor={actor} setActor={setActor} onCommand={updateCombat} onStudy={()=>void ask('battle',undefined,fighter(battle,actor)?.id??battle.party.find(x=>x.hp>0)?.id)} onOutcome={acknowledge}
          animation={animation} settings={state.settings} covered={!!overlay}/>
      : <FieldView state={state} dash={dash||pressedShift} setDash={setDash} move={d=>moving.current(d)} hold={hold} stop={stop} activate={()=>actionRef.current()} open={journal}
          travel={()=>present({type:'travel'})} message={overlay?undefined:message} covered={!!overlay}/>)}
    {state&&overlay?.type==='journal'&&<Journal key={overlay.tab} state={snapshot()??state} initial={overlay.tab} apply={apply} slot={slot} onClose={closeOverlay} onSave={()=>save('manual',true)} onLesson={lesson} onReview={()=>void ask('review')} onExit={()=>present({type:'exit'})}/>}
    {state&&overlay?.type==='shop'&&<ServicePanel state={state} service={overlay.service} region={overlay.region} apply={apply} close={closeOverlay} onJournal={journal} onStudy={()=>void ask('library')}/>}
    {state&&overlay?.type==='lesson'&&<Lessons close={closeOverlay} onSelect={(mode,pool,answer)=>{
      const modes=[...new Set(pool?.length?pool:[mode])];
      apply(s=>({state:{...s,settings:{...s.settings,modes,answer:answer?savedAnswer(answer):s.settings.answer}}}));
      closeOverlay();save('auto');
    }}/>}
    {state&&overlay?.type==='travel'&&<Panel heading={t('乗り物','Vehicles')} close={closeOverlay}>
      <div className="pr-list"><p>{t('船は水辺、飛空艇は空から操作する。陸の上で降りられる。','Board boats at the shore. Fly airships across the chart. Disembark over land.')}</p>
        {state.licenses.map(key=><button key={key} disabled={state.vehicle===key} onClick={()=>{apply(s=>mount(s,key));present(undefined);save('auto');}}>{l(VEHICLES[key])}{state.vehicle===key&&<span>✓</span>}</button>)}</div>
    </Panel>}
    {state&&overlay?.type==='dialog'&&(()=>{
      const scene=overlay.scenes[overlay.index],portrait=scene.portrait??scene.hero;
      return <Panel wide heading={l(scene.speaker)} subtitle={`${overlay.index+1} / ${overlay.scenes.length}`} close={closeOverlay}>
        <div className={`pr-story ${overlay.ending?'pr-story-ending':''}`}>
          {portrait&&<div className="pr-dialog-portrait"><TravelerPortrait id={portrait} name={l(scene.speaker)} reaction={scene.hero?'joy':'neutral'} /></div>}
          <p>{l(scene.line)}</p>
        </div>
        <footer className="pr-sticky"><button className="pr-primary" onClick={nextScene}>{overlay.index+1===overlay.scenes.length?t('冒険に戻る','Return to adventure'):t('次へ','Next')} <ChevronRight size={16}/></button></footer>
      </Panel>;
    })()}
    {state&&overlay?.type==='study'&&<AdventureProblemSheet key={overlay.data.nonce}
      heading={overlay.data.landmark?l(overlay.data.landmark.label):t('知識のひらめき','Insight')} onClose={closeOverlay}
      mode={(state.settings.modes[0]??props.problemMode) as GameMode} modePool={state.settings.modes.length>1?state.settings.modes:undefined}
      assignment={props.assignment} answerMode={answerMode(state.settings.answer)} languageMode={language} isChallenge
      problemOffset={overlay.data.nonce-1} reviewProblem={overlay.data.review}
      onAnswerResult={result=>readQuestion(result,overlay.data)} onComplete={()=>{
        const active=overlayRef.current;
        if(active?.type==='study'&&active.data.nonce===overlay.data.nonce)closeOverlay();
      }}
      rewardHint={overlay.data.mode==='battle'?t('正解でエナジーとドローを追加。次の攻撃と連携を強化する。','A correct answer adds energy and a card, and strengthens your next attack and Link.'):overlay.data.mode==='seal'?t('正解すると、封印の奥に残された品を獲得。','Solve the seal to earn the hidden cache.'):t('旅の学習記録に保存される。','Your answer is saved to the travel journal.')}/>}
    {state&&overlay?.type==='exit'&&<Panel heading={t('タイトルへ戻る','Return to title')} close={closeOverlay}><div className="pr-list">
      <p>{t('今の冒険を自動記録して戻ります。','Your adventure will be autosaved before returning.')}</p><button className="pr-primary" onClick={openTitle}>{t('記録して戻る','Save and return')}</button></div></Panel>}
    {state&&overlay&&message&&<div className="pr-toast pr-toast-modal" role="status">{l(message)}</div>}
    {storageError&&<div className="pr-storage-error" role="alert">{t('この端末では冒険を記録できません。','This device could not save the adventure.')}</div>}
  </main>;
  function beginLoad(chosen:Slot,entry:SlotData){
    const s=entry.state;
    begin({...s,settings:{...s.settings,modes:defaultModes(props),answer:props.answerMode?savedAnswer(props.answerMode):s.settings.answer}},chosen,false);
  }
}

export default function PixelRpg(props:MiniGameComponentProps){
  const [override,setOverride]=useState<LanguageMode>();
  return <Language.Provider value={override??props.languageMode??'JAPANESE'}><PixelRpgRun {...props} setLanguage={setOverride}/></Language.Provider>;
}
